const axios = require("axios");
const FormData = require("form-data");
const { getVendorConfig, getAccessToken, maskSecret } = require("./nupayGateway");
const { findServiceOperatorByAccessKey } = require("../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../utils/error-response");
const operatorsData = require("../utils/operatorsData.json");
const { customLog } = require("../utils/loggerHelper");

// Account validation (NACH penny-drop) config lives on the payment-links NuPay vendor row itself
// (spare fields), so payment-links owns it end-to-end with no dependency on the Verification Suite's
// NuPay vendor/serviceOperator. Same nupay_collections row: apiUrl+optional1-3 = collections,
// optional4 = validation base URL, optional5 = validation api-key.
const NUPAY_ACCESS_KEY = operatorsData.nupayCollections.accessKey;

// NuPay Merchant Onboarding — POST /onboarding/v1/merchants (multipart form-data, platform keys).
// Field specs per vendor V2 doc (fields confirmed authoritative). UBO is SEPARATE for both
// partnership & private_limited: ubo_pan + ubo_aadhar (API accepts "ubo_aadhar", not the doc's
// misspelled "ubo_adhaar"). private_limited also keeps a shareholding doc.

const COMMON_TEXT_FIELDS = [
  { name: "mid", required: true },
  { name: "client_reference_id", required: true },
  { name: "product_type", required: true },
  { name: "merchant_name", required: true },
  { name: "contact_number", required: true },
  { name: "official_email", required: true },
  { name: "website_url", required: true }, // NuPay validates these as required despite the doc marking them optional
  { name: "city", required: true },
  { name: "state", required: true },
  { name: "pincode", required: true },
  { name: "onboarding_webhook_url", required: true },
];

const COLLECTION_TEXT_FIELDS = [
  { name: "entity_type", required: true },
  { name: "collection_webhook_url", required: true },
  { name: "settlement_webhook_url", required: true },
  { name: "provider_id", required: true },
  { name: "bank_account_number", required: true },
  { name: "ifsc_code", required: true },
];

// File fields per entity type (collection product)
const ENTITY_FILE_FIELDS = {
  individual: [
    { name: "signatory_authority", required: true },
    { name: "pan_card", required: true },
    { name: "address_proof", required: true },
    { name: "board_resolution_or_poa", required: true },
  ],
  sole_proprietorship: [
    { name: "signatory_authority", required: true },
    { name: "proprietor_pan", required: true },
    { name: "proprietor_address", required: true },
    { name: "business_proof_1", required: true },
    { name: "business_proof_2", required: true },
    { name: "cancelled_cheque", required: true },
  ],
  partnership: [
    { name: "signatory_authority", required: true },
    { name: "partnership_deed", required: true },
    { name: "partnership_registration_certificate", required: true },
    { name: "partnership_firm_pan_card", required: true },
    { name: "list_of_all_partners", required: true },
    { name: "registered_office_address_proof", required: true },
    { name: "principal_business_address_proof", required: true },
    { name: "authorised_signatory_pan", required: true },
    { name: "authorised_signatory_address_proof", required: true },
    { name: "poa_or_authorisation_letter", required: true },
    { name: "ubo_declaration", required: true },
    { name: "ubo_pan", required: true },
    // API accepts "ubo_aadhar" (the doc's "ubo_adhaar" spelling is a typo)
    { name: "ubo_aadhar", required: true },
    { name: "cancelled_cheque", required: true },
  ],
  private_limited: [
    { name: "signatory_authority", required: true },
    { name: "certificate_of_incorporation", required: true },
    { name: "moa", required: true },
    { name: "aoa", required: true },
    { name: "company_pan", required: true },
    { name: "board_resolution", required: true },
    { name: "registered_office", required: true },
    { name: "business_address", required: true },
    { name: "authorised_signatory_pan", required: true },
    { name: "authorised_signatory_address", required: true },
    { name: "name_of_seniors_management_persons", required: true },
    { name: "ubo_declaration", required: true },
    { name: "ubo_pan", required: true },
    // API accepts "ubo_aadhar" (the doc's "ubo_adhaar" spelling is a typo)
    { name: "ubo_aadhar", required: true },
    { name: "shareholding", required: true },
    { name: "cancelled_cheque", required: true },
  ],
};

// Extra text fields specific to entity types
const ENTITY_TEXT_FIELDS = {
  individual: [],
  sole_proprietorship: [],
  partnership: [{ name: "ownership_percentage_details", required: true }],
  private_limited: [
    { name: "cin", required: true },
    { name: "ownership_percentage_details", required: true },
  ],
};

// Onboarding status codes mapped to paymentLinkOnboarding.status enum values
// NP1000 pending, NP2000 success, NP6000 on_hold, NP5000 failed
exports.mapOnboardingStatus = (code) => {
  const value = String(code || "").toUpperCase();
  if (value === "NP2000") return "active";
  if (value === "NP5000") return "rejected";
  if (value === "NP6000") return "on_hold";
  return "approval-pending";
};

