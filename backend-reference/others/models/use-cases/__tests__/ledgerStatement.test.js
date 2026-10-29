const {
    MAX_ROWS,
    entryRow,
    tallyStatement,
    statementExcelRows,
} = require("../ledgerStatement");
const { NOT_APPLICABLE, POSTED } = require("../journalPosting");

const REFUSED = { state: "notPosted", note: "Books refused it", detail: "Account not found" };

describe("entryRow", () => {
    it("puts the amount on one side only and treats a line with no journal as not applicable", () => {
        expect(
            entryRow({ date: "2026-09-02", particulars: "x", reference: "", type: "T", side: "debit", amount: "12.345" })
        ).toEqual({
            date: "2026-09-02",
            particulars: "x",
            reference: null,
            entryNumber: null,
            type: "T",
            debit: 12.35,
            credit: null,
            posting: NOT_APPLICABLE,
        });
        expect(entryRow({ side: "credit", amount: 5, posting: REFUSED }).credit).toBe(5);
        expect(entryRow({ side: "credit", amount: null })).toMatchObject({ debit: null, credit: null });
        expect(entryRow({ side: "credit", amount: 5, posting: REFUSED }).posting).toEqual(REFUSED);
        expect(entryRow({ side: "debit", amount: 1, entryNumber: "DEP-000004" }).entryNumber).toBe("DEP-000004");
    });
});

describe("tallyStatement", () => {
    const rows = [
        { date: new Date("2026-09-02T10:00:00.000Z"), debit: null, credit: 1000 },
        { date: "2026-09-05", debit: 250, credit: null },
        { date: "2026-09-09", debit: 10.5, credit: null },
    ];

    it("walks the balance with the caller's sign convention", () => {
        const bank = tallyStatement({
            rows,
            openingBalance: 100,
            signedOf: row => (row.credit || 0) - (row.debit || 0),
        });
        expect(bank.rows.map(row => row.balance)).toEqual([1100, 850, 839.5]);
        expect(bank.totalDebit).toBe(260.5);
        expect(bank.totalCredit).toBe(1000);
        expect(bank.closingBalance).toBe(839.5);

        const prepaid = tallyStatement({
            rows,
            openingBalance: 100,
            signedOf: row => (row.debit || 0) - (row.credit || 0),
        });
        expect(prepaid.rows.map(row => row.balance)).toEqual([-900, -650, -639.5]);
        expect(prepaid.closingBalance).toBe(-639.5);
    });

    it("normalises every date to a day and ties closing to the last line", () => {
        const result = tallyStatement({ rows, openingBalance: 0, signedOf: () => 1 });
        expect(result.rows.map(row => row.date)).toEqual(["2026-09-02", "2026-09-05", "2026-09-09"]);
        expect(result.closingBalance).toBe(result.rows[result.rows.length - 1].balance);
    });

    it("returns the opening as closing when there are no lines", () => {
        expect(tallyStatement({ rows: [], openingBalance: 42.004, signedOf: () => 0 })).toEqual({
            rows: [],
            totalDebit: 0,
            totalCredit: 0,
            closingBalance: 42,
        });
    });
});

describe("statementExcelRows", () => {
    const statement = {
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
                posting: REFUSED,
            },
            {
                date: "2026-09-03",
                particulars: "Deposit",
                reference: null,
                entryNumber: "DEP-000004",
                type: "Deposit",
                debit: 1,
                credit: null,
                balance: 199001,
                posting: NOT_APPLICABLE,
            },
            {
                date: "2026-09-04",
                particulars: "Refund",
                reference: "TXN-1",
                type: "Refund",
                debit: 1,
                credit: null,
                balance: 199002,
                posting: POSTED,
            },
        ],
    };

    it("keeps the vendor column header by default", () => {
        const rows = statementExcelRows(statement, "Cleartrip");
        expect(rows).toHaveLength(5);
        expect(rows[0]).toMatchObject({ Particulars: "Opening balance", Vendor: "Cleartrip" });
        expect(rows[4]).toMatchObject({ Particulars: "Closing balance", Balance: 199059 });
        expect(rows[1].Subscriber).toBeUndefined();
    });

    it("labels the party column for other ledgers", () => {
        const rows = statementExcelRows(statement, "Al Rams Trading", "Subscriber");
        expect(rows[1]).toMatchObject({ Subscriber: "Al Rams Trading", Credit: 1000, Debit: "", "Entry No.": "" });
        expect(rows[2]["Entry No."]).toBe("DEP-000004");
        expect(rows[0]["Entry No."]).toBe("");
        expect(rows[1].Vendor).toBeUndefined();
    });

    it("spells out each posting state with its reason and keeps amounts numeric", () => {
        const rows = statementExcelRows(statement, "x");
        expect(rows.map(row => row.Posted)).toEqual([
            "",
            "Not posted — Books refused it",
            "Not applicable",
            "Posted",
            "",
        ]);
        expect(typeof rows[1].Credit).toBe("number");
        expect(typeof rows[2].Debit).toBe("number");
    });

    it("caps statements at five thousand lines", () => {
        expect(MAX_ROWS).toBe(5000);
    });
});
