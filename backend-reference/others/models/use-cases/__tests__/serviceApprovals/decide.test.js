const sequelizeConfig = require("../../../../configs/database/index");
const serviceApproval = require("../../../entities/serviceApproval");
const { listTrees } = require("../../serviceApprovalTree");
const { loadReadinessContext, computeReadiness } = require("../../serviceApprovalReadiness");
const { dropDashboardCache } = require("../../accountingPeriod");
const { decideServiceApprovals, decidedEntry } = require("../../serviceApprovals");

jest.mock("../../../entities/serviceApproval", () => ({ findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn() }));
jest.mock("../../serviceApprovalTree", () => ({
    listTrees: jest.fn(),
    loadApprovals: jest.fn(),
    unitKey: (partnerPermissionId, nodeKey) => `${partnerPermissionId}:${nodeKey}`,
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

const node = (nodeKey, accessKey, label = nodeKey) => ({
    nodeKey,
    accessKey,
    label,
    path: [label],
    group: null,
    hasAccess: true,
    order: 0,
});

const TREES = [
    { id: 1, registeredBy: null, partnerName: null, treeStatus: true, nodes: [node("esim_tunz", "esim_tunz", "eSIM")] },
    { id: 12, registeredBy: "77", partnerName: "Gulf Reach", treeStatus: true, nodes: [node("esim_tunz", "esim_tunz", "eSIM")] },
];

const ACTOR = { id: 42, name: "Ibrahim" };

const ready = (blocking = []) => ({
    items: [
        { key: "vendor", label: "Vendor", required: true, status: blocking.includes("vendor") ? "fail" : "pass", detail: "Vendor Tunz" },
        { key: "evidence", label: "Journal evidence", required: false, status: "info", detail: "No orders yet" },
    ],
    summary: { passed: blocking.length ? 0 : 1, total: 1, blocking, warnings: [] },
    snapshot: { operatorId: 5 },
    hash: "abc",
    evidence: null,
});

const GRANDFATHERED = {
    action: "GRANDFATHERED",
    fromStatus: null,
    actorId: null,
    actorName: "system",
    note: "Live before the approval gate",
    at: "2026-09-26T00:00:00.000Z",
};

const stored = entry => ({
    id: 77,
    partnerPermissionId: 1,
    registeredBy: null,
    approvals: [{ accessKey: "visa", status: "APPROVED", history: [GRANDFATHERED] }, ...(entry ? [entry] : [])],
});

const savedApprovals = () => {
    const call = serviceApproval.update.mock.calls[0] || serviceApproval.create.mock.calls[0];
    return call[0].approvals;
};

const savedEntry = () => savedApprovals().find(entry => entry.accessKey === "esim_tunz");

let transaction;

beforeEach(() => {
    jest.clearAllMocks();
    transaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelizeConfig.transaction.mockResolvedValue(transaction);
    listTrees.mockResolvedValue(TREES);
    loadReadinessContext.mockResolvedValue({});
    computeReadiness.mockImplementation(units => new Map(units.map(unit => [`${unit.partnerPermissionId}:${unit.nodeKey}`, ready()])));
    serviceApproval.findOne.mockResolvedValue(null);
    serviceApproval.create.mockImplementation(fields => Promise.resolve({ id: 501, ...fields }));
    serviceApproval.update.mockResolvedValue([1]);
});

const decide = overrides =>
    decideServiceApprovals({ nodeKey: "esim_tunz", partnerPermissionIds: [1], decision: "APPROVED", note: null, actor: ACTOR, ...overrides });

describe("decidedEntry", () => {
    it("carries the service, the decision, who took it and when, the fingerprint and the appended history", () => {
        const entry = decidedEntry({
            node: node("esim_tunz", "esim_tunz", "eSIM"),
            existing: { accessKey: "esim_tunz", status: "REJECTED", history: [GRANDFATHERED] },
            decision: "APPROVED",
            fromStatus: "REJECTED",
            note: "checked",
            actor: ACTOR,
            readiness: ready(),
            at: "2026-09-27T00:00:00.000Z",
        });

        expect(entry).toEqual({
            accessKey: "esim_tunz",
            label: "eSIM",
            path: ["eSIM"],
            status: "APPROVED",
            decidedById: 42,
            decidedByName: "Ibrahim",
            decidedAt: "2026-09-27T00:00:00.000Z",
            note: "checked",
            configHash: "abc",
            configSnapshot: { operatorId: 5 },
            history: [
                GRANDFATHERED,
                { action: "APPROVED", fromStatus: "REJECTED", actorId: 42, actorName: "Ibrahim", note: "checked", at: "2026-09-27T00:00:00.000Z" },
            ],
        });
    });
});

describe("approving", () => {
    it("creates the tree's row with the new service entry in one transaction, then drops the dashboard cache", async () => {
        const result = await decide({ note: "checked" });

        expect(result).toEqual({ results: [{ partnerPermissionId: 1, ok: true, status: "APPROVED" }], decided: 1, skipped: 0 });
        expect(serviceApproval.findOne).toHaveBeenCalledWith({ where: { partnerPermissionId: 1 }, transaction, lock: true, raw: true });
        expect(serviceApproval.create).toHaveBeenCalledWith(
            { partnerPermissionId: 1, registeredBy: null, approvals: [expect.objectContaining({ accessKey: "esim_tunz" })] },
            { transaction }
        );
        expect(savedEntry()).toMatchObject({
            accessKey: "esim_tunz",
            label: "eSIM",
            status: "APPROVED",
            decidedById: 42,
            decidedByName: "Ibrahim",
            note: "checked",
            configHash: "abc",
            history: [expect.objectContaining({ action: "APPROVED", fromStatus: "PENDING", actorName: "Ibrahim" })],
        });
        expect(transaction.commit).toHaveBeenCalledTimes(1);
        expect(transaction.rollback).not.toHaveBeenCalled();
        expect(dropDashboardCache).toHaveBeenCalledTimes(1);
    });

    it("refuses while a required check fails and writes nothing", async () => {
        computeReadiness.mockImplementation(units => new Map(units.map(unit => [`${unit.partnerPermissionId}:${unit.nodeKey}`, ready(["vendor"])])));

        const result = await decide();

        expect(result.results).toEqual([
            { partnerPermissionId: 1, ok: false, code: "BLOCKED", blocking: [{ key: "vendor", label: "Vendor", detail: "Vendor Tunz" }] },
        ]);
        expect(result.skipped).toBe(1);
        expect(sequelizeConfig.transaction).not.toHaveBeenCalled();
        expect(serviceApproval.create).not.toHaveBeenCalled();
    });

    it("adds the service to an existing row, keeping the other services untouched", async () => {
        serviceApproval.findOne.mockResolvedValue(stored(null));

        await decide();

        expect(serviceApproval.update).toHaveBeenCalledWith(
            { approvals: expect.any(Array), registeredBy: null },
            { where: { id: 77 }, transaction }
        );
        expect(savedApprovals().map(entry => [entry.accessKey, entry.status])).toEqual([
            ["visa", "APPROVED"],
            ["esim_tunz", "APPROVED"],
        ]);
        expect(savedApprovals()[0].history).toEqual([GRANDFATHERED]);
    });

    it("replaces the service's own entry in place and appends to its history", async () => {
        serviceApproval.findOne.mockResolvedValue(
            stored({ accessKey: "esim_tunz", status: "REJECTED", note: "no share", history: [{ action: "REJECTED", fromStatus: "PENDING", actorName: "Ibrahim", at: "x" }] })
        );

        await decide({ note: "fixed" });

        expect(savedApprovals().map(entry => entry.accessKey)).toEqual(["visa", "esim_tunz"]);
        expect(savedEntry()).toMatchObject({ status: "APPROVED", note: "fixed" });
        expect(savedEntry().history.map(event => [event.action, event.fromStatus])).toEqual([
            ["REJECTED", "PENDING"],
            ["APPROVED", "REJECTED"],
        ]);
    });

    it("treats a unique violation on create as a lost race", async () => {
        const violation = new Error("dup");
        violation.name = "SequelizeUniqueConstraintError";
        serviceApproval.create.mockRejectedValue(violation);

        const result = await decide();

        expect(result.results).toEqual([{ partnerPermissionId: 1, ok: false, code: "STALE" }]);
        expect(transaction.rollback).toHaveBeenCalledTimes(1);
        expect(transaction.commit).not.toHaveBeenCalled();
    });

    it("rolls back and rethrows any other failure", async () => {
        serviceApproval.create.mockRejectedValue(new Error("disk full"));

        await expect(decide()).rejects.toThrow("disk full");
        expect(transaction.rollback).toHaveBeenCalledTimes(1);
        expect(transaction.commit).not.toHaveBeenCalled();
    });

    it("reports an already-approved unit as unchanged without writing", async () => {
        serviceApproval.findOne.mockResolvedValue(stored({ accessKey: "esim_tunz", status: "APPROVED", configHash: "abc" }));

        const result = await decide();

        expect(result.results).toEqual([{ partnerPermissionId: 1, ok: false, code: "UNCHANGED", status: "APPROVED" }]);
        expect(serviceApproval.update).not.toHaveBeenCalled();
        expect(transaction.rollback).toHaveBeenCalledTimes(1);
    });

    it("re-approves a drifted service, refreshing its fingerprint and keeping the history", async () => {
        serviceApproval.findOne.mockResolvedValue(
            stored({ accessKey: "esim_tunz", status: "APPROVED", configHash: "old", history: [GRANDFATHERED] })
        );

        const result = await decide({ note: "re-checked" });

        expect(result.results).toEqual([{ partnerPermissionId: 1, ok: true, status: "APPROVED" }]);
        expect(savedEntry()).toMatchObject({ status: "APPROVED", configHash: "abc", note: "re-checked" });
        expect(savedEntry().history.map(event => [event.action, event.fromStatus])).toEqual([
            ["GRANDFATHERED", null],
            ["APPROVED", "APPROVED"],
        ]);
        expect(transaction.commit).toHaveBeenCalledTimes(1);
    });

    it("still refuses a drifted re-approval while a required check fails", async () => {
        computeReadiness.mockImplementation(units => new Map(units.map(unit => [`${unit.partnerPermissionId}:${unit.nodeKey}`, ready(["vendor"])])));
        serviceApproval.findOne.mockResolvedValue(stored({ accessKey: "esim_tunz", status: "APPROVED", configHash: "old" }));

        const result = await decide();

        expect(result.results[0].code).toBe("BLOCKED");
        expect(serviceApproval.update).not.toHaveBeenCalled();
    });
});

describe("rejecting", () => {
    it("takes an approved service offline regardless of readiness", async () => {
        computeReadiness.mockImplementation(units => new Map(units.map(unit => [`${unit.partnerPermissionId}:${unit.nodeKey}`, ready(["vendor"])])));
        serviceApproval.findOne.mockResolvedValue(stored({ accessKey: "esim_tunz", status: "APPROVED" }));

        const result = await decide({ decision: "REJECTED", note: "wrong vendor" });

        expect(result.results).toEqual([{ partnerPermissionId: 1, ok: true, status: "REJECTED" }]);
        expect(savedEntry()).toMatchObject({ status: "REJECTED", note: "wrong vendor", decidedByName: "Ibrahim" });
        expect(savedEntry().history.slice(-1)[0]).toMatchObject({ action: "REJECTED", fromStatus: "APPROVED" });
    });
});

describe("deciding for several partners at once", () => {
    it("loads readiness once, decides each tree on its own and reports unknown trees and missing nodes", async () => {
        listTrees.mockResolvedValue([...TREES, { id: 30, registeredBy: "5", partnerName: "Other", treeStatus: true, nodes: [] }]);

        const result = await decide({ partnerPermissionIds: [1, 12, 30, 99] });

        expect(loadReadinessContext).toHaveBeenCalledTimes(1);
        expect(loadReadinessContext.mock.calls[0][0]).toEqual([
            { partnerPermissionId: 1, registeredBy: null, nodeKey: "esim_tunz", accessKey: "esim_tunz" },
            { partnerPermissionId: 12, registeredBy: "77", nodeKey: "esim_tunz", accessKey: "esim_tunz" },
        ]);
        expect(result.results).toEqual([
            { partnerPermissionId: 1, ok: true, status: "APPROVED" },
            { partnerPermissionId: 12, ok: true, status: "APPROVED" },
            { partnerPermissionId: 30, ok: false, code: "NOT_FOUND" },
            { partnerPermissionId: 99, ok: false, code: "NOT_FOUND" },
        ]);
        expect(result).toMatchObject({ decided: 2, skipped: 2 });
        expect(serviceApproval.create.mock.calls.map(([fields]) => [fields.partnerPermissionId, fields.registeredBy])).toEqual([
            [1, null],
            [12, "77"],
        ]);
        expect(sequelizeConfig.transaction).toHaveBeenCalledTimes(2);
        expect(dropDashboardCache).toHaveBeenCalledTimes(1);
    });
});
