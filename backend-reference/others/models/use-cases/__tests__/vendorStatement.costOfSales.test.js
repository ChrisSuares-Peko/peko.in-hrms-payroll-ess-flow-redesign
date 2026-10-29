const { manualEntryLine } = require("../vendorStatement");

describe("a cost of sales recorded by hand on the statement", () => {
    it("is worded as cost of sales and sits on the credit side, the mirror of a commission", () => {
        const line = manualEntryLine({
            kind: "COST_OF_SALES",
            reference: "CS-3",
            issueDate: "2026-09-19",
            amount: "118.0000",
            entryType: "ENTRY",
        });
        expect(line).toMatchObject({ particulars: "Cost of sales", reference: null, type: "Cost of sales", debit: null, credit: 118 });

        const commission = manualEntryLine({
            kind: "COMMISSION",
            reference: "CM-1",
            issueDate: "2026-09-19",
            amount: "50.0000",
            entryType: "ENTRY",
        });
        expect([commission.type, commission.debit, commission.credit]).toEqual(["Commission", 50, null]);
    });

    it("reads a reversal the other way round, still named as cost of sales", () => {
        const reversal = manualEntryLine({
            kind: "COST_OF_SALES",
            reference: "CS-3",
            issueDate: "2026-09-20",
            amount: "118.0000",
            entryType: "REVERSAL",
        });
        expect(reversal).toMatchObject({ particulars: "Reversal — cost of sales CS-3", type: "Reversal", debit: 118, credit: null });
    });

    it("keeps a credit note on the credit side", () => {
        const note = manualEntryLine({ kind: "CREDIT_NOTE", reference: "CN-7", issueDate: "2026-09-21", amount: "250", entryType: "ENTRY" });
        expect([note.type, note.debit, note.credit]).toEqual(["Credit note", null, 250]);
    });
});
