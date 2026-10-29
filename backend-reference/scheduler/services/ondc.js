const sodium = require("libsodium-wrappers");
const { default: axios } = require("axios");
const { v4: uuidv4 } = require("uuid");
const { findServiceOperatorByAccessKey } = require("../utils/checkAndFetchServiceDetails");
const { customLog } = require("../utils/loggerHelper");
const { reportOutbound } = require("./ondcObservability");

// accessKey of the ServiceOperator row holding the ONDC vendor credentials
// (the same shared DB row the purchase service reads).
const ONDC_ACCESS_KEY = "ondc_gateway";

// Fallback defaults for the network params kept in the JSON `optionals` field
// (used only when the corresponding key is absent on the vendor row).
const DEFAULTS = {
  country: "IND",
  coreVersion: "1.2.5",
  subscriberType: "BAP",
  ttl: "PT30S",
};

/**
 * Fetch ONDC config from the shared DB vendor row.
 *
 * ServiceOperator vendor mapping (accessKey: "ondc_gateway"):
 *   apiUrl    = ONDC gateway base URL (the /search endpoint)
 *   optional1 = BAP_ID
 *   optional2 = BAP_URI
 *   optional3 = UNIQUE_KEY_ID
 *   optional4 = SIGNING_PRIVATE_KEY_BASE64 (64-byte base64 ed25519 signing key)
 *   optional5 = DOMAIN  (e.g. "ONDC:RET14")
 *   optional6 = CITY    (e.g. "std:080")
 *   optionals = JSON { country, coreVersion, subscriberType, ttl }
 */
const getOndcConfig = async () => {
  const service = await findServiceOperatorByAccessKey(ONDC_ACCESS_KEY);
  if (!service || service.error) {
    throw new Error(service?.error || "ONDC service operator not configured");
  }
  const v = service.vendor;
  if (!v) {
    throw new Error("ONDC vendor configuration missing");
  }
  const extra = v.optionals || {};
  return {
    gatewayUrl: v.apiUrl,
    bapId: v.optional1,
    bapUri: v.optional2,
    uniqueKeyId: v.optional3,
    privateKey: v.optional4,
    domain: v.optional5,
    city: v.optional6,
    country: extra.country || DEFAULTS.country,
    coreVersion: extra.coreVersion || DEFAULTS.coreVersion,
    subscriberType: extra.subscriberType || DEFAULTS.subscriberType,
    ttl: extra.ttl || DEFAULTS.ttl,
  };
};

// =======================
// AUTH SIGNATURE
// =======================
const createOndcAuthorizationHeader = async (bodyString, { bapId, uniqueKeyId, privateKey }) => {
  await sodium.ready;
  const created = Math.floor(Date.now() / 1000);
  const expires = created + 3600;

  const digestBytes = sodium.crypto_generichash(
    64,
    sodium.from_string(bodyString)
  );

  const digestBase64 = sodium.to_base64(
    digestBytes,
    sodium.base64_variants.ORIGINAL
  );

  const signingString =
    `(created): ${created}\n` +
    `(expires): ${expires}\n` +
    `digest: BLAKE-512=${digestBase64}`;

  const privateKeyBytes = sodium.from_base64(
    privateKey,
    sodium.base64_variants.ORIGINAL
  );

  if (privateKeyBytes.length !== 64) {
    throw new Error(
      `Invalid private key length. Expected 64 bytes, got ${privateKeyBytes.length} bytes.`
    );
  }

  const signatureBytes = sodium.crypto_sign_detached(
    signingString,
    privateKeyBytes
  );

  const signatureBase64 = sodium.to_base64(
    signatureBytes,
    sodium.base64_variants.ORIGINAL
  );

  return `Signature keyId="${bapId}|${uniqueKeyId}|ed25519",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signatureBase64}"`;
};

// =======================
// SIGNED POST
// =======================
const signedPost = async (url, payload, creds) => {
  const bodyString = JSON.stringify(payload);
  const authorization = await createOndcAuthorizationHeader(bodyString, creds);

  customLog(null, "info", {
    message: "ONDC signed POST request",
    url,
    body: bodyString,
  }, "VENDOR");

  const response = await axios.post(url, bodyString, {
    timeout: 30000,
    transformRequest: [(data) => data],
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authorization,
    },
    validateStatus: () => true,
  });

  customLog(null, "info", {
    message: "ONDC signed POST response",
    status: response.status,
    data: response.data,
  }, "VENDOR");

  return response;
};

