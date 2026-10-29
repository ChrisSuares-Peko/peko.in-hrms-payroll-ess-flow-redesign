const sequelizeConfig = require("../../../../configs/database/index");
const serviceApproval = require("../../../entities/serviceApproval");
const { listTrees } = require("../../serviceApprovalTree");
const { grandfatherLiveTrees, classifiedLiveEntry, CLASSIFIED_LIVE_NOTE } = require("../../serviceApprovals");

jest.mock("../../../entities/serviceApproval", () => ({ findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn() }));
jest.mock("../../serviceApprovalTree", () => ({
    listTrees: jest.fn(),
    loadApprovals: jest.fn(),
    unitKey: (partnerPermissionId, nodeKey) => `${partnerPermissionId}:${nodeKey}`,
    findLiveTrees: (trees, accessKey) =>
        trees.filter(tree => tree.treeStatus && tree.nodes.some(node => node.accessKey === accessKey && node.hasAccess)),
}));
jest.mock("../../serviceApprovalGate", () => ({ getApprovalGateSettings: jest.fn() }));
jest.mock("../../serviceApprovalReadiness", () => ({
    loadReadinessContext: jest.fn(),
    computeReadiness: jest.fn(),
    driftOf: jest.fn(() => null),
}));
jest.mock("../../accountingPeriod", () => ({
    loadAccountingFloor: jest.fn(),
    flooredAfter: expression => `${expression} > :accountingFloor`,
    dropDashboardCache: jest.fn(),
}));

const ACTOR = { id: 42, name: "Ibrahim" };

const node = (accessKey, hasAccess = true) => ({
    nodeKey: accessKey,
    accessKey,
    label: "Soundbox",
    path: ["Soundbox"],
    group: null,
    hasAccess,
    order: 0,
});

const tree = (id, registeredBy, partnerName, nodes, treeStatus = true) => ({ id, registeredBy, partnerName, treeStatus, nodes });

let transaction;

beforeEach(() => {
    jest.clearAllMocks();
    transaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelizeConfig.transaction.mockResolvedValue(transaction);
    listTrees.mockResolvedValue([
        tree(1, null, null, [node("soundbox")]),
        tree(12, "77", "Gulf Reach", [node("soundbox", false)]),
        tree(20, "99", "Old Partner", [node("soundbox")], false),
    ]);
    serviceApproval.findOne.mockResolvedValue(null);
    serviceApproval.create.mockResolvedValue({ id: 501 });
    serviceApproval.update.mockResolvedValue([1]);
});

describe("classifiedLiveEntry", () => {
    it("is an approved entry decided by the admin with a grandfathered history event", () => {
        expect(classifiedLiveEntry({ node: node("soundbox"), actor: ACTOR, at: "2026-09-27T00:00:00.000Z" })).toEqual({
            accessKey: "soundbox",
            label: "Soundbox",
            path: ["Soundbox"],
            status: "APPROVED",
            decidedById: 42,
            decidedByName: "Ibrahim",
            decidedAt: "2026-09-27T00:00:00.000Z",
            note: CLASSIFIED_LIVE_NOTE,
            configHash: null,
            configSnapshot: null,
            history: [
                { action: "GRANDFATHERED", fromStatus: null, actorId: 42, actorName: "Ibrahim", note: CLASSIFIED_LIVE_NOTE, at: "2026-09-27T00:00:00.000Z" },
            ],
        });
        expect(CLASSIFIED_LIVE_NOTE).toBe("Live when classified");
    });
});

describe("grandfatherLiveTrees", () => {
    it("approves the key for every active tree where it is switched on, creating the row when needed", async () => {
        const result = await grandfatherLiveTrees({ accessKey: "soundbox", actor: ACTOR });

        expect(listTrees).toHaveBeenCalledWith({ keys: ["soundbox"] });
        expect(sequelizeConfig.transaction).toHaveBeenCalledTimes(1);
        expect(serviceApproval.findOne).toHaveBeenCalledWith({ where: { partnerPermissionId: 1 }, transaction, lock: true, raw: true });
        expect(serviceApproval.create).toHaveBeenCalledWith(
            {
                partnerPermissionId: 1,
                registeredBy: null,
                approvals: [expect.objectContaining({ accessKey: "soundbox", status: "APPROVED", decidedByName: "Ibrahim", note: CLASSIFIED_LIVE_NOTE })],
            },
            { transaction }
        );
        expect(transaction.commit).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ autoApproved: [{ partnerPermissionId: 1, partnerName: null }], skipped: [] });
    });

    it("appends to an existing row without touching the other services", async () => {
        serviceApproval.findOne.mockResolvedValue({
            id: 77,
            partnerPermissionId: 1,
            approvals: [{ accessKey: "visa", status: "REJECTED", history: [] }],
        });

        await grandfatherLiveTrees({ accessKey: "soundbox", actor: ACTOR });

        expect(serviceApproval.update).toHaveBeenCalledWith(
            { approvals: expect.any(Array), registeredBy: null },
            { where: { id: 77 }, transaction }
        );
        expect(serviceApproval.update.mock.calls[0][0].approvals.map(entry => [entry.accessKey, entry.status])).toEqual([
            ["visa", "REJECTED"],
            ["soundbox", "APPROVED"],
        ]);
        expect(serviceApproval.create).not.toHaveBeenCalled();
    });

    it("never overwrites an existing decision for the key", async () => {
        serviceApproval.findOne.mockResolvedValue({
            id: 77,
            partnerPermissionId: 1,
            approvals: [{ accessKey: "soundbox", status: "REJECTED", history: [] }],
        });

        const result = await grandfatherLiveTrees({ accessKey: "soundbox", actor: ACTOR });

        expect(serviceApproval.update).not.toHaveBeenCalled();
        expect(serviceApproval.create).not.toHaveBeenCalled();
        expect(transaction.rollback).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            autoApproved: [],
            skipped: [{ partnerPermissionId: 1, partnerName: null, code: "EXISTS", status: "REJECTED" }],
        });
    });

    it("does nothing when the key is switched on nowhere", async () => {
        listTrees.mockResolvedValue([tree(1, null, null, [node("soundbox", false)])]);

        expect(await grandfatherLiveTrees({ accessKey: "soundbox", actor: ACTOR })).toEqual({ autoApproved: [], skipped: [] });
        expect(sequelizeConfig.transaction).not.toHaveBeenCalled();
    });

    it("reports a lost race on the first insert and rethrows other failures", async () => {
        const violation = new Error("dup");
        violation.name = "SequelizeUniqueConstraintError";
        serviceApproval.create.mockRejectedValueOnce(violation);

        const stale = await grandfatherLiveTrees({ accessKey: "soundbox", actor: ACTOR });
        expect(stale.skipped).toEqual([{ partnerPermissionId: 1, partnerName: null, code: "STALE", status: null }]);
        expect(transaction.rollback).toHaveBeenCalledTimes(1);

        serviceApproval.create.mockRejectedValueOnce(new Error("disk full"));
        await expect(grandfatherLiveTrees({ accessKey: "soundbox", actor: ACTOR })).rejects.toThrow("disk full");
        expect(transaction.rollback).toHaveBeenCalledTimes(2);
    });
});
