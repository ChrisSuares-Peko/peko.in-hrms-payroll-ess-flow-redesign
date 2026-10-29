const {
    partnerTransactionExportColumns,
    partnerSubscriptionExportColumns,
    partnerPayoutExportColumns,
    partnerDebitNoteExportColumns,
    partnerSummaryTiles,
    partnerPaymentsTiles,
    partnerSummaryNote,
    partnerPaymentsNote,
    partnerOrderFilterNotes,
    partnerPayoutFilterNotes,
    partnerDebitNoteFilterNotes,
    PARTNER_PAYOUT_STATUS_LABELS,
    PARTNER_DEBIT_NOTE_STATUS_LABELS,
    PAYMENTS_FILTERED_NOTE,
} = require("../partnerLedgerExport");
const { FILTERED_ROWS_NOTE } = require("../../../utils/tableExport");

const cellsOf = (columns, row) => columns.map(column => column.value(row));
const headersOf = columns => columns.map(column => column.header);

const POSTED = { state: "posted", note: null, detail: null };

const TRANSACTION = {
    transactionDate: "2026-10-06T06:14:02.000Z",
    corporateTxnId: "1791282332879",
    subscriberName: "IMTD",
    service: "Electricity Bill",
    totalAmount: 79042.6,
    netPlatformFee: 7070,
    netCommission: 8.47,
    couponTotal: 0,
    gatewayCharge: null,
    shareBase: 7078.47,
    sharePercentageApplied: 10,
    partnerShare: 835.26,
    shareExcludingGST: 707.85,
    shareGST: 127.41,
    status: "SUCCESS",
    posting: POSTED,
};

const SUBSCRIPTION = {
    transactionDate: "2026-09-17T09:57:00.000Z",
    corporateTxnId: "1789639023559",
    subscriberName: "Aj cent",
    planName: "Invoicing",
    billingType: "MONTHLY",
    addOn: false,
    totalAmount: 470.82,
    couponTotal: 0,
    gatewayCharge: null,
    shareBase: 470.82,
    sharePercentageApplied: 15,
    partnerShare: 83.3,
    shareExcludingGST: 70.62,
    shareGST: 12.68,
    netRevenue: 399,
    status: "SUCCESS",
    posting: POSTED,
};

const PAYOUT = {
    entryNumber: "PAY-000005",
    payoutDate: "2026-09-20",
    reference: "NEFT-9001",
    mode: "NEFT",
    amount: 2000,
    calculatedAmount: 2678.18,
    difference: -678.18,
    note: "Part payment",
    slipName: "slip.pdf",
    recordedByName: "Ibrahim",
    status: "ACTIVE",
    entryKind: "PAYOUT",
    entryType: "PAYOUT",
    voidReason: null,
    voidedByName: null,
    posting: { state: "notApplicable", note: null, detail: null },
    booksSynced: false,
};

describe("partnerTransactionExportColumns", () => {
    it("lists the Transactions table's columns in the table's order, with the share's parts beside it", () => {
        expect(headersOf(partnerTransactionExportColumns())).toEqual([
            "Date",
            "Txn ID",
            "Subscriber",
            "Service",
            "Full Amount",
            "Net Platform Fee",
            "Net Commission",
            "Coupon",
            "Gateway Charge",
            "Share Base",
            "Share Applied",
            "Partner Share",
            "Share (excl. GST)",
            "Share GST",
            "Status",
            "Posted",
        ]);
    });

    it("writes one row of cells, with the date in IST and the money as numbers", () => {
        expect(cellsOf(partnerTransactionExportColumns(), TRANSACTION)).toEqual([
            "06 Oct 2026",
            "1791282332879",
            "IMTD",
            "Electricity Bill",
            79042.6,
            7070,
            8.47,
            null,
            null,
            7078.47,
            "10.00 %",
            835.26,
            707.85,
            127.41,
            "Success",
            "Posted",
        ]);
    });

    it("shows a coupon as money taken off", () => {
        const cells = cellsOf(partnerTransactionExportColumns(), { ...TRANSACTION, couponTotal: 120 });
        expect(cells[7]).toBe(-120);
    });

    it("writes the gateway charge the partner bore, and the base the share was taken on", () => {
        const cells = cellsOf(partnerTransactionExportColumns(), { ...TRANSACTION, gatewayCharge: 22.5, shareBase: 7055.97 });
        expect(cells.slice(8, 10)).toEqual([22.5, 7055.97]);
    });

    it("leaves the share blank for an order that earned none, as the screen shows a dash", () => {
        const cells = cellsOf(partnerTransactionExportColumns(), {
            ...TRANSACTION,
            sharePercentageApplied: null,
            partnerShare: null,
            shareExcludingGST: null,
            shareGST: null,
        });

        expect(cells.slice(10, 14)).toEqual(["", null, null, null]);
    });
});

