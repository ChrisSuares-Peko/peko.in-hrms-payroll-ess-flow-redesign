const asyncHandler = require("../../middlewares/async");
const { fetchServiceDetails } = require("../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../../utils/error-response");
const operatorsData = require("../../utils/operatorsData.json");
const axios = require("axios");
const { createWalletTransaction, refundWalletTransaction, updateWalletTransaction } = require("../../utils/walletTransaction");
const { refundGatewayTransaction } = require("./pluralGateway");
const { customLog } = require("../../utils/loggerHelper");
let transactionCategory = "Verification Suite";
const { createNotification } = require("../../models/use-cases/notification");
const wallet = require("../../models/entities/wallet");
const crypto = require("crypto");
const { findAllRecordsOrderListAndCount, verificationTransactionsExcelCSVCorporate } = require("../../models/use-cases/verificationSuite");
const { findOneOrderbyProviderId } = require("../../models/use-cases/order");
const FormData = require("form-data");
const { getValue, setValue } = require("../../utils/cacheDataMethods");
const { exec } = require("child_process");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const puppeteer = require('puppeteer');
const fs = require("fs");
const { STAGING_MOCK_GST_RETURNS_RESPONSE, MOCK_TEST_EMAIL } = require("../../utils/constants");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const NODE_ENV = process.env.NODE_ENV

exports.verifyBankAccount = asyncHandler(async (req, res, next) => {
  try {
    const accessKey = operatorsData['bankAccount']['accessKey']
    const data = req.body;
    const { bank_account, ifsc, name, phone } = data;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    let commissionType = serviceDetails.commissionType;
    let cashbackType = serviceDetails.cashbackType;
    let providerCommission = serviceDetails.providerCommission;
    let corporateCashback = serviceDetails.cashback;
    let serviceOperatorId = serviceDetails.id;
    let surcharge = serviceDetails.surcharge;
    const payCashback = req.body.payCashback || false;
    const transactionId = new Date().valueOf();
    let providerId = transactionId;
    let amount = serviceDetails.unitPrice;
    // first we will  do transaction

    let corporateTxnId = new Date().valueOf();
    const commonParams = {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
    };

    const transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
      return next(new ErrorResponse(transactionResponse["error"], 500));
    }

    const payload = {
      bank_account,
      ifsc,
      name,
      phone,
    }
    let config = {
      method: 'post',
      url: `${serviceDetails.vendor.apiUrl}/verification/bank-account/sync`,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': serviceDetails.vendor.optional1,
        'x-client-secret': serviceDetails.vendor.optional2,
      },
      data: payload
    };
    customLog(req?.LogTraceId, "info", { config: config })
    let result
    try {
      result = await axios(config);
      customLog(req?.LogTraceId, "info", { result: result?.data })
    } catch (error) {
      const status = error?.response?.status || 500;
      const data = error?.response?.data || {};
      result = { status, data };
      customLog(req?.LogTraceId, "error", { error: result });
    }
    let updateDetails = {};

    if (result?.status >= 200 && result?.status < 300) {
      updateDetails = {
        corporateTxnId,
        providerId: result?.data.reference_id || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          InputDetails: {
            ...data,
            VerificationType: "Bank Account",
            Accesskey: accessKey,
          },
          Result: result?.data
        })
      };
    } else {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: result?.data?.reference_id || "Not Available",
        message: result?.data.message || "Verification Failed",
        errorCode: "Unknown",
        registeredById: req.user.registeredBy,
      };

      // ✅ Refund only if status is 400 or greater
      if (result?.status >= 400) {
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          let refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }
      }
    }
    const type = operatorsData['bankAccount']['type']
    const maskedBankAccount = bank_account
  ? `${bank_account.slice(0, 4)}XXXXXXX`
  : 'XXXXXXX';

    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        transactionId: corporateTxnId,
        amount: amount,
      };
      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedBankAccount} was completed. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {

      const notificationData = {
        notificationTitle: "Verification Failed",
        notificationBrief: `The ${type} verification for ${maskedBankAccount} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while verfying bank account", 500))
  }
})

exports.verifyIfscCode = asyncHandler(async (req, res, next) => {
  try {
    const data = req.body;
    const { ifsc } = data;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const accessKey = operatorsData['ifsc']['accessKey']
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    let commissionType = serviceDetails.commissionType;
    let cashbackType = serviceDetails.cashbackType;
    let providerCommission = serviceDetails.providerCommission;
    let corporateCashback = serviceDetails.cashback;
    let serviceOperatorId = serviceDetails.id;
    let surcharge = serviceDetails.surcharge;
    const payCashback = req.body.payCashback || false;
    const transactionId = new Date().valueOf();
    let providerId = transactionId;

    let amount = serviceDetails.unitPrice;
    // first we will  do transaction

    let corporateTxnId = new Date().valueOf();
    const commonParams = {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
    };

    const transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
      return next(new ErrorResponse(transactionResponse["error"], 500));
    }
    const payload = {
      ifsc,
      verification_id: `verif_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`.slice(0, 50)
    }
    let config = {
      method: 'post',
      url: `${serviceDetails.vendor.apiUrl}/verification/ifsc`,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': serviceDetails.vendor.optional1,
        'x-client-secret': serviceDetails.vendor.optional2,
      },
      data: payload
    };
    customLog(req?.LogTraceId, "info", { config: config })
    let result
    try {
      result = await axios(config);
      customLog(req?.LogTraceId, "info", { result: result?.data })
    } catch (error) {
      const status = error?.response?.status || 500;
      const data = error?.response?.data || {};
      result = { status, data };
      customLog(req?.LogTraceId, "error", { error: result });
    }
    let updateDetails = {};

    if (result?.status >= 200 && result?.status < 300) {
      updateDetails = {
        corporateTxnId,
        providerId: result?.data.reference_id || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          InputDetails: {
            ...data,
            VerificationType: "IFSC",
            Accesskey: accessKey,
          },
          Result: result?.data
        })
      };
    } else {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: result?.data?.reference_id || "Not Available",
        message: result?.data.message || "Verification Failed",
        errorCode: "Unknown",
        registeredById: req.user.registeredBy,
      };

      // ✅ Refund only if status is 400 or more
      if (result?.status >= 400) {
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          const refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }
      }
    }
    const type = operatorsData['ifsc']['type']
    const maskedIfsc = ifsc ? `${ifsc.slice(0,4)}XXXXXX`
      : 'XXXXXX';
    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        transactionId: corporateTxnId,
        amount: amount,
      };
      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedIfsc} was completed on. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {

      const notificationData = {
        notificationTitle: "Verification Failed",
        notificationBrief: `The ${type} verification for ${maskedIfsc} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    console.log("ERROR", error)
    next(new ErrorResponse("Something went wrong while verfying ifsc", 500))
  }
})

