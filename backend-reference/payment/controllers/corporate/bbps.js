/* eslint-disable no-prototype-builtins */
/* eslint-disable no-undef */
const axios = require("axios");
const { create, findAllTickets, findOneTicket } = require("../../models/use-cases/support");
const { XMLParser, XMLBuilder } = require("fast-xml-parser");

const asyncHandler = require("./../../middlewares/async");
const ErrorResponse = require("./../../utils/error-response");
const { fetchServiceDetails, findServiceOperatorByAccessKey } = require("../../utils/checkAndFetchServiceDetails");
// const { createWalletTransaction } = require('../../utils/walletTransaction');
const { setValue, getValue } = require("../../utils/cacheDataMethods");
const { upsertBillerData, findRecordByBillerId, findByCategory } = require("../../models/use-cases/billerMDM");
const { customLog } = require("../../utils/loggerHelper");
const { generateRequestId, encrypt, decrypt } = require("../../utils/billPayments_utils");
const { findOneWithCredentialId, update: corporateUserUpdate } = require("../../models/use-cases/corporateUser");
const { findAllBbpsTransactions } = require("../../models/use-cases/transaction");
const supportSAccessKey = "freshdesk";
const operatorsData = require("../../utils/operatorsData.json");
// const { callExternalApiWithAuth } = require("./whitelistIpByPass");

const accessKey = operatorsData["billavenue"]["accessKey"];
const BATCH_SIZE = 2000;

//list all billers
exports.billers = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  // cacheBillerInfo([])
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse(serviceDetails["error"], 500));
  }
  let categoryName = "";
  if (req.query.categoryName) {
    categoryName = req.query.categoryName;
  }
  const searchQuery = String(req.query.searchText || "").trim().toLowerCase();

  try {
    let billersArray = await getBillerByCategory(categoryName, serviceDetails.vendor);

    if (categoryName == "Electricity") {
      if (req.query.state) {
        billersArray = billersArray.filter((item) => item.coverage === `IND-${req.query.state}`);
      }
    }

    if (searchQuery) {
      billersArray = billersArray.filter((item) => {
        const billerName = String(item?.billerName || item?.blr_name || "").toLowerCase();
        const billerCategory = String(item?.billerCategory || item?.blr_category_name || "").toLowerCase();
        const billerId = String(item?.billerId || item?.blr_id || "").toLowerCase();
        return (
          billerName.includes(searchQuery) ||
          billerCategory.includes(searchQuery) ||
          billerId.includes(searchQuery)
        );
      });
    }

    billersArray.sort((a, b) => {
      const aName = String(a?.billerName || a?.blr_name || "");
      const bName = String(b?.billerName || b?.blr_name || "");
      return aName.localeCompare(bName, "en", { sensitivity: "base" });
    });

    const totalCount = billersArray.length;
    const fetchAll = String(req.query.fetchAll || "false").toLowerCase() === "true";
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.itemsPerPage, 10) || 500, 1), 2000);
    const offset = (page - 1) * limit;
    const paginatedBillers = fetchAll ? billersArray : billersArray.slice(offset, offset + limit);

    return res.status(200).json({
      status: true,
      data: {
        billersArray: paginatedBillers,
        pagination: {
          totalCount,
          page: fetchAll ? 1 : page,
          limit: fetchAll ? totalCount : limit,
          hasMore: fetchAll ? false : offset + paginatedBillers.length < totalCount,
          fetchAll,
        },
      },
      message: "Fetched Billers successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error });

    return res.status(500).json({
      status: false,
      data: {},
      message: error.message,
      responseCode: "001",
    });
  }
});