describe("partnerSubscriptionExportColumns", () => {
    it("lists the Own Subscriptions table's columns in the table's order, with the share's parts beside it", () => {
        expect(headersOf(partnerSubscriptionExportColumns())).toEqual([
            "Date",
            "Txn ID",
            "Subscriber",
            "Plan",
            "Billing",
            "Kind",
            "Amount (incl. GST)",
            "Coupon",
            "Gateway Charge",
            "Share Base",
            "Share Applied",
            "Partner Share",
            "Share (excl. GST)",
            "Share GST",
            "Net Revenue (excl. GST)",
            "Status",
            "Posted",
        ]);
    });

    it("writes a plan, and names an add-on as one", () => {
        expect(cellsOf(partnerSubscriptionExportColumns(), SUBSCRIPTION)).toEqual([
            "17 Sep 2026",
            "1789639023559",
            "Aj cent",
            "Invoicing",
            "MONTHLY",
            "Plan",
            470.82,
            null,
            null,
            470.82,
            "15.00 %",
            83.3,
            70.62,
            12.68,
            399,
            "Success",
            "Posted",
        ]);
        expect(cellsOf(partnerSubscriptionExportColumns(), { ...SUBSCRIPTION, addOn: true })[5]).toBe("Add-on");
    });
});

describe("partnerPayoutExportColumns", () => {
    it("lists the Payments table's columns in the table's order, without the Actions column", () => {
        expect(headersOf(partnerPayoutExportColumns())).toEqual([
            "Date",
            "Entry No.",
            "Reference",
            "Mode",
            "Paid",
            "Calculated",
            "Short / Over",
            "Note",
            "Slip",
            "Recorded By",
            "Status",
            "In Books",
        ]);
    });

    it("writes a payout and says by how much it fell short of the suggestion", () => {
        expect(cellsOf(partnerPayoutExportColumns(), PAYOUT)).toEqual([
            "20 Sep 2026",
            "PAY-000005",
            "NEFT-9001",
            "NEFT",
            2000,
            2678.18,
            "Short by ₹ 678.18",
            "Part payment",
            "slip.pdf",
            "Ibrahim",
            "Paid",
            "Not synced",
        ]);
    });

    it("says Over by when a payout went past the suggestion, and nothing when it matched", () => {
        expect(cellsOf(partnerPayoutExportColumns(), { ...PAYOUT, difference: 100 })[6]).toBe("Over by ₹ 100.00");
        expect(cellsOf(partnerPayoutExportColumns(), { ...PAYOUT, difference: 0 })[6]).toBe("");
        expect(
            cellsOf(partnerPayoutExportColumns(), { ...PAYOUT, calculatedAmount: null, difference: null })[5]
        ).toBeNull();
    });

    it("shows a reversal as money taken back, and a reversed payout with why and by whom", () => {
        const reversal = cellsOf(partnerPayoutExportColumns(), { ...PAYOUT, entryType: "REVERSAL" });
        expect(reversal[4]).toBe(-2000);
        expect(reversal[10]).toBe("Reversal");

        const voided = cellsOf(partnerPayoutExportColumns(), {
            ...PAYOUT,
            status: "VOIDED",
            voidReason: "Wrong account",
            voidedByName: "Asha",
        });
        expect(voided[7]).toBe("Part payment — Wrong account · Asha");
        expect(voided[10]).toBe("Reversed");
    });

    it("calls the opening balance by name", () => {
        const cells = cellsOf(partnerPayoutExportColumns(), {
            ...PAYOUT,
            entryKind: "OPENING",
            reference: null,
            calculatedAmount: null,
            difference: null,
        });

        expect(cells[2]).toBe("Opening balance");
        expect(cells[10]).toBe("Opening");
    });
});

