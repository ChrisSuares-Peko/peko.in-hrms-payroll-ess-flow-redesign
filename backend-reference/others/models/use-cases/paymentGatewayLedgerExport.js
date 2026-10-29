const { postingLabel, orderStatusLabel, ORDER_STATUS_FILTER_LABELS } = require("./journalPosting");
const { istDayLabel: dayOf } = require("../../utils/istRange");
const { withVoidedNote, booksLabel, FILTERED_ROWS_NOTE } = require("../../utils/tableExport");

// The Status filters of the Received and Bills tables, as the tables' Status pill words them.
const GATEWAY_RECEIVED_STATUS_LABELS = {
    received: "Received",
    opening: "Opening",
    reversal: "Reversal",
    reversed: "Reversed",
    deleted: "Deleted",
};

const GATEWAY_FEE_STATUS_LABELS = {
    charged: "Charged",
    reversal: "Reversal",
    reversed: "Reversed",
    deleted: "Deleted",
};

const labelNote = (name, labels, key) =>
    Object.hasOwn(labels, key) ? `${name}: ${labels[key]}` : null;

const searchNote = searchText => (searchText ? `Search: "${searchText}"` : null);

// What a table's file says about the filters it was narrowed by, one note each.
const gatewayTransactionFilterNotes = ({ status, searchText }) => [
    labelNote("Status", ORDER_STATUS_FILTER_LABELS, status),
    searchNote(searchText),
];

const gatewayReceiptFilterNotes = ({ status, searchText }) => [
    labelNote("Status", GATEWAY_RECEIVED_STATUS_LABELS, status),
    searchNote(searchText),
];

const gatewayFeeFilterNotes = ({ status, searchText }) => [
    labelNote("Status", GATEWAY_FEE_STATUS_LABELS, status),
    searchNote(searchText),
];

// The Transactions table's columns, in the table's order. An order inside the opening figure is
// marked, because it is history and does not add to the balance the card reports.
const paymentGatewayTransactionExportColumns = () => [
    { header: "Date", value: row => dayOf(row.transactionDate) },
    { header: "Before Opening", value: row => (row.beforeOpening ? "Yes" : "") },
    { header: "Txn ID", value: row => row.corporateTxnId },
    { header: "Subscriber", value: row => row.subscriberName },
    { header: "Service", value: row => row.service },
    { header: "Method", value: row => row.paymentMode },
    { header: "Full Amount", value: row => row.totalAmount, money: true },
    { header: "Through Gateway", value: row => row.gatewayAmount, money: true },
    { header: "Status", value: row => orderStatusLabel(row.status) },
    { header: "Posted", value: row => postingLabel(row.posting) },
];

// A reversal is stored with a positive amount but is shown, and exported, as money taken back.
const signedAmount = row =>
    row.entryType === "REVERSAL" && row.amount ? -row.amount : row.amount;

const settlementStatus = row => {
    if (row.deleted) return "Deleted";
    if (row.entryType === "REVERSAL") return "Reversal";
    if (row.status === "VOIDED") return "Reversed";
    if (row.entryKind === "OPENING") return "Opening";
    return row.entryKind === "FEE" ? "Charged" : "Received";
};

// What a receipt fell short of what was expected is the charge the gateway kept.
const keptAsCharges = row => {
    if (row.expectedAmount === null) return null;
    const shortfall = Math.round((row.expectedAmount - row.amount) * 100) / 100;
    return shortfall || null;
};

// The Received table's columns, in the table's order, minus the Actions column.
const paymentGatewayReceiptExportColumns = () => [
    { header: "Date", value: row => dayOf(row.entryDate) },
    { header: "Entry No.", value: row => row.entryNumber },
    {
        header: "Reference",
        value: row => (row.entryKind === "OPENING" ? "Opening balance" : row.reference),
    },
    { header: "Mode", value: row => row.mode },
    { header: "Received", value: signedAmount, money: true },
    { header: "Expected", value: row => row.expectedAmount, money: true },
    { header: "Kept as Charges", value: keptAsCharges, money: true },
    { header: "Note", value: row => withVoidedNote(row.note, row) },
    { header: "Slip", value: row => row.slipName },
    { header: "Recorded By", value: row => row.recordedByName },
    { header: "Status", value: settlementStatus },
    { header: "In Books", value: booksLabel },
];

// The Bills / Fees Charged table's columns, in the table's order, minus the Actions column.
const paymentGatewayFeeExportColumns = () => [
    { header: "Date", value: row => dayOf(row.entryDate) },
    { header: "Entry No.", value: row => row.entryNumber },
    { header: "Reference", value: row => row.reference },
    { header: "Fee", value: signedAmount, money: true },
    { header: "Note", value: row => withVoidedNote(row.note, row) },
    { header: "Recorded By", value: row => row.recordedByName },
    { header: "Status", value: settlementStatus },
    { header: "In Books", value: booksLabel },
];

// The figures the Transactions screen shows above its table, for the PDF.
const paymentGatewaySummaryTiles = summary => [
    { label: "Collected", value: summary.collected, money: true },
    { label: "Received", value: summary.received, money: true },
    { label: "Charges", value: summary.fees, money: true },
    { label: "Yet To Receive", value: summary.outstanding, money: true },
    {
        label: "Last Receipt",
        value: summary.lastReceiptDate ? dayOf(summary.lastReceiptDate) : "None yet",
    },
];

const MISSING_OPENING_BALANCE_NOTE =
    "No opening balance is set for this gateway, so everything it collected before this portal started recording still counts as outstanding.";

const paymentGatewaySummaryNote = ({ from, to }, openingBalanceSet, filtered = false) => {
    const scope = `Yet To Receive is everything collected to date less everything received and charged to date. Collected, Received and Charges cover ${dayOf(
        from
    )} to ${dayOf(to)}. A refund takes the money back off the gateway on the day it went back.`;

    const note = openingBalanceSet ? scope : `${MISSING_OPENING_BALANCE_NOTE} ${scope}`;
    return filtered ? `${note} ${FILTERED_ROWS_NOTE}` : note;
};

module.exports = {
    GATEWAY_RECEIVED_STATUS_LABELS,
    GATEWAY_FEE_STATUS_LABELS,
    gatewayTransactionFilterNotes,
    gatewayReceiptFilterNotes,
    gatewayFeeFilterNotes,
    paymentGatewayTransactionExportColumns,
    paymentGatewayReceiptExportColumns,
    paymentGatewayFeeExportColumns,
    paymentGatewaySummaryTiles,
    paymentGatewaySummaryNote,
};
