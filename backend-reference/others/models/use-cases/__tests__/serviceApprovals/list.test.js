const sequelizeConfig = require("../../../../configs/database/index");
const { listTrees, loadApprovals } = require("../../serviceApprovalTree");
const { getApprovalGateSettings } = require("../../serviceApprovalGate");
const { loadReadinessContext, computeReadiness, driftOf } = require("../../serviceApprovalReadiness");
const {
    RECENT_ORDERS_SQL,
    filterRows,
    countsOf,
    historyOf,
    journalStateOf,
    listApprovalPartners,
    listPartnerApprovals,
    getApproval,
} = require("../../serviceApprovals");

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
    driftOf: jest.fn(),
}));
jest.mock("../../accountingPeriod", () => ({
    loadAccountingFloor: jest.fn().mockResolvedValue("2026-08-31"),
    flooredAfter: expression => `${expression} > :accountingFloor`,
    dropDashboardCache: jest.fn(),
}));

const node = (nodeKey, label, extra = {}) => ({
    nodeKey,
    accessKey: nodeKey,
    label,
    path: extra.group ? [extra.group, label] : [label],
    group: extra.group || null,
    hasAccess: extra.hasAccess !== false,
    order: extra.order || 0,
});

const DEFAULT_TREE = {
    id: 1,
    registeredBy: null,
    partnerName: null,
    treeStatus: true,
    nodes: [
        node("insurance_desk", "Insurance", { order: 0 }),
        node("bbps_utility_electricity", "Electricity Bill", { group: "Utility Payments", order: 1 }),
        node("esim_tunz", "eSIM", { group: "Corporate Travel", order: 2, hasAccess: false }),
    ],
};

const PARTNER_TREE = {
    id: 12,
    registeredBy: "77",
    partnerName: "Gulf Reach",
    treeStatus: true,
    nodes: [node("esim_tunz", "eSIM Plans", { group: "Corporate Travel", order: 0 })],
};

const GATE = { enabled: true, reason: null, setById: null, setByName: null, setAt: null };

const REJECTION = { action: "REJECTED", fromStatus: "PENDING", actorId: 42, actorName: "Ibrahim", note: "no share", at: "2026-09-26" };

const ENTRIES = new Map([
    [
        "1:bbps_utility_electricity",
        { partnerPermissionId: 1, accessKey: "bbps_utility_electricity", status: "APPROVED", decidedByName: "system", decidedAt: "2026-09-26", note: "Live before the approval gate", configHash: "hash", history: [] },
    ],
    [
        "12:esim_tunz",
        { partnerPermissionId: 12, accessKey: "esim_tunz", status: "REJECTED", decidedById: 42, decidedByName: "Ibrahim", decidedAt: "2026-09-26", note: "no share", history: [REJECTION] },
    ],
]);

const readiness = (blocking = []) => ({
    items: [{ key: "vendor", label: "Vendor", required: true, status: blocking.length ? "fail" : "pass", detail: "Vendor" }],
    summary: { passed: blocking.length ? 0 : 1, total: 1, blocking, warnings: [] },
    snapshot: { operatorId: 5 },
    hash: "hash",
    evidence: { successOrders: 3, recorded: 2, failed: 0, skipped: 0, notRecorded: 1, internal: 0, lastOrderAt: null, lastRecordedAt: null },
});

beforeEach(() => {
    jest.clearAllMocks();
    listTrees.mockResolvedValue([DEFAULT_TREE, PARTNER_TREE]);
    loadApprovals.mockImplementation(where =>
        Promise.resolve(
            where && where.partnerPermissionId
                ? new Map([...ENTRIES].filter(([, entry]) => entry.partnerPermissionId === where.partnerPermissionId))
                : new Map(ENTRIES)
        )
    );
    getApprovalGateSettings.mockResolvedValue(GATE);
    loadReadinessContext.mockResolvedValue({});
    computeReadiness.mockImplementation(units => new Map(units.map(unit => [`${unit.partnerPermissionId}:${unit.nodeKey}`, readiness()])));
    driftOf.mockReturnValue(null);
    sequelizeConfig.query.mockResolvedValue([]);
});