const DEBIT_NOTE = {
    entryNumber: "PDN-000002",
    issueDate: "2026-10-07",
    reference: "DN-1042",
    againstCorporateTxnId: "1791282332879",
    reason: "Share clawed back",
    amount: 150,
    slipName: "note.pdf",
    recordedByName: "Ibrahim",
    status: "OPEN",
    entryType: "ENTRY",
    voidReason: null,
    voidedByName: null,
    posting: { state: "notApplicable", note: null, detail: null },
    booksSynced: false,
};

describe("partnerDebitNoteExportColumns", () => {
    it("lists the Debit Notes table's columns in the table's order, without the Actions column", () => {
        expect(headersOf(partnerDebitNoteExportColumns())).toEqual([
            "Date",
            "Entry No.",
            "Against Order",
            "Reason",
            "Taxable Amount",
            "GST",
            "Total (incl. GST)",
            "Document",
            "Recorded By",
            "Status",
            "In Books",
        ]);
    });

    it("writes a debit note with its date in IST and the money as a number", () => {
        expect(cellsOf(partnerDebitNoteExportColumns(), DEBIT_NOTE)).toEqual([
            "07 Oct 2026",
            "PDN-000002",
            "1791282332879",
            "Share clawed back",
            null,
            null,
            150,
            "note.pdf",
            "Ibrahim",
            "Active",
            "Not synced",
        ]);
    });

    it("writes the GST beside the amount once the split was kept on the note", () => {
        const columns = partnerDebitNoteExportColumns();
        expect(cellsOf(columns, { ...DEBIT_NOTE, gstAmount: 22.88 })[5]).toBe(22.88);
        expect(columns.find(column => column.header === "GST").money).toBe(true);
    });

    it("shows a reversal as money given back, and a reversed note with why and by whom", () => {
        const reversal = cellsOf(partnerDebitNoteExportColumns(), { ...DEBIT_NOTE, entryType: "REVERSAL" });
        expect(reversal.slice(4, 7)).toEqual([null, null, -150]);
        expect(reversal[9]).toBe("Reversal");

        const voided = cellsOf(partnerDebitNoteExportColumns(), {
            ...DEBIT_NOTE,
            status: "VOIDED",
            voidReason: "Raised twice",
            voidedByName: "Asha",
        });
        expect(voided[3]).toBe("Share clawed back — Raised twice · Asha");
        expect(voided[9]).toBe("Reversed");
    });
});

describe("partner summaries", () => {
    const SUMMARY = {
        earned: 2678.18,
        paid: 0,
        debitNotes: 0,
        gmv: 275795.24,
        owed: 2678.18,
        lastPayoutDate: null,
    };

    it("carries the six figures the Transactions screen shows above its table", () => {
        expect(partnerSummaryTiles(SUMMARY)).toEqual([
            { label: "Earned", value: 2678.18, money: true },
            { label: "Paid", value: 0, money: true },
            { label: "Debit Notes", value: 0, money: true },
            { label: "GMV", value: 275795.24, money: true },
            { label: "Left To Pay", value: 2678.18, money: true },
            { label: "Last Payment", value: "None yet" },
        ]);
    });

    it("gives the last payment as a date once there is one", () => {
        expect(partnerSummaryTiles({ ...SUMMARY, lastPayoutDate: "2026-09-20" })[5].value).toBe("20 Sep 2026");
        expect(partnerPaymentsTiles({ ...SUMMARY, lastPayoutDate: "2026-09-20" })).toEqual([
            { label: "Left to pay", value: 2678.18, money: true },
            { label: "Last payment", value: "20 Sep 2026" },
        ]);
    });

    it("says what period each figure covers, and warns first when there is no opening balance", () => {
        const range = { from: "2026-09-06", to: "2026-10-06" };

        expect(partnerSummaryNote(range, true)).toBe(
            "GMV is the full value of every successful order for this partner, before any discount, whether or not an accounting entry exists. GMV, Earned, Paid and Debit Notes cover 06 Sep 2026 to 06 Oct 2026. A refund takes the share back on the day it came back."
        );
        expect(partnerSummaryNote(range, false).startsWith("No opening balance is set for this partner")).toBe(true);
        expect(partnerPaymentsNote("Cent Saarthi", true)).toBe(
            "Left to pay is everything Cent Saarthi has earned to date less everything already paid and every debit note raised, so a payout entered below the suggestion stays owed rather than being written off."
        );
        expect(partnerPaymentsNote("Cent Saarthi", false)).toMatch(/^No opening balance is set for this partner/);
    });
});

