const express = require('express')
const router = express.Router()
const paymentGatewayOrders = require("../../../../models/entities/paymentGatewayOrders");

const quickCilver = require('../../../../controllers/corporate/giftCard')
const ecommerce = require('../../../../controllers/corporate/ecommerce')
const zeroCarbon = require('../../../../controllers/corporate/carbonFootprint')
const workspace = require('../../../../controllers/corporate/workspace')
const hotel = require('../../../../controllers/corporate/hotels')
const flight = require('../../../../controllers/corporate/flight')
const bus = require('../../../../controllers/corporate/bus')
const logisticsV3 = require('../../../../controllers/corporate/logisticsV3')
const softwaresV2 = require('../../../../controllers/corporate/softwaresV2')
const subscriptionPayments = require('../../../../controllers/corporate/softwares');
const { checkPaymentGatewayStatus, refundGatewayTransaction, createOrder } = require('../../../../controllers/corporate/pluralGateway');
const validateAmount = require('../../../../middlewares/validateAmount');
const ErrorResponse = require('../../../../utils/error-response')
const operatorData = require('../../../../utils/operatorsData.json');
const { queryStringIntoBase64 } = require('../../../../utils/encryptionUtils');

router.post('/create-order', validateAmount, createOrder)

router.post('/complete', async (req, res, next) => {
    let paymentGatewayResponse = req.body
    let paymentRefId = paymentGatewayResponse.unique_merchant_txn_id
    let orderDetails = await paymentGatewayOrders.findOne({
        where: { paymentRefId }
    })
    let paymentBodyData = JSON.parse(orderDetails.paymentData)
    let redirectPageAddress = paymentBodyData.pageAddress

    if (orderDetails.status === 'COMPLETE') {
      const paymentResponse = orderDetails.paymentResponse ? JSON.parse(orderDetails.paymentResponse) : null;
      return res.status(200).json({
        status: true,
        message: "Payment already processed successfully",
        responseCode: "000",
        data: {
          paymentRefId: orderDetails.paymentRefId,
          corporateTxnId: paymentBodyData.corporateTxnId ?? orderDetails.paymentRefId,
          amount: paymentBodyData.amount,
          accessKey: paymentBodyData.accessKey,
          account: paymentBodyData.account,
          paymentMode: paymentBodyData.paymentMode,
          paymentGatewayResponse: paymentResponse,
        },
      });
    }

    try {
        //adding req.user 
        //req.user = await findUserDetails(req.body.udf_field_1);
        console.log(paymentGatewayResponse);

        //pine_pg_txn_status  | txn_response_code  | status
        //    4               |       1            |  success
        //    1               |       0            |  Payment inquiry call required 
        //    -7              |     anycode        |  failed 


        if (paymentGatewayResponse?.pine_pg_txn_status == 1 && paymentGatewayResponse?.txn_response_code == 0) {
            const paymentStatus = await checkPaymentGatewayStatus(req, paymentGatewayResponse)
            if (paymentStatus?.ppc_Parent_TxnStatus != '4' && paymentStatus?.ppc_ParentTxnResponseCode != '1') {
                return res.redirect(`${redirectPageAddress}?status="failure"&transactionId=${paymentRefId}`)
            }
        }

        if (paymentGatewayResponse?.pine_pg_txn_status == 4 && paymentGatewayResponse?.txn_response_code == 1) {
            await paymentGatewayOrders.update({
                referenceNo: paymentGatewayResponse.pine_pg_transaction_id,
                status: 'COMPLETE',
                paymentResponse: JSON.stringify(paymentGatewayResponse)
            }, { where: { paymentRefId } })
            const paymentModes = {
                1: 'CREDIT/DEBIT CARD',
                3: 'NET BANKING',
                10: 'UPI',
                11: 'WALLET'
            };
            const paymentMode = paymentModes[paymentGatewayResponse.payment_mode];
            req.body = {
                ...paymentBodyData,
                paymentGatewayResponse: paymentGatewayResponse,
                paymentMode
            }
            console.log("REQ BODY:", req.body)
            let operator = req.body.accessKey
            console.log(operator)
            switch (operator) {
                case operatorData['giftCard']['accessKey']:
                    await quickCilver.paymentMOCK(req, res, next)
                    break;
                case operatorData['e-commerce']['accessKey']:
                    await ecommerce.payment(req, res, next)
                    break;
                case operatorData['carbonFootprints']['accessKey']:
                    await zeroCarbon.transaction(req, res, next)
                    break;
                case operatorData['workspace']['accessKey']:
                    await workspace.payment(req, res, next)
                    break;
                case operatorData['bus']['accessKey']:
                    await bus.payment(req, res, next)
                    break;
                case operatorData['flight']['accessKey']:
                    await flight.payment(req, res, next)
                    break;
                case operatorData['hotel']['accessKey']:
                    await hotel.payment(req, res, next)
                    break;
                case operatorData['logistics']['accessKey']:
                    await logisticsV3.payment(req, res, next)
                    break;
                case operatorData['subscription']['accessKey']:
                    await subscriptionPayments.payment(req, res, next)
                    break;
                // case operatorData['domainAndHosting']['accessKey']:
                //     await domainAndHosting.payment(req, res, next)
                //     break;
                case operatorData['softwares']['accessKey']:
                    await softwaresV2.payment(req, res, next)
                    break;
                default:
                    // eslint-disable-next-line no-case-declarations
                    const encodedQueryParams = queryStringIntoBase64("failure", paymentRefId)
                    return res.redirect(`${redirectPageAddress}?${encodedQueryParams}`)
            }
        } else {
            await paymentGatewayOrders.update({
                referenceNo: paymentGatewayResponse.pine_pg_transaction_id,
                status: 'FAILED',
                paymentResponse: JSON.stringify(paymentGatewayResponse)
            }, { where: { paymentRefId } })
            const encodedQueryParams = queryStringIntoBase64("declined", paymentRefId)
            return res.redirect(`${redirectPageAddress}?${encodedQueryParams}`)
        }
    } catch (error) {
        console.log(error)
        await paymentGatewayOrders.update({
            referenceNo: paymentGatewayResponse.pine_pg_transaction_id,
            status: 'FAILED',
            paymentResponse: JSON.stringify(paymentGatewayResponse)
        }, { where: { paymentRefId } })
        const encodedQueryParams = queryStringIntoBase64("declined", paymentRefId)
        return res.redirect(`${redirectPageAddress}?${encodedQueryParams}`)
    }
})

