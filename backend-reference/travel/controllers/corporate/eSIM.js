/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-prototype-builtins */
// const express = require('express')
// const router = express.Router()
const axios = require('axios')
// const cryptoJS = require("crypto-js");
// const moment = require('moment');
const async = require('async')
const asyncHandler = require("../../middlewares/async");
// const cleverTap = require("../../services/CleverTap");
// const configurations = require('../../configs/airline.json')
const emailer = require('../../utils/emailer')
// const pdf = require('html-pdf');
const fs = require('fs');
const {
  fetchServiceDetails,
} = require("../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../../utils/error-response");
const {
  createWalletTransaction,
  refundWalletTransaction,
  updateWalletTransaction,
} = require("../../utils/walletTransaction");
const operatorsData = require("../../utils/operatorsData.json");
const accessKey = operatorsData.eSIM.accessKey;
const cities = require("./../../models/entities/cities");

const { getValue, setValue } = require("../../utils/cacheDataMethods");

// const { cancelCardTransaction } = require('./payment_gateway')
// const { paymentGateWayRefundFailureEmail } = require('../../utils/emailSender')
const {  createPGTransaction } = require('../../utils/pamentGatewayTransaction');
const { createNotification } = require('../../models/use-cases/notification');
const countries = require("../../public/countries.json");
const wallet = require('../../models/entities/wallet');
const { create, findAllEsimRecordsCount, packageSingleDetails,findAllRecordsOrderListAndCount,findAllRecordsTopUpListAndCount,findTransactionsByBatchId } = require('../../models/use-cases/eSIM');
const { generateEsimSuccessEmail } = require('../../utils/emailTemplates/eSim');
const { commonFailedTemplate } = require('../../utils/emailTemplates/common');
const { customLog } = require('../../utils/loggerHelper');
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt');
const { findOneOrderByTxnId } = require('../../models/use-cases/order');
let usdToINR = process.env.USD_TO_INR
async function checkService(req) {
  const credentialId = req.user.id //will come from userObject
  const packageId = req.user.packageId //will come from userObject
  const corporateUserId = req.user.corporateId
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId
  })
  if (serviceDetails.hasOwnProperty('error')) {
    return serviceDetails
  }

  let apiUrl
  if (process.env.NODE_ENV == 'production') {
    apiUrl = serviceDetails.vendor.healthUrl
  } else {
    apiUrl = serviceDetails.vendor.apiUrl
  }
  return {
    client_id: serviceDetails.vendor.optional1,
    client_secret: serviceDetails.vendor.optional2,
    API_URL: apiUrl,
    token:serviceDetails.vendor.optional1
  }
}

async function getToken(details, accessKey) {
  let isTokenData = await getValue(`airalo-token-${accessKey}`);
  if (isTokenData) {
    return isTokenData;
  } else {
    const formData = {
      client_id: details["client_id"],
      client_secret: details["client_secret"],
      grant_type: "client_credentials"
    };

    let config = {
      method: "post",
      url: `${details["API_URL"]}/v2/token`,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded', // Set content type to multipart/form-data
      },
      data: new URLSearchParams(formData).toString(), // Serialize the object into URL-encoded form data
    };
    try {

      let response = await axios(config)

      if (response && response.status === 200 && response.data.data.token_type) {
        let token = response.data.data.access_token;
        let expiry = response.data.data.expires_in;
        await setValue(`airalo-token-${accessKey}`, expiry, token);
        return token;
      } else {
        return false;
      }
    } catch (err) {
      customLog(null, "error", { message: err?.message, data: err?.response?.data })
      return false;
    }
  }
}

exports.fetchCountries = asyncHandler(async (req, res) => {
  const { searchQuery } = req.query;

  let filteredCountries = countries;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredCountries = countries.filter(country =>
      country.label.toLowerCase().includes(query)
    );
  }

  res.status(200).json({
    status: true,
    message: 'Countries retrieved successfully.',
    data: { countries: filteredCountries },
    responseCode: '000'
  });
})

