const asyncHandler = require("../../../middlewares/async");
const { customLog } = require("../../../utils/loggerHelper");
const {
  getEntityFieldSpec,
  onboardMerchant,
  verifyBankAccount,
} = require("../../../services/nupayOnboarding");
const { buildMiqBuffer } = require("../../../services/miqBuilder");
const { generateClientReferenceId } = require("../../../services/nupayGateway");
const { uploadFile, deleteFile } = require("../../../utils/commonUploadFile");
const axios = require("axios");
const paymentLinkOnboarding = require("../../../models/entities/paymentLinkOnboarding");

const SUPPORTED_ENTITY_TYPES = ["individual", "sole_proprietorship", "partnership", "private_limited"];

// Public base URL for the webhooks NuPay calls back on — reuses the same env convention
// as other vendor callbacks (pluralGateway): STAGING_URL on staging, else PRODUCTION_URL.
const webhookBase = () => {
  const base =
    process.env.NODE_ENV === "staging" ? process.env.STAGING_URL : process.env.PRODUCTION_URL;
  return String(base || process.env.NUPAY_WEBHOOK_BASE_URL || "").replace(/\/+$/, "");
};

// NuPay (and the MIQ) require full URLs with a scheme. Prepend https:// only when the user
// omitted it; an existing http(s):// value is left untouched.
const withScheme = (value) => {
  const s = String(value ?? "").trim();
  if (!s) return s;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

const URL_FIELDS = [
  "website_url", "about_us_link", "terms_link", "contact_us_link", "privacy_link",
  "pricing_link", "refund_link", "cancellation_link", "shipping_link",
];

// GET /onboarding/nupay/field-spec?entityType=... — drives the FE document checklist
exports.getNupayFieldSpec = asyncHandler(async (req, res) => {
  const entityType = String(req.query.entityType || "").trim();
  if (!SUPPORTED_ENTITY_TYPES.includes(entityType)) {
    return res.status(400).json({
      status: false,
      message: `entityType must be one of: ${SUPPORTED_ENTITY_TYPES.join(", ")}`,
      responseCode: "400",
      data: {},
    });
  }

  const spec = getEntityFieldSpec(entityType);
  // FE only needs what the corporate supplies — backend-filled fields are excluded
  const backendFilled = new Set([
    "mid", "client_reference_id", "product_type", "entity_type", "provider_id",
    "onboarding_webhook_url", "collection_webhook_url", "settlement_webhook_url",
    "merchant_name", "contact_number", "official_email",
    "bank_account_number", "ifsc_code",
  ]);

  return res.status(200).json({
    status: true,
    message: "Field spec fetched",
    responseCode: "000",
    data: {
      entityType,
      textFields: spec.textFields.filter((f) => !backendFilled.has(f.name)),
      // miq is backend-generated, not a user upload
      fileFields: spec.fileFields.filter((f) => f.name !== "miq"),
    },
  });
});

// POST /onboarding/nupay/verify-bank — penny-drop verification via NuPay account-validation API
exports.verifyNupayBank = asyncHandler(async (req, res) => {
  const { accountNumber, ifsc, accountName } = req.body;
  if (!accountNumber || !ifsc) {
    return res.status(400).json({
      status: false,
      message: "accountNumber and ifsc are required",
      responseCode: "400",
      data: {},
    });
  }

  const result = await verifyBankAccount({ accountNumber, ifsc, accountName });

  return res.status(200).json({
    status: true,
    message: result.verified ? "Bank account verified" : result.message || "Bank account could not be verified",
    responseCode: "000",
    data: {
      verified: result.verified,
      accountHolderName: result.accountHolderName,
      isMatched: result.isMatched,
      matchPercentage: result.matchPercentage,
      statusCode: result.statusCode,
      message: result.message,
    },
  });
});

// POST /onboarding/nupay/submit (multipart) — the whole NuPay onboarding wizard submits here.
// All identity/bank/doc fields come in the request body; the onboarding record is created if absent.
exports.submitNupayOnboarding = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const entityType = String(req.body.entityType || req.body.entity_type || "").trim();

  if (!SUPPORTED_ENTITY_TYPES.includes(entityType)) {
    return res.status(400).json({
      status: false,
      message: `entityType must be one of: ${SUPPORTED_ENTITY_TYPES.join(", ")}`,
      responseCode: "400",
      data: {},
    });
  }

  const {
    merchant_name: merchantName,
    contact_number: contactNumber,
    official_email: officialEmail,
    website_url: websiteUrl,
    city,
    state,
    pincode,
    bank_account_number: bankAccountNumber,
    ifsc_code: ifscCode,
    cin,
    ownership_percentage_details: ownershipPercentageDetails,
  } = req.body;

  const missing = [
    ["merchant_name", merchantName],
    ["contact_number", contactNumber],
    ["official_email", officialEmail],
    ["bank_account_number", bankAccountNumber],
    ["ifsc_code", ifscCode],
  ].filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    return res.status(400).json({
      status: false,
      message: `Missing required fields: ${missing.join(", ")}`,
      responseCode: "400",
      data: {},
    });
  }

  let record = await paymentLinkOnboarding.findOne({ where: { credentialId } });
  // Only a completed NuPay onboarding counts as "already onboarded"; a legacy Decentro-active
  // record must still be allowed to onboard on NuPay.
  if (record && record.status === "active" && record.vendor === "nupay") {
    return res.status(200).json({
      status: true,
      message: "Already onboarded",
      responseCode: "000",
      data: { status: record.status },
    });
  }

  const base = webhookBase();
  const clientReferenceId = generateClientReferenceId();
  console.log("client_reference_id:", clientReferenceId);
  // Only defined values — onboardMerchant validates required fields by presence.
  const fields = Object.fromEntries(
    Object.entries({
      mid: String(credentialId),
      client_reference_id: clientReferenceId,
      merchant_name: merchantName,
      contact_number: contactNumber,
      official_email: officialEmail,
      website_url: withScheme(websiteUrl),
      city,
      state,
      pincode,
      bank_account_number: bankAccountNumber,
      ifsc_code: ifscCode,
      cin,
      ownership_percentage_details: ownershipPercentageDetails,
      onboarding_webhook_url: `${base}/api/v1/webhook/nupay/payment/onboarding/status`,
      collection_webhook_url: `${base}/api/v1/webhook/nupay/payment/payment-links/callback`,
      settlement_webhook_url: `${base}/api/v1/webhook/nupay/payment/payment-links/settlement`,
    }).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );

  // TEMP DEBUG (remove after verifying) — client_reference_id + webhook URLs sent to NuPay.
  customLog(req?.LogTraceId, "info", {
    message: "NuPay onboarding webhook URLs",
    nodeEnv: process.env.NODE_ENV,
    client_reference_id: clientReferenceId,
    base,
    onboarding_webhook_url: fields.onboarding_webhook_url,
    collection_webhook_url: fields.collection_webhook_url,
    settlement_webhook_url: fields.settlement_webhook_url,
  }, "VENDOR");

  // Documents were staged in storage by the FE; fetch each back into a buffer to forward to NuPay.
  const documents = req.body.documents || {};
  // F-PAY-12: doc urls are client-supplied — only fetch/delete from our own storage bucket (block SSRF + arbitrary delete).
  const isAllowedDocUrl = (u) => {
    try {
      const parsed = new URL(u);
      return parsed.protocol === "https:" &&
        parsed.hostname === "firebasestorage.googleapis.com" &&
        parsed.pathname.startsWith("/v0/b/peko-storage.appspot.com/");
    } catch {
      return false;
    }
  };
  if (Object.values(documents).some((ref) => ref && ref.url && !isAllowedDocUrl(ref.url))) {
    return res.status(400).json({ status: false, message: "Invalid document url", responseCode: "400", data: {} });
  }
  const files = {};
  await Promise.all(
    Object.entries(documents).map(async ([fieldname, ref]) => {
      if (!ref || !ref.url) return;
      const response = await axios({ method: "GET", url: ref.url, responseType: "arraybuffer" });
      files[fieldname] = {
        buffer: Buffer.from(response.data),
        filename: ref.filename || fieldname,
        contentType: ref.contentType || "application/octet-stream",
      };
    })
  );

  // NuPay accepts all documents in one request — reject if the combined size exceeds 100MB.
  const totalDocBytes = Object.values(files).reduce((sum, f) => sum + (f.buffer?.length || 0), 0);
  if (totalDocBytes > 100 * 1024 * 1024) {
    return res.status(400).json({
      status: false,
      message: "Total documents exceed 100MB. Please reduce and try again.",
      responseCode: "400",
      data: {},
    });
  }

  // Build the MIQ Excel for this merchant from the collected fields and attach it as the `miq` file.
  const miqData = {
    ...req.body,
    entity_type: entityType,
    account_holder_name: req.body.accountHolderName,
  };
  URL_FIELDS.forEach((k) => {
    if (miqData[k]) miqData[k] = withScheme(miqData[k]);
  });
  const miqBuffer = await buildMiqBuffer(miqData);
  files.miq = {
    buffer: miqBuffer,
    filename: "miq.xlsx",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  const result = await onboardMerchant({ entityType, fields, files });

  // Persist identity/bank on the record — contactNumber is the vault-link password later.
  const recordData = {
    businessName: merchantName,
    phone: contactNumber,
    email: officialEmail,
    accountNumber: bankAccountNumber,
    ifsc: ifscCode,
    vendor: "nupay",
    entityType,
    status: result.status,
    nupayRefNo: result.nupayRefNo,
    onboardingClientReferenceId: clientReferenceId,
    providerResponse: result.providerResponse,
  };
  if (record) {
    await record.update(recordData);
  } else {
    record = await paymentLinkOnboarding.create({ credentialId, ...recordData });
  }

  // Clean up the staged documents now they're forwarded (best-effort).
  await Promise.allSettled(
    Object.values(documents).map((ref) => (ref && ref.url && isAllowedDocUrl(ref.url) ? deleteFile(ref.url) : null))
  );

  customLog(req?.LogTraceId, "info", {
    message: "NuPay merchant onboarding submitted",
    credentialId,
    entityType,
    nupayRefNo: result.nupayRefNo,
    status: result.status,
  }, "VENDOR");

  return res.status(200).json({
    status: true,
    message: "Onboarding submitted. Verification is in progress.",
    responseCode: "000",
    data: {
      status: result.status,
      nupayRefNo: result.nupayRefNo,
      clientReferenceId,
    },
  });
});

// POST /onboarding/nupay/upload-doc — stage one document in storage, return its URL.
exports.uploadNupayOnboardingDoc = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ status: false, message: "No file provided", responseCode: "400", data: {} });
  }
  const ext = String(file.originalname.split(".").pop() || "").toLowerCase() || "bin";
  const base64 = file.buffer.toString("base64");
  // uploadFile checks the base64 length (~1.34x the binary), so allow headroom over the 20MB cap.
  const url = await uploadFile(base64, "nupay-onboarding", ext, 30);
  return res.status(200).json({
    status: true,
    message: "Document uploaded",
    responseCode: "000",
    data: { url, filename: file.originalname, contentType: file.mimetype },
  });
});
