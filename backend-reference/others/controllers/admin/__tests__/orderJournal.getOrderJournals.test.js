const { Op } = require("sequelize");

jest.mock("../../../models/entities/order", () => ({ findAndCountAll: jest.fn() }));
jest.mock("../../../models/entities/serviceOperator", () => ({}));
jest.mock("../../../models/entities/credential", () => ({}));
jest.mock("../../../models/entities/vendor", () => ({}));
jest.mock("../../../models/use-cases/chartOfAccount", () => ({ findAllByProviderAccountIds: jest.fn() }));
jest.mock("../../../models/use-cases/credential", () => ({ findOneCredential: jest.fn() }));
jest.mock("../../../models/use-cases/accountingPeriod", () => ({
    loadAccountingFloor: jest.fn().mockResolvedValue("2000-01-01"),
    // Far enough in the past by default that no requested date in these tests gets clamped;
    // individual tests override this to exercise the actual clamping behavior.
    goLiveWindowStart: jest.fn(() => new Date("2000-01-01T00:00:00.000Z")),
    isBeforeGoLive: jest.fn(),
}));
jest.mock("../../../models/use-cases/serviceOperator", () => ({ findServiceOperatorById: jest.fn() }));
jest.mock("../../../utils/bull/queue/accountingQueues", () => ({ dispatchJournalRetry: jest.fn() }));
jest.mock("../../../utils/pekoRecieptHelper", () => ({ generateInvoiceOrReceiptPdf: jest.fn() }));
jest.mock("../../../utils/pdfHelper", () => ({ isPdfBuffer: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));

const orders = require("../../../models/entities/order");
const { goLiveWindowStart } = require("../../../models/use-cases/accountingPeriod");
const { getOrderJournals } = require("../orderJournal");

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const run = async (query, user) => {
    orders.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
    const req = { query, user };
    const res = mockRes();
    await getOrderJournals(req, res, jest.fn());
    return orders.findAndCountAll.mock.calls[0][0].where;
};

// Pull the literal SQL text back out regardless of which Op.and entry order Sequelize.literal
// objects land in — findAndCountAll is mocked, so nothing actually executes this SQL.
const literalsOf = where => {
    const entries = where[Op.and];
    if (!entries) return [];
    return (Array.isArray(entries) ? entries : [entries]).map(entry => entry.val ?? entry);
};

describe("getOrderJournals — journalKey-aware date/status filtering", () => {
    beforeEach(() => jest.clearAllMocks());

    it("defaults to the transaction key and transactionDate when journalKey is omitted", async () => {
        const where = await run({ from: "2026-09-01", to: "2026-09-16", journalStatus: "success" });

        expect(where.transactionDate).toBeDefined();
        const literals = literalsOf(where);
        expect(literals.some(sql => sql.includes("journalRecordStatus`, '$.transaction') = true"))).toBe(true);
        expect(literals.some(sql => sql.includes("journalData"))).toBe(false);
    });

    it("windows on the IST calendar day, so one picked day lists its 00:01 orders too", async () => {
        const where = await run({ from: "2026-10-21", to: "2026-10-21" });

        expect(where.transactionDate[Op.between]).toEqual(["2026-10-21 00:00:00", "2026-10-21 23:59:59"]);
    });

    it("scopes by that key's own journalDate instead of transactionDate when journalKey is a real key", async () => {
        const where = await run({ from: "2026-09-01", to: "2026-09-16", journalKey: "refund" });

        expect(where.transactionDate).toBeUndefined();
        const literals = literalsOf(where);
        expect(
            literals.some(sql =>
                sql.includes("JSON_EXTRACT(`orders`.`journalData`, '$.refund.journalDate')) BETWEEN '2026-09-01' AND '2026-09-16'")
            )
        ).toBe(true);
    });

    it("targets the requested key's own status, not a hardcoded transaction key", async () => {
        const where = await run({
            from: "2026-09-01",
            to: "2026-09-16",
            journalKey: "cashbackReversal",
            journalStatus: "failed",
        });

        const literals = literalsOf(where);
        expect(literals.some(sql => sql.includes("journalRecordStatus`, '$.cashbackReversal') = false"))).toBe(
            true
        );
    });

    it("falls back to the transaction key for an unrecognized journalKey, never interpolating it unvalidated", async () => {
        const where = await run({
            from: "2026-09-01",
            to: "2026-09-16",
            journalKey: "'; DROP TABLE orders; --",
            journalStatus: "success",
        });

        expect(where.transactionDate).toBeDefined();
        const literals = literalsOf(where);
        expect(literals.some(sql => sql.includes("DROP TABLE"))).toBe(false);
        expect(literals.some(sql => sql.includes("journalRecordStatus`, '$.transaction') = true"))).toBe(true);
    });

    it("still clamps the window to the go-live floor for an event-date-scoped key", async () => {
        goLiveWindowStart.mockReturnValueOnce(new Date("2026-09-10T00:00:00.000Z"));

        const where = await run({ from: "2026-09-01", to: "2026-09-16", journalKey: "refund" });

        const literals = literalsOf(where);
        // The requested from (09-01) is before the floor (09-10), so the floor wins.
        expect(literals.some(sql => sql.includes("BETWEEN '2026-09-10' AND '2026-09-16'"))).toBe(true);
    });

    it("checks journalData.<key>.skipped, not 'journalRecordStatus is unset', so a never-attempted key isn't mistaken for a skipped one", async () => {
        const where = await run({
            from: "2026-09-01",
            to: "2026-09-16",
            journalKey: "refund",
            journalStatus: "skipped",
        });

        const literals = literalsOf(where);
        expect(literals.some(sql => sql.includes("JSON_EXTRACT(`orders`.`journalData`, '$.refund.skipped') = true"))).toBe(
            true
        );
        expect(literals.some(sql => sql.includes("journalRecordStatus`, '$.refund') IS NULL"))).toBe(false);
    });
});

describe("getOrderJournals — journalKey=any (Failed/Skipped Entries dashboard cards)", () => {
    beforeEach(() => jest.clearAllMocks());

    it("ORs every key's failed condition together, each against its own correct date bound", async () => {
        const where = await run({
            from: "2026-09-01",
            to: "2026-09-16",
            journalKey: "any",
            journalStatus: "failed",
        });

        expect(where.transactionDate).toBeUndefined();
        const [combined] = literalsOf(where);

        ["transaction", "refund", "cashback", "cashbackReversal", "adminRefund"].forEach(key => {
            expect(combined).toContain(`JSON_EXTRACT(\`orders\`.\`journalRecordStatus\`, '$.${key}') = false`);
        });
        // transaction uses the real transactionDate column, on the IST day window; every other
        // key uses its own journalDate string instead.
        expect(combined).toContain("`orders`.`transactionDate` BETWEEN '2026-09-01 00:00:00' AND '2026-09-16 23:59:59'");
        expect(combined).toContain(
            "JSON_UNQUOTE(JSON_EXTRACT(`orders`.`journalData`, '$.refund.journalDate')) BETWEEN '2026-09-01' AND '2026-09-16'"
        );
    });

    it("ORs every key's skipped condition together, all against transactionDate (skips have no journalDate)", async () => {
        const where = await run({
            from: "2026-09-01",
            to: "2026-09-16",
            journalKey: "any",
            journalStatus: "skipped",
        });

        const [combined] = literalsOf(where);
        ["transaction", "refund", "cashback", "cashbackReversal", "adminRefund"].forEach(key => {
            expect(combined).toContain(`JSON_EXTRACT(\`orders\`.\`journalData\`, '$.${key}.skipped') = true`);
        });
        // Every branch uses transactionDate for a skip — count them rather than pick one.
        const occurrences = combined.split("`orders`.`transactionDate` BETWEEN").length - 1;
        expect(occurrences).toBe(5);
    });

    it("lists, for any key not recorded, only the successful sales whose transaction journal never ran — the dashboard card's own rule", async () => {
        const where = await run({
            from: "2026-09-01",
            to: "2026-09-16",
            journalKey: "any",
            journalStatus: "notRecorded",
        });

        expect(where.status).toBe("SUCCESS");
        expect(where.transactionDate[Op.between]).toEqual(["2026-09-01 00:00:00", "2026-09-16 23:59:59"]);
        const literals = literalsOf(where);
        expect(literals).toHaveLength(1);
        expect(literals[0]).toBe(
            "JSON_EXTRACT(`orders`.`journalRecordStatus`, '$.transaction') IS NULL AND COALESCE(JSON_EXTRACT(`orders`.`journalData`, '$.transaction.skipped') = true, false) = false"
        );
        expect(literals[0]).not.toContain("'$.refund')");
    });

    it("applies the same rule when Sales is the chosen key, so a failed payment is never listed as not recorded", async () => {
        const where = await run({
            from: "2026-09-01",
            to: "2026-09-16",
            journalKey: "transaction",
            journalStatus: "notRecorded",
        });

        expect(where.status).toBe("SUCCESS");
        expect(where.transactionDate).toBeDefined();
        expect(literalsOf(where).some(sql => sql.includes("journalRecordStatus`, '$.transaction') IS NULL"))).toBe(true);
    });

    it("keeps a refund's own not-recorded view on its own key, without the sale's status rule", async () => {
        const where = await run({
            from: "2026-09-01",
            to: "2026-09-16",
            journalKey: "refund",
            journalStatus: "notRecorded",
        });

        expect(where.status).toBeUndefined();
        expect(literalsOf(where).some(sql => sql.includes("journalRecordStatus`, '$.refund') IS NULL"))).toBe(true);
    });

    it("falls back to a plain date-range filter for journalKey=any with no failed/skipped status", async () => {
        const where = await run({ from: "2026-09-01", to: "2026-09-16", journalKey: "any" });

        expect(where.transactionDate).toBeDefined();
        expect(literalsOf(where)).toHaveLength(0);
    });
});

describe("getOrderJournals — partner filter", () => {
    const RANGE = { from: "2026-09-01", to: "2026-09-16" };
    const PEKO_DIRECT = "`credential`.`registeredBy` NOT REGEXP '^[0-9]+$'";

    beforeEach(() => jest.clearAllMocks());

    it("lists every partner's orders when no partner is asked for", async () => {
        const where = await run(RANGE);

        expect(where["$credential.registeredBy$"]).toBeUndefined();
        expect(literalsOf(where).some(sql => sql.includes("registeredBy"))).toBe(false);
    });

    it("keeps the orders of the chosen partner's customers", async () => {
        const where = await run({ ...RANGE, partnerId: "55" });

        expect(where["$credential.registeredBy$"]).toBe("55");
        expect(literalsOf(where).some(sql => sql.includes(PEKO_DIRECT))).toBe(false);
    });

    it("keeps Peko's own customers for Default, including a partner value that is not a number", async () => {
        const where = await run({ ...RANGE, partnerId: "default" });

        expect(where["$credential.registeredBy$"]).toBeUndefined();
        const literals = literalsOf(where);
        expect(literals.some(sql => sql.includes("`credential`.`registeredBy` IS NULL"))).toBe(true);
        expect(literals.some(sql => sql.includes(PEKO_DIRECT))).toBe(true);
    });

    it("combines Default with a journal status filter", async () => {
        const where = await run({ ...RANGE, partnerId: "default", journalStatus: "failed" });

        const literals = literalsOf(where);
        expect(literals).toHaveLength(2);
        expect(literals.some(sql => sql.includes("journalRecordStatus`, '$.transaction') = false"))).toBe(true);
        expect(literals.some(sql => sql.includes(PEKO_DIRECT))).toBe(true);
    });

    it("ignores a partner value that is neither an id nor Default", async () => {
        const where = await run({ ...RANGE, partnerId: "55 OR 1=1" });

        expect(where["$credential.registeredBy$"]).toBeUndefined();
        expect(literalsOf(where).some(sql => sql.includes("1=1"))).toBe(false);
    });

    it("locks a partner's own session to its tree whatever the query asks for", async () => {
        const asked = await run({ ...RANGE, partnerId: "55" }, { id: 77, registeredBy: "77" });
        expect(asked["$credential.registeredBy$"]).toBe("77");

        jest.clearAllMocks();
        const askedDefault = await run({ ...RANGE, partnerId: "default" }, { id: 77, registeredBy: 77 });
        expect(askedDefault["$credential.registeredBy$"]).toBe("77");
        expect(literalsOf(askedDefault).some(sql => sql.includes(PEKO_DIRECT))).toBe(false);
    });
});
