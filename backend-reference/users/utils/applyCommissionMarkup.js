const { amountPrecision } = require("./formatter");
const { isInternalAccount } = require("../models/use-cases/setting");
const { calculateAmountWithTax } = require("../services/GSTandTAXcalculation");

const MARKUP_MODES = new Set(["AGENT_MARKUP", "PRINCIPAL_MARKUP"]);

const markupOn = (item, price) => {
    const value = Number(item.commission ?? item.providerCommission ?? 0);
    const fixed = Number(item.fixedCommissionPerTransaction ?? 0);
    if (!(value >= 0 && fixed >= 0)) return 0;
    const main =
        item.commissionType?.toUpperCase() === "FLAT"
            ? value
            : price * (value / 100);
    return amountPrecision(main + fixed);
};

const getPath = (item, path) =>
    path.split(".").reduce((value, key) => value?.[key], item);

const setPath = (item, path, value) => {
    const keys = path.split(".");
    const last = keys.pop();
    const parent = keys.reduce((object, key) => {
        if (!object[key]) object[key] = {};
        return object[key];
    }, item);
    // Model rows only serialize dataValues, so a plain assignment would be missing from the JSON.
    if (parent === item && typeof item.setDataValue === "function")
        item.setDataValue(last, value);
    else parent[last] = value;
};

const pickField = (item, priceField) =>
    Array.isArray(priceField)
        ? priceField.find((field) => {
              const value = getPath(item, field);
              return value != null && value !== "";
          })
        : priceField;

const commissionOf = (item, field) => {
    const plan = item.planCommissions?.[field.split(".").pop()];
    return plan && typeof plan === "object" ? plan : item;
};

// Internal accounts (Settings > Internal Accounts) are not charged the principal markup: isWaived(commissionMode) is true for theirs.
const markupWaiver = (credentialId) => {
    let internal;
    return async (commissionMode) => {
        if (credentialId == null || commissionMode?.toUpperCase() !== "PRINCIPAL_MARKUP") return false;
        if (internal === undefined) internal = isInternalAccount(credentialId);
        return internal;
    };
};

const applyToItem = async (item, priceField, isAdmin, commissionField, isWaived = markupWaiver()) => {
    if (!item || typeof item !== "object") return;
    if (isAdmin) setPath(item, commissionField, 0);
    const field = pickField(item, priceField);
    if (!field) return;
    const commission = commissionOf(item, field);
    if (!MARKUP_MODES.has(commission.commissionMode?.toUpperCase())) return;
    if (await isWaived(commission.commissionMode)) return;
    const original = getPath(item, field);
    const price = Number(original);
    if (!(price > 0)) return;
    const markup = markupOn(commission, price);
    if (!(markup > 0)) return;
    const markupWithGst = commission.isCommissionInclGST
        ? markup
        : await calculateAmountWithTax(markup);
    const updated = amountPrecision(price + markupWithGst);
    setPath(
        item,
        field,
        typeof original === "string" ? updated.toFixed(2) : updated
    );
    if (isAdmin) setPath(item, commissionField, markupWithGst);
};

// Adds the commission markup (AGENT_MARKUP / PRINCIPAL_MARKUP only) to item[priceField] in place; takes one object or an array.
// priceField can be a list of field names: the first one that has a value is the one marked up.
// Field names can be dotted paths into nested objects (packagePrices.monthly), commissionField too.
// planCommissions[last part of the price field], when present, replaces the item's own commission fields.
// Percentage is on the current price, fixedCommissionPerTransaction is added too; GST (calculateAmountWithTax) goes on top unless isCommissionInclGST.
// Unusable price or commission leaves the item as it is. isAdmin also sets item[commissionField] (what was added, 0 if nothing).
// With credentialId, an internal account gets no PRINCIPAL_MARKUP added.
const applyCommissionMarkup = async (
    items,
    priceField,
    credentialId = null,
    isAdmin = false,
    commissionField = "totalCommission"
) => {
    const fields = Array.isArray(priceField) ? priceField : [priceField];
    if (
        !fields.length ||
        !fields.every((field) => typeof field === "string" && field !== "")
    ) {
        throw new TypeError(
            "applyCommissionMarkup: priceField must be a non-empty string or an array of them"
        );
    }
    const isWaived = markupWaiver(credentialId);
    await Promise.all(
        (Array.isArray(items) ? items : [items]).map((item) =>
            applyToItem(item, priceField, isAdmin, commissionField, isWaived)
        )
    );
    return items;
};

module.exports = { applyCommissionMarkup };
