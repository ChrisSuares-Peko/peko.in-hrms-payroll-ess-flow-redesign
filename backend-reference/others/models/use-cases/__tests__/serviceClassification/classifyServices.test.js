const sequelizeConfig = require("../../../../configs/database/index");
const setting = require("../../../entities/setting");
const { findUnknownAccessKeys, listUnclassifiedActiveOperators, getServicesTypeConfig } = require("../../accountingServices");
const { grandfatherLiveTrees } = require("../../serviceApprovals");
const { listTrees, findLiveTrees } = require("../../serviceApprovalTree");
const { dropDashboardCache } = require("../../accountingPeriod");
const { classifyServices, listClassificationOptions } = require("../../serviceClassification");

jest.mock("../../../entities/setting", () => ({ findOne: jest.fn(), create: jest.fn() }));
jest.mock("../../../entities/serviceOperator", () => ({ findAll: jest.fn(), findOne: jest.fn(), findAndCountAll: jest.fn() }));
jest.mock("../../../entities/vendor", () => ({}));
jest.mock("../../setting", () => ({ getASetting: jest.fn(), upsertSetting: jest.fn() }));
jest.mock("../../../../utils/sortHandle", () => ({ handleSortFields: jest.fn() }));
jest.mock("../../accountingServices", () => {
    const actual = jest.requireActual("../../accountingServices");
    return {
        ...actual,
        findUnknownAccessKeys: jest.fn(),
        getServicesTypeConfig: jest.fn(),
        listOperatorsForClassification: jest.fn(),
        listUnclassifiedActiveOperators: jest.fn(),
    };
});
jest.mock("../../serviceApprovalTree", () => ({ listTrees: jest.fn(), findLiveTrees: jest.fn() }));
jest.mock("../../serviceApprovals", () => ({ grandfatherLiveTrees: jest.fn() }));
jest.mock("../../accountingPeriod", () => ({ dropDashboardCache: jest.fn() }));

const ACTOR = { id: 42, name: "Ibrahim" };
const LIVE = { autoApproved: [{ partnerPermissionId: 1, partnerName: null }], skipped: [] };

let transaction;
let row;

const storedConfig = (withPlans, withoutPlans) => {
    row = { details: { service_with_plans: withPlans, service_without_plans: withoutPlans }, save: jest.fn() };
    setting.findOne.mockResolvedValue(row);
};

beforeEach(() => {
    jest.clearAllMocks();
    transaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelizeConfig.transaction.mockResolvedValue(transaction);
    storedConfig(["esim_tunz"], ["visa"]);
    findUnknownAccessKeys.mockResolvedValue([]);
    grandfatherLiveTrees.mockResolvedValue(LIVE);
});

