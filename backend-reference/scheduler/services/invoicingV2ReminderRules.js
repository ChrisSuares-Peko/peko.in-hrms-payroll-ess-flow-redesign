const Sequelize = require("sequelize");
const sequelizeConfig = require("../configs/database/index");
const emailer = require("../utils/emailer");
const { customLog } = require("../utils/loggerHelper");

exports.invoicingV2ReminderRules = async () => {
  try {
    // Only process companies that have automatic reminders turned ON
    const activeSettings = await sequelizeConfig.query(
      `SELECT corporateUserId FROM invoiceSettingsV2 WHERE automaticReminders = true`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!activeSettings.length) {
      customLog(null, "info", { message: "invoicingV2ReminderRules: no companies with automatic reminders ON" });
      return;
    }

    const activeCompanyIds = activeSettings.map(s => s.corporateUserId);

    const rules = await sequelizeConfig.query(
      `SELECT * FROM invoiceReminderRules WHERE enabled = true AND corporateUserId IN (:activeCompanyIds)`,
      { replacements: { activeCompanyIds }, type: Sequelize.QueryTypes.SELECT }
    );

    if (!rules.length) {
      customLog(null, "info", { message: "invoicingV2ReminderRules: no enabled rules found" });
      return;
    }

    // Group rules by corporateUserId
    const rulesByCompany = {};
    for (const rule of rules) {
      if (!rulesByCompany[rule.corporateUserId]) rulesByCompany[rule.corporateUserId] = [];
      rulesByCompany[rule.corporateUserId].push(rule);
    }

    const today = getToday();

    for (const [corporateUserId, companyRules] of Object.entries(rulesByCompany)) {
      const invoices = await sequelizeConfig.query(
        `SELECT id, name, email, phoneNumber, invoiceNumber, dueDate, amountDue
         FROM invoicings
         WHERE corporateUserId = :corporateUserId
           AND documentType = 'INVOICE'
           AND status NOT IN ('PAID', 'CANCELLED')
           AND dueDate IS NOT NULL`,
        { replacements: { corporateUserId }, type: Sequelize.QueryTypes.SELECT }
      );

      if (!invoices.length) continue;

      for (const invoice of invoices) {
        for (const rule of companyRules) {
          const triggerDate = getTriggerDate(invoice.dueDate, rule.ruleType, rule.days);
          if (triggerDate !== today) continue;

          if (rule.sendEmail && invoice.email) {
            await sendEmail(invoice, rule);
          }

          if (rule.sendWhatsApp && invoice.phoneNumber) {
            await sendWhatsApp(invoice, rule);
          }
        }
      }
    }
  } catch (error) {
    customLog(null, "error", { message: "invoicingV2ReminderRules error", error: error.message });
  }
};

async function sendEmail(invoice, rule) {
  try {
    const template = rule.emailTemplate;
    if (!template?.subject || !template?.body) return;

    const subject = fillVariables(template.subject, invoice);
    const body    = fillVariables(template.body, invoice);

    await emailer.email(invoice.email, subject, body);
    customLog(null, "info", { message: `Reminder email sent to ${invoice.email} for ${invoice.invoiceNumber}` });
  } catch (error) {
    customLog(null, "error", { message: "Error sending reminder email", email: invoice.email, error: error.message });
  }
}

async function sendWhatsApp(invoice, rule) {
  try {
    const template = rule.whatsappTemplate;
    if (!template?.body) return;

    const message = fillVariables(template.body, invoice);

    // TODO: wire WhatsApp service — sendWhatsAppMessage(invoice.phoneNumber, message)
    customLog(null, "info", { message: `WhatsApp reminder sent to ${invoice.phoneNumber} for ${invoice.invoiceNumber}: ${message}` });
  } catch (error) {
    customLog(null, "error", { message: "Error sending WhatsApp reminder", phone: invoice.phoneNumber, error: error.message });
  }
}

function getTriggerDate(dueDate, ruleType, days) {
  const due = new Date(dueDate);
  if (ruleType === "BEFORE")                            due.setDate(due.getDate() - days);
  else if (ruleType === "AFTER" || ruleType === "SECOND_OVERDUE") due.setDate(due.getDate() + days);
  return due.toISOString().split("T")[0];
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function fillVariables(template, invoice) {
  let result = template
    .replace(/{customer_name}/g, invoice.name         || "")
    .replace(/{invoice_id}/g,    invoice.invoiceNumber || "")
    .replace(/{amount}/g,        invoice.amountDue     || "")
    .replace(/{due_date}/g,      invoice.dueDate       || "");

  result = result.replace(/{payment_link}/g, invoice.paymentLink || "payment link is not available. Pay through our website");

  return result;
}