exports.transactionStatusCheck = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId;
  const payBillRequestBody = {
    trackType: "TRANS_REF_ID",
    trackValue: req.body.txnRefId,
  };
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse(serviceDetails["error"], 500));
  }

  try {
    const apiBaseUrl = serviceDetails.vendor.apiUrl;
    const encryptionKey = serviceDetails.vendor.optional4;
    if (!encryptionKey) {
      return next(new ErrorResponse("Encryption key not configured", 500));
    }
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });

    let xmlPayload = builder.build({ transactionStatusReq: payBillRequestBody });
    xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;
    const encRequest = encrypt(xmlPayload, encryptionKey);
    customLog(req?.LogTraceId, "info", { message: "XML PAYLOAD transactionStatusCheck", xmlPayload }, "VENDOR");
    const response = await axios.post(`${apiBaseUrl}/billpay/transactionStatus/fetchInfo/xml`, encRequest, {
      headers: { "Content-Type": "application/xml" },
    });
    customLog(req?.LogTraceId, "info", { message: "response from transactionStatusCheck API", response: response?.data }, "VENDOR");

    let encryptedData = response.data;
    if (typeof encryptedData !== 'string') {
      if (typeof encryptedData === 'object' && encryptedData !== null) {
        encryptedData = encryptedData.response || encryptedData.data || JSON.stringify(encryptedData);
      } else {
        encryptedData = String(encryptedData);
      }
    }
    
    const decryptedResponse = decrypt(encryptedData, encryptionKey);
    const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
    const parsedResponse = parser.parse(decryptedResponse);
    customLog(
      req?.LogTraceId,
      "info",
      { message: "decrypted and parsed response from transactionStatusCheck API", decryptedResponse, parsedResponse },
      "VENDOR"
    );
    return res.status(200).json({
      status: true,
      data: { parsedResponse },
      message: "Transaction Status fetched successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error });

    return res.status(500).json({
      status: false,
      data: {},
      message: error.message,
      responseCode: "001",
    });
  }
});
//for fetching bill details from bbps
exports.fetchBillFromApi = async (config, jsonPayload, logTraceId = null) => {
  try {
    const mobileNumber = jsonPayload?.inputParams?.input?.paramName === 'Mobile Number'
      ? jsonPayload.inputParams.input.paramValue
      : null;

    const requestId = generateRequestId();
    const apiBaseUrl = config.apiUrl;
    const encryptionKey = config.optional4;
    if (!encryptionKey) {
      throw new Error("Encryption key not configured");
    }
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    let xmlPayload = builder.build({ billFetchRequest: jsonPayload });
    xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;
    const encRequest = encrypt(xmlPayload, encryptionKey);
    const data = {
      accessCode: config.optional3,
      requestId: requestId,
      encRequest: encRequest,
      ver: config.optional2,
      instituteId: config.optional1,
    };
    customLog(logTraceId, "info", { message: "XML PAYLOAD fetchBill", xmlPayload, requestId, mobileNumber }, "VENDOR");
    const parameters = new URLSearchParams(data).toString();
    customLog(logTraceId, "info", { url: `${apiBaseUrl}billpay/extBillCntrl/billFetchRequest/xml`, parameters, message:"Before making api request to fetch bill api" }, "VENDOR");
    const configs={
      method: "POST",
      url: `${apiBaseUrl}billpay/extBillCntrl/billFetchRequest/xml`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: parameters,
    }
    // testing api for working locally
    // const response= await callExternalApiWithAuth(configs)

    const response = await axios(configs);
    const httpStatus = response.status;
    customLog(logTraceId, "info", { message: "response from fetchbill api recieved in encrypted format", requestId }, "VENDOR");

    const rawData = response.data;
    let decryptedResponse;
    // Vendor occasionally returns plain XML for compliance errors (e.g. BVR008) instead of the usual encrypted payload
    if (typeof rawData === "string" && rawData.trimStart().startsWith("<")) {
      decryptedResponse = rawData;
    } else {
      let encryptedData = rawData;
      if (typeof encryptedData !== "string") {
        if (typeof encryptedData === "object" && encryptedData !== null) {
          encryptedData = encryptedData.response || encryptedData.data || JSON.stringify(encryptedData);
        } else {
          encryptedData = String(encryptedData);
        }
      }
      decryptedResponse = decrypt(encryptedData, encryptionKey);
    }

    const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, trimValues: false });
    const parsedResponse = parser.parse(decryptedResponse);
    customLog(logTraceId, "info", { message: "decrypted and parsed response from fetchbill api", decryptedResponse, parsedResponse }, "VENDOR");

    // Wrap so the real httpStatus is attached to whichever branch returns.
    const fetchResult = (() => {
    if (parsedResponse && parsedResponse?.billFetchResponse && parsedResponse?.billFetchResponse?.responseCode === "000") {
      parsedResponse.billFetchResponse.billerResponse.billAmountInPaise = parsedResponse.billFetchResponse.billerResponse.billAmount;
      parsedResponse.billFetchResponse.billerResponse.billAmount = (
        parseFloat(parsedResponse.billFetchResponse.billerResponse.billAmount) / 100
      ).toFixed(2);
      return {
        status: true,
        data: {
          ...parsedResponse.billFetchResponse?.billerResponse,
          additionalInfo: parsedResponse.billFetchResponse?.additionalInfo,
          requestId,
        },
        message: "Bill Fetched Successfully!!",
        responseCode: "000",
      };
    } else {
      // Vendor returned a billValidationResponse root instead of billFetchResponse (plain XML compliance errors)
      const complianceCode = parsedResponse?.billValidationResponse?.complianceCode;
      if (complianceCode) {
        const NO_BILL_COMPLIANCE_CODES = ["BVR008"];
        return {
          status: false,
          data: parsedResponse.billValidationResponse,
          message: NO_BILL_COMPLIANCE_CODES.includes(complianceCode)
            ? "Payment received for the billing period. No outstanding balance due."
            : "Something went wrong while fetching balance. Please ensure your account is active or contact support if the issue persists.",
          responseCode: "001",
        };
      }

      const errorInfo = parsedResponse?.billFetchResponse?.errorInfo;
      const error = errorInfo?.error;
      const errorCode = error?.errorCode;
      const responseReason = String(parsedResponse?.billFetchResponse?.responseReason || "").toUpperCase();
      const responseMessage = String(parsedResponse?.billFetchResponse?.message || "").toUpperCase();
      const vendorErrorMessage = String(error?.errorMessage || "").toUpperCase();
      const isNoBillDue =
        errorCode === "BFR004" ||
        responseReason.includes("BFR004") ||
        responseReason.includes("NO BILL") ||
        responseReason.includes("NO OUTSTANDING") ||
        responseReason.includes("PAYMENT RECEIVED") ||
        responseMessage.includes("BFR004") ||
        responseMessage.includes("NO BILL") ||
        responseMessage.includes("NO OUTSTANDING") ||
        responseMessage.includes("PAYMENT RECEIVED") ||
        vendorErrorMessage.includes("BFR004") ||
        vendorErrorMessage.includes("NO BILL") ||
        vendorErrorMessage.includes("NO OUTSTANDING") ||
        vendorErrorMessage.includes("PAYMENT RECEIVED");
      
      if (!errorCode) {
        if (isNoBillDue) {
          return {
            status: false,
            data: parsedResponse?.billFetchResponse,
            message: "Payment received for the billing period. No outstanding balance due.",
            responseCode: "001",
          };
        }
        return {
          status: false,
          data: parsedResponse?.billFetchResponse || {},
          message: "Something went wrong while fetching balance. Please ensure your account is active or contact support if the issue persists.",
          responseCode: "001",
        };
      }
      
      if (isNoBillDue) {
        return {
          status: false,
          data: parsedResponse?.billFetchResponse,
          message: "Payment received for the billing period. No outstanding balance due.",
          responseCode: "001",
        }
        // throw new Error("Payment received for the billing period. No outstanding balance due.");
      } else if (errorCode === 'BFR001') {
        return {
          status: false,
          data: parsedResponse?.billFetchResponse,
          message: "The account number you entered is invalid. Please double-check the details and try again.",
          responseCode: "001",
        }
      } else if (errorCode === 'BFR005') {
        return {
          status: false,
          data: parsedResponse?.billFetchResponse,
          message: "This account is blocked or closed. Please contact your service provider.",
          responseCode: "001",
        }
      } else if (errorCode === 'BFR022') {
        return {
          status: false,
          data: parsedResponse?.billFetchResponse,
          message: "Invalid Vehicle Registration Number. Please check and try again.",
          responseCode: "001",
        }
      } else if (errorCode === 'BFR002') {
        return {
          status: false,
          data: parsedResponse?.billFetchResponse,
          message: "Please check the details entered and try again.",
          responseCode: "001",
        }
      } else if (errorCode === 'BFR058') {
        // Refill-schedule notice: the vendor message carries the customer's last
        // delivery date and next available booking date, so surface it verbatim.
        return {
          status: false,
          data: parsedResponse?.billFetchResponse,
          message: error?.errorMessage || "A refill was recently delivered. Please check your next available booking date and try again later.",
          responseCode: "001",
        }
      } else if (errorCode === 'E002') {
        return {
          status: false,
          data: parsedResponse?.billFetchResponse,
          message: "Mobile number is invalid",
          responseCode: "001",
        }
        // throw new Error(`Mobile number is invalid`);
      } else {
        return {
          status: false,
          data: parsedResponse?.billFetchResponse || {},
          message: "Something went wrong while fetching balance. Please ensure your account is active or contact support if the issue persists.",
          responseCode: "001",
        };
      }
      // return {
      //   status: false,
      //   data: parsedResponse?.billFetchResponse,
      //   message: "Something went wrong while fetching bill",
      //   responseCode: "001",
      // };
    }
    })();
    return { ...fetchResult, httpStatus };
  } catch (error) {
    customLog(
      logTraceId,
      "error",
      { message: "error from fetchBillFromApi", error: error?.response?.data || error?.response || error },
      "VENDOR"
    );
    // null = no response received (network/timeout), so no status code.
    const apiError = new Error("Something went wrong while fetching balance. Please ensure your account is active or contact support if the issue persists.");
    apiError.httpStatus = error?.response?.status ?? null;
    throw apiError;

    // return {
    //   status: false,
    //   data: {},
    //   message: error?.response?.data?.error?.message || "Something went wrong while fetching bill",
    //   responseCode: "001",
    // };
  }
};

