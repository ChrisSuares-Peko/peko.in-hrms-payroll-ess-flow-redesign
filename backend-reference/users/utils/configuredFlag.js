const PLAN_COMMISSION = {
    flag: "isCommissionConfigured",
    fields: ["commissionMode", "commissionType", "commission", "fixedCommissionPerTransaction", "isCommissionInclGST"],
};

const removeFrom = (item, fields) => {
    if (!item || typeof item !== "object") return;
    const target = item.dataValues || item;
    fields.forEach((field) => delete target[field]);
};

// Removes the commission columns (customers must not see them) from the object(s) in place; takes one object or an array.
const removeCommissionFields = (items, fields = PLAN_COMMISSION.fields) => {
    (Array.isArray(items) ? items : [items]).forEach((item) =>
        removeFrom(item, fields)
    );
    return items;
};

module.exports = {
    PLAN_COMMISSION,
    removeCommissionFields,
};
