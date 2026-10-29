const { postingLabel, orderStatusLabel, ORDER_STATUS_FILTER_LABELS } = require("./journalPosting");
const { istDayLabel: dayOf } = require("../../utils/istRange");
const { formatNumberWithLocalString } = require("../../utils/formatter");
const { FILTERED_ROWS_NOTE } = require("../../utils/tableExport");
const { STATEMENT_SIDES } = require("./vendorLedgerFilters");

// The Type filter's choices on Wallet, as the table's Type pill words them.
const SUBSCRIBER_WALLET_TYPE_LABELS = {
    purchase: "Purchase",
    refund: "Refund",
    cashback: "Cashback",
    "cashback-reversal": "Cashback reversal",
    "top-up": "Top-up",
    "admin-credit": "Admin credit",
    "admin-withdrawal": "Admin withdrawal",
};

const labelNote = (name, labels, key) =>
    Object.hasOwn(labels, key) ? `${name}: ${labels[key]}` : null;

const searchNote = searchText => (searchText ? `Search: "${searchText}"` : null);

// What a tab's file says about the filters its table was narrowed by, one note each.
const transactionFilterNotes = ({ status, searchText }) => [
    labelNote("Status", ORDER_STATUS_FILTER_LABELS, status),
    searchNote(searchText),
];

const walletFilterNotes = ({ type, side, searchText }) => [
    labelNote("Type", SUBSCRIBER_WALLET_TYPE_LABELS, type),
    Object.hasOwn(STATEMENT_SIDES, side) ? `${STATEMENT_SIDES[side]} only` : null,
    searchNote(searchText),
];

const billFilterNotes = ({ searchText }) => [searchNote(searchText)];

// The Transactions table's columns, in the table's order, minus the Actions column.
const subscriberTransactionExportColumns = () => [
    { header: "Date", value: row => dayOf(row.transactionDate) },
    { header: "Reference", value: row => row.corporateTxnId },
    { header: "Service", value: row => row.service },
    { header: "Order Amount", value: row => row.orderAmount, money: true },
    { header: "Discount", value: row => row.discount, money: true },
    { header: "Paid from Wallet", value: row => row.paidFromWallet, money: true },
    { header: "Paid via Gateway", value: row => row.paidViaGateway, money: true },
    { header: "Status", value: row => orderStatusLabel(row.status) },
    { header: "Posted", value: row => postingLabel(row.posting) },
];

// The Wallet table's columns, in the table's order. A movement is either a debit or a credit,
// so the other column is left blank, as on screen.
const subscriberWalletExportColumns = () => [
    { header: "Date", value: row => dayOf(row.transactionDate) },
    { header: "Reference", value: row => row.reference },
    { header: "Type", value: row => row.type || "Other" },
    {
        header: "Particulars",
        value: row => [row.particulars, row.remark].filter(Boolean).join(" — "),
    },
    { header: "Debit", value: row => row.debit || null, money: true },
    { header: "Credit", value: row => row.credit || null, money: true },
    { header: "Balance After", value: row => row.balanceAfter, money: true },
    { header: "Posted", value: row => postingLabel(row.posting) },
];

// The Bills table's columns, in the table's order, minus the Actions column.
const subscriberBillExportColumns = () => [
    { header: "Date", value: row => dayOf(row.transactionDate) },
    { header: "Reference", value: row => row.corporateTxnId },
    { header: "Service", value: row => row.service },
    { header: "Document", value: row => row.label },
    { header: "Document No.", value: row => row.documentNumber },
    { header: "Taxable", value: row => row.taxable, money: true },
    { header: "GST", value: row => row.gst, money: true },
    { header: "Total", value: row => row.total, money: true },
];

// The figures the Transactions screen shows above its table, for the PDF.
const subscriberSummaryTiles = summary => [
    { label: "Top-ups", value: summary.topUps, money: true },
    { label: "Spent from Wallet", value: summary.spent, money: true },
    { label: "Paid via Gateway", value: summary.paidViaGateway, money: true },
    { label: "Platform Fee", value: summary.platformFee, money: true },
    { label: "Cashback", value: summary.cashback, money: true },
    { label: "Wallet Balance", value: summary.walletBalance, money: true },
];

const subscriberSummaryNote = ({ from, to }, summary, filtered = false) => {
    const withdrawals =
        summary.withdrawals > 0
            ? ` Admin withdrawals of ₹ ${formatNumberWithLocalString(summary.withdrawals)} in this period are listed on the Wallet tab.`
            : "";

    const note = `Wallet Balance is what the subscriber holds today. Top-ups, Spent from Wallet, Paid via Gateway, Platform Fee and Cashback cover ${dayOf(
        from
    )} to ${dayOf(to)}.${withdrawals}`;
    return filtered ? `${note} ${FILTERED_ROWS_NOTE}` : note;
};

module.exports = {
    SUBSCRIBER_WALLET_TYPE_LABELS,
    subscriberTransactionExportColumns,
    subscriberWalletExportColumns,
    subscriberBillExportColumns,
    subscriberSummaryTiles,
    subscriberSummaryNote,
    transactionFilterNotes,
    walletFilterNotes,
    billFilterNotes,
};