exports.compatibleDeviceList = asyncHandler(async (req, res, next) => {

  let serviceDetails = await checkService(req)

  if (serviceDetails.hasOwnProperty('error')) {
    return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400))
  }

  const URL = serviceDetails.API_URL;
  const token = serviceDetails.token

  if (token) {

    let config = {
      method: "get",
      url: `${URL}/v2/compatible-devices`,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
    };
    try {
      let response = await axios(config)

      if (response && response.status === 200 && response.data.data) {
        let deviceList = response.data.data
        return res.status(200).json({
          status: true,
          data: { deviceList },
          message: "Device list fetched successfully",
          responseCode: '000',
        });
      } else {
        return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
      }
    } catch (err) {
      customLog(req?.LogTraceId, "error", { message: err?.response?.data?.meta?.message })
      return res.status(400).json({
        status: false,
        message: "Something went wrong. Please try again later.",
        data: { message: err?.response?.data?.meta?.message },
        responseCode: '001'
      });
    }
  } else {
    return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
  }
})

exports.fetchPackages = asyncHandler(async (req, res, next) => {

  let { type, country, limit, page } = req.query

  let serviceDetails = await checkService(req)

  if (serviceDetails.hasOwnProperty('error')) {
    return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400))
  }

  const URL = serviceDetails.API_URL;
  const token = await getToken(serviceDetails, accessKey);

  if (token) {

    let url = `${URL}/v2/packages`;
    let queryParams = [];

    if (type) queryParams.push(`filter[type]=${encodeURIComponent(type)}`);
    if (country) queryParams.push(`filter[country]=${encodeURIComponent(country)}`);
    if (limit) queryParams.push(`limit=${limit}`);
    if (page) queryParams.push(`page=${page}`);

    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    let config = {
      method: "get",
      url: `${url}`,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
    };
    try {
      let response = await axios(config)

      if (response && response.status === 200 && response.data.data) {
        let packages = response.data.data
        packages.forEach(({ operators }) => {
          operators.forEach(({ packages: operatorPackages }) => {
            operatorPackages.forEach(operatorPackage => {
              delete operatorPackage.net_price
            })
          })
        })
        return res.status(200).json({
          status: true,
          data: { packages, usdToINR },
          message: "Package list fetched successfully",
          responseCode: '000',
        });
      } else {
        return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
      }
    } catch (err) {
      customLog(req?.LogTraceId, "error", { message: err?.response?.data?.meta?.message })
      return res.status(400).json({
        status: false,
        message: "Something went wrong. Please try again later.",
        data: { message: err?.response?.data?.meta?.message },
        responseCode: '001'
      });
    }
  } else {
    return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
  }
})


