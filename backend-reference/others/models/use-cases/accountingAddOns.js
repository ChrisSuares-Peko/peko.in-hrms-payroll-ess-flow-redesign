const sequelizeConfig = require("../../configs/database/index");
const setting = require("../entities/setting");
const PLAN_ENTITY_CONFIG = require("../../utils/planEntityConfig");
const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup");
const { auditSettingChange } = require("../../utils/auditHooks");
const { ADDON_AUDIT } = require("../../utils/auditedModels");
const { PLAN_COMMISSION, reviewOnChange } = require("../../utils/configuredFlag");
const { hasAllCommissionFields } = require("./accountingPlans");

const round2 = value => Number(Number(value).toFixed(2));

const getAddOns = accessKey => (PLAN_ENTITY_CONFIG[accessKey] && PLAN_ENTITY_CONFIG[accessKey].addOns) || null;

const parseDetails = value => {
    if (!value) return {};
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch (err) {
        return {};
    }
};

// A row shaped like a plan row, so the Plans tab's table cells and Configure drawer can show it.
// The stored amount stays raw (the drawer edits it); priceMarkup is what a markup commission adds on top,
// the same way the plan prices show "Before commission".
const serializeAddOn = async (addOn, row) => {
    const details = parseDetails(row && row.details);
    const monthly = Number(details.amount) || 0;
    const priced = { ...details, packagePrices: { monthly } };
    await applyCommissionMarkup(priced, "packagePrices.monthly", null, true, "priceMarkup.monthlyPrice");
    const monthlyMarkup = Number(priced.priceMarkup && priced.priceMarkup.monthlyPrice) || 0;

    return {
        id: row ? row.id : 0,
        addOnType: addOn.type,
        planName: addOn.name,
        monthlyPrice: row ? monthly : null,
        annualPrice: row ? round2(monthly * 12) : null,
        priceMarkup: { monthlyPrice: monthlyMarkup, annualPrice: round2(monthlyMarkup * 12) },
        commissionMode: details.commissionMode || null,
        commissionType: details.commissionType || null,
        commission: Number(details.commission) || 0,
        fixedCommissionPerTransaction: Number(details.fixedCommissionPerTransaction) || 0,
        isCommissionInclGST: details.isCommissionInclGST == null ? null : Boolean(details.isCommissionInclGST),
        splitCommission: null,
        commissionConfigured: Boolean(details[PLAN_COMMISSION.flag]),
    };
};

// null when the service has no add-ons.
const findAddOnsForService = async accessKey => {
    const addOns = getAddOns(accessKey);
    if (!addOns) return null;
    const rows = await setting.findAll({ where: { name: addOns.map(addOn => addOn.settingName) }, raw: true });
    return Promise.all(
        addOns.map(addOn => serializeAddOn(addOn, rows.find(row => row.name === addOn.settingName)))
    );
};

const trackedKeys = details =>
    Object.fromEntries(
        ADDON_AUDIT.tracked.map(key => [key, key === PLAN_COMMISSION.flag ? Boolean(details[key]) : details[key]])
    );

// Saves the amount and commission fields into the add-on's setting, keeping what else it holds, and
// records the change in the audit trail. false when the service has no such add-on.
const updateAddOn = async (accessKey, addOnType, values) => {
    const addOn = (getAddOns(accessKey) || []).find(item => item.type === addOnType);
    if (!addOn) return false;

    const row = await setting.findOne({ where: { name: addOn.settingName } });
    const before = parseDetails(row && row.details);
    // Changing a commission field takes the add-on out of "configured", like a plan.
    const { data: commission } = reviewOnChange(
        before,
        {
            commissionMode: values.commissionMode,
            commissionType: values.commissionType,
            commission: values.commission,
            fixedCommissionPerTransaction: values.fixedCommissionPerTransaction,
            isCommissionInclGST: values.isCommissionInclGST,
        },
        PLAN_COMMISSION
    );
    const details = { ...before, ...commission, amount: values.price };

    let id = row && row.id;
    if (row) await setting.update({ details }, { where: { id } });
    else id = (await setting.create({ name: addOn.settingName, details })).id;

    await auditSettingChange({
        sequelize: sequelizeConfig,
        spec: ADDON_AUDIT,
        id,
        accessKey,
        name: addOn.name,
        before: trackedKeys(before),
        after: trackedKeys(details),
    });
    return true;
};

// Confirms (or un-confirms) an add-on's commission, like a plan's toggle. Turning it on needs the commission
// fields to be saved first. null when the service has no such add-on.
const setAddOnCommissionConfigured = async (accessKey, addOnType, value) => {
    const addOn = (getAddOns(accessKey) || []).find(item => item.type === addOnType);
    if (!addOn) return null;

    const row = await setting.findOne({ where: { name: addOn.settingName } });
    const before = parseDetails(row && row.details);
    if (!row || (value && !hasAllCommissionFields(before))) return { ok: !value };

    const details = { ...before, [PLAN_COMMISSION.flag]: Boolean(value) };
    await setting.update({ details }, { where: { id: row.id } });
    await auditSettingChange({
        sequelize: sequelizeConfig,
        spec: ADDON_AUDIT,
        id: row.id,
        accessKey,
        name: addOn.name,
        before: trackedKeys(before),
        after: trackedKeys(details),
    });
    return { ok: true };
};

// accessKey -> { total, notConfigured: [{ id, name }] } for each service with add-ons. An add-on with no
// setting row yet has no commission, so it counts as not configured (id 0).
const loadAddOnCounts = async accessKeys => {
    const withAddOns = [...new Set(accessKeys)].filter(getAddOns);
    if (!withAddOns.length) return new Map();
    const names = withAddOns.flatMap(key => getAddOns(key).map(addOn => addOn.settingName));
    const rows = (await setting.findAll({ where: { name: names }, raw: true })) || [];
    return new Map(
        withAddOns.map(key => {
            const addOns = getAddOns(key);
            const notConfigured = addOns.flatMap(addOn => {
                const row = rows.find(item => item.name === addOn.settingName);
                return parseDetails(row && row.details)[PLAN_COMMISSION.flag]
                    ? []
                    : [{ id: row ? row.id : 0, name: addOn.name }];
            });
            return [key, { total: addOns.length, notConfigured }];
        })
    );
};

module.exports = { findAddOnsForService, updateAddOn, setAddOnCommissionConfigured, loadAddOnCounts };
