const { getServicesTypeConfig, listOperatorsForClassification } = require("../../accountingServices");
const { listTrees } = require("../../serviceApprovalTree");
const { listClassification } = require("../../serviceClassification");

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
jest.mock("../../serviceApprovalTree", () => {
    const actual = jest.requireActual("../../serviceApprovalTree");
    return { ...actual, listTrees: jest.fn() };
});
jest.mock("../../serviceApprovals", () => ({ grandfatherLiveTrees: jest.fn() }));
jest.mock("../../accountingPeriod", () => ({ dropDashboardCache: jest.fn() }));

const CONFIG = { service_with_plans: ["esim_tunz"], service_without_plans: ["visa"] };

const tree = (id, partnerName, treeStatus, nodes) => ({ id, partnerName, treeStatus, nodes });

beforeEach(() => {
    jest.clearAllMocks();
    getServicesTypeConfig.mockResolvedValue(CONFIG);
    listOperatorsForClassification.mockResolvedValue({
        rows: [
            { id: 10, serviceProvider: "Tunz eSIM", accessKey: "esim_tunz", commissionType: "PERCENTAGE", providerCommission: "0.0000", isCommissionConfigured: 1, vendor: null },
            { id: 13, serviceProvider: "Soundbox", accessKey: "soundbox", commissionType: null, providerCommission: "0.0000", vendor: { id: 1, vendorName: "Paytm" } },
        ],
        count: 7,
    });
    listTrees.mockResolvedValue([
        tree(1, null, true, [{ accessKey: "esim_tunz", hasAccess: true }, { accessKey: "soundbox", hasAccess: false }]),
        tree(12, "Gulf Reach", true, [{ accessKey: "esim_tunz", hasAccess: false }]),
        tree(20, "Old Partner", false, [{ accessKey: "soundbox", hasAccess: true }]),
    ]);
});

describe("listClassification", () => {
    it("lists operators with their classification and the active trees where each is switched on", async () => {
        const result = await listClassification({
            classification: "all",
            limit: 10,
            offset: 20,
            searchText: "s",
            sort: "ASC",
            sortField: "serviceProvider",
        });

        expect(listOperatorsForClassification).toHaveBeenCalledWith({
            config: CONFIG,
            classification: "all",
            limit: 10,
            offset: 20,
            searchText: "s",
            sort: "ASC",
            sortField: "serviceProvider",
        });
        expect(listTrees).toHaveBeenCalledWith({ keys: ["esim_tunz", "soundbox"], partnersOnly: true });
        expect(result.recordsTotal).toBe(7);
        expect(result.services.map(row => [row.id, row.planType, row.commissionConfigured, row.liveFor])).toEqual([
            [10, "with_plans", true, [{ partnerPermissionId: 1, partnerName: null }]],
            [13, null, false, []],
        ]);
        expect(result.services[1].vendor).toEqual(expect.objectContaining({ vendorName: "Paytm" }));
    });

    it("skips the tree walk when the page is empty", async () => {
        listOperatorsForClassification.mockResolvedValue({ rows: [], count: 0 });

        expect(await listClassification({ classification: "unclassified" })).toEqual({ services: [], recordsTotal: 0 });
        expect(listTrees).not.toHaveBeenCalled();
    });
});