exports.billValidationApi = async (config, jsonPayload, logTraceId = null) => {
  try {
    const requestId = generateRequestId();
    const apiBaseUrl = config.apiUrl;
    const encryptionKey = config.optional4;
    if (!encryptionKey) {
      throw new Error("Encryption key not configured");
    }

    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    let xmlPayload = builder.build({ billValidationRequest: jsonPayload });
    xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;
    const encRequest = encrypt(xmlPayload, encryptionKey);
    const data = {
      accessCode: config.optional3,
      requestId,
      encRequest,
      ver: config.optional2,
      instituteId: config.optional1,
    };
    const parameters = new URLSearchParams(data).toString();
    const configs = {
      method: "POST",
      url: `${apiBaseUrl}billpay/extBillValCntrl/billValidationRequest/xml`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: parameters,
    };

    customLog(logTraceId, "info", { message: "XML PAYLOAD billValidation", requestId, xmlPayload }, "VENDOR");
    // const response = await callExternalApiWithAuth(configs);
    const response = await axios(configs);
    customLog(logTraceId, "info", { message: "response from billValidation api received in encrypted format", requestId }, "VENDOR");

    let encryptedData = response.data;
    if (typeof encryptedData !== "string") {
      if (typeof encryptedData === "object" && encryptedData !== null) {
        encryptedData = encryptedData.response || encryptedData.data || JSON.stringify(encryptedData);
      } else {
        encryptedData = String(encryptedData);
      }
    }

    const decryptedResponse = decrypt(encryptedData, encryptionKey);
    // trimValues:false preserves whitespace inside vendor-supplied billerResponse fields,
    // which must be echoed byte-for-byte in the subsequent paymentApi call (BLR007 retry
    // flow). Trimming triggers E211 "billerResponse value mismatch" on payment.
    const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, trimValues: false });
    const parsedResponse = parser.parse(decryptedResponse);
    customLog(logTraceId, "info", { message: "decrypted and parsed response from billValidation api", decryptedResponse, parsedResponse }, "VENDOR");

    if (parsedResponse?.billValidationResponse?.responseCode === "000") {
      return {
        status: true,
        data: { ...parsedResponse.billValidationResponse, requestId },
        message: parsedResponse.billValidationResponse?.responseReason || "Bill validated successfully",
        responseCode: "000",
      };
    }

    const complianceCode = parsedResponse?.billValidationResponse?.complianceCode;
    if (complianceCode === "BVR005") {
      return {
        status: false,
        data: parsedResponse?.billValidationResponse,
        message: "The entered amount is invalid. Please enter a valid amount and try again.",
        responseCode: "001",
      };
    }

    const valErrorInfo = parsedResponse?.billValidationResponse?.errorInfo;
    const valError = valErrorInfo?.error;
    const valErrorCode = valError?.errorCode;

    if (!valErrorCode) {
      throw new Error(
        "Something went wrong while fetching balance. Please ensure your account is active or contact support if the issue persists."
      );
    }

    if (valErrorCode === "BFR004") {
      return {
        status: false,
        data: parsedResponse?.billValidationResponse,
        message: "Payment received for the billing period. No outstanding balance due.",
        responseCode: "001",
      };
    } else if (valErrorCode === "BFR001") {
      return {
        status: false,
        data: parsedResponse?.billValidationResponse,
        message: "The account number you entered is invalid. Please double-check the details and try again.",
        responseCode: "001",
      };
    } else if (valErrorCode === "BFR005") {
      return {
        status: false,
        data: parsedResponse?.billValidationResponse,
        message: "This account is blocked or closed. Please contact your service provider.",
        responseCode: "001",
      };
    } else if (valErrorCode === "E002") {
      return {
        status: false,
        data: parsedResponse?.billValidationResponse,
        message: "Account number is invalid",
        responseCode: "001",
      };
    } else if (valErrorCode === "BFR022") {
      return {
        status: false,
        data: parsedResponse?.billValidationResponse,
        message: "Invalid Vehicle Registration Number. Please check and try again.",
        responseCode: "001",
      };
    } else if (valErrorCode === "BFR002") {
      return {
        status: false,
        data: parsedResponse?.billValidationResponse,
        message: "Please check the details entered and try again.",
        responseCode: "001",
      };
    } else {
      throw new Error(
        parsedResponse?.billValidationResponse?.responseReason ||
        parsedResponse?.billValidationResponse?.message ||
        valError?.errorMessage ||
        "Something went wrong while fetching balance. Please ensure your account is active or contact support if the issue persists."
      );
    }
  } catch (error) {
    customLog(
      logTraceId,
      "error",
      { message: "error from billValidationApi", error: error?.response?.data || error?.response || error },
      "VENDOR"
    );
    throw new Error(
       "Something went wrong while fetching balance. Please ensure your account is active or contact support if the issue persists."
    );
  }
};

