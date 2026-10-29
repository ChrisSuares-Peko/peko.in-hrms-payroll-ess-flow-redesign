const sequelizeConfig = require("../../../../configs/database/index");
const vendorDeposits = require("../../../entities/vendorDeposit");
const vendorLedgerEntries = require("../../../entities/vendorLedgerEntry");
const {
    MAX_ROWS,
    buildVendorStatementQuery,
    buildVendorUnpostedQuery,
    unpostedLine,
    orderLines,
    refundLines,
    movementLine,
    depositLine,
    manualEntryLine,
    statementExcelRows,
    buildVendorStatement,
} = require("../../vendorStatement");
const { POSTED, NOT_APPLICABLE } = require("../../journalPosting");

jest.mock("../../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../entities/vendor", () => ({ findAll: jest.fn(), findOne: jest.fn() }));
jest.mock("../../../entities/serviceOperator", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/order", () => ({ findAndCountAll: jest.fn() }));
jest.mock("../../../entities/credential", () => ({}));
jest.mock("../../../entities/vendorDeposit", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/vendorLedgerEntry", () => ({ findAll: jest.fn() }));
jest.mock("../../chartOfAccount", () => ({
    findByAccountName: jest.fn(),
    findGenericAccountByName: jest.fn(),
    findLegacyVendorDepositAccounts: jest.fn(),
}));
jest.mock("../../setting", () => ({ getASetting: jest.fn() }));
jest.mock("../../vendorDeposits", () => ({
    sumActiveDeposits: jest.fn(),
    sumActiveDepositsByVendor: jest.fn(),
    sumDepositsInRange: jest.fn(),
    listVendorsWithOpeningBalance: jest.fn(),
    findOpeningBalance: jest.fn(),
}));
jest.mock("../../vendorLedgerEntries", () => ({
    ENTRY_KINDS: { creditNote: "CREDIT_NOTE", commission: "COMMISSION" },
    sumManualEntries: jest.fn(),
    sumManualEntriesByVendor: jest.fn(),
    sumManualEntriesInRange: jest.fn(),
    countOpenEntries: jest.fn(),
}));

const ACCOUNTS = ["shared-account"];

const orderRow = extra => ({
    eventKey: "transaction",
    entryDate: "2026-09-02",
    reference: "TXN-1",
    service: "Flights",
    direction: "credit",
    amount: "941.0000",
    eventVerdict: "true",
    vendorPayable: "941.0000",
    commissionExcludingGST: "50.0000",
    commissionIncludingGST: "59.0000",
    ...extra,
});

beforeEach(() => {
    jest.clearAllMocks();
    vendorDeposits.findAll.mockResolvedValue([]);
    vendorLedgerEntries.findAll.mockResolvedValue([]);
    sequelizeConfig.query.mockResolvedValue([]);
});

describe("buildVendorStatementQuery", () => {
    it("returns a row per journal event rather than a grouped sum", () => {
        const sql = buildVendorStatementQuery({});

        expect(sql).not.toContain("GROUP BY");
        expect(sql).toContain("'transaction' AS eventKey");
        expect(sql).toContain("'refund' AS eventKey");
        expect(sql.match(/UNION ALL/g)).toHaveLength(4);
        expect(sql).toContain("ORDER BY entryDate ASC, reference ASC");
    });

    it("carries the vendor's price on items sold as principal, and only the vendor's share of a funded coupon", () => {
        const sql = buildVendorStatementQuery({});

        expect(sql).toContain("AS DECIMAL(16, 4)) AS principalSalesPayable");
        expect(sql).toContain("CONVERT(serviceOperators.commissionMode USING utf8mb4), 'MARGIN') AS commissionMode");
        expect(sql).not.toContain("contributedDiscount");
    });

    it("leaves every sale on a markup basis off the statement, agent or principal, and reads nothing off the order itself", () => {
        const sql = buildVendorStatementQuery({ range: { from: "a", to: "b" }, floorDate: "2026-08-19" });

        expect(sql.match(/NOT IN \('AGENT_MARKUP', 'PRINCIPAL_MARKUP'\)/g)).toHaveLength(5);
        expect(sql).toContain("= 'AGENT_MARKUP' THEN 'AGENT_MARKUP' ELSE COALESCE(");
        expect(sql).not.toContain("principalSalesPayable')) AS DECIMAL(16, 4)), 0) > 0");
        expect(sql).not.toContain("'$.journalAccountIds.sales'");
        expect(sql).not.toContain("NOT EXISTS (");
        expect(sql).not.toContain("CONVERT('credit'");
    });

    it("keeps the guards the grouped query needed", () => {
        const sql = buildVendorStatementQuery({});

        expect(sql).toContain("CROSS JOIN JSON_TABLE(");
        expect(sql).toContain("COALESCE(JSON_EXTRACT(orders.journalData, '$.transaction.lineItems'), JSON_ARRAY())");
        expect(sql).toContain(") AS journalLines");
        expect(sql).toContain("journalLines.accountId IN (:accountIds)");
    });

    it("dates each line by its own event, casting the json string to a date", () => {
        const sql = buildVendorStatementQuery({ range: { from: "a", to: "b" } });

        expect(sql).toContain(
            "CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.refund.journalDate')) AS DATE)"
        );
        expect(sql).toContain("BETWEEN :from AND :to");
        expect(sql).not.toContain("orders.transactionDate BETWEEN");
    });

    it("floors at the opening balance only when there is one", () => {
        expect(buildVendorStatementQuery({})).not.toContain(":floorDate");
        expect(buildVendorStatementQuery({ floorDate: "2026-08-19" })).toContain("> :floorDate");
    });
});

describe("line composition", () => {
    it("credits the order value then debits back what is not the vendor's money", () => {
        expect(orderLines(orderRow()).map(row => [row.particulars, row.debit, row.credit])).toEqual([
            ["Order value — Flights", null, 1000],
            ["Commission", 59, null],
        ]);
    });

    it("carries the tax inside the commission line rather than splitting it", () => {
        expect(orderLines(orderRow()).map(row => row.particulars)).not.toContain(
            "GST on commission"
        );
    });

    it("nets the component lines to what reached the deposit account", () => {
        const net = orderLines(orderRow()).reduce(
            (sum, row) => sum + (row.debit || 0) - (row.credit || 0),
            0
        );

        expect(Math.round(net * 100) / 100).toBe(-941);
    });

    it("leaves the principal items of a mixed order out of the order value, since they never came out of the advance", () => {
        const mixed = orderLines(orderRow({ principalSalesPayable: "452.0000", commissionMode: "MIXED" }));
        expect(mixed.map(row => [row.particulars, row.debit, row.credit])).toEqual([
            ["Order value — Flights", null, 1000],
            ["Commission", 59, null],
        ]);
        expect(
            Math.round(mixed.reduce((sum, row) => sum + (row.debit || 0) - (row.credit || 0), 0) * 100) / 100
        ).toBe(-941);
    });

    it("reverses a mixed order's margin part in the same proportion as the rest, with no principal share", () => {
        const rows = refundLines(
            orderRow({
                eventKey: "refund",
                entryDate: "2026-09-09",
                direction: "debit",
                amount: "470.5000",
                principalSalesPayable: "452.0000",
                commissionMode: "MIXED",
            })
        );

        expect(rows.map(row => [row.particulars, row.debit, row.credit])).toEqual([
            ["Order value reversed — Flights", 500, null],
            ["Commission reversed", null, 29.5],
        ]);
    });

    it("reads a full refund back as the order's own parts", () => {
        const rows = refundLines(
            orderRow({ eventKey: "refund", entryDate: "2026-09-09", direction: "debit" })
        );

        expect(rows.map(row => [row.particulars, row.debit, row.credit])).toEqual([
            ["Order value reversed — Flights", 1000, null],
            ["Commission reversed", null, 59],
        ]);
        expect(rows.every(row => row.type === "Refund")).toBe(false);
        expect(rows[0].type).toBe("Refund");
    });

    it("scales a partial refund by how much of the receivable came back", () => {
        const rows = refundLines(
            orderRow({
                eventKey: "adminRefund",
                entryDate: "2026-09-09",
                direction: "debit",
                amount: "470.5000",
            })
        );

        expect(rows.map(row => [row.particulars, row.debit, row.credit])).toEqual([
            ["Order value reversed — Flights", 500, null],
            ["Commission reversed", null, 29.5],
        ]);
        expect(rows[0].type).toBe("Admin refund");
    });

    it("nets every refund group back to the amount that actually moved", () => {
        [941, 470.5, 1, 941.37].forEach(amount => {
            const net = refundLines(
                orderRow({ eventKey: "refund", direction: "debit", amount: String(amount) })
            ).reduce((sum, row) => sum + (row.debit || 0) - (row.credit || 0), 0);

            expect(Math.round(net * 100) / 100).toBe(amount);
        });
    });

    it("falls back to one line when the order never reached the vendor", () => {
        const rows = refundLines(
            orderRow({ eventKey: "refund", direction: "debit", vendorPayable: "0.0000" })
        );

        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ particulars: "Refund — Flights", debit: 941 });
    });

    it("leaves anything the journal does not restate as the single amount that moved", () => {
        expect(
            movementLine({
                eventKey: "cashback",
                entryDate: "2026-09-09",
                reference: "TXN-1",
                service: "Flights",
                direction: "credit",
                amount: "12.0000",
                eventVerdict: "true",
            })
        ).toMatchObject({ particulars: "Cashback — Flights", debit: null, credit: 12, posting: POSTED });
    });

    it("says whether each journal line reached the books and why it did not", () => {
        expect(orderLines(orderRow())[0].posting).toEqual(POSTED);
        expect(orderLines(orderRow({ eventVerdict: "false", eventReason: "Account missing" }))[0].posting).toEqual({
            state: "notPosted",
            note: "Books refused it",
            detail: "Account missing",
        });
        expect(
            orderLines(
                orderRow({
                    eventVerdict: "false",
                    eventSkipped: "true",
                    eventReason: "Journal recording is currently paused",
                })
            )[0].posting.note
        ).toBe("Recording paused");
        expect(orderLines(orderRow({ eventVerdict: null }))[0].posting).toMatchObject({
            state: "notPosted",
            note: "Not recorded yet",
        });
    });

    it("gives the commission and discount lines the status of the order they came from", () => {
        const lines = orderLines(orderRow({ eventVerdict: "false" }));
        expect(lines.length).toBeGreaterThan(1);
        lines.forEach(line => expect(line.posting).toMatchObject({ state: "notPosted", note: "Books refused it" }));
    });

    it("marks deposits and manual entries as never going to the books", () => {
        expect(
            depositLine({ entryType: "DEPOSIT", depositDate: "2026-09-05", amount: 1, reference: "UTR-1" }).posting
        ).toEqual(NOT_APPLICABLE);
        expect(
            manualEntryLine({ kind: "CREDIT_NOTE", entryType: "ENTRY", issueDate: "2026-09-11", amount: 1, reference: "CN-1" })
                .posting
        ).toEqual(NOT_APPLICABLE);
    });

    it("debits funding and credits a reversal of it", () => {
        expect(
            depositLine({ entryType: "DEPOSIT", depositDate: "2026-09-05", amount: 50000, mode: "NEFT", reference: "UTR-1" })
        ).toMatchObject({ type: "Deposit", debit: 50000, credit: null });

        expect(
            depositLine({ entryType: "OPENING", depositDate: "2026-08-19", amount: 200000 })
        ).toMatchObject({ particulars: "Opening balance", debit: 200000 });

        expect(
            depositLine({ entryType: "REVERSAL", depositDate: "2026-09-06", amount: 50000, note: "wrong vendor" })
        ).toMatchObject({ type: "Reversal", debit: null, credit: 50000 });

        // A credit note gives value back, so it consumes the advance the way an order does.
        expect(
            manualEntryLine({ kind: "CREDIT_NOTE", entryType: "ENTRY", issueDate: "2026-09-11", amount: 1500, reference: "CN-1" })
        ).toMatchObject({ type: "Credit note", particulars: "Credit note", reference: null, debit: null, credit: 1500 });

        expect(
            manualEntryLine({ kind: "CREDIT_NOTE", entryType: "REVERSAL", issueDate: "2026-09-12", amount: 1500, reference: "CN-1" })
        ).toMatchObject({ type: "Reversal", particulars: "Reversal — credit note CN-1", debit: 1500, credit: null });
    });

    it("gives a manually recorded commission its own debit line", () => {
        // A commission charges the vendor, so it raises the advance the way a deposit does.
        expect(
            manualEntryLine({ kind: "COMMISSION", entryType: "ENTRY", issueDate: "2026-09-19", amount: 236, reference: "CM-14" })
        ).toMatchObject({ type: "Commission", particulars: "Commission", reference: null, debit: 236, credit: null });

        expect(
            manualEntryLine({ kind: "COMMISSION", entryType: "REVERSAL", issueDate: "2026-09-20", amount: 236, reference: "CM-14" })
        ).toMatchObject({ type: "Reversal", particulars: "Reversal — commission CM-14", debit: null, credit: 236 });
    });
});

