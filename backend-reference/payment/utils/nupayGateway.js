const axios = require("axios");
const FormData = require("form-data");
const { findServiceOperatorByAccessKey } = require("./checkAndFetchServiceDetails");
const { customLog } = require("./loggerHelper");
const operatorsData = require("./operatorsData.json");

const NUPAY_ACCESS_KEY = operatorsData.payout.accessKey;

// In-memory token cache keyed by access_key — tokens expire in 30 mins, we refresh at 25
const _tokenCache = {};

let _nachToken = null;
let _nachTokenExpiresAt = 0;

const getNupayVendor = async () => {
  const service = await findServiceOperatorByAccessKey(NUPAY_ACCESS_KEY);
  if (!service || service.error) throw new Error("NuPay vendor config not found");
  if (!service.vendor) throw new Error("NuPay vendor details not configured");
  return service.vendor;
};

/**
 * Fetch (or return cached) NuPay JWT.
 * vendor.optional1 = access_key
 * vendor.optional2 = access_secret
 * vendor.apiUrl    = base URL  (e.g. https://api-uat.nupaybiz.com)
 */
const getAccessToken = async (vendor) => {
  const cacheKey = vendor.optional1;
  const cached = _tokenCache[cacheKey];
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  customLog(null, "info", { message: "NuPay: fetching new access token" });

  const response = await axios.post(
    `${vendor.apiUrl}/onboarding/v1/users/accesstoken`,
    { access_key: vendor.optional1, access_secret: vendor.optional2 },
    { headers: { "Content-Type": "application/json" } }
  );

  const token = response.data?.token;
  if (!token) throw new Error("NuPay access token not received");

  _tokenCache[cacheKey] = { token, expiresAt: Date.now() + 25 * 60 * 1000 };
  customLog(null, "info", { message: "NuPay: access token cached" });
  return token;
};

/**
 * Build authorization headers (token auto-fetched/cached).
 */
const authHeaders = async (vendor) => ({
  Authorization: `Bearer ${await getAccessToken(vendor)}`,
});

/**
 * Append a base64-encoded document to a FormData instance.
 * Accepts either a plain base64 string or { base64, format } object.
 */
const appendDocument = (form, fieldName, value) => {
  if (!value) return;
  let base64, ext;
  if (typeof value === "object" && value.base64) {
    base64 = value.base64;
    ext = value.format || "pdf";
  } else if (typeof value === "string") {
    base64 = value;
    ext = "pdf";
  } else {
    return;
  }
  const buffer = Buffer.from(base64, "base64");
  const mime = ext === "pdf" ? "application/pdf" : `image/${ext}`;
  form.append(fieldName, buffer, { filename: `${fieldName}.${ext}`, contentType: mime });
};

/**
 * POST /onboarding/v1/merchants
 * Supports all product_type + entity_type combinations from the API docs.
 *
 * @param {Object} params.fields  - String fields (mid, merchant_name, etc.)
 * @param {Object} params.files   - Document fields as base64 strings or { base64, format }
 */
exports.onboardMerchant = async ({ fields, files = {} }) => {
  let vendor, token;
  try {
    vendor = await getNupayVendor();
    token = await getAccessToken(vendor);
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, "error", { message: "NuPay onboardMerchant auth error", error: errData });
    const err = new Error(errData?.message || error.message || "NuPay authentication failed");
    err.nupayError = errData;
    throw err;
  }

  const form = new FormData();

  // Append all string fields
  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined && val !== null && val !== "") {
      form.append(key, String(val).trim());
    }
  }

  // Append all document fields
  for (const [key, val] of Object.entries(files)) {
    appendDocument(form, key, val);
  }

  try {
    const response = await axios.post(
      `${vendor.apiUrl}/onboarding/v1/merchants`,
      form,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...form.getHeaders(),
        },
      }
    );
    return response.data;
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, "error", { message: "NuPay onboardMerchant error", error: errData });
    const err = new Error(errData?.message || "NuPay merchant onboarding failed");
    err.nupayError = errData;
    throw err;
  }
};

/**
 * GET /onboarding/v1/merchants/list
 */
exports.getMerchantList = async ({ startDate, endDate, offset = 0, limit = 100, mid } = {}) => {
  const vendor = await getNupayVendor();
  try {
    const response = await axios.get(
      `${vendor.apiUrl}/onboarding/v1/merchants/list`,
      {
        params: {
          ...(startDate && { start_date: startDate }),
          ...(endDate && { end_date: endDate }),
          offset,
          limit,
          ...(mid && { mid }),
        },
        headers: await authHeaders(vendor),
      }
    );
    return response.data;
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, "error", { message: "NuPay getMerchantList error", error: errData });
    throw new Error(errData?.message || "Failed to fetch NuPay merchant list");
  }
};

