const moment = require("moment");
const { postingLabel, orderStatusLabel } = require("./journalPosting");
const { istDayLabel: dayOf } = require("../../utils/istRange");
const { withVoidedNote, booksLabel, FILTERED_ROWS_NOTE } = require("../../utils/tableExport");

const booksOrPostingLabel = row => (row.source === "MANUAL" ? booksLabel(row) : postingLabel(row.posting));

// How a reversed or voided row is worded in the Status column of Deposits and Credit Notes.
const entryStatus = row => {
    if (row.deleted) return "Deleted";
    if (row.entryType === "REVERSAL") return "Reversal";
    if (row.status === "VOIDED") return "Reversed";
    return row.entryType === "OPENING" ? "Opening" : "Active";
};

// A reversal is stored with a positive amount but lands on the balance as a deduction, so the
// sheet shows it that way too and a column still adds up.
const signed = (row, value) => {
    if (value === null || value === undefined) return null;
    return row.entryType === "REVERSAL" && value ? -value : value;
};

const commissionStatus = row => {
    if (row.source !== "MANUAL") return row.refunded ? "Refunded" : "Earned";
    if (row.deleted) return "Deleted";
    if (row.entryType === "REVERSAL") {
        return row.reference ? `Reversal (reverses ${row.reference})` : "Reversal";
    }
    return row.status === "VOIDED" ? "Reversed" : "Active";
};

const SOLD_AS_LABELS = {
    MARGIN: "Margin",
    AGENT_MARKUP: "Agent Markup",
    PRINCIPAL_MARKUP: "Principal Markup",
    MIXED: "Margin + Principal Markup",
    OWN_REVENUE: "Own revenue",
};

const soldAsLabel = mode => SOLD_AS_LABELS[mode] || null;

// The Transactions table's columns, in the table's order.
const vendorTransactionExportColumns = () => [
    { header: "Date", value: row => dayOf(row.transactionDate) },
    { header: "Reference", value: row => row.corporateTxnId },
    { header: "Sold As", value: row => soldAsLabel(row.commissionMode) },
    { header: "Service", value: row => row.service },
    { header: "Customer", value: row => row.customer },
    { header: "Vendor Amount", value: row => row.vendorAmount, money: true },
    { header: "Commission (incl. VAT)", value: row => row.commission, money: true },
    { header: "Markup", value: row => row.markup, money: true },
    { header: "Payable", value: row => row.receivable, money: true },
    { header: "Status", value: row => (row.refunded ? "Refunded" : orderStatusLabel(row.status)) },
    { header: "Posted", value: row => postingLabel(row.posting) },
];

// The Commissions table's columns, in the table's order, minus the Actions column.
const vendorCommissionExportColumns = () => [
    { header: "Date", value: row => dayOf(row.transactionDate) },
    { header: "Entry No.", value: row => row.entryNumber },
    { header: "Order Ref", value: row => row.corporateTxnId || row.againstCorporateTxnId || null },
    { header: "Service", value: row => row.service || row.reason || "Recorded by hand" },
    { header: "Order Value", value: row => row.orderAmount, money: true },
    {
        header: "Commission (excl. GST)",
        value: row => signed(row, row.commissionExcludingGST),
        money: true,
    },
    { header: "GST", value: row => signed(row, row.commissionGST ?? null), money: true },
    {
        header: "Commission (incl. GST)",
        value: row => signed(row, row.commissionIncludingGST),
        money: true,
    },
    { header: "Principal Markup", value: row => row.principalMarkup ?? null, money: true },
    {
        header: "Reversed",
        value: row => (row.commissionReversed ? -row.commissionReversed : null),
        money: true,
    },
    { header: "Net", value: row => signed(row, row.commissionNet), money: true },
    { header: "Source", value: row => (row.source === "MANUAL" ? "Manual" : "Order") },
    { header: "Status", value: commissionStatus },
    { header: "In Books", value: booksOrPostingLabel },
];

// The Deposits table's columns, in the table's order, minus the Actions column.
const vendorDepositExportColumns = () => [
    { header: "Date", value: row => dayOf(row.depositDate) },
    { header: "Entry No.", value: row => row.entryNumber },
    {
        header: "Reference",
        value: row => (row.entryType === "OPENING" ? "Opening balance" : row.reference),
    },
    { header: "Mode", value: row => row.mode },
    {
        header: "Amount",
        value: row => (row.entryType === "REVERSAL" && row.amount ? -row.amount : row.amount),
        money: true,
    },
    { header: "Note", value: row => withVoidedNote(row.note, row) },
    { header: "Slip", value: row => row.slipName },
    { header: "Recorded By", value: row => row.recordedByName },
    { header: "Status", value: entryStatus },
    { header: "In Books", value: booksLabel },
];

const signedCreditNoteAmount = (row, value) =>
    row.source === "MANUAL" && row.entryType === "REVERSAL" && value ? -value : value ?? null;

// The Credit Notes table's columns, in the table's order, minus the Document and Actions columns.
// Only a manual reversal is shown as a deduction; the commission that came back on a refund is not.
const vendorCreditNoteExportColumns = () => [
    { header: "Date", value: row => dayOf(row.issueDate) },
    { header: "Entry No.", value: row => row.entryNumber },
    { header: "Against Order", value: row => row.againstCorporateTxnId },
    { header: "Reason", value: row => withVoidedNote(row.reason, row) },
    { header: "Taxable Amount", value: row => signedCreditNoteAmount(row, row.taxableAmount), money: true },
    { header: "GST", value: row => signedCreditNoteAmount(row, row.gstAmount), money: true },
    { header: "Total (incl. GST)", value: row => signedCreditNoteAmount(row, row.amount), money: true },
    { header: "Source", value: row => (row.source === "AUTO" ? "From refund" : "Manual") },
    { header: "Status", value: entryStatus },
    { header: "In Books", value: booksOrPostingLabel },
];

