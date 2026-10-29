const Sequelize = require("sequelize");
const sequelizeConfig = require("../configs/database/index");
const emailer = require('../utils/emailer');
const sendSMS = require('../utils/sms');
const { emailTempleteInvoiceRemainder, buildInvoiceReminderBodyHtml } = require("../utils/email/emailTemplates/invoice");
const { customLog } = require("../utils/loggerHelper");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { partnerLogos } = require("../utils/partnerLogos");
const { resolveEmailTemplate } = require("./emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/emailTemplate/sharedLayout");

exports.invoiceGuideline = async () => {
  try {
    const query = `
      SELECT * 
      FROM invoiceGuidelines
      WHERE status = 'PENDING'
    `;

    const res = await sequelizeConfig.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const element of res) {
      const { actionDate, email, sms, templet, id, registeredBy } = element;

      if (isToday(actionDate)) {
        if (email) {
          let {email:emailTemplat} = templet
          await sendEmail(emailTemplat, registeredBy);
        }

        if (sms) {
          let {sms:smsTemplat} = templet
          await sendSms(smsTemplat);
        }

        await updateStatusToCompleted(id);
      }
    }
  } catch (error) {
    customLog(null, "error", { message:"Error in invoiceGuideline ", error })
    throw error;
  }
};

async function sendEmail(emailTemplate, registeredBy) {
  if (emailTemplate) {
    const { body, emailId, subject } = emailTemplate;
    let partnerData;
    registeredBy ?
      partnerData = await fetchPartnerDetails(registeredBy)
      :
      partnerData = await partnerLogos()

    try {
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
        partnerId: registeredBy || null,
      });
      await emailer.email(emailId, resolved.subject, resolved.html);
      customLog(null, "info", { message: "Invoice reminder Email sent to " + emailId })

    } catch (error) {
      customLog(null, "error", { message:"Error sending email to",emailId, error })

    }
  }
}

async function sendSms(smsTemplate) {
  if (smsTemplate) {
    const { body, mobileNo } = smsTemplate;

    try {
      await sendSMS.sendSMS(mobileNo, body);
      customLog(null, "info", { message: "Invoice reminder SMS send to " + mobileNo })
    } catch (error) {
      customLog(null, "error", { message: "Invoice reminder SMS send to " + mobileNo, error})

    }
  }
}

async function updateStatusToCompleted(id) {
  const query = `
    UPDATE invoiceGuidelines
    SET status = 'COMPLETED'
    WHERE id = :id
  `;

  try {
    await sequelizeConfig.query(query, {
      replacements: { id },
      type: Sequelize.QueryTypes.UPDATE,
    });
  } catch (error) {
    customLog(null, "error", { message:"Error updating status for ID",id, error })
  }
}

function isToday(dateString) {
  const inputDate = new Date(dateString);
  const today = new Date();
  return (
    inputDate.getFullYear() === today.getFullYear() &&
    inputDate.getMonth() === today.getMonth() &&
    inputDate.getDate() === today.getDate()
  );
}
