const { createNotification } = require("../models/use-cases/notification");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const emailer = require("./emailer");
const { refundFailure } = require("./emailTemplates/common");
const { resolveEmailTemplate } = require("../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("./emailTemplate/sharedLayout");

exports.paymentGateWayRefundFailureEmail = async (req,serviceProvider,typeOfService) => {
    let { name, username, email } = req.user

    let partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
    
    const amount = req.body.pgAmount;
    const transactionId = req.body.transactionId || req.body.corporateTxnId;
    const resolved = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.REFUND_FAILED,
      service: EMAIL_TEMPLATE_SERVICES.REFUND,
      variables: {
        name,
        amount,
        transactionId,
        branding: partnerDetails?.branding || 'Peko',
        website: partnerDetails?.baseUrl || 'https://peko.one/in',
        ...v2LayoutVariables(partnerDetails),
      },
      fallback: () => refundFailure({
        name,
        amount,
        transactionId,
        serviceProvider,
        typeOfService,
      }, partnerDetails),
      fallbackSubject: 'Refund Failed',
      partnerId: req?.user?.registeredBy || null,
      logTraceId: req?.LogTraceId,
    });
    await emailer.email({ to: email, subject: resolved.subject, body: resolved.html })

  const notificationData = {
    notificationTitle: "Refund failed",
    notificationBrief: `Refund of amount ₹ ${req.body.pgAmount} failed, Please contact Peko support team`,
    notificationTo: [username],
    notificationCategory: "CORPORATE",
    notificationBy: "ADMIN",
  };
  createNotification(notificationData);
};