const signedEntryAmount = (row, value) =>
    row.entryType === "REVERSAL" && value ? -value : value ?? null;

// The Cost of Sales table's columns, in the table's order, minus the Document and Actions columns.
const vendorCostOfSalesExportColumns = () => [
    { header: "Date", value: row => dayOf(row.issueDate) },
    { header: "Entry No.", value: row => row.entryNumber },
    { header: "Against Order", value: row => row.againstCorporateTxnId },
    { header: "Reason", value: row => withVoidedNote(row.reason, row) },
    { header: "Taxable Amount", value: row => signedEntryAmount(row, row.taxableAmount), money: true },
    { header: "GST", value: row => signedEntryAmount(row, row.gstAmount), money: true },
    { header: "Total (incl. GST)", value: row => signedEntryAmount(row, row.amount), money: true },
    { header: "Recorded By", value: row => row.recordedByName },
    { header: "Status", value: entryStatus },
    { header: "In Books", value: booksLabel },
];

const vendorDebitNoteExportColumns = () => [
    { header: "Date", value: row => dayOf(row.issueDate) },
    { header: "Entry No.", value: row => row.entryNumber },
    { header: "Against Order", value: row => row.againstCorporateTxnId },
    { header: "Reason", value: row => withVoidedNote(row.reason, row) },
    { header: "Taxable Amount", value: row => signedEntryAmount(row, row.taxableAmount), money: true },
    { header: "GST", value: row => signedEntryAmount(row, row.gstAmount), money: true },
    { header: "Total (incl. GST)", value: row => signedEntryAmount(row, row.amount), money: true },
    { header: "Recorded By", value: row => row.recordedByName },
    { header: "Status", value: entryStatus },
    { header: "In Books", value: booksLabel },
];

// The figures the Transactions screen shows above its table, for the PDF.
const vendorSummaryTiles = summary => [
    { label: "Opening Balance", value: summary.openingBalance, money: true },
    { label: "Deposit", value: summary.deposited, money: true },
    { label: "Total Transaction", value: summary.totalTransaction, money: true },
    { label: "Commission earned", value: summary.commission, money: true },
    { label: "Available", value: summary.available, money: true },
];

const MISSING_OPENING_BALANCE_NOTE =
    "No opening balance is set for this vendor, so anything owed before this portal started recording is missing from these figures.";

// The Status filter's choices, as the Transactions screen words them.
const VENDOR_ORDER_STATUS_LABELS = { success: "Success", refunded: "Refunded", failed: "Failed" };

// The Commissions Status filter's choices, as the table's Status pill words them.
const VENDOR_COMMISSION_STATUS_LABELS = {
    earned: "Earned",
    refunded: "Refunded",
    active: "Active",
    reversal: "Reversal",
    reversed: "Reversed",
    deleted: "Deleted",
};

// The Deposits Status filter's choices, as the table's Status pill words them.
const VENDOR_DEPOSIT_STATUS_LABELS = {
    active: "Active",
    opening: "Opening",
    reversal: "Reversal",
    reversed: "Reversed",
    deleted: "Deleted",
};

// The Credit Notes Status filter's choices, as the table's Status pill words them.
const VENDOR_CREDIT_NOTE_STATUS_LABELS = {
    active: "Active",
    reversal: "Reversal",
    reversed: "Reversed",
    deleted: "Deleted",
};

// The Cost of Sales Status filter's choices, the same four a hand-recorded entry can be in.
const VENDOR_COST_OF_SALES_STATUS_LABELS = { ...VENDOR_CREDIT_NOTE_STATUS_LABELS };
const VENDOR_DEBIT_NOTE_STATUS_LABELS = { ...VENDOR_CREDIT_NOTE_STATUS_LABELS };

const vendorSummaryNote = ({ from, to }, openingBalanceSet, filtered = false) => {
    const scope = `Opening Balance is the balance through ${moment(from)
        .utcOffset("+05:30")
        .subtract(1, "day")
        .format("DD MMM YYYY")}. Deposit, Total Transaction, Commission earned and Available cover ${dayOf(
        from
    )} to ${dayOf(
        to
    )}. Total Transaction includes order amounts, credit notes and cost of sales, net of reversals. Available is the balance at the end of the selected period: Opening Balance + Deposit − Total Transaction + Commission earned. Commission earned is net of refunds and includes the commissions recorded by hand.`;

    const note = openingBalanceSet ? scope : `${MISSING_OPENING_BALANCE_NOTE} ${scope}`;
    return filtered ? `${note} ${FILTERED_ROWS_NOTE}` : note;
};

module.exports = {
    vendorTransactionExportColumns,
    vendorCommissionExportColumns,
    vendorDepositExportColumns,
    vendorCreditNoteExportColumns,
    vendorCostOfSalesExportColumns,
    vendorDebitNoteExportColumns,
    vendorSummaryTiles,
    vendorSummaryNote,
    VENDOR_ORDER_STATUS_LABELS,
    VENDOR_COMMISSION_STATUS_LABELS,
    VENDOR_DEPOSIT_STATUS_LABELS,
    VENDOR_CREDIT_NOTE_STATUS_LABELS,
    VENDOR_COST_OF_SALES_STATUS_LABELS,
    VENDOR_DEBIT_NOTE_STATUS_LABELS,
};