exports.verifyPan = asyncHandler(async (req, res, next) => {
  try {
    const data = req.body;
    const { pan } = data;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const accessKey = operatorsData['pan']['accessKey']
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    let commissionType = serviceDetails.commissionType;
    let cashbackType = serviceDetails.cashbackType;
    let providerCommission = serviceDetails.providerCommission;
    let corporateCashback = serviceDetails.cashback;
    let serviceOperatorId = serviceDetails.id;
    let surcharge = serviceDetails.surcharge;
    const payCashback = req.body.payCashback || false;
    const transactionId = new Date().valueOf();
    let providerId = transactionId;
    let amount = serviceDetails.unitPrice;
    // first we will  do transaction

    let corporateTxnId = new Date().valueOf();
    const commonParams = {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
    };

    const transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
      return next(new ErrorResponse(transactionResponse["error"], 500));
    }
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    let config = {
      method: 'post',
      url: `${serviceDetails.vendor.apiUrl}/verification/pan`,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': serviceDetails.vendor.optional1,
        'x-client-secret': serviceDetails.vendor.optional2,
        "x-api-version":formattedDate
      },
      data: data
    };
    exec('curl -4 -s ifconfig.me', (error, stdout, stderr) => {
      if (error) {
          console.error(`Error fetching IP address: ${error.message}`);
          return;
      }
      if (stderr) {
          console.error(`Error output: ${stderr}`);
          return;
      }
      console.log(`Public IP Address: ${stdout.trim()}`);
      customLog(req?.LogTraceId, "info", { message: 'Public IP Address:', ipAddress: stdout.trim() })
    })
    customLog(req?.LogTraceId, "info", { config: config })
    let result
    try {
      result = await axios(config);
      customLog(req?.LogTraceId, "info", { result: result?.data })
    } catch (error) {
      const status = error?.response?.status || 500;
      const data = error?.response?.data || {};
      result = { status, data };
      customLog(req?.LogTraceId, "error", { error: result });
    }
    let updateDetails = {};

    if (result?.status >= 200 && result?.status < 300) {
      updateDetails = {
        corporateTxnId,
        providerId: result?.data.reference_id || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          InputDetails: {
            ...data,
            VerificationType: "PAN",
            Accesskey: accessKey,
          },
          Result: result?.data
        })
      };
    } else {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: result?.data?.reference_id || "Not Available",
        message: result?.data.message || "Verification Failed",
        errorCode: "Unknown",
        registeredById: req.user.registeredBy,
      };
      // ✅ Only refund if status code is 400 or more
      if (result?.status >= 400) {
        console.log("Refunding wallet transaction")
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          const refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }
      }
    }
    const type = operatorsData['pan']['type']
    const maskedPan = pan ? `${pan.slice(0,4)}XXXXXX`
      : 'XXXXXX';

    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        transactionId: corporateTxnId,
        amount: amount,
      };
      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedPan} was completed. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {

      const notificationData = {
        notificationTitle: "Verification Failed",
        notificationBrief: `The ${type} verification for ${maskedPan} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while verfying pan", 500))
  }
})

exports.verifyAadhaarPhoto = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const accessKey = operatorsData['aadhaarOCR']['accessKey']
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    let commissionType = serviceDetails.commissionType;
    let cashbackType = serviceDetails.cashbackType;
    let providerCommission = serviceDetails.providerCommission;
    let corporateCashback = serviceDetails.cashback;
    let serviceOperatorId = serviceDetails.id;
    let surcharge = serviceDetails.surcharge;
    const payCashback = req.body.payCashback || false;
    const transactionId = new Date().valueOf();
    let providerId = transactionId;
    let amount = serviceDetails.unitPrice;
    // first we will  do transaction

    let corporateTxnId = new Date().valueOf();
    const commonParams = {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
    };

    const transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
      return next(new ErrorResponse(transactionResponse["error"], 500));
    }

    const formData = new FormData();

    formData.append("image", req.file.buffer, req.file.originalname);

    formData.append("verification_id", `verif_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`.slice(0, 50))

    let config = {
      method: 'post',
      url: `${serviceDetails.vendor.apiUrl}/verification/aadhaar-masking`,
      headers: {
        // 'Content-Type': 'application/json',
        'x-client-id': serviceDetails.vendor.optional1,
        'x-client-secret': serviceDetails.vendor.optional2,
        ...formData.getHeaders(),
      },
      data: formData
    };
    let result
    customLog(req?.LogTraceId, "info", { config: config })
    try {
      result = await axios(config);
      customLog(req?.LogTraceId, "info", { result: result?.data })
    } catch (error) {
      const status = error?.response?.status || 500;
      const data = error?.response?.data || {};
      result = { status, data };
      customLog(req?.LogTraceId, "error", { error: result });
    }

    let updateDetails = {};

    if (result?.status >= 200 && result?.status < 300) {
      updateDetails = {
        corporateTxnId,
        providerId: result?.data.reference_id || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          InputDetails: {
            ...formData,
            VerificationType: "Aadhaar OCR",
            Accesskey: accessKey,
          },
          Result: result?.data
        })
      };
    } else {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: result?.data?.reference_id || "Not Available",
        message: "Verification Failed",
        errorCode: "Unknown",
        registeredById: req.user.registeredBy,
      };

      // ✅ Refund only if status is 400 or more
      if (result?.status >= 400) {
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          let refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }
      }
    }
    const type = operatorsData['aadhaarOCR']['type']

    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        transactionId: corporateTxnId,
        amount: amount,
      };

      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for Aadhaar was completed. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {
      const notificationData = {
        notificationTitle: "Verification Failed",
        notificationBrief: `The ${type} verification for Aadhaar was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while masking Aadhaar number", 500))
  }
})
exports.advancePanVerification = asyncHandler(async (req, res, next) => {
  try {
    const data = req.body;
    const { pan, name } = data;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const accessKey = operatorsData['advancePAN']['accessKey']
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    let commissionType = serviceDetails.commissionType;
    let cashbackType = serviceDetails.cashbackType;
    let providerCommission = serviceDetails.providerCommission;
    let corporateCashback = serviceDetails.cashback;
    let serviceOperatorId = serviceDetails.id;
    let surcharge = serviceDetails.surcharge;
    const payCashback = req.body.payCashback || false;
    const transactionId = new Date().valueOf();
    let providerId = transactionId;
    let amount = serviceDetails.unitPrice;
    // first we will  do transaction

    let corporateTxnId = new Date().valueOf();
    const commonParams = {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
    };

    const transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
      return next(new ErrorResponse(transactionResponse["error"], 500));
    }

    const payload = {
      pan,
      name,
      verification_id: `verif_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`.slice(0, 50)
    }
    let config = {
      method: 'post',
      url: `${serviceDetails.vendor.apiUrl}/verification/pan/advance`,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': serviceDetails.vendor.optional1,
        'x-client-secret': serviceDetails.vendor.optional2,
      },
      data: payload
    };
    customLog(req?.LogTraceId, "info", { config: config })
    let result
    try {
      result = await axios(config);
      customLog(req?.LogTraceId, "info", { result: result?.data })
    } catch (error) {
      const status = error?.response?.status || 500;
      const data = error?.response?.data || {};
      result = { status, data };
      customLog(req?.LogTraceId, "error", { error: result });
    }
    let updateDetails = {};

    if (result?.status >= 200 && result?.status < 300) {
      updateDetails = {
        corporateTxnId,
        providerId: result?.data.reference_id || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          InputDetails: {
            ...data,
            VerificationType: "Advance PAN",
            Accesskey: accessKey,
          },
          Result: result?.data
        })
      };
    } else {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: result?.data?.reference_id || "Not Available",
        message: "Verification Failed",
        errorCode: "Unknown",
        registeredById: req.user.registeredBy,
      };

      // ✅ Only refund if status code is 400 or greater
      if (result?.status >= 400) {
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          const refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }
      }
    }
    const type = operatorsData['advancePAN']['type']
    const maskedPAN = pan ? `${pan.slice(0,4)}XXXXXX`
      : 'XXXXXX';
    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        transactionId: corporateTxnId,
        amount: amount,
      };
      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedPAN} was completed. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {

      const notificationData = {
        notificationTitle: "Verification Failed",
        notificationBrief: `The ${type} verification for ${maskedPAN} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while verfying PAN", 500))
  }
})

exports.verifyDrivingLicense = asyncHandler(async (req, res, next) => {
  try {
    const data = req.body;
    const { dl_number } = data;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const accessKey = operatorsData['drivingLicense']['accessKey']
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    let commissionType = serviceDetails.commissionType;
    let cashbackType = serviceDetails.cashbackType;
    let providerCommission = serviceDetails.providerCommission;
    let corporateCashback = serviceDetails.cashback;
    let serviceOperatorId = serviceDetails.id;
    let surcharge = serviceDetails.surcharge;
    const payCashback = req.body.payCashback || false;
    const transactionId = new Date().valueOf();
    let providerId = transactionId;
    let amount = serviceDetails.unitPrice;
    // first we will  do transaction

    let corporateTxnId = new Date().valueOf();
    const commonParams = {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
    };

    const transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
      return next(new ErrorResponse(transactionResponse["error"], 500));
    }

    const payload = {
      ...data,
      verification_id: `verif_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`.slice(0, 50)
    }
    let config = {
      method: 'post',
      url: `${serviceDetails.vendor.apiUrl}/verification/driving-license`,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': serviceDetails.vendor.optional1,
        'x-client-secret': serviceDetails.vendor.optional2,
      },
      data: payload
    };
    let result
    customLog(req?.LogTraceId, "info", { config: config })
    try {
      result = await axios(config);
      console.log("result data", result?.data)
      customLog(req?.LogTraceId, "info", { result: result?.data })
    } catch (error) {
      console.log("result error", error)
      const status = error?.response?.status || 500;
      const data = error?.response?.data || {};
      result = { status, data };
      customLog(req?.LogTraceId, "error", { error: result });
    }
    let updateDetails = {};

    if (result?.status >= 200 && result?.status < 300) {
      updateDetails = {
        corporateTxnId,
        providerId: result?.data.reference_id || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          InputDetails: {
            ...data,
            VerificationType: "Driving License",
            Accesskey: accessKey,
          },
          Result: result?.data
        })
      };
    } else {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: result?.data?.reference_id || "Not Available",
        message: "Verification Failed",
        errorCode: "Unknown",
        registeredById: req.user.registeredBy,
      };

      // ✅ Only refund if status code is 400 or greater
      if (result?.status >= 400) {
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          const refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }
      }
    }
    const type = operatorsData['drivingLicense']['type']
    const maskedDL = dl_number ? `${dl_number.slice(0,4)}XXXXXX`
      : 'XXXXXX';
    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        transactionId: corporateTxnId,
        amount: amount,
      };
      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedDL} was completed. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {

      const notificationData = {
        notificationTitle: "Verification Failed",
        notificationBrief: `The ${type} verification for ${maskedDL} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while verfying driver license", 500))
  }
})

