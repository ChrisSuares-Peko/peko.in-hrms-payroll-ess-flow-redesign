const { createNotification } = require('../models/use-cases/notification');
const emailer = require('./emailer')
const emailTemplates = require('./emailTemplates');

exports.leanRefundFailureEmail = async (req, message) => {
    let { name, username, email } = req.user
    console.log(message)
    let emailContent = emailTemplates.refundFailure({ name, amount: req.body.leanAmount })
    await emailer.email(email, 'Bank refund Failure', emailContent)

    const notificationData = {
        notificationTitle: 'Bank refund faild',
        notificationBrief: `Refund of amount ₹ ${req.body.leanAmount} faild, Please contact Peko support team`,
        notificationTo: [username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN'
    };
    createNotification(notificationData);
}

exports.paymentGateWayRefundFailureEmail = async (req) => {
    let { name, username, email } = req.user

    let emailContent = emailTemplates.refundFailure({ name, amount: req.body.pgAmount })
    await emailer.email(email, 'Card refund Failure', emailContent)

    const notificationData = {
        notificationTitle: 'Card refund faild',
        notificationBrief: `Refund of amount ₹ ${req.body.pgAmount} faild, Please contact Peko support team`,
        notificationTo: [username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN'
    };
    createNotification(notificationData);
}




