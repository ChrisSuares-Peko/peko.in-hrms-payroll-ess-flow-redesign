const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const {
    findAllRules,
    updateRule,
} = require("../../models/use-cases/invoiceReminderRules");
const {
    findSettings,
    toggleAutomaticReminders,
} = require("../../models/use-cases/invoiceSettingsV2");

// GET /invoicing/v2/reminder-rules
exports.getReminderRules = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const [rules, settings] = await Promise.all([
            findAllRules(corporateUserId),
            findSettings(corporateUserId),
        ]);
        return res.status(200).json({
            status: true,
            data: {
                automaticReminders: settings?.automaticReminders || false,
                rules,
            },
            message: "Reminder rules fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// PUT /invoicing/v2/reminder-rules/:id
exports.updateReminderRule = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { id } = req.params;
        const { enabled, days, sendEmail, sendWhatsApp, emailTemplate, whatsappTemplate } = req.body;

        const rule = await updateRule(id, corporateUserId, {
            enabled,
            days,
            sendEmail,
            sendWhatsApp,
            emailTemplate,
            whatsappTemplate,
        });

        if (!rule) {
            return res.status(404).json({
                status: false,
                data: {},
                message: "Reminder rule not found",
                responseCode: "404",
            });
        }

        return res.status(200).json({
            status: true,
            data: rule,
            message: "Reminder rule updated successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// PUT /invoicing/v2/reminder-rules/automatic
exports.toggleAutomaticReminders = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { automaticReminders } = req.body;

        const settings = await toggleAutomaticReminders(corporateUserId, automaticReminders);

        return res.status(200).json({
            status: true,
            data: { automaticReminders: settings.automaticReminders },
            message: `Automatic reminders ${automaticReminders ? "enabled" : "disabled"} successfully`,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});
