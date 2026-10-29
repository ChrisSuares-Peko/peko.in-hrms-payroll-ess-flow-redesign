const sequelizeConfig = require("../../../../configs/database/index");
const { listAllByPartner } = require("../../partnerPayouts");
const { listAllByPartner: listAllEntriesByPartner } = require("../../partnerLedgerEntries");
const { getPartnershipPayableAccountId } = require("../../partnerLedger");
const {
    PARTNER_STATEMENT_CONVENTION,
    buildAccrualQuery,
    buildUnpostedAccrualQuery,
    accrualLine,
    payoutLine,
    debitNoteLine,
    signedOf,
    buildPartnerStatement,
} = require("../../partnerStatement");

jest.mock("../../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../entities/credential", () => ({}));
jest.mock("../../../entities/partnerPayout", () => ({}));
jest.mock("../../chartOfAccount", () => ({
    findByAccountName: jest.fn(),
    findGenericAccountByName: jest.fn(),
}));
jest.mock("../../partnerPayouts", () => ({ listAllByPartner: jest.fn() }));
jest.mock("../../../entities/partnerLedgerEntry", () => ({}));
jest.mock("../../partnerLedgerEntries", () => ({
    ENTRY_KINDS: { debitNote: "DEBIT_NOTE" },
    listAllByPartner: jest.fn(),
}));
jest.mock("../../partnerLedger", () => ({
    JOURNAL_KEYS: ["transaction", "refund", "adminRefund", "cashback", "cashbackReversal"],
    UNANSWERED_STATUS: "PENDING",
    OPENING_FLOOR_JOIN: "LEFT JOIN openingFloor",
    AFTER_FLOOR: key => `${key} > :accountingFloor`,
    getPartnershipPayableAccountId: jest.fn(),
}));

const accrual = (entryDate, orderId, direction, amount, eventKey) => ({
    eventKey: eventKey || (direction === "credit" ? "transaction" : "refund"),
    entryDate,
    orderId,
    reference: `P${orderId}`,
    service: "Flights",
    direction,
    amount,
    eventVerdict: "true",
});

const payout = (id, payoutDate, amount, entryType = "PAYOUT") => ({
    id,
    payoutDate,
    amount,
    mode: "NEFT",
    reference: "NEFT-1",
    entryType,
    note: null,
});

const mockPostedRows = rows =>
    sequelizeConfig.query.mockImplementation(sql => Promise.resolve(sql.includes("AS unposted") ? [] : rows));

const debitNote = (id, issueDate, amount, entryType = "ENTRY") => ({
    id,
    issueDate,
    amount,
    reference: "DN-1",
    entryType,
});

beforeEach(() => {
    jest.clearAllMocks();
    getPartnershipPayableAccountId.mockResolvedValue("payable-1");
    listAllEntriesByPartner.mockResolvedValue([]);
});

describe("reading the accruals", () => {
    it("asks for every journal event against the payable account", () => {
        const sql = buildAccrualQuery();

        expect(sql.split("UNION ALL")).toHaveLength(5);
        expect(sql).toContain("journalLines.accountId = :payableAccountId");
        expect(sql).toContain("customer.registeredBy = :partnerId");
        expect(sql).toContain("ORDER BY entryDate ASC");
    });
});

describe("the convention", () => {
    it("says which side raises what Peko owes", () => {
        expect(PARTNER_STATEMENT_CONVENTION).toContain("credit");
        expect(PARTNER_STATEMENT_CONVENTION).toContain("owes");
        expect(signedOf({ credit: 100, debit: null })).toBe(100);
        expect(signedOf({ credit: null, debit: 30 })).toBe(-30);
    });
});

