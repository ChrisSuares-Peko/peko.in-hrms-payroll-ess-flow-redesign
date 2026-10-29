const {
    subscriberTransactionExportColumns,
    subscriberWalletExportColumns,
    subscriberBillExportColumns,
    subscriberSummaryTiles,
    subscriberSummaryNote,
    transactionFilterNotes,
    walletFilterNotes,
    billFilterNotes,
} = require("../subscriberLedgerExport");
const { ORDER_STATUS_FILTER_LABELS } = require("../journalPosting");
const { FILTERED_ROWS_NOTE } = require("../../../utils/tableExport");

const cellsOf = (columns, row) => columns.map(column => column.value(row));
const headersOf = columns => columns.map(column => column.header);

const POSTED = { state: "posted", note: null, detail: null };

const TRANSACTION = {
    transactionDate: "2026-10-06T06:14:02.000Z",
    corporateTxnId: "1791277831861",
    service: "Peko Go",
    orderAmount: 1155.27,
    discount: 0,
    paidFromWallet: null,
    paidViaGateway: 1155.27,
    status: "SUCCESS",
    posting: POSTED,
};

const MOVEMENT = {
    transactionDate: "2026-09-30T08:00:00.000Z",
    reference: "1790765440435",
    type: "Admin withdrawal",
    particulars: "Funds withdrawn by Peko Payments Services LLC",
    remark: "pekopayments",
    debit: 10000,
    credit: null,
    balanceAfter: 36000,
    posting: { state: "notApplicable", note: null, detail: null },
};

const BILL = {
    id: "2:pekoInvoice",
    orderId: 2,
    transactionDate: "2026-10-06T06:14:02.000Z",
    corporateTxnId: "1791277613418",
    service: "Hike",
    document: "pekoInvoice",
    kind: "platformFeeInvoice",
    label: "Platform Fee Invoice",
    documentNumber: "PI-2026-0417",
    issuedDate: "2026-10-06",
    taxable: 21.19,
    gst: 3.81,
    total: 25,
};

describe("subscriberTransactionExportColumns", () => {
    it("lists the Transactions table's columns in the table's order, without the Actions column", () => {
        expect(headersOf(subscriberTransactionExportColumns())).toEqual([
            "Date",
            "Reference",
            "Service",
            "Order Amount",
            "Discount",
            "Paid from Wallet",
            "Paid via Gateway",
            "Status",
            "Posted",
        ]);
    });

    it("writes one row of cells, with the date in IST and the money as numbers", () => {
        expect(cellsOf(subscriberTransactionExportColumns(), TRANSACTION)).toEqual([
            "06 Oct 2026",
            "1791277831861",
            "Peko Go",
            1155.27,
            0,
            null,
            1155.27,
            "Success",
            "Posted",
        ]);
        expect(
            headersOf(subscriberTransactionExportColumns().filter(column => column.money))
        ).toEqual(["Order Amount", "Discount", "Paid from Wallet", "Paid via Gateway"]);
    });

    it("words a refunded or failed order as the screen does", () => {
        const status = row => cellsOf(subscriberTransactionExportColumns(), row)[7];

        expect(status({ ...TRANSACTION, status: "REFUNDED" })).toBe("Refunded");
        expect(status({ ...TRANSACTION, status: "FAILURE" })).toBe("Failed");
    });
});

describe("subscriberWalletExportColumns", () => {
    it("lists the Wallet table's columns in the table's order", () => {
        expect(headersOf(subscriberWalletExportColumns())).toEqual([
            "Date",
            "Reference",
            "Type",
            "Particulars",
            "Debit",
            "Credit",
            "Balance After",
            "Posted",
        ]);
    });

    it("writes a debit with its credit blank, and the remark after the particulars", () => {
        expect(cellsOf(subscriberWalletExportColumns(), MOVEMENT)).toEqual([
            "30 Sep 2026",
            "1790765440435",
            "Admin withdrawal",
            "Funds withdrawn by Peko Payments Services LLC — pekopayments",
            10000,
            null,
            36000,
            "Not applicable",
        ]);
    });

    it("writes a credit with its debit blank, and calls a movement with no type Other", () => {
        const cells = cellsOf(subscriberWalletExportColumns(), {
            ...MOVEMENT,
            type: null,
            remark: null,
            debit: null,
            credit: 1000,
        });

        expect(cells[2]).toBe("Other");
        expect(cells[3]).toBe("Funds withdrawn by Peko Payments Services LLC");
        expect(cells.slice(4, 6)).toEqual([null, 1000]);
    });

    it("leaves a zero movement blank rather than printing ₹ 0.00", () => {
        const cells = cellsOf(subscriberWalletExportColumns(), { ...MOVEMENT, debit: 0, credit: 0 });

        expect(cells.slice(4, 6)).toEqual([null, null]);
    });
});

