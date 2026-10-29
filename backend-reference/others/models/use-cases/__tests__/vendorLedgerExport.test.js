const {
    vendorTransactionExportColumns,
    vendorCommissionExportColumns,
    vendorDepositExportColumns,
    vendorCreditNoteExportColumns,
    vendorCostOfSalesExportColumns,
    VENDOR_COST_OF_SALES_STATUS_LABELS,
    vendorDebitNoteExportColumns,
    VENDOR_DEBIT_NOTE_STATUS_LABELS,
    vendorSummaryTiles,
    vendorSummaryNote,
} = require("../vendorLedgerExport");

const cellsOf = (columns, row) => columns.map(column => column.value(row));
const headersOf = columns => columns.map(column => column.header);

const POSTED = { state: "posted", note: null, detail: null };

const TRANSACTION = {
    transactionDate: "2026-09-25T06:14:02.000Z",
    corporateTxnId: "1790330777639",
    commissionMode: "MARGIN",
    service: "Xoxoday",
    customer: "100001238",
    vendorAmount: 100,
    commission: 8.26,
    markup: null,
    receivable: 91.74,
    status: "SUCCESS",
    refunded: false,
    posting: POSTED,
};

const COMMISSION = {
    source: "ORDER",
    entryNumber: null,
    transactionDate: "2026-09-25",
    corporateTxnId: "1790330538190",
    reference: null,
    service: "Xoxoday",
    reason: null,
    orderAmount: 100,
    commissionExcludingGST: 7,
    commissionGST: 1.26,
    commissionIncludingGST: 8.26,
    commissionReversed: 0,
    commissionNet: 8.26,
    refunded: false,
    posting: POSTED,
    status: null,
    entryType: null,
};

describe("vendorTransactionExportColumns", () => {
    it("lists the Transactions table's columns in the table's order", () => {
        expect(headersOf(vendorTransactionExportColumns())).toEqual([
            "Date",
            "Reference",
            "Sold As",
            "Service",
            "Customer",
            "Vendor Amount",
            "Commission (incl. VAT)",
            "Markup",
            "Payable",
            "Status",
            "Posted",
        ]);
    });

    it("writes one row of cells, with the date in IST and the money as numbers", () => {
        expect(cellsOf(vendorTransactionExportColumns(), TRANSACTION)).toEqual([
            "25 Sep 2026",
            "1790330777639",
            "Margin",
            "Xoxoday",
            "100001238",
            100,
            8.26,
            null,
            91.74,
            "Success",
            "Posted",
        ]);
        const money = vendorTransactionExportColumns().filter(column => column.money);
        expect(headersOf(money)).toEqual([
            "Vendor Amount",
            "Commission (incl. VAT)",
            "Markup",
            "Payable",
        ]);
    });

    it("writes a sale made as principal with the vendor's price and the markup, and the margin figures blank", () => {
        const cells = cellsOf(vendorTransactionExportColumns(), {
            ...TRANSACTION,
            vendorAmount: 882,
            commission: null,
            markup: 118,
            receivable: null,
        });

        expect(cells.slice(5, 9)).toEqual([882, null, 118, null]);
        expect(cells[2]).toBe("Margin");
        expect(cellsOf(vendorTransactionExportColumns(), { ...TRANSACTION, commissionMode: "PRINCIPAL_MARKUP" })[2]).toBe("Principal Markup");
        expect(cellsOf(vendorTransactionExportColumns(), { ...TRANSACTION, commissionMode: "AGENT_MARKUP" })[2]).toBe("Agent Markup");
        expect(cellsOf(vendorTransactionExportColumns(), { ...TRANSACTION, commissionMode: "MIXED" })[2]).toBe("Margin + Principal Markup");
        expect(cellsOf(vendorTransactionExportColumns(), { ...TRANSACTION, commissionMode: null })[2]).toBeNull();
    });

    it("calls any order with a refund on it Refunded, whatever the provider's own status says", () => {
        const [status] = cellsOf(vendorTransactionExportColumns(), { ...TRANSACTION, refunded: true }).slice(9, 10);

        expect(status).toBe("Refunded");
    });

    it("leaves the figures blank for an order whose journal never derived a split", () => {
        const cells = cellsOf(vendorTransactionExportColumns(), {
            ...TRANSACTION,
            vendorAmount: null,
            commission: null,
            markup: null,
            receivable: null,
            customer: null,
        });

        expect(cells.slice(4, 9)).toEqual([null, null, null, null, null]);
    });
});