// for payment
exports.paymentApi = async (config, jsonPayload, prevReqId, logTraceId = null) => {
  try {
    jsonPayload.amountInfo.amount = Math.round(parseFloat(jsonPayload.amountInfo.amount) * 100);
    if (jsonPayload?.billerResponse?.billAmountInPaise) {
      jsonPayload.billerResponse.billAmount = jsonPayload.billerResponse.billAmountInPaise;
      delete jsonPayload.billerResponse.billAmountInPaise;
    }
    customLog(logTraceId, "info", { jsonPayload, message: "payload for bbps payment in json" });
    const requestId = prevReqId ? prevReqId : generateRequestId();
    const apiBaseUrl = config.apiUrl;
    const encryptionKey = config.optional4;
    if (!encryptionKey) {
      throw new Error("Encryption key not configured");
    }
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    let xmlPayload = builder.build({ billPaymentRequest: jsonPayload });
    xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;
    const encRequest = encrypt(xmlPayload, encryptionKey);
    customLog(logTraceId, "info", { message: "XML PAYLOAD payment", xmlPayload }, "VENDOR");
    const data = {
      accessCode: config.optional3,
      requestId: requestId,
      encRequest: encRequest,
      ver: config.optional2,
      instituteId: config.optional1,
    };
    const parameters = new URLSearchParams(data).toString();
    const configs={
      method: "POST",
      url: `${apiBaseUrl}billpay/extBillPayCntrl/billPayRequest/xml`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: parameters,
    }

    // api for testing locally without whitelisting ip
    // const response= await callExternalApiWithAuth(configs)

    customLog(logTraceId, "info", { configs, message: "config passes to payment api", requestId}, "VENDOR");
    const response = await axios(configs);
    customLog(logTraceId, "info", { message: "response recieved payment api, before decrypting" }, "VENDOR");
    
    let encryptedData = response.data;
    if (typeof encryptedData !== 'string') {
      if (typeof encryptedData === 'object' && encryptedData !== null) {
        encryptedData = encryptedData.response || encryptedData.data || JSON.stringify(encryptedData);
      } else {
        encryptedData = String(encryptedData);
      }
    }
    
    const decryptedResponse = decrypt(encryptedData, encryptionKey);

    const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
    const parsedResponse = parser.parse(decryptedResponse);
    customLog(
      logTraceId,
      "info",
      { message: "parsed and decrypted response from payment api", parsedResponse: JSON.stringify(parsedResponse), decryptedResponse },
      "VENDOR"
    );
    const extResp = parsedResponse?.ExtBillPayResponse;
    const isReversalType = extResp?.txnRespType === "REVERSAL TYPE RESPONSE";
    const isAwaited = extResp?.txnStatus === "AWAITED";
    if (extResp && extResp.responseCode === "000" && !isReversalType) {
      return {
        status: true,
        data: { ...extResp, message: "Payment Successful" },
      };
    } else if (isAwaited) {
      return {
        status: false,
        awaited: true,
        data: { ...extResp, message: "Payment Awaited" },
      };
    } else {
      return {
        status: false,
        data: { ...extResp, message: isReversalType ? "Payment reversed by biller" : "paymentApi Controller else case" },
      };
    }
  } catch (error) {
    customLog(logTraceId, "error", { message: error?.message ?? "Error from paymentApi", error: error }, "VENDOR");
    return {
      status: false,
      data: { message: error.message || "Something went wrong" },
    };
  }
};

//list all biller categories
exports.category = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse(serviceDetails["error"], 400));
  }
  let getToken = await token(serviceDetails.vendor);
  let URL = serviceDetails.vendor.apiUrl;
  let url = `${URL}/categories`;
  let config = {
    method: "get",
    url: url,
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      Authorization: `Bearer ${getToken}`,
    },
  };
  axios(config)
    .then(async function (response) {
      return res.status(200).json({
        status: true,
        data: response.data,
        message: "Fetched categories successfully",
        responseCode: "000",
      });
    })
    .catch(function (error) {
      customLog(req?.LogTraceId, "error", { error });

      return res.status(200).json({
        status: false,
        data: {},
        message: error.message,
        responseCode: "001",
      });
    });
});

exports.getABiller = (async ({credentialId, packageId, corporateUserId, billerId}) => {

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (serviceDetails.hasOwnProperty("error")) {
    return false;
  }

  try {
    let biller = await getBillerByBillerID(billerId, serviceDetails.vendor);



    return biller;
  } catch (error) {
    return false;
  }
});

async function token(details) {
  try {
    let isTokenData = await getValue("bbps_token");
    if (isTokenData) {
      return isTokenData;
    } else {
      let data = JSON.stringify({
        clientId: details["optional1"],
        secret: details["optional2"],
      });

      let config = {
        method: "post",
        url: `${details["optional4"]}auth/token`,
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };

      let response = await axios(config);
      if (response && response.data && response.data.token) {
        let tokenData = response.data.token;
        let expiry = response.data.expiresIn;
        await setValue(`bbps_token`, expiry, tokenData);
        return tokenData;
      } else {
        return false;
      }
    }
  } catch (error) {
    return false;
  }
}

async function checkService() {
  const serviceDetails = await findServiceOperatorByAccessKey(supportSAccessKey);
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return serviceDetails;
  }
  let apiUrl = serviceDetails.vendor.apiUrl;

  return {
    client_id: serviceDetails.vendor.optional1,
    API_URL: apiUrl,
  };
}