describe("buildVendorStatement", () => {
    it("walks a running balance forward and ties the closing figure to it", async () => {
        sequelizeConfig.query.mockImplementation(sql => Promise.resolve(sql.includes("AS unposted") ? [] : [orderRow()]));
        vendorDeposits.findAll.mockResolvedValue([
            { entryType: "DEPOSIT", depositDate: "2026-09-05", amount: 50000, mode: "NEFT", reference: "UTR-1" },
        ]);

        const statement = await buildVendorStatement({ vendorId: 1, accountIds: ACCOUNTS, range: null });

        expect(statement.rows.map(row => row.balance)).toEqual([-1000, -941, 49059]);
        expect(statement.totalDebit).toBe(50059);
        expect(statement.totalCredit).toBe(1000);
        expect(statement.closingBalance).toBe(49059);
        expect(statement.rows[statement.rows.length - 1].balance).toBe(statement.closingBalance);
    });

    it("keeps opening plus debits minus credits equal to closing", async () => {
        sequelizeConfig.query.mockImplementation(sql => Promise.resolve(sql.includes("AS unposted") ? [] : [orderRow()]));

        const { openingBalance, totalDebit, totalCredit, closingBalance } =
            await buildVendorStatement({ vendorId: 1, accountIds: ACCOUNTS, range: null });

        expect(round(openingBalance + totalDebit - totalCredit)).toBe(closingBalance);
    });

    it("skips the journal query entirely when the vendor has no deposit account", async () => {
        const statement = await buildVendorStatement({ vendorId: 1, accountIds: [], range: null });

        expect(sequelizeConfig.query.mock.calls.every(([sql]) => sql.includes("AS unposted"))).toBe(true);
        expect(statement.rows).toEqual([]);
        expect(statement.closingBalance).toBe(0);
    });

    it("passes the opening date through as the floor for journal movements", async () => {
        await buildVendorStatement({
            vendorId: 1,
            accountIds: ACCOUNTS,
            range: null,
            openingAsOf: "2026-08-19",
        });

        expect(sequelizeConfig.query.mock.calls[0][0]).toContain("> :floorDate");
        expect(sequelizeConfig.query.mock.calls[0][1].replacements.floorDate).toBe("2026-08-19");
    });

    it("flags a statement that hit the row cap", async () => {
        vendorDeposits.findAll.mockResolvedValue(
            Array.from({ length: MAX_ROWS }, (_, index) => ({
                entryType: "DEPOSIT",
                depositDate: "2026-09-05",
                amount: 1,
                reference: `UTR-${index}`,
            }))
        );

        expect((await buildVendorStatement({ vendorId: 1, accountIds: ACCOUNTS, range: null })).truncated).toBe(true);
    });
});

