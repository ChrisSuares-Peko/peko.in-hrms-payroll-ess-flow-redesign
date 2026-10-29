/**
 * ONDC BPP confirm — same transport as purchase/services/ondc.js confirm path.
 * paymentGateway uses this after Cashfree capture; init order comes from DB
 * (ondcCallbackLogs on_init payload).
 */

const sodium = require("libsodium-wrappers");
const { default: axios } = require("axios");
const { v4: uuidv4 } = require("uuid");
const { findServiceOperatorByAccessKey } = require("../utils/checkAndFetchServiceDetails");
const { customLog } = require("../utils/loggerHelper");
const { reportOutbound } = require("./ondcObservability");

const ONDC_ACCESS_KEY = "ecommerce";

/** How long to wait for a BPP's synchronous ACK (not its async callback). */
const ACK_TIMEOUT_MS = 10000;

// Fallback defaults for the network params on the shared "ecommerce" vendor row.
// Kept identical to purchase/services/ondc.js — both services read that one row,
// so a domain/version set for one must mean the same thing to the other.
const DEFAULTS = {
  domain: "ONDC:RET14",
  city: "std:030",
  country: "IND",
  coreVersion: "1.2.5",
  subscriberType: "BAP",
  ttl: "PT30S",
};

// Cached briefly for the same reason as purchase/services/ondc.js: confirm reads
// this per seller group, and an admin editing the row is the only way it changes.
const CONFIG_CACHE_TTL_MS = 30 * 1000;
/** @type {{ value: Object, expiresAt: number } | null} */
let configCache = null;