//for bbps complaint register
exports.dispute = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId;
    const requestId = generateRequestId();
    const txnRefId = req.body.txnRefId;

    // Validate that txnRefId is provided
    if (!txnRefId) {
      customLog(req?.LogTraceId, "error", { message: "txnRefId is required for complaint registration" }, "VENDOR");
      return next(new ErrorResponse("Transaction reference ID is required", 400));
    }

    // Check if transaction is at least 24 hours old
    try {
      const { findOneByTxnRefIdInOrderResponse } = require("../../models/use-cases/order");
      const transactionOrder = await findOneByTxnRefIdInOrderResponse(txnRefId);
      
      if (!transactionOrder) {
        customLog(req?.LogTraceId, "error", { message: "Transaction not found", txnRefId }, "VENDOR");
        return next(new ErrorResponse("Transaction not found. Please check the transaction reference ID.", 400));
      }

      const transactionDate = new Date(transactionOrder.transactionDate);
      const now = new Date();
      const hoursDifference = (now - transactionDate) / (1000 * 60 * 60); // Convert milliseconds to hours

      if (hoursDifference < 24) {
        const hoursRemaining = Math.ceil(24 - hoursDifference);
        customLog(req?.LogTraceId, "info", { 
          message: "Complaint registration attempted before 24 hours", 
          txnRefId, 
          transactionDate: transactionDate.toISOString(),
          hoursDifference: hoursDifference.toFixed(2),
          hoursRemaining 
        }, "VENDOR");
        return next(new ErrorResponse(`You can register a complaint only after 24 hours from the transaction time. Please try again after ${hoursRemaining} hour(s).`, 400));
      }

      customLog(req?.LogTraceId, "info", { 
        message: "Transaction is eligible for complaint registration", 
        txnRefId, 
        transactionDate: transactionDate.toISOString(),
        hoursDifference: hoursDifference.toFixed(2) 
      }, "VENDOR");
    } catch (error) {
      customLog(req?.LogTraceId, "error", { 
        message: "Error checking transaction eligibility for complaint", 
        error: error?.message ?? error, 
        txnRefId 
      }, "VENDOR");
      // Continue with complaint registration even if check fails, but log the error
    }

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (serviceDetails.hasOwnProperty("error")) {
      return next(new ErrorResponse(serviceDetails["error"], 400));
    }

    // let getToken = await token(serviceDetails.vendor);

    let URL = serviceDetails.vendor.apiUrl;

    // participationType: req.body.participationType,
    // billerId: req.body.billerId,
    // agentId: serviceDetails.vendor.optional5,
    // complaintType: req.body.complaintType,
    // servReason: req.body.servReason,
    const requestBody = {
      txnRefId: txnRefId,
      complaintDesc: req.body.complaintDesc,
      complaintDisposition: req.body.complaintDisposition,
    };
    customLog(req?.LogTraceId, "info", { requestBody, message: "payload for complaint registration." });
    const encryptionKey = serviceDetails.vendor.optional4;
    if (!encryptionKey) {
      return next(new ErrorResponse("Encryption key not configured", 500));
    }
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    let xmlPayload = builder.build({ complaintRegistrationReq: requestBody });
    xmlPayload = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xmlPayload}`;
    customLog(req?.LogTraceId, "info", { xmlPayload, message: "xml Payload dispute" });
    const encRequest = encrypt(xmlPayload, encryptionKey);
    const data = {
      accessCode: serviceDetails.vendor.optional3,
      requestId: requestId,
      encRequest: encRequest,
      ver: serviceDetails.vendor.optionals?.complaintver ?? "2.0",
      instituteId: serviceDetails.vendor.optional1,
    };

    const parameters = new URLSearchParams(data).toString();

    let url = `${URL}/billpay/extComplaints/register/xml`;

    let config = {
      method: "POST",
      url: url,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: parameters,
    };

    customLog(req?.LogTraceId, "info", { config, message: "API Call for complaintRegistration.", requestId });

    const response = await axios(config);
    // const response = await callExternalApiWithAuth(config);

    customLog(req?.LogTraceId, "info", { message: "response from complaintRegistration API", response: response?.data }, "VENDOR");

    let encryptedData = response.data;
    if (typeof encryptedData !== 'string') {
      if (typeof encryptedData === 'object' && encryptedData !== null) {
        encryptedData = encryptedData.response || encryptedData.data || JSON.stringify(encryptedData);
      } else {
        encryptedData = String(encryptedData);
      }
    }
    
    const decryptedResponse = decrypt(encryptedData, encryptionKey);
    const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
    const parsedResponse = parser.parse(decryptedResponse);
    customLog(
      req?.LogTraceId,
      "info",
      { message: "decrypted and parsed response from complaintRegistration API", parsedResponse, decryptedResponse },
      "VENDOR"
    );

    if (parsedResponse && parsedResponse?.complaintRegistrationResp && parsedResponse?.complaintRegistrationResp?.responseCode === "000") {
      await createMessage(
        // credentialId,
        // packageId,
        req.user,
        { requestBody, ...parsedResponse.complaintRegistrationResp }
      );
      let tranDate = new Date();

      return res.status(200).json({
        status: true,
        data: { transactionDate: tranDate, complaintData: requestBody, ...parsedResponse.complaintRegistrationResp },
        message: "Complaint Registered Successfully!!",
        responseCode: "000",
      });
    } else {
      throw new Error("Something went wrong while registering complaint ");
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "🚀 ~ Error in complaint registration",
      error: error?.response?.data ?? error.response,
    });
    throw new Error(
      error?.response?.data?.error?.message || error?.response || error?.message || "Something went wrong on complaint registration"
    );
  }
});

//bbps complaint Status check
exports.disputeStatus = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const ticketId = req.params.id;
  try {
    const ticket = await findOneTicket({ id: ticketId });
    if (!ticket || !ticket.bbpsSupportHistory) {
      return next(new ErrorResponse("Ticket not found or missing BBPS support history", 404));
    }
    const bbpsSupportHistory = ticket.bbpsSupportHistory;

    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId;
    const requestId = generateRequestId();
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (serviceDetails.hasOwnProperty("error")) {
      return next(new ErrorResponse(serviceDetails["error"], 400));
    }

    let URL = serviceDetails.vendor.apiUrl;
    const requestBody = {
      complaintType: bbpsSupportHistory.requestBody.complaintType,
      complaintId: bbpsSupportHistory.complaintId,
    };
    const encryptionKey = serviceDetails.vendor.optional4;
    if (!encryptionKey) {
      return next(new ErrorResponse("Encryption key not configured", 500));
    }
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    let xmlPayload = builder.build({ complaintTrackingReq: requestBody });
    xmlPayload = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xmlPayload}`;
    customLog(req?.LogTraceId, "info", { xmlPayload,requestId, message: "xml Payload disputeStatus" });
    const encRequest = encrypt(xmlPayload, encryptionKey);
    const data = {
      accessCode: serviceDetails.vendor.optional3,
      requestId: requestId,
      encRequest: encRequest,
      ver: serviceDetails.vendor.optionals?.complaintver ?? "2.0",
      instituteId: serviceDetails.vendor.optional1,
    };
    const parameters = new URLSearchParams(data).toString();

    let url = `${URL}/billpay/extComplaints/track/xml`;

    let config = {
      method: "POST",
      url: url,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: parameters,
    };
    const response = await axios(config);
    customLog(req?.LogTraceId, "info", {requestId, message: "response from complaintRegistration status API", response: response?.data }, "VENDOR");

    let encryptedData = response.data;
    if (typeof encryptedData !== 'string') {
      if (typeof encryptedData === 'object' && encryptedData !== null) {
        encryptedData = encryptedData.response || encryptedData.data || JSON.stringify(encryptedData);
      } else {
        encryptedData = String(encryptedData);
      }
    }
    
    const decryptedResponse = decrypt(encryptedData, encryptionKey);
    const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
    const parsedResponse = parser.parse(decryptedResponse);
    customLog(
      req?.LogTraceId,
      "info",
      { message: "parsed and decrypted response from complaintRegistration status API", decryptedResponse, parsedResponse },
      "VENDOR"
    );
    if (parsedResponse && parsedResponse?.complaintTrackingResp && parsedResponse?.complaintTrackingResp?.responseCode === "000") {
      return res.status(200).json({
        status: true,
        data: { ...parsedResponse.complaintTrackingResp },
        message: "Complaint status fetched Successfully!!",
        responseCode: "000",
      });
    } else {
      throw new Error(parsedResponse?.complaintTrackingResp?.responseReason || "Something went wrong ");
    }
    // customLog(req?.LogTraceId, "info", { data: response.data }, "VENDOR");
    // return response.data;
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "🚀 ~ Error in complaint status check",
      error: error?.response?.data ?? error.response ?? error,
    });
    return res.status(400).json({
      status: false,
      data: {},
      message: "Something went wrong!!",
      responseCode: "001",
    })
  }
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//list all transactions
exports.transactions = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse(serviceDetails["error"], 400));
  }
  let getToken = await token(serviceDetails.vendor);
  let URL = serviceDetails.vendor.apiUrl;
  let url = `${URL}/transactions`;
  let config = {
    method: "get",
    url: url,
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      Authorization: `Bearer ${getToken}`,
    },
  };
  axios(config)
    .then(async function (response) {
      return res.status(200).json({
        status: true,
        data: response.data,
        message: "Fetched transactions successful",
        responseCode: "000",
      });
    })
    .catch(function (error) {
      customLog(req?.LogTraceId, "error", { message: "error form transactions", error });
      return res.status(200).json({
        status: false,
        data: {},
        message: error.message,
        responseCode: "001",
      });
    });
});

