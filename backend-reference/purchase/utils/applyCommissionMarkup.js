const { amountPrecision } = require("./formatter");
const { isInternalAccount } = require("../models/use-cases/setting");
const { calculateAmountWithTax, getGstRate } = require("../services/GSTandTAXcalculation");
const { findOne: findServiceOperator } = require("../models/use-cases/serviceOperator");

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



// For services without plans: the same markup, with the commission of the service operator of accessKey.
const applyServiceCommission = async (items, priceField, accessKey) => {
    const operator = await findServiceOperator({ accessKey });
    await Promise.all(
        (Array.isArray(items) ? items : [items]).map(async (item) => {
            if (!item || typeof item !== "object") return;
            const field = pickField(item, priceField);
            if (!field) return;
            const price = getPath(item, field);
            const probe = { ...operator, servicePrice: price };
            await applyToItem(probe, "servicePrice", false);
            if (probe.servicePrice !== price) setPath(item, field, probe.servicePrice);
        })
    );
    return items;
};


// Markup modes: the amount already has our commission added on top of the vendor's amount.
// Works the vendor's amount back out of it (reverse of applyCommissionMarkup), so the commission is taken on that.
// gstRate is a decimal (0.18); when not passed it is read from the settings.
const amountBeforeCommission = async (commConfig, paidAmount, credentialId = null, gstRate) => {
    const paid = Number(paidAmount);
    if (await markupWaiver(credentialId)(commConfig.commissionMode)) return paid;
    const rate = Number(
        commConfig.commission ?? commConfig.providerCommission ?? 0
    );
    const fixed = Number(commConfig.fixedCommissionPerTransaction ?? 0);
    if (!(paid > 0) || !(rate >= 0 && fixed >= 0)) return paid;
    const gst = gstRate ?? (await getGstRate());

    const isFlat = String(commConfig.commissionType).toUpperCase() === "FLAT";
    const isInclGST = !!commConfig.isCommissionInclGST;
    const gstFactor = isInclGST ? 1 : 1 + gst;
    const markedUp = (price) => {
        const commission = amountPrecision(
            (isFlat ? rate : price * (rate / 100)) + fixed
        );
        return amountPrecision(
            price +
                (isInclGST
                    ? commission
                    : amountPrecision(commission * (1 + gst)))
        );
    };

    const guess = amountPrecision(
        (paid - gstFactor * fixed - (isFlat ? gstFactor * rate : 0)) /
            (1 + (isFlat ? 0 : (rate / 100) * gstFactor))
    );
    // The rounding steps can move the closed formula by a paisa or two: check the neighbours against the real markup.
    const candidates = [-0.02, -0.01, 0, 0.01, 0.02]
        .map((step) => amountPrecision(guess + step))
        .filter((candidate) => candidate > 0);
    const gaps = candidates.map((candidate) =>
        Math.abs(markedUp(candidate) - paid)
    );
    const closest = Math.min(...gaps);
    return candidates
        .filter((_candidate, index) => gaps[index] - closest < 0.005)
        .sort(
            (a, b) =>
                Math.abs(a - Math.round(a)) - Math.abs(b - Math.round(b)) ||
                a - b
        )[0];
};

module.exports = {
    applyCommissionMarkup,
    markupWaiver,
    applyServiceCommission,
    amountBeforeCommission,
    MARKUP_MODES,
};
