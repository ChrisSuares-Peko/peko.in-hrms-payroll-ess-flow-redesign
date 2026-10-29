const asyncHandler = require("../../middlewares/async");
const { fetchServiceDetails } = require("../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../../utils/error-response");
const operatorsData = require("../../utils/operatorsData.json");
const axios = require("axios");
const FormData = require("form-data");
const { customLog } = require("../../utils/loggerHelper");
const { createNotification } = require("../../models/use-cases/notification");
const { getValue, setValue } = require("../../utils/cacheDataMethods");
const crypto = require("crypto");
const { findOneCredential } = require("../../models/use-cases/credential");
const { findPackageIdById } = require("../../models/use-cases/corporateUser");
const {
  createVerificationRecord,
  findOneVerificationRecordByReference,
  updateVerificationRecordByReference,
  findAllVerificationRecordsAndCount,
  getVerificationRecordsReportForCorporate
} = require("../../models/use-cases/nupayVerificationRecord");
const { getVerificationServicePricing, getVerificationUsageStatus } = require("../../utils/verificationQuota");
const { findVerificationAddonHistoryAndCount } = require("../../models/use-cases/verificationAddon");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const puppeteer = require('puppeteer');
const fs = require("fs");

const NODE_ENV = process.env.NODE_ENV

const NUPAY_TOKEN_TTL_SECONDS = 15 * 60;
const NUPAY_TOKEN_MISMATCH_CODE = "NP034";
const NUPAY_BANK_ACCOUNT_SUCCESS_CODES = ["NP000", "NP001"];
// Generic vendor/system errors (rate limit, token mismatch, server error) unrelated to whether the
// bank account itself is actually invalid - not worth persisting as a verification record.
const NUPAY_BANK_ACCOUNT_SYSTEM_ERROR_CODES = ["NP032", "NP034", "NP041"];
const NUPAY_PAN_SUCCESS_CODE = "NP000";
const NUPAY_PAN_INVALID_FORMAT_CODE = "NP005";
const NUPAY_GSTIN_SUCCESS_CODE = "NP000";
const NUPAY_GSTIN_BY_PAN_SUCCESS_CODE = "NP000";
// Generic vendor/system errors (auth, token, rate limit, server error) unrelated to whether the
// GSTIN itself is actually invalid - not worth persisting as a verification record.
const NUPAY_SYSTEM_ERROR_CODES = ["NP003", "NP034", "NP041", "NP031", "NP004"];
const NUPAY_AADHAAR_TOKEN_TTL_SECONDS = 15 * 60;

const getNupayAuthToken = async ({ vendor, accessKey, tokenPath, LogTraceId, forceRefresh = false }) => {
  const cacheKey = `nupay_auth_token_${accessKey}`;
  if (!forceRefresh) {
    const cachedToken = await getValue(cacheKey);
    if (cachedToken) return cachedToken;
  }

  const config = {
    method: "get",
    url: `${vendor.apiUrl}${tokenPath}`,
    headers: {
      "api-key": vendor.optional1,
    },
  };
  customLog(LogTraceId, "info", { action: "nupay:getToken:request", url: config.url }, "VENDOR");
  const response = await axios(config);
  const token = response?.data?.token;
  if (!token) {
    throw new Error("Unable to generate Nupay auth token");
  }
  await setValue(cacheKey, NUPAY_TOKEN_TTL_SECONDS, token);
  return token;
};

// Bank Account-specific token fetch - kept separate from getNupayAuthToken (used by PAN/GSTIN/GSTIN-by-PAN)
// rather than parameterizing that shared function, since Bank Account validation lives on a different
// production base URL (vendor.optional5) than the others (same base as them on UAT, where optional5
// isn't set - falls back to vendor.apiUrl there). Mirrors getNupayAuthToken's caching/error logic exactly.
const getNupayBankAccountAuthToken = async ({ vendor, accessKey, tokenPath, LogTraceId, forceRefresh = false }) => {
  const cacheKey = `nupay_auth_token_${accessKey}`;
  if (!forceRefresh) {
    const cachedToken = await getValue(cacheKey);
    if (cachedToken) return cachedToken;
  }

  const baseUrl = vendor.optional5 || vendor.apiUrl;
  const config = {
    method: "get",
    url: `${baseUrl}${tokenPath}`,
    headers: {
      "api-key": vendor.optional1,
    },
  };
  customLog(LogTraceId, "info", { action: "nupay:bankAccount:getToken:request", url: config.url }, "VENDOR");
  const response = await axios(config);
  const token = response?.data?.token;
  if (!token) {
    throw new Error("Unable to generate Nupay auth token");
  }
  await setValue(cacheKey, NUPAY_TOKEN_TTL_SECONDS, token);
  return token;
};

const callNupayAccountVerification = async ({ vendor, token, payload, LogTraceId }) => {
  const form = new FormData();
  form.append("ifsc_code", payload.ifsc_code);
  form.append("accounts", payload.accounts);
  form.append("account_name", payload.account_name);
  form.append("reference_number", payload.reference_number);

  // On UAT, Bank Account validation shares the same base URL as PAN/GSTIN (vendor.apiUrl). On
  // production it lives on a separate domain, stored in vendor.optional5 - fall back to apiUrl when
  // optional5 isn't set (e.g. UAT, where it isn't needed).
  const baseUrl = vendor.optional5 || vendor.apiUrl;

  const config = {
    method: "post",
    url: `${baseUrl}/api/Validate/getAccountVerificationWithIFSC`,
    headers: {
      "api-key": vendor.optional1,
      Token: token,
      ...form.getHeaders(),
    },
    data: form,
  };
  customLog(LogTraceId, "info", { action: "nupay:verifyAccount:request", url: config.url, ifsc_code: payload.ifsc_code }, "VENDOR");
  const response = await axios(config);
  customLog(LogTraceId, "info", { action: "nupay:verifyAccount:response", data: response?.data }, "VENDOR");
  return response;
};

const callNupayPanVerification = async ({ vendor, token, payload, LogTraceId }) => {
  const config = {
    method: "post",
    url: `${vendor.apiUrl}/api/ValidatePan/verifyPan`,
    headers: {
      "api-key": vendor.optional1,
      Token: token,
      "Content-Type": "application/json",
    },
    data: {
      pan: payload.pan,
      name: payload.name,
      date_of_birth: payload.date_of_birth,
    },
  };
  customLog(LogTraceId, "info", { action: "nupay:verifyPan:request", url: config.url }, "VENDOR");
  const response = await axios(config);
  customLog(LogTraceId, "info", { action: "nupay:verifyPan:response", data: response?.data }, "VENDOR");
  return response;
};