describe("an itemized accrual row", () => {
    it("shows the transaction reference and earned amount", () => {
        expect(accrualLine(accrual("2026-09-02", 1, "credit", 23.6))).toMatchObject({
            date: "2026-09-02",
            particulars: "Earned — Flights",
            reference: "P1",
            type: "Earned",
            debit: null,
            credit: 23.6,
            posting: { state: "posted", note: null, detail: null },
        });
    });

    it("says why an accrual has not reached the books", () => {
        expect(
            accrualLine({ ...accrual("2026-09-02", 1, "credit", 23.6), eventVerdict: "false", eventReason: "Invalid account" })
                .posting
        ).toEqual({ state: "notPosted", note: "Books refused it", detail: "Invalid account" });
    });

    it("marks a payout as never going to the books", () => {
        expect(payoutLine(payout(1, "2026-09-10", 23.6)).posting).toEqual({
            state: "notApplicable",
            note: null,
            detail: null,
        });
    });

    it("shows refunds as individual debit rows", () => {
        expect(accrualLine(accrual("2026-09-05", 2, "debit", 23.6, "refund"))).toMatchObject({
            reference: "P2",
            type: "Refund",
            debit: 23.6,
            credit: null,
        });
    });
});

describe("a payout row", () => {
    it("is a debit that settles what is owed", () => {
        expect(payoutLine(payout(1, "2026-09-10", 30))).toMatchObject({
            type: "Payout",
            debit: 30,
            credit: null,
            reference: "NEFT-1",
        });
    });

    it("puts a reversed payout back", () => {
        expect(payoutLine(payout(2, "2026-09-12", 30, "REVERSAL"))).toMatchObject({
            type: "Reversal",
            debit: null,
            credit: 30,
        });
    });
});

describe("a debit note row", () => {
    it("is a debit that settles what is owed, like a payout", () => {
        expect(debitNoteLine(debitNote(1, "2026-09-10", 20))).toMatchObject({
            particulars: "Debit note",
            reference: null,
            type: "Debit note",
            debit: 20,
            credit: null,
            posting: { state: "notApplicable" },
        });
    });

    it("puts a reversed debit note back", () => {
        expect(debitNoteLine(debitNote(2, "2026-09-12", 20, "REVERSAL"))).toMatchObject({
            particulars: "Reversal — debit note DN-1",
            type: "Reversal",
            debit: null,
            credit: 20,
        });
    });
});

