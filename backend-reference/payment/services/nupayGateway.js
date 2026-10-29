const axios = require("axios");
const { v4 } = require("uuid");
const { findServiceOperatorByAccessKey } = require("../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../utils/error-response");
const operatorsData = require("../utils/operatorsData.json");
const { customLog } = require("../utils/loggerHelper");
const paymentLinkOnboarding = require("../models/entities/paymentLinkOnboarding");
const { decryptCred, encryptCred, tryFetchNupayCredentials } = require("../utils/nupayCollectionsVault");

const accessKey = operatorsData.nupayCollections.accessKey;

// Mask secrets/tokens before logging — never log raw credentials.
const maskSecret = (v) => {
  if (!v) return "(unset)";
  const s = String(v);
  return s.length <= 8 ? "****" : `${s.slice(0, 4)}****${s.slice(-2)}`;
};
const configForLog = (config) => ({
  apiUrl: config?.apiUrl,
  accessKey: maskSecret(config?.accessKey),
  accessSecret: maskSecret(config?.accessSecret),
  providerId: config?.providerId || null,
});
exports.maskSecret = maskSecret;

// serviceOperator field mapping for NuPay Collection 360:
// apiUrl = base URL (e.g. https://api-uat.nupaybiz.com)
// optional1 = access_key (also sent as x-api-key header)
// optional2 = access_secret
// optional3 = provider_id
const getVendorConfig = async () => {
  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
  const vendor = serviceDetails?.vendor;
  const config = {
    apiUrl: vendor?.apiUrl?.replace(/\/$/, ""),
    accessKey: vendor?.optional1,
    accessSecret: vendor?.optional2,
    providerId: vendor?.optional3,
  };
  if (!config.apiUrl || !config.accessKey || !config.accessSecret) {
    throw new ErrorResponse("NuPay configuration is missing", 500);
  }
  return config;
};

// NuPay JWT expires in 30 min — cache for 25 and re-fetch on expiry
const TOKEN_TTL_MS = 25 * 60 * 1000;
let tokenCache = { token: null, key: null, expiresAt: 0 };

const getAccessToken = async (config, forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && tokenCache.token && tokenCache.key === config.accessKey && now < tokenCache.expiresAt) {
    return tokenCache.token;
  }
  const url = `${config.apiUrl}/onboarding/v1/users/accesstoken`;
  customLog(null, "info", { message: "NuPay accesstoken request", url, config: configForLog(config) }, "VENDOR");
  try {
    const response = await axios({
      method: "POST",
      url,
      headers: { "Content-Type": "application/json" },
      data: { access_key: config.accessKey, access_secret: config.accessSecret },
    });
    const token = response?.data?.token;
    customLog(null, "info", { message: "NuPay accesstoken response", url, status: response?.status, token: maskSecret(token) }, "VENDOR");
    if (!token) {
      throw new ErrorResponse("NuPay access token not returned", 500);
    }
    tokenCache = { token, key: config.accessKey, expiresAt: now + TOKEN_TTL_MS };
    return token;
  } catch (error) {
    customLog(null, "error", { message: "NuPay accesstoken failed", url, status: error?.response?.status, data: error?.response?.data, error: error?.message }, "VENDOR");
    throw error;
  }
};

exports.getVendorConfig = getVendorConfig;
exports.getAccessToken = getAccessToken;