exports.payment = asyncHandler(async (req, res, next) => {

  let transactionCategory = "Travel";
  const transactionId = req.body.transactionId;
  const providerId = transactionId;
  const account = "NA";
  const amount = parseFloat(req.body.amount);
  const payCashback = req.body.payCashback;
  const type = req.body.type;  // for differentiating sim and topup purchase
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId
  const username = req.user.username;
  const emailId = req.user.email
  const name = req.user.name
  const accounts_id = req.user.accounts_id;
  let templateDetails;
  templateDetails = await fetchPartnerDetails(req.user.registeredBy)
  let quantity = req.body.quantity
  let operatorImage = req.body.operatorImage
  let operatorName = req.body.operatorName

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails["error"], 500));
  }

  let apiUrl
  if (process.env.NODE_ENV == 'production') {
    apiUrl = serviceDetails.vendor.healthUrl
  } else {
    apiUrl = serviceDetails.vendor.apiUrl
  }

  const token = await getToken(serviceDetails.vendor, accessKey);
  if (token) {
    let commissionType = serviceDetails.commissionType;
    let cashbackType = serviceDetails.cashbackType;
    let providerCommission = serviceDetails.providerCommission;
    let corporateCashback = serviceDetails.cashback;
    let serviceOperatorId = serviceDetails.id;
    // const surchargeWithoutTax = calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount)
    // const surcharge = await calculateAmountWithTax(surchargeWithoutTax)
    const surcharge = serviceDetails.surcharge
    let data
    if (type === "SIM") {
      data = {
        quantity: quantity,
        package_id: req.body.packageId,
        // type: 'sim',
        // description:'',
      };
    } else if (type === "TOPUP") {
      data = {
        package_id: req.body.packageId,
        iccid: req.body.iccid,
        // description:'',
      };
    } else {
      return next(new ErrorResponse("Purchase type is not defined", 500));
    }

    //first we will  do transaction
    let corporateTxnId = new Date().valueOf();
    let transactionResponse = {};
   if (Object.prototype.hasOwnProperty.call(req.body, "paytmResponse")) {
      transactionResponse = await createPGTransaction({
        providerId,
        corporateTxnId,
        credentialId,
        serviceOperatorId,
        corporateCashback,
        pgAmount: req.body.pgAmount,
        transactionCategory,
        orderAmount: amount,
        commissionType,
        cashbackType,
        providerCommission,
        payCashback,
        pgResponse: req.body.paymentGatewayResponse,
        surcharge,
      });
    } else {
      transactionResponse = await createWalletTransaction({
        corporateTxnId,
        credentialId,
        serviceOperatorId,
        corporateCashback,
        transactionCategory,
        amount: amount,
        surcharge,
        commissionType,
        cashbackType,
        providerCommission,
        payCashback,
      });
    }
    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
      return next(new ErrorResponse(transactionResponse["error"], 500));
    }
    
    let updateDetails = {};
    let esimDetails
    let vendorUrl

    if (type === "SIM") {
      vendorUrl = `${apiUrl}/v2/orders`
    } else {
      vendorUrl = `${apiUrl}/v2/orders/topups`
    }

    let config = {
      method: "post",
      url: vendorUrl,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
      data: new URLSearchParams(data).toString(),
    };

    try {
      let response = await axios(config)
      if (response && response.status === 200 && response.data.data) {
        esimDetails = response.data.data
        esimDetails.packageType = req.body?.packageType
        esimDetails.region = req.body?.region
        esimDetails.countries = req.body?.countries

        updateDetails = {
          corporateTxnId,
          providerId: type ? type : "Not Available",
          status: "SUCCESS",
          orderResponse: JSON.stringify({
            ...esimDetails
          }),
          message: "Payment Successful",
        };

        let { transactionId } = transactionResponse
        // ONLY STORING SIM DETAILS ON SIM PURCHASE
        if (type === "SIM") {
          let packageDetails = {
            ...esimDetails,
            operatorImage: operatorImage ? operatorImage : "Not Available",
            operatorName: operatorName ? operatorName : "Not Available",
            isRechargable: req.body.isRechargable ? req.body.isRechargable : "Not Available"
          }
          delete packageDetails.sims;

          let simDetails = esimDetails.sims
          let createData = {
            packageDetails,
            simDetails,
            quantity: req.body.quantity,
            amount,
            credentialId,
            transactionId
          }
          await create(createData)
        }

      } else {
        updateDetails = {
          corporateTxnId,
          status: "FAILURE",
          providerId: "Not Available",
          message: '',
          registeredById: req.user.registeredBy,
        };
      }
    } catch (err) {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: "Not Available",
        message: err?.response?.data?.meta?.message,
        registeredById: req.user.registeredBy,
      };
    }
    if (updateDetails?.status === "FAILURE") {

      if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        // let refundPGResponse = await cancelCardTransaction(req, req.body.paymentGatewayResponse)
        // if (refundPGResponse?.state == 'REVERSED') {
        //   await refundWalletTransaction(updateDetails)
        // } else {
        //   await paymentGateWayRefundFailureEmail(req)
        // }
      }else {
        await refundWalletTransaction(updateDetails)
      }

    } else {

      if (updateDetails.message == "Payment Successful") {
        // must use this in transaction events
        // cleverTap.uploadEvent({
        //   eventName: "Transactions",
        //   eventData: {
        //     Status: "Payment Success",
        //   },
        //   email: emailId,
        // },templateDetails);
        const paymentDetails = {
          transactionId: corporateTxnId,
          account: account,
          amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
        };

        // Fire-and-forget: a failure anywhere in here (template resolution, invoice/PDF
        // generation) must never block the notification below or bubble up as a 500 for
        // a payment that already succeeded — it should just be a logged, missing email,
        // not a silent one.
        try {
          const to = emailId; // Set recipient email address
          const fallbackSubject = type == 'SIM' ? "Your eSIM Order Confirmation" : "Your eSIM-Topup Order Confirmation";
          const esimHeading = type === 'SIM' ? 'eSIM Order Confirmation' : 'eSIM-Topup Order Confirmation';
          const esimIntroText = `We're pleased to confirm that your payment of INR ${paymentDetails.amount} for the eSIM package (${esimDetails?.package}) has been successfully processed.${type == "SIM" ? ' The next step is to activate your eSIM. To learn how to do this, go to the instructions below.' : ''}`;
          const resolved = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.ESIM_PAYMENT_SUCCESS,
            service: EMAIL_TEMPLATE_SERVICES.ESIM,
            variables: {
              heading: esimHeading,
              introText: esimIntroText,
              placedOn: new Date().toLocaleString(),
              transactionId: paymentDetails.transactionId,
              amount: paymentDetails.amount,
              packageName: esimDetails?.package,
              branding: templateDetails?.branding || 'Peko',
              ...v2LayoutVariables(templateDetails),
            },
            fallback: () => generateEsimSuccessEmail(name, paymentDetails.transactionId, paymentDetails.amount, esimDetails, type, quantity, operatorImage, operatorName, templateDetails),
            fallbackSubject,
            logTraceId: req?.LogTraceId,
          });

          const isPgPayment = Object.prototype.hasOwnProperty.call(req.body, "paytmResponse");
          const invoiceOrderId =
            transactionResponse?.orderId ??
            (await findOneOrderByTxnId(String(corporateTxnId)))?.id;
          const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount,
            surcharge: surcharge || 0,
            couponDiscount: 0,
            corporateTxnId,
            orderId: invoiceOrderId,
            paymentType: "eSIM",
            credentialId,
            pgAmount: isPgPayment ? req.body.pgAmount : null,
            traceId: req?.LogTraceId,
          });

          // Call email function to send email with payment details in the body
          emailer.emailWithMultipleAttachment(to, resolved.subject, resolved.html, invoiceAttachments, function () {
            customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
          });
        } catch (emailError) {
          customLog(req?.LogTraceId, "error", {
            message: "eSIM payment-success email failed to send",
            corporateTxnId,
            error: emailError?.message || String(emailError),
          });
        }

        const notificationData = {
          notificationTitle: `${type == "SIM" ? "e-SIM Payment" : "e-SIM top-up "} successful`,
          notificationBrief: `${type == "SIM" ? "e-SIM Payment" : "e-SIM top-up "} of AED ${paymentDetails.amount} was successful. Transaction ID: ${paymentDetails.transactionId}.`,
          notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
          notificationCategory: 'CORPORATE', // Replace with the relevant category
          notificationBy: 'ADMIN' // Replace with the user or system that triggered the notification
        };
        // createExpense({
        //   credentialId,
        //   packageId,
        //   corporateUserId
        // },{accounts_id, amount:paymentDetails.amount, credentialId: req.user.id, category: serviceDetails?.serviceCategory,
        //   merchant: serviceDetails?.vendor?.vendorName})
        createNotification(notificationData);
      }
      await updateWalletTransaction(updateDetails);

    }

    if (updateDetails.message !== "Payment Successful") {
      // must use this in transaction events
      // cleverTap.uploadEvent({
      //   eventName: "Transactions",
      //   eventData: {
      //     Status: "Payment Failure",
      //   },
      //   email: emailId,
      // },templateDetails);
      const paymentDetails = {
        transactionId: corporateTxnId,
        account: account,
        amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2)
      };
      const notificationData = {
        notificationTitle: `${type == "SIM" ? "e-SIM Payment" : "e-SIM top-up "} unsuccessful`,
        notificationBrief: `${type == "SIM" ? "e-SIM Payment" : "e-SIM top-up "} of AED ${paymentDetails.amount} was unsuccessful. Transaction ID: ${paymentDetails.transactionId}.`,
        notificationTo: [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN'
      };
      const serviceUrl = templateDetails?.baseUrl ||
        (process.env.NODE_ENV === "staging" ? process.env.STAGING_FRONT_END_URL : process.env.PRODUCTION_FRONT_END_URL);
      const to = emailId;
      const subject = 'Payment failed'
      const failedServiceName = `${type == "SIM" ? "eSIM" : "eSIM-Topup"}`;
      const resolvedFailed = await resolveEmailTemplate({
          key: EMAIL_TEMPLATE_KEYS.ESIM_PAYMENT_FAILED,
          service: EMAIL_TEMPLATE_SERVICES.ESIM,
          variables: {
              name,
              serviceName: failedServiceName,
              paymentDate: new Date().toLocaleString(),
              baseUrl: templateDetails?.baseUrl,
              branding: templateDetails?.branding || 'Peko',
              ...v2LayoutVariables(templateDetails),
          },
          fallback: () => commonFailedTemplate(name, failedServiceName, serviceUrl, templateDetails),
          fallbackSubject: subject,
          logTraceId: req?.LogTraceId,
      });

      emailer.email(to, resolvedFailed.subject, resolvedFailed.html, function () {
          customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
      });
      createNotification(notificationData);

      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });
      if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
        res.redirect(`${req.body.pageAddress}?status="failure"&transactionId=${corporateTxnId}`);
      } else
        return res.status(500).json({
          status: false,
          data: {
            ...{},
            corporateFinalBalance: walletDetails["balance"],
          },
          message: 'payment failed',
          responseCode: '001'
        });
    } else {
      if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
        res.redirect(`${req.body.pageAddress}?status="success"&transactionId=${corporateTxnId}`);
      } else
        return res.status(200).json({
          status: true,
          data: {
            ...transactionResponse,
            corporateTxnId,
            paidAmountInAed: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2)
          },
          message: 'payment successfull',
          responseCode: '000'
        });
    }

  } else {
    res.status(500).json({
      status: false,
      message: 'something went wrong',
      data: {},
      responseCode: '001'
    });
  }
});

