const moment = require("moment");
const orders = require("../entities/order");
const serviceOperator = require("../entities/serviceOperator");
const credential = require("../entities/credential");

const JOURNAL_LABELS = {
    transaction: "Transaction",
    refund: "Refund",
    adminRefund: "Admin Refund",
    cashback: "Cashback",
    cashbackReversal: "Cashback Reversal",
};

const JOURNAL_STATUS_LABELS = {
    success: "Success",
    failed: "Failed",
    skipped: "Skipped",
    notRecorded: "Not recorded",
};

// LEFT joins (required: false) so subscription orders (serviceOperatorId = null) are kept.
const listOrderJournals = ({ where, order, limit, offset }) =>
    orders.findAndCountAll({
        include: [
            {
                model: serviceOperator,
                attributes: ["id", "serviceProvider", "serviceCategory"],
                required: false,
            },
            {
                model: credential,
                attributes: ["id", "name", "username", "email"],
                required: false,
            },
        ],
        where,
        order,
        limit,
        offset,
        attributes: [
            "id",
            "corporateTxnId",
            "transactionDate",
            "amountInINR",
            "surcharge",
            "paymentMode",
            "paymentModeResponse",
            "status",
            "journalRecordStatus",
            "journalData",
            "optional",
            "orderResponse",
            "credentialId",
            "serviceOperatorId",
            "pekoInvoiceDetails",
        ],
        raw: true,
        nest: true,
        subQuery: false,
    });

// Same reading as the table's Journal Status cell: recorded wins, then skipped, then failed.
const outcomeOf = (recorded, skipped) => {
    if (recorded === true) return "Success";
    if (skipped) return "Skipped";
    if (recorded === false) return "Failed";
    return null;
};

const journalStatusText = (journalRecordStatus, journalData) => {
    const counts = {};
    Object.keys(JOURNAL_LABELS).forEach(key => {
        const outcome = outcomeOf(journalRecordStatus?.[key], journalData?.[key]?.skipped === true);
        if (outcome) counts[outcome] = (counts[outcome] || 0) + 1;
    });
    const parts = ["Success", "Failed", "Skipped"]
        .filter(outcome => counts[outcome])
        .map(outcome => `${outcome}: ${counts[outcome]}`);
    return parts.length ? parts.join(", ") : "Not recorded";
};

// The table's columns, in the table's order, minus the Documents and Actions columns.
const orderJournalExportColumns = () => [
    {
        header: "Transaction Date",
        value: row =>
            row.transactionDate
                ? moment(row.transactionDate).utcOffset("+05:30").format("DD MMM YYYY, hh:mm A")
                : "",
    },
    { header: "Transaction ID", value: row => row.corporateTxnId },
    { header: "Customer", value: row => row.credential?.username },
    { header: "Service", value: row => row.serviceOperator?.serviceProvider },
    { header: "Amount", value: row => Number(row.order.amountInINR) || 0, money: true },
    { header: "Payment Mode", value: row => row.order.paymentMode },
    { header: "Status", value: row => row.order.status },
    {
        header: "Journal Status",
        value: row => journalStatusText(row.order.journalRecordStatus, row.order.journalData),
    },
];

module.exports = {
    JOURNAL_LABELS,
    JOURNAL_STATUS_LABELS,
    listOrderJournals,
    journalStatusText,
    orderJournalExportColumns,
};