// Per-corporate config — uses the merchant's own NuPay keys (fetched from the vault at onboarding),
// falling back to the platform base URL + provider_id. Used for that merchant's collect/status calls.
const getMerchantConfig = async (credentialId) => {
  const platform = await getVendorConfig();
  const record = await paymentLinkOnboarding.findOne({ where: { credentialId } });
  let accessKey = decryptCred(record?.nupayAccessKey);
  let accessSecret = decryptCred(record?.nupayAccessSecret);
  let providerId = record?.nupayProviderId;

  // Self-healing fetch: if the keys aren't stored yet but we have the vault link + phone
  // (e.g. the onboarding webhook's fetch failed), fetch once now and persist, so a merchant
  // isn't permanently blocked by a one-off webhook failure. Runs only until keys exist.
  if ((!accessKey || !accessSecret) && record?.credentialsLink && record?.phone) {
    const creds = await tryFetchNupayCredentials(record.credentialsLink, record.phone, null);
    if (creds?.accessKey && creds?.accessSecret) {
      accessKey = creds.accessKey;
      accessSecret = creds.accessSecret;
      providerId = creds.providerId || providerId;
      await record.update({
        nupayAccessKey: encryptCred(creds.accessKey),
        nupayAccessSecret: encryptCred(creds.accessSecret),
        nupayProviderId: creds.providerId || record.nupayProviderId,
        credentialsFetchedAt: new Date(),
      });
    }
  }

  if (!accessKey || !accessSecret) {
    throw new ErrorResponse("Merchant NuPay credentials are not available yet — onboarding is not complete", 400);
  }
  return {
    apiUrl: platform.apiUrl,
    accessKey,
    accessSecret,
    providerId: providerId || platform.providerId,
  };
};
exports.getMerchantConfig = getMerchantConfig;

// Resolve which credentials to use: a specific merchant's, or the platform's.
const resolveConfig = async (credentialId) => (credentialId ? getMerchantConfig(credentialId) : getVendorConfig());

// NuPay client_reference_id: 8-14 alphanumeric, unique per transaction
exports.generateClientReferenceId = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let ref = "";
  for (let i = 0; i < 12; i += 1) ref += chars.charAt(Math.floor(Math.random() * chars.length));
  return ref;
};

// NPxxxx codes / webhook transaction_status → internal status
exports.mapNupayStatus = (codeOrStatus) => {
  const value = String(codeOrStatus || "").toUpperCase();
  if (value === "NP2000" || value === "SUCCESS") return "SUCCESS";
  if (value === "NP5000" || value === "FAILED" || value === "NP3000" || value === "REJECTED") return "FAILED";
  return "PENDING";
};

const callNupay = async ({ method, path, params, data, vendorConfig }) => {
  const config = vendorConfig || (await getVendorConfig());
  const url = `${config.apiUrl}${path}`;
  const request = async (forceRefresh) => {
    const token = await getAccessToken(config, forceRefresh);
    customLog(null, "info", {
      message: "NuPay API request",
      method, url, config: configForLog(config), token: maskSecret(token), params, data,
    }, "VENDOR");
    return axios({
      method,
      url,
      headers: {
        "Content-Type": "application/json",
        "NP-Request-ID": v4(),
        "x-api-key": config.accessKey,
        Authorization: `Bearer ${token}`,
      },
      params,
      data,
    });
  };
  try {
    const response = await request(false);
    customLog(null, "info", { message: "NuPay API response", method, url, status: response?.status, data: response?.data }, "VENDOR");
    return { response, config };
  } catch (error) {
    const code = error?.response?.data?.code;
    if (code === "NP4005" || error?.response?.status === 401) {
      customLog(null, "info", { message: "NuPay token expired — refreshing and retrying", method, url, code }, "VENDOR");
      const response = await request(true);
      customLog(null, "info", { message: "NuPay API response (after refresh)", method, url, status: response?.status, data: response?.data }, "VENDOR");
      return { response, config };
    }
    customLog(null, "error", { message: "NuPay API failed", method, url, status: error?.response?.status, data: error?.response?.data, error: error?.message }, "VENDOR");
    throw error;
  }
};

