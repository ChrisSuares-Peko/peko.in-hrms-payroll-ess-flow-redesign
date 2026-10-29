const moment = require("moment");

const CONFIG_TYPE_LABELS = {
    SERVICE_COMMISSION: "Service commission",
    SERVICE_VENDOR: "Service vendor",
    PLAN_COMMISSION: "Plan commission",
    PLAN_PRICE: "Plan price",
    PLATFORM_FEE: "Platform fee",
    CASHBACK: "Cashback",
    SUBSCRIPTION_PRICING: "Subscription pricing",
    SUBSCRIPTION_STATUS: "Subscription status",
    SUBSCRIPTION_ADDON: "Subscription add-on",
    WHITELABEL_SHARE: "Whitelabel share",
    WHITELABEL_STATUS: "Whitelabel status",
    VENDOR_LEDGER: "Vendor ledger entry",
    PARTNER_LEDGER: "Partner ledger entry",
    GATEWAY_LEDGER: "Gateway ledger entry",
    VENDOR_INVOICE: "Vendor invoice",
    PAYMENT_LINK_CHARGE: "Payment link charge",
};

const SOURCE_LABELS = {
    ACCOUNTING_PORTAL: "Accounting Portal",
    ADMIN_PANEL: "Admin Panel",
};

const ACTION_LABELS = { CREATE: "Created", UPDATE: "Updated", DELETE: "Deleted" };

const FIELD_LABELS = {
    commissionMode: "Commission mode",
    commissionType: "Commission type",
    providerCommission: "Commission",
    commission: "Commission",
    fixedCommissionPerTransaction: "Fixed amount per transaction",
    isCommissionInclGST: "GST included in commission",
    isCommissionConfigured: "Commission marked configured",
    planCommissions: "Split commission",
    surchargeType: "Platform fee type",
    surcharge: "Platform fee",
    isSurchargeConfigured: "Platform fee marked configured",
    cashbackType: "Cashback type",
    cashback: "Cashback",
    serviceStatus: "Switched on",
    unitPrice: "Unit price",
    baseLimit: "Base limit",
    price: "Price",
    monthlyPrice: "Monthly price",
    yearlyPrice: "Yearly price",
    packagePrices: "Prices",
    discount: "Discount",
    sharePercentage: "Share %",
    gatewayCharge: "Gateway charge",
    accountingCharge: "Payment link charge",
    percentage: "Charge %",
    fixed: "Charge per transaction",
    brandingStatus: "Whitelabel on",
    status: "Switched on",
    vendorName: "Vendor name",
    state: "State",
    gstNo: "GST number",
    address: "Address",
    vendorEmail: "Vendor email",
    amount: "Amount",
    taxableAmount: "Taxable amount",
    gst: "GST",
    gstRate: "GST rate",
    gstInclusive: "Amount entered inclusive of GST",
    date: "Date",
    reference: "Reference",
    mode: "Mode",
    note: "Note",
    reason: "Reason",
    againstOrder: "Against order",
    document: "Document",
    changeReason: "Reason given",
    booksSynced: "Synced to books",
    removedFromPortal: "Removed from the portal",
    companyName: "Billed to: company",
    gstin: "Billed to: GSTIN",
    placeOfSupply: "Place of supply",
    taxCase: "Tax split",
    sentTo: "Sent to",
};

const EMPTY_VALUE = "—";

const isPrimitive = value => ["string", "number", "boolean"].includes(typeof value);

// Values read the way the Audit Trail screen shows them.
const formatValue = value => {
    if (value === null || value === undefined || value === "") return EMPTY_VALUE;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") return String(Number(value.toFixed(4)));
    if (typeof value === "string") return value;
    if (Array.isArray(value) && value.every(isPrimitive)) return value.join(", ");
    if (typeof value === "object") {
        const entries = Object.entries(value);
        if (entries.every(([, item]) => isPrimitive(item) || item === null)) {
            return entries.map(([key, item]) => `${key}: ${formatValue(item)}`).join(", ");
        }
    }
    return JSON.stringify(value);
};

const describeChange = (change, action) => {
    const label = FIELD_LABELS[change.field] || change.field;
    if (change.field === "changeReason") return `${label}: ${formatValue(change.to)}`;
    if (action === "CREATE") return `${label}: ${formatValue(change.to)}`;
    if (action === "DELETE") return `${label}: ${formatValue(change.from)}`;
    return `${label}: ${formatValue(change.from)} → ${formatValue(change.to)}`;
};

const configurationOf = row => {
    const label = CONFIG_TYPE_LABELS[row.configType] || row.configType;
    return row.action === "UPDATE" ? label : `${label} (${ACTION_LABELS[row.action]})`;
};

// The table's columns, in the table's order.
const configAuditLogExportColumns = () => [
    {
        header: "When",
        value: row => moment(row.createdAt).utcOffset("+05:30").format("DD MMM YYYY, hh:mm A"),
    },
    { header: "Who", value: row => row.actorName },
    { header: "IP address", value: row => row.ipAddress },
    { header: "Changed from", value: row => SOURCE_LABELS[row.source] || row.source },
    { header: "Configuration", value: configurationOf },
    { header: "For", value: row => row.targetLabel },
    { header: "Partner", value: row => row.partnerName },
    {
        header: "What changed",
        value: row => row.changes.map(change => describeChange(change, row.action)).join("; "),
    },
];

module.exports = {
    CONFIG_TYPE_LABELS,
    SOURCE_LABELS,
    FIELD_LABELS,
    configAuditLogExportColumns,
};
