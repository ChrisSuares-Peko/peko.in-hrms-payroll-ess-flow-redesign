/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-prototype-builtins */
const axios = require("axios");
const asyncHandler = require("../../middlewares/async");
const { generateAirlineTicketAndSendToMail } = require("../../utils/templatesForEmails");
const { airLineTicketTemplate } = require("../../utils/emailTemplates/flights/airLineTicket");
const emailer = require("../../utils/emailer");
const fs = require("fs");
const wkhtmltopdf = require("wkhtmltopdf");
const moment = require("moment");
const path = require("path");

const { fetchServiceDetails } = require("../../utils/checkAndFetchServiceDetails");
const { findAllAirports } = require("./../../models/use-cases/airport");
const ErrorResponse = require("../../utils/error-response");
const { createWalletTransaction, refundWalletTransaction, updateWalletTransaction } = require("../../utils/walletTransaction");
const { setValue, getValue } = require("../../utils/cacheDataMethods");
const { DEFAULT_BOOKING_CUSTOMER_EMAIL } = require("../../utils/constants");
const accessKey = "REDACTED";
const wallet = require("../../models/entities/wallet");
const { v4: uuidv4 } = require("uuid");
const { fetchAllFlightBookings, updateBookingStatus, findOneBooking } = require("../../models/use-cases/flight");
const { createRazorPayTransaction, checkRazorPaySignature } = require("../../utils/dapiTransaction");
const { findOneTransaction } = require("../../models/use-cases/transaction");
const { findOneOrderById } = require("../../models/use-cases/order");
const { retrieveAirlineName, retrieveAirport, retrieveCountryName } = require("../../utils/airlineData");
const { refundGatewayTransaction } = require("./pluralGateway");
const { createNotification } = require("../../models/use-cases/notification");
const { commonFailedTemplate, commonFlightbookingFailedTemplate } = require("../../utils/emailTemplates/common");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { customLog } = require('../../utils/loggerHelper');

async function checkService(req) {
  const credentialId = req.user.id; //will come from userObject
  const corporateUserId = req.user.corporateId;
  const packageId = req.user.packageId; //will come from userObject
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (serviceDetails.hasOwnProperty("error")) {
    return serviceDetails;
  }
  return {
    userName: serviceDetails.vendor.optional1,
    password: serviceDetails.vendor.optional2,
    companyCode: serviceDetails.vendor.optional3,
    X_API_KEY: serviceDetails.vendor.optional4,
    API_URL: serviceDetails.vendor.apiUrl,
    commissionType: serviceDetails.commissionType,
    cashbackType: serviceDetails.cashbackType,
    providerCommission: serviceDetails.providerCommission,
    cashback: serviceDetails.cashback,
    id: serviceDetails.id,
    surcharge: serviceDetails.surcharge,
  };
}

async function getSession(serviceDetails, loggerTraceId = null) {
  let isSessionId = await getValue(`sessionId-${accessKey}`);
  // eslint-disable-next-line no-constant-condition
  if (false && isSessionId) {
    return isSessionId;
  } else {
    try {
      let data = JSON.stringify({
        userName: serviceDetails.userName,
        password: serviceDetails.password,
        companyCode: serviceDetails.companyCode,
      });
      let config = {
        method: "post",
        url: `${serviceDetails["API_URL"]}/api/v1/auth/login`,
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": serviceDetails.X_API_KEY,
          Accept: "*/*",
        },
        data: data,
      };

      customLog(loggerTraceId, "info", {
        message: "[airline-legacy:auth-login] request",
        endpoint: "auth/login",
      }, "VENDOR")
      const response = await axios(config);
      customLog(loggerTraceId, "info", {
        message: "[airline-legacy:auth-login] response",
        endpoint: "auth/login",
        statusCode: response?.status,
        hasSessionId: Boolean(response?.data?.data?.[0]?.sessionId),
      }, "VENDOR")
      if (!response) {
        return "";
      } else {
        await setValue(`sessionId-${accessKey}`, 60 * 60 * 1, response.data.data[0]["sessionId"]);
        return response.data.data[0]["sessionId"];
      }
    } catch (error) {
      customLog(loggerTraceId, "error", {
        message: "[airline-legacy:auth-login] error",
        endpoint: "auth/login",
        errorMessage: error?.message,
        statusCode: error?.response?.status,
        errorCode: error?.code,
      }, "VENDOR")
      return "";
    }
  }
}

function generatePassengerDetails(data) {
  let passengers = [];
  let i = 1;

  for (let j = 0; j < data.adultCount; j++) {
    passengers.push({
      id: i.toString(),
      ptc: "ADT",
    });
    i++;
  }

  for (let j = 0; j < data.childCount; j++) {
    passengers.push({
      id: i.toString(),
      ptc: "CHD",
    });
    i++;
  }

  for (let j = 0; j < data.infantCount; j++) {
    passengers.push({
      id: i.toString(),
      ptc: "INF",
    });
    i++;
  }
  return passengers;
}

exports.airports = asyncHandler(async (req, res, next) => {
  let searchText = req.query.q;
  let response = await findAllAirports(searchText);
  if (!response) {
    return next(new ErrorResponse(`Airport not found`, 404));
  } else {
    return res.status(200).json({
      status: true,
      message: "Airports fetched successfully",
      responseCode: "000",
      data: { airports: response },
    });
  }
});

exports.searchTicket = asyncHandler(async (req, res, next) => {
  let serviceDetails = await checkService(req);
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse(serviceDetails.error, 400));
  }
  let conversationId = uuidv4();
  let passengerDetails = generatePassengerDetails(req.body.passengerData);

  let data = JSON.stringify({
    flightSegments: req.body.flightSegments,
    passengers: passengerDetails,
    preference: {
      flightPreference: {
        directPreferences: false,
        maxConnections: 4,
      },
      airlinePreferences: [
        {
          preferred: [],
          allowOnly: [
            // "GF",  //removed to get multi-city search result
            // "WY",
            // "EK",
            // "QR",
            // "UL"
          ],
        },
      ],
      farePreference: [
        {
          farePreference: "758",
          supplierAccountCode: "A908260",
          preferenceContext: "",
          fareCodes: [],
        },
      ],
    },
    formOfPayment: "CR",
    travelType: "P",
    responseParameters: {
      shopResultPreference: "BEST",
    },
  });
  let config = {
    method: "post",
    url: `${serviceDetails["API_URL"]}/api/v1/flight/search`,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": serviceDetails.X_API_KEY,
      conversationId: conversationId,
      sessionId: await getSession(serviceDetails, req?.LogTraceId),
    },
    data: data,
  };
  let response;
  try {
    customLog(req?.LogTraceId, "info", {
      message: "[airline-legacy:flight-search] request",
      endpoint: "flight/search",
      conversationId,
    }, "VENDOR")
    response = await axios(config);
    customLog(req?.LogTraceId, "info", {
      message: "[airline-legacy:flight-search] response",
      endpoint: "flight/search",
      statusCode: response?.status,
      conversationId,
      hasData: Boolean(response?.data),
    }, "VENDOR")
    response = await recursiveFetch(response, serviceDetails, config);
    if (!response) {
      return next(new ErrorResponse(`No Results found`, 404));
    } else {
      return res.status(200).json({
        status: true,
        message: "Search Successful",
        responseCode: "000",
        data: {
          conversationId,
          ...response.data,
        },
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "[airline-legacy:flight-search] error",
      endpoint: "flight/search",
      conversationId,
      errorMessage: error?.message,
      statusCode: error?.response?.status,
      errorCode: error?.code,
      vendorErrorMessage: error?.response?.data?.errorDetails?.message,
    }, "VENDOR")
    if (error.response) {
      return next(new ErrorResponse(error?.response?.data?.errorDetails?.message ?? "Search faild", 400));
    } else {
      return next(new ErrorResponse(error.message, 500));
    }
  }
});