// =======================
// GATEWAY SEARCH
/**
 * Whether the platform is currently pointed at a scripted test harness (the ONDC
 * Workbench) rather than real sellers.
 *
 * Reads the "ecommerce" row, not this file's own "ondc_gateway" one: the lever is
 * `optionals.forceTransactionId`, and it lives on the row purchase transacts
 * through. Cron jobs must consult this before sending anything to a BPP — a
 * scenario tracks one transaction id and rejects any action it did not expect, so
 * an unsolicited call from a background sweep desyncs it.
 *
 * Failing open (returning false) would resume that traffic the moment the config
 * read hiccups, so an unreadable row is treated as "assume test mode".
 */
const isOndcWorkbenchMode = async () => {
  try {
    const service = await findServiceOperatorByAccessKey("ecommerce");
    if (!service || service.error || !service.vendor) return true;
    return Boolean(service.vendor.optionals?.forceTransactionId);
  } catch (error) {
    customLog(null, "error", {
      message: "Could not read ONDC config to check workbench mode, assuming it is ON",
      error: error?.message || String(error),
    }, "VENDOR");
    return true;
  }
};

// =======================
// NOTE: there is deliberately no `search` here any more. The scheduler's only
// caller was the office-supply catalog-refresh sweep, and the storefront now
// searches the network itself (purchase's triggerOndcCitySearch) so the answers
// can be read back scoped to the search that asked for them. Discovery from a
// cron also cannot honour a pinned scenario transaction id — this file reads a
// different vendor row (`ondc_gateway`) with no such lever — so every one of its
// searches was an id a test target had never issued.

// =======================
// BPP-ADDRESSED ACTIONS
// =======================
/**
 * POST a signed ONDC action straight to a seller's BPP. Unlike `search` (which goes to
 * the gateway) these are addressed to `${bpp_uri}/${action}` and the context carries
 * bpp_id + bpp_uri.
 *
 * Mirrors purchase's bppOrderAction field-for-field, deliberately: the context IS what
 * the signature covers, so a drifted field here is a NACK from the seller rather than a
 * soft failure. If you change one, change both.
 */
const bppOrderAction = async (
  action,
  { message, bppId, bppUri, transactionId, messageId, city, domain } = {}
) => {
  if (!message) throw new Error(`ONDC ${action}: message is required`);
  if (!bppUri) throw new Error(`ONDC ${action}: bppUri is required`);

  try {
    const cfg = await getOndcConfig();

    const transaction_id = transactionId || uuidv4();
    const message_id = messageId || uuidv4();

    const payload = {
      context: {
        domain: domain || cfg.domain,
        country: cfg.country,
        city: city || cfg.city,
        action,
        core_version: cfg.coreVersion,
        bap_id: cfg.bapId,
        bap_uri: cfg.bapUri,
        bpp_id: bppId,
        bpp_uri: bppUri,
        transaction_id,
        message_id,
        timestamp: new Date().toISOString(),
        ttl: cfg.ttl,
      },
      message,
    };

    let httpStatus = null;
    let responseData = null;
    try {
      const response = await signedPost(`${bppUri}/${action}`, payload, cfg);
      httpStatus = response.status;
      responseData = response.data;

      return {
        status: response.status,
        data: response.data,
        transactionId: transaction_id,
        messageId: message_id,
      };
    } catch (postError) {
      if (httpStatus == null) {
        httpStatus = postError?.httpStatus ?? postError?.response?.status ?? null;
        responseData = postError?.response?.data ?? responseData;
      }
      throw postError;
    } finally {
      reportOutbound({
        action,
        requestPayload: payload,
        httpStatus,
        responseData,
      });
    }
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, "error", {
      message: `ONDC ${action} error`,
      error: errData,
    }, "VENDOR");
    throw new Error(errData?.message || errData || `Failed to initiate ONDC ${action}`);
  }
};

/**
 * ONDC `status` — ask a BPP for the current state of a confirmed order. The seller ACKs
 * synchronously and replies with the real order (state + fulfillments) asynchronously on
 * the PURCHASE service's on_status webhook: bap_uri comes from the shared vendor row and
 * points there, so purchase persists the answer even though the scheduler asked.
 *
 * transactionId is the order's existing one, reused not regenerated — it is what the
 * webhook keys the update on. Dropping it would strand the reply.
 */
const status = ({ bppId, bppUri, orderId, transactionId, messageId, city, domain } = {}) => {
  if (!orderId) throw new Error("ONDC status: orderId is required");
  return bppOrderAction("status", {
    bppId,
    bppUri,
    message: { order_id: orderId },
    transactionId,
    messageId,
    city,
    domain,
  });
};

module.exports = {
  ONDC_ACCESS_KEY,
  createOndcAuthorizationHeader,
  signedPost,
  bppOrderAction,
  status,
  getOndcConfig,
  isOndcWorkbenchMode,
};