describe("the filtered notes on the PDF summaries", () => {
    const range = { from: "2026-09-06", to: "2026-10-06" };

    it("says the Transactions figures cover the whole period only when the rows are filtered", () => {
        expect(partnerSummaryNote(range, true, false)).toBe(partnerSummaryNote(range, true));
        expect(partnerSummaryNote(range, true, true)).toBe(`${partnerSummaryNote(range, true)} ${FILTERED_ROWS_NOTE}`);
        expect(FILTERED_ROWS_NOTE).toBe(
            "The rows follow the filters chosen, but the figures above always cover the whole period."
        );
    });

    it("says the Payments figures cover everything to date only when the rows are filtered", () => {
        expect(partnerPaymentsNote("Cent Saarthi", true, false)).toBe(partnerPaymentsNote("Cent Saarthi", true));
        expect(partnerPaymentsNote("Cent Saarthi", true, true)).toBe(
            `${partnerPaymentsNote("Cent Saarthi", true)} ${PAYMENTS_FILTERED_NOTE}`
        );
        expect(PAYMENTS_FILTERED_NOTE).toBe(
            "The rows follow the filters chosen, but the figures above always cover everything to date."
        );
    });

    it("keeps the opening warning first when the rows are filtered", () => {
        expect(partnerSummaryNote(range, false, true)).toMatch(/^No opening balance is set for this partner/);
        expect(partnerPaymentsNote("Cent Saarthi", false, true)).toMatch(/^No opening balance is set for this partner/);
    });
});

describe("the filter notes a file carries", () => {
    it("names the Status on an order tab as the table's pill words it, then the search", () => {
        expect(partnerOrderFilterNotes({ status: "refunded", searchText: "air" })).toEqual([
            "Status: Refunded",
            'Search: "air"',
        ]);
        expect(partnerOrderFilterNotes({ status: "failed" })).toEqual(["Status: Failed", null]);
        expect(partnerOrderFilterNotes({ searchText: "air" })).toEqual([null, 'Search: "air"']);
    });

    it("names the Status on Payments as its pill words it, then the search", () => {
        expect(PARTNER_PAYOUT_STATUS_LABELS).toEqual({
            paid: "Paid",
            opening: "Opening",
            reversal: "Reversal",
            reversed: "Reversed",
            deleted: "Deleted",
        });
        expect(partnerPayoutFilterNotes({ status: "reversal", searchText: "utr" })).toEqual([
            "Status: Reversal",
            'Search: "utr"',
        ]);
    });

    it("names the Status on Debit Notes as its pill words it, then the search", () => {
        expect(PARTNER_DEBIT_NOTE_STATUS_LABELS).toEqual({
            active: "Active",
            reversal: "Reversal",
            reversed: "Reversed",
            deleted: "Deleted",
        });
        expect(partnerDebitNoteFilterNotes({ status: "reversed", searchText: "dn" })).toEqual([
            "Status: Reversed",
            'Search: "dn"',
        ]);
        expect(partnerDebitNoteFilterNotes({ status: "paid" })).toEqual([null, null]);
    });

    it("says nothing of a status the tab does not have", () => {
        expect(partnerOrderFilterNotes({ status: "paid" })).toEqual([null, null]);
        expect(partnerPayoutFilterNotes({ status: "success" })).toEqual([null, null]);
        expect(partnerPayoutFilterNotes({ status: "toString" })).toEqual([null, null]);
    });
});
