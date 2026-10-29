const PLAN_ENTITY_CONFIG = require("./planEntityConfig");
const {
    OPERATOR_COMMISSION,
    PLAN_COMMISSION,
    PACKAGE_COMMISSION,
    SURCHARGE,
} = require("./configuredFlag");

const BOOLEAN_FIELDS = new Set([
    "isCommissionInclGST",
    "isCommissionConfigured",
    "isSurchargeConfigured",
    "serviceStatus",
    "brandingStatus",
    "status",
]);

const NUMERIC = /^-?\d+(\.\d+)?$/;

const withFlag = (group) => [...group.fields, group.flag];

const SERVICE_OF_ACCESS_KEY =
    "(SELECT serviceProvider FROM serviceOperators WHERE accessKey = :accessKey LIMIT 1)";

// Each describe query returns id, name, parent and partner: a row is labelled "Service › Plan",
// and partner is the partner it belongs to (null when the setting is not a partner's).
const DEFAULT_PARTNER = "Peko (Default)";

const partnerOf = (nameExpression) => `COALESCE(${nameExpression}, '${DEFAULT_PARTNER}')`;

const planDescribe = (table, nameExpression, { joins = "", partner = "NULL" } = {}) =>
    `SELECT ${table}.id AS id, ${nameExpression} AS name, ${SERVICE_OF_ACCESS_KEY} AS parent, ${partner} AS partner FROM ${table} ${joins} WHERE ${table}.id IN (:ids)`;

const AUDITED_TABLES = {
    serviceOperators: {
        groups: { SERVICE_COMMISSION: withFlag(OPERATOR_COMMISSION) },
        describe:
            "SELECT id, serviceProvider AS name, NULL AS parent, NULL AS partner FROM serviceOperators WHERE id IN (:ids)",
    },
    vendors: {
        groups: {
            SERVICE_VENDOR: [
                "vendorName",
                "state",
                "gstNo",
                "address",
                "vendorEmail",
            ],
        },
        describe:
            "SELECT id, vendorName AS name, NULL AS parent, NULL AS partner FROM vendors WHERE id IN (:ids)",
    },
    cashbacks: {
        groups: {
            PLATFORM_FEE: withFlag(SURCHARGE),
            CASHBACK: ["cashbackType", "cashback", "serviceStatus"],
            SUBSCRIPTION_ADDON: ["unitPrice", "baseLimit"],
        },
        lifecycle: "CASHBACK",
        describe: `SELECT cashbacks.id AS id, packages.packageName AS name, serviceOperators.serviceProvider AS parent, ${partnerOf(
            "credentials.name"
        )} AS partner FROM cashbacks LEFT JOIN serviceOperators ON serviceOperators.id = cashbacks.serviceOperatorId LEFT JOIN packages ON packages.id = cashbacks.packageId LEFT JOIN credentials ON credentials.id = packages.partnerId WHERE cashbacks.id IN (:ids)`,
    },
    packages: {
        groups: {
            PLAN_COMMISSION: withFlag(PACKAGE_COMMISSION),
            SUBSCRIPTION_PRICING: ["packagePrices", "discount"],
            SUBSCRIPTION_STATUS: ["status"],
        },
        describe: `SELECT packages.id AS id, packages.packageName AS name, NULL AS parent, ${partnerOf(
            "credentials.name"
        )} AS partner FROM packages LEFT JOIN credentials ON credentials.id = packages.partnerId WHERE packages.id IN (:ids)`,
    },
    mobileRechargeProviders: {
        groups: { PLAN_COMMISSION: withFlag(PLAN_COMMISSION) },
        describe: planDescribe(
            "mobileRechargeProviders",
            "COALESCE(mobileRechargeProviders.displayName, mobileRechargeProviders.providerName)"
        ),
    },
    plans: {
        groups: { PLAN_COMMISSION: withFlag(PLAN_COMMISSION), PLAN_PRICE: ["price"] },
        describe: planDescribe("plans", "plans.name"),
    },
    paymentLinkOnboardings: {
        groups: { PAYMENT_LINK_CHARGE: ["accountingCharge"] },
        describe:
            "SELECT paymentLinkOnboardings.id AS id, credentials.name AS name, 'Payment Links' AS parent, NULL AS partner FROM paymentLinkOnboardings LEFT JOIN credentials ON credentials.id = paymentLinkOnboardings.credentialId WHERE paymentLinkOnboardings.id IN (:ids)",
    },
    systemUsers: {
        groups: {
            WHITELABEL_SHARE: ["sharePercentage", "gatewayCharge"],
            WHITELABEL_STATUS: ["brandingStatus"],
        },
        describe:
            "SELECT systemUsers.id AS id, credentials.name AS name, NULL AS parent, credentials.name AS partner FROM systemUsers LEFT JOIN credentials ON credentials.id = systemUsers.credentialId WHERE systemUsers.id IN (:ids)",
    },
};