exports.fareRules = asyncHandler(async (req, res, next) => {
  let serviceDetails = await checkService(req);
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse(serviceDetails.error, 400));
  }
  let conversationId = req.body.conversationId;
  let data = JSON.stringify({
    offerId: req.body.offerId,
  });
  let config = {
    method: "post",
    url: `${serviceDetails["API_URL"]}/api/v1/flight/fare-rule-search`,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": serviceDetails.X_API_KEY,
      conversationId: conversationId,
      sessionId: await getSession(serviceDetails, req?.LogTraceId),
    },
    data: data,
  };
  customLog(req?.LogTraceId, "info", {
    message: "[airline-legacy:fare-rule-search] request",
    endpoint: "flight/fare-rule-search",
    conversationId,
  }, "VENDOR")
  axios(config)
    .then(function (response) {
      customLog(req?.LogTraceId, "info", {
        message: "[airline-legacy:fare-rule-search] response",
        endpoint: "flight/fare-rule-search",
        statusCode: response?.status,
        conversationId,
        hasData: Boolean(response?.data),
      }, "VENDOR")
      if (!response) {
        return next(new ErrorResponse(`No Results found `, 404));
      } else {
        return res.status(200).json({
          status: true,
          message: "Fare-rules search successful",
          responseCode: "000",
          data: {
            conversationId,
            ...response.data,
          },
        });
      }
    })
    .catch(function (error) {
      customLog(req?.LogTraceId, "error", {
        message: "[airline-legacy:fare-rule-search] error",
        endpoint: "flight/fare-rule-search",
        conversationId,
        errorMessage: error?.message,
        statusCode: error?.response?.status,
        errorCode: error?.code,
        vendorErrorMessage: error?.response?.data?.errorDetails?.message,
      }, "VENDOR")
      if (error.response) {
        return next(new ErrorResponse(error?.response?.data?.errorDetails?.message ?? "Fare-rule-search faild", 400));
      } else {
        return next(new ErrorResponse(error.message, 500));
      }
    });
});

