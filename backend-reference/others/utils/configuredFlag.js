const { customLog } = require("./loggerHelper");

const COMMISSION_FLAG = "isCommissionConfigured";
const SURCHARGE_FLAG = "isSurchargeConfigured";

const OPERATOR_COMMISSION = {
    flag: COMMISSION_FLAG,
    fields: [
        "commissionMode",
        "commissionType",
        "providerCommission",
        "fixedCommissionPerTransaction",
        "isCommissionInclGST",
    ],
};

const PLAN_COMMISSION = {
    flag: COMMISSION_FLAG,
    fields: ["commissionMode", "commissionType", "commission", "fixedCommissionPerTransaction", "isCommissionInclGST"],
};

const PACKAGE_COMMISSION = { flag: COMMISSION_FLAG, fields: [...PLAN_COMMISSION.fields, "planCommissions"] };

const SURCHARGE = { flag: SURCHARGE_FLAG, fields: ["surchargeType", "surcharge"] };

const NUMERIC = /^-?\d+(\.\d+)?$/;

const parseJson = text => {
    try {
        return JSON.parse(text);
    } catch (error) {
        return undefined;
    }
};

const canonical = value => {
    if (value === undefined || value === null || value === "") return null;
    if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
    if (typeof value === "object") {
        return `{${Object.keys(value)
            .sort()
            .map(key => `${JSON.stringify(key)}:${canonical(value[key])}`)
            .join(",")}}`;
    }
    if (typeof value === "boolean") return value ? 1 : 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") {
        const text = value.trim();
        if (text === "") return null;
        if (text === "true") return 1;
        if (text === "false") return 0;
        if (NUMERIC.test(text)) return Number(text);
        const parsed = parseJson(text);
        return parsed && typeof parsed === "object" ? canonical(parsed) : text;
    }
    return value;
};

const presentFields = (incoming, fields) =>
    fields.filter(
        field => incoming && Object.prototype.hasOwnProperty.call(incoming, field) && incoming[field] !== undefined
    );

const touches = (incoming, group) => presentFields(incoming, group.fields).length > 0;

const changedFields = (existing, incoming, fields) =>
    presentFields(incoming, fields).filter(field => canonical(existing[field]) !== canonical(incoming[field]));

const reviewOnChange = (existing, incoming, group) => {
    const data = { ...(incoming || {}) };
    delete data[group.flag];
    const changed = existing ? changedFields(existing, data, group.fields) : [];
    return { data: changed.length ? { ...data, [group.flag]: false } : data, changed };
};

const reviewedChange = async ({ existing, load, incoming, group, table, id }) => {
    if (!touches(incoming, group)) {
        const data = { ...(incoming || {}) };
        delete data[group.flag];
        return data;
    }
    const current = existing !== undefined ? existing : await load();
    const { data, changed } = reviewOnChange(current, incoming, group);
    if (changed.length) {
        customLog(null, "info", {
            message: `${group.flag === SURCHARGE_FLAG ? "Platform fee" : "Commission"} re-entered review`,
            table,
            id,
            fields: changed,
        });
    }
    return data;
};

module.exports = {
    COMMISSION_FLAG,
    SURCHARGE_FLAG,
    OPERATOR_COMMISSION,
    PLAN_COMMISSION,
    PACKAGE_COMMISSION,
    SURCHARGE,
    canonical,
    touches,
    changedFields,
    reviewOnChange,
    reviewedChange,
};
