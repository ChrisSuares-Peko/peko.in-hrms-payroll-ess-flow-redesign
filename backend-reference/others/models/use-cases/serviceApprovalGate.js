const { getASetting, upsertSetting } = require("./setting");
const { dropDashboardCache } = require("./accountingPeriod");

const GATE_SETTING = "serviceApprovalGate";

const gateOf = details => ({
    enabled: !(details && details.enabled === false),
    reason: (details && details.reason) || null,
    setById: (details && details.setById) || null,
    setByName: (details && details.setByName) || null,
    setAt: (details && details.setAt) || null,
});

const getApprovalGateSettings = async () => gateOf(await getASetting(GATE_SETTING));

const isApprovalGateEnabled = async () => (await getApprovalGateSettings()).enabled;

const saveApprovalGate = async ({ enabled, reason, actor }) => {
    const details = {
        enabled: enabled === true,
        reason: reason || null,
        setById: actor && actor.id,
        setByName: actor && actor.name,
        setAt: new Date().toISOString(),
    };

    const saved = await upsertSetting(GATE_SETTING, details);
    if (saved === false) return null;

    await dropDashboardCache();
    return gateOf(details);
};

module.exports = {
    GATE_SETTING,
    gateOf,
    getApprovalGateSettings,
    isApprovalGateEnabled,
    saveApprovalGate,
};
