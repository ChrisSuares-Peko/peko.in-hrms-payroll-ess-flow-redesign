const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const axios = require("axios");
const { findServiceOperatorByAccessKey } = require("../../utils/checkAndFetchServiceDetails");
const paymentGatewayOrders = require("../../models/entities/paymentGatewayOrders");
const { ORDER_KIND } = require("../../constants/orderKind");
const paytmChecksum = require("paytmchecksum");
const operatorsData = require("../../utils/operatorsData.json");
const accessKey = operatorsData["paytmPaymentGateway"]["accessKey"];
const eSIM = require('../../controllers/corporate/eSIMV2');
const giftcards = require('./giftCard')
const ecommerce = require('./ecommerce')
const carbonFootprint = require('./carbonFootprint')
const workspace = require('./workspace')
const hotel = require('./hotels')
const flight = require('./flight')
const logistics = require('./logistics')
const softwares = require('./softwares');
const subscription = require('./subscription');
const works = require('./works');
const hike=require('./hike')
const whatsAppForBusiness = require('./whatsAppForBusiness');
const softwareSubscription = require('./software_subscriptions');
const { customLog } = require("../../utils/loggerHelper");

const operatorData = require('../../utils/operatorsData.json');


exports.createOrder = asyncHandler(async (req, res, next) => {

  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);

  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails["error"], 200));
  }

  const vendorUrl = serviceDetails.vendor.apiUrl;
  const MID = serviceDetails.vendor.optional1;
  const merchantKey = serviceDetails.vendor.optional2;


  const paymentRefId = new Date().valueOf();
  if (req.user.role === 'CORPORATE_SUB_USER') {
    await paymentGatewayOrders.create({
        paymentRefId,
        orderKind: ORDER_KIND.PAYMENT_GATEWAY,
        paymentData: JSON.stringify({
            ...req.body,
            paymentRefId,
            role: req.user.role,
            subCorporateId: req.user.subCorporateId
        }),
        // credentialId: credentialId
    });
} else {
    await paymentGatewayOrders.create({
        paymentRefId,
        orderKind: ORDER_KIND.PAYMENT_GATEWAY,
        paymentData: JSON.stringify({
            ...req.body,
            paymentRefId
        }),
        // credentialId: credentialId
    });
}

  const amount = parseFloat(req.body.paytmAmount).toFixed(2);

  const paytmParams = {
    body: {
      websiteName: 'DEFAULT',
      requestType: "PAYMENT",
      orderId: paymentRefId,
      mid: MID,
      // callbackUrl: callbackUrl,
      txnAmount: {
        value: amount,
        currency: "INR",
      },
      userInfo: {
        custId: req.user.id,
        mobile: req.user.mobileNo,
        email: req.user.email,
        firstName: req.user.name,
      },
    },
  };

  const checksum = await paytmChecksum.generateSignature(JSON.stringify(paytmParams.body), merchantKey);

  paytmParams.head = {
    signature: checksum,
    channelId: "WEB"
  };

  const post_data = JSON.stringify(paytmParams);

  const config = {
    method: "POST",
    url: `${vendorUrl}/aoa-acquiring-biz/v2/order?mid=${MID}&orderId=${paymentRefId}`,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": post_data.length
    },
    data: post_data,
  };
  axios
    .request(config)
    .then(async (response) => {
      const recivedSignature = response.data.head.signature;
      var isVerifySignature = paytmChecksum.verifySignature(JSON.stringify(response.data.body), merchantKey, recivedSignature);
      if (!isVerifySignature) {
        customLog(req?.LogTraceId, "info", { message: "Checksum mismatched" })
        return next(new ErrorResponse("Something went wrong while creating order signature", 501));
      }
      if (response.data.body.resultInfo.resultCode === "0000") {
        await paymentGatewayOrders.update({
          status: 'ORDERED',
          referenceNo: response.data.body.txnToken
        }, {
          where: { paymentRefId }
        })

        return res.status(201).json({
          status: true,
          data: {
            amount,
            orderId: paymentRefId,
            txnToken: response.data.body.txnToken,
          },
          message: 'order created successfully',
          responseCode: '000'

        });
      } else {
        return next(new ErrorResponse("Something went wrong while creating order", 501));
      }
    })
    .catch((err) => {
      customLog(req?.LogTraceId, "error", { message: "CATCH FROM CREATE ORDER:", err })
      return next(new ErrorResponse("Something went wrong while creating order", 501));
    });
});

