const sequelizeConfig = require("../../configs/database/index");
const setting = require("../entities/setting");
const { customLog } = require("../../utils/loggerHelper");
const { applyApprovalGate } = require("../../utils/approvalGate");

const GATE_SETTING = "serviceApprovalGate";
const CONFIG_SETTING = "servicesTypeConfig";
const CONFIG_FIELDS = ["service_with_plans", "service_without_plans"];

const APPROVALS_SQL =
    "SELECT approvals FROM serviceApprovals WHERE partnerPermissionId = :partnerPermissionId LIMIT 1";

const parseJson = value => {
    if (Array.isArray(value) || (value && typeof value === "object")) return value;
    if (typeof value !== "string") return null;
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
};

const readSetting = async name => {
    const row = await setting.findOne({ where: { name }, attributes: ["details"], raw: true });
    return parseJson(row && row.details);
};

exports.isApprovalGateEnabled = async () => {
    const details = await readSetting(GATE_SETTING);
    return !(details && details.enabled === false);
};

exports.loadListedAccessKeys = async () => {
    const config = await readSetting(CONFIG_SETTING);
    return new Set(
        CONFIG_FIELDS.flatMap(field => (config && Array.isArray(config[field]) ? config[field] : []))
            .map(key => (typeof key === "string" ? key.trim() : ""))
            .filter(Boolean)
    );
};

exports.loadApprovedAccessKeys = async partnerPermissionId => {
    const rows = await sequelizeConfig.query(APPROVALS_SQL, {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements: { partnerPermissionId },
    });
    const entries = parseJson(rows && rows[0] && rows[0].approvals);
    return new Set(
        (Array.isArray(entries) ? entries : [])
            .filter(entry => entry && entry.status === "APPROVED" && entry.accessKey)
            .map(entry => entry.accessKey)
    );
};

exports.loadApprovalGate = async partnerPermissionId => {
    try {
        if (!partnerPermissionId || !(await exports.isApprovalGateEnabled())) return null;
        const [listed, approved] = await Promise.all([
            exports.loadListedAccessKeys(),
            exports.loadApprovedAccessKeys(partnerPermissionId),
        ]);
        return new Set([...listed].filter(key => !approved.has(key)));
    } catch (error) {
        customLog(null, "error", {
            message: "Service approval gate unavailable, serving ungated services",
            partnerPermissionId,
            error: error && error.message,
        });
        return null;
    }
};

exports.gatePermissionDetails = async details => {
    if (!details || !Array.isArray(details.permissions)) return details;
    const blocked = await exports.loadApprovalGate(details.id);
    if (!blocked) return details;
    return {
        id: details.id,
        permissions: applyApprovalGate(JSON.parse(JSON.stringify(details.permissions)), blocked),
    };
};

exports.gatedPartnerServices = async permissionDetails => {
    if (!permissionDetails) return undefined;
    const gated = await exports.gatePermissionDetails(permissionDetails);
    return gated && gated.permissions ? gated.permissions : null;
};

exports.GATE_SETTING = GATE_SETTING;
exports.CONFIG_SETTING = CONFIG_SETTING;
exports.APPROVALS_SQL = APPROVALS_SQL;
