const invoiceSettingsV2 = require("../entities/invoiceSettingsV2");
const asyncHandler = require("../../middlewares/async");

// Fetch all invoice settings for a corporate user
exports.findSettings = asyncHandler(async (corporateUserId) => {
    return await invoiceSettingsV2.findOne({ where: { corporateUserId } });
});

// Create or update invoice settings (business details + logo/signature URLs)
exports.saveSettings = asyncHandler(async (corporateUserId, data) => {
    const [record, created] = await invoiceSettingsV2.findOrCreate({
        where: { corporateUserId },
        defaults: { corporateUserId, ...data },
    });
    if (!created) {
        await record.update(data);
    }
    return record;
});

// Toggle automaticReminders ON/OFF for a company
exports.toggleAutomaticReminders = asyncHandler(async (corporateUserId, automaticReminders) => {
    const [record] = await invoiceSettingsV2.findOrCreate({
        where: { corporateUserId },
        defaults: { corporateUserId, automaticReminders },
    });
    if (record.automaticReminders !== automaticReminders) {
        await record.update({ automaticReminders });
    }
    return record;
});

exports.saveTemplate = async (corporateUserId, templateSettings) => {
    try {
        const [record, created] = await invoiceSettingsV2.findOrCreate({
            where: { corporateUserId },
            defaults: { corporateUserId, templateSettings },
        })
        if (!created) await record.update({ templateSettings })
        return record
    } catch (error) {
        console.error('Error saving template settings:', error)
        throw new Error('Database error while saving template settings')
    }
}

// Update prefixes for multiple document types in one call
// documentPrefixes: [{ type, prefix }, ...]
exports.saveDocumentTypePrefixes = asyncHandler(async (corporateUserId, documentPrefixes) => {
    let record = await invoiceSettingsV2.findOne({ where: { corporateUserId } });
    if (!record) {
        record = await invoiceSettingsV2.create({
            corporateUserId,
            documentNumberPrefix: documentPrefixes,
        });
    } else {
        // Spread into a new array so Sequelize detects the JSON change
        const existing = [...(record.documentNumberPrefix || [])];
        for (const { type, prefix } of documentPrefixes) {
            const index = existing.findIndex(item => item.type === type);
            if (index > -1) {
                existing[index] = { type, prefix };
            } else {
                existing.push({ type, prefix });
            }
        }
        record.set('documentNumberPrefix', existing);
        await record.save();
    }
    return record;
});