describe("the statement", () => {
    it("asks for the partner's debit notes alone, unscoped by any date", async () => {
        mockPostedRows([]);
        listAllByPartner.mockResolvedValue([]);

        await buildPartnerStatement({ partnerId: 55, range: { from: "2026-09-01", to: "2026-09-30" } });

        expect(listAllEntriesByPartner).toHaveBeenCalledWith({
            partnerCredentialId: 55,
            kind: "DEBIT_NOTE",
            range: null,
        });
    });

    it("settles with a debit note the way a payout does, and puts a reversed one back", async () => {
        mockPostedRows([
            accrual("2026-09-02", 1, "credit", 23.6),
            accrual("2026-09-10", 3, "credit", 11.8),
        ]);
        listAllByPartner.mockResolvedValue([payout(1, "2026-09-10", 30)]);
        listAllEntriesByPartner.mockResolvedValue([
            debitNote(1, "2026-09-10", 5),
            debitNote(2, "2026-09-12", 5, "REVERSAL"),
        ]);

        const statement = await buildPartnerStatement({ partnerId: 55 });

        expect(statement.rows.map(row => [row.type, row.debit, row.credit])).toEqual([
            ["Earned", null, 23.6],
            ["Earned", null, 11.8],
            ["Payout", 30, null],
            ["Debit note", 5, null],
            ["Reversal", null, 5],
        ]);
        expect(statement.closingBalance).toBe(5.4);
    });

    it("lists each accrual before its payout and leaves later orders itemized", async () => {
        mockPostedRows([
            accrual("2026-09-02", 1, "credit", 23.6),
            accrual("2026-09-09", 3, "credit", 11.8),
            accrual("2026-09-18", 4, "credit", 118),
        ]);
        listAllByPartner.mockResolvedValue([payout(1, "2026-09-10", 30)]);

        const statement = await buildPartnerStatement({ partnerId: 55 });

        expect(statement.rows.map(row => [row.type, row.reference, row.debit, row.credit])).toEqual([
            ["Earned", "P1", null, 23.6],
            ["Earned", "P3", null, 11.8],
            ["Payout", "NEFT-1", 30, null],
            ["Earned", "P4", null, 118],
        ]);
        expect(statement.closingBalance).toBe(123.4);
    });

    it("never lets a reversal close a period", async () => {
        mockPostedRows([accrual("2026-09-02", 1, "credit", 23.6)]);
        listAllByPartner.mockResolvedValue([
            payout(1, "2026-09-10", 30),
            payout(2, "2026-09-12", 30, "REVERSAL"),
        ]);

        const statement = await buildPartnerStatement({ partnerId: 55 });

        expect(statement.rows.map(row => row.type)).toEqual(["Earned", "Payout", "Reversal"]);
        expect(statement.closingBalance).toBe(23.6);
    });

    it("keeps opening plus credits minus debits equal to closing", async () => {
        mockPostedRows([
            accrual("2026-09-02", 1, "credit", 23.6),
            accrual("2026-09-18", 4, "credit", 118),
        ]);
        listAllByPartner.mockResolvedValue([payout(1, "2026-09-10", 30)]);

        const statement = await buildPartnerStatement({ partnerId: 55 });

        expect(
            Math.round(
                (statement.openingBalance + statement.totalCredit - statement.totalDebit) * 100
            ) / 100
        ).toBe(statement.closingBalance);
    });

    it("opens a ranged view from everything that came before it", async () => {
        mockPostedRows([
            accrual("2026-09-02", 1, "credit", 23.6),
            accrual("2026-09-18", 4, "credit", 118),
        ]);
        listAllByPartner.mockResolvedValue([payout(1, "2026-09-10", 30)]);

        const statement = await buildPartnerStatement({
            partnerId: 55,
            range: { from: "2026-09-15", to: "2026-09-30" },
        });

        expect(statement.openingBalance).toBe(-6.4);
        expect(statement.rows.map(row => row.type)).toEqual(["Earned"]);
        expect(statement.closingBalance).toBe(111.6);
    });

    it("says nothing at all when no payable account is configured", async () => {
        getPartnershipPayableAccountId.mockResolvedValue(null);
        listAllByPartner.mockResolvedValue([]);

        const statement = await buildPartnerStatement({ partnerId: 55 });

        expect(statement.rows).toEqual([]);
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
    });
});

describe("entries that never reached the books", () => {
    it("counts no line of a skipped or never recorded entry", () => {
        [buildAccrualQuery()].forEach(sql => {
            ["transaction","refund","adminRefund","cashback","cashbackReversal"].forEach(key => {
                expect(sql).toContain(`JSON_EXTRACT(orders.journalRecordStatus, '$.${key}')) = 'true'`);
                expect(sql).toContain(`JSON_EXTRACT(orders.journalData, '$.${key}.skipped')), 'false') <> 'true'`);
            });
        });
    });
});

describe("entries that never reached the books stay on the statement with a dash", () => {
    it("asks for every event of the partner's customers' orders that was skipped or never recorded", () => {
        const sql = buildUnpostedAccrualQuery();
        expect(sql).toContain("'transaction' AS eventKey");
        expect(sql).toContain("NULL AS amount");
        expect(sql).toContain("JSON_EXTRACT(orders.journalRecordStatus, '$.transaction')) IS NULL");
        expect(sql).toContain("JSON_EXTRACT(orders.journalData, '$.refund') IS NOT NULL");
        expect(sql).toContain("customer.registeredBy = :partnerId");
        expect(sql).toContain("orders.status <> 'PENDING'");
    });

    it("keeps the balance where it was across a dashed line", async () => {
        sequelizeConfig.query.mockImplementation(sql => Promise.resolve(sql.includes("AS unposted") ? [{ eventKey: "transaction", entryDate: "2026-09-03", orderId: 9, reference: "TXN-9", service: "Flights", eventVerdict: null }] : []));
        listAllByPartner.mockResolvedValue([]);
        const statement = await buildPartnerStatement({ partnerId: 55 });
        expect(statement.rows[0]).toMatchObject({ particulars: "Earned — Flights", debit: null, credit: null, balance: 0, posting: { note: "Not recorded yet" } });
        expect(statement.closingBalance).toBe(0);
    });
});