exports.handlePaytmCallback = asyncHandler(async (req, res, next) => {
  // if we set redirect true in js checkout config in the front end  --> payment response will came in req.body (api called by paytm)
  // if we set redirect false in js checkout configin the front end  --> we need to manually call this end point and pass payment response in the payload


  let paymentRefId = req.body.ORDERID

  // we saved payment data while creating order . finding order Data using ref id
  let orderDetails = await paymentGatewayOrders.findOne({ where: { paymentRefId } })

  if (!orderDetails) {
    return next(new ErrorResponse("Order details not found", 400));
  }

  let paymentBodyData = JSON.parse(orderDetails.paymentData)

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
  if (orderDetails.status !== 'ORDERED') {
    return next(new ErrorResponse("Unauthoirsed payment request", 401));
  }
  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);

  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400));
  }

  const vendorUrl = serviceDetails.vendor.apiUrl;
  const MID = serviceDetails.vendor.optional1;
  const merchantKey = serviceDetails.vendor.optional2;

  const recivedSignature = req.body.CHECKSUMHASH;
  const recivedBody = {
    ...req.body
  }
  const isVerifySignature = paytmChecksum.verifySignature(recivedBody, merchantKey, recivedSignature);

  if (!isVerifySignature) {
    return next(new ErrorResponse("Invalid payment parameters", 400));
  }

  try {
    // api call for final payment status checking
    const statusParams = {
      body: {
        mid: MID,
        orderId: req.body.ORDERID
      }
    };
    const checksum = await paytmChecksum.generateSignature(JSON.stringify(statusParams.body), merchantKey);
    statusParams.head = {
      signature: checksum,
    };
    const post_data = JSON.stringify(statusParams);
    const config = {
      method: "POST",
      url: `${vendorUrl}/aoa-order-status/v2/orderstatus/querybyorderid`,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": post_data.length
      },
      data: post_data,
    };

    axios.request(config).then(async (response) => {
      console.log("🚀 ~ Paytm Pg status check Api Response:", response.data);

      const recivedSignature = response.data.head.signature
      const isVerifySignature = paytmChecksum.verifySignature(JSON.stringify(response.data.body), merchantKey, recivedSignature);

      if (!isVerifySignature) {
        customLog(req?.LogTraceId, "info", { message: "Checksum mismatched while checking final payment status" })
        return next(new ErrorResponse("Invalid payment parameters", 400));
      }

      const paytmResponse = response.data?.body
      if (paytmResponse?.resultInfo?.resultCode === "01") {

        await paymentGatewayOrders.update({
          referenceNo: paytmResponse.TXNID,
          status: 'COMPLETE',
          paymentResponse: JSON.stringify(paytmResponse)
        }, { where: { paymentRefId } })

        req.body = {
          ...paymentBodyData,
          corporateTxnId: paymentRefId,
          paytmResponse: paytmResponse
        }

        let operator = req.body.accessKey
        switch (operator) {
          case operatorData['giftCard']['accessKey']:
            await giftcards.paymentMOCK(req, res, next)
            break;
          case operatorData['e-commerce']['accessKey']:
            await ecommerce.payment(req, res, next)
            break;
          case operatorData['carbonFootprints']['accessKey']:
            await carbonFootprint.payment(req, res, next)
            break;
          case operatorData['workspace']['accessKey']:
            await workspace.payment(req, res, next)
            break;
          case operatorData['flight']['accessKey']:
            await flight.payment(req, res, next)
            break;
          case operatorData['hotel']['accessKey']:
            await hotel.payment(req, res, next)
            break;
          case operatorData['logistics']['accessKey']:
            await logistics.payment(req, res, next)
            break;
          case operatorData['subscription']['accessKey']:
            await softwares.payment(req, res, next)
            break;
            case operatorData['hike']['accessKey']:
              await hike.payment(req, res, next)
              break;
          case operatorData['pekoWorks']['accessKey']:
            await works.payment(req, res, next)
            break;
          case operatorData['subscriptionPlans']['accessKey']:
            req.body.isAddOns ? await subscription.subscriptionAddOnsPayment(req, res, next) : await subscription.payment(req, res, next)
            break;
          case operatorData['whatsAppForBusiness']['accessKey']:
            req.body.isSubscription ? await whatsAppForBusiness.ProjectSubscriptionPayment(req,res,next) : await whatsAppForBusiness.payment(req, res, next)
            break;
          case operatorData['email_domain_service']['accessKey']:
            await softwareSubscription.payment(req,res,next);
            break;
            case operatorData['eSIM']['accessKey']:
              await eSIM.payment(req,res,next);
              break;
          default:
            return next(new ErrorResponse("Service not found", 404));
        }
      } else {
        await paymentGatewayOrders.update({
          referenceNo: paytmResponse.TXNID,
          status: 'FAILED',
          paymentResponse: JSON.stringify(paytmResponse)
        }, { where: { paymentRefId } })

        return next(new ErrorResponse("Payment failed", 502));
      }
    });
  } catch (error) {
    await paymentGatewayOrders.update({
      referenceNo: req.body.TXNID,
      status: 'FAILED',
      paymentResponse: JSON.stringify(req.body)
    }, { where: { paymentRefId } })
    customLog(req?.LogTraceId, "error", { message: "🚀 ~ Paytm pg catch block:", error })
    return next(new ErrorResponse("Payment failed", 500));
  }
});

exports.handlePaytmWebhook = asyncHandler(async (req, res, next) => {
  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);

  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails["error"], 200));
  }

  const merchantKey = serviceDetails.vendor.optional2;

  const recivedSignature = req.body.CHECKSUMHASH;
  delete req.body.CHECKSUMHASH;

  // verify webhook signature
  var isVerifySignature = paytmChecksum.verifySignature(req.body, merchantKey, recivedSignature);

  if (isVerifySignature) {
    const transactionData = req.body;

    if (transactionData.RESPCODE == "01") {
      // successful payment logic here
    } else {
      //payment is failed remaining logic here
    }
  } else {
    customLog(req?.LogTraceId, "info", { message: "Checksum mismatched" })
  }
});