exports.findAllRecordsAndCount = asyncHandler(async (req, res, next) => {
  try {

    let { searchText, page, itemsPerPage } = req.query;
    let corporateId = req.user.id

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let column = 'createdAt'
    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage

    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
    }

    let subCorporateUserId
    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
      subCorporateUserId = req.user.subCorporateId;
    }

    let params = {
      limit,
      offset,
      searchText,
      sort,
      column,
      corporateId,
      subCorporateUserId
    }

    const data = await findAllEsimRecordsCount(params);
    if (!data) {
      return next(new ErrorResponse(`Something went wrong while getting all records from database`, 400))
    } else {
      return res.status(200).json({
        'status': true,
        'data': {
          'data': data ? data.rows : 0,
          'recordsTotal': data ? data.count : 0,
        },
        'message': 'All records fetched successfully',
        'responseCode': '000'
      })
    }
  } catch (error) {
    next(new ErrorResponse(error.message, 500));
  }
})

exports.findOnePackageDetails = asyncHandler(async (req, res, next) => {

  try {
    let { orderId, iccid } = req.query

    const data = await packageSingleDetails({ id: orderId, credentialId: req.user.id });
    if (!data) {
      return res.status(400).json({
        'status': false,
        'data': {},
        'message': 'Record not found',
        'responseCode': '001'
      })
    }
    let packageDetails = data.packageDetails
    let simDetails = data.simDetails

    const foundDetails = simDetails.find(obj => obj.iccid == iccid);
    if (!foundDetails) {
      return res.status(400).json({
        'status': false,
        'data': {},
        'message': 'SIM not found',
        'responseCode': '001'
      })
    }

    let serviceDetails = await checkService(req)

    if (serviceDetails.hasOwnProperty('error')) {
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400))
    }

    const URL = serviceDetails.API_URL;
    const token = await getToken(serviceDetails, accessKey);

    if (token) {

      let config = {
        method: "get",
        url: `${URL}/v2/sims/${iccid}/usage`,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        },
      };
      try {
        let response = await axios(config)

        if (response && response.status === 200 && response.data.data) {
          let usage = response.data.data
          return res.status(200).json({
            status: true,
            data: {
              usage,
              simDetails: foundDetails,
              packageDetails
            },
            message: "Package fetched successfully",
            responseCode: '000',
          });
        } else {
          return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
        }
      } catch (err) {
        customLog(req?.LogTraceId, "error", { message: err?.response?.data?.meta?.message })
        return res.status(400).json({
          status: false,
          message: "Something went wrong. Please try again later.",
          data: { message: err?.response?.data?.meta?.message },
          responseCode: '001'
        });
      }
    } else {
      return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
    }
  } catch (error) {
    return next(new ErrorResponse("Something went wrong ", 500));
  }
})

