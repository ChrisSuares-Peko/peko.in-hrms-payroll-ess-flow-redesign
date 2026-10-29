const express = require('express')
const router = express.Router({ mergeParams: true })

// const { checkStatus } = require("../../../../controllers/admin/payment_gateway");
const { createPaymentLink, resendPaymentLink } = require('../../../../controllers/admin/paymentLinks.js');
const { listWebhooks, retryWebhook, clearWebhooks } = require('../../../../controllers/corporate/webhookAdminController');

router.post('/create-payment-link', createPaymentLink)

router.post('/resend-payment-link/:paymentRefId', resendPaymentLink)

// Unified webhook inbox (filter with query params — see webhookAdminController)
router.get('/webhooks', listWebhooks)
router.delete('/webhooks', clearWebhooks)
router.post('/webhooks/:id/retry', retryWebhook)


// for redirect url
// router.get('/payment-link-callback/:paymentRefId', async (req, res, next) => {
//     let paymentRefId = req.params.paymentRefId
    // let orderDetails = await paymentGatewayOrders.findOne({
    //     where: {
    //         paymentRefId
    //     }
    // })
    // if (!orderDetails) {
    //     return next(new ErrorResponse('order details not found', 400));
    // }

    // let paymentBodyData = JSON.parse(orderDetails.paymentData)
    // let failureUrl = paymentBodyData.failureUrl;
    // let currentUrl = paymentBodyData.currentUrl;
    // let failureUrl = "http://localhost:5173/";
    // let currentUrl = "http://localhost:5173/";
    // if (true) {

    //     try {
    //         // let paymentStatus = await checkStatus(orderDetails.referenceNo)
    //         let paymentStatus = await checkStatus("1232423")
    //         //update paymentData with this paymentStatus
    //         let updatedPaymentData = { ...paymentBodyData, paymentStatus }
    //         // we need captureReferenceNo for refunding
    //         let captureReferenceNo;
    //         if (paymentStatus?._embedded?.payment[0]?.state == 'CAPTURED') {

    //             res.redirect(`${req.body.successUrl}?status="success"&transactionId=${'1723799266601'}`)
    //         } else {
                // await paymentGatewayOrders.update({
                //     status: 'FAILED',
                //     paymentData: JSON.stringify(updatedPaymentData)
                // }, {
                //     where: { paymentRefId }
                // })
        //         res.redirect(failureUrl)
        //     }
        // } catch (error) {
            // await paymentGatewayOrders.update({
            //     status: 'FAILED'
            // }, {
            //     where: { paymentRefId }
            // })
            // console.log(error)
            // res.redirect(failureUrl)
//         }
//     } else {
//         res.redirect(currentUrl)
//     }
// })

module.exports = router