describe("statementExcelRows", () => {
    it("brackets the movements with an opening and a closing row", () => {
        const rows = statementExcelRows(
            {
                openingBalance: 200000,
                totalDebit: 59,
                totalCredit: 1000,
                closingBalance: 199059,
                rows: [
                    {
                        date: "2026-09-02",
                        particulars: "Order value",
                        reference: "TXN-1",
                        type: "Order",
                        debit: null,
                        credit: 1000,
                        balance: 199000,
                        posting: { state: "notPosted", note: "Books refused it", detail: null },
                    },
                ],
            },
            "Cleartrip"
        );

        expect(rows).toHaveLength(3);
        expect(rows[0]).toMatchObject({ Particulars: "Opening balance", Balance: 200000 });
        expect(rows[2]).toMatchObject({ Particulars: "Closing balance", Balance: 199059 });
        // Numbers stay numbers so they can be summed and filtered in Excel.
        expect(typeof rows[1].Credit).toBe("number");
        expect(rows[1].Debit).toBe("");
        expect(rows[1].Posted).toBe("Not posted — Books refused it");
    });

    it("spells out each posting state rather than leaving a blank cell", () => {
        const statement = {
            openingBalance: 0,
            totalDebit: 0,
            totalCredit: 0,
            closingBalance: 0,
            rows: [
                { date: "2026-09-02", particulars: "a", reference: null, type: "Order", debit: 1, credit: null, balance: 1, posting: POSTED },
                { date: "2026-09-03", particulars: "b", reference: null, type: "Deposit", debit: 1, credit: null, balance: 2, posting: NOT_APPLICABLE },
            ],
        };

        expect(statementExcelRows(statement, "Cleartrip").map(row => row.Posted)).toEqual([
            "",
            "Posted",
            "Not applicable",
            "",
        ]);
    });
});