describe("vendorCommissionExportColumns", () => {
    it("lists the Commissions table's columns in the table's order, without the Actions column", () => {
        expect(headersOf(vendorCommissionExportColumns())).toEqual([
            "Date",
            "Entry No.",
            "Order Ref",
            "Service",
            "Order Value",
            "Commission (excl. GST)",
            "GST",
            "Commission (incl. GST)",
            "Principal Markup",
            "Reversed",
            "Net",
            "Source",
            "Status",
            "In Books",
        ]);
    });

    it("writes an order's commission as it is, as Earned", () => {
        expect(cellsOf(vendorCommissionExportColumns(), COMMISSION)).toEqual([
            "25 Sep 2026",
            null,
            "1790330538190",
            "Xoxoday",
            100,
            7,
            1.26,
            8.26,
            null,
            null,
            8.26,
            "Order",
            "Earned",
            "Posted",
        ]);
    });

    it("writes the markup on the principal items of an order sold both ways beside its commission", () => {
        const cells = cellsOf(vendorCommissionExportColumns(), { ...COMMISSION, principalMarkup: 47.2 });

        expect(cells.slice(5, 9)).toEqual([7, 1.26, 8.26, 47.2]);
    });

    it("shows the commission that came back on a refund as a deduction, and calls the order Refunded", () => {
        const cells = cellsOf(vendorCommissionExportColumns(), {
            ...COMMISSION,
            commissionReversed: 8.26,
            commissionNet: 0,
            refunded: true,
        });

        expect(cells.slice(7, 11)).toEqual([8.26, null, -8.26, 0]);
        expect(cells[12]).toBe("Refunded");
    });

    it("shows a manual reversal as a deduction too, and says which commission it reverses", () => {
        const cells = cellsOf(vendorCommissionExportColumns(), {
            ...COMMISSION,
            source: "MANUAL",
            entryNumber: "COM-000007",
            corporateTxnId: null,
            reference: "COM-7",
            service: null,
            reason: "Wrong vendor",
            orderAmount: null,
            commissionExcludingGST: 500,
            commissionIncludingGST: 500,
            commissionNet: 500,
            entryType: "REVERSAL",
            posting: { state: "notApplicable", note: null, detail: null },
            booksSynced: false,
        });

        expect(cells).toEqual([
            "25 Sep 2026",
            "COM-000007",
            null,
            "Wrong vendor",
            null,
            -500,
            -1.26,
            -500,
            null,
            null,
            -500,
            "Manual",
            "Reversal (reverses COM-7)",
            "Not synced",
        ]);
    });

    it("never turns a zero into minus zero", () => {
        const cells = cellsOf(vendorCommissionExportColumns(), {
            ...COMMISSION,
            source: "MANUAL",
            entryType: "REVERSAL",
            commissionNet: 0,
        });

        expect(Object.is(cells[9], -0)).toBe(false);
    });

    it("names a manual entry by its state, and says 'Recorded by hand' when it has no service or reason", () => {
        const manual = { ...COMMISSION, source: "MANUAL", service: null, reason: null };

        expect(cellsOf(vendorCommissionExportColumns(), manual)[3]).toBe("Recorded by hand");
        expect(cellsOf(vendorCommissionExportColumns(), manual)[12]).toBe("Active");
        expect(cellsOf(vendorCommissionExportColumns(), { ...manual, status: "VOIDED" })[12]).toBe("Reversed");
    });
});

const DEPOSIT = {
    entryNumber: "DEP-000012",
    depositDate: "2026-09-20",
    reference: "NEFT-1001",
    mode: "NEFT",
    amount: 5000,
    note: "Advance for October",
    slipName: "slip.pdf",
    recordedByName: "Ibrahim",
    status: "ACTIVE",
    entryType: "DEPOSIT",
    voidReason: null,
    voidedByName: null,
    posting: { state: "notApplicable", note: null, detail: null },
    booksSynced: false,
};

describe("vendorDepositExportColumns", () => {
    it("lists the Deposits table's columns in the table's order, without the Actions column", () => {
        expect(headersOf(vendorDepositExportColumns())).toEqual([
            "Date",
            "Entry No.",
            "Reference",
            "Mode",
            "Amount",
            "Note",
            "Slip",
            "Recorded By",
            "Status",
            "In Books",
        ]);
    });

    it("writes a deposit as it is, reading a plain date as the day it names", () => {
        expect(cellsOf(vendorDepositExportColumns(), DEPOSIT)).toEqual([
            "20 Sep 2026",
            "DEP-000012",
            "NEFT-1001",
            "NEFT",
            5000,
            "Advance for October",
            "slip.pdf",
            "Ibrahim",
            "Active",
            "Not synced",
        ]);
        expect(vendorDepositExportColumns().find(column => column.header === "Amount").money).toBe(true);
    });

    it("shows a reversal as a deduction, and a reversed deposit with why and by whom", () => {
        const reversal = cellsOf(vendorDepositExportColumns(), { ...DEPOSIT, entryType: "REVERSAL" });
        expect(reversal[4]).toBe(-5000);
        expect(reversal[8]).toBe("Reversal");

        const voided = cellsOf(vendorDepositExportColumns(), {
            ...DEPOSIT,
            status: "VOIDED",
            voidReason: "Cheque bounced",
            voidedByName: "Asha",
        });
        expect(voided[5]).toBe("Advance for October — Cheque bounced · Asha");
        expect(voided[8]).toBe("Reversed");
    });

    it("calls the opening balance by name, and leaves a missing note, slip and recorder blank", () => {
        const cells = cellsOf(vendorDepositExportColumns(), {
            ...DEPOSIT,
            entryType: "OPENING",
            reference: null,
            note: null,
            slipName: null,
            recordedByName: null,
        });

        expect(cells).toEqual([
            "20 Sep 2026",
            "DEP-000012",
            "Opening balance",
            "NEFT",
            5000,
            "",
            null,
            null,
            "Opening",
            "Not synced",
        ]);
    });
});