// POST /collect360/v1/initiate_transaction — one API for dynamic QR + UPI intent link + VPA collect
exports.createCollectRequest = async ({
  amount,
  purpose_message,
  payer_name,
  payer_mobile_no,
  payer_email,
  customer_unique_id,
  credentialId,
}) => {
  try {
    const requestAmount = Number(amount);
    if (!Number.isFinite(requestAmount) || requestAmount <= 0 || requestAmount > 100000) {
      throw new ErrorResponse("Valid amount is required (max 1,00,000 for UPI)", 400);
    }
    if (!payer_mobile_no || !/^[6-9]\d{9}$/.test(String(payer_mobile_no))) {
      throw new ErrorResponse("Please enter a valid 10-digit mobile number starting with 6-9", 400);
    }

    const vendorConfig = await resolveConfig(credentialId);
    const clientReferenceId = exports.generateClientReferenceId();
    const payload = {
      client_reference_id: clientReferenceId,
      provider_id: vendorConfig.providerId || "",
      request_amount: requestAmount.toFixed(2),
      payer_mobile_no: String(payer_mobile_no),
      ...(payer_name ? { payer_name } : {}),
      ...(payer_email ? { payer_email } : {}),
      ...(customer_unique_id ? { customer_unique_id } : {}),
      ...(purpose_message ? { transaction_remarks: String(purpose_message).trim() } : {}),
    };

    const { response } = await callNupay({
      method: "POST",
      path: "/collect360/v1/initiate_transaction",
      data: payload,
      vendorConfig,
    });

    const responseData = response?.data?.response_data || {};
    return {
      reference_id: clientReferenceId,
      nupayTxnId: responseData.transaction_id || null,
      paymentLink: responseData.payment_link || null,
      payeeVpa: responseData.payee_vpa || null,
      requestAmount: responseData.request_amount || payload.request_amount,
      convenienceFeeAmount: responseData.convenience_fees_amount || null,
      gstAmount: responseData.gst_amount || null,
      totalAmount: responseData.transaction_amount || null,
      expiresAt: responseData.expires_at || null,
      transactionStatus: exports.mapNupayStatus(response?.data?.code),
      providerResponse: response?.data || {},
    };
  } catch (error) {
    customLog(null, "error", { message: "Error in NuPay createCollectRequest", error: error?.message }, "VENDOR");
    if (error instanceof ErrorResponse) throw error;
    const providerErrorMessage =
      error?.response?.data?.message || "Something went wrong while creating collect request";
    throw new ErrorResponse(providerErrorMessage, 400);
  }
};

// GET /collect360/v1/transactionEnquiry/:client_reference_id
exports.getTransactionStatus = async (clientReferenceId, credentialId) => {
  try {
    const { response } = await callNupay({
      method: "GET",
      path: `/collect360/v1/transactionEnquiry/${clientReferenceId}`,
      vendorConfig: credentialId ? await resolveConfig(credentialId) : undefined,
    });
    const responseData = response?.data?.response_data || {};
    return {
      reference_id: clientReferenceId,
      nupayTxnId: responseData.transaction_id || null,
      transactionStatus: exports.mapNupayStatus(response?.data?.code),
      statusDescription: response?.data?.description || null,
      utr: responseData.utr || null,
      npciTransactionId: responseData.npci_transaction_id || null,
      payerVpa: responseData.payer_vpa || null,
      transactionTimestamp: responseData.transaction_timestamp || null,
      totalAmount: responseData.transaction_amount || null,
      providerResponse: response?.data || {},
    };
  } catch (error) {
    customLog(null, "error", { message: "Error in NuPay getTransactionStatus", clientReferenceId, error: error?.message }, "VENDOR");
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse(error?.response?.data?.message || "Unable to fetch transaction status", 400);
  }
};

// GET /collect360/v1/transactionStatement — status filter: PENDING/SUCCESS/FAILED/REJECTED
exports.getTransactionStatement = async ({ start_date, end_date, offset = 0, limit = 100, status, credentialId }) => {
  try {
    const { response } = await callNupay({
      method: "GET",
      path: "/collect360/v1/transactionStatement",
      params: { start_date, end_date, offset, limit, ...(status ? { status } : {}) },
      vendorConfig: credentialId ? await resolveConfig(credentialId) : undefined,
    });
    return response?.data || {};
  } catch (error) {
    customLog(null, "error", { message: "Error in NuPay getTransactionStatement", error: error?.message }, "VENDOR");
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse(error?.response?.data?.message || "Unable to fetch transaction statement", 400);
  }
};
