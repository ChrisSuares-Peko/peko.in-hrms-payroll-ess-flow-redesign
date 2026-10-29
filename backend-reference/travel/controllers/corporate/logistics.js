/* eslint-disable no-undef */
/* eslint-disable no-prototype-builtins */

const axios = require("axios");
const asyncHandler = require("../../middlewares/async");
const { fetchServiceDetails } = require("../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../../utils/error-response");
const { createWalletTransaction, refundWalletTransaction, updateWalletTransaction } = require("../../utils/walletTransaction");
const operatorsData = require("../../utils/operatorsData.json");
let accessKey = operatorsData["logistics"]["accessKey"];
let transactionCategory = operatorsData["logistics"]["category"];

const { findOrderById, findOneOrderByProviderId, findOneByProviderId, updateOrder } = require("../../models/use-cases/order");
const { refundGatewayTransaction } = require("./pluralGateway");
const { createAddress } = require("../../models/use-cases/addressDetails");
const IndianStates = require("../../utils/states");
const { createNotification } = require("../../models/use-cases/notification");
const wallet = require("../../models/entities/wallet");
const emailer = require("../../utils/emailer");
const { generatePaymentSuccessEmailLogistics } = require("../../utils/emailTemplates/logistics");
const { createPGTransaction } = require("../../utils/pamentGatewayTransaction");
const { commonFailedTemplate } = require("../../utils/emailTemplates/common");
const { customLog } = require('../../utils/loggerHelper')

