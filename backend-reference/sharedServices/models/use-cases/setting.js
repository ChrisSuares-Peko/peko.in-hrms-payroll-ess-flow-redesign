const { Op, Sequelize } = require("sequelize");
const setting = require("../entities/setting");

// Global on/off switch for journal recording. Missing row or missing `enabled`
// field both mean "on" — only an explicit false pauses it.
exports.isJournalRecordingEnabled = async () => {
    const data = await setting.findOne({ where: { name: "journalRecording" } });
    if (!data) return true;
    return data.details?.enabled !== false;
};

// The GST rate the pipeline computes with, as a percentage. A missing or unreadable setting
// falls back to the standard rate rather than to nothing.
exports.getGstRatePct = async () => {
    const data = await setting.findOne({ where: { name: "taxRate" } });
    const pct = Number(data?.details?.gst);
    return Number.isFinite(pct) && pct > 0 ? pct : 18;
};

exports.isInternalAccount = async (credentialId) => {
    if (credentialId === null || credentialId === undefined) return false;
    const idNum = Number(credentialId);
    if (Number.isNaN(idNum)) return false;
    const data = await setting.findOne({
        where: {
            name: "internalAccounts",
            [Op.and]: Sequelize.literal(
                `JSON_CONTAINS(details, CAST(${idNum} AS JSON))`
            ),
        },
    });
    return !!data;
};
