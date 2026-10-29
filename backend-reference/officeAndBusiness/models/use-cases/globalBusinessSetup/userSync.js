const GlobalBusinessSetupUserSync = require("../../entities/globalBusinessSetup/userSync");

exports.isApplicationsSynced = async referenceId => {
    if (!referenceId) return false;
    const row = await GlobalBusinessSetupUserSync.findOne({ reference_id: referenceId })
        .select("applications_synced_at")
        .lean();
    return Boolean(row?.applications_synced_at);
};

exports.markApplicationsSynced = async (referenceId, userId) => {
    if (!referenceId) return null;
    return GlobalBusinessSetupUserSync.findOneAndUpdate(
        { reference_id: referenceId },
        { $set: { applications_synced_at: new Date(), user_id: userId } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
};

exports.isRenewalsSynced = async referenceId => {
    if (!referenceId) return false;
    const row = await GlobalBusinessSetupUserSync.findOne({ reference_id: referenceId })
        .select("renewals_synced_at")
        .lean();
    return Boolean(row?.renewals_synced_at);
};

exports.markRenewalsSynced = async (referenceId, userId) => {
    if (!referenceId) return null;
    return GlobalBusinessSetupUserSync.findOneAndUpdate(
        { reference_id: referenceId },
        { $set: { renewals_synced_at: new Date(), user_id: userId } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
};