exports.createMerchant = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const data = req.body;
    const corporateUserId = req.user.corporateId
    const saveSenderAddress = data.saveSenderAddress;
    delete data.saveSenderAddress;
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    })
    const API_URL = serviceDetails.vendor.apiUrl;
    const token = serviceDetails.vendor.optional1;

    if (serviceDetails.hasOwnProperty("error")) {
      return next(new ErrorResponse("Something went wrong", 500));
    }

    let formData = new URLSearchParams();
    for (let key in data) {
      formData.append(key, data[key]);
    }

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${API_URL}merchant/v1/merchantApi/createProfile`,
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: formData.toString(),
    };

    axios
      .request(config)
      .then(async (response) => {
        const result = response.data;
        if (result.responseCode === "000") {
          const {
            profileId,
            profileName,
            merchantState,
            merchantCountry,
            merchantEmail,
            merchantMobileNo,
            merchantRemarks,
            merchantAddress,
            merchantCity,
            merchantPinCode,
          } = result.responseData;
          const address = {
            nickname: profileId,
            name: profileName,
            city: merchantCity,
            country: merchantCountry,
            state: merchantState,
            addressLine1: merchantAddress,
            email: merchantEmail,
            phoneNumber: merchantMobileNo,
            zipCode: merchantPinCode,
            remarks: merchantRemarks,
            credentialId: req.user.id,
          };
          if (saveSenderAddress) {
            await createAddress(address);
          }

          res.status(200).json({
            status: true,
            data: { data: address },
            message: "Merchant created successfully",
            responseCode: "000",
          });
        } else {
          return next(new ErrorResponse("Merchant creation failed", 400));
        }
      })
      .catch((error) => {
        
        customLog(req?.LogTraceId, "error", { message: '🚀 ~ exports.createMerchant=asyncHandler ~ error:', error });
        return res.send({
          status: false,
          data: {},
          message: "Merchant creation failed",
          responseCode: "001",
        });
      });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: '🚀 ~ exports.createMerchant=asyncHandler ~ error:', error });
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.checkPincode = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    })
    const API_URL = serviceDetails.vendor.apiUrl;
    const token = serviceDetails.vendor.optional1;
    const merchantUsername = serviceDetails.vendor.optional2;

    if (serviceDetails.hasOwnProperty("error")) {
      return next(new ErrorResponse("Something went wrong", 500));
    }

    const data = req.body;
    data.merchant = merchantUsername;
    let formData = new URLSearchParams();

    for (let key in data) {
      formData.append(key, data[key]);
    }

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${API_URL}merchant/v1/merchantApi/checkpincode`,
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: formData.toString(),
    };

    axios
      .request(config)
      .then((response) => {
        const result = response.data;
        if (result.responseCode === "000") {
          res.send({
            status: true,
            data: { data: result.data, type: result.type, percentage: result.percentage, city: result.city },
            message: "Pincode checked successfully",
            responseCode: "000",
          });
        } else {
          return next(new ErrorResponse("Something went wrong", 500));
        }
      })
      .catch((error) => {
        customLog(req?.LogTraceId, "error", { message: '🚀 ~ exports.checkPincode=asyncHandler ~ error:', error });
        return next(new ErrorResponse("Something went wrong", 500));
      });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: '🚀 ~ exports.checkPincode=asyncHandler ~ error:', error });
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.calculateRate = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId
    const data = req.body;
    data.paymentMode = "PREPAID";
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId
    });
    const API_URL = serviceDetails.vendor.apiUrl;
    const token = serviceDetails.vendor.optional1;

    if (serviceDetails.hasOwnProperty("error")) {
      return next(new ErrorResponse("Something went wrong", 500));
    }
    let formData = new URLSearchParams();

    for (let key in data) {
      formData.append(key, data[key]);
    }

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${API_URL}rate/calculate`,
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: formData.toString(),
    };

    axios
      .request(config)
      .then((response) => {
        const result = response.data;
        if (result.responseCode === "000") {
          res.status(200).json({
            status: true,
            data: { charges: result.charges, city: result.city },
            message: "Rate calculation successfull",
            responseCode: "000",
          });
        } else {
          return next(new ErrorResponse("Rate calculation failed", 400));
        }
      })
      .catch((error) => {
      
        customLog(req?.LogTraceId, "error", { message: '🚀 ~ exports.calculateRate=asyncHandler ~ error:', error});
        return next(new ErrorResponse("Rate calculation failed", 500));
      });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: '🚀 ~ exports.calculateRate=asyncHandler ~ error:', error});
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.updateOrder = asyncHandler(async (req, res, next) => {
  try {
    const type = req.body.updateType;
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId
    });
    const API_URL = serviceDetails.vendor.apiUrl;
    const token = serviceDetails.vendor.optional1;

    if (serviceDetails.hasOwnProperty("error")) {
      return next(new ErrorResponse("Something went wrong", 500));
    }
    const fetchedOrder = await findOrderById({ credentialId, orderId: req.params.orderId });
    const orderId = fetchedOrder.providerId; // take it from db
    let formData = new URLSearchParams();
    formData.append("orderId", orderId);
    let updateType;
    if (type === "CANCEL") {
      updateType = `cancelOrder`;
    } else if (type === "RETURN") {
      updateType = `rtoOrder`;
    }

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${API_URL}merchant/v1/merchantApi/${updateType}`,
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: formData.toString(),
    };

    axios
      .request(config)
      .then((response) => {
        const result = response.data;
        if (result?.responseCode === "000") {
          res.send({
            status: true,
            data: { result },
            message: `Order ${type} successfully`,
            responseCode: "000",
          });
        } else {
          return next(new ErrorResponse("Something went wrong", 400));
        }
      })
      .catch((error) => {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse("Something went wrong", 500));
      });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.fetchStates = asyncHandler(async (req, res,next) => {
  try {
    const {searchText} = req.query;
    const filteredStates = IndianStates.filter(state => 
      state.option.toLowerCase().includes(searchText.toLowerCase())
    );
    return res.send({
      status: false,
      data: { states: filteredStates },
      message: "States fetched successfully",
      responseCode: "000",
    });
  } catch (error) {
  
    customLog(req?.LogTraceId, "error", { message: '🚀 ~ exports.fetchStatesasyncHandler ~ error:', error });
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.payment = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id; //will come from userObject
  const packageId = req.user.packageId; //will come from userObject
  const account = req.body.resultId;
  const amount = parseFloat(req.body.orderAmount);
  const payCashback = req.body.payCashback;
  const emailId = req.user.email;
  const name = req.user.name
  const data = req.body;
  const senderAddress = data.senderAddress;
  const corporateUserId = req.user.corporateId
  delete data.accessKey;
  delete data.senderAddress;
  let templateDetails;
  templateDetails = await fetchPartnerDetails(req.user.registeredBy)
  const host = templateDetails?.baseUrl;
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  })
  const API_URL = serviceDetails.vendor.apiUrl;
  const token = serviceDetails.vendor.optional1;
  const merchantUsername = serviceDetails.vendor.optional2;
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400));
  }
  let commissionType = serviceDetails.commissionType;
  let cashbackType = serviceDetails.cashbackType;
  let providerCommission = serviceDetails.providerCommission;
  let corporateCashback = serviceDetails.cashback;
  let serviceOperatorId = serviceDetails.id;
  let surcharge = serviceDetails.surcharge;

  let corporateTxnId = new Date().valueOf();
  let transactionResponse = {};
  const commonParams = {
    corporateTxnId,
    credentialId,
    serviceOperatorId,
    corporateCashback,
    accountNo: account,
    transactionCategory,
    orderAmount: amount,
    commissionType,
    cashbackType,
    providerCommission,
    payCashback,
    surcharge,
  };
  if (req.body.hasOwnProperty("razorPay")) {
    transactionResponse = await createRazorPayTransaction({
      ...commonParams,
      razorPayAmount: req.body.razorPayAmount,
      razorPayResponse: req.body.razorPay,
    });
  } else if (req.body.hasOwnProperty("paymentGatewayResponse")) {
    transactionResponse = await createPGTransaction({
      ...commonParams,
      pgAmount: req.body.pgAmount,
      pgResponse: req.body.paymentGatewayResponse,
    });
  } else if (req.body.hasOwnProperty("paytmResponse")) {
    transactionResponse = await createPaytmTransaction({
      ...commonParams,
      paytmAmount: req.body.paytmAmount,
      paytmResponse: req.body.paytmResponse,
    });
  } else {
    transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });
  }
  if (transactionResponse && transactionResponse.hasOwnProperty("error")) {
    customLog(req?.LogTraceId, "info", { message:"🚀 ~ exports.payment=asyncHandler ~ transactionResponse:", transactionResponse })
    return next(new ErrorResponse("Something went wrong", 400));
  }
  let updateDetails = {};
  let response;
  data.merchant_orderid = corporateTxnId;
  data.orderType = "PREPAID";
  data.merchant = merchantUsername;
  data.profileById = true;

  let formData = new URLSearchParams();

  for (let key in data) {
    formData.append(key, data[key]);
  }

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `${API_URL}merchant/v1/merchantApi/createOutsideOrder`,
    headers: {
      Authorization: token,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: formData.toString(),
  };
  const paymentDetails = {
    transactionId: corporateTxnId,
    account: account,
    amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
  };
  try {
    response = await axios.request(config);
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    response = { data: { responseCode: "001" }, message: "Payment Failed" };
  }
  if (response && response.data && response.data.responseCode === "000") {
    const AWBNumber = response.data.responseData.AWB_NO;
    updateDetails = {
      corporateTxnId,
      providerId: AWBNumber ? AWBNumber : "Not Available",
      status: "SUCCESS",
      orderResponse: JSON.stringify({
        ...data,
        senderAddress: senderAddress,
      }),
      message: "Payment Successful",
    };
  } else {
    updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: "Payment Failed!",
      registeredById: req.user.registeredBy,
      orderResponse: JSON.stringify(response.data),
    };
    if (req.body.hasOwnProperty("paymentGatewayResponse")) {
      let refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
      if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
        await refundWalletTransaction(updateDetails);
      }
    } else {
      await refundWalletTransaction(updateDetails);
    }
  }
  if (updateDetails.message == "Payment Successful") {
    // here we need to send mail also
    const notificationData = {
      notificationTitle: "Payment Successful",
      notificationBrief: `Shipment is created on the amount INR ${paymentDetails.amount}  was successful`,
      notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
      notificationCategory: "CORPORATE", // Replace with the relevant category
      notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
    };
    createNotification(notificationData);
    const to = emailId;
    const subject = "Shipment Successful";
    const body = generatePaymentSuccessEmailLogistics({
      name: req.user.name,
      transactionId: corporateTxnId,
      speedOrNormal: data.serviceType,
      sender: senderAddress,
      receiver: {
        name: data.customerName,
        City: data.customerCity,
        Line1: data.customerAddress,
        Line2: data.customerCity,
        Line3: data.customerMobileNo,
        PostCode: data.customerPinCode,
      },
      trackingNo: updateDetails.providerId,
      amount,
      quantity: data.orderWeight,
      host,
      templateDetails
    });
    // Call email function to send email with payment details in the body
    emailer.email(to, subject, body, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });

    await updateWalletTransaction(updateDetails);
    if (req.body.hasOwnProperty("paymentGatewayResponse")) {
      const encodedQueryParams = queryStringIntoBase64("success", corporateTxnId);
      res.redirect(`${req.body.successUrl}?${encodedQueryParams}`);
    } else {
      return res.status(200).json({
        status: true,
        data: { AWBNumber: updateDetails.providerId },
        message: "Order created successfully",
        responseCode: "000",
      });
    }
  } else {
    const walletDetails = await wallet.findOne({
      where: {
        credentialId,
      },
      attributes: ["balance"],
    });
    if (req.body.hasOwnProperty("paymentGatewayResponse")) {
      const encodedQueryParams = queryStringIntoBase64("failure", corporateTxnId);
      res.redirect(`${req.body.failureUrl}?${encodedQueryParams}`);
    } else {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: "Not Available",
        message: "shipment not created",
        registeredById: req.user.registeredBy ?? null,
      };
      const to = emailId; // Set recipient email address
      const subject = "Transaction Failed"; // Set email subject
      const serviceUrl = `${templateDetails?.baseUrl}/logistics`
      const body = commonFailedTemplate(name, "Logistics", serviceUrl);
      emailer.email(to, subject, body, function () {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
      });
      const notificationData = {
        notificationTitle: "Payment Failed",
        notificationBrief: `Shipment creation on the amount INR ${paymentDetails.amount} was failed`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      return res.status(400).json({
        status: false,
        data: {
          ...response?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Payment failed",
        responseCode: "001",
      });
    }
  }
});