exports.verifyPassport = asyncHandler(async (req, res, next) => {
  try {
    const data = req.body;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const accessKey = operatorsData['passport']['accessKey']
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    let commissionType = serviceDetails.commissionType;
    let cashbackType = serviceDetails.cashbackType;
    let providerCommission = serviceDetails.providerCommission;
    let corporateCashback = serviceDetails.cashback;
    let serviceOperatorId = serviceDetails.id;
    let surcharge = serviceDetails.surcharge;
    const payCashback = req.body.payCashback || false;
    const transactionId = new Date().valueOf();
    let providerId = transactionId;

    let amount = serviceDetails.unitPrice;
    // first we will  do transaction

    let corporateTxnId = new Date().valueOf();
    const commonParams = {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
    };

    const transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
      return next(new ErrorResponse(transactionResponse["error"], 500));
    }

    const payload = {
      ...data,
      verification_id: `verif_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`.slice(0, 50)
    }
    let config = {
      method: 'post',
      url: `${serviceDetails.vendor.apiUrl}/verification/passport`,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': serviceDetails.vendor.optional1,
        'x-client-secret': serviceDetails.vendor.optional2,
      },
      data: payload
    };
    customLog(req?.LogTraceId, "info", { config: config })
    let result
    try {
      result = await axios(config);
      customLog(req?.LogTraceId, "info", { result: result?.data })
    } catch (error) {
      const status = error?.response?.status || 500;
      const data = error?.response?.data || {};
      result = { status, data };
      customLog(req?.LogTraceId, "error", { error: result });
    }
    let updateDetails = {};

    if (result?.status >= 200 && result?.status < 300) {
      updateDetails = {
        corporateTxnId,
        providerId: result?.data.reference_id || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          InputDetails: {
            ...data,
            VerificationType: "Passport",
            Accesskey: accessKey,
          },
          Result: result?.data
        })
      };
    } else {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: result?.data?.reference_id || "Not Available",
        message: "Verification Failed",
        errorCode: "Unknown",
        registeredById: req.user.registeredBy,
      };

      // ✅ Only refund if status >= 400
      if (result?.status >= 400) {
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          const refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }
      }
    }

    const type = operatorsData['passport']['type']
    const maskedPassport = data.file_number ? `${data.file_number.slice(0,4)}XXXXXX` : "XXXXXX";

    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        transactionId: corporateTxnId,
        // account: account,
        amount: amount,
      };

      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedPassport} was completed. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {

      const notificationData = {
        notificationTitle: `Verification failed`,
        notificationBrief: `The ${type} verification for ${maskedPassport} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while verfying passport", 500))
  }
})
exports.verifyVoterId = asyncHandler(async (req, res, next) => {
  try {
    const data = req.body;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const accessKey = operatorsData['voterId']['accessKey']
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    let commissionType = serviceDetails.commissionType;
    let cashbackType = serviceDetails.cashbackType;
    let providerCommission = serviceDetails.providerCommission;
    let corporateCashback = serviceDetails.cashback;
    let serviceOperatorId = serviceDetails.id;
    let surcharge = serviceDetails.surcharge;
    const payCashback = req.body.payCashback || false;
    const transactionId = new Date().valueOf();
    let providerId = transactionId;
    let amount = serviceDetails.unitPrice;
    // first we will  do transaction

    let corporateTxnId = new Date().valueOf();
    const commonParams = {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
    };

    const transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
      return next(new ErrorResponse(transactionResponse["error"], 500));
    }

    const payload = {
      ...data,
      verification_id: `verif_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`.slice(0, 50)
    }
    let config = {
      method: 'post',
      url: `${serviceDetails.vendor.apiUrl}/verification/voter-id`,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': serviceDetails.vendor.optional1,
        'x-client-secret': serviceDetails.vendor.optional2,
      },
      data: payload
    };
    customLog(req?.LogTraceId, "info", { config: config })
    let result
    try {
      result = await axios(config);
      customLog(req?.LogTraceId, "info", { result: result?.data })
    } catch (error) {
      const status = error?.response?.status || 500;
      const data = error?.response?.data || {};
      result = { status, data };
      customLog(req?.LogTraceId, "error", { error: result });
    }
    let updateDetails = {};

    if (result?.status >= 200 && result?.status < 300) {
      updateDetails = {
        corporateTxnId,
        providerId: result?.data.reference_id || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          InputDetails: {
            ...data,
            VerificationType: "Voter Id",
            Accesskey: accessKey,
          },
          Result: result?.data
        })
      };
    } else {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: result?.data?.reference_id || "Not Available",
        message: "Verification Failed",
        errorCode: "Unknown",
        registeredById: req.user.registeredBy,
      };

      // ✅ Only refund for 400 or higher status codes
      if (result?.status >= 400) {
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          let refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }
      }
    }
    const type = operatorsData['voterId']['type']
    const maskedVoterId = data.epic_number ? `${data.epic_number.slice(0,4)}XXXXXX` : "XXXXXX";
    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        transactionId: corporateTxnId,
        amount: amount,
      };

      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedVoterId} was completed. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {
      const notificationData = {
        notificationTitle: `Verification failed`,
        notificationBrief: `The ${type} verification for ${maskedVoterId} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while verfying voter ID", 500))
  }
})
exports.verifyCIN = asyncHandler(async (req, res, next) => {
  try {
    const data = req.body;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const accessKey = operatorsData['cin']['accessKey']
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    let commissionType = serviceDetails.commissionType;
    let cashbackType = serviceDetails.cashbackType;
    let providerCommission = serviceDetails.providerCommission;
    let corporateCashback = serviceDetails.cashback;
    let serviceOperatorId = serviceDetails.id;
    let surcharge = serviceDetails.surcharge;
    const payCashback = req.body.payCashback || false;
    const transactionId = new Date().valueOf();
    let providerId = transactionId;
    let amount = serviceDetails.unitPrice;
    // first we will  do transaction

    let corporateTxnId = new Date().valueOf();
    const commonParams = {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
    };

    const transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
      return next(new ErrorResponse(transactionResponse["error"], 500));
    }

    const payload = {
      ...data,
      verification_id: `verif_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`.slice(0, 50)
    }
    let config = {
      method: 'post',
      url: `${serviceDetails.vendor.apiUrl}/verification/cin`,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': serviceDetails.vendor.optional1,
        'x-client-secret': serviceDetails.vendor.optional2,
      },
      data: payload
    };
    customLog(req?.LogTraceId, "info", { config: config })
    let result
    try {
      result = await axios(config);
      customLog(req?.LogTraceId, "info", { result: result?.data })
    } catch (error) {
      const status = error?.response?.status || 500;
      const data = error?.response?.data || {};
      result = { status, data };
      customLog(req?.LogTraceId, "error", { error: result });
    }
    let updateDetails = {};

    if (result?.status === 200) {
      updateDetails = {
        corporateTxnId,
        providerId: result?.data.reference_id || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          InputDetails: {
            ...data,
            VerificationType: "CIN",
            Accesskey: accessKey,
          },
          Result: result?.data
        })
      };
    } else {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: result?.data?.reference_id || "Not Available",
        message: "Verification Failed",
        errorCode: "Unknown",
        registeredById: req.user.registeredBy,
      };

      // ✅ Only refund if status is 400 or greater
      if (result?.status >= 400) {
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          let refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }
      }
    }

    const type = operatorsData['cin']['type']
    const maskedCIN = data.cin ? `${data.cin.slice(0,4)}XXXXXX` : "XXXXXX";
    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        transactionId: corporateTxnId,
        amount: amount,
      };

      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedCIN} was completed. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {

      const notificationData = {
        notificationTitle: `Verification failed`,
        notificationBrief: `The ${type} verification for ${maskedCIN} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while verfying cin", 500))
  }
})
exports.verifyGSTIN = asyncHandler(async (req, res, next) => {
  try {
    const data = req.body;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const accessKey = operatorsData['gstin']['accessKey']
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    let commissionType = serviceDetails.commissionType;
    let cashbackType = serviceDetails.cashbackType;
    let providerCommission = serviceDetails.providerCommission;
    let corporateCashback = serviceDetails.cashback;
    let serviceOperatorId = serviceDetails.id;
    let surcharge = serviceDetails.surcharge;
    const payCashback = req.body.payCashback || false;
    const transactionId = new Date().valueOf();
    let providerId = transactionId;
    let amount = serviceDetails.unitPrice;
    // first we will  do transaction

    let corporateTxnId = new Date().valueOf();
    const commonParams = {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
    };

    const transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
      return next(new ErrorResponse(transactionResponse["error"], 500));
    }

    const payload = {
      ...data,
    }
    let config = {
      method: 'post',
      url: `${serviceDetails.vendor.apiUrl}/verification/gstin`,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': serviceDetails.vendor.optional1,
        'x-client-secret': serviceDetails.vendor.optional2,
      },
      data: payload
    };
    customLog(req?.LogTraceId, "info", { config: config })
    let result
    try {
      result = await axios(config);
      customLog(req?.LogTraceId, "info", { result: result?.data })
    } catch (error) {
      const status = error?.response?.status || 500;
      const data = error?.response?.data || {};
      result = { status, data };
      customLog(req?.LogTraceId, "error", { error: result });
    }
    let updateDetails = {};

    if (result?.status >= 200 && result?.status < 300) {
      updateDetails = {
        corporateTxnId,
        providerId: result?.data.reference_id || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          InputDetails: {
            ...data,
            VerificationType: "GSTIN",
            Accesskey: accessKey,
          },
          Result: result?.data
        })
      };
    } else {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: result?.data?.reference_id || "Not Available",
        message: "Verification Failed",
        errorCode: "Unknown",
        registeredById: req.user.registeredBy,
      };

      // ✅ Only refund if response status is 400 or greater
      if (result?.status >= 400) {
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          const refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }
      }
    }
    const type = operatorsData['gstin']['type']
    const maskedGSTIN = data.GSTIN ? `${data.GSTIN.slice(0,4)}XXXXXX` : "XXXXXX";
    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        transactionId: corporateTxnId,
        amount: amount,
      };

      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedGSTIN} was completed. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {

      const notificationData = {
        notificationTitle: `Verification failed`,
        notificationBrief: `The ${type} verification for ${maskedGSTIN} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while verifying GSTIN", 500))
  }
})
exports.verifyGSTINBusiness = asyncHandler(async (req, res, next) => {
  try {
    const { gstin, action } = req.query;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const accessKey = operatorsData['gstinBusiness']['accessKey']
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    let commissionType = serviceDetails.commissionType;
    let cashbackType = serviceDetails.cashbackType;
    let providerCommission = serviceDetails.providerCommission;
    let corporateCashback = serviceDetails.cashback;
    let serviceOperatorId = serviceDetails.id;
    let surcharge = serviceDetails.surcharge;
    const payCashback = req.body.payCashback || false;
    const transactionId = new Date().valueOf();
    let providerId = transactionId;
    let amount = serviceDetails.unitPrice;
    // first we will  do transaction

    let corporateTxnId = new Date().valueOf();
    const commonParams = {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
    };

    const transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
      return next(new ErrorResponse(transactionResponse["error"], 500));
    }

    let config = {
      method: 'get',
      url: `${serviceDetails.vendor.apiUrl}/v0.3/search?gstin=${gstin}&action=${action}`,
      headers: {
        'Content-Type': 'application/json',
        'ocp-apim-subscription-key': serviceDetails.vendor.optional1,
      },
    };
    customLog(req?.LogTraceId, "info", { config: config })
    let result
    let decodedData = null;
    let updateDetails = {};
    try {
      result = await axios(config);
      customLog(req?.LogTraceId, "info", { result: result?.data })

      const response = result?.data;
      if (response.status_cd === "1") {
        // Valid response
        decodedData = JSON.parse(Buffer.from(response.data, 'base64').toString('utf8'));
        console.log("decodedData", decodedData)
        updateDetails = {
          corporateTxnId,
          providerId: "Not Available",
          status: "SUCCESS",
          message: "Payment Successful",
          orderResponse: JSON.stringify({
            InputDetails: {
              ...req.query,
              VerificationType: "GSTIN",
              Accesskey: accessKey,
            },
            Result: decodedData
          })
        };
      } else {
        const isRefundable = (code) => {
          const refundableCodes = [
            "RET12501", "RET12502", "RET12503", "RET12504",
            "RET13502", "RET13504", "RET13503"
          ];

          // Extend this if needed based on future docs from vendor
          return refundableCodes.includes(code);
        };

        const errorCode = result?.data?.error?.error_cd || "Unknown";
        if (isRefundable(errorCode)) {
          if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
            const refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
            if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
              await refundWalletTransaction(updateDetails);
            }
          } else {
            await refundWalletTransaction(updateDetails);
          }
        }
        // Error response
        updateDetails = {
          corporateTxnId,
          status: "FAILURE",
          providerId: result?.data?.reference_id || "Not Available",
          message: "Verification Failed",
          orderResponse: JSON.stringify({
            InputDetails: {
              ...req.query,
              VerificationType: "GSTIN",
              Accesskey: accessKey,
            },
            Result: decodedData
          }),
          errorCode: "Unknown",
          registeredById: req.user.registeredBy,
        };
      }
    } catch (error) {
      customLog(req?.LogTraceId, "error", { error: error })
    }

    const type = operatorsData['gstinBusiness']['type']
    const maskedGSTIN = gstin ? `${gstin.slice(0,4)}XXXXXX` : "XXXXXX";
    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        transactionId: corporateTxnId,
        amount: amount,
      };

      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedGSTIN} was completed. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...decodedData,
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {

      const notificationData = {
        notificationTitle: `Verification failed`,
        notificationBrief: `The ${type} verification for ${maskedGSTIN} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while verifying GSTIN", 500))
  }
})
exports.gstReturnComplainceCheck = asyncHandler(async (req, res, next) => {
  try {
    const { gstin, fy, action } = req.query;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const accessKey = operatorsData['gstinComplianceCheck']['accessKey']
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    let commissionType = serviceDetails.commissionType;
    let cashbackType = serviceDetails.cashbackType;
    let providerCommission = serviceDetails.providerCommission;
    let corporateCashback = serviceDetails.cashback;
    let serviceOperatorId = serviceDetails.id;
    let surcharge = serviceDetails.surcharge;
    const payCashback = req.body.payCashback || false;
    const transactionId = new Date().valueOf();
    let providerId = transactionId;
    let amount = serviceDetails.unitPrice;
    // first we will  do transaction

    let corporateTxnId = new Date().valueOf();
    const commonParams = {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
    };

    const transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
      return next(new ErrorResponse(transactionResponse["error"], 500));
    }


    let config = {
      method: 'get',
      url: `${serviceDetails.vendor.apiUrl}/v1.0/returns?gstin=${gstin}&fy=${fy}&action=${action}`,
      headers: {
        'Content-Type': 'application/json',
        'ocp-apim-subscription-key': serviceDetails.vendor.optional1,
      },
    };
    customLog(req?.LogTraceId, "info", { config: config })
    let result
    let updateDetails = {};
    try {
      if(NODE_ENV === 'staging'){
        result = STAGING_MOCK_GST_RETURNS_RESPONSE;
      }else{
        result = await axios(config);
      }
      customLog(req?.LogTraceId, "info", { result: result?.data })
    } catch (error) {
      customLog(req?.LogTraceId, "error", { error: error })
    }
    const response = result?.data;
    if (response.status_cd === "1") {
      // Valid response
      updateDetails = {
        corporateTxnId,
        providerId: "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          InputDetails: {
            ...req.query,
            VerificationType: "GSTIN Return Compliance Check",
            Accesskey: accessKey,
          },
          Result: result?.data
        })
      };
    } else {
      const isRefundable = (code) => {
        const refundableCodes = [
          "RET12501", "RET12502", "RET12503", "RET12504",
          "RET13502", "RET13504", "RET13503","RET13510"
        ];
        console.log("readched!!!!")

        // Extend this if needed based on future docs from vendor
        return refundableCodes.includes(code);
      };

        // Error response
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: result?.data?.reference_id || "Not Available",
        message: result?.data?.error?.message||"Verification Failed",
        orderResponse: JSON.stringify({
          InputDetails: {
            ...req.query,
            VerificationType: "GSTIN",
            Accesskey: accessKey,
          },
          Result: result?.data
        }),
        errorCode: "Unknown",
        registeredById: req.user.registeredBy,
      };

      const errorCode = result?.data?.error?.error_cd || "Unknown";
      if (isRefundable(errorCode)) {
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          const refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }
      }
    
      // Error response
      // updateDetails = {
      //   corporateTxnId,
      //   status: "FAILURE",
      //   providerId: result?.data?.reference_id || "Not Available",
      //   message: result?.data?.error?.message||"Verification Failed",
      //   orderResponse: JSON.stringify({
      //     InputDetails: {
      //       ...req.query,
      //       VerificationType: "GSTIN",
      //       Accesskey: accessKey,
      //     },
      //     Result: result?.data
      //   }),
      //   errorCode: "Unknown",
      //   registeredById: req.user.registeredBy,
      // };
    }

    const type = operatorsData['gstinComplianceCheck']['type']
    const maskedGSTIN = gstin ? `${gstin.slice(0,4)}XXXXXX` : "XXXXXX";
   
    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        transactionId: corporateTxnId,
        amount: amount,
      };

      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedGSTIN} was completed. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {

      console.log("updateDetailsupdateDetails",updateDetails)

      const notificationData = {
        notificationTitle: `Verification failed`,
        notificationBrief: `The ${type} verification for ${maskedGSTIN} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while verifying GSTIN", 500))
  }
})
const authenticateAlankit = async (serviceDetails, accessKey) => {
  try {
    const redisKey = `sessionId-${accessKey}`;
    const cachedSessionId = await getValue(redisKey);

    if (cachedSessionId) {
      return cachedSessionId;
    }

    const config = {
      method: 'post',
      url: `${serviceDetails.vendor.healthUrl}/mcaloginapi`,
      headers: {
        'Subscriptionkey': serviceDetails.vendor.optional2,
      },
    };

    const result = await axios(config);
    const sessionId = result?.data?.response?.id;
    customLog(null, "info", { result: result.data })
    if (sessionId) {
      await setValue(redisKey, 60 * 60 * 1, sessionId);
      return sessionId;
    }

    return null;

  } catch (error) {
    console.log(error)
    const status = error?.response?.status || 500;
    const data = error?.response?.data || {};
    customLog(null, "error", { error: { status, data } });
    return null;
  }
};


