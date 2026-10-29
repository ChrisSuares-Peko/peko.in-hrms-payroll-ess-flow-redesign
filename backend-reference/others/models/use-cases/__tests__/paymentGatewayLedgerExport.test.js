const {
    paymentGatewayTransactionExportColumns,
    paymentGatewayReceiptExportColumns,
    paymentGatewayFeeExportColumns,
    paymentGatewaySummaryTiles,
    paymentGatewaySummaryNote,
    gatewayTransactionFilterNotes,
    gatewayReceiptFilterNotes,
    gatewayFeeFilterNotes,
    GATEWAY_RECEIVED_STATUS_LABELS,
    GATEWAY_FEE_STATUS_LABELS,
} = require("../paymentGatewayLedgerExport");
const { FILTERED_ROWS_NOTE } = require("../../../utils/tableExport");

const cellsOf = (columns, row) => columns.map(column => column.value(row));
const headersOf = columns => columns.map(column => column.header);

const POSTED = { state: "posted", note: null, detail: null };
const NOT_APPLICABLE = { state: "notApplicable", note: null, detail: null };

const TRANSACTION = {
    transactionDate: "2026-10-06T06:14:02.000Z",
    beforeOpening: false,
    corporateTxnId: "1791277831861",
    subscriberName: "Faris Rahamn",
    service: "Peko Go",
    paymentMode: "PAYMENT GATEWAY",
    totalAmount: 1155.27,
    gatewayAmount: 1155.27,
    status: "SUCCESS",
    posting: POSTED,
};

const RECEIPT = {
    entryNumber: "RCT-000009",
    entryDate: "2026-09-30",
    entryKind: "RECEIPT",
    entryType: "ENTRY",
    reference: "5435c44cvb53",
    mode: "NEFT",
    amount: 1000,
    expectedAmount: 1012,
    note: "Settlement for week 39",
    slipName: "slip.pdf",
    recordedByName: "Peko Payments Services LLC",
    status: "ACTIVE",
    voidReason: null,
    voidedByName: null,
    posting: NOT_APPLICABLE,
    booksSynced: false,
};

const FEE = {
    entryNumber: "BIL-000003",
    entryDate: "2026-09-30",
    entryKind: "FEE",
    entryType: "ENTRY",
    reference: "sdf5",
    amount: 100,
    note: null,
    recordedByName: "Peko Payments Services LLC",
    status: "ACTIVE",
    voidReason: null,
    voidedByName: null,
    posting: NOT_APPLICABLE,
    booksSynced: true,
};

describe("paymentGatewayTransactionExportColumns", () => {
    it("lists the Transactions table's columns in the table's order, with the opening marker beside the date", () => {
        expect(headersOf(paymentGatewayTransactionExportColumns())).toEqual([
            "Date",
            "Before Opening",
            "Txn ID",
            "Subscriber",
            "Service",
            "Method",
            "Full Amount",
            "Through Gateway",
            "Status",
            "Posted",
        ]);
    });

    it("writes one row of cells, with the date in IST and the money as numbers", () => {
        expect(cellsOf(paymentGatewayTransactionExportColumns(), TRANSACTION)).toEqual([
            "06 Oct 2026",
            "",
            "1791277831861",
            "Faris Rahamn",
            "Peko Go",
            "PAYMENT GATEWAY",
            1155.27,
            1155.27,
            "Success",
            "Posted",
        ]);
    });

    it("marks an order that falls inside the opening figure", () => {
        const cells = cellsOf(paymentGatewayTransactionExportColumns(), { ...TRANSACTION, beforeOpening: true });

        expect(cells[1]).toBe("Yes");
    });
});

describe("paymentGatewayReceiptExportColumns", () => {
    it("lists the Received table's columns in the table's order, without the Actions column", () => {
        expect(headersOf(paymentGatewayReceiptExportColumns())).toEqual([
            "Date",
            "Entry No.",
            "Reference",
            "Mode",
            "Received",
            "Expected",
            "Kept as Charges",
            "Note",
            "Slip",
            "Recorded By",
            "Status",
            "In Books",
        ]);
    });

    it("writes a receipt, and the charge the gateway kept as the shortfall against what was expected", () => {
        expect(cellsOf(paymentGatewayReceiptExportColumns(), RECEIPT)).toEqual([
            "30 Sep 2026",
            "RCT-000009",
            "5435c44cvb53",
            "NEFT",
            1000,
            1012,
            12,
            "Settlement for week 39",
            "slip.pdf",
            "Peko Payments Services LLC",
            "Received",
            "Not synced",
        ]);
    });

    it("keeps no charge column value when the receipt matched what was expected, or none was given", () => {
        const kept = row => cellsOf(paymentGatewayReceiptExportColumns(), row)[6];

        expect(kept({ ...RECEIPT, expectedAmount: 1000 })).toBeNull();
        expect(kept({ ...RECEIPT, expectedAmount: null })).toBeNull();
    });

    it("shows a reversal as money taken back, and a reversed receipt with why and by whom", () => {
        const reversal = cellsOf(paymentGatewayReceiptExportColumns(), { ...RECEIPT, entryType: "REVERSAL" });
        expect(reversal[4]).toBe(-1000);
        expect(reversal[10]).toBe("Reversal");

        const voided = cellsOf(paymentGatewayReceiptExportColumns(), {
            ...RECEIPT,
            status: "VOIDED",
            voidReason: "Duplicate entry",
            voidedByName: "Asha",
        });
        expect(voided[7]).toBe("Settlement for week 39 — Duplicate entry · Asha");
        expect(voided[10]).toBe("Reversed");
    });

    it("calls the opening balance by name", () => {
        const cells = cellsOf(paymentGatewayReceiptExportColumns(), {
            ...RECEIPT,
            entryKind: "OPENING",
            reference: null,
            expectedAmount: null,
        });

        expect(cells[2]).toBe("Opening balance");
        expect(cells[10]).toBe("Opening");
    });
});