exports.provBook = asyncHandler(async (req, res, next) => {
  let serviceDetails = await checkService(req);
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse(serviceDetails.error, 400));
  }
  let conversationId = req.body.conversationId;
  let data = JSON.stringify({
    offerId: req.body.offerId,
    detail: {
      ancillaryDetailsAvailable: req.body.details.ancillaryDetailsAvailable,
      lcc: req.body.details.lcc,
      apis: req.body.details.apis,
      ndc: req.body.details.ndc,
      onHoldSupported: req.body.details.onHoldSupported,
      moreFaresAvailable: req.body.details.moreFaresAvailable,
    },
    journey: req.body.journey,
    passengers: req.body.passengers,
    customerInfo: req.body.customerInfo,
    reservationType: "UNHOLD",
    paymentDetails: {
      paymentMode: "CR",
    },
  });
  let config = {
    method: "post",
    url: `${serviceDetails["API_URL"]}/api/v1/reservation/flight-prov-book`,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": serviceDetails.X_API_KEY,
      asyncFetchEnabled: true,
      conversationId: conversationId,
      sessionId: await getSession(serviceDetails, req?.LogTraceId),
    },
    data: data,
  };

  try {
    customLog(req?.LogTraceId, "info", {
      message: "[airline-legacy:flight-prov-book] request",
      endpoint: "reservation/flight-prov-book",
      conversationId,
    }, "VENDOR")
    let result = await axios(config);
    customLog(req?.LogTraceId, "info", {
      message: "[airline-legacy:flight-prov-book] response",
      endpoint: "reservation/flight-prov-book",
      statusCode: result?.status,
      conversationId,
      hasData: Boolean(result?.data),
    }, "VENDOR")
    if (!result) {
      return next(new ErrorResponse(`No Results found`, 404));
    } else {
      result = await recursiveFetch(result, serviceDetails, config);
      return res.status(200).json({
        status: true,
        message: "Pro-book successful",
        responseCode: "000",
        data: {
          conversationId,
          ...result.data,
        },
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "[airline-legacy:flight-prov-book] error",
      endpoint: "reservation/flight-prov-book",
      conversationId,
      errorMessage: error?.message,
      statusCode: error?.response?.status,
      errorCode: error?.code,
      vendorErrorMessage: error?.response?.data?.errorDetails?.message,
    }, "VENDOR")
    if (error.response) {
      return next(new ErrorResponse(error?.response?.data?.errorDetails?.message ?? "PNR unsuccessful!", 400));
    } else {
      // Handle other errors
      console.error("Error:", error.message);
      return next(new ErrorResponse(error.message, 500));
    }
  }
});
function AEDtoParentCurrency(amount, parentCurrency) {
  console.table({ amount, parentCurrency });
  const USDAEDRate = 3.67;
  const EURAEDRate = 3.88;

  if (isNaN(amount)) {
    return false;
  }

  let convertedAmount;
  switch (parentCurrency) {
    case "INR":
      convertedAmount = amount.toFixed(2);
      break;
    case "USD":
      convertedAmount = (amount / USDAEDRate).toFixed(2);
      break;
    case "EUR":
      convertedAmount = (amount / EURAEDRate).toFixed(2);
      break;
    default:
      return false; // Invalid or unsupported currency
  }
  return parseFloat(convertedAmount);
}
exports.payment = asyncHandler(async (req, res, next) => {
  if (req.body.razorPay) {
    const checkSignature = checkRazorPaySignature(req.query.orderId, req.body.razorPay);
    if (!checkSignature) {
      return next(new ErrorResponse(`payment failed`, 400));
    }
  }
  let transactionCategory = "Travel";
  const isLcc = req.body.isLcc;
  const transactionId = req.body.transactionId;
  const providerId = transactionId;
  const name = req.user.name
  const account = req.body.resultId;
  const amount = parseFloat(req.body.amount);
  const payCashback = req.body.payCashback;
  // const type = req.body.type
  const emailId = req.user.email
  const credentialId = req.user.id; //will come from userObject
  let templateDetails;
  templateDetails = await fetchPartnerDetails(req.user.registeredBy)
  let convertedPrice = AEDtoParentCurrency(req.body.fare, req.body.currencyCode);
  console.table({ convertedPrice });
  if (!convertedPrice) {
    return next(new ErrorResponse("Payment faild", 400));
  }
  req.body.fare = convertedPrice;

  let serviceDetails = await checkService(req);
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse(serviceDetails.error, 400));
  }
  let flightDetails = req.body.flightDetails;
  let conversationId = req.body.conversationId;
  let commissionType = serviceDetails.commissionType;
  let cashbackType = serviceDetails.cashbackType;
  let providerCommission = serviceDetails.providerCommission;
  let corporateCashback = serviceDetails.cashback;
  let serviceOperatorId = serviceDetails.id;
  let surcharge = serviceDetails.surcharge;

  //first we will  do transaction
  let corporateTxnId = new Date().valueOf();
  req.corporateTxnId = corporateTxnId; //later useF
  let transactionResponse = {};
  if (req.body.hasOwnProperty("razorPay")) {
    transactionResponse = await createRazorPayTransaction({
      ...commonParams,
      razorPayAmount: req.body.razorPayAmount,
      razorPayResponse: req.body.razorPay,
    });
  }
  //   else if (req.body.hasOwnProperty("paymentGatewayResponse")) {
  //     transactionResponse = await createPGTransaction({
  //       ...commonParams,
  //       pgAmount: req.body.pgAmount,
  //       pgResponse: req.body.paymentGatewayResponse,
  //     });
  //   }
  else {
    transactionResponse = await createWalletTransaction({
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      accountNo: account,
      transactionCategory,
      amount,
      surcharge,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
    });
  }
  if (transactionResponse && transactionResponse.hasOwnProperty("error")) {
    return next(new ErrorResponse(transactionResponse["error"], 400));
  }
  if (isLcc) {
    //if the flight is lcc then teh booking price include the anc price
    req.body.fare += req.body.totalAncillaryPrice;
  }
  let data = JSON.stringify({
    bookingReferenceId: "",
    offerId: req.body.offerId,
    customerInfo: {
      emailAddress: DEFAULT_BOOKING_CUSTOMER_EMAIL,
    },
    passengers: req.body.passengers,
    paymentDetails: {
      paymentMode: "CR",
      transactionAmount: req.body.fare,
      address: {
        label: "Billing",
        street: ["palm jumeraih", "200 Road"],
        postalCode: "767667",
        cityName: "dubai",
        countryCode: "UAE",
      },
    },
  });
  let config = {
    method: "post",
    url: `${serviceDetails["API_URL"]}/api/v1/reservation/flight-book`,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": serviceDetails.X_API_KEY,
      asyncFetchEnabled: true,
      conversationId: conversationId,
      sessionId: await getSession(serviceDetails, req?.LogTraceId),
    },
    data: data,
  };
  let result, bookingStatus;
  try {
    customLog(req?.LogTraceId, "info", {
      message: "[airline-legacy:flight-book] request",
      endpoint: "reservation/flight-book",
      conversationId,
      corporateTxnId,
    }, "VENDOR")
    result = await axios(config);
    customLog(req?.LogTraceId, "info", {
      message: "[airline-legacy:flight-book] response",
      endpoint: "reservation/flight-book",
      statusCode: result?.status,
      conversationId,
      corporateTxnId,
      orderId: result?.data?.orderId,
      bookingStatus: result?.data?.data?.[0]?.bookingStatus,
    }, "VENDOR")
    result = await recursiveFetch(result, serviceDetails, config);
    bookingStatus = result?.data?.data[0].bookingStatus;
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "[airline-legacy:flight-book] error",
      endpoint: "reservation/flight-book",
      conversationId,
      corporateTxnId,
      errorMessage: error?.message,
      statusCode: error?.response?.status,
      errorCode: error?.code,
      vendorErrorMessage: error?.response?.data?.errorDetails?.title,
    }, "VENDOR")
    result = error.response;
  }
 

  let updateDetails = {};
  if (!result || (result.hasOwnProperty("data") && !result.data.meta.success) || bookingStatus == "PNR FAILED") {
    updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: result?.data?.errorDetails?.title || "Booking faild",
      registeredById: req.user.registeredBy,
    };
    if (req.body.hasOwnProperty("paymentGatewayResponse")) {
      let refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
      if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
        await refundWalletTransaction(updateDetails);
      }
    } else {
      await refundWalletTransaction(updateDetails);
    }
  } else {
    updateDetails = {
      corporateTxnId,
      providerId: result.data.orderId ? result.data.orderId : "Not Available",
      status: "SUCCESS",
      orderResponse: JSON.stringify(result.data),
      message: "Payment Successful",
    };
    if (updateDetails.message == "Payment Successful") {
      const paymentDetails = {
        transactionId: corporateTxnId,
        account: account,
        amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
      };
      const notificationData = {
        notificationTitle: "Payment Successful",
        notificationBrief: `The payment of INR ${paymentDetails.amount} for Air Ticket with transaction ID ${paymentDetails.transactionId} was successful`,
        notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
        notificationCategory: "CORPORATE", // Replace with the relevant category
        notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
      };
      createNotification(notificationData);
    }
    await updateWalletTransaction(updateDetails);
  }
  // Call flightBookingScheduler function when 'OK TO TICKET' status is encountered
  // if (bookingStatus === 'OK TO TICKET') {
  //     flightBookingScheduler(req, result.data);
  // }

  if (updateDetails.message !== "Payment Successful") {
    const paymentDetails = {
      transactionId: corporateTxnId,
      account: account,
      amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
    };
    const serviceUrl = templateDetails?.baseUrl;
    const to = emailId;
    const subject = 'Payment failed'
    const body = commonFlightbookingFailedTemplate(name, "Air Ticket", serviceUrl, templateDetails);

    emailer.email(to, subject, body, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });
    const notificationData = {
      notificationTitle: "Payment Failed",
      notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Air Ticket with transaction ID ${paymentDetails.transactionId} was Failed`,
      notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
      notificationCategory: "CORPORATE", // Replace with the relevant category
      notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
    };
    createNotification(notificationData);
    //return next(new ErrorResponse([updateDetails.message], 200))
    const walletDetails = await wallet.findOne({
      where: {
        credentialId,
      },
      attributes: ["balance"],
    });
    if (req.body.hasOwnProperty("paymentGatewayResponse")) {
      res.redirect(`${req.body.pageAddress}?status="failure"&transactionId=${corporateTxnId}`);
    } else {
      //let message = result?.data?.errorDetails?.message || 'Payment Failed'
      return res.status(400).json({
        status: false,
        message: "Payment Failed",
        responseCode: "001",
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
      });
    }
  } else {
    let result2;
    if (!isLcc) {
      //next book the flight anc
      const { totalAncillaryPrice, ancillaryDetails } = req.body;
      if (ancillaryDetails.length > 0) {
        let data = {
          data: {
            selectedAncillaries: ancillaryDetails,
            paymentDetails: {
              paymentMode: "CR",
              paymentMethod: "CR",
              transactionAmount: totalAncillaryPrice,
              cardInfo: "encripted.card.details.to.be.passed.here",
            },
          },
        };
        config = {
          method: "post",
          url: `${serviceDetails["API_URL"]}/api/v1/reservation/ancillary-book`,
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": serviceDetails.X_API_KEY,
            asyncFetchEnabled: true,
            conversationId: conversationId,
            sessionId: await getSession(serviceDetails, req?.LogTraceId),
          },
          data: data,
        };

        try {
          customLog(req?.LogTraceId, "info", {
            message: "[airline-legacy:ancillary-book] request",
            endpoint: "reservation/ancillary-book",
            conversationId,
          }, "VENDOR")
          result2 = await axios(config);
          customLog(req?.LogTraceId, "info", {
            message: "[airline-legacy:ancillary-book] response",
            endpoint: "reservation/ancillary-book",
            statusCode: result2?.status,
            conversationId,
            hasData: Boolean(result2?.data),
          }, "VENDOR")
        } catch (error) {
          customLog(req?.LogTraceId, "error", {
            message: "[airline-legacy:ancillary-book] error",
            endpoint: "reservation/ancillary-book",
            conversationId,
            errorMessage: error?.message,
            statusCode: error?.response?.status,
            errorCode: error?.code,
            vendorErrorMessage: error?.response?.data?.errorDetails?.message,
          }, "VENDOR")
        }

        // Initial call
        result2 = await recursiveFetch(result2, serviceDetails, config);
      }
    }

    //here need to send the ticket to user email
    const ticketData = {
      name: req.user.name,
      email: req.body.customerInfo.emailAddress,
      url: `${req.protocol}://${req.get("host")}`,
      orderId: transactionResponse.orderId,
      surcharge: surcharge
    };

    generateAttachmentAndSendEmailAndNotification(ticketData, (err, pdfFile) => {
      if (req.body.hasOwnProperty("paymentGatewayResponse")) {
        res.redirect(`${req.body.pageAddress}?status="success"&transactionId=${corporateTxnId}`);
      } else {
        return res.status(200).json({
          status: true,
          message: "Payment Successful",
          responseCode: "000",
          data: {
            ...result.data,
            ...transactionResponse,
            anc: result2?.data,
            corporateTxnId
          },
        });
      }
    });
  }
});

