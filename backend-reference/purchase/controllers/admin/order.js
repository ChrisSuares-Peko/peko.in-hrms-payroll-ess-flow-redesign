/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const { createOrder, findOneOrder, findAllOrder, updateOrder, deleteOrder, getExcel } = require('../../models/use-cases/order')
const { createOtp, verifyOtp } = require('../../models/use-cases/otp')
const { findOne } = require('../../models/use-cases/systemUser');
const ErrorResponse = require('../../utils/error-response');
const { findOneTransaction, updateTransactionById } = require('../../models/use-cases/transaction');
const { findDefaultBankAccount } = require('../../models/use-cases/bankDetails');
const { createPayout } = require('../corporate/lean');
const { createLeanPayout } = require('../../models/use-cases/payout');
const { refundWalletTransaction } = require('../../utils/walletTransaction');
const { refundCardTransaction } = require('../corporate/payment_gateway');
const asyncHandler = require('../../middlewares/async');
const emailer = require('../../utils/emailer')
const { commonEmailOtpVerification } = require('../../utils/templatesForEmails');
const { customLog } = require('../../utils/loggerHelper');


exports.createOrder = async (req) => {
    await createOrder(req);
};

exports.findOneOrder = async (req) => {
    await findOneOrder(req);
};

exports.findAllOrder = async (req) => {
    await findAllOrder(req);
};

exports.updateOrder = async (req, res, next) => {
    let params = req.params
    let data = req.body
    const result = await updateOrder(params, data);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating the order`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'message': 'Order updated successfully'
        })
    }
};

exports.deleteOrder = async (req) => {
    await deleteOrder(req);
};

exports.getExcel = async (req, res) => {
    try {
        const from = req.query.fromDate
        const to = req.query.toDate
        let order = req.query.orderCol,
            column = 'transactionDate'//req.query.column
        let params = {
            from,
            to,
            order,
            column
        }
        let data = await getExcel(params)
        res.send(data)
    } catch (e) {
        res.send(e.message)
    }
}

exports.getOtp = asyncHandler(async (req, res) => {
    let { scope } = req.query

    let otp
    if (scope === "email") {
        let email = req.user.email
        if (!req.user.email) {
            //get email from system user 
            const result = await findOne(req.user)
            email = result.email
        }

        //it will create a bycrypted otp in db and return the created otp to send via email
        otp = await createOtp({ contact: email })
        if (!otp) {
            return res.status(500).json({ status: false, message: 'Failed to create OTP.', data:{}, responeCode:'001' });
        }
        //Sending Email with otp
        const to = email; // Set recipient email address
        const body = commonEmailOtpVerification({otp})
        const subject = "Email verification"; // Set email subject
        // Call email function to send email with payment details in the body
        emailer.email(to, subject, body, function () {
            customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
        });
        //await emailer.email(email, 'Order refund request', supportEmailDetails)
    }

    console.log("-------------------------")
    console.log("-------------------------")
    console.log("EMAIL:", otp, "------")
    console.log("-------------------------")
    console.log("-------------------------")
    //ADD OTP RESPONSE
    return res.status(200).json({
        status: true,
        message: "OTP sent successfully via email.",
        data: process.env.NODE_ENV !== "production" ? { otp } : {},
        responseCode: '000'
    });
})
exports.refundAndUpdateOrder = asyncHandler(async (req, res, next) => {
    let data = req.body



    if (data.scope === 'email') {
        let email = req.user.email
        if (!req.user.email) {
            const result = await findOne(req.user)//get email from system user 
            email = result.email
        }

        response = await verifyOtp({ contact: email, otp: data.otp, context: 'email' })
        if (response.isVerified === false) {
            return next(new ErrorResponse(response?.message || 'Something went wrong', 200))
        }
    } else {
        return next(new ErrorResponse('otp is required', 200))
    }
    //otp  verification completed , next refund process
    customLog(req?.LogTraceId, "info", { message: 'otp verification completed , next refund process' })
    let corporateTxnId = req.body.corporateTxnId
    let params = { id: data.orderId };
    const transaction = await findOneTransaction({ corporateTxnId })
    let transactionId = transaction.id

    let updateDetails = {
        corporateTxnId,
        status: "REFUNDED",
        providerId: "Not Available",
        message: "Refund initiated!!!",
        registeredById: req.user.registeredBy
    }

    let paymentData
    if (transaction) {
        paymentData = JSON.parse(transaction?.order?.paymentModeResponse)
    }

    if (transaction.order.paymentMode == "BANK" || transaction.order.paymentMode == "BANK + WALLET") {
        //cancel with  bank refund 
        let leanAmount = paymentData.leanAmount
        //need to refund in default bank account selected by the user credentialId
        let defaultBankAccount = await findDefaultBankAccount({ id: transaction.credentialId })
        if (!defaultBankAccount) {
            return next(new ErrorResponse(`Refund faild, No default bank added for this user.`, 200));
        }


        let destinationIdLean = defaultBankAccount.destinationIdLean
        //>>>>>>>>>>>>>LEAN REFUND CODE STARTS<<<<<<<<<<<<<<<<
        let payoutResponse = await createPayout({ destinationIdLean: destinationIdLean, amount: leanAmount, description: "REFUND INITIATED" }, req.user.id)
        if (!payoutResponse) {
            return next(new ErrorResponse(`Something went wrong while returning lean transaction`, 500));
        }
        const paymentRefId = payoutResponse.payouts_payment_details[0].payment_intent_id
        const stringifiedResponse = JSON.stringify(payoutResponse)
        let createLeanPayoutRes = await createLeanPayout({ orderId: params.id, paymentRefId, payoutResponse: stringifiedResponse, status: "INITIATED" }) //for creating data for payout
        //>>>>>>>>>>>>>LEAN REFUND CODE STARTS<<<<<<<<<<<<<<<<
        if (createLeanPayoutRes && createLeanPayoutRes?.status == 'INITIATED') {
            await refundWalletTransaction(updateDetails)
        } else {
            return next(new ErrorResponse(`Something went wrong while returning bank transaction`, 400));
        }

    } else if (transaction.order.paymentMode == "WALLET") {
        //cancel with  wallet refund 
        await refundWalletTransaction(updateDetails)

    } else if (transaction.order.paymentMode == "PAYMENT GATEWAY" || transaction.order.paymentMode == "PAYMENT GATEWAY + WALLET") {
        //cancel with  payment gateway refund 
        let refundPGResponse = await refundCardTransaction(req, paymentData)
        if (refundPGResponse?.state == 'REVERSED' || refundPGResponse?.state == 'REFUNDED') {
            await refundWalletTransaction(updateDetails)
        } else {
            return next(new ErrorResponse(`Something went wrong while returning card transaction`, 400));
        }
    } else {
        return next(new ErrorResponse(`Something went wrong while returning.`, 400));
    }

    //update transaction remarks by admin remarks
    let result = await updateTransactionById(transactionId, { remarks: data?.remarks || 'refunded' })
    if (!result || result[0] === 0) {
        return next(new ErrorResponse(`Error while updating transaction remarks`, 400));
    }

    //let supportEmailDetails = emailOrderCancelTemplate(transaction.credential.name)
    //await emailer.email(transaction.credential.email, 'Your order has been cancelled', supportEmailDetails)

    return res.status(200).json({
        status: true,
        message: "Refund process is completed",
        data:{},
        responseCode: '000'
    });

})
