const order = require("../entities/order");
const { customLog } = require("../../utils/loggerHelper");

exports.findByCorporateTxnId = async (
    corporateTxnId,
    attributes = ["journalData"]
) => {
    if (!corporateTxnId) return null;
    return order.findOne({ where: { corporateTxnId }, attributes, raw: true });
};

exports.persistJournalRecord = async (
    corporateTxnId,
    key,
    { payload, recorded, journalAccountIds, reason, flatFields } = {}
) => {
    if (!corporateTxnId) return;
    try {
        const existingOrder = await order.findOne({
            where: { corporateTxnId },
            attributes: ["journalData", "journalRecordStatus"],
        });
        const journalData = { ...(existingOrder?.journalData || {}), ...(flatFields || {}) };
        if (payload) journalData[key] = reason ? { ...payload, reason } : payload;
        if (journalAccountIds) {
            journalData.journalAccountIds = {
                ...(existingOrder?.journalData?.journalAccountIds || {}),
                ...journalAccountIds,
            };
        }
        await order.update(
            {
                journalData,
                journalRecordStatus: {
                    ...(existingOrder?.journalRecordStatus || {}),
                    [key]: recorded,
                },
            },
            { where: { corporateTxnId } }
        );
    } catch (updateErr) {
        customLog(null, "error", {
            message: "Failed to persist journal record",
            error: updateErr?.message,
            corporateTxnId,
            key,
        });
    }
};