// miq is generated by the backend (miqBuilder) from the collected fields and injected before
// onboardMerchant — it is NOT a user upload, so the FE field-spec endpoint filters it out.
const BACKEND_FILE_FIELDS = [{ name: "miq", required: true }];

exports.getEntityFieldSpec = (entityType) => ({
  textFields: [...COMMON_TEXT_FIELDS, ...COLLECTION_TEXT_FIELDS, ...(ENTITY_TEXT_FIELDS[entityType] || [])],
  fileFields: [...(ENTITY_FILE_FIELDS[entityType] || []), ...BACKEND_FILE_FIELDS],
});

/**
 * Onboards a collection merchant at NuPay.
 * fields: flat map of text field values; files: map of fieldName -> { buffer, filename, contentType }
 */
exports.onboardMerchant = async ({ entityType, fields = {}, files = {} }) => {
  if (!ENTITY_FILE_FIELDS[entityType]) {
    throw new ErrorResponse(`Unsupported entity_type: ${entityType}`, 400);
  }

  const config = await getVendorConfig();
  const spec = exports.getEntityFieldSpec(entityType);

  const payload = { ...fields, product_type: "collection", entity_type: entityType, provider_id: fields.provider_id || config.providerId || "" };

  const missingText = spec.textFields.filter((f) => f.required && !payload[f.name]).map((f) => f.name);
  const missingFiles = spec.fileFields.filter((f) => f.required && !files[f.name]).map((f) => f.name);
  if (missingText.length || missingFiles.length) {
    throw new ErrorResponse(`Missing mandatory onboarding fields: ${[...missingText, ...missingFiles].join(", ")}`, 400);
  }

  const form = new FormData();
  spec.textFields.forEach((f) => {
    if (payload[f.name] !== undefined && payload[f.name] !== null) form.append(f.name, String(payload[f.name]));
  });
  spec.fileFields.forEach((f) => {
    const file = files[f.name];
    if (file) form.append(f.name, file.buffer, { filename: file.filename, contentType: file.contentType });
  });

  const url = `${config.apiUrl}/onboarding/v1/merchants`;
  try {
    const token = await getAccessToken(config);
    customLog(null, "info", {
      message: "NuPay onboard merchant request",
      url,
      config: { apiUrl: config.apiUrl, accessKey: maskSecret(config.accessKey), providerId: config.providerId },
      token: maskSecret(token),
      mid: payload.mid,
      entityType,
      textFields: spec.textFields.map((f) => f.name).filter((n) => payload[n] !== undefined),
      specFileFields: spec.fileFields.map((f) => f.name),
      appendedFiles: spec.fileFields.filter((f) => files[f.name]).map((f) => f.name),
      files: Object.entries(files).map(([name, f]) => ({ name, filename: f?.filename, bytes: f?.buffer?.length ?? 0 })),
    }, "VENDOR");
    const response = await axios({
      method: "POST",
      url,
      headers: { Authorization: `Bearer ${token}`, ...form.getHeaders() },
      data: form,
      maxBodyLength: Infinity,
    });
    customLog(null, "info", { message: "NuPay onboard merchant response", url, status: response?.status, data: response?.data }, "VENDOR");

    return {
      code: response?.data?.code || null,
      status: exports.mapOnboardingStatus(response?.data?.code),
      mid: response?.data?.mid || payload.mid,
      nupayRefNo: response?.data?.nupay_ref_no || null,
      clientReferenceId: response?.data?.client_reference_id || payload.client_reference_id,
      providerResponse: response?.data || {},
    };
  } catch (error) {
    const vendorData = error?.response?.data;
    customLog(null, "error", {
      message: "NuPay onboard merchant failed",
      url,
      mid: payload.mid,
      status: error?.response?.status,
      data: vendorData ? JSON.stringify(vendorData) : undefined,
      error: error?.message,
    }, "VENDOR");
    if (error instanceof ErrorResponse) throw error;
    // Surface the first validation error to the caller when NuPay returns one.
    const firstError = Array.isArray(vendorData?.errors) && vendorData.errors.length
      ? (typeof vendorData.errors[0] === "string" ? vendorData.errors[0] : JSON.stringify(vendorData.errors[0]))
      : null;
    const message = firstError
      ? `${vendorData?.message || "Merchant onboarding failed"}: ${firstError}`
      : vendorData?.message || "Merchant onboarding failed at vendor";
    throw new ErrorResponse(message, 400);
  }
};

// NuPay account validation (penny-drop) — separate NACH service on nachuat.nupaybiz.com.
// Auth: api-key header → GET /Auth/token (24h validity) → Token header on the validation call.
// Config from serviceOperator row `nupay_account_validation` (apiUrl = base, optional1 = api-key).
const getValidationConfig = async () => {
  const serviceDetails = await findServiceOperatorByAccessKey(NUPAY_ACCESS_KEY);
  const baseUrl = serviceDetails?.vendor?.optional4?.replace(/\/+$/, "");
  const apiKey = serviceDetails?.vendor?.optional5;
  if (!baseUrl || !apiKey) {
    throw new ErrorResponse("NuPay account-validation configuration is missing", 500);
  }
  return { baseUrl, apiKey };
};