exports.corporateEntitiyVerification = asyncHandler(async (req, res, next) => {
  try {
    const { CIN, payCashback = false } = req.body;
    const { id: credentialId, corporateId: corporateUserId, packageId } = req.user;
    const accessKey = operatorsData['corporateVerify']['accessKey'];

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });

    if (serviceDetails.error) {
      return next(new ErrorResponse(serviceDetails.error, 400));
    }

    const {
      commissionType,
      cashbackType,
      providerCommission,
      cashback: corporateCashback,
      id: serviceOperatorId,
      surcharge,
      unitPrice: amount
    } = serviceDetails;

    const transactionId = Date.now();
    const providerId = transactionId;
    const corporateTxnId = Date.now();

    const transactionResponse = await createWalletTransaction({
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
      amount,
    });

    if (transactionResponse?.error) {
      return next(new ErrorResponse(transactionResponse.error, 500));
    }

    let result;
    let updateDetails = {
      corporateTxnId,
      providerId,
    };
    const isProduction = process.env.NODE_ENV === 'production';

    try {
      if (isProduction) {
        const token = await authenticateAlankit(serviceDetails, accessKey);
        if (!token) {
          await refundWalletTransaction(updateDetails);
          return next(new ErrorResponse("Authentication failed", 500));
        }

        const payload = { CIN };
        const config = {
          method: "post",
          url: `${serviceDetails.vendor.healthUrl}/MCA/03`,
          headers: {
            Authorization: `Bearer ${token}`,
            Subscriptionkey: serviceDetails.vendor.optional2,
            'Content-Type': 'application/json',
          },
          data: payload,
        };
        customLog(req.LogTraceId, "info", config)
        // Production: make actual third-party API call
        result = await axios(config);
      } else {
        // Non-production: mock the third-party API response
        if (!isProduction) {
          customLog(req.LogTraceId, 'info', 'Mock response used. No token generated or API call made.');
        }
        result = {
          data: {
            response: [
              {
                response: {
                  data: [
                    {
                      area: "null",
                      pincode: 517408,
                      country: "India",
                      city: "Palamaner",
                      addressType: "Registered Address",
                      financialRange: "null",
                      companyName: "KOUNDINYA FARMERS PRODUCER COMPANY LIMITED",
                      companyStatus: "Amalgamated",
                      CIN: "U01100AP2018PTC107442",
                      profitLoss: null,
                      isAuditStatusApplicable: "Applicable",
                      type: "Company",
                      financialYear: "null",
                      emailAddress: MOCK_TEST_EMAIL,
                      ROCName: "ROC Vijayawada",
                      district: "Chittoor",
                      contactNumber: "null",
                      addressLine1: "C/o Mrs. A. Parvathi   1-13, Wadim Kalladu",
                      auditStatus: "null",
                      addressLine2: "null",
                      incorporationDate: "10/01/2018",
                      state: "Andhra Pradesh",
                      turnover: null
                    }
                  ],
                  message: "Data fetched Successfully"
                },
                responseStatus: "SUCCESS"
              }
            ],
            error: "false",
            code: "200",
            message: "Success"
          }
        };
      }
      const resData = result?.data;
      customLog(req?.LogTraceId, "info", { result: JSON.stringify(resData) });

      const thirdPartyResponse = resData?.response?.[0];
      const responseStatus = thirdPartyResponse?.responseStatus;
      // const responseMessage = thirdPartyResponse?.message?.text;
      // const statusCode = resData?.data?.status_cd;
      const alankitErrorCode = resData?.error?.error_cd


      // Check for refundable error cases
      const shouldRefund =
        responseStatus === "ERROR" || // MCA/03 failure
        alankitErrorCode === "ALNAUTH01" || alankitErrorCode === "ALNGEN04"

      if (shouldRefund) {
        updateDetails = {
          corporateTxnId,
          status: "FAILURE",
          providerId: result?.data?.reference_id || "Not Available",
          message: "Verification Failed",
          errorCode: "Unknown",
          registeredById: req.user.registeredBy,
        };
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          const refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }

        return next(new ErrorResponse("Corporate verification failed. Refunded.", 400));
      }

      customLog(req?.LogTraceId, "info", { result: resData });

      // Proceed normally if successful
      updateDetails = {
        corporateTxnId,
        providerId: result?.data.reference_id || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          InputDetails: {
            CIN,
            VerificationType: "Corporate Entity",
            Accesskey: accessKey,
          },
          Result: resData
        })
      };
    } catch (error) {
      // Timeout or other network error fallback
      customLog(req?.LogTraceId, "error", { error: error });
      await refundWalletTransaction(updateDetails);
      return next(new ErrorResponse("Corporate verification failed. Refunded due to request error.", 500));
    }
    const type = operatorsData['corporateVerify']['type']
    const maskedCIN = CIN ? `${CIN.slice(0,4)}XXXXXX` : "XXXXXX";
    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        transactionId: corporateTxnId,
        amount: amount,
      };

      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedCIN} was completed. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {

      const notificationData = {
        notificationTitle: `Verification failed`,
        notificationBrief: `The ${type} verification for ${maskedCIN} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while verifying CIN", 500))
  }
});

exports.fetchDirectorDetailsCIN = asyncHandler(async (req, res, next) => {
  try {
    const { CIN, payCashback = false } = req.body;
    const { id: credentialId, corporateId: corporateUserId, packageId } = req.user;
    const accessKey = operatorsData['directorCIN']['accessKey'];

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });

    if (serviceDetails.error) {
      return next(new ErrorResponse(serviceDetails.error, 400));
    }

    const {
      commissionType,
      cashbackType,
      providerCommission,
      cashback: corporateCashback,
      id: serviceOperatorId,
      surcharge,
      unitPrice: amount
    } = serviceDetails;

    const transactionId = Date.now();
    const providerId = transactionId;
    const corporateTxnId = Date.now();

    const transactionResponse = await createWalletTransaction({
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
      amount,
    });

    if (transactionResponse?.error) {
      return next(new ErrorResponse(transactionResponse.error, 500));
    }

    let updateDetails = {
      corporateTxnId,
      providerId,
    };


    let result;
    const isProduction = process.env.NODE_ENV === 'production';
    try {
      if (isProduction) {
        const token = await authenticateAlankit(serviceDetails, accessKey);
        if (!token) {
          await refundWalletTransaction(updateDetails);
          return next(new ErrorResponse("Authentication failed", 500));
        }

        const payload = { CIN };
        const config = {
          method: "post",
          url: `${serviceDetails.vendor.healthUrl}/MCA/04`,
          headers: {
            Authorization: `Bearer ${token}`,
            Subscriptionkey: serviceDetails.vendor.optional2,
            'Content-Type': 'application/json',
          },
          data: payload,
        };
        result = await axios(config);
      } else {
        if (!isProduction) {
          customLog(req.LogTraceId, 'info', 'Mock response used. No token generated or API call made.');
        }
        result = {
          data: {
            response: [
              {
                "response": {
                  "data": [
                    {
                      "firstName": "G*N*S*K*A*G*R*",
                      "lastName": "V*L*E*M*",
                      "fatherFirstName": "P*L*E",
                      "fatherMidName": "n*l*",
                      "fatherLastName": "D*S*R*D*N",
                      "DOB": "0*/*1*1*7*",
                      "companyName": "KOUNDINYA FARMERS PRODUCER COMPANY LIMITED",
                      "DINStatus": "Approved",
                      "DIN": "09597232",
                      "CIN": "U01100AP2018PTC107442",
                      "associationStatus": "Active",
                      "middleName": "*"
                    },
                    {
                      "firstName": "K*V*T*A",
                      "lastName": "P*P*D*S*",
                      "fatherFirstName": "B*B*N*I*U",
                      "fatherMidName": "n*l*",
                      "fatherLastName": "A*U*U*I",
                      "DOB": "1*/*6*1*8*",
                      "companyName": "KOUNDINYA FARMERS PRODUCER COMPANY LIMITED",
                      "DINStatus": "Approved",
                      "DIN": "08038846",
                      "CIN": "U01100AP2018PTC107442",
                      "associationStatus": "Active",
                      "middleName": "*"
                    },
                    {
                      "firstName": "M*N*J",
                      "lastName": "J*N*O*L*",
                      "fatherFirstName": "D*V*N*R*",
                      "fatherMidName": "R*D*Y",
                      "fatherLastName": "J*N*O*L*",
                      "DOB": "1*/*6*1*8*",
                      "companyName": "KOUNDINYA FARMERS PRODUCER COMPANY LIMITED",
                      "DINStatus": "Approved",
                      "DIN": "08038842",
                      "CIN": "U01100AP2018PTC107442",
                      "associationStatus": "Active",
                      "middleName": "K*M*R"
                    },
                    {
                      "firstName": "J*O*H*",
                      "lastName": "E*R*D*M*N*P*L*I",
                      "fatherFirstName": "A*A*D*",
                      "fatherMidName": "R*D*Y",
                      "fatherLastName": "E*R*D*M*N*P*L*I",
                      "DOB": "2*/*5*1*8*",
                      "companyName": "KOUNDINYA FARMERS PRODUCER COMPANY LIMITED",
                      "DINStatus": "Approved",
                      "DIN": "08798867",
                      "CIN": "U01100AP2018PTC107442",
                      "associationStatus": "Active",
                      "middleName": "*"
                    }
                  ],
                  "message": "Data fetched Successfully"
                },
                "responseStatus": "SUCCESS"
              }
            ],
            "error": "false",
            "code": "200",
            "message": "Success"
          }
        }
      }
      const resData = result?.data;
      customLog(req?.LogTraceId, "info", { result: resData });

      const thirdPartyResponse = resData?.response?.[0];
      const responseStatus = thirdPartyResponse?.responseStatus;
      // const responseMessage = thirdPartyResponse?.message?.text;
      // const statusCode = resData?.data?.status_cd;
      const alankitErrorCode = resData?.error?.error_cd


      // Check for refundable error cases
      const shouldRefund =
        responseStatus === "ERROR" || // MCA/03 failure
        alankitErrorCode === "ALNAUTH01" || alankitErrorCode === "ALNGEN04"

      if (shouldRefund) {
        updateDetails = {
          corporateTxnId,
          status: "FAILURE",
          providerId: result?.data?.reference_id || "Not Available",
          message: "Verification Failed",
          errorCode: "Unknown",
          registeredById: req.user.registeredBy,
        };
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          const refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }

        return next(new ErrorResponse("Corporate verification failed. Refunded.", 400));
      }

      customLog(req?.LogTraceId, "info", { result: resData });

      // Proceed normally if successful
      updateDetails = {
        corporateTxnId,
        providerId: result?.data.reference_id || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          InputDetails: {
            CIN,
            VerificationType: "Director Verify CIN",
            Accesskey: accessKey,
          },
          Result: resData
        })
      };
    } catch (error) {
      // Timeout or other network error fallback
      customLog(req?.LogTraceId, "error", { error: error });
      await refundWalletTransaction(updateDetails);
      return next(new ErrorResponse("Director verification failed. Refunded due to request error.", 500));
    }
    const type = operatorsData['directorCIN']['type']
    const maskedCIN = CIN ? `${CIN.slice(0,4)}XXXXXX` : "XXXXXX";
    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        transactionId: corporateTxnId,
        amount: amount,
      };

      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedCIN} was completed. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {

      const notificationData = {
        notificationTitle: `Verification failed`,
        notificationBrief: `The ${type} verification for ${maskedCIN} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while verifying CIN", 500))
  }
});