const CREDIT_NOTE = {
    entryNumber: "VCN-000007",
    issueDate: "2026-09-21",
    reference: "CN-7",
    againstCorporateTxnId: "1790330538190",
    reason: "Duplicate booking",
    amount: 250,
    source: "MANUAL",
    status: "OPEN",
    entryType: "ENTRY",
    voidReason: null,
    voidedByName: null,
    posting: { state: "notApplicable", note: null, detail: null },
    booksSynced: false,
};

describe("vendorCostOfSalesExportColumns", () => {
    const COST_OF_SALES = { ...CREDIT_NOTE, entryNumber: "COS-000003", reference: "CS-3", reason: "Packaging charged back", amount: 118, taxableAmount: 100, gstAmount: 18, recordedByName: "Ibrahim" };

    it("lists the Cost of Sales table's columns in the table's order, without the Document and Actions columns", () => {
        expect(headersOf(vendorCostOfSalesExportColumns())).toEqual([
            "Date",
            "Entry No.",
            "Against Order",
            "Reason",
            "Taxable Amount",
            "GST",
            "Total (incl. GST)",
            "Recorded By",
            "Status",
            "In Books",
        ]);
    });

    it("writes a cost of sales as it is, and its reversal as money taken back", () => {
        expect(cellsOf(vendorCostOfSalesExportColumns(), COST_OF_SALES)).toEqual([
            "21 Sep 2026",
            "COS-000003",
            "1790330538190",
            "Packaging charged back",
            100,
            18,
            118,
            "Ibrahim",
            "Active",
            "Not synced",
        ]);
        const reversal = cellsOf(vendorCostOfSalesExportColumns(), { ...COST_OF_SALES, entryType: "REVERSAL" });
        expect(reversal.slice(4, 7)).toEqual([-100, -18, -118]);
        expect(cellsOf(vendorCostOfSalesExportColumns(), { ...COST_OF_SALES, taxableAmount: null, gstAmount: null }).slice(4, 7)).toEqual([null, null, 118]);
    });

    it("filters by the same four statuses a hand-recorded entry can be in", () => {
        expect(VENDOR_COST_OF_SALES_STATUS_LABELS).toEqual({ active: "Active", reversal: "Reversal", reversed: "Reversed", deleted: "Deleted" });
    });
});

describe("vendorDebitNoteExportColumns", () => {
    const DEBIT_NOTE = { ...CREDIT_NOTE, entryNumber: "VDN-000004", reference: "DN-4", reason: "Cost of sales overstated", amount: 118, taxableAmount: 100, gstAmount: 18, recordedByName: "Ibrahim" };

    it("lists the Debit Notes table's columns in the table's order, without the Document and Actions columns", () => {
        expect(headersOf(vendorDebitNoteExportColumns())).toEqual([
            "Date",
            "Entry No.",
            "Against Order",
            "Reason",
            "Taxable Amount",
            "GST",
            "Total (incl. GST)",
            "Recorded By",
            "Status",
            "In Books",
        ]);
    });

    it("writes a debit note as it is, and its reversal as money given back", () => {
        expect(cellsOf(vendorDebitNoteExportColumns(), DEBIT_NOTE)).toEqual([
            "21 Sep 2026",
            "VDN-000004",
            "1790330538190",
            "Cost of sales overstated",
            100,
            18,
            118,
            "Ibrahim",
            "Active",
            "Not synced",
        ]);
        expect(cellsOf(vendorDebitNoteExportColumns(), { ...DEBIT_NOTE, entryType: "REVERSAL" }).slice(4, 7)).toEqual([-100, -18, -118]);
    });

    it("filters by the same four statuses a hand-recorded entry can be in", () => {
        expect(VENDOR_DEBIT_NOTE_STATUS_LABELS).toEqual({ active: "Active", reversal: "Reversal", reversed: "Reversed", deleted: "Deleted" });
    });
});