const getOndcConfig = async () => {
  if (configCache && configCache.expiresAt > Date.now()) {
    return configCache.value;
  }
  const service = await findServiceOperatorByAccessKey(ONDC_ACCESS_KEY);
  if (!service || service.error) {
    throw new Error(service?.error || "ONDC service operator not configured");
  }
  const v = service.vendor;
  if (!v) {
    throw new Error("ONDC vendor configuration missing");
  }
  const extra = v.optionals || {};
  const config = {
    gatewayUrl: v.apiUrl,
    bapId: v.optional3,
    bapUri: v.optional4,
    uniqueKeyId: v.optional2,
    privateKey: v.optional1,
    domain: v.optional5 || DEFAULTS.domain,
    city: v.optional6 || DEFAULTS.city,
    country: extra.country || DEFAULTS.country,
    coreVersion: extra.coreVersion || DEFAULTS.coreVersion,
    subscriberType: extra.subscriberType || DEFAULTS.subscriberType,
    ttl: extra.ttl || DEFAULTS.ttl,
    forceTransactionId: extra.forceTransactionId || null,
  };
  // See purchase/services/ondc.js — a pinned transaction id means the target is
  // a scripted test harness, not a real seller.
  config.workbenchMode = Boolean(config.forceTransactionId);
  configCache = { value: config, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
  return config;
};

/** Drop the cached vendor row (tests, and after an admin edits the config). */
const clearOndcConfigCache = () => {
  configCache = null;
};

const createOndcAuthorizationHeader = async (bodyString, { bapId, uniqueKeyId, privateKey }) => {
  await sodium.ready;
  const created = Math.floor(Date.now() / 1000);
  const expires = created + 3600;

  const digestBytes = sodium.crypto_generichash(64, sodium.from_string(bodyString));
  const digestBase64 = sodium.to_base64(digestBytes, sodium.base64_variants.ORIGINAL);

  const signingString =
    `(created): ${created}\n` +
    `(expires): ${expires}\n` +
    `digest: BLAKE-512=${digestBase64}`;

  const privateKeyBytes = sodium.from_base64(privateKey, sodium.base64_variants.ORIGINAL);
  if (privateKeyBytes.length !== 64) {
    throw new Error(
      `Invalid private key length. Expected 64 bytes, got ${privateKeyBytes.length} bytes.`
    );
  }

  const signatureBytes = sodium.crypto_sign_detached(signingString, privateKeyBytes);
  const signatureBase64 = sodium.to_base64(signatureBytes, sodium.base64_variants.ORIGINAL);

  return `Signature keyId="${bapId}|${uniqueKeyId}|ed25519",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signatureBase64}"`;
};

const signedPost = async (url, payload, creds) => {
  const bodyString = JSON.stringify(payload);
  const authorization = await createOndcAuthorizationHeader(bodyString, creds);

  customLog(null, "info", {
    message: "ONDC signed POST request",
    url,
    body: bodyString,
  }, "VENDOR");

  const response = await axios.post(url, bodyString, {
    // A BPP only returns the synchronous ACK here — the actual on_confirm/on_init
    // arrives later as a webhook — so 30s was budgeting an async wait on a call
    // that answers in milliseconds. Bounded well under the API-gateway limit so a
    // dead seller cannot stall a multi-seller checkout.
    timeout: ACK_TIMEOUT_MS,
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

/**
 * Mirrors purchase/services/ondc.js — a receiver refused the action outright, in
 * its synchronous reply, and told us why in `ondcMessage`.
 */
class OndcAckError extends Error {
  constructor(action, { ondcCode, ondcMessage, ackStatus, httpStatus }) {
    super(`ONDC ${action} refused: ${ondcMessage}`);
    this.name = "OndcAckError";
    this.action = action;
    this.ondcCode = ondcCode || null;
    this.ondcMessage = ondcMessage;
    this.ackStatus = ackStatus || null;
    this.httpStatus = httpStatus ?? null;
  }
}

/**
 * Reject anything that is not a clean synchronous ACK.
 *
 * `signedPost` passes `validateStatus: () => true`, so nothing here throws on its
 * own — not a NACK carried at HTTP 200, and not a non-2xx either. Both used to be
 * logged as `ONDC confirm sent` while the order was never placed.
 */
const assertOndcAck = (action, url, response) => {
  const httpStatus = response?.status;
  const data = response?.data;
  const ackStatus = data?.message?.ack?.status ?? null;
  const httpOk = Number.isInteger(httpStatus) && httpStatus >= 200 && httpStatus < 300;
  const acked = String(ackStatus).toUpperCase() === "ACK";

  if (httpOk && acked) return;

  const ondcCode = data?.error?.code || null;
  const ondcMessage =
    data?.error?.message ||
    (ondcCode ? `error ${ondcCode}` : null) ||
    (!httpOk ? `HTTP ${httpStatus}` : null) ||
    (ackStatus ? `ack status ${ackStatus}` : "no ACK in response");

  customLog(null, "error", {
    message: `ONDC ${action} was not ACKed`,
    action,
    url,
    httpStatus: httpStatus ?? null,
    ackStatus,
    ondcCode,
    ondcMessage,
    responseData: data ?? null,
  }, "VENDOR");

  throw new OndcAckError(action, { ondcCode, ondcMessage, ackStatus, httpStatus });
};

const bppOrderAction = async (
  action,
  { message, bppId, bppUri, transactionId, messageId, city, domain } = {}
) => {
  if (!message) throw new Error(`ONDC ${action}: order is required`);
  if (!bppUri) throw new Error(`ONDC ${action}: bppUri is required`);

  try {
    const cfg = await getOndcConfig();
    // The caller's id is authoritative — see purchase/services/ondc.js. This
    // /confirm has to land on the very id /init was parked under, so honouring
    // `forceTransactionId` here would address a different transaction than the
    // one being paid for.
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

    const url = `${bppUri.replace(/\/$/, "")}/${action}`;

    // Mirrors purchase's logOutboundAction — this is the /confirm that actually
    // places the order, and a receiver that rejects the id only ever says so
    // about the id, so we need our own record of what went on the wire (and
    // whether the test pin rewrote the caller's id) to compare against.
    const auditFields = {
      action,
      url,
      transactionId: transaction_id,
      messageId: message_id,
      ...(transactionId && transactionId !== transaction_id
        ? { requestedTransactionId: transactionId, transactionIdPinned: true }
        : {}),
      workbenchMode: Boolean(cfg.workbenchMode),
      domain: payload.context.domain,
    };

    let httpStatus = null;
    let responseData = null;

    try {
      const response = await signedPost(url, payload, cfg);
      httpStatus = response.status;
      responseData = response.data;
      // Before the success log: a refused confirm must not read as an order placed.
      assertOndcAck(action, url, response);
      customLog(null, "info", {
        message: `ONDC ${action} sent`,
        ...auditFields,
        status: response.status,
      }, "VENDOR");

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
      customLog(null, "error", {
        message: `ONDC ${action} rejected`,
        ...auditFields,
        status: postError?.httpStatus ?? postError?.response?.status,
        error: postError?.ondcMessage || postError?.response?.data || postError.message,
      }, "VENDOR");
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
    // Rethrown as-is so the confirm caller can record the seller's own words
    // against the group instead of a flattened string.
    if (error instanceof OndcAckError) throw error;
    const errData = error?.response?.data || error.message;
    customLog(null, "error", {
      message: `ONDC ${action} error`,
      error: errData,
    }, "VENDOR");
    throw new Error(errData?.message || errData || `Failed to initiate ONDC ${action}`);
  }
};

/**
 * Same as purchase/services/ondc.js confirm — echoes on_init order, marks PAID.
 *
 * Also fills the three fields the Workbench confirm validator refuses without:
 * order.id (BAP-minted, ORDER_ID), order.state "Created" (ORDER_STATE), and
 * fulfillments[].end.person.name (FULFILLMENTS_END_PERSON_NAME).
 */
const ONDC_ORDER_ID_RE = /^[0-9a-zA-Z/-_]{1,36}$/;

const toOndcNetworkId = (candidate) => {
  const raw = String(candidate || "").trim();
  return ONDC_ORDER_ID_RE.test(raw) ? raw : null;
};

const normalizeOndcNetworkId = (candidate, fallback = "F1") => {
  const kept = toOndcNetworkId(candidate);
  if (kept) return kept;
  const stripped = toOndcNetworkId(String(candidate || "").replace(/-/g, ""));
  if (stripped) return stripped;
  return fallback;
};

const confirm = ({
  bppId,
  bppUri,
  transactionId,
  messageId,
  city,
  domain,
  initOrder,
  paymentRef,
} = {}) => {
  if (!initOrder) throw new Error("ONDC confirm: initOrder (the on_init message.order) is required");

  const now = new Date().toISOString();
  const quote = initOrder.quote;
  const existingId = String(initOrder.id || "").trim();
  const orderId = toOndcNetworkId(existingId) || uuidv4().replace(/-/g, "");
  const recipientName = [
    ...(initOrder.fulfillments || []).map((f) => f?.end?.person?.name),
    initOrder.billing?.name,
  ]
    .map((v) => String(v || "").trim())
    .find(Boolean) || null;

  const fulfillmentIdMap = new Map();
  const fulfillments = (initOrder.fulfillments || []).map((f, index) => {
    const end = f.end && typeof f.end === "object" ? { ...f.end } : {};
    if (recipientName) {
      end.person = { ...(end.person && typeof end.person === "object" ? end.person : {}), name: recipientName };
    }
    const id = normalizeOndcNetworkId(f.id, `F${index + 1}`);
    if (f.id != null && String(f.id).trim()) fulfillmentIdMap.set(String(f.id).trim(), id);
    return {
      id,
      type: f.type,
      "@ondc/org/TAT": f["@ondc/org/TAT"] || "P1DT1H",
      tracking: f.tracking ?? false,
      end,
    };
  });

  const items = (initOrder.items || []).map((item) => {
    const raw = item?.fulfillment_id;
    const rewritten = raw != null && fulfillmentIdMap.has(String(raw))
      ? fulfillmentIdMap.get(String(raw))
      : normalizeOndcNetworkId(raw);
    return rewritten === raw ? item : { ...item, fulfillment_id: rewritten };
  });

  const order = {
    id: orderId,
    state: "Created",
    provider: initOrder.provider,
    items,
    billing: initOrder.billing,
    fulfillments,
    quote,
    payment: {
      ...initOrder.payment,
      status: "PAID",
      params: {
        currency: quote?.price?.currency || "INR",
        amount: quote?.price?.value,
        transaction_id: paymentRef || uuidv4(),
      },
      "@ondc/org/transaction_id": uuidv4(),
    },
    created_at: now,
    updated_at: now,
  };

  return bppOrderAction("confirm", {
    bppId,
    bppUri,
    message: { order },
    city,
    domain,
    messageId,
    transactionId,
  });
};

module.exports = {
  getOndcConfig,
  clearOndcConfigCache,
  confirm,
  // The ORDER_ID rule confirm() applies — exported so a caller can mint (and
  // record) the order id before sending.
  toOndcNetworkId,
  OndcAckError,
  assertOndcAck,
};