exports.fetchDirectorDetailsDIN = asyncHandler(async (req, res, next) => {
  try {
    const { DIN, payCashback = false } = req.body;
    const { id: credentialId, corporateId: corporateUserId, packageId } = req.user;
    const accessKey = operatorsData['directorDIN']['accessKey'];

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });

    if (serviceDetails.error) {
      return next(new ErrorResponse(serviceDetails.error, 400));
    }

    const {
      commissionType,
      cashbackType,
      providerCommission,
      cashback: corporateCashback,
      id: serviceOperatorId,
      surcharge,
      unitPrice: amount
    } = serviceDetails;

    const transactionId = Date.now();
    const providerId = transactionId;
    const corporateTxnId = Date.now();

    const transactionResponse = await createWalletTransaction({
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
      amount,
    });

    if (transactionResponse?.error) {
      return next(new ErrorResponse(transactionResponse.error, 500));
    }

    let updateDetails = {
      corporateTxnId,
      providerId,
    };

    let result;
    const isProduction = process.env.NODE_ENV === 'production';
    try {
      if (isProduction) {
        const token = await authenticateAlankit(serviceDetails, accessKey);
        if (!token) {
          await refundWalletTransaction(updateDetails);
          return next(new ErrorResponse("Authentication failed", 500));
        }

        const payload = { DIN };
        const config = {
          method: "post",
          url: `${serviceDetails.vendor.healthUrl}/MCA/05`,
          headers: {
            Authorization: `Bearer ${token}`,
            Subscriptionkey: serviceDetails.vendor.optional2,
            'Content-Type': 'application/json',
          },
          data: payload,
        };

        result = await axios(config);
      } else {
        if (!isProduction) {
          customLog(req.LogTraceId, 'info', 'Mock response used. No token generated or API call made.');
        }
        result = {
          data: {
            "response": [
              {
                "response": {
                  "data": [
                    {
                      "firstName": "G*N*S*K*A*G*R*",
                      "lastName": "V*L*E*M*",
                      "fatherFirstName": "P*L*E",
                      "fatherLastName": "D*S*R*D*N",
                      "DOB": "0*/*1*1*7*",
                      "DINStatus": "Approved",
                      "middleName": "*",
                      "fatherMiddleName": "null"
                    }
                  ],
                  "message": "Data fetched Successfully"
                },
                "responseStatus": "SUCCESS"
              }
            ],
            "error": "false",
            "code": "200",
            "message": "Success"
          }
        }
      }
      const resData = result?.data;
      customLog(req?.LogTraceId, "info", { result: resData });

      const thirdPartyResponse = resData?.response?.[0];
      const responseStatus = thirdPartyResponse?.responseStatus;
      // const responseMessage = thirdPartyResponse?.message?.text;
      // const statusCode = resData?.data?.status_cd;
      const alankitErrorCode = resData?.error?.error_cd

      // Check for refundable error cases
      const shouldRefund =
        responseStatus === "ERROR" || // MCA/03 failure
        alankitErrorCode === "ALNAUTH01" || alankitErrorCode === "ALNGEN04" ||
        !resData?.response; // unexpected null

      if (shouldRefund) {
        updateDetails = {
          corporateTxnId,
          status: "FAILURE",
          providerId: result?.data?.reference_id || "Not Available",
          message: "Verification Failed",
          errorCode: "Unknown",
          registeredById: req.user.registeredBy,
        };
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          const refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }

        return next(new ErrorResponse("Corporate verification failed. Refunded.", 400));
      }

      customLog(req?.LogTraceId, "info", { result: resData });

      // Proceed normally if successful
      updateDetails = {
        corporateTxnId,
        providerId: result?.data.reference_id || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          InputDetails: {
            DIN,
            VerificationType: "Director Verify DIN",
            Accesskey: accessKey,
          },
          Result: resData
        })
      };
    } catch (error) {
      // Timeout or other network error fallback
      customLog(req?.LogTraceId, "error", { error: error });
      await refundWalletTransaction(updateDetails);
      return next(new ErrorResponse("Director verification failed. Refunded due to request error.", 500));
    }
    const type = operatorsData['directorDIN']['type']
    const maskedDIN = DIN ? `${DIN.slice(0,4)}XXXXXX` : "XXXXXX";
    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        transactionId: corporateTxnId,
        amount: amount,
      };

      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedDIN} was completed. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {

      const notificationData = {
        notificationTitle: `Verification failed`,
        notificationBrief: `The ${type} verification for ${maskedDIN} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while verifying DIN", 500))
  }
});

exports.fetchPanGstinDetails = asyncHandler(async (req, res, next) => {
  try {
    const data = req.body;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const accessKey = operatorsData['panGstin']['accessKey']
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    let commissionType = serviceDetails.commissionType;
    let cashbackType = serviceDetails.cashbackType;
    let providerCommission = serviceDetails.providerCommission;
    let corporateCashback = serviceDetails.cashback;
    let serviceOperatorId = serviceDetails.id;
    let surcharge = serviceDetails.surcharge;
    const payCashback = req.body.payCashback || false;
    const transactionId = new Date().valueOf();
    let providerId = transactionId;

    let amount = serviceDetails.unitPrice;
    // first we will  do transaction

    let corporateTxnId = new Date().valueOf();
    const commonParams = {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
    };

    const transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
      return next(new ErrorResponse(transactionResponse["error"], 500));
    }

    const payload = {
      ...data,
      verification_id: `verif_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`.slice(0, 50)
    }
    let config = {
      method: 'post',
      url: `${serviceDetails.vendor.apiUrl}/verification/pan-gstin`,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': serviceDetails.vendor.optional1,
        'x-client-secret': serviceDetails.vendor.optional2,
      },
      data: payload
    };
    customLog(req?.LogTraceId, "info", { config: config })
    let result
    try {
      result = await axios(config);
      customLog(req?.LogTraceId, "info", { result: result?.data })
    } catch (error) {
      const status = error?.response?.status || 500;
      const data = error?.response?.data || {};
      result = { status, data };
      customLog(req?.LogTraceId, "error", { error: result });
    }
    let updateDetails = {};

    if (result?.status >= 200 && result?.status < 300) {
      updateDetails = {
        corporateTxnId,
        providerId: result?.data.reference_id || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          InputDetails: {
            ...data,
            VerificationType: "GSTIN with PAN",
            Accesskey: accessKey,
          },
          Result: result?.data
        })
      };
    } else {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: result?.data?.reference_id || "Not Available",
        message: "Verification Failed",
        errorCode: "Unknown",
        registeredById: req.user.registeredBy,
      };

      // ✅ Only refund if response status is 400 or greater
      if (result?.status >= 400) {
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          const refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }
      }
    }
    const type = operatorsData['panGstin']['type']
    const maskedPAN = data.pan ? `${data.pan.slice(0,4)}XXXXXX` : "XXXXXX";

    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        transactionId: corporateTxnId,
        amount: amount,
      };
      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedPAN} was completed. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {

      const notificationData = {
        notificationTitle: `Verification failed`,
        notificationBrief: `The ${type} verification for ${maskedPAN} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Payment Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while fetching gstin from pan", 500))
  }
})
exports.verifyAadhaarOtp = asyncHandler(async (req, res, next) => {
  try {
    const data = req.body;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const accessKey = operatorsData['aadharVerify']['accessKey']
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    let commissionType = serviceDetails.commissionType;
    let cashbackType = serviceDetails.cashbackType;
    let providerCommission = serviceDetails.providerCommission;
    let corporateCashback = serviceDetails.cashback;
    let serviceOperatorId = serviceDetails.id;
    let surcharge = serviceDetails.surcharge;
    const payCashback = req.body.payCashback || false;
    const transactionId = new Date().valueOf();
    let providerId = transactionId;
    let amount = serviceDetails.unitPrice;
    // first we will  do transaction

    let corporateTxnId = new Date().valueOf();
    const commonParams = {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
    };

    const transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
      return next(new ErrorResponse(transactionResponse["error"], 500));
    }

    const payload = {
      ...data,
      verification_id: `verif_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`.slice(0, 50)
    }
    let config = {
      method: 'post',
      url: `${serviceDetails.vendor.apiUrl}/verification/offline-aadhaar/otp`,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': serviceDetails.vendor.optional1,
        'x-client-secret': serviceDetails.vendor.optional2,
      },
      data: payload
    };
    customLog(req?.LogTraceId, "info", { config: config })
    let result
    let errorMessage
    try {
     
      result = await axios(config);
      customLog(req?.LogTraceId, "info", {message:"response from verifyAadharOtp", result: result?.data })
    } catch (error) {
      customLog(req?.LogTraceId, "error", { error: error,message:"error from verifyAadharOtp" });
      errorMessage=error?.response?.data?.message||error?.response?.data?.data?.error?.message
      const status = error?.response?.status || 500;
      const data = error?.response?.data || {};
      result = { status, data };
      customLog(req?.LogTraceId, "error", { error: result });
    }
    let updateDetails = {};

    if (result?.data.status === 'SUCCESS') {
      updateDetails = {
        corporateTxnId,
        providerId: result?.data.ref_id || "Not Available",
        // status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          InputDetails: {
            ...data,
            VerificationType: "Aadhar Card",
            Accesskey: accessKey,
          }
        })
      };
    } else {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: result?.data.ref_id || "Not Available",
        message: result?.data.message || "Verification Failed",
        errorCode: "Unknown",
        registeredById: req.user.registeredBy,
      };

      // ✅ Refund only if response status is 400 or more
      if (result?.status >= 400) {
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          let refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }
      }
    }

    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ref_id: result?.data.ref_id,
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        },
        message: result?.data.message,
        responseCode: "000",
      });
    } else {
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });
       customLog(req?.LogTraceId, "info", { message: "checking error message in verifyOtp",data:errorMessage })

      if(errorMessage==="Otp generated for this aadhaar, please try after some time"){
        errorMessage="Verification is still pending. Please wait a moment and try again. "
      }else{
        errorMessage="Verification Failed"
      }

      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: errorMessage,
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error,message: "logging error message in verifyOtp" })
    next(new ErrorResponse("Something went wrong while verfying Aadhaar", 500))
  }
})