const callNupayGstinVerification = async ({ vendor, token, payload, LogTraceId }) => {
  const form = new FormData();
  form.append("gst_in", payload.gst_in);

  const config = {
    method: "post",
    url: `${vendor.apiUrl}/api/ValidatePan/serarchGstIn`,
    headers: {
      "api-key": vendor.optional1,
      Token: token,
      ...form.getHeaders(),
    },
    data: form,
  };
  customLog(LogTraceId, "info", { action: "nupay:verifyGstin:request", url: config.url, gst_in: payload.gst_in }, "VENDOR");
  const response = await axios(config);
  customLog(LogTraceId, "info", { action: "nupay:verifyGstin:response", data: response?.data }, "VENDOR");
  return response;
};

const callNupayGstinByPanVerification = async ({ vendor, token, payload, LogTraceId }) => {
  const config = {
    method: "post",
    url: `${vendor.apiUrl}/api/v2/gstbypan`,
    headers: {
      "api-key": vendor.optional1,
      token,
      requestId: payload.requestId,
      "Content-Type": "application/json",
    },
    data: {
      pan_no: payload.pan_no,
      state_code: payload.state_code,
    },
  };
  customLog(LogTraceId, "info", { action: "nupay:gstinByPan:request", url: config.url, pan_no: payload.pan_no, state_code: payload.state_code }, "VENDOR");
  const response = await axios(config);
  customLog(LogTraceId, "info", { action: "nupay:gstinByPan:response", data: response?.data }, "VENDOR");
  return response;
};

const getNupayAadhaarToken = async ({ vendor, accessKey, LogTraceId, forceRefresh = false }) => {
  const cacheKey = `nupay_auth_token_${accessKey}`;
  if (!forceRefresh) {
    const cachedToken = await getValue(cacheKey);
    if (cachedToken) return cachedToken;
  }

  const config = {
    method: "post",
    url: `${vendor.healthUrl}/auth/v1/generate`,
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      apiKey: vendor.optional3,
      clientSecret: vendor.optional4,
      clientID: vendor.optional2,
    },
  };
  customLog(LogTraceId, "info", { action: "nupay:aadhaar:getToken:request", url: config.url }, "VENDOR");
  const response = await axios(config);
  const token = response?.data?.token;
  if (!token) {
    throw new Error("Unable to generate Nupay Aadhaar auth token");
  }
  await setValue(cacheKey, NUPAY_AADHAAR_TOKEN_TTL_SECONDS, token);
  return token;
};

const callNupayGenerateAadhaarLink = async ({ vendor, token, payload, LogTraceId }) => {
  const config = {
    method: "post",
    url: `${vendor.healthUrl}/kyc/aadhaar/v1/generateUrl`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: {
      reference_number: payload.reference_number,
      name: payload.name,
      email: payload.email,
      mobile: payload.mobile,
    },
  };
  customLog(LogTraceId, "info", { action: "nupay:aadhaar:generateLink:request", url: config.url, reference_number: payload.reference_number }, "VENDOR");
  const response = await axios(config);
  customLog(LogTraceId, "info", { action: "nupay:aadhaar:generateLink:response", data: response?.data }, "VENDOR");
  return response;
};

const callNupayGetAadhaarDetails = async ({ vendor, token, payload, LogTraceId }) => {
  const config = {
    method: "post",
    url: `${vendor.healthUrl}/kyc/aadhaar/v1/getDetails`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: {
      reference_number: payload.reference_number,
      transaction_id: payload.transaction_id,
    },
  };
  customLog(LogTraceId, "info", { action: "nupay:aadhaar:getDetails:request", url: config.url, reference_number: payload.reference_number }, "VENDOR");
  const response = await axios(config);
  customLog(LogTraceId, "info", { action: "nupay:aadhaar:getDetails:response", data: { ...response?.data, photoBase64: undefined } }, "VENDOR");
  return response;
};