// Token valid 24h — cache for 23h and refresh proactively / on token-mismatch.
const TOKEN_TTL_MS = 23 * 60 * 60 * 1000;
let validationTokenCache = { token: null, apiKey: null, expiresAt: 0 };

const getValidationToken = async (config, forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && validationTokenCache.token && validationTokenCache.apiKey === config.apiKey && now < validationTokenCache.expiresAt) {
    return validationTokenCache.token;
  }
  const url = `${config.baseUrl}/Auth/token`;
  customLog(null, "info", { message: "NuPay validation token request", url, apiKey: maskSecret(config.apiKey) }, "VENDOR");
  try {
    const res = await axios({ method: "GET", url, headers: { "api-key": config.apiKey } });
    const token = res?.data?.token;
    customLog(null, "info", { message: "NuPay validation token response", url, status: res?.status, token: maskSecret(token) }, "VENDOR");
    if (!token) {
      throw new ErrorResponse("NuPay validation token not returned", 500);
    }
    validationTokenCache = { token, apiKey: config.apiKey, expiresAt: now + TOKEN_TTL_MS };
    return token;
  } catch (error) {
    customLog(null, "error", { message: "NuPay validation token failed", url, status: error?.response?.status, data: error?.response?.data, error: error?.message }, "VENDOR");
    throw error;
  }
};

// StatusCode: NP000 verified, NP001 account ok but name mismatch, NP002/NP003 invalid, NP034 token mismatch.
exports.verifyBankAccount = async ({ accountNumber, ifsc, accountName, referenceNumber }) => {
  const config = await getValidationConfig();
  const refNo = (referenceNumber || `NPV${Date.now().toString().slice(-12)}`).slice(0, 15);

  const call = async forceRefresh => {
    const token = await getValidationToken(config, forceRefresh);
    const form = new FormData();
    form.append("ifsc_code", ifsc);
    form.append("accounts", accountNumber);
    form.append("account_name", accountName || "");
    form.append("reference_number", refNo);
    return axios({
      method: "POST",
      url: `${config.baseUrl}/api/Validate/getAccountVerificationWithIFSC`,
      headers: { "api-key": config.apiKey, Token: token, ...form.getHeaders() },
      data: form,
      timeout: 30000,
    });
  };

  const url = `${config.baseUrl}/api/Validate/getAccountVerificationWithIFSC`;
  try {
    customLog(null, "info", {
      message: "NuPay account verification request",
      url,
      config: { baseUrl: config.baseUrl, apiKey: maskSecret(config.apiKey) },
      accountNumber, ifsc, accountName, referenceNumber: refNo,
    }, "VENDOR");
    let response = await call(false);
    // Refresh token once and retry on token mismatch / unauthorized.
    if (response?.data?.StatusCode === "NP034") {
      customLog(null, "info", { message: "NuPay validation token mismatch — refreshing and retrying", url }, "VENDOR");
      response = await call(true);
    }
    const data = response?.data || {};
    customLog(null, "info", { message: "NuPay account verification response", url, status: response?.status, data }, "VENDOR");

    const statusCode = data.StatusCode || "";
    return {
      verified: statusCode === "NP000",
      accountExists: statusCode === "NP000" || statusCode === "NP001",
      isMatched: data.IsMatched === true,
      matchPercentage: data.Percentage ?? null,
      accountHolderName: data.BankResponse || "",
      utr: data.UTR || "",
      statusCode,
      message: data.StatusDesc || "",
      providerResponse: data,
    };
  } catch (error) {
    customLog(null, "error", { message: "Error in NuPay verifyBankAccount", error: error?.message, data: error?.response?.data }, "VENDOR");
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse(error?.response?.data?.message || "Bank account verification failed", 400);
  }
};

// GET /onboarding/v1/merchants/list — status + credentials_link per merchant
exports.getMerchantList = async ({ start_date, end_date, offset = 0, limit = 100, mid } = {}) => {
  const config = await getVendorConfig();
  const url = `${config.apiUrl}/onboarding/v1/merchants/list`;
  const params = { start_date, end_date, offset, limit, ...(mid ? { mid } : {}) };
  try {
    const token = await getAccessToken(config);
    customLog(null, "info", {
      message: "NuPay merchant list request",
      url,
      config: { apiUrl: config.apiUrl, accessKey: maskSecret(config.accessKey) },
      token: maskSecret(token),
      params,
    }, "VENDOR");
    const response = await axios({
      method: "GET",
      url,
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    customLog(null, "info", { message: "NuPay merchant list response", url, status: response?.status, data: response?.data }, "VENDOR");
    return response?.data || {};
  } catch (error) {
    customLog(null, "error", { message: "NuPay merchant list failed", url, status: error?.response?.status, data: error?.response?.data, error: error?.message }, "VENDOR");
    throw new ErrorResponse(error?.response?.data?.message || "Unable to fetch merchant list", 400);
  }
};