function isWithin30Minutes(givenTransactionDate) {
  //givenTransactionDate = '2023-12-08T09:02:57.000Z' //TESTING
  const transactionDate = new Date(givenTransactionDate);
  const currentTime = new Date();
  const timeDifference = currentTime - transactionDate;
  const thirtyMinutesInMilliseconds = 30 * 60 * 1000;
  return timeDifference <= thirtyMinutesInMilliseconds;
}

exports.updateBookingStatus = asyncHandler(async (req, res, next) => {
  let updateDetails;
  let serviceDetails = await checkService(req);
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse(serviceDetails.error, 400));
  }
  let bookingId = req.query.bookingId;
  let bookingData = await findOneBooking(bookingId);
  let { corporateTxnId, transactionDate, paymentModeResponse, paymentMode } = bookingData;
  let paymentData;
  if (paymentModeResponse) {
    paymentData = JSON.parse(paymentModeResponse);
  }
  let orderResponse = JSON.parse(bookingData.orderResponse);
  if (!orderResponse) return next(new ErrorResponse(`Booking not found`, 404));
  console.log({ orderResponse });
  let timeStatus = isWithin30Minutes(transactionDate);

  let bookingReferenceId = orderResponse.data[0].bookingReferenceId;
  let conversationId = orderResponse.meta.conversationId;
  console.log({ bookingReferenceId, conversationId, corporateTxnId, transactionDate, timeStatus });
  let { status, booking } = await retrieveBooking({ serviceDetails, bookingReferenceId, conversationId, loggerTraceId: req?.LogTraceId });
  if (!status) {
    return next(new ErrorResponse(`Not able to retrieve booking`, 400));
  }
  // Check the booking status in the response
  const bookingStatus = booking?.bookingStatus;

  if (bookingStatus === "TICKETED") {
    successCase(booking);
  } else if (!timeStatus) {
    failureCase(req, booking);
  } else {
    return next(new ErrorResponse("Your booking is pending", 400));
  }

  async function failureCase(req, booking) {
    console.table({ msg: "Updating database with failure status..." });
    booking.data[0].bookingStatus = "BOOKING FAILD";
    updateDetails = {
      corporateTxnId: corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: "Booking faild",
      orderResponse: JSON.stringify(booking),
      registeredById: req.user.registeredBy,
    };
   
    if (paymentMode == "PAYMENT GATEWAY" || paymentMode == "PAYMENT GATEWAY + WALLET") {
      // let refundPGResponse = await cancelCardTransaction(req, paymentData)
      // if (refundPGResponse?.state == 'REVERSED' || refundPGResponse?.state == 'REFUNDED') {
      //     await refundWalletTransaction(updateDetails)
      // } else {
      //     await paymentGateWayRefundFailureEmail(req)
      // }
    }
    // else if (paymentMode == "BANK" || paymentMode == "BANK + WALLET") {
    //     let leanAmount = paymentData.leanAmount

    //     const { status, message } = await createLeanPayoutRequest(leanAmount, req.user.id, bookingId, updateDetails);
    //     if (!status) {
    //         await leanRefundFailureEmail(req, message)
    //     }
    //     /**
    //      * in true case the refundWalletTransaction is needed to be called after the lean authorization.
    //      * this called after the webhook from lean.
    //      */

    // }
    else {
      await refundWalletTransaction(updateDetails);
    }
    return res.status(200).json({
      status: true,
      message: "Booking faild and amount will be refunded",
      responseCode: "000",
      data: booking,
    });
  }

  async function successCase(booking) {
    console.table({ msg: "Updating database with success status..." });
    updateDetails = {
      corporateTxnId: corporateTxnId,
      providerId: "Not Available",
      status: "SUCCESS",
      orderResponse: JSON.stringify(booking),
      message: "Payment Successful",
    };
    await updateWalletTransaction(updateDetails);
    return res.status(200).json({
      status: true,
      message: "Booking successfully completed",
      responseCode: "000",
      data: booking,
    });
  }
});

async function recursiveFetch(result, serviceDetails, config) {
  
  if (result.data.meta.success && (result.data.meta.statusCode === 2 || result.data.meta.statusCode === 3)) {
    if (result.data.asyncFetch) {
      const apiUrl = `${serviceDetails["API_URL"]}${result.data.asyncFetch.fetchUrl}`;
      result = await fetchData(apiUrl, config.headers);
    
      // Recursively call the function with the new result
      result = await recursiveFetch(result, serviceDetails, config);
    }
  }
 
  return result;
}

async function fetchData(url, headers) {
  // const response = await axios.get(url,headers);
  // Return the response data
  const response = await axios.get(url, {
    headers: {
      "X-API-KEY": headers["X-API-KEY"],
      conversationId: headers["conversationId"],
      sessionId: headers["sessionId"],
      "Content-Type": "application/json",
    },
  });
  return response;
}