//list all complaints
exports.disputes = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse(serviceDetails["error"], 400));
  }
  let getToken = await token(serviceDetails.vendor);
  let URL = serviceDetails.vendor.apiUrl;
  let url = `${URL}/disputes`;
  let config = {
    method: "get",
    url: url,
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      Authorization: `Bearer ${getToken}`,
    },
  };
  axios(config)
    .then(async function (response) {
      return res.status(200).json({
        status: true,
        data: response.data,
        message: "Fetched Disputes Successfully",
        responseCode: "000",
      });
    })
    .catch(function (error) {
      customLog(req?.LogTraceId, "error", { message: "error from disputes", error });
      return res.status(200).json({
        status: false,
        data: {},
        message: error.message,
        responseCode: "001",
      });
    });
});

async function fetchBillerInfo(billerIds, config, logTraceId = null) {
  const apiBaseUrl = config.apiUrl;
  const instituteId = config.optional1;
  const version = config.optional2;
  const accessCode = config.optional3;
  const encryptionKey = config.optional4;
  if (!encryptionKey) {
    customLog(logTraceId, "error", { message: "Encryption key not configured for fetchBillerInfo" });
    return [];
  }
  try {
    const requestId = generateRequestId();
    const jsonPayload = { billerId: billerIds };
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    let xmlPayload = builder.build({ billerInfoRequest: jsonPayload });
    xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;
    customLog(logTraceId, "info", { xmlPayload, message: "xml Payload for billerInfo" });
    const encRequest = encrypt(xmlPayload, encryptionKey);
    const configs={
      method: "POST",
      url: `${apiBaseUrl}billpay/extMdmCntrl/mdmRequestNew/xml?accessCode=${accessCode}&requestId=${requestId}&ver=${version}&instituteId=${instituteId}`,
      headers: { "Content-Type": "application/xml" },
      data: encRequest,
    }
    customLog(
      logTraceId,
      "info",
      {
        configs,
        message: "CONFIG FOR FETCH BILLER INFO",
        requestId,
      },
      "VENDOR"
    );
    // testing api for working locally
    // const response= await callExternalApiWithAuth(configs)
    const response = await axios(configs);

    customLog(logTraceId, "info", { message: "response from billerInfo api:-", response: response?.data }, "VENDOR");

    let encryptedData = response.data;
    if (typeof encryptedData !== 'string') {
      if (typeof encryptedData === 'object' && encryptedData !== null) {
        encryptedData = encryptedData.response || encryptedData.data || JSON.stringify(encryptedData);
      } else {
        encryptedData = String(encryptedData);
      }
    }

    const decryptedResponse = decrypt(encryptedData, encryptionKey);
    const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
    const parsedResponse = parser.parse(decryptedResponse);
    customLog(
      logTraceId,
      "info",
      { message: "decrypted and parsed response from billerInfo api:-", decryptedResponse, parsedResponse },
      "VENDOR"
    );
    if (parsedResponse && parsedResponse?.billerInfoResponse && parsedResponse?.billerInfoResponse?.responseCode === "000") {
      return parsedResponse.billerInfoResponse.biller; // Expecting an array of biller objects
    } else {
      return [];
    }
  } catch (error) {
    customLog(logTraceId, "error", { message: "Error fetching biller info", error: error.response ? error.response.data : error.message });
    return [];
  }
}