exports.availableTopups = asyncHandler(async (req, res, next) => {

  let iccid = req.params.iccid

  if (!iccid) {
    return res.status(400).json({
      'status': false,
      'data': {},
      'message': 'Invalid SIM ICCID',
      'responseCode': '001'
    })
  }

  let serviceDetails = await checkService(req)

  if (serviceDetails.hasOwnProperty('error')) {
    return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400))
  }

  const URL = serviceDetails.API_URL;
  const token = await getToken(serviceDetails, accessKey);

  if (token) {

    let config = {
      method: "get",
      url: `${URL}/v2/sims/${iccid}/topups `,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
    };
    try {
      let response = await axios(config)

      if (response && response.status === 200 && response.data.data) {

        let planList = response.data.data
        planList.forEach(plan => {
          delete plan.net_price
        })
        return res.status(200).json({
          status: true,
          data: {
            planList,
            usdToINR
          },
          message: "Plan list fetched successfully",
          responseCode: '000',
        });
      } else {
        customLog(req?.LogTraceId, "error", response?.data)
        return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
      }
    } catch (err) {
      customLog(req?.LogTraceId, "error", { message: err?.response?.data?.meta?.message })
      return res.status(400).json({
        status: false,
        message: "Something went wrong. Please try again later.",
        data: { message: err?.response?.data?.meta?.message },
        responseCode: '001'
      });
    }
  } else {
    customLog(req?.LogTraceId, "error", { message: "Token not found" })
    return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
  }
})

