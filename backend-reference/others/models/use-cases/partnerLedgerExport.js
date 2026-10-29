const { postingLabel, orderStatusLabel, ORDER_STATUS_FILTER_LABELS } = require("./journalPosting");
const { istDayLabel: dayOf } = require("../../utils/istRange");
const { withVoidedNote, booksLabel, FILTERED_ROWS_NOTE } = require("../../utils/tableExport");
const { formatNumberWithLocalString } = require("../../utils/formatter");

// The Payments Status filter's choices, as the table's Status pill words them.
const PARTNER_PAYOUT_STATUS_LABELS = {
    paid: "Paid",
    opening: "Opening",
    reversal: "Reversal",
    reversed: "Reversed",
    deleted: "Deleted",
};

// The Debit Notes Status filter's choices, as the table's Status pill words them.
const PARTNER_DEBIT_NOTE_STATUS_LABELS = {
    active: "Active",
    reversal: "Reversal",
    reversed: "Reversed",
    deleted: "Deleted",
};

const labelNote = (name, labels, key) =>
    Object.hasOwn(labels, key) ? `${name}: ${labels[key]}` : null;

const searchNote = searchText => (searchText ? `Search: "${searchText}"` : null);

// What a tab's file says about the filters its table was narrowed by, one note each.
const partnerOrderFilterNotes = ({ status, searchText }) => [
    labelNote("Status", ORDER_STATUS_FILTER_LABELS, status),
    searchNote(searchText),
];

const partnerPayoutFilterNotes = ({ status, searchText }) => [
    labelNote("Status", PARTNER_PAYOUT_STATUS_LABELS, status),
    searchNote(searchText),
];

const partnerDebitNoteFilterNotes = ({ status, searchText }) => [
    labelNote("Status", PARTNER_DEBIT_NOTE_STATUS_LABELS, status),
    searchNote(searchText),
];

const rupees = value => `₹ ${formatNumberWithLocalString(value)}`;

// A coupon comes off the order, so it is shown the way the screen does: as money taken off.
const couponAmount = row => (row.couponTotal ? -row.couponTotal : null);

const sharePercent = value =>
    value === null || value === undefined ? "" : `${formatNumberWithLocalString(value)} %`;

// The share carries GST on the fee, so it is exported whole with both parts beside it, which
// is what the screen shows under the headline figure.
const shareParts = row =>
    row.shareExcludingGST !== null && row.shareGST !== null
        ? { excluding: row.shareExcludingGST, gst: row.shareGST }
        : { excluding: null, gst: null };

// The Transactions table's columns, in the table's order.
const partnerTransactionExportColumns = () => [
    { header: "Date", value: row => dayOf(row.transactionDate) },
    { header: "Txn ID", value: row => row.corporateTxnId },
    { header: "Subscriber", value: row => row.subscriberName },
    { header: "Service", value: row => row.service },
    { header: "Full Amount", value: row => row.totalAmount, money: true },
    { header: "Net Platform Fee", value: row => row.netPlatformFee, money: true },
    { header: "Net Commission", value: row => row.netCommission, money: true },
    { header: "Coupon", value: couponAmount, money: true },
    { header: "Gateway Charge", value: row => row.gatewayCharge, money: true },
    { header: "Share Base", value: row => row.shareBase, money: true },
    { header: "Share Applied", value: row => sharePercent(row.sharePercentageApplied) },
    { header: "Partner Share", value: row => row.partnerShare, money: true },
    { header: "Share (excl. GST)", value: row => shareParts(row).excluding, money: true },
    { header: "Share GST", value: row => shareParts(row).gst, money: true },
    { header: "Status", value: row => orderStatusLabel(row.status) },
    { header: "Posted", value: row => postingLabel(row.posting) },
];

// The Own Subscriptions table's columns, in the table's order.
const partnerSubscriptionExportColumns = () => [
    { header: "Date", value: row => dayOf(row.transactionDate) },
    { header: "Txn ID", value: row => row.corporateTxnId },
    { header: "Subscriber", value: row => row.subscriberName },
    { header: "Plan", value: row => row.planName },
    { header: "Billing", value: row => row.billingType },
    { header: "Kind", value: row => (row.addOn ? "Add-on" : "Plan") },
    { header: "Amount (incl. GST)", value: row => row.totalAmount, money: true },
    { header: "Coupon", value: couponAmount, money: true },
    { header: "Gateway Charge", value: row => row.gatewayCharge, money: true },
    { header: "Share Base", value: row => row.shareBase, money: true },
    { header: "Share Applied", value: row => sharePercent(row.sharePercentageApplied) },
    { header: "Partner Share", value: row => row.partnerShare, money: true },
    { header: "Share (excl. GST)", value: row => shareParts(row).excluding, money: true },
    { header: "Share GST", value: row => shareParts(row).gst, money: true },
    { header: "Net Revenue (excl. GST)", value: row => row.netRevenue, money: true },
    { header: "Status", value: row => orderStatusLabel(row.status) },
    { header: "Posted", value: row => postingLabel(row.posting) },
];

// A payout that differed from the suggestion says so, so an underpayment is visible.
const shortOrOver = row =>
    row.calculatedAmount !== null && row.difference
        ? `${row.difference < 0 ? "Short by" : "Over by"} ${rupees(Math.abs(row.difference))}`
        : "";