exports.trackShipments = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id; //will come from userObject
    const packageId = req.user.packageId; //will come from userObject
    const fetchedOrder = await findOneOrderByProviderId({ credentialId, providerId: req.params.providerId });
    const orderId = fetchedOrder.providerId; // take it from db
    const corporateUserId = req.user.corporateId
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId
    });
    if (serviceDetails.hasOwnProperty("error")) {
      return next(new ErrorResponse("Something went wrong", 500));
    }

    const API_URL = serviceDetails.vendor.apiUrl;
    const token = serviceDetails.vendor.optional1;

    let formData = new URLSearchParams();
    formData.append("orderId", orderId);

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${API_URL}merchant/v1/merchantApi/orderHistory`,
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: formData.toString(),
    };

    axios
      .request(config)
      .then((response) => {
        const result = response.data;
        if (result?.responseCode === "000") {
          res.send({
            status: true,
            data: { trackingDetails: result?.responseData, orderDetails: fetchedOrder },
            message: `Shipment tracked successfully`,
            responseCode: "000",
          });
        } else {
          return next(new ErrorResponse("Something went wrong", 500));
        }
      })
      .catch((error) => {
      
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse("Something went wrong", 500));
      });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.updateReceiverAddress = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const data = req.body;
    const corporateUserId = req.user.corporateId
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId
    });
    const API_URL = serviceDetails.vendor.apiUrl;
    const token = serviceDetails.vendor.optional1;

    if (serviceDetails.hasOwnProperty("error")) {
      return next(new ErrorResponse("Something went wrong", 500));
    }
    const fetchedOrder = await findOrderById({ credentialId, orderId: req.params.orderId });
    const orderId = fetchedOrder.providerId; // take it from db
    let formData = new URLSearchParams();
    formData.append("orderId", orderId);
    for (let key in data) {
      formData.append(key, data[key]);
    }

    let config = {
      method: "put",
      maxBodyLength: Infinity,
      url: `${API_URL}merchant/v1/merchantApi/updateDetails`,
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: formData.toString(),
    };

    axios
      .request(config)
      .then((response) => {
        const result = response.data;
        if (result?.responseCode === "000") {
          res.send({
            status: true,
            data: { result },
            message: `Order updated successfully`,
            responseCode: "000",
          });
        } else {
          customLog(req?.LogTraceId, "info", { message:"🚀 ~ .then ~ result:", result: result.responseMessage })
          return next(new ErrorResponse("Something went wrong", 400));
        }
      })
      .catch((error) => {
        customLog(req?.LogTraceId, "error", { message: '🚀 ~ exports.updateOrder=asyncHandler ~ error:', data: error?.response?.data });
        return next(new ErrorResponse("Something went wrong", 500));
      });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: '🚀 ~ exports.updateOrder=asyncHandler ~ error:', data: error?.response?.data });
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.webhookUpdateStatus = asyncHandler(async (req, res, next) => {
  try {
    const order = await findOneByProviderId({ providerId: req.body.orderId });
    const update = {
      orderStatus: req.body.orderStatus,
      remarks: "",
      createdAt: new Date(),
      updatedBy: "Through Webhook",
    };
    order.shipmentStatus.push(update);
    const result = await updateOrder({ id: order.id }, { shipmentStatus: order.shipmentStatus });
    res.status(200).json({ responseCode: "000", message: "Status updated successfully", data: { result }, status: true });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: ' ~ exports.webhookUpdateStatus=asyncHandler ~ error:', error });
    return next(new ErrorResponse("Something went wrong", 500));
  }
});
