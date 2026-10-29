const {
    creditNoteStatusOf,
    filterCreditNotes,
    filterStatementRows,
    statementFilterLabel,
} = require("../vendorLedgerFilters");

const MANUAL = {
    reference: "CN-7",
    againstCorporateTxnId: "1790330538190",
    reason: "Duplicate booking",
    entryType: "ENTRY",
    status: "OPEN",
};
const REVERSAL = {
    reference: "1790330538190",
    againstCorporateTxnId: "1790330538190",
    reason: "Commission reversed on Xoxoday",
    entryType: "REVERSAL",
    status: "OPEN",
};
const VOIDED = {
    reference: "CN-3",
    againstCorporateTxnId: null,
    reason: "Raised in error",
    entryType: "ENTRY",
    status: "VOIDED",
};
const NOTES = [MANUAL, REVERSAL, VOIDED];

describe("creditNoteStatusOf", () => {
    it("reads a credit note the way the Status pill does: reversal first, then voided, else active", () => {
        expect(creditNoteStatusOf(REVERSAL)).toBe("reversal");
        expect(creditNoteStatusOf(VOIDED)).toBe("reversed");
        expect(creditNoteStatusOf(MANUAL)).toBe("active");
        expect(creditNoteStatusOf({ entryType: "REVERSAL", status: "VOIDED" })).toBe("reversal");
    });
});

describe("filterCreditNotes", () => {
    it("keeps every note when nothing is asked for", () => {
        expect(filterCreditNotes(NOTES)).toEqual(NOTES);
        expect(filterCreditNotes(NOTES, { searchText: "", status: undefined })).toEqual(NOTES);
    });

    it("narrows to the status picked", () => {
        expect(filterCreditNotes(NOTES, { status: "active" })).toEqual([MANUAL]);
        expect(filterCreditNotes(NOTES, { status: "reversal" })).toEqual([REVERSAL]);
        expect(filterCreditNotes(NOTES, { status: "reversed" })).toEqual([VOIDED]);
    });

    it("ignores a status it does not know, so nothing it names narrows the list", () => {
        ["success", "constructor", "toString"].forEach(status => {
            expect(filterCreditNotes(NOTES, { status })).toEqual(NOTES);
        });
    });

    it("searches the credit note, the order it is against and the reason, whatever the case", () => {
        expect(filterCreditNotes(NOTES, { searchText: "cn-7" })).toEqual([MANUAL]);
        expect(filterCreditNotes(NOTES, { searchText: "1790330538" })).toEqual([MANUAL, REVERSAL]);
        expect(filterCreditNotes(NOTES, { searchText: "IN ERROR" })).toEqual([VOIDED]);
        expect(filterCreditNotes(NOTES, { searchText: "nothing like this" })).toEqual([]);
    });

    it("copes with a note that has no order or reason", () => {
        const bare = { reference: "CN-9", entryType: "ENTRY", status: "OPEN" };

        expect(filterCreditNotes([bare], { searchText: "cn-9" })).toEqual([bare]);
        expect(filterCreditNotes([bare], { searchText: "reason" })).toEqual([]);
    });

    it("keeps the search and the status together", () => {
        expect(filterCreditNotes(NOTES, { searchText: "1790330538", status: "reversal" })).toEqual([REVERSAL]);
        expect(filterCreditNotes(NOTES, { searchText: "cn-7", status: "reversal" })).toEqual([]);
    });
});

const ORDER_LINE = { particulars: "Order value — Xoxoday", reference: "1788761320899", type: "Order", debit: null, credit: 5000 };
const COMMISSION_LINE = { particulars: "Commission", reference: "1788761320899", type: "Commission", debit: 225, credit: null };
const DEPOSIT_LINE = { particulars: "Deposit — NEFT", reference: "UTR-1", type: "Deposit", debit: 3000, credit: null };
const LINES = [ORDER_LINE, COMMISSION_LINE, DEPOSIT_LINE];

describe("filterStatementRows", () => {
    it("keeps every line when nothing is asked for", () => {
        expect(filterStatementRows(LINES)).toEqual(LINES);
        expect(filterStatementRows(LINES, { searchText: "", side: "" })).toEqual(LINES);
    });

    it("keeps the debit lines, or the credit lines, by which column holds an amount", () => {
        expect(filterStatementRows(LINES, { side: "debit" })).toEqual([COMMISSION_LINE, DEPOSIT_LINE]);
        expect(filterStatementRows(LINES, { side: "credit" })).toEqual([ORDER_LINE]);
    });

    it("counts a zero amount as being on its side, because the table shows it there", () => {
        const zeroFee = { particulars: "Fee", reference: "F-1", type: "Fee", debit: 0, credit: null };

        expect(filterStatementRows([zeroFee], { side: "debit" })).toEqual([zeroFee]);
        expect(filterStatementRows([zeroFee], { side: "credit" })).toEqual([]);
    });

    it("searches the particulars, the reference and the type, whatever the case", () => {
        expect(filterStatementRows(LINES, { searchText: "COMMISSION" })).toEqual([COMMISSION_LINE]);
        expect(filterStatementRows(LINES, { searchText: "utr" })).toEqual([DEPOSIT_LINE]);
        expect(filterStatementRows(LINES, { searchText: "1788761320899" })).toEqual([ORDER_LINE, COMMISSION_LINE]);
        expect(filterStatementRows(LINES, { searchText: "xoxoday" })).toEqual([ORDER_LINE]);
    });

    it("ignores a side it does not know, so nothing it names narrows the list", () => {
        ["both", "constructor", "toString"].forEach(side => {
            expect(filterStatementRows(LINES, { side })).toEqual(LINES);
        });
    });

    it("keeps the search and the side together", () => {
        expect(filterStatementRows(LINES, { searchText: "1788761320899", side: "debit" })).toEqual([COMMISSION_LINE]);
        expect(filterStatementRows(LINES, { searchText: "utr", side: "credit" })).toEqual([]);
    });
});

describe("statementFilterLabel", () => {
    it("is empty when nothing is filtered", () => {
        expect(statementFilterLabel()).toBe("");
        expect(statementFilterLabel({ searchText: "", side: "" })).toBe("");
        expect(statementFilterLabel({ side: "constructor" })).toBe("");
    });

    it("names the side and the search", () => {
        expect(statementFilterLabel({ side: "debit" })).toBe("Debit only");
        expect(statementFilterLabel({ side: "credit", searchText: "utr" })).toBe('Credit only  ·  Search: "utr"');
        expect(statementFilterLabel({ searchText: "utr" })).toBe('Search: "utr"');
    });
});