describe("vendorCreditNoteExportColumns", () => {
    it("lists the Credit Notes table's columns in the table's order, without the Document and Actions columns", () => {
        expect(headersOf(vendorCreditNoteExportColumns())).toEqual([
            "Date",
            "Entry No.",
            "Against Order",
            "Reason",
            "Taxable Amount",
            "GST",
            "Total (incl. GST)",
            "Source",
            "Status",
            "In Books",
        ]);
    });

    it("writes a manual credit note as it is", () => {
        expect(cellsOf(vendorCreditNoteExportColumns(), CREDIT_NOTE)).toEqual([
            "21 Sep 2026",
            "VCN-000007",
            "1790330538190",
            "Duplicate booking",
            null,
            null,
            250,
            "Manual",
            "Active",
            "Not synced",
        ]);
    });

    it("writes the GST beside the amount once the split was kept on the note", () => {
        const columns = vendorCreditNoteExportColumns();
        expect(cellsOf(columns, { ...CREDIT_NOTE, gstAmount: 38.14 })[5]).toBe(38.14);
        expect(columns.find(column => column.header === "GST").money).toBe(true);
    });

    it("shows a manual reversal as a deduction, but not the commission that came back on a refund", () => {
        const manualReversal = cellsOf(vendorCreditNoteExportColumns(), { ...CREDIT_NOTE, entryType: "REVERSAL" });
        expect(manualReversal.slice(4, 7)).toEqual([null, null, -250]);
        expect(cellsOf(vendorCreditNoteExportColumns(), { ...CREDIT_NOTE, entryType: "REVERSAL", taxableAmount: 211.86, gstAmount: 38.14 }).slice(4, 7)).toEqual([-211.86, -38.14, -250]);
        expect(manualReversal[8]).toBe("Reversal");

        const fromRefund = cellsOf(vendorCreditNoteExportColumns(), {
            ...CREDIT_NOTE,
            source: "AUTO",
            entryNumber: null,
            entryType: "REVERSAL",
            posting: { state: "posted", note: null, detail: null },
        });
        expect(fromRefund[1]).toBeNull();
        expect(fromRefund[6]).toBe(250);
        expect(fromRefund[7]).toBe("From refund");
        expect(fromRefund[8]).toBe("Reversal");
        expect(fromRefund[9]).toBe("Posted");
    });

    it("adds why and by whom to a voided note's reason", () => {
        const cells = cellsOf(vendorCreditNoteExportColumns(), {
            ...CREDIT_NOTE,
            status: "VOIDED",
            voidReason: "Raised in error",
            voidedByName: "Asha",
        });

        expect(cells[3]).toBe("Duplicate booking — Raised in error · Asha");
        expect(cells[8]).toBe("Reversed");
    });
});

describe("vendorSummaryTiles", () => {
    it("carries the five figures the Transactions screen shows above its table", () => {
        const tiles = vendorSummaryTiles({
            openingBalance: -4000,
            deposited: 0,
            totalTransaction: 25235,
            commission: 770.76,
            available: -28464.24,
        });

        expect(tiles).toEqual([
            { label: "Opening Balance", value: -4000, money: true },
            { label: "Deposit", value: 0, money: true },
            { label: "Total Transaction", value: 25235, money: true },
            { label: "Commission earned", value: 770.76, money: true },
            { label: "Available", value: -28464.24, money: true },
        ]);
    });
});

describe("vendorSummaryNote", () => {
    const RANGE = { from: "2026-09-06", to: "2026-10-06" };

    it("says what period each figure covers, the day before being the opening balance's", () => {
        const note = vendorSummaryNote(RANGE, true);

        expect(note).toContain("Opening Balance is the balance through 05 Sep 2026.");
        expect(note).toContain("cover 06 Sep 2026 to 06 Oct 2026.");
        expect(note).not.toContain("No opening balance");
    });

    it("adds that the rows follow the filters but the figures do not, only when a filter was used", () => {
        expect(vendorSummaryNote(RANGE, true, true).endsWith(
            "The rows follow the filters chosen, but the figures above always cover the whole period."
        )).toBe(true);
        expect(vendorSummaryNote(RANGE, true, false)).not.toContain("follow the filters chosen");
        expect(vendorSummaryNote(RANGE, true)).not.toContain("follow the filters chosen");
    });

    it("warns first when the vendor has no opening balance, as the screen does", () => {
        const note = vendorSummaryNote(RANGE, false);

        expect(note.startsWith("No opening balance is set for this vendor")).toBe(true);
        expect(note).toContain("Opening Balance is the balance through 05 Sep 2026.");
    });
});