describe("subscriberBillExportColumns", () => {
    it("lists the Bills table's columns in the table's order, without the Actions column", () => {
        expect(headersOf(subscriberBillExportColumns())).toEqual([
            "Date",
            "Reference",
            "Service",
            "Document",
            "Document No.",
            "Taxable",
            "GST",
            "Total",
        ]);
    });

    it("writes one row of cells with the document's label, number and figures as numbers", () => {
        expect(cellsOf(subscriberBillExportColumns(), BILL)).toEqual([
            "06 Oct 2026",
            "1791277613418",
            "Hike",
            "Platform Fee Invoice",
            "PI-2026-0417",
            21.19,
            3.81,
            25,
        ]);
    });
});

describe("subscriberSummaryTiles", () => {
    it("carries the six figures the Transactions screen shows above its table", () => {
        expect(
            subscriberSummaryTiles({
                topUps: 1000,
                spent: 0,
                paidViaGateway: 69803.78,
                platformFee: 236.57,
                cashback: 0,
                walletBalance: 36000,
            })
        ).toEqual([
            { label: "Top-ups", value: 1000, money: true },
            { label: "Spent from Wallet", value: 0, money: true },
            { label: "Paid via Gateway", value: 69803.78, money: true },
            { label: "Platform Fee", value: 236.57, money: true },
            { label: "Cashback", value: 0, money: true },
            { label: "Wallet Balance", value: 36000, money: true },
        ]);
    });
});

describe("subscriberSummaryNote", () => {
    const RANGE = { from: "2026-09-06", to: "2026-10-06" };

    it("says what period each figure covers", () => {
        expect(subscriberSummaryNote(RANGE, { withdrawals: 0 })).toBe(
            "Wallet Balance is what the subscriber holds today. Top-ups, Spent from Wallet, Paid via Gateway, Platform Fee and Cashback cover 06 Sep 2026 to 06 Oct 2026."
        );
    });

    it("says the figures cover the whole period only when the rows are filtered", () => {
        expect(subscriberSummaryNote(RANGE, { withdrawals: 0 })).not.toContain(FILTERED_ROWS_NOTE);
        expect(subscriberSummaryNote(RANGE, { withdrawals: 0 }, false)).not.toContain(FILTERED_ROWS_NOTE);
        expect(subscriberSummaryNote(RANGE, { withdrawals: 0 }, true)).toBe(
            `${subscriberSummaryNote(RANGE, { withdrawals: 0 })} ${FILTERED_ROWS_NOTE}`
        );
        expect(FILTERED_ROWS_NOTE).toBe(
            "The rows follow the filters chosen, but the figures above always cover the whole period."
        );
    });

    it("points to the Wallet tab when the team withdrew funds in the period", () => {
        expect(subscriberSummaryNote(RANGE, { withdrawals: 10000 })).toContain(
            " Admin withdrawals of ₹ 10,000.00 in this period are listed on the Wallet tab."
        );
    });
});

describe("the filter notes a file carries", () => {
    it("names the Status on Transactions as the table's pill words it, then the search", () => {
        expect(ORDER_STATUS_FILTER_LABELS).toEqual({ success: "Success", refunded: "Refunded", failed: "Failed" });
        expect(transactionFilterNotes({ status: "refunded", searchText: "hike" })).toEqual([
            "Status: Refunded",
            'Search: "hike"',
        ]);
        expect(transactionFilterNotes({ status: "failed" })).toEqual(["Status: Failed", null]);
        expect(transactionFilterNotes({ searchText: "hike" })).toEqual([null, 'Search: "hike"']);
    });

    it("names the Type, the side and the search on Wallet", () => {
        expect(walletFilterNotes({ type: "cashback-reversal", side: "debit", searchText: "hike" })).toEqual([
            "Type: Cashback reversal",
            "Debit only",
            'Search: "hike"',
        ]);
        expect(walletFilterNotes({ type: "top-up" })).toEqual(["Type: Top-up", null, null]);
        expect(walletFilterNotes({ side: "credit" })).toEqual([null, "Credit only", null]);
    });

    it("names only the search on Bills, which has nothing else to filter by", () => {
        expect(billFilterNotes({ searchText: "hike", status: "failed", side: "debit" })).toEqual(['Search: "hike"']);
        expect(billFilterNotes({})).toEqual([null]);
    });

    it("says nothing of a choice the tab does not have", () => {
        expect(transactionFilterNotes({ status: "earned", type: "refund", side: "debit" })).toEqual([null, null]);
        expect(walletFilterNotes({ status: "success", type: "transfer", side: "both" })).toEqual([null, null, null]);
        expect(walletFilterNotes({ type: "toString" })).toEqual([null, null, null]);
    });
});