const round = value => Math.round((value + Number.EPSILON) * 100) / 100;

describe("entries that never reached the books", () => {
    it("counts no line of a skipped or never recorded entry", () => {
        [buildVendorStatementQuery({})].forEach(sql => {
            ["transaction","refund"].forEach(key => {
                expect(sql).toContain(`JSON_EXTRACT(orders.journalRecordStatus, '$.${key}')) = 'true'`);
                expect(sql).toContain(`JSON_EXTRACT(orders.journalData, '$.${key}.skipped')), 'false') <> 'true'`);
            });
        });
    });
});

describe("entries that never reached the books stay on the statement with a dash", () => {
    it("asks for every event of the vendor's orders that was skipped or never recorded", () => {
        const sql = buildVendorUnpostedQuery({});
        expect(sql).toContain("'transaction' AS eventKey");
        expect(sql).toContain("NULL AS amount");
        expect(sql).toContain("JSON_EXTRACT(orders.journalRecordStatus, '$.transaction')) IS NULL");
        expect(sql).toContain("JSON_EXTRACT(orders.journalData, '$.refund') IS NOT NULL");
        expect(sql).not.toContain("JSON_EXTRACT(orders.journalData, '$.transaction') IS NOT NULL");
        expect(sql).toContain("orders.status <> 'PENDING'");
        expect(sql).toContain("<> 'OWN_REVENUE'");
        expect(sql).not.toContain("<> 'PRINCIPAL_MARKUP'");
        expect(sql).toContain("NOT IN ('AGENT_MARKUP', 'PRINCIPAL_MARKUP')");
        expect(buildVendorUnpostedQuery({ range: { from: "a", to: "b" }, floorDate: "2026-08-19" })).toContain("> :floorDate");
    });

    it("lists the line with no amount on either side and the reason it never posted", () => {
        const line = unpostedLine({ eventKey: "transaction", entryDate: "2026-10-01", reference: "TXN-9", service: "Flights", eventVerdict: "false", eventSkipped: "true", eventReason: "Journal recording is currently paused" });
        expect(line).toMatchObject({ particulars: "Order value — Flights", type: "Order", debit: null, credit: null });
        expect(line.posting).toMatchObject({ state: "notPosted", note: "Recording paused" });
    });

    it("keeps the running balance where it was across a dashed line", async () => {
        sequelizeConfig.query.mockImplementation(sql => Promise.resolve(sql.includes("AS unposted") ? [{ eventKey: "transaction", entryDate: "2026-09-03", orderId: 9, reference: "TXN-9", service: "Flights", eventVerdict: null }] : [orderRow()]));
        const statement = await buildVendorStatement({ vendorId: 1, accountIds: ACCOUNTS, range: null });
        const dashed = statement.rows.find(row => row.reference === "TXN-9");
        expect(dashed).toMatchObject({ debit: null, credit: null, posting: { note: "Not recorded yet" } });
        expect(statement.totalCredit).toBe(1000);
        expect(statement.closingBalance).toBe(-941);
    });
});
