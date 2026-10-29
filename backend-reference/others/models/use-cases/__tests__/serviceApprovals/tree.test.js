const { Op } = require("sequelize");
const partnerPermission = require("../../../entities/partnerPermission");
const credential = require("../../../entities/credential");
const serviceApproval = require("../../../entities/serviceApproval");
const systemUser = require("../../../entities/systemUser");
const { getServicesTypeConfig } = require("../../accountingServices");
const {
    listTrees,
    flattenApprovals,
    loadApprovals,
    findAwaitingApprovals,
    findLiveTrees,
    isDefaultTree,
    partnerIdOf,
} = require("../../serviceApprovalTree");

jest.mock("../../../entities/partnerPermission", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/credential", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/serviceApproval", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/systemUser", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/roleAndPermissions", () => ({}));
jest.mock("../../accountingServices", () => ({ getServicesTypeConfig: jest.fn() }));

const leaf = (label, accessKey, hasAccess = true) => ({ label, accessKey, hasAccess });

const DEFAULT_TREE = [
    leaf("Verification Suite", undefined),
    leaf("Soundbox", "soundbox"),
    {
        label: "Utility Payments",
        hasAccess: true,
        subServices: [leaf("Electricity Bill", "bbps_utility_electricity"), leaf("Water Bill", "bbps_utility_water", false)],
    },
    { label: "Reports", hasAccess: true, subServices: [leaf("Transactions", undefined)] },
];

const PARTNER_TREE = [leaf("Verification Suite", undefined), leaf("eSIM", "esim_tunz"), leaf("Soundbox", "soundbox")];

const CONFIG = { service_with_plans: ["esim_tunz"], service_without_plans: ["bbps_utility_electricity", "bbps_utility_water"] };

const approvalRow = (partnerPermissionId, approvals) => ({ id: partnerPermissionId, partnerPermissionId, registeredBy: null, approvals });

beforeEach(() => {
    jest.clearAllMocks();
    partnerPermission.findAll.mockResolvedValue([
        { id: 12, registeredBy: "100002226", permissions: PARTNER_TREE, status: true },
        { id: 1, registeredBy: null, permissions: JSON.stringify(DEFAULT_TREE), status: true },
        { id: 20, registeredBy: "999", permissions: [leaf("Insurance", undefined)], status: false },
        { id: 30, registeredBy: "abc", permissions: [], status: true },
    ]);
    credential.findAll.mockResolvedValue([{ id: 100002226, name: "Gulf Reach" }]);
    // Only Gulf Reach has a partner-role systemUsers row; 999 is a permission tree left by a test login.
    systemUser.findAll.mockResolvedValue([{ credentialId: 100002226 }]);
    getServicesTypeConfig.mockResolvedValue(CONFIG);
    serviceApproval.findAll.mockResolvedValue([]);
});

describe("isDefaultTree and partnerIdOf", () => {
    it("recognise the Default row and numeric partner ids only", () => {
        expect(isDefaultTree(null)).toBe(true);
        expect(isDefaultTree("")).toBe(true);
        expect(isDefaultTree("77")).toBe(false);
        expect(partnerIdOf("77")).toBe(77);
        expect(partnerIdOf("abc")).toBeNull();
        expect(partnerIdOf(null)).toBeNull();
    });
});

describe("listTrees", () => {
    it("puts the Default tree first, names partners from their credential and parses the leaves", async () => {
        const trees = await listTrees();

        expect(trees.map(tree => [tree.id, tree.partnerName, tree.treeStatus])).toEqual([
            [1, null, true],
            [20, "999", false],
            [30, "abc", true],
            [12, "Gulf Reach", true],
        ]);
        expect(credential.findAll.mock.calls[0][0].where).toEqual({ id: { [Op.in]: [100002226, 999] } });
        expect(trees[0].nodes.map(node => node.nodeKey)).toEqual([
            "bbps_utility_electricity",
            "bbps_utility_water",
        ]);
        expect(trees[0].registeredBy).toBeNull();
        expect(trees[3].registeredBy).toBe("100002226");
    });

    it("lists only the leaves whose key is classified in the services type setting, read once", async () => {
        const trees = await listTrees();

        expect(getServicesTypeConfig).toHaveBeenCalledTimes(1);
        expect(trees[0].nodes.map(node => node.label)).not.toContain("Soundbox");
        expect(trees[3].nodes.map(node => node.nodeKey)).toEqual(["esim_tunz"]);

        getServicesTypeConfig.mockResolvedValue({ service_with_plans: [], service_without_plans: ["soundbox"] });
        const narrowed = await listTrees();
        expect(narrowed[0].nodes.map(node => node.nodeKey)).toEqual(["soundbox"]);
        expect(narrowed[3].nodes.map(node => node.nodeKey)).toEqual(["soundbox"]);
    });

    it("survives an empty table", async () => {
        partnerPermission.findAll.mockResolvedValue(undefined);

        expect(await listTrees()).toEqual([]);
        expect(credential.findAll).not.toHaveBeenCalled();
    });

    it("keeps every tree by default, so the gate and the grandfathering see test logins as before", async () => {
        const trees = await listTrees();

        expect(trees.map(tree => tree.id)).toEqual([1, 20, 30, 12]);
        expect(systemUser.findAll).not.toHaveBeenCalled();
    });

    it("with partnersOnly lists the Default tree and partner portals only, the Whitelabel Partners rule", async () => {
        const trees = await listTrees({ partnersOnly: true });

        expect(trees.map(tree => [tree.id, tree.partnerName])).toEqual([
            [1, null],
            [12, "Gulf Reach"],
        ]);
        expect(systemUser.findAll).toHaveBeenCalledTimes(1);
        expect(systemUser.findAll.mock.calls[0][0].where).toEqual({ credentialId: { [Op.in]: [100002226, 999] } });
        expect(systemUser.findAll.mock.calls[0][0].include[0].where).toEqual({ roleName: "partner" });
        expect(credential.findAll.mock.calls[0][0].where).toEqual({ id: { [Op.in]: [100002226] } });
    });

    it("with partnersOnly and no partner portal at all keeps just the Default tree", async () => {
        systemUser.findAll.mockResolvedValue([]);

        const trees = await listTrees({ partnersOnly: true });

        expect(trees.map(tree => tree.id)).toEqual([1]);
        expect(credential.findAll).not.toHaveBeenCalled();
    });
});