const getCorporateToken = async (accessKey, accessSecret, apiUrl) => {
  const cached = _tokenCache[accessKey];
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  const response = await axios.post(
    `${apiUrl}/onboarding/v1/users/accesstoken`,
    { access_key: accessKey, access_secret: accessSecret },
    { headers: { "Content-Type": "application/json" } }
  );

  const token = response.data?.token;
  if (!token) throw new Error("NuPay corporate token not received");

  _tokenCache[accessKey] = { token, expiresAt: Date.now() + 25 * 60 * 1000 };
  return token;
};

exports.getWalletBalance = async ({ walletAccountId, accessKey, accessSecret }) => {
  try {
    const vendor = await getNupayVendor();
    const token = await getCorporateToken(accessKey, accessSecret, vendor.apiUrl);

    const response = await axios.get(
      `${vendor.apiUrl}/unified-wallet/v1/accounts/${walletAccountId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-key": accessKey,
        },
      }
    );
    return response.data;
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, "error", { message: "NuPay getWalletBalance error", error: errData });
    throw new Error(errData?.message || "Failed to fetch wallet balance");
  }
};

const getNachToken = async (nachApiKey, nachBaseUrl) => {
  if (_nachToken && Date.now() < _nachTokenExpiresAt) return _nachToken;

  const response = await axios.get(
    `${nachBaseUrl}/Auth/token`,
    { headers: { "api-key": nachApiKey } }
  );

  const token = response.data?.token || response.data?.Token;
  if (!token) throw new Error("NuPay NACH token not received");

  _nachToken = token;
  _nachTokenExpiresAt = Date.now() + 25 * 60 * 1000;
  return token;
};

exports.initiateNupayTransfer = async ({ walletAccountId, accessKey, accessSecret, amount, transferType, referenceId, remarks, beneficiary }) => {
  try {
    const vendor = await getNupayVendor();
    const token = await getCorporateToken(accessKey, accessSecret, vendor.apiUrl);

    const payload = {
      client_reference_id: referenceId,
      account_holder_name: beneficiary.fullName,
      account_number: beneficiary.accountNumber,
      ifsc_code: beneficiary.ifscCode,
      payment_amount: Number(amount).toFixed(2),
      payment_mode: transferType || "IMPS",
      remarks: remarks || "Payout",
    };
    const response = await axios.post(
      `${vendor.apiUrl}/unified-wallet/v3/accounts/${walletAccountId}/transfer`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-key": accessKey,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, "error", { message: "NuPay initiateTransfer error", error: errData });
    const err = new Error(errData?.message || "NuPay transfer failed");
    err.nupayError = errData;
    throw err;
  }
};

exports.getNupayTransactionStatus = async ({ walletAccountId, accessKey, accessSecret, nupayTransactionId }) => {
  try {
    const vendor = await getNupayVendor();
    const token = await getCorporateToken(accessKey, accessSecret, vendor.apiUrl);

    const response = await axios.get(
      `${vendor.apiUrl}/unified-wallet/v2/accounts/${walletAccountId}/transactions/${nupayTransactionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-key": accessKey,
        },
      }
    );
    return response.data;
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, "error", { message: "NuPay getTransactionStatus error", error: errData });
    throw new Error(errData?.message || "Failed to fetch NuPay transaction status");
  }
};

exports.verifyBankAccount = async ({ accountNumber, ifscCode, accountName }) => {
  try {
    const vendor = await getNupayVendor();
    const nachApiKey = vendor.optional3;
    const nachBaseUrl = vendor.optional4;
    if (!nachApiKey) throw new Error("NuPay NACH api-key not configured in vendor");
    if (!nachBaseUrl) throw new Error("NuPay NACH base URL not configured in vendor");

    const token = await getNachToken(nachApiKey, nachBaseUrl);
    const referenceNumber = `PK${Date.now()}`;

    const form = new FormData();
    form.append("ifsc_code", ifscCode);
    form.append("accounts", accountNumber);
    form.append("account_name", accountName);
    form.append("reference_number", referenceNumber);

    const response = await axios.post(
      `${nachBaseUrl}/api/Validate/getAccountVerificationWithIFSC`,
      form,
      {
        headers: {
          "api-key": nachApiKey,
          Token: token,
          ...form.getHeaders(),
        },
      }
    );

    const data = response.data;
    const { StatusCode, StatusDesc, BankResponse, Percentage, IsMatched, UTR } = data;

    // NP000 = verified, NP001 = verified but name mismatch — both mean account exists
    if (StatusCode !== "NP000" && StatusCode !== "NP001") {
      const err = new Error(StatusDesc || "Bank account verification failed");
      err.statusCode = StatusCode;
      throw err;
    }

    return { StatusCode, StatusDesc, BankResponse, Percentage, IsMatched, UTR };
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, "error", { message: "NuPay bank verification error", error: errData });
    const err = new Error(error.message || "Bank account verification failed");
    err.statusCode = error.statusCode;
    throw err;
  }
};
