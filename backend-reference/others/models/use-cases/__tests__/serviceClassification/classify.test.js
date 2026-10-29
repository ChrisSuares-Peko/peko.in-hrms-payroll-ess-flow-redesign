const sequelizeConfig = require("../../../../configs/database/index");
const setting = require("../../../entities/setting");
const { findUnknownAccessKeys } = require("../../accountingServices");
const { grandfatherLiveTrees } = require("../../serviceApprovals");
const { dropDashboardCache } = require("../../accountingPeriod");
const { classifyService, applyServicesTypeConfig, withoutKey } = require("../../serviceClassification");

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

describe("withoutKey", () => {
    it("strips a key from both lists", () => {
        expect(withoutKey({ service_with_plans: ["a", "b"], service_without_plans: ["b", "c"], peko_service_subscriptions: [], peko_subscription_vendors: [] }, "b")).toEqual({
            service_with_plans: ["a"],
            service_without_plans: ["c"],
            peko_service_subscriptions: [],
            peko_subscription_vendors: [],
        });
    });
});

describe("classifyService", () => {
    it("refuses a key that has no service operator without touching the setting", async () => {
        findUnknownAccessKeys.mockResolvedValue(["ghost"]);

        expect(await classifyService({ accessKey: "ghost", planType: "with_plans", actor: ACTOR })).toEqual({
            code: "UNKNOWN",
            accessKey: "ghost",
        });
        expect(sequelizeConfig.transaction).not.toHaveBeenCalled();
    });

    it("classifies a new key under a row lock, auto-approves where it is live and drops the dashboard cache", async () => {
        const result = await classifyService({ accessKey: "soundbox", planType: "with_plans", actor: ACTOR });

        expect(setting.findOne).toHaveBeenCalledWith({ where: { name: "servicesTypeConfig" }, transaction, lock: true });
        expect(row.details).toEqual({ service_with_plans: ["esim_tunz", "soundbox"], service_without_plans: ["visa"], peko_service_subscriptions: [], peko_subscription_vendors: [] });
        expect(row.save).toHaveBeenCalledWith({ transaction });
        expect(transaction.commit).toHaveBeenCalledTimes(1);
        expect(grandfatherLiveTrees).toHaveBeenCalledWith({ accessKey: "soundbox", actor: ACTOR });
        expect(dropDashboardCache).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            accessKey: "soundbox",
            planType: "with_plans",
            previousPlanType: null,
            changed: true,
            config: { service_with_plans: ["esim_tunz", "soundbox"], service_without_plans: ["visa"], peko_service_subscriptions: [], peko_subscription_vendors: [] },
            ...LIVE,
        });
    });

    it("moves a key between the two lists without auto-approving anything", async () => {
        const result = await classifyService({ accessKey: "visa", planType: "with_plans", actor: ACTOR });

        expect(row.details).toEqual({ service_with_plans: ["esim_tunz", "visa"], service_without_plans: [], peko_service_subscriptions: [], peko_subscription_vendors: [] });
        expect(grandfatherLiveTrees).not.toHaveBeenCalled();
        expect(result).toMatchObject({ previousPlanType: "without_plans", planType: "with_plans", changed: true, autoApproved: [] });
    });

    it("is a no-op when the key already carries that classification", async () => {
        const result = await classifyService({ accessKey: "visa", planType: "without_plans", actor: ACTOR });

        expect(row.save).not.toHaveBeenCalled();
        expect(transaction.commit).toHaveBeenCalledTimes(1);
        expect(grandfatherLiveTrees).not.toHaveBeenCalled();
        expect(dropDashboardCache).not.toHaveBeenCalled();
        expect(result).toMatchObject({ changed: false, previousPlanType: "without_plans", config: { service_with_plans: ["esim_tunz"], service_without_plans: ["visa"], peko_service_subscriptions: [], peko_subscription_vendors: [] } });
    });

    it("removes a key from both lists when it is unclassified", async () => {
        const result = await classifyService({ accessKey: "visa", planType: null, actor: ACTOR });

        expect(row.details).toEqual({ service_with_plans: ["esim_tunz"], service_without_plans: [], peko_service_subscriptions: [], peko_subscription_vendors: [] });
        expect(grandfatherLiveTrees).not.toHaveBeenCalled();
        expect(result).toMatchObject({ planType: null, previousPlanType: "without_plans", changed: true });
    });

    it("heals a key stored in both lists", async () => {
        storedConfig(["visa"], ["visa"]);

        const result = await classifyService({ accessKey: "visa", planType: "without_plans", actor: ACTOR });

        expect(row.details).toEqual({ service_with_plans: [], service_without_plans: ["visa"], peko_service_subscriptions: [], peko_subscription_vendors: [] });
        expect(result).toMatchObject({ changed: true, previousPlanType: "with_plans" });
        expect(grandfatherLiveTrees).not.toHaveBeenCalled();
    });

    it("creates the settings row when it is missing", async () => {
        setting.findOne.mockResolvedValue(null);

        await classifyService({ accessKey: "soundbox", planType: "without_plans", actor: ACTOR });

        expect(setting.create).toHaveBeenCalledWith(
            { name: "servicesTypeConfig", details: { service_with_plans: [], service_without_plans: ["soundbox"], peko_service_subscriptions: [], peko_subscription_vendors: [] } },
            { transaction }
        );
        expect(grandfatherLiveTrees).toHaveBeenCalledWith({ accessKey: "soundbox", actor: ACTOR });
    });

    it("rolls back and rethrows when the save fails", async () => {
        row.save.mockRejectedValue(new Error("disk full"));

        await expect(classifyService({ accessKey: "soundbox", planType: "with_plans", actor: ACTOR })).rejects.toThrow("disk full");
        expect(transaction.rollback).toHaveBeenCalledTimes(1);
        expect(transaction.commit).not.toHaveBeenCalled();
        expect(grandfatherLiveTrees).not.toHaveBeenCalled();
        expect(dropDashboardCache).not.toHaveBeenCalled();
    });
});