// The remaining plan tables are written only through accountingPlans.js, which audits them itself.
Object.values(PLAN_ENTITY_CONFIG).forEach(
    ({ table, nameColumn, joins, extraColumns, priceEditable, priceColumn, annualPriceColumn }) => {
    if (AUDITED_TABLES[table]) return;
    const partner = extraColumns && extraColumns.partnerName;
    // The price columns the Accounting Portal edits are audited next to the commission.
    const priceFields = priceEditable ? [priceColumn, annualPriceColumn].filter(Boolean) : [];
    AUDITED_TABLES[table] = {
        groups: {
            PLAN_COMMISSION: withFlag(PLAN_COMMISSION),
            ...(priceFields.length ? { PLAN_PRICE: priceFields } : {}),
        },
        describe: planDescribe(table, `${table}.${nameColumn}`, {
            joins,
            partner: partner && partner.replace("'Default'", `'${DEFAULT_PARTNER}'`),
        }),
    };
    }
);

Object.entries(AUDITED_TABLES).forEach(([table, spec]) => {
    spec.table = table;
    spec.tracked = [...new Set(Object.values(spec.groups).flat())];
});

const accessKeysByTable = {};
Object.entries(PLAN_ENTITY_CONFIG).forEach(([accessKey, { table }]) => {
    accessKeysByTable[table] = [...(accessKeysByTable[table] || []), accessKey];
});

// Only a table with a single service can name it; packages hold two.
const accessKeyOfTable = (table) => {
    const keys = accessKeysByTable[table] || [];
    return keys.length === 1 ? keys[0] : null;
};

const specOfTable = (table) => AUDITED_TABLES[table] || null;

const specOf = (model) =>
    model && model.tableName ? specOfTable(model.tableName) : null;

const LEDGER_AUDIT_TYPES = {
    vendor: "VENDOR_LEDGER",
    partner: "PARTNER_LEDGER",
    gateway: "GATEWAY_LEDGER",
    invoice: "VENDOR_INVOICE",
};

const CONFIG_TYPES = [
    ...new Set([
        ...Object.values(AUDITED_TABLES).flatMap((spec) => [
            ...Object.keys(spec.groups),
            ...(spec.lifecycle ? [spec.lifecycle] : []),
        ]),
        ...Object.values(LEDGER_AUDIT_TYPES),
    ]),
];

const displayValue = (field, value) => {
    if (value === undefined || value === null || value === "") return null;
    if (BOOLEAN_FIELDS.has(field))
        return (
            value === true || value === 1 || value === "1" || value === "true"
        );
    return typeof value === "string" && NUMERIC.test(value.trim())
        ? Number(value)
        : value;
};

// An add-on's amount and commission are keys inside one JSON column (settings.details), so the hooks have no
// column to compare: accountingAddOns.js reports the change itself (auditHooks.auditSettingChange). It is filed
// under the plan config types, so it reads like the plans' own entries.
const ADDON_AUDIT = {
    table: "settings",
    groups: {
        PLAN_COMMISSION: withFlag(PLAN_COMMISSION),
        PLAN_PRICE: ["amount"],
    },
};
ADDON_AUDIT.tracked = [...new Set(Object.values(ADDON_AUDIT.groups).flat())];

// The default payment link charge is one JSON settings row, reported the same way as an add-on.
const PAYMENT_LINK_CHARGE_AUDIT = {
    table: "settings",
    groups: { PAYMENT_LINK_CHARGE: ["percentage", "fixed"] },
};
PAYMENT_LINK_CHARGE_AUDIT.tracked = [...new Set(Object.values(PAYMENT_LINK_CHARGE_AUDIT.groups).flat())];

module.exports = {
    AUDITED_TABLES,
    ADDON_AUDIT,
    PAYMENT_LINK_CHARGE_AUDIT,
    CONFIG_TYPES,
    LEDGER_AUDIT_TYPES,
    specOf,
    specOfTable,
    accessKeyOfTable,
    displayValue,
};