async function generateAttachmentAndSendEmailAndNotification(data, callback) {
  try {
    const ticketData = await createDataForFlightTicket(data.orderId, data.url)
    console.log("🚀 ~ generateAttachmentAndSendEmailAndNotification ~ ticketData:", ticketData)
    let to = data.email;
    let user = data.name;
    let surcharge = parseFloat(data.surcharge)
    let templateDetails;
    templateDetails = await fetchPartnerDetails(data?.registeredBy)
    let id = ticketData.bookingReferenceId;
    const html = airLineTicketTemplate({ ...ticketData, ...data }, templateDetails);
    fs.writeFile(`${id}.html`, html, async (err) => {
      if (err) {
        console.error(err);
        callback(err, null);
      } else {
      
        const inputFile = `${id}.html`;
        const outputFile = `${id}.pdf`;

        const pdfOptions = {
          output: outputFile,
          pageSize: 'A4'
        };

        wkhtmltopdf(html, pdfOptions, async (pdfErr) => {
          if (pdfErr) {
            console.error(`Error generating PDF: ${pdfErr}`);
            callback(pdfErr, null);
          } else {
            console.log(`PDF file written to ${outputFile}`);
            const subject = "Payment Successful";
            const body = generateAirlineTicketAndSendToMail({ user });

            // Call email function to send email with payment details in the body
            emailer.emailWithAttachment(to, subject, body, outputFile, outputFile, async (emailErr) => {
              if (emailErr) {
                console.error(`Error sending email: ${emailErr}`);
                callback(emailErr, null);
              } else {
                customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
                const filesToDelete = [inputFile, outputFile];
                filesToDelete.forEach((file) => {
                  fs.unlink(file, (unlinkErr) => {
                    if (unlinkErr) {
                      console.error(`Error deleting file ${file}: ${unlinkErr}`);
                    } else {
                      console.log(`File ${file} deleted`);
                    }
                  });
                });
                callback(null, true);
              }
            });
          }
        });
      }
    });
  } catch (err) {
    console.error(`Error in generateAttachmentAndSendEmailAndNotification: ${err}`);
    callback(err, null);
  }
}

exports.ancSearch = asyncHandler(async (req, res, next) => {
  let serviceDetails = await checkService(req);
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse(serviceDetails.error, 400));
  }
  // let conversationId = uuidv4()
  let conversationId = req.body.conversationId;

  let data = {
    offerId: req.body.offerId,
    seatMapRequested: true,
    otherAncillaryRequested: true,
    formOfPayment: "CR",
    travelType: "P",
  };

  if (!req.body.isLcc) {
    data.supplierLocator = req.body.supplierLocator;
  }
  // console.table(data);
  let config = {
    method: "post",
    url: `${serviceDetails["API_URL"]}/api/v1/reservation/ancillary-search`,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": serviceDetails.X_API_KEY,
      conversationId: conversationId,
      sessionId: await getSession(serviceDetails, req?.LogTraceId),
    },
    data: data,
  };
  let response;
  try {
    customLog(req?.LogTraceId, "info", {
      message: "[airline-legacy:ancillary-search] request",
      endpoint: "reservation/ancillary-search",
      conversationId,
    }, "VENDOR")
    response = await axios(config);
    customLog(req?.LogTraceId, "info", {
      message: "[airline-legacy:ancillary-search] response",
      endpoint: "reservation/ancillary-search",
      statusCode: response?.status,
      conversationId,
      hasData: Boolean(response?.data),
    }, "VENDOR")
    if (!response) {
      return next(new ErrorResponse(`No Results found`, 404));
    } else {
      return res.status(200).json({
        status: true,
        message: "Ancillaries fetched successfully",
        responseCode: "000",
        data: {
          conversationId,
          ...response.data,
        },
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "[airline-legacy:ancillary-search] error",
      endpoint: "reservation/ancillary-search",
      conversationId,
      errorMessage: error?.message,
      statusCode: error?.response?.status,
      errorCode: error?.code,
      vendorErrorMessage: error?.response?.data?.errorDetails?.message,
    }, "VENDOR")
    let errorData = error?.response?.data;
    if (errorData && errorData.errorDetails) {
      return next(new ErrorResponse(errorData?.errorDetails?.message || "Ancillaries search faild", 400));
    } else {
      return next(new ErrorResponse(error?.message || "Ancillaries search faild", 500));
    }
  }
});

exports.ancProBook = asyncHandler(async (req, res, next) => {
  let serviceDetails = await checkService(req);
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse(serviceDetails.error, 400));
  }
  let conversationId = req.body.conversationId;
  let data = {
    data: {
      selectedAncillaries: req.body.selectedAncillaries,
      ...(req.body.isLcc ? { offerId: req.body.offerId } : {}), // Add offerId only if isLcc is true
    },
  };
  let config = {
    method: "post",
    url: `${serviceDetails["API_URL"]}/api/v1/reservation/ancillary-prov-book`,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": serviceDetails.X_API_KEY,
      asyncFetchEnabled: true,
      conversationId: conversationId,
      sessionId: await getSession(serviceDetails, req?.LogTraceId),
    },
    data: data,
  };

  try {
    customLog(req?.LogTraceId, "info", {
      message: "[airline-legacy:ancillary-prov-book] request",
      endpoint: "reservation/ancillary-prov-book",
      conversationId,
    }, "VENDOR")
    let result = await axios(config);
    customLog(req?.LogTraceId, "info", {
      message: "[airline-legacy:ancillary-prov-book] response",
      endpoint: "reservation/ancillary-prov-book",
      statusCode: result?.status,
      conversationId,
      hasData: Boolean(result?.data),
    }, "VENDOR")
    if (!result) {
      return next(new ErrorResponse(`No Results found`, 404));
    } else {
      result = await recursiveFetch(result, serviceDetails, config);
      return res.status(200).json({
        status: true,
        message: "Ancillaries pro-book successful",
        responseCode: "000",
        data: {
          conversationId,
          ...result.data,
        },
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "[airline-legacy:ancillary-prov-book] error",
      endpoint: "reservation/ancillary-prov-book",
      conversationId,
      errorMessage: error?.message,
      statusCode: error?.response?.status,
      errorCode: error?.code,
      vendorErrorMessage: error?.response?.data?.errorDetails?.message,
    }, "VENDOR")
    if (error.response) {
      return next(new ErrorResponse(error.response?.data?.errorDetails?.message || "Ancillary pro-book faild", 400));
    } else {
      return next(new ErrorResponse(error.message || "Ancillary pro-book faild", 500));
    }
  }
});

exports.listAllBookings = asyncHandler(async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const availability = req.query.availability;
    const credentialId = req.user.id;

    // const corporateUserId = req.user.corporateId;
    // const { serviceOperatorId } = await fetchServiceDetails({
    //   credentialId,
    //   accessKey,
    //   packageId: req.user.packageId,
    //   corporateUserId,
    // });
    const bookingData = await fetchAllFlightBookings({ credentialId, limit, page, availability });
    if (!bookingData) {
      return next(new ErrorResponse("No bookings found", 404));
    }
    // Return a standard success response
    return res.status(200).json({
      status: true,
      message: "Bookings fetched successfully",
      responseCode: "000",
      data: {
        page: page,
        limit: limit,
        count: bookingData.count,
        bookings: bookingData.rows,
      },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return next(new ErrorResponse("Something went wrong", 400));
  }
});