exports.verifyBankAccountV2 = asyncHandler(async (req, res, next) => {
  try {
    const accessKey = operatorsData['bankAccount']['accessKey']
    const data = req.body;
    const { accounts, ifsc_code, account_name } = data;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = (await findPackageIdById(corporateUserId)) ?? req.user.packageId;
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    const vendor = serviceDetails.vendor;

    const usage = await getVerificationUsageStatus({ credentialId, corporateUserId, packageId });
    if (usage.exhausted) {
      return next(new ErrorResponse("You have used all your free verifications. Please purchase an add-on to continue.", 400));
    }

    const nupayPayload = {
      ifsc_code,
      accounts,
      account_name,
      reference_number: crypto.randomBytes(5).toString("hex").toUpperCase(),
    };

    let result;
    try {
      let token = await getNupayBankAccountAuthToken({ vendor, accessKey, tokenPath: "/Auth/token", LogTraceId: req?.LogTraceId });
      let response;
      try {
        response = await callNupayAccountVerification({ vendor, token, payload: nupayPayload, LogTraceId: req?.LogTraceId });
      } catch (error) {
        if (error?.response?.data?.StatusCode === NUPAY_TOKEN_MISMATCH_CODE) {
          token = await getNupayBankAccountAuthToken({ vendor, accessKey, tokenPath: "/Auth/token", LogTraceId: req?.LogTraceId, forceRefresh: true });
          response = await callNupayAccountVerification({ vendor, token, payload: nupayPayload, LogTraceId: req?.LogTraceId });
        } else {
          throw error;
        }
      }
      result = { status: response.status, data: response.data };
    } catch (error) {
      const status = error?.response?.status || 500;
      const errData = error?.response?.data || {};
      result = { status, data: errData };
      customLog(req?.LogTraceId, "error", { error: result }, "VENDOR");
    }

    const isVerified = result?.status >= 200 && result?.status < 300 && NUPAY_BANK_ACCOUNT_SUCCESS_CODES.includes(result?.data?.StatusCode);
    const type = operatorsData['bankAccount']['type']
    const maskedBankAccount = accounts
      ? `${accounts.slice(0, 4)}XXXXXXX`
      : 'XXXXXXX';
    // StatusDesc isn't always a string - some codes (e.g. NP011) return it as an empty array, which
    // is truthy in JS and would otherwise bypass the `|| fallback` default, sending a blank message
    // to the frontend. Only use it when it's actually a non-empty string.
    const statusDescMessage = typeof result?.data?.StatusDesc === 'string' && result?.data?.StatusDesc
      ? result.data.StatusDesc
      : null;

    // Skip persisting a record when there's no real Nupay StatusCode at all (e.g. a misconfigured
    // vendor URL hitting the wrong host entirely, returning a generic web-server 404 with no
    // StatusCode) - that's not a genuine verification result, just the request infrastructure
    // failing before it ever reached Nupay's actual API. Also skip known generic vendor/system
    // errors (see NUPAY_BANK_ACCOUNT_SYSTEM_ERROR_CODES) - those aren't about this bank account being
    // invalid either. A real Nupay verdict (valid or invalid, e.g. NP002) still gets recorded.
    const shouldRecordVerification = isVerified || (
      Boolean(result?.data?.StatusCode) && !NUPAY_BANK_ACCOUNT_SYSTEM_ERROR_CODES.includes(result?.data?.StatusCode)
    );

    if (shouldRecordVerification) {
      createVerificationRecord({
        accessKey,
        verificationType: type,
        credentialId,
        corporateUserId,
        packageId,
        referenceNumber: nupayPayload.reference_number,
        status: isVerified ? 'VALID' : 'INVALID',
        inputPayload: { ifsc_code, accounts, account_name },
        responsePayload: result?.data,
        errorCode: isVerified ? null : (result?.data?.StatusCode || "Unknown"),
        message: statusDescMessage,
      }).catch((error) => customLog(req?.LogTraceId, "error", { action: "verificationRecord:createFailed", error: error.message }, "VENDOR"));
    }

    if (isVerified) {
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedBankAccount} was completed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      return res.status(200).json({
        status: true,
        data: {
          accountHolderName: result?.data?.BankResponse,
          isNameMatched: result?.data?.IsMatched,
          matchPercentage: result?.data?.Percentage,
          utr: result?.data?.UTR,
        },
        message: statusDescMessage || "Verification Successful",
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

      return res.status(500).json({
        status: false,
        data: {
          errorCode: result?.data?.StatusCode || "Unknown",
        },
        message: statusDescMessage || "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while verfying bank account", 500))
  }
})

exports.verifyPanV2 = asyncHandler(async (req, res, next) => {
  try {
    const accessKey = operatorsData['pan']['accessKey']
    const data = req.body;
    const { pan, name, date_of_birth } = data;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = (await findPackageIdById(corporateUserId)) ?? req.user.packageId;
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    const vendor = serviceDetails.vendor;

    const usage = await getVerificationUsageStatus({ credentialId, corporateUserId, packageId });
    if (usage.exhausted) {
      return next(new ErrorResponse("You have used all your free verifications. Please purchase an add-on to continue.", 400));
    }

    const nupayPayload = { pan, name, date_of_birth };

    let result;
    try {
      let token = await getNupayAuthToken({ vendor, accessKey, tokenPath: "/Auth/token", LogTraceId: req?.LogTraceId });
      let response;
      try {
        console.log("token is here",token)
        response = await callNupayPanVerification({ vendor, token, payload: nupayPayload, LogTraceId: req?.LogTraceId });
      } catch (error) {
        console.log("error is here",error)

        if (error?.response?.data?.StatusCode === NUPAY_TOKEN_MISMATCH_CODE) {
          token = await getNupayAuthToken({ vendor, accessKey, tokenPath: "/Auth/token", LogTraceId: req?.LogTraceId, forceRefresh: true });
          response = await callNupayPanVerification({ vendor, token, payload: nupayPayload, LogTraceId: req?.LogTraceId });
        } else {
          throw error;
        }
      }
      result = { status: response.status, data: response.data };
    } catch (error) {
      const status = error?.response?.status || 500;
      const errData = error?.response?.data || {};
      result = { status, data: errData };
      customLog(req?.LogTraceId, "error", { error: result }, "VENDOR");
    }

    const isVerified = result?.status >= 200 && result?.status < 300 && result?.data?.StatusCode === NUPAY_PAN_SUCCESS_CODE;
    const panResult = isVerified && typeof result?.data?.StatusDesc === "object" ? result.data.StatusDesc : null;
    const failureMessage = typeof result?.data?.StatusDesc === "string" ? result.data.StatusDesc : "Verification Failed";
    // isVerified only means the vendor call itself succeeded (PAN record found) - the actual
    // valid/invalid verdict (name/DOB match) is nested one level deeper in panResult.status, so a
    // "found but mismatched" result must still be recorded as INVALID, not VALID.
    const isPanValid = isVerified && String(panResult?.status).toLowerCase() === 'valid';
    const type = operatorsData['pan']['type']
    const maskedPan = pan ? `${pan.slice(0, 4)}XXXXXX` : 'XXXXXX';

    // Vendor call failures span a wide range of unrelated system errors (token mismatch, auth
    // failure, rate limit, internal server error, etc.) - only NP005 (invalid PAN format) reflects
    // something actually wrong with this specific input, so that's the only failure code worth
    // persisting as a verification record. Real success and the found-but-mismatched case (isVerified
    // true, panStatus invalid) are unrelated to this and are always recorded as before.
    const shouldRecordVerification = isVerified || result?.data?.StatusCode === NUPAY_PAN_INVALID_FORMAT_CODE;

    if (shouldRecordVerification) {
      createVerificationRecord({
        accessKey,
        verificationType: type,
        credentialId,
        corporateUserId,
        packageId,
        status: isPanValid ? 'VALID' : 'INVALID',
        inputPayload: { pan, name, date_of_birth },
        responsePayload: result?.data,
        errorCode: isPanValid ? null : (panResult?.status || result?.data?.StatusCode || "Unknown"),
        message: isPanValid ? null : (panResult ? (panResult.remarks || 'PAN verification did not match') : failureMessage),
      }).catch((error) => customLog(req?.LogTraceId, "error", { action: "verificationRecord:createFailed", error: error.message }, "VENDOR"));
    }

    if (isVerified) {
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedPan} was completed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      return res.status(200).json({
        status: true,
        data: {
          panStatus: panResult?.status,
          remarks: panResult?.remarks,
          nameMatch: panResult?.name_as_per_pan_match,
          dateOfBirthMatch: panResult?.date_of_birth_match,
        },
        message: "Verification Successful",
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

      return res.status(500).json({
        status: false,
        data: {
          errorCode: result?.data?.StatusCode || "Unknown",
        },
        message: failureMessage,
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while verfying pan", 500))
  }
})

exports.verifyGstinV2 = asyncHandler(async (req, res, next) => {
  try {
    const { gst_in } = req.body;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = (await findPackageIdById(corporateUserId)) ?? req.user.packageId;
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
    const vendor = serviceDetails.vendor;

    const usage = await getVerificationUsageStatus({ credentialId, corporateUserId, packageId });
    if (usage.exhausted) {
      return next(new ErrorResponse("You have used all your free verifications. Please purchase an add-on to continue.", 400));
    }

    const nupayPayload = { gst_in };

    let result;
    try {
      let token = await getNupayAuthToken({ vendor, accessKey, tokenPath: "/Auth/token", LogTraceId: req?.LogTraceId });
      let response;
      try {
        response = await callNupayGstinVerification({ vendor, token, payload: nupayPayload, LogTraceId: req?.LogTraceId });
      } catch (error) {
        if (error?.response?.data?.StatusCode === NUPAY_TOKEN_MISMATCH_CODE) {
          token = await getNupayAuthToken({ vendor, accessKey, tokenPath: "/Auth/token", LogTraceId: req?.LogTraceId, forceRefresh: true });
          response = await callNupayGstinVerification({ vendor, token, payload: nupayPayload, LogTraceId: req?.LogTraceId });
        } else {
          throw error;
        }
      }
      result = { status: response.status, data: response.data };
    } catch (error) {
      const status = error?.response?.status || 500;
      const errData = error?.response?.data || {};
      result = { status, data: errData };
      customLog(req?.LogTraceId, "error", { error: result }, "VENDOR");
    }

    const isVerified = result?.status >= 200 && result?.status < 300 && result?.data?.StatusCode === NUPAY_GSTIN_SUCCESS_CODE;
    const gstinResult = isVerified && typeof result?.data?.StatusDesc === "object" ? result.data.StatusDesc : null;
    const failureMessage = typeof result?.data?.StatusDesc === "string" ? result.data.StatusDesc : "Verification Failed";
    const type = operatorsData['gstinBusiness']['type']
    const maskedGSTIN = gst_in ? `${gst_in.slice(0, 4)}XXXXXX` : "XXXXXX";

    // Skip persisting a record for generic vendor/system errors (see NUPAY_SYSTEM_ERROR_CODES) - those
    // aren't about this GSTIN being invalid, just the API call itself failing.
    const shouldRecordVerification = isVerified || !NUPAY_SYSTEM_ERROR_CODES.includes(result?.data?.StatusCode);

    if (shouldRecordVerification) {
      createVerificationRecord({
        accessKey,
        verificationType: type,
        credentialId,
        corporateUserId,
        packageId,
        status: isVerified ? 'VALID' : 'INVALID',
        inputPayload: { gst_in },
        responsePayload: result?.data,
        errorCode: isVerified ? null : (result?.data?.StatusCode || "Unknown"),
        message: isVerified ? null : failureMessage,
      }).catch((error) => customLog(req?.LogTraceId, "error", { action: "verificationRecord:createFailed", error: error.message }, "VENDOR"));
    }

    if (isVerified) {
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedGSTIN} was completed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      return res.status(200).json({
        status: true,
        data: {
          ...gstinResult,
        },
        message: "Verification Successful",
        responseCode: "000",
      });
    } else {
      const notificationData = {
        notificationTitle: "Verification Failed",
        notificationBrief: `The ${type} verification for ${maskedGSTIN} was failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      return res.status(500).json({
        status: false,
        data: {
          errorCode: result?.data?.StatusCode || "Unknown",
        },
        message: failureMessage,
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while verifying GSTIN", 500))
  }
})

exports.verifyGstinByPanV2 = asyncHandler(async (req, res, next) => {
  try {
    const { pan_no, state_code } = req.body;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = (await findPackageIdById(corporateUserId)) ?? req.user.packageId;
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
    const vendor = serviceDetails.vendor;

    const usage = await getVerificationUsageStatus({ credentialId, corporateUserId, packageId });
    if (usage.exhausted) {
      return next(new ErrorResponse("You have used all your free verifications. Please purchase an add-on to continue.", 400));
    }

    const nupayPayload = { pan_no, state_code, requestId: crypto.randomUUID() };

    let result;
    try {
      let token = await getNupayAuthToken({ vendor, accessKey, tokenPath: "/Auth/token", LogTraceId: req?.LogTraceId });
      let response;
      try {
        response = await callNupayGstinByPanVerification({ vendor, token, payload: nupayPayload, LogTraceId: req?.LogTraceId });
      } catch (error) {
        if (error?.response?.data?.StatusCode === NUPAY_TOKEN_MISMATCH_CODE) {
          token = await getNupayAuthToken({ vendor, accessKey, tokenPath: "/Auth/token", LogTraceId: req?.LogTraceId, forceRefresh: true });
          response = await callNupayGstinByPanVerification({ vendor, token, payload: nupayPayload, LogTraceId: req?.LogTraceId });
        } else {
          throw error;
        }
      }
      result = { status: response.status, data: response.data };
    } catch (error) {
      const status = error?.response?.status || 500;
      const errData = error?.response?.data || {};
      result = { status, data: errData };
      customLog(req?.LogTraceId, "error", { error: result }, "VENDOR");
    }

    const isVerified = result?.status >= 200 && result?.status < 300 && result?.data?.StatusCode === NUPAY_GSTIN_BY_PAN_SUCCESS_CODE;
    // StatusDesc here is an array (unlike Validate GSTIN's plain object) - the actual company details
    // are nested one level deeper, at StatusDesc[0].data, per the vendor's own sample response.
    const statusDescEntry = Array.isArray(result?.data?.StatusDesc) ? result.data.StatusDesc[0] : null;
    const gstinByPanResult = isVerified ? statusDescEntry?.data : null;
    const failureMessage = typeof result?.data?.StatusDesc === "string" ? result.data.StatusDesc : "Verification Failed";
    const type = operatorsData['panGstin']['type']
    const maskedPan = pan_no ? `${pan_no.slice(0, 4)}XXXXXX` : 'XXXXXX';

    // Skip persisting a record for generic vendor/system errors (see NUPAY_SYSTEM_ERROR_CODES) - those
    // aren't about this PAN/GSTIN lookup being invalid, just the API call itself failing.
    const shouldRecordVerification = isVerified || !NUPAY_SYSTEM_ERROR_CODES.includes(result?.data?.StatusCode);

    if (shouldRecordVerification) {
      createVerificationRecord({
        accessKey,
        verificationType: type,
        credentialId,
        corporateUserId,
        packageId,
        status: isVerified ? 'VALID' : 'INVALID',
        inputPayload: { pan_no, state_code },
        responsePayload: result?.data,
        errorCode: isVerified ? null : (result?.data?.StatusCode || "Unknown"),
        message: isVerified ? null : failureMessage,
      }).catch((error) => customLog(req?.LogTraceId, "error", { action: "verificationRecord:createFailed", error: error.message }, "VENDOR"));
    }

    if (isVerified) {
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedPan} was completed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      return res.status(200).json({
        status: true,
        data: {
          ...gstinByPanResult,
        },
        message: "Verification Successful",
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

      return res.status(500).json({
        status: false,
        data: {
          errorCode: result?.data?.StatusCode || "Unknown",
        },
        message: failureMessage,
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while fetching GSTIN by PAN", 500))
  }
})

const sanitizeAadhaarPayload = (data) => {
  if (!data || typeof data !== "object") return data;
  // eslint-disable-next-line no-unused-vars
  const { photoBase64, ...rest } = data;
  return rest;
};

const isTokenAuthError = (error) => [401, 403].includes(error?.response?.status);

// Called from the polling endpoint and the webhook once Nupay reports a final (non-pending) status.
// Skips (idempotent) if the stored record has already been settled, so a duplicate webhook/poll is a no-op.
exports.finalizeAadhaarVerificationV2 = async ({ record, nupayData }) => {
  if (record.status !== "PENDING") {
    return { settled: false, status: record.status === "VALID" ? "success" : "failed", alreadySettled: true };
  }

  const status = nupayData?.status;
  if (status === "pending") {
    return { settled: false, status: "pending" };
  }

  const credentialDetails = await findOneCredential({ id: record.credentialId }, ["username"]);
  const username = credentialDetails?.username;

  if (status !== "success") {
    await updateVerificationRecordByReference(record.referenceNumber, {
      status: "INVALID",
      errorCode: nupayData?.statusCode || "Unknown",
      message: nupayData?.message || null,
      responsePayload: sanitizeAadhaarPayload(nupayData),
    });

    if (username) {
      createNotification({
        notificationTitle: "Verification Failed",
        notificationBrief: `The Aadhaar verification for reference ${record.referenceNumber} failed.`,
        notificationTo: [username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      });
    }
    return { settled: true, status: "failed" };
  }

  await updateVerificationRecordByReference(record.referenceNumber, {
    status: "VALID",
    message: nupayData?.message || null,
    responsePayload: sanitizeAadhaarPayload(nupayData),
  });

  if (username) {
    createNotification({
      notificationTitle: "Verification Completed: Aadhaar",
      notificationBrief: `The Aadhaar verification for reference ${record.referenceNumber} was completed.`,
      notificationTo: [username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    });
  }

  return { settled: true, status: "success" };
};

exports.generateAadhaarLinkV2 = asyncHandler(async (req, res, next) => {
  try {
    const { name, email, mobile } = req.body;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = (await findPackageIdById(corporateUserId)) ?? req.user.packageId;
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
    const vendor = serviceDetails.vendor;

    const usage = await getVerificationUsageStatus({ credentialId, corporateUserId, packageId });
    if (usage.exhausted) {
      return next(new ErrorResponse("You have used all your free verifications. Please purchase an add-on to continue.", 400));
    }

    const referenceNumber = crypto.randomBytes(5).toString("hex").toUpperCase();
    const linkPayload = { reference_number: referenceNumber, name, email, mobile };

    let response;
    try {
      let token = await getNupayAadhaarToken({ vendor, accessKey, LogTraceId: req?.LogTraceId });
      try {
        response = await callNupayGenerateAadhaarLink({ vendor, token, payload: linkPayload, LogTraceId: req?.LogTraceId });
      } catch (error) {
        if (isTokenAuthError(error)) {
          token = await getNupayAadhaarToken({ vendor, accessKey, LogTraceId: req?.LogTraceId, forceRefresh: true });
          response = await callNupayGenerateAadhaarLink({ vendor, token, payload: linkPayload, LogTraceId: req?.LogTraceId });
        } else {
          throw error;
        }
      }
    } catch (error) {
      customLog(req?.LogTraceId, "error", { error: error?.response?.data || error.message }, "VENDOR");
      return next(new ErrorResponse(error?.response?.data?.message || "Unable to generate Aadhaar verification link", 500));
    }

    const data = response?.data;
    if (data?.status !== "success") {
      return next(new ErrorResponse(data?.message || "Unable to generate Aadhaar verification link", 400));
    }

    await createVerificationRecord({
      accessKey,
      verificationType: operatorsData['aadharVerify']['type'],
      referenceNumber,
      transactionId: data.transaction_id,
      credentialId,
      corporateUserId,
      packageId,
      status: "PENDING",
      inputPayload: { name, email, mobile },
    });

    return res.status(200).json({
      status: true,
      data: {
        referenceNumber,
        transactionId: data.transaction_id,
        link: data?.result?.link,
      },
      message: "Aadhaar verification link generated successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while generating Aadhaar verification link", 500))
  }
})

exports.getAadhaarDetailsV2 = asyncHandler(async (req, res, next) => {
  try {
    const { reference_number } = req.body;
    const credentialId = req.user.id;
    const record = await findOneVerificationRecordByReference(reference_number, credentialId);
    if (!record) {
      return next(new ErrorResponse("Aadhaar verification request not found", 404));
    }

    if (record.status !== "PENDING") {
      const isSuccess = record.status === "VALID";
      return res.status(isSuccess ? 200 : 500).json({
        status: isSuccess,
        data: record.responsePayload || {},
        message: isSuccess ? "Aadhaar details verified" : "Verification Failed",
        responseCode: isSuccess ? "000" : "001",
      });
    }

    const accessKey = operatorsData['aadharVerify']['accessKey']
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId: req.user.packageId,
      corporateUserId: req.user.corporateId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400))
    }
    const vendor = serviceDetails.vendor;
    const detailsPayload = { reference_number, transaction_id: record.transactionId };

    let response;
    try {
      let token = await getNupayAadhaarToken({ vendor, accessKey, LogTraceId: req?.LogTraceId });
      try {
        response = await callNupayGetAadhaarDetails({ vendor, token, payload: detailsPayload, LogTraceId: req?.LogTraceId });
      } catch (error) {
        if (isTokenAuthError(error)) {
          token = await getNupayAadhaarToken({ vendor, accessKey, LogTraceId: req?.LogTraceId, forceRefresh: true });
          response = await callNupayGetAadhaarDetails({ vendor, token, payload: detailsPayload, LogTraceId: req?.LogTraceId });
        } else {
          throw error;
        }
      }
    } catch (error) {
      customLog(req?.LogTraceId, "error", { error: error?.response?.data || error.message }, "VENDOR");
      return next(new ErrorResponse("Something went wrong while fetching Aadhaar details", 500));
    }

    const nupayData = response?.data;

    if (nupayData?.status === "pending") {
      return res.status(200).json({
        status: true,
        data: { status: "pending" },
        message: nupayData?.message || "Validation in process, check after some time",
        responseCode: "002",
      });
    }

    // The webhook can settle this record while the vendor call above was in flight - re-check
    // fresh from the DB before finalizing, so we never process the same verification twice (once
    // from the webhook, once from this poll) or clobber whichever one settled it first.
    const latestRecord = await findOneVerificationRecordByReference(reference_number, credentialId);
    if (latestRecord && latestRecord.status !== "PENDING") {
      const isSuccess = latestRecord.status === "VALID";
      return res.status(isSuccess ? 200 : 500).json({
        status: isSuccess,
        data: latestRecord.responsePayload || {},
        message: isSuccess ? "Aadhaar details verified" : "Verification Failed",
        responseCode: isSuccess ? "000" : "001",
      });
    }

    const result = await exports.finalizeAadhaarVerificationV2({ record: latestRecord || record, nupayData });

    if (result.settled && result.status === "success") {
      return res.status(200).json({
        status: true,
        data: sanitizeAadhaarPayload(nupayData),
        message: "Aadhaar details verified",
        responseCode: "000",
      });
    }

    return res.status(500).json({
      status: false,
      data: { errorCode: nupayData?.statusCode || "Unknown" },
      message: nupayData?.message || "Verification Failed",
      responseCode: "001",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while fetching Aadhaar details", 500))
  }
})

exports.getVerificationHistoryV2 = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const { page, itemsPerPage, searchText, status, sort, sortField, from, to } = req.query;

    const { rows, count } = await findAllVerificationRecordsAndCount({
      credentialId,
      page,
      itemsPerPage,
      searchText,
      status,
      sort,
      sortField,
      from,
      to,
    });

    return res.status(200).json({
      status: true,
      data: {
        records: rows,
        total: count,
        page,
        itemsPerPage,
      },
      message: "Fetched verification history successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while fetching verification history", 500))
  }
})

exports.getVerificationCountV2 = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = (await findPackageIdById(corporateUserId)) ?? req.user.packageId;
   customLog(req?.LogTraceId, "info", { packageId: packageId, message:"log for getting user package Id" })

    const usage = await getVerificationUsageStatus({ credentialId, corporateUserId, packageId });

    return res.status(200).json({
      status: true,
      data: usage,
      message: "Verification count fetched successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while fetching verification count", 500))
  }
})

exports.getVerificationAddOnDetailsV2 = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const { accessKey } = req.query;

    const { unitPrice, baseLimit, addonLimit, maxLimit, addonExpiresAt } = await getVerificationServicePricing({
      credentialId,
      corporateUserId,
      packageId,
      accessKey,
    });

    return res.status(200).json({
      status: true,
      data: {
        unitPrice,
        baseLimit,
        addonLimit,
        maxLimit,
        addonExpiresAt,
      },
      message: "Verification suite pricing fetched successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while fetching verification suite pricing", 500))
  }
})

exports.getVerificationAddOnHistoryV2 = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const { page, itemsPerPage, sort, sortField } = req.query;

    const { records, count } = await findVerificationAddonHistoryAndCount({
      credentialId,
      corporateUserId,
      page,
      itemsPerPage,
      sort,
      sortField,
    });

    return res.status(200).json({
      status: true,
      data: {
        records,
        total: count,
        page,
        itemsPerPage,
      },
      message: "Verification suite add-on history fetched successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error: error })
    next(new ErrorResponse("Something went wrong while fetching verification suite add-on history", 500))
  }
})

const authenticateAlankit = async (serviceDetails, accessKey, LogTraceId) => {
  try {
    const redisKey = `sessionId-${accessKey}`;
    const cachedSessionId = await getValue(redisKey);

    if (cachedSessionId) {
      customLog(LogTraceId, "info", { action: "alankit:login:cacheHit", message: "Reusing cached Alankit session id" }, "VENDOR");
      return cachedSessionId;
    }

    const config = {
      method: 'post',
      url: `${serviceDetails.vendor.healthUrl}/mcaloginapi`,
      headers: {
        'Subscriptionkey': serviceDetails.vendor.optional2,
      },
    };

    customLog(LogTraceId, "info", { action: "alankit:login:request", message: "Requesting a new Alankit session id", url: config.url }, "VENDOR");
    const result = await axios(config);
    const sessionId = result?.data?.response?.id;
    if (sessionId) {
      await setValue(redisKey, 60 * 60 * 1, sessionId);
      return sessionId;
    }

    customLog(LogTraceId, "error", { action: "alankit:login:response", message: "Alankit login response did not contain a session id", data: result?.data }, "VENDOR");
    return null;

  } catch (error) {
    const status = error?.response?.status || 500;
    const data = error?.response?.data || {};
    customLog(LogTraceId, "error", { action: "alankit:login:error", message: "Alankit login request failed", error: { status, data } }, "VENDOR");
    return null;
  }
};

exports.verifyGSTINBusiness = asyncHandler(async (req, res, next) => {
  try {
    const { gstin, action } = req.query;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = (await findPackageIdById(corporateUserId)) ?? req.user.packageId;
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
    const vendor = serviceDetails.vendor;

    const usage = await getVerificationUsageStatus({ credentialId, corporateUserId, packageId });
    if (usage.exhausted) {
      return next(new ErrorResponse("You have used all your free verifications. Please purchase an add-on to continue.", 400));
    }

    let config = {
      method: 'get',
      url: `${vendor.apiUrl}/v0.3/search?gstin=${gstin}&action=${action}`,
      headers: {
        'Content-Type': 'application/json',
        'ocp-apim-subscription-key': vendor.optional1,
      },
    };
    customLog(req?.LogTraceId, "info", { action: "alankit:gstinBusiness:request", message: "Calling Alankit GSTIN business verify API", url: config?.url, method: config?.method }, "VENDOR")
    let result
    let decodedData = null;
    let isApiError = false;
    try {
      result = await axios(config);
      customLog(req?.LogTraceId, "info", { action: "alankit:gstinBusiness:response", message: "Alankit GSTIN business verify API responded", result: result?.data }, "VENDOR")

      const response = result?.data;
      if (response.status_cd === "1") {
        decodedData = JSON.parse(Buffer.from(response.data, 'base64').toString('utf8'));
      }
    } catch (error) {
      const status = error?.response?.status || 500;
      const errData = error?.response?.data || {};
      result = { status, data: errData };
      isApiError = true;
      customLog(req?.LogTraceId, "error", { action: "alankit:gstinBusiness:error", message: "Alankit GSTIN business verify API call failed", error: result }, "VENDOR")
    }

    const isVerified = result?.data?.status_cd === "1";
    const type = operatorsData['gstinBusiness']['type']
    const maskedGSTIN = gstin ? `${gstin.slice(0,4)}XXXXXX` : "XXXXXX";

    if (!isApiError) {
      createVerificationRecord({
        accessKey,
        verificationType: type,
        credentialId,
        corporateUserId,
        packageId,
        status: isVerified ? 'VALID' : 'INVALID',
        inputPayload: { gstin, action },
        responsePayload: isVerified ? decodedData : result?.data,
        errorCode: isVerified ? null : (result?.data?.error?.error_cd || "Unknown"),
        message: isVerified ? null : "Verification Failed",
      }).catch((error) => customLog(req?.LogTraceId, "error", { action: "verificationRecord:createFailed", error: error.message }, "VENDOR"));
    }

    if (isVerified) {
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedGSTIN} was completed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      return res.status(200).json({
        status: true,
        data: {
          ...decodedData,
        },
        message: "Verification Successful",
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

      return res.status(500).json({
        status: false,
        data: {
          errorCode: result?.data?.error?.error_cd || "Unknown",
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { action: "alankit:gstinBusiness:unexpectedError", message: "Unexpected error verifying GSTIN business", error: error })
    next(new ErrorResponse("Something went wrong while verifying GSTIN", 500))
  }
})
exports.gstReturnComplainceCheck = asyncHandler(async (req, res, next) => {
  try {
    const { gstin, fy, action } = req.query;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = (await findPackageIdById(corporateUserId)) ?? req.user.packageId;
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
    const vendor = serviceDetails.vendor;

    const usage = await getVerificationUsageStatus({ credentialId, corporateUserId, packageId });
    if (usage.exhausted) {
      return next(new ErrorResponse("You have used all your free verifications. Please purchase an add-on to continue.", 400));
    }

    let config = {
      method: 'get',
      url: `${vendor.apiUrl}/v1.0/returns?gstin=${gstin}&fy=${fy}&action=${action}`,
      headers: {
        'Content-Type': 'application/json',
        'ocp-apim-subscription-key': vendor.optional1,
      },
    };
    customLog(req?.LogTraceId, "info", { action: "alankit:gstReturnCheck:request", message: "Calling Alankit GST return compliance check API", url: config?.url, method: config?.method }, "VENDOR")
    let result
    try {
      if(NODE_ENV === 'staging'){
        result = { data: {status: true,status_cd: "1", "EFiledlist": [
          {
          "valid": "Y",
          "mof": "ONLINE",
          "dof": "16-01-2018",
          "ret_prd": "062017",
          "rtntype": "GSTR3B",
          "arn": "AA080617000247D","status": "Filed"
          },

          {
          "valid": "Y",
          "mof": "ONLINE",
          "dof": "16-01-2018",
          "ret_prd": "072017",
          "rtntype": "GSTR3B",
          "arn": "AA080717000401N",
          "status": "Filed"
          },

          {
          "valid": "Y",
          "mof": "ONLINE",
          "dof": "12-01-2018",
          "ret_prd": "052017",
          "rtntype": "GSTR3B",
          "arn": "AA080517000372K",
          "status": "Filed"
          },{
            "valid": "Y",
            "mof": "ONLINE",
            "dof": "03-07-2017",
            "ret_prd": "102017",
            "rtntype": "GSTR1",
            "arn": "AA051016000296T",
            "status": "Filed"
            },

          {
            "mof": "ONLINE",
            "dof": "03-07-2017",
            "ret_prd": "112017",
            "rtntype": "GSTR3B",
            "arn": "AA051016000297R","status": "Filed"
          }
          ]
          }}
      }else{
        result = await axios(config);
      }
      customLog(req?.LogTraceId, "info", { action: "alankit:gstReturnCheck:response", message: "Alankit GST return compliance check API responded", result: result?.data }, "VENDOR")
    } catch (error) {
      const status = error?.response?.status || 500;
      const errData = error?.response?.data || {};
      result = { status, data: errData };
      customLog(req?.LogTraceId, "error", { action: "alankit:gstReturnCheck:error", message: "Alankit GST return compliance check API call failed", error: result }, "VENDOR")
    }

    const isVerified = result?.data?.status_cd === "1";
    const type = operatorsData['gstinComplianceCheck']['type']
    const maskedGSTIN = gstin ? `${gstin.slice(0,4)}XXXXXX` : "XXXXXX";
    const failureMessage = result?.data?.error?.message || "Verification Failed";

    createVerificationRecord({
      accessKey,
      verificationType: type,
      credentialId,
      corporateUserId,
      packageId,
      status: isVerified ? 'VALID' : 'INVALID',
      inputPayload: { gstin, fy, action },
      responsePayload: result?.data,
      errorCode: isVerified ? null : (result?.data?.error?.error_cd || "Unknown"),
      message: isVerified ? null : failureMessage,
    }).catch((error) => customLog(req?.LogTraceId, "error", { action: "verificationRecord:createFailed", error: error.message }, "VENDOR"));

    if (isVerified) {
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedGSTIN} was completed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      return res.status(200).json({
        status: true,
        data: {
          ...result?.data,
        },
        message: "Verification Successful",
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

      return res.status(500).json({
        status: false,
        data: {
          errorCode: result?.data?.error?.error_cd || "Unknown",
        },
        message: failureMessage,
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { action: "alankit:gstReturnCheck:unexpectedError", message: "Unexpected error checking GST return compliance", error: error })
    next(new ErrorResponse("Something went wrong while verifying GSTIN", 500))
  }
})

exports.corporateEntitiyVerification = asyncHandler(async (req, res, next) => {
  try {
    const { CIN } = req.body;
    const { id: credentialId, corporateId: corporateUserId, packageId: sessionPackageId } = req.user;
    const packageId = (await findPackageIdById(corporateUserId)) ?? sessionPackageId;
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

    const usage = await getVerificationUsageStatus({ credentialId, corporateUserId, packageId });
    if (usage.exhausted) {
      return next(new ErrorResponse("You have used all your free verifications. Please purchase an add-on to continue.", 400));
    }

    let result;
    let resData;
    const isProduction = process.env.NODE_ENV === 'production';
    try {
      if (isProduction) {
        const token = await authenticateAlankit(serviceDetails, accessKey, req?.LogTraceId);
        if (!token) {
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
        customLog(req?.LogTraceId, "info", { action: "alankit:corporateVerify:request", message: "Calling Alankit corporate entity verify API", url: config?.url, method: config?.method }, "VENDOR");
        result = await axios(config);
      } else {
        customLog(req.LogTraceId, 'info', 'Mock response used. No token generated or API call made.');
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
                      emailAddress: "test@test.com",
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
      resData = result?.data;
      customLog(req?.LogTraceId, "info", { action: "alankit:corporateVerify:response", message: "Alankit corporate entity verify API responded", result: resData }, "VENDOR");
    } catch (error) {
      // Timeout or other network error fallback
      customLog(req?.LogTraceId, "error", { action: "alankit:corporateVerify:error", message: "Alankit corporate entity verify API call failed", error: error }, "VENDOR");
      return next(new ErrorResponse("Corporate verification failed due to request error.", 500));
    }

    const thirdPartyResponse = resData?.response?.[0];
    const responseStatus = thirdPartyResponse?.responseStatus;
    const alankitErrorCode = resData?.error?.error_cd

    const isVerified =
      responseStatus !== "ERROR" &&
      alankitErrorCode !== "ALNAUTH01" && alankitErrorCode !== "ALNGEN04"

    const type = operatorsData['corporateVerify']['type']
    const maskedCIN = CIN ? `${CIN.slice(0,4)}XXXXXX` : "XXXXXX";

    createVerificationRecord({
      accessKey,
      verificationType: type,
      credentialId,
      corporateUserId,
      packageId,
      status: isVerified ? 'VALID' : 'INVALID',
      inputPayload: { CIN },
      responsePayload: resData,
      errorCode: isVerified ? null : (alankitErrorCode || "Unknown"),
      message: isVerified ? null : "Verification Failed",
    }).catch((error) => customLog(req?.LogTraceId, "error", { action: "verificationRecord:createFailed", error: error.message }, "VENDOR"));

    if (isVerified) {
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedCIN} was completed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      return res.status(200).json({
        status: true,
        data: {
          ...resData,
        },
        message: "Verification Successful",
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

      return res.status(500).json({
        status: false,
        data: {
          errorCode: alankitErrorCode || "Unknown",
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { action: "alankit:corporateVerify:unexpectedError", message: "Unexpected error verifying corporate entity", error: error })
    next(new ErrorResponse("Something went wrong while verifying corporate entity", 500))
  }
});

exports.fetchDirectorDetailsCIN = asyncHandler(async (req, res, next) => {
  try {
    const { CIN } = req.body;
    const { id: credentialId, corporateId: corporateUserId, packageId: sessionPackageId } = req.user;
    const packageId = (await findPackageIdById(corporateUserId)) ?? sessionPackageId;
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

    const usage = await getVerificationUsageStatus({ credentialId, corporateUserId, packageId });
    if (usage.exhausted) {
      return next(new ErrorResponse("You have used all your free verifications. Please purchase an add-on to continue.", 400));
    }

    let result;
    let resData;
    const isProduction = process.env.NODE_ENV === 'production';
    try {
      if (isProduction) {
        const token = await authenticateAlankit(serviceDetails, accessKey, req?.LogTraceId);
        if (!token) {
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
        customLog(req?.LogTraceId, "info", { action: "alankit:directorCIN:request", message: "Calling Alankit director CIN lookup API", url: config?.url, method: config?.method }, "VENDOR");
        result = await axios(config);
      } else {
        customLog(req.LogTraceId, 'info', 'Mock response used. No token generated or API call made.');
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
      resData = result?.data;
      customLog(req?.LogTraceId, "info", { action: "alankit:directorCIN:response", message: "Alankit director CIN lookup API responded", result: resData }, "VENDOR");
    } catch (error) {
      // Timeout or other network error fallback
      customLog(req?.LogTraceId, "error", { action: "alankit:directorCIN:error", message: "Alankit director CIN lookup API call failed", error: error }, "VENDOR");
      return next(new ErrorResponse("Director verification failed due to request error.", 500));
    }

    const thirdPartyResponse = resData?.response?.[0];
    const responseStatus = thirdPartyResponse?.responseStatus;
    const alankitErrorCode = resData?.error?.error_cd

    const isVerified =
      responseStatus !== "ERROR" &&
      alankitErrorCode !== "ALNAUTH01" && alankitErrorCode !== "ALNGEN04"

    const type = operatorsData['directorCIN']['type']
    const maskedCIN = CIN ? `${CIN.slice(0,4)}XXXXXX` : "XXXXXX";

    createVerificationRecord({
      accessKey,
      verificationType: type,
      credentialId,
      corporateUserId,
      packageId,
      status: isVerified ? 'VALID' : 'INVALID',
      inputPayload: { CIN },
      responsePayload: resData,
      errorCode: isVerified ? null : (alankitErrorCode || "Unknown"),
      message: isVerified ? null : "Verification Failed",
    }).catch((error) => customLog(req?.LogTraceId, "error", { action: "verificationRecord:createFailed", error: error.message }, "VENDOR"));

    if (isVerified) {
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedCIN} was completed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      return res.status(200).json({
        status: true,
        data: {
          ...resData,
        },
        message: "Verification Successful",
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

      return res.status(500).json({
        status: false,
        data: {
          errorCode: alankitErrorCode || "Unknown",
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { action: "alankit:directorCIN:unexpectedError", message: "Unexpected error fetching director details by CIN", error: error })
    next(new ErrorResponse("Something went wrong while verifying CIN", 500))
  }
});

exports.fetchDirectorDetailsDIN = asyncHandler(async (req, res, next) => {
  try {
    const { DIN } = req.body;
    const { id: credentialId, corporateId: corporateUserId, packageId: sessionPackageId } = req.user;
    const packageId = (await findPackageIdById(corporateUserId)) ?? sessionPackageId;
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

    const usage = await getVerificationUsageStatus({ credentialId, corporateUserId, packageId });
    if (usage.exhausted) {
      return next(new ErrorResponse("You have used all your free verifications. Please purchase an add-on to continue.", 400));
    }

    let result;
    let resData;
    const isProduction = process.env.NODE_ENV === 'production';
    try {
      if (isProduction) {
        const token = await authenticateAlankit(serviceDetails, accessKey, req?.LogTraceId);
        if (!token) {
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

        customLog(req?.LogTraceId, "info", { action: "alankit:directorDIN:request", message: "Calling Alankit director DIN lookup API", url: config?.url, method: config?.method }, "VENDOR");
        result = await axios(config);
      } else {
        customLog(req.LogTraceId, 'info', 'Mock response used. No token generated or API call made.');
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
      resData = result?.data;
      customLog(req?.LogTraceId, "info", { action: "alankit:directorDIN:response", message: "Alankit director DIN lookup API responded", result: resData }, "VENDOR");
    } catch (error) {
      // Timeout or other network error fallback
      customLog(req?.LogTraceId, "error", { action: "alankit:directorDIN:error", message: "Alankit director DIN lookup API call failed", error: error }, "VENDOR");
      return next(new ErrorResponse("Director verification failed due to request error.", 500));
    }

    const thirdPartyResponse = resData?.response?.[0];
    const responseStatus = thirdPartyResponse?.responseStatus;
    const alankitErrorCode = resData?.error?.error_cd

    const isVerified =
      responseStatus !== "ERROR" &&
      alankitErrorCode !== "ALNAUTH01" && alankitErrorCode !== "ALNGEN04" &&
      !!resData?.response

    const type = operatorsData['directorDIN']['type']
    const maskedDIN = DIN ? `${DIN.slice(0,4)}XXXXXX` : "XXXXXX";

    createVerificationRecord({
      accessKey,
      verificationType: type,
      credentialId,
      corporateUserId,
      packageId,
      status: isVerified ? 'VALID' : 'INVALID',
      inputPayload: { DIN },
      responsePayload: resData,
      errorCode: isVerified ? null : (alankitErrorCode || "Unknown"),
      message: isVerified ? null : "Verification Failed",
    }).catch((error) => customLog(req?.LogTraceId, "error", { action: "verificationRecord:createFailed", error: error.message }, "VENDOR"));

    if (isVerified) {
      const notificationData = {
        notificationTitle: `Verification Completed: ${type}`,
        notificationBrief: `The ${type} verification for ${maskedDIN} was completed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);

      return res.status(200).json({
        status: true,
        data: {
          ...resData,
        },
        message: "Verification Successful",
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

      return res.status(500).json({
        status: false,
        data: {
          errorCode: alankitErrorCode || "Unknown",
        },
        message: "Verification Failed",
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { action: "alankit:directorDIN:unexpectedError", message: "Unexpected error fetching director details by DIN", error: error })
    next(new ErrorResponse("Something went wrong while verifying DIN", 500))
  }
});

// V2 equivalents of the legacy verificationGeneratePDF/verificationGenerateExcelCSV (corporate
// verificationSuite.js) - same Puppeteer/Excel generation, but sourced from getVerificationHistoryV2's
// own data (nupay_verification_records) via getVerificationRecordsReportForCorporate instead of the
// legacy transaction/order tables.
exports.verificationGeneratePDFV2 = asyncHandler(async (req, res, next) => {

  let { from, to, searchText, status } = req.query;
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
  const data = await getVerificationRecordsReportForCorporate(params);

  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500))
  }
  const templateDetails = {
    title: 'Verifications Report'
  }
  const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
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
    scale: 0.7,
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

exports.verificationGenerateExcelCSVV2 = asyncHandler(async (req, res, next) => {

  let { from, to, searchText, status } = req.query;
  const { type } = req.params
  const credentialId = req.user.id


  const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';
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
  const data = await getVerificationRecordsReportForCorporate(params);
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500))
  } else {
    const { buffer, fileType } = await generateExcelBufferAndType(data, type)
    return res.status(200).json({
      'status': true,
      'data': { buffer, fileType },
      'message': 'Fetched excel/csv datas successfully',
      'responseCode': '000'
    })
  }
})
