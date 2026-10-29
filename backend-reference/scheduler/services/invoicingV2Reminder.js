const Sequelize = require("sequelize");
const sequelizeConfig = require("../configs/database/index");
const emailer = require("../utils/emailer");
const sendSMS = require("../utils/sms");
const { emailTempleteInvoiceRemainder, buildInvoiceReminderBodyHtml } = require("../utils/email/emailTemplates/invoice");
const { customLog } = require("../utils/loggerHelper");
const { partnerLogos } = require("../utils/partnerLogos");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { resolveEmailTemplate } = require("./emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/emailTemplate/sharedLayout");

exports.invoicingV2Reminder = async () => {
  try {
    // corporateUserId is a real column (the FK Sequelize adds for
    // invoicingV2.belongsTo(corporateUser) in officeAndBusiness/payment's model) even
    // though it isn't in the hand-written column list above — joining out to
    // corporateUsers.registeredBy lets the reminder show the real reseller partner
    // instead of always defaulting to generic Peko branding.
    const query = `
      SELECT i.id, i.name, i.email, i.phoneNumber, i.invoiceNumber, i.dueDate, i.amountDue, i.reminderSettings,
             c.registeredBy AS registeredBy
      FROM invoicings i
      LEFT JOIN corporateUsers c ON c.id = i.corporateUserId
      WHERE i.reminderSettings IS NOT NULL
        AND JSON_LENGTH(i.reminderSettings) > 0
        AND i.status NOT IN ('PAID', 'CANCELLED')
    `;

    const invoices = await sequelizeConfig.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    if (!invoices.length) {
      customLog(null, "info", { message: "invoicingV2Reminder: no invoices with reminders found" });
      return;
    }

    for (const invoice of invoices) {
      const reminderSettings = typeof invoice.reminderSettings === "string"
        ? JSON.parse(invoice.reminderSettings)
        : invoice.reminderSettings;

      if (!Array.isArray(reminderSettings) || reminderSettings.length === 0) continue;

      const updatedSettings = [];
      let settingsChanged = false;

      for (const reminder of reminderSettings) {
        const { reminderInterval, sendEmail, sendSMS: sendSms, nextReminderDate } = reminder;

        if (isToday(nextReminderDate)) {
          if (sendEmail && invoice.email) {
            await sendReminderEmail(invoice);
          }
          if (sendSms && invoice.phoneNumber) {
            await sendReminderSMS(invoice);
          }

          // Advance nextReminderDate by reminderInterval days for next cycle
          const next = new Date(nextReminderDate);
          next.setDate(next.getDate() + reminderInterval);
          updatedSettings.push({ ...reminder, nextReminderDate: next.toISOString() });
          settingsChanged = true;
        } else {
          updatedSettings.push(reminder);
        }
      }

      if (settingsChanged) {
        await sequelizeConfig.query(
          `UPDATE invoicings SET reminderSettings = :reminderSettings WHERE id = :id`,
          {
            replacements: {
              reminderSettings: JSON.stringify(updatedSettings),
              id: invoice.id,
            },
            type: Sequelize.QueryTypes.UPDATE,
          }
        );
      }
    }
  } catch (error) {
    customLog(null, "error", { message: "Error in invoicingV2Reminder", error: error.message });
  }
};

async function sendReminderEmail(invoice) {
  try {
    const body = `Dear ${invoice.name},\n\nThis is a reminder that your invoice ${invoice.invoiceNumber} has a due amount of ₹${invoice.amountDue}.\n\nDue Date: ${invoice.dueDate}\n\nPlease make the payment at your earliest convenience.\n\nThank you.`;
    const subject = `Payment Reminder: Invoice ${invoice.invoiceNumber}`;
    const partnerData = invoice.registeredBy
      ? await fetchPartnerDetails(invoice.registeredBy)
      : await partnerLogos();
    const resolved = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.INVOICE_REMINDER,
      service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
      variables: {
        bodyData: buildInvoiceReminderBodyHtml(body),
        branding: partnerData?.branding || 'Peko',
        website: partnerData?.website || 'https://www.peko.one',
        ...v2LayoutVariables(partnerData),
      },
      fallback: () => emailTempleteInvoiceRemainder(body, partnerData),
      fallbackSubject: subject,
    });
    await emailer.email(invoice.email, resolved.subject, resolved.html);
    customLog(null, "info", { message: "Invoice reminder email sent to " + invoice.email });
  } catch (error) {
    customLog(null, "error", { message: "Error sending invoice reminder email", email: invoice.email, error });
  }
}

async function sendReminderSMS(invoice) {
  try {
    const body = `Reminder: Invoice ${invoice.invoiceNumber} payment of ₹${invoice.amountDue} is due on ${invoice.dueDate}. Please make the payment.`;
    await sendSMS.sendSMS(invoice.phoneNumber, body);
    customLog(null, "info", { message: "Invoice reminder SMS sent to " + invoice.phoneNumber });
  } catch (error) {
    customLog(null, "error", { message: "Error sending invoice reminder SMS", phone: invoice.phoneNumber, error });
  }
}

function isToday(dateString) {
  if (!dateString) return false;
  const input = new Date(dateString);
  const today = new Date();
  return (
    input.getFullYear() === today.getFullYear() &&
    input.getMonth() === today.getMonth() &&
    input.getDate() === today.getDate()
  );
}