describe("flattenApprovals and loadApprovals", () => {
    it("indexes every service entry of every tree row by tree and key, parsing stored JSON strings", () => {
        const entries = flattenApprovals([
            approvalRow(1, JSON.stringify([{ accessKey: "visa", status: "APPROVED" }, { status: "APPROVED" }, null])),
            approvalRow(12, [{ accessKey: "esim_tunz", status: "REJECTED", note: "no share" }]),
            approvalRow(30, "garbage"),
        ]);

        expect([...entries.keys()]).toEqual(["1:visa", "12:esim_tunz"]);
        expect(entries.get("12:esim_tunz")).toEqual({ accessKey: "esim_tunz", status: "REJECTED", note: "no share", partnerPermissionId: 12 });
    });

    it("reads the rows it is asked for with a plain attribute list", async () => {
        serviceApproval.findAll.mockResolvedValue([approvalRow(1, [{ accessKey: "visa", status: "APPROVED" }])]);

        const entries = await loadApprovals({ partnerPermissionId: 1 });

        expect(entries.get("1:visa").status).toBe("APPROVED");
        expect(serviceApproval.findAll).toHaveBeenCalledWith({
            where: { partnerPermissionId: 1 },
            attributes: ["id", "partnerPermissionId", "registeredBy", "approvals"],
            raw: true,
        });
        expect(await loadApprovals()).toEqual(expect.any(Map));
        expect(serviceApproval.findAll.mock.calls[1][0].where).toEqual({});
    });
});

describe("findAwaitingApprovals", () => {
    it("counts switched-on listed leaves without an approval, per active tree", async () => {
        serviceApproval.findAll.mockResolvedValue([
            approvalRow(1, [{ accessKey: "bbps_utility_electricity", status: "APPROVED" }]),
            approvalRow(12, [{ accessKey: "esim_tunz", status: "REJECTED" }]),
        ]);

        const awaiting = await findAwaitingApprovals();

        expect(awaiting).toEqual({
            count: 1,
            items: [
                {
                    label: "Gulf Reach · eSIM",
                    partnerPermissionId: 12,
                    partnerName: "Gulf Reach",
                    accessKey: "esim_tunz",
                    serviceLabel: "eSIM",
                    status: "REJECTED",
                },
            ],
            undecided: 0,
            rejected: 1,
            partners: 1,
        });
    });

    it("ignores switched-off leaves, unclassified or label-only services, platform items and inactive trees", async () => {
        const awaiting = await findAwaitingApprovals();

        expect(awaiting.items).toEqual([
            {
                label: "Default · Electricity Bill",
                partnerPermissionId: 1,
                partnerName: null,
                accessKey: "bbps_utility_electricity",
                serviceLabel: "Electricity Bill",
                status: "PENDING",
            },
            {
                label: "Gulf Reach · eSIM",
                partnerPermissionId: 12,
                partnerName: "Gulf Reach",
                accessKey: "esim_tunz",
                serviceLabel: "eSIM",
                status: "PENDING",
            },
        ]);
        expect(awaiting.items.map(item => item.label)).not.toContain("Default · Verification Suite");
        expect(awaiting.items.map(item => item.label)).not.toContain("Default · Soundbox");
        expect(awaiting.count).toBe(2);
    });

    it("answers zero when every switched-on listed leaf is approved", async () => {
        serviceApproval.findAll.mockResolvedValue([
            approvalRow(1, [{ accessKey: "bbps_utility_electricity", status: "APPROVED" }]),
            approvalRow(12, [{ accessKey: "esim_tunz", status: "APPROVED" }]),
        ]);

        expect(await findAwaitingApprovals()).toEqual({ count: 0, items: [], undecided: 0, rejected: 0, partners: 0 });
    });
});

describe("listTrees with explicit keys and findLiveTrees", () => {
    it("lists the given keys without reading the services type setting", async () => {
        const trees = await listTrees({ keys: ["soundbox"] });

        expect(getServicesTypeConfig).not.toHaveBeenCalled();
        expect(trees[0].nodes.map(node => node.nodeKey)).toEqual(["soundbox"]);
        expect(trees[3].nodes.map(node => node.nodeKey)).toEqual(["soundbox"]);
    });

    it("finds the active trees where a key is switched on", async () => {
        const trees = await listTrees({ keys: ["soundbox", "esim_tunz"] });

        expect(findLiveTrees(trees, "soundbox").map(tree => tree.id)).toEqual([1, 12]);
        expect(findLiveTrees(trees, "esim_tunz").map(tree => tree.id)).toEqual([12]);
        expect(findLiveTrees(trees, "missing")).toEqual([]);
    });
});
