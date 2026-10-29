const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { createNotification } = require('../models/use-cases/notification');
const emailer = require('./emailer');
const { refundFailure } = require('./emailTemplates/common');
const { partnerLogos } = require('../utils/partnerLogos')
exports.leanRefundFailureEmail = async (req, message) => {
    let { name, username, email } = req.user
    const logo = req.user.registeredBy
        ? await fetchPartnerDetails(req.user.registeredBy)
        : await partnerLogos();
    console.log(message)
    let emailContent = refundFailure({ name, amount: req.body.leanAmount, transactionId: req.body.transactionId }, logo)
    await emailer.email(email, 'Bank refund Failure', emailContent)

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
    const logo = req.user.registeredBy
        ? await fetchPartnerDetails(req.user.registeredBy)
        : await partnerLogos();
    let emailContent = refundFailure({ name, amount: req.body.pgAmount, transactionId: req.body.transactionId }, logo)
    await emailer.email(email, 'Card refund Failure', emailContent)

    const notificationData = {
        notificationTitle: 'Refund failed',
        notificationBrief: `Refund of ₹ ${req?.body?.pgAmount ?? "#"} has failed. Please contact our support team.`,
        notificationTo: [username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN'
    };
    createNotification(notificationData);
}




