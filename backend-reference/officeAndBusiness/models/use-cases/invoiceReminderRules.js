const invoiceReminderRules = require("../entities/invoiceReminderRules");
const asyncHandler = require("../../middlewares/async");

const DEFAULT_EMAIL_TEMPLATE = {
    subject: "Payment Reminder — Invoice {invoice_id}",
    body: "Dear {customer_name},\n\nThis is a friendly reminder that your invoice {invoice_id} for {amount} is due on {due_date}.\n\nPlease make the payment at your earliest convenience to avoid any late charges.\n\nYou can pay online here: {payment_link}\n\nThank you for your business!\n\nWarm regards,\nYour Company",
};

const DEFAULT_WHATSAPP_TEMPLATE = {
    body: "Hi {customer_name},\n\nThis is a reminder that your invoice {invoice_id} for {amount} is due on {due_date}.\n\nPlease make the payment at your earliest convenience.\n\nPay here: {payment_link}\n\nThank you!",
};

const DEFAULT_RULES = [
    { ruleType: "BEFORE",         days: 3,  enabled: false, sendEmail: true, sendWhatsApp: false, emailTemplate: DEFAULT_EMAIL_TEMPLATE, whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE },
    { ruleType: "ON_DUE",         days: 0,  enabled: false, sendEmail: true, sendWhatsApp: false, emailTemplate: DEFAULT_EMAIL_TEMPLATE, whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE },
    { ruleType: "AFTER",          days: 7,  enabled: false, sendEmail: true, sendWhatsApp: false, emailTemplate: DEFAULT_EMAIL_TEMPLATE, whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE },
    { ruleType: "SECOND_OVERDUE", days: 30, enabled: false, sendEmail: true, sendWhatsApp: false, emailTemplate: DEFAULT_EMAIL_TEMPLATE, whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE },
];

// Fetch all rules — creates 4 default disabled rules if none exist for this company
exports.findAllRules = asyncHandler(async (corporateUserId) => {
    let rules = await invoiceReminderRules.findAll({ where: { corporateUserId } });
    if (!rules.length) {
        rules = await invoiceReminderRules.bulkCreate(
            DEFAULT_RULES.map((r) => ({ ...r, corporateUserId }))
        );
    }
    return rules;
});

// Update a single rule (enabled, days, sendEmail, sendWhatsApp, emailTemplate, whatsappTemplate)
exports.updateRule = asyncHandler(async (id, corporateUserId, data) => {
    const rule = await invoiceReminderRules.findOne({ where: { id, corporateUserId } });
    if (!rule) return null;
    await rule.update(data);
    return rule;
});

// Used by scheduler — fetch all enabled rules
exports.findEnabledRules = asyncHandler(async () => {
    return invoiceReminderRules.findAll({ where: { enabled: true } });
});
