/**
 * ONDC Network Observability (NO) log push.
 *
 * Vendor row (accessKey: "ondc_observability"):
 *   apiUrl    = push-txn-logs URL (full path, or host — path is appended)
 *   optional1 = NP-portal bearer token
 *
 * Missing config skips the push. Failures never throw to the protocol path —
 * checkout and webhook ACKs must not wait on analytics.
 */

const { default: axios } = require("axios");
const { findServiceOperatorByAccessKey } = require("../utils/checkAndFetchServiceDetails");
const { customLog } = require("../utils/loggerHelper");

const ONDC_NO_ACCESS_KEY = "ondc_observability";
const PUSH_PATH = "/v1/api/push-txn-logs";
const CONFIG_CACHE_TTL_MS = 30 * 1000;
const PUSH_TIMEOUT_MS = 5000;
const PII_MASK = "****";
const NAME_PARENTS = new Set(["billing", "person", "address", "contact"]);

/** @type {{ value: { url: string, token: string } | null, expiresAt: number } | null} */
let configCache = null;
let hasLoggedUnconfigured = false;

const normalizeNoApiUrl = (raw) => {
  const trimmed = String(raw || "").trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  if (/\/v1\/api\/push-txn-logs$/i.test(trimmed)) return trimmed;
  return `${trimmed}${PUSH_PATH}`;
};

const getNoConfig = async () => {
  if (configCache && configCache.expiresAt > Date.now()) {
    return configCache.value;
  }
  let value = null;
  try {
    const service = await findServiceOperatorByAccessKey(ONDC_NO_ACCESS_KEY);
    if (service && !service.error && service.vendor) {
      const url = normalizeNoApiUrl(service.vendor.apiUrl);
      const token = String(service.vendor.optional1 || "").trim();
      if (url && token) value = { url, token };
    }
  } catch (err) {
    customLog(null, "error", {
      message: "ONDC NO config read failed — skipping log push",
      error: err?.message || String(err),
    }, "VENDOR");
  }
  if (!value && !hasLoggedUnconfigured) {
    hasLoggedUnconfigured = true;
    customLog(null, "info", {
      message: "ONDC NO log push skipped: no ondc_observability vendor url/token",
    }, "VENDOR");
  }
  if (value) hasLoggedUnconfigured = false;
  configCache = { value, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
  return value;
};

const clearNoConfigCache = () => {
  configCache = null;
  hasLoggedUnconfigured = false;
};

const cloneJson = (value) => {
  if (value == null) return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (err) {
    return null;
  }
};

const maskPiiNode = (node, parentKey) => {
  if (Array.isArray(node)) {
    node.forEach((child) => maskPiiNode(child, parentKey));
    return;
  }
  if (!node || typeof node !== "object") return;
  for (const [key, child] of Object.entries(node)) {
    const lower = String(key).toLowerCase();
    if ((lower === "phone" || lower === "email") && typeof child === "string") {
      node[key] = PII_MASK;
      continue;
    }
    if (lower === "name" && NAME_PARENTS.has(parentKey) && typeof child === "string") {
      node[key] = PII_MASK;
      continue;
    }
    maskPiiNode(child, lower);
  }
};

const anonymizeOndcPayload = (body) => {
  const cloned = cloneJson(body);
  if (!cloned || typeof cloned !== "object") return cloned;
  maskPiiNode(cloned, "");
  return cloned;
};

const errorMessageFromResponse = (responseData) => {
  if (responseData == null) return null;
  if (typeof responseData === "string") return responseData;
  return (
    responseData?.error?.message ||
    responseData?.message?.ack?.status ||
    responseData?.message ||
    null
  );
};

/**
 * Build the NO envelopes for one outbound BPP/gateway call. Does not POST.
 * HTTP 4xx/5xx (or a missing status after a transport failure) attach TECH-ERROR
 * on the request log and omit *_response.
 */
const buildOutboundEnvelopes = ({ action, requestPayload, httpStatus, responseData } = {}) => {
  if (!action || !requestPayload) return [];
  const data = anonymizeOndcPayload(requestPayload);
  if (!data || typeof data !== "object") return [];

  const httpOk = Number.isInteger(httpStatus) && httpStatus >= 200 && httpStatus < 300;
  if (!httpOk) {
    const code = Number.isInteger(httpStatus) ? String(httpStatus) : "500";
    data.error = {
      type: "TECH-ERROR",
      code,
      message: String(errorMessageFromResponse(responseData) || `HTTP ${code}`),
    };
    return [{ type: action, data }];
  }

  const envelopes = [{ type: action, data }];
  if (responseData != null) {
    envelopes.push({
      type: `${action}_response`,
      data: anonymizeOndcPayload(responseData),
    });
  }
  return envelopes;
};

const buildInboundEnvelopes = ({ reqBody, ackBody } = {}) => {
  const action = reqBody?.context?.action;
  if (!action) return [];
  const envelopes = [{ type: action, data: anonymizeOndcPayload(reqBody) }];
  if (ackBody != null) {
    envelopes.push({
      type: `${action}_response`,
      data: anonymizeOndcPayload({
        context: reqBody.context,
        ...ackBody,
      }),
    });
  }
  return envelopes;
};

const pushTxnLog = async ({ type, data }) => {
  if (!type || data == null) return;
  const cfg = await getNoConfig();
  if (!cfg) return;
  try {
    await axios.post(
      cfg.url,
      { type, data },
      {
        timeout: PUSH_TIMEOUT_MS,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${cfg.token}`,
        },
        validateStatus: () => true,
      }
    );
  } catch (err) {
    customLog(null, "error", {
      message: "ONDC NO push-txn-logs failed",
      type,
      error: err?.message || String(err),
    }, "VENDOR");
  }
};

const dispatchEnvelopes = (envelopes) => {
  if (!envelopes?.length) return;
  setImmediate(() => {
    Promise.all(envelopes.map((envelope) => pushTxnLog(envelope))).catch((err) => {
      customLog(null, "error", {
        message: "ONDC NO push dispatch failed",
        error: err?.message || String(err),
      }, "VENDOR");
    });
  });
};

const reportOutbound = (args) => {
  try {
    dispatchEnvelopes(buildOutboundEnvelopes(args));
  } catch (err) {
    customLog(null, "error", {
      message: "ONDC NO outbound report failed",
      error: err?.message || String(err),
    }, "VENDOR");
  }
};

const reportInbound = (args) => {
  try {
    dispatchEnvelopes(buildInboundEnvelopes(args));
  } catch (err) {
    customLog(null, "error", {
      message: "ONDC NO inbound report failed",
      error: err?.message || String(err),
    }, "VENDOR");
  }
};

module.exports = {
  ONDC_NO_ACCESS_KEY,
  PUSH_PATH,
  anonymizeOndcPayload,
  normalizeNoApiUrl,
  buildOutboundEnvelopes,
  buildInboundEnvelopes,
  reportOutbound,
  reportInbound,
  getNoConfig,
  clearNoConfigCache,
};