exports.cancellationCharges = asyncHandler(async (req, res, next) => {
  let { bookingReferenceId, conversationId } = req.body;
  let serviceDetails = await checkService(req);
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse(serviceDetails.error, 400));
  }

  //retrieve booking and check status
  let { status, booking, message } = await retrieveBooking({ serviceDetails, bookingReferenceId, conversationId, loggerTraceId: req?.LogTraceId });
  if (!status) {
    return next(new ErrorResponse(message, 400));
  }
  let { bookingStatus, supplierLocator, issueDate } = booking;
  if (bookingStatus == "REQUEST REFUND") {
    return next(new ErrorResponse("Already cancelled and requested for refund", 400)); //need to change
  }
  if (bookingStatus !== "TICKETED") {
    return next(new ErrorResponse("Unable to cancel this ticket", 400)); //need to change
  }

  let data = JSON.stringify({
    bookingReferenceId: bookingReferenceId,
    supplierLocator: req.body.supplierLocator,
  });
  let config = {
    method: "post",
    url: `${serviceDetails["API_URL"]}/api/v1/reservation/flight-cancellation-charge`,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": serviceDetails.X_API_KEY,
      conversationId: conversationId,
      sessionId: await getSession(serviceDetails, req?.LogTraceId),
    },
    data: data,
  };
  customLog(req?.LogTraceId, "info", {
    message: "[airline-legacy:flight-cancellation-charge] request",
    endpoint: "reservation/flight-cancellation-charge",
    bookingReferenceId,
    conversationId,
  }, "VENDOR")
  axios(config)
    .then(function (response) {
      customLog(req?.LogTraceId, "info", {
        message: "[airline-legacy:flight-cancellation-charge] response",
        endpoint: "reservation/flight-cancellation-charge",
        statusCode: response?.status,
        bookingReferenceId,
        conversationId,
        hasData: Boolean(response?.data),
      }, "VENDOR")
      return res.status(200).json({
        status: true,
        message: "Cancellation charges fetched successfully",
        responseCode: "000",
        data: {
          conversationId,
          ...response.data,
        },
      });
    })
    .catch(function (error) {
      customLog(req?.LogTraceId, "error", {
        message: "[airline-legacy:flight-cancellation-charge] error",
        endpoint: "reservation/flight-cancellation-charge",
        bookingReferenceId,
        conversationId,
        errorMessage: error?.message,
        statusCode: error?.response?.status,
        errorCode: error?.code,
        vendorErrorMessage: error?.response?.data?.errorDetails?.message,
      }, "VENDOR")
      let errorData = error?.response?.data;
      return next(new ErrorResponse(errorData?.errorDetails?.message || "Error while fetching charges", 400));
    });
});

async function retrieveBooking(params) {
  const loggerTraceId = params?.loggerTraceId ?? null;
  try {
    let { serviceDetails, bookingReferenceId, conversationId } = params;
    let data = JSON.stringify({
      bookingReferenceId: bookingReferenceId,
    });
    let config = {
      method: "post",
      url: `${serviceDetails["API_URL"]}/api/v1/reservation/flight-book-retrieve`,
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": serviceDetails.X_API_KEY,
        conversationId: conversationId,
        sessionId: await getSession(serviceDetails, loggerTraceId),
      },
      data: data,
    };
    customLog(loggerTraceId, "info", {
      message: "[airline-legacy:flight-book-retrieve] request",
      endpoint: "reservation/flight-book-retrieve",
      bookingReferenceId,
      conversationId,
    }, "VENDOR")
    let result = await axios(config);
    customLog(loggerTraceId, "info", {
      message: "[airline-legacy:flight-book-retrieve] response",
      endpoint: "reservation/flight-book-retrieve",
      statusCode: result?.status,
      bookingReferenceId,
      conversationId,
      bookingStatus: result?.data?.data?.[0]?.bookingStatus,
    }, "VENDOR")
    if (!result && !result?.data) throw new Error("Failed to retrieve booking data!");
    ///we are extracting some more data form data here
    let { bookingStatus, supplierLocator, ticketDocument } = result.data.data[0];
    let issueDate = new Date(ticketDocument[0].dateOfIssue);
    if (!isNaN(issueDate.getTime())) {
      let formattedDate =
        ("0" + issueDate.getDate()).slice(-2) + "/" + ("0" + (issueDate.getMonth() + 1)).slice(-2) + "/" + issueDate.getFullYear();
      issueDate = formattedDate;
    } else {
      throw new Error("Invalid issueDate format. Please check the issueDate and other parameters.");
    }
    return {
      status: true,
      message: "Success",
      booking: {
        ...result.data,
        bookingStatus,
        supplierLocator,
        issueDate,
      },
    };
  } catch (error) {
    customLog(loggerTraceId, "error", {
      message: "[airline-legacy:flight-book-retrieve] error",
      endpoint: "reservation/flight-book-retrieve",
      bookingReferenceId: params?.bookingReferenceId,
      conversationId: params?.conversationId,
      errorMessage: error?.message,
      statusCode: error?.response?.status,
      errorCode: error?.code,
      vendorErrorMessage: error?.response?.data?.errorDetails?.message,
    }, "VENDOR")
    let errorData = error?.response?.data;
    return {
      status: false,
      message: errorData?.errorDetails?.message || "Something went wrong while retrieve booking!",
    };
  }
}

exports.cancelBooking = asyncHandler(async (req, res, next) => {
  let corporateTxnId = req.body.selectedCorporateTxnId;
  let { bookingReferenceId, conversationId } = req.body;
  let templateDetails;
  templateDetails = await fetchPartnerDetails(req.user.registeredBy)
  const transaction = await findOneTransaction({ corporateTxnId });
  if (!transaction) {
    return next(new ErrorResponse("No transactions found!", 404));
  } // transaction is for refund purpose
  let serviceDetails = await checkService(req);
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse(serviceDetails.error, 400));
  }
  let { status, booking, message } = await retrieveBooking({ serviceDetails, bookingReferenceId, conversationId, loggerTraceId: req?.LogTraceId });
  if (!status) {
    return next(new ErrorResponse(message, 400));
  }
  let { bookingStatus, supplierLocator, issueDate } = booking;
  if (bookingStatus == "REQUEST REFUND") {
    return next(new ErrorResponse("Already cancelled and requested for refund", 400)); //need to change
  }
  if (bookingStatus !== "TICKETED") {
    return next(new ErrorResponse("Unable to cancel this ticket", 400)); //need to change
  }

  let data = JSON.stringify({
    bookingReferenceId: req.body.bookingReferenceId,
    supplierLocator: supplierLocator,
    issueDate: issueDate,
    cancelAllPassengers: true,
    voidOnly: false,
  });
  let config = {
    method: "post",
    url: `${serviceDetails["API_URL"]}/api/v1/reservation/flight-cancel`,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": serviceDetails.X_API_KEY,
      conversationId: conversationId,
      sessionId: await getSession(serviceDetails, req?.LogTraceId),
    },
    data: data,
  };

  customLog(req?.LogTraceId, "info", {
    message: "[airline-legacy:flight-cancel] request",
    endpoint: "reservation/flight-cancel",
    bookingReferenceId,
    conversationId,
    corporateTxnId,
  }, "VENDOR")
  axios(config)
    .then(async function (response) {
      customLog(req?.LogTraceId, "info", {
        message: "[airline-legacy:flight-cancel] response",
        endpoint: "reservation/flight-cancel",
        statusCode: response?.status,
        bookingReferenceId,
        conversationId,
        corporateTxnId,
        hasData: Boolean(response?.data),
      }, "VENDOR")
      let { status, booking } = await retrieveBooking({ serviceDetails, bookingReferenceId, conversationId, loggerTraceId: req?.LogTraceId });
      if (status) {
        const bookingStatus = booking.bookingStatus;
        await updateBookingStatus(corporateTxnId, bookingStatus);
      }

      return res.status(200).json({
        status: true,
        message: "Ticket cancelled successfully",
        responseCode: "000",
        data: {
          conversationId,
          ...response.data,
        },
      });
    })
    .catch(function (error) {
      customLog(req?.LogTraceId, "error", {
        message: "[airline-legacy:flight-cancel] error",
        endpoint: "reservation/flight-cancel",
        bookingReferenceId,
        conversationId,
        corporateTxnId,
        errorMessage: error?.message,
        statusCode: error?.response?.status,
        errorCode: error?.code,
        vendorErrorMessage: error?.response?.data?.errorDetails?.message,
      }, "VENDOR")
      let errorData = error?.response?.data;
      return next(new ErrorResponse(errorData?.errorDetails?.message || "Ticket cancellation faild", 400));
    });
});