describe("filterRows and countsOf", () => {
    const rows = [
        { switchedOn: true, status: "PENDING", label: "A", group: null, accessKey: "a", nodeKey: "a", drift: null },
        { switchedOn: true, status: "APPROVED", label: "B", group: "Utility Payments", accessKey: "b", nodeKey: "b", drift: { changed: true, fields: [] } },
        { switchedOn: false, status: "REJECTED", label: "C", group: null, accessKey: "c", nodeKey: "c", drift: null },
        { switchedOn: true, status: "REJECTED", label: "D", group: null, accessKey: "d", nodeKey: "d", drift: null },
    ];

    it("reads awaiting as switched on and not approved, and counts every state", () => {
        expect(filterRows(rows, { status: "awaiting" }).map(row => row.label)).toEqual(["A", "D"]);
        expect(filterRows(rows, { status: "rejected" }).map(row => row.label)).toEqual(["C", "D"]);
        expect(filterRows(rows, { status: "all" })).toHaveLength(4);
        expect(filterRows(rows, {})).toHaveLength(4);
        expect(countsOf(rows)).toEqual({ services: 4, switchedOn: 3, awaiting: 2, approved: 1, rejected: 2, pending: 1, drifted: 1 });
    });

    it("narrows by the switch and by a search over label, group and key", () => {
        expect(filterRows(rows, { switchedOn: false }).map(row => row.label)).toEqual(["C"]);
        expect(filterRows(rows, { searchText: "utility" }).map(row => row.label)).toEqual(["B"]);
        expect(filterRows(rows, { searchText: " d " }).map(row => row.label)).toEqual(["D"]);
    });
});

describe("historyOf", () => {
    it("numbers the stored events and lists the latest first", () => {
        expect(
            historyOf({
                history: [
                    { action: "GRANDFATHERED", fromStatus: null, actorName: "system", note: "Live before the approval gate", at: "2026-09-20" },
                    REJECTION,
                ],
            })
        ).toEqual([
            { id: 2, action: "REJECTED", fromStatus: "PENDING", actorName: "Ibrahim", note: "no share", createdAt: "2026-09-26" },
            { id: 1, action: "GRANDFATHERED", fromStatus: null, actorName: "system", note: "Live before the approval gate", createdAt: "2026-09-20" },
        ]);
        expect(historyOf(null)).toEqual([]);
        expect(historyOf({ status: "APPROVED" })).toEqual([]);
    });
});

describe("listApprovalPartners", () => {
    it("counts every tree from its own nodes and sums the totals", async () => {
        const result = await listApprovalPartners();

        expect(result.partners.map(partner => [partner.partnerPermissionId, partner.partnerName, partner.counts])).toEqual([
            [1, null, { services: 3, switchedOn: 2, awaiting: 1, approved: 1, rejected: 0, pending: 2, drifted: 0 }],
            [12, "Gulf Reach", { services: 1, switchedOn: 1, awaiting: 1, approved: 0, rejected: 1, pending: 0, drifted: 0 }],
        ]);
        expect(result.totals).toEqual({ services: 4, switchedOn: 3, awaiting: 2, approved: 1, rejected: 1, pending: 2, drifted: 0 });
        expect(result.gate).toEqual(GATE);
        expect(loadApprovals).toHaveBeenCalledWith();
        expect(loadReadinessContext).toHaveBeenCalledTimes(1);
        expect(loadReadinessContext.mock.calls[0][0]).toHaveLength(4);
    });
});

describe("listPartnerApprovals", () => {
    it("lists the tree's services in tree order with group, status, readiness and evidence", async () => {
        const result = await listPartnerApprovals("1", { status: "all" });

        expect(result.partner).toMatchObject({ partnerPermissionId: 1, partnerName: null, counts: { services: 3 } });
        expect(result.rows.map(row => [row.label, row.group, row.status, row.switchedOn])).toEqual([
            ["Insurance", null, "PENDING", true],
            ["Electricity Bill", "Utility Payments", "APPROVED", true],
            ["eSIM", "Corporate Travel", "PENDING", false],
        ]);
        expect(result.rows[1]).toMatchObject({
            decidedByName: "system",
            note: "Live before the approval gate",
            readiness: { passed: 1, total: 1, blocking: [] },
            evidence: { successOrders: 3, recorded: 2 },
        });
        expect(result.rows[0]).toMatchObject({ decidedById: null, decidedByName: null, decidedAt: null, note: null });
        expect(loadApprovals).toHaveBeenCalledWith({ partnerPermissionId: 1 });
    });

    it("applies the awaiting filter and the search within the partner", async () => {
        expect((await listPartnerApprovals(1, { status: "awaiting" })).rows.map(row => row.label)).toEqual(["Insurance"]);
        expect((await listPartnerApprovals(1, { searchText: "esim" })).rows.map(row => row.label)).toEqual(["eSIM"]);
    });

    it("answers null for an unknown tree", async () => {
        expect(await listPartnerApprovals(99, {})).toBeNull();
    });
});