describe("paymentGatewayFeeExportColumns", () => {
    it("lists the Bills / Fees Charged table's columns in the table's order, without the Actions column", () => {
        expect(headersOf(paymentGatewayFeeExportColumns())).toEqual([
            "Date",
            "Entry No.",
            "Reference",
            "Fee",
            "Note",
            "Recorded By",
            "Status",
            "In Books",
        ]);
    });

    it("writes a fee as Charged, and a reversal as money taken back", () => {
        expect(cellsOf(paymentGatewayFeeExportColumns(), FEE)).toEqual([
            "30 Sep 2026",
            "BIL-000003",
            "sdf5",
            100,
            "",
            "Peko Payments Services LLC",
            "Charged",
            "Synced",
        ]);

        const reversal = cellsOf(paymentGatewayFeeExportColumns(), { ...FEE, entryType: "REVERSAL" });
        expect(reversal[3]).toBe(-100);
        expect(reversal[6]).toBe("Reversal");
    });

    it("never turns a zero fee into minus zero", () => {
        const cells = cellsOf(paymentGatewayFeeExportColumns(), { ...FEE, entryType: "REVERSAL", amount: 0 });

        expect(Object.is(cells[3], -0)).toBe(false);
    });
});

describe("paymentGatewaySummaryTiles", () => {
    const SUMMARY = {
        collected: 413879.23,
        received: 0,
        fees: 100,
        outstanding: 761110.01,
        lastReceiptDate: null,
    };

    it("carries the five figures the Transactions screen shows above its table", () => {
        expect(paymentGatewaySummaryTiles(SUMMARY)).toEqual([
            { label: "Collected", value: 413879.23, money: true },
            { label: "Received", value: 0, money: true },
            { label: "Charges", value: 100, money: true },
            { label: "Yet To Receive", value: 761110.01, money: true },
            { label: "Last Receipt", value: "None yet" },
        ]);
    });

    it("gives the last receipt as a date once there is one", () => {
        expect(paymentGatewaySummaryTiles({ ...SUMMARY, lastReceiptDate: "2026-09-30" })[4].value).toBe(
            "30 Sep 2026"
        );
    });
});

describe("paymentGatewaySummaryNote", () => {
    const RANGE = { from: "2026-09-06", to: "2026-10-06" };

    it("says what period each figure covers", () => {
        expect(paymentGatewaySummaryNote(RANGE, true)).toBe(
            "Yet To Receive is everything collected to date less everything received and charged to date. Collected, Received and Charges cover 06 Sep 2026 to 06 Oct 2026. A refund takes the money back off the gateway on the day it went back."
        );
    });

    it("warns first when the gateway has no opening balance", () => {
        const note = paymentGatewaySummaryNote(RANGE, false);

        expect(note.startsWith("No opening balance is set for this gateway")).toBe(true);
        expect(note).toContain("cover 06 Sep 2026 to 06 Oct 2026.");
    });
});

describe("the filtered note on the PDF summary", () => {
    const RANGE = { from: "2026-09-06", to: "2026-10-06" };

    it("says the figures cover the whole period only when the rows are filtered", () => {
        expect(paymentGatewaySummaryNote(RANGE, true, false)).toBe(paymentGatewaySummaryNote(RANGE, true));
        expect(paymentGatewaySummaryNote(RANGE, true, true)).toBe(
            `${paymentGatewaySummaryNote(RANGE, true)} ${FILTERED_ROWS_NOTE}`
        );
        expect(FILTERED_ROWS_NOTE).toBe(
            "The rows follow the filters chosen, but the figures above always cover the whole period."
        );
    });

    it("keeps the opening warning first when the rows are filtered", () => {
        expect(paymentGatewaySummaryNote(RANGE, false, true)).toMatch(/^No opening balance is set for this gateway/);
    });
});

describe("the filter notes a file carries", () => {
    it("names the Status on Transactions as the table's pill words it, then the search", () => {
        expect(gatewayTransactionFilterNotes({ status: "refunded", searchText: "hike" })).toEqual([
            "Status: Refunded",
            'Search: "hike"',
        ]);
        expect(gatewayTransactionFilterNotes({ status: "failed" })).toEqual(["Status: Failed", null]);
    });

    it("names the Status on Received as its pill words it, including the opening", () => {
        expect(GATEWAY_RECEIVED_STATUS_LABELS).toEqual({
            received: "Received",
            opening: "Opening",
            reversal: "Reversal",
            reversed: "Reversed",
            deleted: "Deleted",
        });
        expect(gatewayReceiptFilterNotes({ status: "opening", searchText: "utr" })).toEqual([
            "Status: Opening",
            'Search: "utr"',
        ]);
    });

    it("names the Status on Bills / Fees Charged as its pill words it, which has no opening", () => {
        expect(GATEWAY_FEE_STATUS_LABELS).toEqual({
            charged: "Charged",
            reversal: "Reversal",
            reversed: "Reversed",
            deleted: "Deleted",
        });
        expect(gatewayFeeFilterNotes({ status: "charged", searchText: "bill" })).toEqual([
            "Status: Charged",
            'Search: "bill"',
        ]);
        expect(gatewayFeeFilterNotes({ status: "opening" })).toEqual([null, null]);
    });

    it("says nothing of a status the table does not have", () => {
        expect(gatewayTransactionFilterNotes({ status: "received" })).toEqual([null, null]);
        expect(gatewayReceiptFilterNotes({ status: "charged" })).toEqual([null, null]);
        expect(gatewayReceiptFilterNotes({ status: "toString" })).toEqual([null, null]);
    });
});