exports.downloadBookingTicket = asyncHandler(async (req, res, next) => {
  try {
    let serviceDetails = await checkService(req)
    const token = await getSession(serviceDetails, req?.LogTraceId)

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 400))
    }

    const protocol = req.protocol;  // "http" or "https"
    const host = req.get('host');  // Hostname and port (e.g., "example.com:3000")
    let url = `${protocol}://${host}`
    const orderId = req.query.orderId
    const data = await createDataForFlightTicket(orderId, url)
    const payload = {
      EndUserIp,
      TokenId,
      TraceId,
      FirstName: leadPax.FirstName, 
      LastName: leadPax.LastName
    }
    let config = {
      method: 'post',
      url: `${serviceDetails.vendor.optional5}/rest/GetBookingDetails`,
      headers: {
          'Content-Type': 'application/json',
          // 'X-API-KEY': serviceDetails.X_API_KEY,
          // 'conversationId': conversationId,
          // 'sessionId': await getSession({ serviceDetails, userId: req?.user?.id })
      },
      data: payload
    };
    
    let result;
    try {
      customLog(req?.LogTraceId, "info", {
        message: "[airline-legacy:GetBookingDetails] request",
        endpoint: "GetBookingDetails",
      }, "VENDOR")
      result = await axios(config);
      customLog(req?.LogTraceId, "info", {
        message: "[airline-legacy:GetBookingDetails] response",
        endpoint: "GetBookingDetails",
        statusCode: result?.status,
        bookingId: result?.data?.Response?.FlightItinerary?.BookingId,
        pnr: result?.data?.Response?.FlightItinerary?.PNR,
        status: result?.data?.Response?.FlightItinerary?.Status,
        vendorErrorCode: result?.data?.Response?.Error?.ErrorCode,
        vendorErrorMessage: result?.data?.Response?.Error?.ErrorMessage,
      }, "VENDOR")
      if(!result || result.data.Response?.Error?.ErrorCode !== 0) {
        throw new Error()
      }
    } catch (error) {
      customLog(req?.LogTraceId, "error", {
        message: "[airline-legacy:GetBookingDetails] error",
        endpoint: "GetBookingDetails",
        errorMessage: error?.message,
        statusCode: error?.response?.status,
        errorCode: error?.code,
        vendorErrorCode: error?.response?.data?.Response?.Error?.ErrorCode,
        vendorErrorMessage: error?.response?.data?.Response?.Error?.ErrorMessage,
      }, "VENDOR")
      throw new Error("Unable to fetch ticket details")
    }

    data.username = req?.user?.username
    generatePdf(data, (err, pdfFile) => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse("Error generating PDF", 500))
      } else {
        return res.status(200).json({
          status: true,
          message: 'Ticket fetched successfully',
          responseCode: '000',
          data: { pdfFile: pdfFile }
        })
      }
    });
    
  } catch (error) {
    next(new ErrorResponse("Something went wrong while generating ticket", 500))
  }
})

async function createDataForFlightTicket(orderId, url) {
  try {
    const order = await findOneOrderById(orderId);

    let orderResponse = JSON.parse(order.orderResponse);
    const { BookingId } = orderResponse.Response.Response
    const { Passenger, status, Fare } = orderResponse.Response?.Response?.FlightItinerary || {}
    if(!Passenger) {
      throw new Error("Passenger details not found")
    }
    const ticketData = {
      flightDetails: "",
      passengers: Passenger,
      ticketDocument: "",
      fare: Fare,
      bookingReferenceId: BookingId,
      bookingStatus: status === 1 ? "Success" : "Failed",
    };
    // console.log(forTicketFlightDetail(journey, url), "###############");
    return ticketData;
  } catch (error) {
    console.log("Error", error)
    throw error;
  }
}

async function generatePdf(data, callback) {
  try {

    let to = data.email;
    let id = data.bookingReferenceId;
    let surcharge = parseFloat(data.surcharge)
    const html = airLineTicketTemplate({ ...data }, surcharge);

    fs.writeFile(`${id}.html`, html, async (err) => {
      if (err) {
        console.error(err);
        callback(err, null);
      } else {
        console.log('HTML File saved!');
        const inputFile = `${id}.html`;
        const outputFile = `${id}.pdf`;

        const pdfOptions = {
          pageSize: 'A4',
          output: outputFile,
          noStopSlowScripts: true // This option might not exist in wkhtmltopdf; adjust as needed
        };
        wkhtmltopdf(fs.createReadStream(inputFile), pdfOptions, async (pdfErr) => {
          if (pdfErr) {
            console.error(`Error generating PDF: ${pdfErr}`);
            callback(pdfErr, null);
          } else {
            console.log(`PDF file written to ${outputFile}`);
            // Read the PDF data
            fs.readFile(outputFile, async (readErr, pdfData) => {
              if (readErr) {
                console.error(`Error reading file ${outputFile}: ${readErr}`);
                // Delete the files
                const filesToDelete = [inputFile, outputFile];
                filesToDelete.forEach((file) => {
                  fs.unlink(file, (unlinkErr) => {
                    if (unlinkErr) {
                      console.error(`Error deleting file ${file}: ${unlinkErr}`);
                    } else {
                      console.log(`File ${file} deleted`);
                    }
                  });
                });
                callback(readErr, null);
              } else {
                // Delete the files
                const filesToDelete = [inputFile, outputFile];
                filesToDelete.forEach((file) => {
                  fs.unlink(file, (unlinkErr) => {
                    if (unlinkErr) {
                      console.error(`Error deleting file ${file}: ${unlinkErr}`);
                    } else {
                      console.log(`File ${file} deleted`);
                    }
                  });
                });
                callback(null, pdfData);
              }
            });
          }
        });
      }
    });
  } catch (err) {
    console.error(`Error in generatePdf: ${err}`);
    callback(err, null);
  }
}