exports.packageHistory = asyncHandler(async (req, res, next) => {

  let iccid = req.params.iccid

  if (!iccid) {
    return res.status(400).json({
      'status': false,
      'data': {},
      'message': 'Invalid SIM ICCID',
      'responseCode': '001'
    })
  }

  let serviceDetails = await checkService(req)

  if (serviceDetails.hasOwnProperty('error')) {
    return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400))
  }

  const URL = serviceDetails.API_URL;
  const token = await getToken(serviceDetails, accessKey);

  if (token) {

    let config = {
      method: "get",
      url: `${URL}/v2/sims/${iccid}/packages`,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
    };
    try {
      let response = await axios(config)

      if (response && response.status === 200 && response.data.data) {

        let packageList = response.data.data
        return res.status(200).json({
          status: true,
          data: {
            packageList,
            usdToINR
          },
          message: "Plackage list fetched successfully",
          responseCode: '000',
        });
      } else {
        return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
      }
    } catch (err) {
      customLog(req?.LogTraceId, "error", { message: err?.response?.data?.meta?.message })
      return res.status(400).json({
        status: false,
        message: "Something went wrong. Please try again later.",
        data: { message: err?.response?.data?.meta?.message },
        responseCode: '001'
      });
    }
  } else {
    return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
  }
})


exports.findAllRecordsOrderListAndCount = asyncHandler(async (req, res, next) => {
  try {

    let { searchText, page, itemsPerPage,fromDate,toDate} = req.query;
    let corporateId = req.user.id

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let column = 'createdAt'
    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage

    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
    }

    let subCorporateUserId
    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
      subCorporateUserId = req.user.subCorporateId;
    }

    let params = {
      limit,
      offset,
      searchText,
      sort,
      column,
      corporateId,
      subCorporateUserId,
      from:fromDate,
      to:toDate
    }

    const data = await findAllRecordsOrderListAndCount(params);
    if (!data) {
      return next(new ErrorResponse(`Something went wrong while getting all records from database`, 400))
    } else {
      return res.status(200).json({
        'status': true,
        'data': {
          'data': data ? data.rows : 0,
          'recordsTotal': data ? data.count : 0,
        },
        'message': 'All records fetched successfully',
        'responseCode': '000'
      })
    }
  } catch (error) {
    next(new ErrorResponse(error.message, 500));
  }
})

exports.findAllRecordsTopUpListAndCount = asyncHandler(async (req, res, next) => {
  try {

    let { searchText, page, itemsPerPage,iccid } = req.query;
    let corporateId = req.user.id

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let column = 'createdAt'
    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage

    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
    }

    let subCorporateUserId
    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
      subCorporateUserId = req.user.subCorporateId;
    }

    let params = {
      limit,
      offset,
      searchText,
      sort,
      column,
      corporateId,
      subCorporateUserId,
      iccid
    }

    const data = await findAllRecordsTopUpListAndCount(params);
    if (!data) {
      return next(new ErrorResponse(`Something went wrong while getting all records from database`, 400))
    } else {
      return res.status(200).json({
        'status': true,
        'data': {
          'data': data ? data.rows : 0,
          'recordsTotal': data ? data.count : 0,
        },
        'message': 'All records fetched successfully',
        'responseCode': '000'
      })
    }
  } catch (error) {
    next(new ErrorResponse(error.message, 500));
  }
})

exports.getBulkPaymentStatus = asyncHandler(async (req, res, next) => {
  let batchId = req.params?.batchId

  let bulkPaymentStatus = await findTransactionsByBatchId(batchId, req.user.id)

  return res.status(200).json({
      status: true,
      message: "Status Fetched Successfully",
      responseCode: '000',
      data: { bulkPaymentStatus }
  })

})