const payoutStatus = row => {
    if (row.deleted) return "Deleted";
    if (row.entryType === "REVERSAL") return "Reversal";
    if (row.status === "VOIDED") return "Reversed";
    return row.entryKind === "OPENING" ? "Opening" : "Paid";
};

// The Payments table's columns, in the table's order, minus the Actions column. A reversal is
// stored with a positive amount but is shown, and exported, as money taken back.
const partnerPayoutExportColumns = () => [
    { header: "Date", value: row => dayOf(row.payoutDate) },
    { header: "Entry No.", value: row => row.entryNumber },
    {
        header: "Reference",
        value: row => (row.entryKind === "OPENING" ? "Opening balance" : row.reference),
    },
    { header: "Mode", value: row => row.mode },
    {
        header: "Paid",
        value: row => (row.entryType === "REVERSAL" && row.amount ? -row.amount : row.amount),
        money: true,
    },
    { header: "Calculated", value: row => row.calculatedAmount, money: true },
    { header: "Short / Over", value: shortOrOver },
    { header: "Note", value: row => withVoidedNote(row.note, row) },
    { header: "Slip", value: row => row.slipName },
    { header: "Recorded By", value: row => row.recordedByName },
    { header: "Status", value: payoutStatus },
    { header: "In Books", value: booksLabel },
];

const debitNoteStatus = row => {
    if (row.deleted) return "Deleted";
    if (row.entryType === "REVERSAL") return "Reversal";
    return row.status === "VOIDED" ? "Reversed" : "Active";
};

// The Debit Notes table's columns, in the table's order, minus the Actions column. A reversal
// is stored with a positive amount but is shown, and exported, as money given back.
const signedEntryAmount = (row, value) =>
    row.entryType === "REVERSAL" && value ? -value : value ?? null;

const partnerDebitNoteExportColumns = () => [
    { header: "Date", value: row => dayOf(row.issueDate) },
    { header: "Entry No.", value: row => row.entryNumber },
    { header: "Against Order", value: row => row.againstCorporateTxnId },
    { header: "Reason", value: row => withVoidedNote(row.reason, row) },
    { header: "Taxable Amount", value: row => signedEntryAmount(row, row.taxableAmount), money: true },
    { header: "GST", value: row => signedEntryAmount(row, row.gstAmount), money: true },
    { header: "Total (incl. GST)", value: row => signedEntryAmount(row, row.amount), money: true },
    { header: "Document", value: row => row.slipName },
    { header: "Recorded By", value: row => row.recordedByName },
    { header: "Status", value: debitNoteStatus },
    { header: "In Books", value: booksLabel },
];

const lastPayment = summary => (summary.lastPayoutDate ? dayOf(summary.lastPayoutDate) : "None yet");

// The figures the Transactions screen shows above its table, for the PDF.
const partnerSummaryTiles = summary => [
    { label: "Earned", value: summary.earned, money: true },
    { label: "Paid", value: summary.paid, money: true },
    { label: "Debit Notes", value: summary.debitNotes, money: true },
    { label: "GMV", value: summary.gmv, money: true },
    { label: "Left To Pay", value: summary.owed, money: true },
    { label: "Last Payment", value: lastPayment(summary) },
];

// The two figures the Payments screen shows above its table, for the PDF.
const partnerPaymentsTiles = summary => [
    { label: "Left to pay", value: summary.owed, money: true },
    { label: "Last payment", value: lastPayment(summary) },
];

const MISSING_OPENING_BALANCE_NOTE =
    "No opening balance is set for this partner, so everything it earned before this portal started recording still counts as unpaid.";

const withOpeningWarning = (note, openingBalanceSet) =>
    openingBalanceSet ? note : `${MISSING_OPENING_BALANCE_NOTE} ${note}`;

const PAYMENTS_FILTERED_NOTE =
    "The rows follow the filters chosen, but the figures above always cover everything to date.";

const partnerSummaryNote = ({ from, to }, openingBalanceSet, filtered = false) => {
    const note = withOpeningWarning(
        `GMV is the full value of every successful order for this partner, before any discount, whether or not an accounting entry exists. GMV, Earned, Paid and Debit Notes cover ${dayOf(
            from
        )} to ${dayOf(to)}. A refund takes the share back on the day it came back.`,
        openingBalanceSet
    );
    return filtered ? `${note} ${FILTERED_ROWS_NOTE}` : note;
};

const partnerPaymentsNote = (partnerName, openingBalanceSet, filtered = false) => {
    const note = withOpeningWarning(
        `Left to pay is everything ${partnerName} has earned to date less everything already paid and every debit note raised, so a payout entered below the suggestion stays owed rather than being written off.`,
        openingBalanceSet
    );
    return filtered ? `${note} ${PAYMENTS_FILTERED_NOTE}` : note;
};

module.exports = {
    PARTNER_PAYOUT_STATUS_LABELS,
    PARTNER_DEBIT_NOTE_STATUS_LABELS,
    PAYMENTS_FILTERED_NOTE,
    partnerOrderFilterNotes,
    partnerPayoutFilterNotes,
    partnerDebitNoteFilterNotes,
    partnerTransactionExportColumns,
    partnerSubscriptionExportColumns,
    partnerPayoutExportColumns,
    partnerDebitNoteExportColumns,
    partnerSummaryTiles,
    partnerPaymentsTiles,
    partnerSummaryNote,
    partnerPaymentsNote,
};