function forTicketFlightDetail(segments, url) {
  try {
    let resultFlightScreen = "";
    resultFlightScreen += segments
      .map((data) => {
        const segmentDetails = [];
        let startDate;
        const flightDetailsHTML = data.flightSegments
          .map((item, index) => {
            if (index == 0) startDate = moment(item.departureDateTime).format("ddd MMM D YYYY");

            segmentDetails.push(item);
            const airlineLogonew = `${url}/assets/images/airline/AirlineLogo/${item.operatingAirline}.gif`;
            const operatingAirlineName = item.operatingAirline;
            const airlineName = retrieveAirlineName(item.operatingAirline);
            const flightNumber = item.flightNumber;
            const departureTime = moment(item.departureDateTime).format("LT");
            const departureDate = moment(item.departureDateTime).format("ddd MMM D YYYY");

            const departureCity = retrieveAirport(item.departureAirportCode);
            const departureAirportCode = item.departureAirportCode;
            const departureCountry = retrieveCountryName(item.departureAirportCode);
            const departureTerminal = item.departureTerminal ? `Terminal ${item.departureTerminal}` : ``;
            const arrivalTime = moment(item.arrivalDateTime).format("LT");
            const arrivalDate = moment(item.arrivalDateTime).format("ddd MMM D YYYY");

            const arrivalCity = retrieveAirport(item.arrivalAirportCode);
            const arrivalAirportCode = item.arrivalAirportCode;
            const arrivalCountry = retrieveCountryName(item.arrivalAirportCode);
            const arrivalTerminal = item.arrivalTerminal ? `Terminal ${item.arrivalTerminal}` : ``;
            let includedBaggage;
            try {
              includedBaggage = item.baggageAllowance.checkedInBaggage[0]["value"] + item.baggageAllowance.checkedInBaggage[0]["unit"]; //item.IncludedBaggage;
            } catch (error) {
              //for lcc flights item.baggageAllowance is not availabe
              includedBaggage = "N/A";
            }
            let cabinBaggage;
            try {
              cabinBaggage = item.baggageAllowance.carryOnBaggage[0]["value"] + " " + item.baggageAllowance.carryOnBaggage[0]["unit"]; //item.CabinBaggage;
            } catch (error) {
              cabinBaggage = "N/A";
            }

            const descriptionCH = item?.baggageAllowance?.checkedInBaggage?.[0]?.["description"] ?? "No description available";
            const descriptionCR = item?.baggageAllowance?.carryOnBaggage?.[0]?.["description"] ?? "No description available";

            const duration = convertStringToTime(item.duration);

            let layOver = ``;
            let max = data.flightSegments.length - 1;
            if (index != max) {
              const nextItem = data.flightSegments[index + 1];

              const at = new Date(item.arrivalDateTime);
              const dt = new Date(nextItem.departureDateTime);
              const timeDifferenceInMilliseconds = dt - at;
              const hours = Math.floor(timeDifferenceInMilliseconds / (1000 * 60 * 60));
              const minutes = Math.round((timeDifferenceInMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
              layOver = `<p class="line my-4 text-secondary"><span class="layover">Layover: ${hours}h ${minutes}min</span></p>`;
            }

            return `
                 <div>
              <div class="row mt-2 mb-4 ">
                <div class="col-2 d-flex justify-content-center align-items-center mt-1">
                  <img src="${airlineLogonew}" class="mb-1" height="80px" 
                  onerror="this.onerror=null; this.src='https://png.pngitem.com/pimgs/s/239-2396212_transparent-extra-credit-clipart-airplane-logo-black-and.png';">
                </div>
    
                <div class="col-3 mt-1 text-start">
                  <span class="text-secondary ">${operatingAirlineName}-${flightNumber} Aircraft: ${operatingAirlineName}</span> <br>
                  <span class="fs-4 fw-semibold">${airlineName} Economy</span><br>
    
                </div>
                <div class="col-3 mt-1 text-start">
                  <div class="fs-4 text-secondary fw-light"> ${departureDate}</div>
                  <div class="fs-3 fw-bolder">${departureAirportCode} ${departureTime}</div>
                  <div class="fw-light">${departureCountry} ${departureCity} ${departureTerminal}</div>
                </div>
                <div class="col-1 mt-1 text-center d-flex align-items-center justify-content-center flex-column">
                  <i class="bi bi-airplane"></i>
                  <span class="text-secondary">${duration}</span>
                </div>
    
                <div class="col-3 mt-1 text-end align-content-end">
                  <div class="fs-4 text-secondary fw-light">${arrivalDate} </div>
                  <div class="fs-3 fw-bolder">${arrivalAirportCode} ${arrivalTime}</div>
                  <div class="fw-light">${arrivalCountry} ${arrivalCity} ${arrivalTerminal}</div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-4 text-left"> <span class="text-secondary fw-light ">Baggage (per Adult/Child)
                  </span>
                  Check-in: ${includedBaggage} , Cabin:${cabinBaggage}
                  
                  </div>
                 <div class="col-md-4 text-center d-none" style="color: #039800;">Free Meal</div>
                <div class="col-md-4 text-center"></div>
              </div>
            </div>${layOver}`;
          })
          .join("");
        const originCity = retrieveAirport(data.flight.segmentReference.onPoint);
        const destinationCity = retrieveAirport(data.flight.segmentReference.offPoint);

        const segmentHTML = `
             <div>
              <hr class="dashed-2">
              <div>
                <span class="fs-4 fw-semibold"> ${originCity}</span> - <span class="fs-4 fw-semibold">${destinationCity}</span>
                <span class="fs-6 ps-4">
                  <i class="bi bi-calendar"></i> ${startDate}</span>
              </div>
              <hr class="dashed-2">
            </div>${flightDetailsHTML}`;

        return segmentHTML;
      })
      .join("");

    return resultFlightScreen;
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return "";
  }
}

//this function is used to convert timeString to exact hours and minutes
function convertStringToTime(str) {
  // Extract the hour and minute values from the string using regular expressions
  if (!str) {
    return "00 h 00 m";
  }
  try {
    const hour = str.match(/\d+H/)[0].replace("H", "");
    const minute = str.match(/\d+M/)[0].replace("M", "");

    // Convert the hour and minute values to zero-padded strings
    const paddedHour = hour.padStart(2, "0");
    const paddedMinute = minute.padStart(2, "0");

    // Create the formatted time string
    const timeString = `${paddedHour} h ${paddedMinute} m`;

    return timeString;
  } catch (error) {
    return "00 h 00 m";
  }
}

exports.fetchData = asyncHandler(async (req, res) => {
  const { code, type } = req.query;
  let result;
  switch (type) {
    case "country":
      result = retrieveCountryName(code);
      break;
    case "airline":
      result = retrieveAirlineName(code);
      break;
    case "airport":
      result = retrieveAirport(code);
      break;
    default:
      result = "Invalid type";
  }
  return res.status(200).json({
    status: true,
    data: {
      result,
    },
    message: "Data fetched successfully",
    responseCode: "000",
  });
});