/**
 * Fetches billerIds from API in batches and stores each batch in DB immediately.
 * Prevents memory bloat from accumulating large datasets before writing.
 */
async function fetchAndStoreByIds(idsToFetch, config, logTraceId = null) {
  const results = [];
  for (let i = 0; i < idsToFetch.length; i += BATCH_SIZE) {
    const batch = idsToFetch.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    try {
      const billersFromApi = await fetchBillerInfo(batch, config, logTraceId);
      if (billersFromApi && billersFromApi.length > 0) {
        await Promise.all(billersFromApi.map(b => upsertBillerData(b.billerId, b)));
        results.push(...billersFromApi);
        customLog(logTraceId, "info", {
          message: "Biller batch fetched and stored to DB",
          batchNumber,
          count: billersFromApi.length,
          totalStored: results.length
        });
      } else {
        customLog(logTraceId, "info", { message: "Empty batch response from API", batchNumber, batchSize: batch.length });
      }
    } catch (batchError) {
      customLog(logTraceId, "error", {
        message: "Failed to fetch/store biller batch",
        batchNumber,
        batchSize: batch.length,
        error: batchError.message
      });
    }
  }
  return results;
}

async function getBillerByBillerID(billerId, config, logTraceId = null) {
  // Overlay the admin-edited top-level billerName onto the MDM blob, so the
  // corporate side sees the renamed value instead of the raw MDM name.
  const withAdminName = (rec) => {
    if (!rec || !rec.data) return rec ? rec.data : null;
    return rec.billerName ? { ...rec.data, billerName: rec.billerName } : rec.data;
  };

  try {
    const record = await findRecordByBillerId(billerId);
    const hasData = record && record.data && Object.keys(record.data).length > 0;

    if (hasData) {
      customLog(logTraceId, "info", { message: "Biller fetched from DB", billerId });
      return withAdminName(record);
    }

    // Data missing — use category-based fetch when possible to populate related billers
    let idsToFetch = [billerId];
    if (record && record.billerCategory) {
      const categoryRecords = await findByCategory(record.billerCategory);
      const categoryIds = categoryRecords.map(r => r.billerId);
      if (!categoryIds.includes(billerId)) categoryIds.push(billerId);
      idsToFetch = categoryIds;
      customLog(logTraceId, "info", {
        message: "Fetching biller category from API",
        category: record.billerCategory,
        count: idsToFetch.length
      });
    } else {
      customLog(logTraceId, "info", { message: "Fetching single biller from API", billerId });
    }

    await fetchAndStoreByIds(idsToFetch, config, logTraceId);

    const updated = await findRecordByBillerId(billerId);
    if (!updated || !updated.data || Object.keys(updated.data).length === 0) {
      customLog(logTraceId, "info", { message: "Biller not found in API response", billerId });
      return null;
    }
    return withAdminName(updated);
  } catch (error) {
    customLog(logTraceId, "error", { message: "Error in getBillerByBillerID", billerId, error: error.message });
    return null;
  }
}
exports.getBillerByBillerID = getBillerByBillerID;

async function getBillerByCategory(category, config, logTraceId = null) {
  try {
    const records = await findByCategory(!category || category.toLowerCase() === "all" ? null : category);

    // Only show active billers to corporate users
    const activeRecords = records.filter(r => r.status === 'active');

    // Separate records with data from those without
    const withData = activeRecords.filter(r => r.data && Object.keys(r.data).length > 0);
    const missingData = activeRecords.filter(r => !r.data || Object.keys(r.data).length === 0);

    let freshBillers = [];
    if (missingData.length > 0) {
      const missingIds = missingData.map(r => r.billerId);
      customLog(logTraceId, "info", {
        message: "Fetching billers with missing MDM data from API",
        category: category || 'all',
        count: missingIds.length
      });
      freshBillers = await fetchAndStoreByIds(missingIds, config, logTraceId);
    }

    // Admin can rename a biller via updateBillerName, which only sets the top-level
    // billerName column. The MDM blob in `data` still holds the original BillAvenue
    // name, so we overlay the edited name here before returning to the corporate side.
    const overrideMap = new Map(
      activeRecords.filter(r => r.billerName).map(r => [r.billerId, r.billerName])
    );
    const applyOverride = b => {
      if (!b || !b.billerId) return b;
      return overrideMap.has(b.billerId) ? { ...b, billerName: overrideMap.get(b.billerId) } : b;
    };

    const cachedData = withData.map(r => r.data).filter(Boolean).map(applyOverride);
    const freshBillersOverlaid = freshBillers.map(applyOverride);
    customLog(logTraceId, "info", {
      message: "getBillerByCategory completed",
      category: category || 'all',
      fromDB: cachedData.length,
      fromAPI: freshBillersOverlaid.length
    });
    return [...cachedData, ...freshBillersOverlaid];
  } catch (error) {
    customLog(logTraceId, "error", { message: "Error in getBillerByCategory", category, error: error.message });
    return [];
  }
}