router.post('/status', async (req, res, next) => {
    const pgTransactionReference = req.body.pgTransactionReference

    const transactionDetails = await paymentGatewayOrders.findOne({ where: { referenceNo: pgTransactionReference } })
    if (!transactionDetails) {
        return next(new ErrorResponse("Transaction not found", 200));
    }
    const paymentResponse = JSON.parse(transactionDetails.paymentResponse)
    const paymentStatus = await checkPaymentGatewayStatus(req, paymentResponse)
    if (paymentStatus?.ppc_Parent_TxnStatus == '4' && paymentStatus?.ppc_ParentTxnResponseCode == '1') {
        return res.status(200).json({
            success: true,
            data: paymentStatus
        })
    } else {
        return res.status(501).json({
            success: false,
            message: "Payment failed",
            data: paymentStatus
        })
    }
})

router.post('/refund', async (req, res, next) => {
    const pgTransactionReference = req.body.pgTransactionReference

    const transactionDetails = await paymentGatewayOrders.findOne({ where: { referenceNo: pgTransactionReference } })

    if (!transactionDetails) {
        return next(new ErrorResponse("Transaction not found", 200));
    }
    const paymentResponse = JSON.parse(transactionDetails.paymentResponse)

    let refundPGResponse = await refundGatewayTransaction(req, paymentResponse)
    if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
        return res.status(200).json({
            success: true,
            message: "Refund successfull",
            data: refundPGResponse
        })
    } else {
        return res.status(501).json({
            success: false,
            message: "Refund failed"
        })
    }
})

module.exports = router