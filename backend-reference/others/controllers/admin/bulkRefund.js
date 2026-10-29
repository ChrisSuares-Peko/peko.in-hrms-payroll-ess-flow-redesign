/* eslint-disable no-unused-vars */

const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { findAllFaildBulkTransactions, findAllTransactionsByIds } = require('../../models/use-cases/transaction');
const { findOne } = require('../../models/use-cases/systemUser');
const { verifyOtp } = require('../../models/use-cases/otp');
const { refundWalletTransaction } = require('../../utils/walletTransaction');


exports.findBulkTransactions = asyncHandler(async (req, res, next) => {
    let { serviceAccessKey, corporateId, from, end, searchText } = req.query;
    corporateId = req.query.corporateId || undefined
    let params = { serviceAccessKey, corporateId, from, end, searchText }
    console.log({ params });


    const transactionsData = await findAllFaildBulkTransactions(params);
    console.log({ params, transactionsData });

    if (!transactionsData) {
        return next(new ErrorResponse(`Something went wrong while fetching data`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Transactions fetched successfully',
            'data': transactionsData,
            'responseCode' : '000'
        })
    }
})

exports.bulkRefundAndUpdateOrder = asyncHandler(async (req, res, next) => {
    let data = req.body
    let { total, checkedCorporateTxnIds } = data

    if (data.scope === 'email') {
        let email = req.user.email
        if (!req.user.email) {
            const result = await findOne(req.user)//get email from system user 
            email = result.email
        }

        let response = await verifyOtp({ contact: email, otp: data.otp, context: 'email' })
        if (response.isVerified === false) {
            return next(new ErrorResponse(response?.message || 'Something went wrong', 400))
        }
    } else {
        return next(new ErrorResponse('otp is required', 400))
    }
    //otp  verification completed , next refund process
    console.log({ d: 'otp otp verification completed , next refund process' })
    console.log({ total, checkedCorporateTxnIds })
    if (checkedCorporateTxnIds.length < 1) {
        return next(new ErrorResponse('Please select at least one transaction to continue', 400))
    }
    let { transactions, transactionsByBatchObj } = await findAllTransactionsByIds(checkedCorporateTxnIds)
    for (const key in transactionsByBatchObj) {
        let transactions = transactionsByBatchObj[key]
        let totalRefundByBatch = 0
        let paymentMode = ''
        let paymentData
        let serviceAccessKey = ''
        for (let i = 0; i < transactions.length; i++) {
            let transaction = transactions[i]
            paymentMode = transaction.order.paymentMode
            serviceAccessKey = transaction.serviceOperator.accessKey
            if (transaction?.order?.paymentModeResponse) {
                paymentData = JSON.parse(transaction?.order?.paymentModeResponse)
            }

            totalRefundByBatch += parseFloat(transaction.order.amountInINR)
        }

        if (paymentMode == 'WALLET') {
            for (let i = 0; i < transactions.length; i++) {
                let transaction = transactions[i]
                let updateDetails = {
                    corporateTxnId: transaction.corporateTxnId,
                    status: "REFUNDED",
                    providerId: "Not Available",
                    message: "Refund initiated!!!",
                    registeredById: req.user.registeredBy
                }
                await refundWalletTransaction(updateDetails)
            }
        } 
        // else if (paymentMode == 'PAYMENT GATEWAY' && paymentData) {
        //     //1st we do PG refund
        //     //cancel with  payment gateway refund 
        //     let refundPGResponse = await refundCardTransaction(req, paymentData, totalRefundByBatch, serviceAccessKey)
        //     if (refundPGResponse?.state == 'REVERSED' || refundPGResponse?.state == 'REFUNDED' || refundPGResponse?.state == 'PARTIALLY_REFUNDED') {
        //         for (let i = 0; i < transactions.length; i++) {
        //             let transaction = transactions[i]
        //             let updateDetails = {
        //                 corporateTxnId: transaction.corporateTxnId,
        //                 status: "REFUNDED",
        //                 providerId: "Not Available",
        //                 message: "Refund initiated!!!",
        //                 registeredById: req.user.registeredBy
        //             }
        //             await refundWalletTransaction(updateDetails)
        //         }
        //     } else {
        //         return next(new ErrorResponse(`Something went wrong in refunding`, 400));
        //     }
        // } 
        else {
            return next(new ErrorResponse(`Refund is not available for this payment mode`, 400));
        }
    }
    return res.status(200).json({
        status: true,
        message: "Refund process is completed",
        data: {},
        responseCode : '000'
    });
})