describe("getApproval", () => {
    it("returns the row with its checklist, recent orders, history and every sibling tree", async () => {
        sequelizeConfig.query.mockResolvedValue([
            { id: 9, corporateTxnId: "TXN-9", status: "SUCCESS", transactionDate: "2026-09-20", amountInINR: "1180.00", transactionVerdict: "true", transactionSkipped: null, internalFlag: 1 },
            { id: 8, corporateTxnId: "TXN-8", status: "SUCCESS", transactionDate: "2026-09-19", amountInINR: null, transactionVerdict: null, transactionSkipped: null, internalFlag: null },
            { id: 7, corporateTxnId: "TXN-7", status: "SUCCESS", transactionDate: "2026-09-18", amountInINR: "59.00", transactionVerdict: "false", transactionSkipped: "true", transactionReason: "recordJournalEntry is disabled for this service operator", internalFlag: null },
        ]);

        const result = await getApproval("12", "esim_tunz");

        expect(result.row).toMatchObject({ partnerPermissionId: 12, label: "eSIM Plans", status: "REJECTED", note: "no share", decidedById: 42 });
        expect(result.checklist).toEqual(readiness().items);
        expect(result.evidence.recentOrders).toEqual([
            { id: 9, corporateTxnId: "TXN-9", status: "SUCCESS", transactionDate: "2026-09-20", amountInINR: 1180, journalState: "recorded", journalNote: null, journalDetail: null, internal: true },
            { id: 8, corporateTxnId: "TXN-8", status: "SUCCESS", transactionDate: "2026-09-19", amountInINR: null, journalState: "notRecorded", journalNote: null, journalDetail: null, internal: false },
            {
                id: 7,
                corporateTxnId: "TXN-7",
                status: "SUCCESS",
                transactionDate: "2026-09-18",
                amountInINR: 59,
                journalState: "skipped",
                journalNote: "Service set not to post",
                journalDetail: "recordJournalEntry is disabled for this service operator",
                internal: false,
            },
        ]);
        expect(sequelizeConfig.query).toHaveBeenCalledWith(RECENT_ORDERS_SQL, {
            type: "SELECT",
            replacements: { operatorId: 5, accountingFloor: "2026-08-31", limit: 10 },
        });
        expect(result.history).toEqual([{ id: 1, action: "REJECTED", fromStatus: "PENDING", actorName: "Ibrahim", note: "no share", createdAt: "2026-09-26" }]);
        expect(result.siblings.map(row => [row.partnerPermissionId, row.partnerName, row.label, row.status])).toEqual([
            [1, null, "eSIM", "PENDING"],
            [12, "Gulf Reach", "eSIM Plans", "REJECTED"],
        ]);
        expect(loadApprovals).toHaveBeenCalledWith();
    });

    it("carries no evidence when readiness found no operator, and answers null for an unknown node", async () => {
        computeReadiness.mockImplementation(units => new Map(units.map(unit => [`${unit.partnerPermissionId}:${unit.nodeKey}`, { ...readiness(), evidence: null }])));

        const result = await getApproval(1, "insurance_desk");

        expect(result.evidence).toBeNull();
        expect(result.history).toEqual([]);
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
        expect(await getApproval(1, "missing")).toBeNull();
        expect(await getApproval(77, "esim_tunz")).toBeNull();
    });
});

describe("journalStateOf", () => {
    it("maps the stored verdict and skip marker onto the four states", () => {
        expect(journalStateOf({ transactionVerdict: "true" })).toBe("recorded");
        expect(journalStateOf({ transactionVerdict: "false" })).toBe("failed");
        expect(journalStateOf({ transactionVerdict: null, transactionSkipped: "true" })).toBe("skipped");
        expect(journalStateOf({ transactionVerdict: null, transactionSkipped: null })).toBe("notRecorded");
    });

    it("reads an entry held back before it was sent as skipped, not failed", () => {
        expect(journalStateOf({ transactionVerdict: "false", transactionSkipped: "true" })).toBe("skipped");
        expect(journalStateOf({ transactionVerdict: "true", transactionSkipped: "true" })).toBe("recorded");
    });
});
