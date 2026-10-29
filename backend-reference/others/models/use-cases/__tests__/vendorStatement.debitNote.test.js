const { manualEntryLine } = require("../vendorStatement");

describe("a debit note raised on a vendor, on the statement", () => {
    it("is worded as a debit note and sits on the debit side, the mirror of a cost of sales", () => {
        const line = manualEntryLine({
            kind: "DEBIT_NOTE",
            reference: "DN-4",
            issueDate: "2026-10-20",
            amount: "118.0000",
            entryType: "ENTRY",
        });
        expect(line).toMatchObject({ particulars: "Debit note", reference: null, type: "Debit note", debit: 118, credit: null });

        const costOfSales = manualEntryLine({
            kind: "COST_OF_SALES",
            reference: "CS-3",
            issueDate: "2026-10-19",
            amount: "118.0000",
            entryType: "ENTRY",
        });
        expect([costOfSales.type, costOfSales.debit, costOfSales.credit]).toEqual(["Cost of sales", null, 118]);
    });

    it("reads a reversal the other way round, still named as a debit note", () => {
        const reversal = manualEntryLine({
            kind: "DEBIT_NOTE",
            reference: "DN-4",
            issueDate: "2026-10-21",
            amount: "118.0000",
            entryType: "REVERSAL",
        });
        expect(reversal).toMatchObject({ particulars: "Reversal — debit note DN-4", type: "Reversal", debit: null, credit: 118 });
    });
});