exports.verifyAadhaar = asyncHandler(async (req, res, next) => {
  try {
    const data = req.body;
    const { ref_id } = data;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const accessKey = operatorsData['aadharVerify']['accessKey']
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    let amount = serviceDetails.unitPrice;
    const order = await findOneOrderbyProviderId({
      ref_id
    })
    const payload = {
      ...data,
      ref_id: order.providerId,
    }
    let errorMessage
    let config = {
      method: 'post',
      url: `${serviceDetails.vendor.apiUrl}/verification/offline-aadhaar/verify`,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': serviceDetails.vendor.optional1,
        'x-client-secret': serviceDetails.vendor.optional2,
      },
      data: payload
    };
    customLog(req?.LogTraceId, "info", { config: config })
    let result
    try {
   
      result = await axios(config);

      customLog(req?.LogTraceId, "info", {message:"response from verifyAadhar", result: result?.data })
    } catch (error) {
       customLog(req?.LogTraceId, "error", { error: error,message:"check error for verifyAadhar" });
      errorMessage=error?.response?.data?.message||error?.response?.data?.data?.error?.message
      const status = error?.response?.status || 500;
      const data = error?.response?.data || {};
      result = { status, data };
      customLog(req?.LogTraceId, "error", { error: result });
    }
    let updateDetails = {};


    const orderResponse = JSON.parse(order.orderResponse)
    if (result?.status >= 200 && result?.status < 300) {
      updateDetails = {
        corporateTxnId: order.corporateTxnId,
        providerId: result?.data.reference_id || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          ...orderResponse,
          Result: result?.data
        })
      }
    } else {
      updateDetails = {
        corporateTxnId: order.corporateTxnId,
        status: "FAILURE",
        // providerId: result?.data.reference_id || "Not Available",
        message: "Verfication Failed",
        errorCode: "Unknown",
        registeredById: req.user.registeredBy,
      };
      if (result?.status >= 400) {
        if (Object.hasOwn(req.body, "paymentGatewayResponse")) {
          let refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
          if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(updateDetails);
          }
        } else {
          await refundWalletTransaction(updateDetails);
        }
      }
    }

    const type = operatorsData['aadharVerify']['type']
    const maskedAadhaar = orderResponse.InputDetails.aadhaar_number ? `${orderResponse.InputDetails.aadhaar_number.slice(0,4)}XXXXXX` : "XXXXXX";
    const walletDetails = await wallet.findOne({
      where: {
        credentialId,
      },
      attributes: ["balance"],
    });
    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      const paymentDetails = {
        transactionId: order.corporateTxnId,
        datetime: new Date(),
        amount: amount,
      };
      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedAadhaar} was completed. ₹ ${paymentDetails.amount} has been deducted from your wallet.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
          corporateTxnId: order.corporateTxnId,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Payment Successfull",
        responseCode: "000",
      });
    } else {

      const notificationData = {
        notificationTitle: `Verification failed`,
        notificationBrief: `The ${type} verification for ${maskedAadhaar} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
       customLog(req?.LogTraceId, "info", { message: "checking error message in verifyadhar",data:errorMessage })

      if(errorMessage==="Verification attempt failed"|| errorMessage==="OTP entered is invalid"){
        errorMessage="Incorrect OTP, Please enter correct OTP."
      }else{
        errorMessage="Verification Failed"
      }


      return res.status(500).json({
        status: false,
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: errorMessage,
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { data: error, message:"logging error in verifyAadhar" })
    next(new ErrorResponse("Something went wrong while verfying aadhar", 500))
  }
})

exports.findAllRecordsOrderListAndCount = asyncHandler(async (req, res, next) => {
  try {
    let {
      searchText,
      page,
      status,
      itemsPerPage,
      from,
      to
    } = req.query
    let corporateId = req.user.id

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let column = req.query.sortField || "createdAt";
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
      status,
      column,
      corporateId,
      subCorporateUserId,
      from,
      to
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
    console.log(error)
    next(new ErrorResponse(error.message, 500));
  }
})
exports.verificationGeneratePDF = asyncHandler(async (req, res, next) => {


  let { from, to, searchText,status } = req.query;
  const credentialId = req.user.id

  const sort = req.query.sort === 'DESC' ? 'DESC' : 'ASC';
  let sortField = req.query.sortField || 'createdAt'

  let params = {
      from,
      to,
      searchText,
      sort,
      sortField,
      status,
      credentialId
  }
  const data = await verificationTransactionsExcelCSVCorporate(params);

  if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500))
  }
  const templateDetails = {
      title: 'Verifications Report'
  }
  const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);
  let random = new Date().valueOf();

  // Create a browser instance with Puppeteer
  const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Set content to the page
  await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' });

  // Generate PDF using Puppeteer
  const outputFile = `report-${random}.pdf`;
  await page.pdf({
      scale: 0.7 ,
      path: outputFile,
      format: 'A4',
      preferCSSPageSize: true
  });

  customLog(req?.LogTraceId, "info", { message: "PDF generated successfully!" })

  const buffer = fs.readFileSync(outputFile);

  browser.close();

  fs.unlinkSync(outputFile);

  return res.status(200).json({
      status: true,
      message: 'report generated successfully.',
      data: {
          buffer,
          fileType: 'application/pdf'
      },
      responseCode: '000'
  });
})
exports.verificationGenerateExcelCSV = asyncHandler(async (req, res, next) => {

  let { from, to, searchText,status } = req.query;
  const {type} = req.params
  const credentialId = req.user.id


   const sort =  req.query.sort === 'ASC' ? 'ASC' : 'DESC';
   let sortField = req.query.sortField || 'createdAt'

  let params = {
      from,
      to,
      searchText,
      sort,
      sortField,
      status,
      credentialId
  }
  const data = await verificationTransactionsExcelCSVCorporate(params);
  if (!data) {
  return next(new ErrorResponse(`Something went wrong while generating report`, 500))
} else if (data.length < 1) {
  return next(new ErrorResponse(`No data is available for export`, 500))
  } else {
      const {buffer, fileType} = await generateExcelBufferAndType(data,type)
      return res.status(200).json({
          'status': true,
          'data': {buffer, fileType},
          'message': 'Fetched excel/csv datas successfully',
          'responseCode': '000'
      })
  }
})

exports.getVerificationPrice = asyncHandler(async (req, res, next) => {
  try {
    const accessKeys = ["bank_account_verify", "aadhar_ocr_verify", "gstin_pan", "gstin_verify", "aadhar_verify", "pan_verify", "advance_pan_verify", "dl_verify", "voter_id_verify", "passport_verify", "cin_verify", "ifsc_verify", "director_verify_din", "director_verify_cin", "corporate_verify", "gst_business_verify", "gst_return_check"]

    const accessKeyToType = Object.values(operatorsData).reduce((map, entry) => {
      if (entry?.accessKey) map[entry.accessKey] = entry.type ?? null;
      return map;
    }, {});

    const serviceNames = {};
    for (const accessKey of accessKeys) {
      serviceNames[accessKey] = accessKeyToType[accessKey] ?? null;
    }

    return res.status(200).json({
      status: true,
      data: serviceNames,
      'message': 'Fetched service names successfully',
      'responseCode': '000'
    });

  } catch (error) {
    next(new ErrorResponse(error.message, 500));
  }
})