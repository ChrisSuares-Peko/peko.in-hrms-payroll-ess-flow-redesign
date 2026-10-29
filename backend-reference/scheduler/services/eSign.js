/* eslint-disable no-prototype-builtins */
const emailer = require("../utils/emailer");
const {
  eSignRemainderTemplate,
} = require("../utils/email/emailTemplates/eSign");
const {
  findESignDoc,
  findESignDocToDelete,
} = require("../models/use-cases/eSign");
const eSign = require("../models/entities/eSign");
const credential = require("../models/entities/credential");
const { deleteFromS3 } = require("../utils/s3");
const { customLog } = require("../utils/loggerHelper");
const { partnerLogos } = require("../utils/partnerLogos");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { resolveEmailTemplate } = require("./emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/emailTemplate/sharedLayout");

exports.eSignReminders = async () => {
  try {
    const { data } = await findESignDoc();
    if (!data.length) {
      customLog(null, "info", { message: "No data found" })
      return;
    }

    const sendReminderEmail = async (emailId, subject, bodyHtml) => {
      try {
        await emailer.email(emailId, subject, bodyHtml);
      } catch (error) {
        customLog(null, "error", { error, emailId })

      }
    };

    const checkInterval = (createdAt, interval) => {
      const createdDate = new Date(createdAt);
      const currentDate = new Date();
      const dayDiff = Math.floor(
        (currentDate - createdDate) / (1000 * 60 * 60 * 24)
      );
      return dayDiff % interval === 0;
    };

    const scheduleMail = async (
      signerInfo,
      docketTitle,
      expiryDate,
      createdAt,
      reminderInterval,
      partnerData
    ) => {
      if (!signerInfo) return;

      const { signer_name, signer_email } = signerInfo;
      if (!checkInterval(createdAt, reminderInterval)) return;

      const subject = `Reminder: Your e-sign for ${docketTitle} is pending`;
      const readableExpiryDate = new Date(expiryDate).toDateString();
      const resolved = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.ESIGN_REMINDER,
        service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
        variables: {
          userName: signer_name,
          documentName: docketTitle,
          date: readableExpiryDate,
          branding: partnerData?.branding || 'Peko',
          website: partnerData?.website || 'https://www.peko.one',
          ...v2LayoutVariables(partnerData),
        },
        fallback: () => eSignRemainderTemplate(signer_name, docketTitle, readableExpiryDate, partnerData),
        fallbackSubject: subject,
      });

      await sendReminderEmail(signer_email, resolved.subject, resolved.html);
    };

    const processDoc = async (doc) => {
      const {
        signers_info,
        docket_title,
        expiry_date,
        createdAt,
        reminder_interval,
        credentialId,
      } = doc;
      if (signers_info && signers_info.length > 0) {
        // Resolve the real reseller partner via the document's own credential, same
        // as officeAndBusiness's eSign-completed email — the "no identifier to look
        // up" claim this used to carry was wrong: the eSign row always has one.
        const cred = credentialId ? await credential.findOne({ where: { id: credentialId }, attributes: ['registeredBy'] }) : null;
        const registeredBy = cred?.registeredBy || null;
        const partnerData = registeredBy ? await fetchPartnerDetails(registeredBy) : await partnerLogos();

        const unsignedSigners = signers_info.filter(
          (signer) => signer.status === "unsigned"
        );
        await Promise.all(
          unsignedSigners.map((signer) =>
            scheduleMail(
              signer,
              docket_title,
              expiry_date,
              createdAt,
              reminder_interval,
              partnerData
            )
          )
        );
      }
    };

    await Promise.all(data.map(processDoc));
  } catch (error) {
    customLog(null, "error", { message:"Error in esign reminders", error: error.message })

    return false;
  }
};

exports.findESignDocToDelete = async () => {
  try {
    const { data } = await findESignDocToDelete();
    if (!Array.isArray(data) || data.length === 0) {
      customLog(null, "info", { message: "No data found" })
      return;
    }
    for (const doc of data) {
      if (doc?.document_url || doc?.audit_trail_url) {
        if (doc.document_url) {
          await deleteFromS3(doc.document_url);
        }
        if (doc.audit_trail_url) {
          await deleteFromS3(doc.audit_trail_url);
        }
        await eSign.update(
          { document_url: null, audit_trail_url: null },
          { where: { id: doc.id } }
        );
      }
    }
  } catch (error) {
    customLog(null, "error", { message: error?.message, data: error?.response?.data })
    return false;
  }
};