async function createMessage(userData, ticketData) {
  const { complaintType, complaintDesc } = ticketData.requestBody;

  let corporateId = userData.id;
  const issueType = complaintType;
  const module = operatorsData.billavenue.category;
  const description = complaintDesc;

  let corporateDetails = await findOneWithCredentialId(corporateId);

  let supportId = corporateDetails.supportId;

  let serviceDetails = await checkService();

  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    console.log("Something went wrong. Please try again later");
  }

  const URL = serviceDetails.API_URL;
  const token = serviceDetails.client_id;

  if (token) {
    let url = `${URL}/api/v2/tickets`;

    const formData = new FormData();

    formData.append("email", userData.email);
    formData.append("name", userData.name);
    formData.append("phone", userData.mobileNo);
    //    formData.append('requester_id', corporateId);

    formData.append("priority", 1);
    formData.append("status", 2);

    formData.append("subject", module);
    formData.append("description", description);
    formData.append("type", issueType);
    formData.append("custom_fields[cf_module]", module);
    formData.append("custom_fields[cf_credential_id]", corporateId);

    if (process.env.NODE_ENV == "production") {
      // Basic Auth credentials- password is not required
      const username = token;
      const password = "A";
      const Token = Buffer.from(`${username}:${password}`, "utf8").toString("base64");

      const config = {
        method: "post",
        url: url,
        headers: {
          ...formData.getHeaders(),
          Authorization: `Basic ${Token}`,
          Accept: "application/json",
        },
        data: formData,
      };
      try {
        let response = await axios(config);

        if (response && (response.status === 200 || response.status === 201) && response.data) {
          let ticket = response.data;
          let requester_id = ticket["requester_id"];
          let ticketId = ticket["id"];

          if (supportId === null || (supportId != requester_id && supportId != null)) {
            await corporateUserUpdate({ corporateId }, { supportId: requester_id }, userData);
          }
          const refId = ticketData;
          const formattedRefId = typeof refId === "object" ? JSON.stringify(refId) : refId;
          const data = {
            issueType,
            module,
            description,
            ticketId,
            corporateUserId: userData.corporateId,
            bbpsSupportHistory: formattedRefId,
          };
          await create(data, userData);
          return true;
        } else {
          // return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
          console.log("Something went wrong. Please try again later");
        }
      } catch (err) {
        customLog(null, "error", { message: err?.message, data: err?.response?.data });
        return res.status(400).json({
          status: false,
          message: "Something went wrong. Please try again later.",
          data: {
            message: err?.response?.data?.description,
          },
          responseCode: "001",
        });
      }
    } else {
      const fakeTicketId = Math.floor(Math.random() * 1000000);
      const refId = ticketData;
      const formattedRefId = typeof refId === "object" ? JSON.stringify(refId) : refId;
      const data = {
        issueType,
        module,
        description,
        ticketId: fakeTicketId,
        corporateUserId: userData.corporateId,
        bbpsSupportHistory: formattedRefId,
      };
      try {
        await create(data, userData);
        console.log("After create function - success!");
      } catch (error) {
        console.error("Error in create function:", error);
        throw new Error("Database insertion failed");
      }
    }
  } else {
    const fakeTicketId = Math.floor(Math.random() * 1000000);
    const refId = ticketData;
    const formattedRefId = typeof refId === "object" ? JSON.stringify(refId) : refId;
    const data = {
      issueType,
      module,
      description,
      ticketId: fakeTicketId,
      corporateUserId: userData.corporateId,
      bbpsSupportHistory: formattedRefId,
    };
    try {
      await create(data, userData);
      console.log("After create function - success!");
    } catch (error) {
      console.error("Error in create function:", error);
      throw new Error("Database insertion failed");
    }
    return true;
  }
}

exports.findAllMessageAndCount = asyncHandler(async (req, res) => {
  let { from, to, searchText, page, itemsPerPage } = req.query;
  let corporateId = req.user.corporateId;

  // Parse page and itemsPerPage to integers (you can also use parseInt)
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage;

  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
    offset = (page - 1) * itemsPerPage;
  }

  let exludeAttribute = ["updatedAt", "systemUserId"];

  let params = {
    from,
    to,
    searchText,
    // sort,
    // filter,
    limit,
    offset,
    corporateId,
    exludeAttribute,
  };

  const messageData = await findAllTickets(params);

  return res.json({
    status: true,
    data: {
      recordsTotal: messageData.count,
      data: messageData.rows,
    },
    message: "Fetched all tickets successfully",
    responseCode: "000",
  });
});

exports.findAllBbpsTransactionsAndCount = asyncHandler(async (req, res, next) => {
  let { from, to, searchText, page, itemsPerPage } = req.query;
  let corporateId = req.user.id;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  const filter = req.query.filter || undefined;

  // Parse page and itemsPerPage to integers
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage;

  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
    offset = (page - 1) * itemsPerPage;
  }

  const bbpsAccessKeys = Object.values(operatorsData)
    .filter(op => op.accessKey && (op.accessKey.startsWith('bbps') || op.accessKey === 'billavenue'))
    .map(op => op.accessKey);

  let sortField = "transactionDate";

  let serviceAttribute = [];
  let credentialAttribute = [];
  let transactionAttribute = [];
  let orderAttribute = ["id", "amountInINR", "paymentMode", "status", "orderResponse", "transactionDate", "corporateTxnId"];

  let params = {
    from,
    to,
    bbpsAccessKeys,
    searchText,
    sort,
    filter,
    limit,
    offset,
    corporateId,
    serviceAttribute,
    credentialAttribute,
    transactionAttribute,
    orderAttribute,
    sortField,
  };

  if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
    params.subCorporateUserId = req.user.subCorporateId;
  }

  const hikeTransactionsData = await findAllBbpsTransactions(params);
  if (!hikeTransactionsData) {
    return next(new ErrorResponse(`Something went wrong while fetching hike transactions from DB`, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: {
        result: hikeTransactionsData.rows,
        totalData: hikeTransactionsData.count,
      },
      message: "Transactions fetched successfully!",
      responseCode: "000",
    });
  }
});
