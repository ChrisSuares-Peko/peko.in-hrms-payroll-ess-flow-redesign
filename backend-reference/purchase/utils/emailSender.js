const { createNotification } = require('../models/use-cases/notification');
const emailer = require('./emailer');
const { refundFailure } = require('./emailTemplate/common');
const { resolveEmailTemplate } = require('../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('./emailTemplateKeys');
const { v2LayoutVariables } = require('./emailTemplate/sharedLayout');

// Shared helper for the 2 refundFailure call sites below — one named helper per hard rule 4
// (multiple call sites, same file, same key/template).
async function sendRefundFailureEmail(email, subject, { name, amount, transactionId }) {
    const params = { name, amount, transactionId };
    const resolved = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.REFUND_FAILED,
        service: EMAIL_TEMPLATE_SERVICES.PURCHASE_REFUND,
        variables: { name, amount, transactionId, ...v2LayoutVariables(undefined) },
        fallback: () => refundFailure(params),
        fallbackSubject: subject,
    });
    await emailer.email(email, resolved.subject, resolved.html);
}

exports.leanRefundFailureEmail = async (req, message) => {
    let { name, username, email } = req.user
    console.log(message)
    await sendRefundFailureEmail(email, 'Bank refund Failure', { name, amount: req.body.leanAmount, transactionId: req.body.transactionId })

    const notificationData = {
        notificationTitle: 'Refund failed',
        notificationBrief: `Refund of ₹ ${req.body.leanAmount} has failed. Please contact our support team.`,
        notificationTo: [username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN'
    };
    createNotification(notificationData);
}

exports.paymentGateWayRefundFailureEmail = async (req) => {
    let { name, username, email } = req.user

    await sendRefundFailureEmail(email, 'Card refund Failure', { name, amount: req.body.pgAmount, transactionId: req.body.transactionId })

    const notificationData = {
        notificationTitle: 'Refund failed',
        notificationBrief: `Refund of ₹ ${req?.body?.pgAmount ?? "#"} has failed. Please contact our support team.`,
        notificationTo: [username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN'
    };
    createNotification(notificationData);
}




