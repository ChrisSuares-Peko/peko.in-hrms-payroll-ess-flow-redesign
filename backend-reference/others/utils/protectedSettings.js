const PROTECTED_SETTING_NAMES = ["servicesTypeConfig", "serviceApprovalGate"];

const PROTECTED_SETTING_MESSAGE = "This setting is managed from the Accounting portal";

const isProtectedSetting = name =>
    PROTECTED_SETTING_NAMES.includes(typeof name === "string" ? name.trim() : name);

module.exports = { PROTECTED_SETTING_NAMES, PROTECTED_SETTING_MESSAGE, isProtectedSetting };