describe("applyServicesTypeConfig", () => {
    it("refuses overlapping and unknown keys before saving", async () => {
        expect(
            await applyServicesTypeConfig({ config: { service_with_plans: ["esim_tunz"], service_without_plans: ["esim_tunz"], peko_service_subscriptions: [], peko_subscription_vendors: [] }, actor: ACTOR })
        ).toEqual({ code: "OVERLAP", keys: ["esim_tunz"] });

        findUnknownAccessKeys.mockResolvedValue(["ghost"]);
        expect(
            await applyServicesTypeConfig({ config: { service_with_plans: ["ghost"], service_without_plans: [], peko_service_subscriptions: [], peko_subscription_vendors: [] }, actor: ACTOR })
        ).toEqual({ code: "UNKNOWN", keys: ["ghost"] });
        expect(sequelizeConfig.transaction).not.toHaveBeenCalled();
    });

    it("replaces the whole row and auto-approves only the keys that were not listed before", async () => {
        const result = await applyServicesTypeConfig({
            config: { service_with_plans: ["esim_tunz", " soundbox "], service_without_plans: ["visa", "forex_desk"], peko_service_subscriptions: [], peko_subscription_vendors: [] },
            actor: ACTOR,
        });

        expect(row.details).toEqual({ service_with_plans: ["esim_tunz", "soundbox"], service_without_plans: ["visa", "forex_desk"], peko_service_subscriptions: [], peko_subscription_vendors: [] });
        expect(row.save).toHaveBeenCalledWith({ transaction });
        expect(grandfatherLiveTrees.mock.calls.map(([args]) => args.accessKey)).toEqual(["soundbox", "forex_desk"]);
        expect(dropDashboardCache).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            config: { service_with_plans: ["esim_tunz", "soundbox"], service_without_plans: ["visa", "forex_desk"], peko_service_subscriptions: [], peko_subscription_vendors: [] },
            autoApproved: [
                { accessKey: "soundbox", partnerPermissionId: 1, partnerName: null },
                { accessKey: "forex_desk", partnerPermissionId: 1, partnerName: null },
            ],
            skipped: [],
        });
    });
});

describe("Peko's own service subscriptions", () => {
    const withPekoServices = keys => {
        row = {
            details: { service_with_plans: ["esim_tunz"], service_without_plans: ["visa"], peko_service_subscriptions: keys },
            save: jest.fn(),
        };
        setting.findOne.mockResolvedValue(row);
    };

    it("lists a service as Peko's own without asking for any approval", async () => {
        const result = await classifyService({ accessKey: "ecommerce_store", planType: "peko_subscription", actor: ACTOR });

        expect(row.details).toEqual({
            service_with_plans: ["esim_tunz"],
            service_without_plans: ["visa"],
            peko_service_subscriptions: ["ecommerce_store"],
            peko_subscription_vendors: [],
        });
        expect(grandfatherLiveTrees).not.toHaveBeenCalled();
        expect(result).toMatchObject({ planType: "peko_subscription", previousPlanType: null, changed: true, autoApproved: [] });
    });

    it("drops the approval need when a vendor service becomes Peko's own", async () => {
        const result = await classifyService({ accessKey: "visa", planType: "peko_subscription", actor: ACTOR });

        expect(row.details).toEqual({
            service_with_plans: ["esim_tunz"],
            service_without_plans: [],
            peko_service_subscriptions: ["visa"],
            peko_subscription_vendors: [],
        });
        expect(grandfatherLiveTrees).not.toHaveBeenCalled();
        expect(result).toMatchObject({ previousPlanType: "without_plans", planType: "peko_subscription" });
    });

    it("approves the partners where it is live when one of Peko's own becomes a vendor service", async () => {
        withPekoServices(["ecommerce_store"]);

        const result = await classifyService({ accessKey: "ecommerce_store", planType: "with_plans", actor: ACTOR });

        expect(row.details).toEqual({
            service_with_plans: ["esim_tunz", "ecommerce_store"],
            service_without_plans: ["visa"],
            peko_service_subscriptions: [],
            peko_subscription_vendors: [],
        });
        expect(grandfatherLiveTrees).toHaveBeenCalledWith({ accessKey: "ecommerce_store", actor: ACTOR });
        expect(result).toMatchObject({ previousPlanType: "peko_subscription", planType: "with_plans", ...LIVE });
    });

    it("approves nothing when a bulk save only adds to Peko's own list, but does for a key leaving it for a vendor list", async () => {
        withPekoServices(["whatsapp"]);

        await applyServicesTypeConfig({
            config: {
                service_with_plans: ["esim_tunz", "whatsapp"],
                service_without_plans: ["visa"],
                peko_service_subscriptions: ["ecommerce_store"],
                peko_subscription_vendors: [],
            },
            actor: ACTOR,
        });

        expect(grandfatherLiveTrees.mock.calls.map(([args]) => args.accessKey)).toEqual(["whatsapp"]);
    });

    it("refuses a key listed both as Peko's own and as a vendor service", async () => {
        expect(
            await applyServicesTypeConfig({
                config: { service_with_plans: ["ecommerce_store"], service_without_plans: [], peko_service_subscriptions: ["ecommerce_store"], peko_subscription_vendors: [] },
                actor: ACTOR,
            })
        ).toEqual({ code: "OVERLAP", keys: ["ecommerce_store"] });
    });
});