describe("classifyServices", () => {
    it("classifies several services in one save and approves the live partners of each new one", async () => {
        const result = await classifyServices({ accessKeys: ["soundbox", "forex_desk", "soundbox"], planType: "with_plans", actor: ACTOR });

        expect(findUnknownAccessKeys).toHaveBeenCalledWith(["soundbox", "forex_desk"]);
        expect(row.details).toEqual({ service_with_plans: ["esim_tunz", "soundbox", "forex_desk"], service_without_plans: ["visa"], peko_service_subscriptions: [], peko_subscription_vendors: [] });
        expect(row.save).toHaveBeenCalledTimes(1);
        expect(transaction.commit).toHaveBeenCalledTimes(1);
        expect(grandfatherLiveTrees).toHaveBeenCalledTimes(2);
        expect(grandfatherLiveTrees).toHaveBeenCalledWith({ accessKey: "soundbox", actor: ACTOR });
        expect(result.results).toEqual([
            { accessKey: "soundbox", planType: "with_plans", previousPlanType: null, changed: true, ...LIVE },
            { accessKey: "forex_desk", planType: "with_plans", previousPlanType: null, changed: true, ...LIVE },
        ]);
        expect(result.config).toEqual(row.details);
        expect(dropDashboardCache).toHaveBeenCalledTimes(1);
    });

    it("lists several services as Peko's own in one save, approving nothing", async () => {
        const result = await classifyServices({ accessKeys: ["ecommerce_store", "whatsapp"], planType: "peko_subscription", actor: ACTOR });

        expect(row.details).toEqual({
            service_with_plans: ["esim_tunz"],
            service_without_plans: ["visa"],
            peko_service_subscriptions: ["ecommerce_store", "whatsapp"],
            peko_subscription_vendors: [],
        });
        expect(grandfatherLiveTrees).not.toHaveBeenCalled();
        expect(result.results.map(entry => entry.autoApproved)).toEqual([[], []]);
    });

    it("moves a service from the other list without approving anything again", async () => {
        const result = await classifyServices({ accessKeys: ["visa"], planType: "with_plans", actor: ACTOR });

        expect(row.details).toEqual({ service_with_plans: ["esim_tunz", "visa"], service_without_plans: [], peko_service_subscriptions: [], peko_subscription_vendors: [] });
        expect(grandfatherLiveTrees).not.toHaveBeenCalled();
        expect(result.results).toEqual([
            { accessKey: "visa", planType: "with_plans", previousPlanType: "without_plans", changed: true, autoApproved: [], skipped: [] },
        ]);
    });

    it("changes nothing when every service is already in that list", async () => {
        const result = await classifyServices({ accessKeys: ["esim_tunz"], planType: "with_plans", actor: ACTOR });

        expect(row.save).not.toHaveBeenCalled();
        expect(dropDashboardCache).not.toHaveBeenCalled();
        expect(result.results[0]).toMatchObject({ accessKey: "esim_tunz", changed: false, previousPlanType: "with_plans" });
    });

    it("refuses unknown services before touching the setting", async () => {
        findUnknownAccessKeys.mockResolvedValue(["ghost"]);

        expect(await classifyServices({ accessKeys: ["ghost", "visa"], planType: "with_plans", actor: ACTOR })).toEqual({
            code: "UNKNOWN",
            keys: ["ghost"],
        });
        expect(setting.findOne).not.toHaveBeenCalled();
    });
});

describe("listClassificationOptions", () => {
    const tree = (id, partnerName, accessKey, hasAccess = true) => ({
        id,
        partnerName,
        treeStatus: true,
        nodes: [{ accessKey, hasAccess }],
    });

    beforeEach(() => {
        getServicesTypeConfig.mockResolvedValue({ service_with_plans: ["esim_tunz"], service_without_plans: ["visa"], peko_service_subscriptions: [], peko_subscription_vendors: [] });
        listUnclassifiedActiveOperators.mockResolvedValue([
            { id: 13, serviceProvider: "Soundbox", accessKey: "soundbox", serviceCategory: "Payments", vendor: { id: 1, vendorName: "Paytm" } },
            { id: 14, serviceProvider: "Soundbox Pro", accessKey: "soundbox", serviceCategory: "Payments", vendor: null },
            { id: 15, serviceProvider: "Forex", accessKey: "forex_desk", serviceCategory: null, vendor: null },
        ]);
        listTrees.mockResolvedValue([tree(1, null, "soundbox"), tree(12, "Gulf Reach", "soundbox", false)]);
        findLiveTrees.mockImplementation((trees, accessKey) =>
            trees.filter(entry => entry.nodes.some(node => node.accessKey === accessKey && node.hasAccess))
        );
    });

    it("offers each active unclassified service once, with its vendor and where it is already live", async () => {
        const result = await listClassificationOptions();

        expect(listUnclassifiedActiveOperators).toHaveBeenCalledWith({ service_with_plans: ["esim_tunz"], service_without_plans: ["visa"], peko_service_subscriptions: [], peko_subscription_vendors: [] });
        expect(listTrees).toHaveBeenCalledWith({ keys: ["soundbox", "forex_desk"], partnersOnly: true });
        expect(result).toEqual({
            services: [
                {
                    id: 13,
                    serviceProvider: "Soundbox",
                    accessKey: "soundbox",
                    serviceCategory: "Payments",
                    vendor: { id: 1, vendorName: "Paytm" },
                    liveFor: [{ partnerPermissionId: 1, partnerName: null }],
                },
                { id: 15, serviceProvider: "Forex", accessKey: "forex_desk", serviceCategory: null, vendor: null, liveFor: [] },
            ],
        });
    });

    it("answers an empty list without reading the trees when nothing is left to classify", async () => {
        listUnclassifiedActiveOperators.mockResolvedValue([]);

        expect(await listClassificationOptions()).toEqual({ services: [] });
        expect(listTrees).not.toHaveBeenCalled();
    });
});
