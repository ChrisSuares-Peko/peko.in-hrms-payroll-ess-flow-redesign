const sodium = require("libsodium-wrappers");
const { default: axios } = require("axios");
const { v4: uuidv4 } = require("uuid");
const { findServiceOperatorByAccessKey } = require("../utils/checkAndFetchServiceDetails");
const { customLog } = require("../utils/loggerHelper");
const { parseOndcAmount, normalizeOndcGps, toOndcOrderId, ondcRecipientName, normalizeOndcNetworkId } = require("../utils/ondc_helper");
const { buildIgm2IssueMessage } = require("./ondcIgm2");
const { reportOutbound } = require("./ondcObservability");
// const ondcProducts = require("../models/entities/ondc_product_with_transactionId");

// accessKey of the ServiceOperator row holding the ONDC vendor credentials.
const ONDC_ACCESS_KEY = "ecommerce";

// Fallback defaults for the network params kept in the JSON `optionals` field
// (used only when the corresponding key is absent on the vendor row).
const DEFAULTS = {
  domain: "ONDC:RET14",
  city: "std:030",
  country: "IND",
  coreVersion: "1.2.5",
  subscriberType: "BAP",
  ttl: "PT30S",
  // catalog_full cannot be assembled inside PT30S; BPPs skip on_search after ttl.
  catalogFullTtl: "PT30M",
  // Buyer-app finder fee declared to the seller on /init. A protocol declaration
  // of the BAP's cut of the network settlement — it is NOT part of anything the
  // buyer pays (that is the platform fee, from the ServiceOperator's
  // providerCommission via computeOfficeSupplyPlatformFee).
  buyerFinderFeeType: "percent",
  buyerFinderFeeAmount: "3",
  // Whether that fee is actually withheld from the seller's Easy Split payout.
  // Off by default: the split is written once with `disable_split:true` and can
  // never be amended, so this ships inert and is switched on per environment by
  // setting `buyerFinderFeeDeductionEnabled` to 1 on the vendor row's optionals.
  buyerFinderFeeDeductionEnabled: false,
};

/** ONDC takes the finder fee as a percentage of the order or a flat amount. */

/**
 * An admin types these into the vendor row, so a typo must not reach the wire —
 * a malformed finder fee gets the whole /init NACKed by the BPP. Anything
 * unrecognised falls back to the default instead of being passed through.
 */

/**
 * The deduction toggle, typed into the vendor row by an admin as 1/0.
 *
 * Deliberately strict: it moves real money, so ONLY an explicit truthy value
 * switches it on. A blank, a missing key, "no", or anything unrecognised means
 * OFF — the safe direction, since a wrongly-enabled deduction cannot be undone
 * once Cashfree has taken the split.
 */
const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const normalizeFinderFeeDeductionEnabled = (value) => {
  if (value === true) return true;
  return TRUE_VALUES.has(String(value ?? "").trim().toLowerCase());
};

/** ONDC wants the amount as a string; blanks, non-numbers and negatives fall back. */
const normalizeFinderFeeAmount = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return DEFAULTS.buyerFinderFeeAmount;
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    return DEFAULTS.buyerFinderFeeAmount;
  }
  return String(amount);
};

/**
 * Fetch ONDC config from the DB vendor row (decentroGateway pattern).
 *
 * ServiceOperator vendor mapping (accessKey: "ecommerce"):
 *   apiUrl    = ONDC gateway base URL (the /search endpoint)
 *   healthUrl = ONDC registry lookup URL
 *               (e.g. https://preprod.registry.ondc.org/v2.0/lookup
 *                or  https://staging.registry.ondc.org/v2.0/lookup)
 *   optional1 = SIGNING_PRIVATE_KEY_BASE64
 *   optional2 = UNIQUE_KEY_ID
 *   optional3 = BAP_ID
 *   optional4 = BAP_URI
 *   optional5 = DOMAIN  (e.g. "ONDC:RET14")
 *   optional6 = CITY    (e.g. "std:080")
 *   optionals = JSON { country, coreVersion, subscriberType, ttl, catalogFullTtl?,
 *                      registryLookupUrl?, forceTransactionId?, gcrSubscriberId?,
 *                      buyerFinderFeeType?, buyerFinderFeeAmount?,
 *                      buyerFinderFeeDeductionEnabled? (1/0) }
 *               (registryLookupUrl overrides healthUrl when set;
 *                catalogFullTtl? ISO-8601 duration for catalog_full /search,
 *                default PT30M)
 *
 * Every network param falls back to DEFAULTS, so an unset row behaves exactly as
 * the previous hardcoded values did. `optional5` (DOMAIN) was documented but
 * ignored until now — needed because a target like the ONDC Workbench serves each
 * domain on its own path (…/api-service/ONDC:RET10/1.2.5/seller) and the payload
 * domain has to match the URL.
 *
 * Cached for CONFIG_CACHE_TTL_MS: this is read on every outbound action AND on
 * every inbound callback (the webhook auth middleware asks it whether we are
 * pointed at a test harness), which was one DB round trip per ONDC message.
 * The window is short enough that an admin editing the row — the only way it
 * changes, and how a Workbench scenario id is set — takes effect without a
 * restart.
 */
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
    registryLookupUrl: extra?.registryLookupUrl || v?.healthUrl || null,
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
    catalogFullTtl: extra.catalogFullTtl || DEFAULTS.catalogFullTtl,
    // Set by an admin on the vendor row (Settings → Vendors → the Office Supplies
    // vendor), and reaches here through the ServiceOperator → Vendor join, whose
    // attribute whitelist already selects `optionals`.
    buyerFinderFeeType: extra.buyerFinderFeeType,
    buyerFinderFeeAmount: normalizeFinderFeeAmount(extra.buyerFinderFeeAmount),
    // The on/off switch lives beside the rate so the whole feature is configured
    // in one place — set `buyerFinderFeeDeductionEnabled` to 1 on this row.
    buyerFinderFeeDeductionEnabled: normalizeFinderFeeDeductionEnabled(
      extra.buyerFinderFeeDeductionEnabled
    ),
    // Test-target escape hatch: the ONDC Workbench runs scenario "expectations"
    // and rejects any transaction_id it did not issue with 412 "No active
    // expectation found". Setting this pins /search to the id pasted from the
    // active scenario, so the catalog pull lands on that expectation.
    //
    // It deliberately does NOT reach the order actions. A scenario's select step
    // is consumed the first time it is used, so a pinned checkout could only ever
    // run once — a second attempt came back "<select> not supported after
    // <select>". Checkout mints its own id instead (see validateOndcCart), which
    // also restores distinct ids per seller group.
    forceTransactionId: extra.forceTransactionId || null,

    // Subscriber id of the ONDC Global Catalog Repository, e.g.
    // "pre-prod.gcr.ondc.org". GCR relays seller catalogs to us and signs the
    // relay with its own key in x-gateway-authorization; pinning the id here
    // means a request claiming to be a GCR relay is only accepted from the GCR
    // we expect, rather than from anyone the registry happens to hold a key for.
    // Unset = accept any validly-signed relay (the behaviour before this existed).
    gcrSubscriberId: extra.gcrSubscriberId || null,
  };

  // A pinned transaction id only ever means one thing: we are talking to a
  // scripted test harness rather than a real seller. Derived here so callers ask
  // "are we in Workbench mode?" instead of each inferring it from a raw id.
  config.workbenchMode = Boolean(config.forceTransactionId);

  configCache = { value: config, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
  return config;
};

/** Drop the cached vendor row (tests, and after an admin edits the config). */
const clearOndcConfigCache = () => {
  configCache = null;
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

  const signingString = createOndcSigningString({
    createdRaw: created,
    expiresRaw: expires,
    digestBase64,
  });

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
// AUTH VERIFICATION (inbound webhooks)
// =======================
const PUBLIC_KEY_CACHE_TTL_MS = 60 * 60 * 1000; // 1h
/** @type {Map<string, { publicKey?: string, error?: Error, expiresAt: number }>} */
const publicKeyCache = new Map();

const removeAuthQuotes = (value) =>
  String(value || "").replace(/^["'](.+(?=["']$))["']$/, "$1");

/**
 * Decode base64 leniently. libsodium's from_base64(..., ORIGINAL) throws on
 * unpadded or URL-safe input, and on the verify path that throw is
 * indistinguishable from a genuine signature mismatch. Buffer handles the
 * padded, unpadded and URL-safe alphabets alike.
 * @param {string} value
 * @returns {Uint8Array}
 */
const decodeBase64Loose = (value) => {
  const cleaned = String(value || "").trim().replace(/\s+/g, "");
  return new Uint8Array(Buffer.from(cleaned, "base64"));
};

/**
 * The ONDC signing string. Shared by the signer and the verifier so the two can
 * never drift. `createdRaw`/`expiresRaw` are used verbatim: re-deriving them
 * from Number() would silently change the signed bytes for any sender that
 * emits a non-canonical numeric form.
 */
const createOndcSigningString = ({ createdRaw, expiresRaw, digestBase64 }) =>
  `(created): ${createdRaw}\n` +
  `(expires): ${expiresRaw}\n` +
  `digest: BLAKE-512=${digestBase64}`;

/** Header list we can reconstruct a signing string for. */
const SUPPORTED_SIGNED_HEADERS = "(created) (expires) digest";

const normalizeSignedHeaders = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");

/**
 * Parse an ONDC Authorization Signature header into its parts.
 * @param {string} header
 * @returns {{ keyId?: string, algorithm?: string, created?: string, expires?: string, headers?: string, signature?: string, subscriberId?: string, uniqueKeyId?: string, algo?: string } | null}
 */
const parseOndcAuthorizationHeader = (header) => {
  if (!header || typeof header !== "string") return null;
  const stripped = header.replace(/^Signature\s+/i, "");

  // Strict pass: quoted params only. Handles values containing commas (which
  // the lenient regex below splits on) and rejects unquoted garbage.
  const parts = {};
  const strictRe = /([a-zA-Z]+)="([^"]*)"/g;
  let m;
  while ((m = strictRe.exec(stripped)) !== null) {
    parts[m[1].trim()] = m[2];
  }

  // Fallback for senders that omit quoting.
  if (!parts.signature) {
    const lenientRe = /\s*([^=]+)=([^,]+)[,]?/g;
    let lm;
    while ((lm = lenientRe.exec(stripped)) !== null) {
      parts[lm[1].trim()] = removeAuthQuotes(lm[2].trim());
    }
  }

  if (!parts.keyId || !parts.signature || !parts.created || !parts.expires) {
    return null;
  }
  const keyIdSplit = String(parts.keyId).split("|");
  if (keyIdSplit.length < 3) return null;
  parts.subscriberId = keyIdSplit[0];
  parts.uniqueKeyId = keyIdSplit[1];
  parts.algo = keyIdSplit[2];
  return parts;
};

/** Byte length of a string or byte-array body candidate. */
const candidateByteLength = (candidate) =>
  typeof candidate === "string"
    ? Buffer.byteLength(candidate, "utf8")
    : candidate.length;

/**
 * BLAKE-512 digest of a body candidate, base64 (ORIGINAL alphabet).
 * Accepts raw bytes as well as a string: routing the on-the-wire buffer through
 * `toString("utf8")` would replace any invalid UTF-8 sequence with U+FFFD and
 * silently change the digest.
 */
const digestBodyCandidate = (candidate) =>
  sodium.to_base64(
    sodium.crypto_generichash(
      64,
      typeof candidate === "string" ? sodium.from_string(candidate) : candidate
    ),
    sodium.base64_variants.ORIGINAL
  );

/** Clock-skew tolerance, in seconds, on both ends of the created/expires window. */
const authSkewSeconds = () => {
  const raw = Number(process.env.ONDC_WEBHOOK_AUTH_SKEW_SECONDS);
  return Number.isFinite(raw) && raw >= 0 ? raw : 300;
};

/**
 * Verify an inbound ONDC Authorization header against the request body and the
 * sender's signing public key (from registry lookup).
 *
 * Returns a result object rather than a bare boolean: a time-window reject, an
 * undecodable signature and a genuine digest mismatch all used to collapse into
 * `false`, which made failures impossible to diagnose from the logs.
 *
 * `bodyStrings` is an ordered list of candidate serialisations — pass the raw
 * on-the-wire bytes first and any fallback (e.g. a re-serialised body) after.
 * A forged body verifies under none of them, so trying several costs only an
 * extra hash on the failure path.
 *
 * @param {{ header: string, bodyString?: string, bodyStrings?: string[], publicKey: string }} args
 * @returns {Promise<{ valid: boolean, reason: string, details: object }>}
 */
const verifyOndcAuthorizationHeader = async ({
  header,
  bodyString,
  bodyStrings,
  publicKey,
}) => {
  const details = {};
  try {
    // Must precede any sodium.* constant read; they are undefined until ready.
    await sodium.ready;

    const candidates = (
      Array.isArray(bodyStrings) && bodyStrings.length
        ? bodyStrings
        : [bodyString ?? ""]
    ).filter((c) => typeof c === "string" || ArrayBuffer.isView(c));

    const parts = parseOndcAuthorizationHeader(header);
    if (!parts) return { valid: false, reason: "unparseable_header", details };

    details.subscriberId = parts.subscriberId;
    details.uniqueKeyId = parts.uniqueKeyId;
    details.created = parts.created;
    details.expires = parts.expires;
    details.signedHeaders = parts.headers || null;

    if (!publicKey) return { valid: false, reason: "no_public_key", details };
    details.publicKeyPrefix = String(publicKey).slice(0, 12);

    if (
      (parts.algo && parts.algo !== "ed25519") ||
      (parts.algorithm && parts.algorithm !== "ed25519")
    ) {
      details.algorithm = parts.algorithm || parts.algo;
      return { valid: false, reason: "bad_algorithm", details };
    }

    // We can only reconstruct the signing string for the ONDC-standard header
    // list. Anything else is reported by name instead of failing opaquely.
    if (
      parts.headers &&
      normalizeSignedHeaders(parts.headers) !== SUPPORTED_SIGNED_HEADERS
    ) {
      return { valid: false, reason: "unsupported_headers_list", details };
    }

    const created = Number(parts.created);
    const expires = Number(parts.expires);
    if (!Number.isFinite(created) || !Number.isFinite(expires)) {
      return { valid: false, reason: "bad_timestamps", details };
    }

    const now = Math.floor(Date.now() / 1000);
    const skew = authSkewSeconds();
    details.now = now;
    details.skewSeconds = skew;
    if (created - skew > now) {
      return { valid: false, reason: "not_yet_valid", details };
    }
    if (expires + skew < now) {
      return { valid: false, reason: "expired", details };
    }

    const signatureBytes = decodeBase64Loose(parts.signature);
    if (signatureBytes.length !== sodium.crypto_sign_BYTES) {
      details.signatureLength = signatureBytes.length;
      return { valid: false, reason: "bad_signature_encoding", details };
    }

    const publicKeyBytes = decodeBase64Loose(publicKey);
    if (publicKeyBytes.length !== sodium.crypto_sign_PUBLICKEYBYTES) {
      details.publicKeyLength = publicKeyBytes.length;
      return { valid: false, reason: "bad_public_key_length", details };
    }

    details.variants = [];

    for (let i = 0; i < candidates.length; i += 1) {
      const candidate = candidates[i];
      const digestBase64 = digestBodyCandidate(candidate);
      const signingString = createOndcSigningString({
        createdRaw: parts.created,
        expiresRaw: parts.expires,
        digestBase64,
      });

      details.variants.push({
        index: i,
        byteLength: candidateByteLength(candidate),
        digestBase64,
      });

      if (
        sodium.crypto_sign_verify_detached(
          signatureBytes,
          signingString,
          publicKeyBytes
        )
      ) {
        details.bodyVariant = i;
        return { valid: true, reason: "ok", details };
      }
    }

    return { valid: false, reason: "digest_mismatch", details };
  } catch (err) {
    customLog(null, "error", {
      message: "ONDC Authorization header verification threw",
      error: err?.message || err,
    }, "VENDOR");
    details.error = err?.message || String(err);
    return { valid: false, reason: "verification_error", details };
  }
};

/** Bodies larger than this are not probed — the probes are a diagnostic, not a hot path. */
const PROBE_MAX_BODY_BYTES = 1024 * 1024;

/**
 * Known ways a sender can build a valid-looking signature over the wrong bytes.
 * Each entry maps a candidate string to the defect it proves.
 */
const senderBugProbes = (rawBodyString, parsedBody) => {
  const probes = [
    // The big one: passing the payload object where the ONDC SDK expects a JSON
    // string. sodium.from_string(object) hashes the literal "[object Object]".
    ["sender_signed_object_not_json", "[object Object]"],
    ["sender_signed_undefined", "undefined"],
    ["sender_signed_empty_body", ""],
    ["sender_signed_null_body", "null"],
  ];

  if (parsedBody && typeof parsedBody === "object") {
    const safe = (fn) => {
      try {
        return fn();
      } catch {
        return null;
      }
    };
    const pretty = safe(() => JSON.stringify(parsedBody, null, 2));
    if (pretty) probes.push(["sender_signed_pretty_json", pretty]);

    const sorted = safe(() =>
      JSON.stringify(parsedBody, Object.keys(flattenKeys(parsedBody)).sort())
    );
    if (sorted) probes.push(["sender_signed_sorted_keys", sorted]);

    if (parsedBody.message !== undefined) {
      const m = safe(() => JSON.stringify(parsedBody.message));
      if (m) probes.push(["sender_signed_message_only", m]);
    }
    if (parsedBody.context !== undefined) {
      const c = safe(() => JSON.stringify(parsedBody.context));
      if (c) probes.push(["sender_signed_context_only", c]);
    }
  }

  if (typeof rawBodyString === "string") {
    const trimmed = rawBodyString.trim();
    if (trimmed !== rawBodyString) {
      probes.push(["sender_signed_trimmed_body", trimmed]);
    }
  }

  return probes;
};

/** Collect every key name in a nested object (for the sorted-keys probe). */
const flattenKeys = (value, acc = {}) => {
  if (Array.isArray(value)) {
    value.forEach((v) => flattenKeys(v, acc));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      acc[k] = true;
      flattenKeys(v, acc);
    }
  }
  return acc;
};

/**
 * After verification has already failed with digest_mismatch, test the sender's
 * signature against serialisations that correspond to known sender defects.
 *
 * Purely diagnostic: a match names the sender's bug in the log and NEVER makes
 * the request acceptable. Callers must keep rejecting regardless of the result.
 *
 * @returns {Promise<{ senderBug: string|null, probed: number, skipped?: string }>}
 */
const probeSenderSerialization = async ({
  header,
  publicKey,
  rawBodyString,
  parsedBody,
}) => {
  try {
    await sodium.ready;
    const parts = parseOndcAuthorizationHeader(header);
    if (!parts || !publicKey) return { senderBug: null, probed: 0 };

    const signatureBytes = decodeBase64Loose(parts.signature);
    const publicKeyBytes = decodeBase64Loose(publicKey);
    if (
      signatureBytes.length !== sodium.crypto_sign_BYTES ||
      publicKeyBytes.length !== sodium.crypto_sign_PUBLICKEYBYTES
    ) {
      return { senderBug: null, probed: 0 };
    }

    if (
      typeof rawBodyString === "string" &&
      Buffer.byteLength(rawBodyString, "utf8") > PROBE_MAX_BODY_BYTES
    ) {
      return { senderBug: null, probed: 0, skipped: "probes_skipped_body_too_large" };
    }

    const probes = senderBugProbes(rawBodyString, parsedBody);
    for (const [name, candidate] of probes) {
      const signingString = createOndcSigningString({
        createdRaw: parts.created,
        expiresRaw: parts.expires,
        digestBase64: digestBodyCandidate(candidate),
      });
      if (
        sodium.crypto_sign_verify_detached(
          signatureBytes,
          signingString,
          publicKeyBytes
        )
      ) {
        return { senderBug: name, probed: probes.length };
      }
    }
    return { senderBug: null, probed: probes.length };
  } catch (err) {
    return { senderBug: null, probed: 0, skipped: err?.message || String(err) };
  }
};

/**
 * Successful registry lookup returns a top-level array, e.g.:
 * [{ subscriber_id, ukId, br_id, signing_public_key, status: "SUBSCRIBED", ... }]
 * NACK responses use { message: { ack }, error } and yield no rows.
 */
const extractLookupRows = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.message)) return data.message;
  if (Array.isArray(data?.message?.subscribers)) return data.message.subscribers;
  return [];
};

const rowUkId = (row) =>
  String(row?.ukId || row?.unique_key_id || row?.uniqueKeyId || row?.br_id || "");

const rowKey = (row) => row?.signing_public_key || row?.signingPublicKey || null;

/** True when `row` is inside its valid_from/valid_until window. */
const rowIsCurrent = (row, nowMs) => {
  const from = row?.valid_from ? Date.parse(row.valid_from) : NaN;
  const until = row?.valid_until ? Date.parse(row.valid_until) : NaN;
  if (Number.isFinite(from) && nowMs < from) return false;
  if (Number.isFinite(until) && nowMs > until) return false;
  return true;
};

/**
 * Pick signing_public_key from registry lookup rows.
 *
 * 1. Exact Auth ukId / br_id match (prefer domain, then SUBSCRIBED).
 * 2. Else if Auth ukId is missing from registry but every returned row shares
 *    one signing_public_key (common for multi-domain BPPs that put a stale
 *    ukId in Authorization — e.g. bino.bot 01381c82 vs registry 659110b6),
 *    use that shared key and log a warning.
 * 3. Else null.
 */
const pickSigningPublicKey = (rows, uniqueKeyId, domain) => {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const wanted = String(uniqueKeyId || "");
  if (!wanted) return null;

  const subscribed = rows.filter(
    (r) => !r.status || String(r.status).toUpperCase() === "SUBSCRIBED"
  );
  const pool = subscribed.length > 0 ? subscribed : rows;

  let matching = pool.filter(
    (r) =>
      rowUkId(r) === wanted ||
      String(r?.br_id || r?.key_id || r?.keyId || "") === wanted
  );

  if (matching.length === 0) {
    const sharedKeys = [...new Set(pool.map(rowKey).filter(Boolean))];
    if (sharedKeys.length === 1) {
      customLog(null, "warn", {
        message:
          "ONDC Auth ukId not in registry; using subscriber shared signing_public_key",
        uniqueKeyId: wanted,
        domain: domain || null,
        registryUkIds: [...new Set(pool.map(rowUkId).filter(Boolean))],
        publicKey: sharedKeys[0],
      }, "VENDOR");
      return sharedKeys[0];
    }
    return null;
  }

  const current = matching.filter((r) => rowIsCurrent(r, Date.now()));
  if (current.length > 0) {
    matching = current;
  }

  if (domain) {
    const byDomain = matching.filter(
      (r) => String(r?.domain || "") === String(domain)
    );
    if (byDomain.length > 0) matching = byDomain;
  }

  const keys = [...new Set(matching.map(rowKey).filter(Boolean))];
  if (keys.length === 0) return null;
  return keys[0];
};

/** Error carrying a machine-readable code so callers can log the real cause. */
const lookupError = (code, message, extra = {}) => {
  const err = new Error(message);
  err.code = code;
  Object.assign(err, extra);
  return err;
};

/**
 * Look up a subscriber's signing_public_key from the ONDC registry.
 * Registry URL comes from the ServiceOperator vendor (healthUrl, or
 * optionals.registryLookupUrl). Lookup is a signed POST. Results cached ~1h.
 *
 * Prefer subscriber_id-only lookup (Auth ukId is often absent/stale on preprod).
 * Fall back to ukId filter when the registry returns too many unrelated rows.
 */
const lookupSigningPublicKey = async ({ subscriberId, uniqueKeyId, domain }) => {
  if (!subscriberId || !uniqueKeyId) {
    throw lookupError(
      "bad_lookup_args",
      "subscriberId and uniqueKeyId are required for registry lookup"
    );
  }
  const cacheKey = `${subscriberId}|${uniqueKeyId}|${domain || ""}`;
  const cached = publicKeyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.error) throw cached.error;
    return cached.publicKey;
  }

  const config = await getOndcConfig();
  const lookupUrl = config.registryLookupUrl;
  if (!lookupUrl) {
    throw lookupError(
      "registry_not_configured",
      "ONDC registry lookup URL not configured on vendor (set healthUrl or optionals.registryLookupUrl)"
    );
  }

  const country = config.country || "IND";
  const creds = {
    bapId: config.bapId,
    uniqueKeyId: config.uniqueKeyId,
    privateKey: config.privateKey,
  };

  // subscriber_only first: Auth ukId often is not registered (15045) even when
  // the NP is subscribed under another ukId.
  const attempts = [
    { name: "subscriber_only", payload: { subscriber_id: subscriberId, country } },
    {
      name: "with_ukid",
      payload: { subscriber_id: subscriberId, ukId: uniqueKeyId, country },
    },
  ];

  let rows = [];
  let lastStatus = null;
  let lastData = null;

  for (const attempt of attempts) {
    let response;
    try {
      response = await signedPost(lookupUrl, attempt.payload, creds);
    } catch (err) {
      customLog(null, "error", {
        message: "ONDC registry lookup request failed",
        attempt: attempt.name,
        error: err?.message || String(err),
      }, "VENDOR");
      continue;
    }

    lastStatus = response.status;
    lastData = response.data;

    customLog(null, "info", {
      message: "ONDC registry lookup response",
      lookupUrl,
      attempt: attempt.name,
      subscriberId,
      uniqueKeyId,
      domain: domain || null,
      status: response.status,
      data: response.data,
    }, "VENDOR");

    const extracted = extractLookupRows(response.data).filter(
      (r) =>
        !r.subscriber_id ||
        String(r.subscriber_id) === String(subscriberId)
    );
    if (extracted.length > 0) {
      rows = extracted;
      break;
    }
  }

  const publicKey = pickSigningPublicKey(rows, uniqueKeyId, domain);

  if (!publicKey) {
    const err = lookupError(
      "ukid_not_in_registry",
      "Registry lookup returned no signing_public_key for Auth ukId",
      {
        subscriberId,
        uniqueKeyId,
        domain: domain || null,
        registryUkIds: rows.map(rowUkId).filter(Boolean),
        rowCount: rows.length,
        status: lastStatus,
        data: lastData,
        lookupUrl,
      }
    );
    customLog(null, "error", {
      message: "ONDC registry lookup returned no signing_public_key",
      subscriberId,
      uniqueKeyId,
      domain: domain || null,
      registryUkIds: err.registryUkIds,
      rowCount: rows.length,
      status: lastStatus,
      data: lastData,
      lookupUrl,
    }, "VENDOR");
    publicKeyCache.set(cacheKey, {
      error: err,
      expiresAt: Date.now() + Math.min(PUBLIC_KEY_CACHE_TTL_MS, 5 * 60 * 1000),
    });
    throw err;
  }

  publicKeyCache.set(cacheKey, {
    publicKey,
    expiresAt: Date.now() + PUBLIC_KEY_CACHE_TTL_MS,
  });
  return publicKey;
};

// =======================
// SIGNED POST
// =======================
// Buyer personal data in /init and /confirm payloads (billing, delivery contact, address, GPS) is masked in logs.
const ONDC_LOG_MASKED_FIELDS = ["billing", "contact", "person", "address", "gps", "email", "phone"];

const signedPost = async (url, payload, creds) => {
  const bodyString = JSON.stringify(payload);
  let authorization;
  try {
    authorization = await createOndcAuthorizationHeader(bodyString, creds);

    customLog(null, "info", {
      message: "ONDC signed POST request",
      url,
      body: payload,
    }, "VENDOR", ONDC_LOG_MASKED_FIELDS);

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
  } catch (error) {
    customLog(null, "error", {
      message: "ONDC signed POST request failed",
      url,
      body: payload,
      error: error?.message || error,
    }, "VENDOR", ONDC_LOG_MASKED_FIELDS);
    throw error;
  }
};

// =======================
// GATEWAY SEARCH (discover service operators / providers)
// =======================
/**
 * Initiate an ONDC network search. This POSTs a signed /search request to the
 * gateway; the gateway ACKs synchronously while the actual catalog arrives
 * asynchronously on the /api/v1/webhook/ondc/purchase/on_search webhook.
 *
 * Two intent shapes:
 *  - broadcast (default): `intent.item.descriptor.name = searchText` — the
 *    gateway fans the search out to all seller apps in the city/domain;
 *  - directed exact-product: pass `itemId` + `providerId` (+ `bppId`/`bppUri`) —
 *    the intent carries the item/provider IDs and the context carries
 *    bpp_id/bpp_uri so the gateway routes to that one seller app, which
 *    returns just that item's current catalog entry.
 *
 * @param {Object} [opts]
 * @param {string} [opts.searchText="Laptop"] item descriptor name to search for (broadcast mode)
 * @param {string} [opts.itemId] exact ONDC item id (directed mode)
 * @param {string} [opts.providerId] ONDC provider/vendor id (directed mode)
 * @param {string} [opts.bppId] seller app id — routed via context (directed mode)
 * @param {string} [opts.bppUri] seller app uri — routed via context (directed mode)
 * @param {string} [opts.domain] ONDC domain override (defaults to the vendor config domain)
 * @param {string} [opts.city] ONDC city override (defaults to the vendor config city)
 * @param {string} [opts.transactionId] correlation id (generated if omitted)
 * @param {string} [opts.messageId] message id (generated if omitted)
 * @param {"full"|"inc_start"|"inc_stop"|"inc_pull"} [opts.catalogMode] discovery catalog tags; ignored for directed item search
 * @param {string} [opts.startTime] ISO start_time for catalogMode inc_pull
 * @param {string} [opts.endTime] ISO end_time for catalogMode inc_pull
 * @returns {Promise<{status:number,data:any,transactionId:string,messageId:string}>}
 */

const BAP_TERMS_TAGS = [
  {
    code: "bap_terms",
    list: [
      { code: "static_terms", value: "" },
      {
        code: "static_terms_new",
        value: "https://github.com/ONDC-Official/NP-Static-Terms/buyerNP_BNP/1.0/tc.pdf",
      },
      { code: "effective_date", value: "2023-10-01T00:00:00.000Z" },
    ],
  },
];

// The buyer-app finder fee now lives on the vendor row (DEFAULTS +
// getOndcConfig above), so an admin can change it without a deploy.
//
// Declared on BOTH /search and /init, from that one config — a seller must not
// be quoted one commercial at discovery and a different one at order time.

const INC_CATALOG_MODES = new Set(["inc_start", "inc_stop", "inc_pull"]);

/**
 * intent.tags for ONDC discovery. Directed / keyword search must not send these.
 * Tag shapes match testings/index.js (catalog_full / catalog_inc / bap_terms).
 *
 * Production catalog_full uses payload_type `inline` so the catalog arrives on
 * on_search. `link` is Workbench-only: we never fetch catalog URLs, and most
 * live seller apps simply never callback for a link request.
 */
const buildSearchCatalogTags = ({ catalogMode, startTime, endTime, workbenchMode } = {}) => {
  if (catalogMode === "full") {
    return [
      {
        code: "catalog_full",
        list: [{ code: "payload_type", value: workbenchMode ? "link" : "inline" }],
      },
      ...BAP_TERMS_TAGS,
    ];
  }
  if (catalogMode === "inc_start" || catalogMode === "inc_stop") {
    return [
      {
        code: "catalog_inc",
        list: [{ code: "mode", value: catalogMode === "inc_start" ? "start" : "stop" }],
      },
      ...BAP_TERMS_TAGS,
    ];
  }
  if (catalogMode === "inc_pull") {
    return [
      {
        code: "catalog_inc",
        list: [
          { code: "start_time", value: startTime },
          { code: "end_time", value: endTime },
        ],
      },
      ...BAP_TERMS_TAGS,
    ];
  }
  return null;
};
/**
 * Audit line for one outbound signed action.
 *
 * Inbound callbacks are already audited to ondcCallbackLogs; outbound was not,
 * which made a rejection unattributable — the receiver only ever tells you an id
 * was wrong, so without a record of what we put on the wire (and whether a test
 * scenario id was substituted for the one the caller asked for) there is nothing
 * to compare its complaint against.
 */
const logOutboundAction = ({ action, url, transactionId, messageId, requestedTransactionId, cfg, status, error }) => {
  customLog(null, error ? "error" : "info", {
    message: error ? `ONDC ${action} rejected` : `ONDC ${action} sent`,
    action,
    url,
    transactionId,
    messageId,
    // Only present when the pin rewrote the caller's id — the single most useful
    // thing to see next to a "no active expectation for this id" rejection.
    ...(requestedTransactionId && requestedTransactionId !== transactionId
      ? { requestedTransactionId, transactionIdPinned: true }
      : {}),
    workbenchMode: Boolean(cfg?.workbenchMode),
    domain: cfg?.domain || null,
    ...(status ? { status } : {}),
    ...(error ? { error } : {}),
  }, "VENDOR");
};

/**
 * A receiver refused a signed action outright, in its synchronous reply.
 *
 * Carries the counterparty's own words: `ondcMessage` is what the seller/gateway
 * said (e.g. "<select> not supported after <select>"), which is the only useful
 * thing to put in front of whoever clicked the button. `Error.message` is a
 * prefixed version of the same for logs and stack traces.
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
 * ONDC splits every action in two: a synchronous ACK/NACK, then the real answer
 * later on a webhook. A NACK means the second half is never coming — so the
 * callback wait must be abandoned now, not held for its full timeout.
 *
 * Two shapes both had to be caught here, and neither was:
 *
 *  - **NACK at HTTP 200.** The receiver answers `200` with
 *    `message.ack.status: "NACK"` and an `error` object. Nothing read `ack`, so
 *    this counted as a successful send.
 *  - **Any non-2xx.** `signedPost` passes `validateStatus: () => true`, so even a
 *    `412 No active expectation found` resolves instead of throwing.
 *
 * Both used to end the same way: a 30s wait for a callback that had already been
 * refused in milliseconds, then a generic timeout that named neither the cause
 * nor the counterparty's explanation.
 */
const assertOndcAck = (action, url, response) => {
  const httpStatus = response?.status;
  const data = response?.data;
  const ackStatus = data?.message?.ack?.status ?? null;
  const httpOk = Number.isInteger(httpStatus) && httpStatus >= 200 && httpStatus < 300;
  // Absent counts as refused: a receiver that ACKs always says so, and treating
  // silence as consent is what let a NACK through in the first place.
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

const search = async ({
  searchText = "",
  itemId,
  providerId,
  bppId,
  bppUri,
  domain,
  city,
  transactionId,
  messageId,
  catalogMode,
  startTime,
  endTime,
} = {}) => {
  let logContext = null;
  let payload = null;
  let httpStatus = null;
  let responseData = null;
  try {
    const cfg = await getOndcConfig();

    const directed = Boolean(itemId);
    const incremental = !directed && INC_CATALOG_MODES.has(catalogMode);

    // /search is the one action the Workbench pin still governs: the catalog pull
    // has to land on the scenario's expectation. Incremental (city "*") is a
    // different discovery step and must not steal that pin.
    const transaction_id = (!incremental && cfg.forceTransactionId) || transactionId || uuidv4();
    const message_id = messageId || uuidv4();

    // A whole-catalog browse has no item to name. Sending
    // `item.descriptor.name: ""` (what an empty searchText used to produce) is
    // not a valid intent — the receiver reads it as "find a product called
    // nothing" and schema validation rejects the request rather than treating
    // it as a browse. Omit `item` entirely instead; keyword and directed
    // searches are unchanged.
    const intent = {
      ...(directed
        ? { item: { id: itemId } }
        : searchText
          ? { item: { descriptor: { name: searchText } } }
          : {}),
      ...(!incremental
        ? { fulfillment: { type: "Delivery" } }
        : {}),
      // Declared on discovery so seller apps can decide whether to respond, and
      // read from the same vendor config /init uses — the two must always quote
      // the same commercial, or a seller is told one fee at discovery and
      // another at order time.
      //
      // This was removed once (18d930e1 "finder fee filter removed") and has
      // been restored deliberately. If sellers stop answering /search, this is
      // the first thing to suspect.
      payment: {
        "@ondc/org/buyer_app_finder_fee_type": cfg.buyerFinderFeeType,
        "@ondc/org/buyer_app_finder_fee_amount": cfg.buyerFinderFeeAmount,
      },
    };
    if (directed && providerId) {
      intent.provider = { id: providerId };
    }

    const catalogTags = !directed
      ? buildSearchCatalogTags({
          catalogMode,
          startTime: startTime || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endTime: endTime || new Date().toISOString(),
          workbenchMode: cfg.workbenchMode,
        })
      : null;
    if (catalogTags) intent.tags = catalogTags;

    const ttl =
      !directed && catalogMode === "full" && !cfg.workbenchMode
        ? cfg.catalogFullTtl
        : cfg.ttl;

    payload = {
      context: {
        domain: domain || cfg.domain,
        country: cfg.country,
        city: incremental ? "*" : (city || cfg.city),
        action: "search",
        core_version: cfg.coreVersion,
        bap_id: cfg.bapId,
        bap_uri: cfg.bapUri,
        ...(bppId ? { bpp_id: bppId } : {}),
        ...(bppUri ? { bpp_uri: bppUri } : {}),
        transaction_id,
        message_id,
        timestamp: new Date().toISOString(),
        ttl,
      },
      message: {
        intent,
      },
    };

    // Broadcast searches go through the gateway; a directed search that names a
    // specific seller app must be POSTed to that BPP directly (the gateway only
    // fans out discovery searches and won't route bpp-addressed ones).
    const searchUrl = directed && bppUri
      ? `${String(bppUri).replace(/\/+$/, "")}/search`
      : cfg.gatewayUrl + "search";

    logContext = {
      action: "search",
      url: searchUrl,
      transactionId: transaction_id,
      messageId: message_id,
      requestedTransactionId: transactionId,
      cfg,
    };

    const response = await signedPost(searchUrl, payload, cfg);
    httpStatus = response.status;
    responseData = response.data;
    // Before the success log: a refused search must never be recorded as sent.
    assertOndcAck("search", searchUrl, response);
    logOutboundAction({ ...logContext, status: response.status });

    return {
      status: response.status,
      data: response.data,
      transactionId: transaction_id,
      messageId: message_id,
    };
  } catch (error) {
    if (httpStatus == null) {
      httpStatus = error?.httpStatus ?? error?.response?.status ?? null;
      responseData = error?.response?.data ?? responseData;
    }
    const errData = error?.response?.data || error.message;
    if (logContext) {
      logOutboundAction({
        ...logContext,
        status: error?.httpStatus ?? error?.response?.status,
        error: error?.ondcMessage || errData,
      });
    }
    // Rethrown as-is so callers can read ondcMessage — the gateway's own words
    // are the whole point, and rewrapping would flatten them into a string.
    if (error instanceof OndcAckError) throw error;
    throw new Error(errData?.message || errData || "Failed to initiate ONDC search");
  } finally {
    if (payload) {
      reportOutbound({
        action: "search",
        requestPayload: payload,
        httpStatus,
        responseData,
      });
    }
  }
};

// Backward-compatible alias: the ONDC search was originally named getServiceOperator.
const getServiceOperator = search;

// =======================
// ORDER LIFECYCLE (select / init / confirm)
// =======================
/**
 * POST a signed ONDC order action to the seller's BPP. Unlike `search` (which
 * goes to the gateway), select/init/confirm are addressed directly to the BPP
 * at `${bpp_uri}/${action}` and the context carries `bpp_id` + `bpp_uri`.
 *
 * Thin transport: the caller supplies a prebuilt `message.order` for the action.
 * The BPP ACKs synchronously; the real quote/order arrives later on the
 * on_select / on_init / on_confirm webhook.
 *
 * @param {"select"|"init"|"confirm"} action
 * @param {Object} params
 * @param {Object} params.message            prebuilt ONDC `message`
 * @param {string} params.bppId            seller app id (context.bpp_id)
 * @param {string} params.bppUri           seller app base uri (post target + context.bpp_uri)
 * @param {string} [params.transactionId]  lifecycle correlation id (shared select→confirm; generated if omitted)
 * @param {string} [params.messageId]      per-call message id (generated if omitted)
 * @param {string} [params.city]           ONDC city override (defaults to vendor config city)
 * @param {string} [params.domain]         ONDC domain override (defaults to vendor config domain)
 * @returns {Promise<{status:number,data:any,transactionId:string,messageId:string}>}
 */
const bppOrderAction = async (
  action,
  { message, bppId, bppUri, transactionId, messageId, city, domain } = {}
) => {
  if (!message) throw new Error(`ONDC ${action}: order is required`);
  if (!bppUri) throw new Error(`ONDC ${action}: bppUri is required`);

  let logContext = null;
  let payload = null;
  let httpStatus = null;
  let responseData = null;
  try {
    const cfg = await getOndcConfig();

    // The caller's id is authoritative, and `forceTransactionId` is deliberately
    // not consulted here. It used to override this unconditionally, which broke
    // the flow two ways: the on_select/on_init webhook arrived under the pinned
    // id while the waiter was registered under the caller's, and every checkout
    // reused one id — so the second attempt was refused outright with
    // "<select> not supported after <select>". The pin now governs /search only.
    const transaction_id = transactionId || uuidv4();
    const message_id = messageId || uuidv4();

    payload = {
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
      message: message,
    };

    const url = `${bppUri}/${action}`;
    logContext = {
      action,
      url,
      transactionId: transaction_id,
      messageId: message_id,
      requestedTransactionId: transactionId,
      cfg,
    };

    const response = await signedPost(url, payload, cfg);
    httpStatus = response.status;
    responseData = response.data;
    // Before the success log: a NACKed action has no callback coming, and the
    // caller needs to abandon its waiter now rather than time out on it.
    assertOndcAck(action, url, response);
    logOutboundAction({ ...logContext, status: response.status });

    return {
      status: response.status,
      data: response.data,
      transactionId: transaction_id,
      messageId: message_id,
    };
  } catch (error) {
    if (httpStatus == null) {
      httpStatus = error?.httpStatus ?? error?.response?.status ?? null;
      responseData = error?.response?.data ?? responseData;
    }
    const errData = error?.response?.data || error.message;
    if (logContext) {
      logOutboundAction({
        ...logContext,
        status: error?.httpStatus ?? error?.response?.status,
        error: error?.ondcMessage || errData,
      });
    } else {
      // Failed before the target was resolved (config unreadable) — there is no
      // transaction id to attribute this to yet.
      customLog(null, "error", {
        message: `ONDC ${action} error`,
        error: errData,
      }, "VENDOR");
    }
    // Rethrown as-is so callers can read ondcMessage and show the seller's own
    // explanation; rewrapping would flatten it into an untyped string.
    if (error instanceof OndcAckError) throw error;
    throw new Error(errData?.message || errData || `Failed to initiate ONDC ${action}`);
  } finally {
    if (payload) {
      reportOutbound({
        action,
        requestPayload: payload,
        httpStatus,
        responseData,
      });
    }
  }
};

/**
 * Build the `message.order` for an ONDC /select from the buyer's picks.
 *
 * Shape (per ONDC retail 1.2.x): provider id + location, the chosen items
 * (each carrying its location_id / fulfillment_id / quantity), and a single
 * Delivery fulfillment whose `end` holds the buyer's GPS + pincode so the BPP
 * can quote serviceability + delivery charges.
 *
 * @param {Object} params
 * @param {string} params.providerId   ONDC provider id (from on_search: bpp/providers[].id)
 * @param {string} params.locationId   provider location id (bpp/providers[].locations[].id)
 * @param {Array<{id:string, quantity?:number, locationId?:string, fulfillmentId?:string}>} params.items
 *                                     items to select; quantity defaults to 1,
 *                                     location/fulfillment default to the order-level ones
 * @param {string} params.gps          buyer drop location "lat,lng"
 * @param {string} params.areaCode     buyer drop pincode (address.area_code)
 * @param {string} [params.fulfillmentId="F1"] fulfillment id shared by items + fulfillments
 * @returns {Object} ONDC `message.order` for /select
 */
const buildSelectOrder = ({
  providerId,
  locationId,
  items,
  gps,
  areaCode,
  fulfillmentId = "F1",
} = {}) => {
  if (!providerId) throw new Error("ONDC select: providerId is required");
  if (!locationId) throw new Error("ONDC select: locationId is required");
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("ONDC select: items is required (non-empty array)");
  }
  if (!gps) throw new Error("ONDC select: gps is required");
  if (!areaCode) throw new Error("ONDC select: areaCode is required");
  // gps is mandatory in this builder, so a coordinate the validator would reject
  // has to fail here rather than become a NACK on the wire.
  const gpsOnWire = normalizeOndcGps(gps);
  if (!gpsOnWire) throw new Error(`ONDC select: gps "${gps}" is not a usable "lat,lng" coordinate`);

  return {
    provider: {
      id: providerId,
      locations: [{ id: locationId }],
    },
    items: items.map((it) => {
      if (!it || !it.id) throw new Error("ONDC select: every item needs an id");
      return {
        id: it.id,
        location_id: it.locationId || locationId,
        fulfillment_id: normalizeOndcNetworkId(it.fulfillmentId || fulfillmentId),
        quantity: { count: it.quantity || 1 },
      };
    }),
    fulfillments: [
      {
        id: normalizeOndcNetworkId(fulfillmentId),
        type: "Delivery",
        end: {
          location: {
            gps: gpsOnWire,
            address: { area_code: areaCode },
          },
        },
      },
    ],
  };
};

/**
 * ONDC `select` — the "add to cart" step: send the chosen provider/items to the
 * BPP to get serviceability + a quote (delivered on the on_select webhook).
 *
 * Pass either a prebuilt `order` (thin-transport mode, see {@link bppOrderAction})
 * or the builder params ({@link buildSelectOrder}: providerId, locationId,
 * items, gps, areaCode). `transactionId` should be the SAME one used for the
 * /search that surfaced these items, so the BPP correlates the session.
 *
 * @param {Object} params bppOrderAction params (order/bppId/bppUri/transactionId/...)
 *                        plus, when `order` is omitted, buildSelectOrder params
 */
/**
 * @typedef {Object} OndcSelectItem
 * @property {string} id           - Item ID
 * @property {number} [quantity]   - Quantity to select (default: 1)
 * @property {string} [locationId] - Optional custom location id
 * @property {string} [fulfillmentId] - Optional fulfillment id
 */

/**
 * @typedef {Object} SelectParams
 * @property {string} bppProviderId   - ONDC provider id to select from
 * @property {string} bppLocationId   - ONDC provider location id
 * @property {string} bppId           - Seller app id (BPP)
 * @property {string} bppUri          - Seller app base URI (BPP endpoint)
 * @property {string} [transactionId] - Shared transaction id for order session
 * @property {string} [messageId]     - Unique message id for the call
 * @property {string} [city]          - City override if required
 * @property {string} [domain]        - Domain override if required
 * @property {OndcSelectItem[]} items - Items to add to cart/select
 */

/**
 * ONDC `select` — the "add to cart" step: send the chosen provider/items to the
 * BPP to get serviceability + a quote (delivered on the on_select webhook).
 *
 * Buyer-side inputs: `pinCOde` (delivery pincode) is required; `gps` is
 * optional (browser location / corporateUser.latLng) — when absent it is
 * omitted from the fulfillment and the BPP quotes from the pincode alone.
 *
 * @param {SelectParams} params
 */
const select = ({
  bppProviderId,
  bppLocationId,
  bppId,
  bppUri,
  transactionId,
  messageId,
  city,
  domain,
  items,
  gps,
  pinCOde,
  fulfillmentId = "F1"
}) => {
  const areaCode = String(pinCOde || "").trim();
  if (!areaCode) throw new Error("ONDC select: areaCode is required");

  const gpsOnWire = normalizeOndcGps(gps);
  if (gps && !gpsOnWire) {
    customLog(null, "error", {
      message: "ONDC select: unusable gps dropped from the fulfillment end location",
      gps,
    }, "VENDOR");
  }

  const order = {
    provider: {
      // from on_search: bpp/providers[0].id and its locations[0].id
      id: bppProviderId,
      locations: [{ id: bppLocationId }],
    },
    items: items.map((item) => ({
      id: item.id,
      location_id: item.locationId || bppLocationId,
      fulfillment_id: normalizeOndcNetworkId(item.fulfillmentId || "F1"),
      quantity: { count: item.quantity || 1 },
    })),
    fulfillments: [
      {
        id: normalizeOndcNetworkId(fulfillmentId),
        type: "Delivery",
        end: {
          location: {
            // gps is optional — omit the key entirely when the buyer's location
            // is unknown, or is not a coordinate the validator will accept, so
            // the BPP quotes from the pincode alone
            ...(gpsOnWire ? { gps: gpsOnWire } : {}),
            address: { area_code: areaCode },
          },
        },
      },
    ],
  }
  return bppOrderAction("select", { bppId,bppUri,message:{order},city,domain,messageId,transactionId });
};

/**
 * @typedef {Object} OndcInitBilling
 * @property {string} name          - Buyer/receiver name
 * @property {string} building      - House/flat + building line
 * @property {string} [locality]    - Area/locality
 * @property {string} city          - City name
 * @property {string} state         - State name
 * @property {string} [country]     - ISO country (default "IND")
 * @property {string} areaCode      - Delivery pincode (address.area_code)
 * @property {string} phone         - Contact phone
 * @property {string} email         - Contact email
 */

/**
 * ONDC `init` — the checkout step after on_select: commit the billing details
 * and the delivery (fulfillment end) address + contact, and declare the payment
 * terms. The BPP replies on_init with the final quote and payment params
 * (settlement details) on the on_init webhook.
 *
 * Pass either a prebuilt `message` (thin-transport mode, see
 * {@link bppOrderAction}) or the builder params below. `transactionId` must be
 * the SAME one used for the /search and /select of this session. `gps` is
 * optional — omitted from the fulfillment when unknown, same as `select`.
 *
 * @param {Object} params
 * @param {string} params.bppProviderId   ONDC provider id (same as select)
 * @param {string} params.bppLocationId   provider location id (same as select)
 * @param {string} params.bppId           seller app id (BPP)
 * @param {string} params.bppUri          seller app base URI
 * @param {string} [params.transactionId] shared order-session transaction id
 * @param {string} [params.messageId]     per-call message id
 * @param {string} [params.city]          ONDC city override
 * @param {string} [params.domain]        ONDC domain override
 * @param {OndcSelectItem[]} params.items items being ordered (same shape as select)
 * @param {string} [params.gps]           buyer drop "lat,lng" (optional)
 * @param {OndcInitBilling} params.billing buyer billing + delivery contact
 * @param {string} [params.fulfillmentId="F1"]
 * @param {Object} [params.message]       prebuilt ONDC `message` (bypasses the builder)
 */
const init = async ({
  bppProviderId,
  bppLocationId,
  bppId,
  bppUri,
  transactionId,
  messageId,
  city,
  domain,
  items,
  gps,
  billing,
  fulfillmentId = "F1",
  message,
} = {}) => {
  if (message) {
    return bppOrderAction("init", { bppId, bppUri, message, city, domain, messageId, transactionId });
  }

  // Async only for this: the finder fee the payment block declares is admin-set
  // on the vendor row. Cached for 30s, so this is not a DB round trip per order.
  const cfg = await getOndcConfig();
  const now = new Date().toISOString();
  const gpsOnWire = normalizeOndcGps(gps);
  if (gps && !gpsOnWire) {
    // Dropped rather than sent malformed — but say so, because the seller now
    // quotes from the pincode alone and the cause (usually a profile latLng that
    // is not a coordinate) is invisible otherwise.
    customLog(null, "error", {
      message: "ONDC init: unusable gps dropped from the fulfillment end location",
      gps,
    }, "VENDOR");
  }

  // buyer's delivery address — reused for both billing and the fulfillment end
  const address = {
    name: billing?.name,
    building: billing?.building,
    locality: billing?.locality || "",
    city: billing?.city,
    state: billing?.state,
    country: billing?.country || "IND",
    area_code: billing?.areaCode,
  };

  const order = {
    provider: {
      // same provider/location confirmed in on_select
      id: bppProviderId,
      locations: [{ id: bppLocationId }],
    },
    items: (items || []).map((item) => ({
      id: item.id,
      location_id: item.locationId || bppLocationId,
      fulfillment_id: normalizeOndcNetworkId(item.fulfillmentId || fulfillmentId),
      quantity: { count: item.quantity || 1 },
    })),
    billing: {
      name: billing?.name,
      address,
      email: billing?.email,
      phone: billing?.phone,
      created_at: now,
      updated_at: now,
    },
    fulfillments: [
      {
        id: normalizeOndcNetworkId(fulfillmentId),
        type: "Delivery",
        end: {
          location: {
            // gps optional — omit the key when the buyer's location is unknown,
            // or when what we hold is not a usable coordinate. The validator
            // rejects a malformed one outright, so sending nothing is strictly
            // better than sending something it will NACK.
            ...(gpsOnWire ? { gps: gpsOnWire } : {}),
            address,
          },
          // FULFILLMENTS_END_PERSON_NAME — required by /confirm, and putting it
          // here means the on_init echo already carries it so confirm does not
          // have to invent a recipient the seller never saw.
          ...(billing?.name ? { person: { name: billing.name } } : {}),
          contact: {
            phone: billing?.phone,
            email: billing?.email,
          },
        },
      },
    ],
    payment: {
      "@ondc/org/buyer_app_finder_fee_type": cfg.buyerFinderFeeType,
      "@ondc/org/buyer_app_finder_fee_amount": cfg.buyerFinderFeeAmount,
      type: "ON-FULFILLMENT",
      collected_by: "BAP",
    },
  };

  return bppOrderAction("init", { bppId, bppUri, message: { order }, city, domain, messageId, transactionId });
};

/**
 * ONDC `confirm` — place the order. The buyer ECHOES the order returned on
 * on_init (provider, items, billing, quote — must match) and declares the
 * payment as settled: `status: "PAID"` with the payment params and the
 * settlement details the BPP gave us. The BPP replies on_confirm with the
 * created order (state "Created") on the on_confirm webhook.
 *
 * Pass either a prebuilt `message` (thin-transport mode, see
 * {@link bppOrderAction}) or `initOrder` — the raw on_init `message.order`
 * this confirm echoes. `transactionId` must be the SAME one used across
 * search → select → init for this session.
 *
 * @param {Object} params
 * @param {string} params.bppId           seller app id (BPP)
 * @param {string} params.bppUri          seller app base URI
 * @param {string} [params.transactionId] shared order-session transaction id
 * @param {string} [params.messageId]     per-call message id
 * @param {string} [params.city]          ONDC city override
 * @param {string} [params.domain]        ONDC domain override
 * @param {Object} params.initOrder       raw on_init `message.order` to echo
 * @param {string} [params.paymentRef]    payment gateway reference id (generated if omitted)
 * @param {Object} [params.message]       prebuilt ONDC `message` (bypasses the builder)
 */
const confirm = ({
  bppId,
  bppUri,
  transactionId,
  messageId,
  city,
  domain,
  initOrder,
  paymentRef,
  message,
} = {}) => {
  if (message) {
    return bppOrderAction("confirm", { bppId, bppUri, message, city, domain, messageId, transactionId });
  }
  if (!initOrder) throw new Error("ONDC confirm: initOrder (the on_init message.order) is required");

  const now = new Date().toISOString();
  const quote = initOrder.quote;
  // The BAP mints this. on_init typically has no order.id; if a seller already
  // issued one that matches the validator's regex, keep it so we don't change
  // the id they quoted against.
  // Hyphen-stripped: the Workbench ORDER_ID class treats `/-_` as a range, so a
  // hyphenated UUID would itself be refused.
  const orderId = toOndcOrderId(initOrder.id) || uuidv4().replace(/-/g, "");
  const recipientName = ondcRecipientName(
    ...(initOrder.fulfillments || []).map((f) => f?.end?.person?.name),
    initOrder.billing?.name
  );

  const fulfillmentIdMap = new Map();
  const fulfillments = (initOrder.fulfillments || []).map((f, index) => {
    const end = f.end && typeof f.end === "object" ? { ...f.end } : {};
    if (recipientName) {
      end.person = { ...(end.person && typeof end.person === "object" ? end.person : {}), name: recipientName };
    }
    // FULFILLMENTS_ID — on_init often omits id or sends a hyphenated UUID.
    // Missing becomes an absent key (NACK); hyphens fail the same regex as ORDER_ID.
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
    // ORDER_ID / ORDER_STATE — both required at /confirm; omitting them is the
    // NACK that names those two rules together.
    id: orderId,
    state: "Created",
    // echo the on_init order verbatim — provider, items, billing and quote
    // must match what the BPP initialized
    provider: initOrder.provider,
    items,
    billing: initOrder.billing,
    // confirm sends only the buyer-side fulfillment (id/type/TAT/tracking/end);
    // on_init may have added a seller-side `start` block — drop it
    fulfillments,
    quote,
    // payment settled by the buyer app: echo the BPP's on_init payment terms
    // (settlement details, finder fees, basis/window) and mark PAID with the
    // gateway reference
    payment: {
      ...initOrder.payment,
      status: "PAID",
      params: {
        currency: quote?.price?.currency || "INR",
        // Normalised — `payment.params` is ours to construct and ONDC specs
        // amount as a numeric string, so echoing a seller's "₹50.00" verbatim
        // risks a NACK. The `quote` above stays a verbatim echo, as required.
        amount: parseOndcAmount(quote?.price?.value).toFixed(2),
        transaction_id: paymentRef || uuidv4(),
      },
      "@ondc/org/transaction_id": uuidv4(),
    },
    created_at: now,
    updated_at: now,
  };

  return bppOrderAction("confirm", { bppId, bppUri, message: { order }, city, domain, messageId, transactionId });
};

/**
 * ONDC `status` — ask the BPP for the current state of a previously confirmed
 * order (useful to actively poll when no on_status push has arrived, or to
 * re-sync after a gap). Sent DIRECTLY to the BPP (`${bppUri}/status`) with
 * just the BPP-issued order_id (from on_confirm's order.id) — the seller
 * replies asynchronously with the current order (state + fulfillments) on
 * the on_status webhook.
 *
 * @param {Object} params
 * @param {string} params.bppId            seller app id (context.bpp_id)
 * @param {string} params.bppUri           seller app base uri (post target + context.bpp_uri)
 * @param {string} params.orderId          BPP-issued order id (on_confirm's order.id)
 * @param {string} [params.transactionId]  shared order-session transaction id (reused, not regenerated)
 * @param {string} [params.messageId]      per-call message id (generated if omitted)
 * @param {string} [params.city]           ONDC city override (defaults to vendor config city)
 * @param {string} [params.domain]         ONDC domain override (defaults to vendor config domain)
 * @returns {Promise<{status:number,data:any,transactionId:string,messageId:string}>}
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

/**
 * ONDC `track` — ask the BPP for live tracking info (courier location and/or a
 * tracking URL) for a confirmed order's fulfillment. Only meaningful when the
 * order's fulfillment has tracking enabled (on_confirm/on_status
 * fulfillments[].tracking === true, or a fulfillments[].tags "tracking" entry
 * with gps_enabled/url_enabled = "yes"). Sent DIRECTLY to the BPP
 * (`${bppUri}/track`) with just the order_id — the seller replies
 * asynchronously with `message.tracking` on the on_track webhook.
 *
 * @param {Object} params
 * @param {string} params.bppId
 * @param {string} params.bppUri
 * @param {string} params.orderId
 * @param {string} [params.transactionId]
 * @param {string} [params.messageId]
 * @param {string} [params.city]
 * @param {string} [params.domain]
 * @returns {Promise<{status:number,data:any,transactionId:string,messageId:string}>}
 */
const track = ({ bppId, bppUri, orderId, transactionId, messageId, city, domain } = {}) => {
  if (!orderId) throw new Error("ONDC track: orderId is required");
  return bppOrderAction("track", {
    bppId,
    bppUri,
    message: { order_id: orderId },
    transactionId,
    messageId,
    city,
    domain,
  });
};

/**
 * ONDC `cancel` — request the seller to cancel a confirmed order. Sent
 * DIRECTLY to the BPP (`${bppUri}/cancel`) with the BPP-issued order_id (from
 * on_confirm's order.id) plus the cancellation reason code — the seller
 * replies asynchronously with the cancelled order (state "Cancelled") or a
 * NACK on the on_cancel webhook.
 *
 * @param {Object} params
 * @param {string} params.bppId
 * @param {string} params.bppUri
 * @param {string} params.orderId  BPP-issued order id (on_confirm's order.id)
 * @param {string} [params.cancellationReasonId="005"] ONDC cancellation reason code (buyer-initiated default)
 * @param {boolean} [params.force] send a FORCE cancellation — cancels past the
 *   seller's refusal or after the parcel has shipped, which triggers RTO. Adds the
 *   `descriptor` block; omit it entirely and the payload is unchanged.
 * @param {string} [params.ttlResponse="PT1H"] how long we'll wait for on_cancel
 * @param {string} [params.fulfillmentId] the fulfillment being cancelled
 * @param {string} [params.transactionId] shared order-session transaction id (reused, not regenerated)
 * @param {string} [params.messageId]
 * @param {string} [params.city]
 * @param {string} [params.domain]
 * @returns {Promise<{status:number,data:any,transactionId:string,messageId:string}>}
 */
const cancel = async ({
  bppId,
  bppUri,
  orderId,
  cancellationReasonId = "005",
  force,
  ttlResponse = "PT1H",
  fulfillmentId,
  transactionId,
  messageId,
  city,
  domain,
} = {}) => {
  if (!orderId) throw new Error("ONDC cancel: orderId is required");

  const message = {
    order_id: orderId,
    cancellation_reason_id: cancellationReasonId,
  };

  // Only attach the descriptor when the caller actually asked about forcing, so
  // an ordinary cancel keeps producing the exact payload it always has.
  if (force !== undefined) {
    const cfg = await getOndcConfig();
    message.descriptor = buildCancelDescriptor({
      force,
      ttlResponse,
      fulfillmentId,
      initiatedBy: cfg.bapId,
    });
  }

  return bppOrderAction("cancel", {
    bppId,
    bppUri,
    message,
    transactionId,
    messageId,
    city,
    domain,
  });
};

/**
 * The `/cancel` message.descriptor.
 *
 * Shape and enums are fixed by the network validator
 * (automation-specifications@release-eks-RET10-1.2.5 config/validations, CANCEL_DESCRIPTOR):
 * `tags[].code` must be one of `params` | `cancel_request`; the `params` list may
 * carry only `force` (value `yes` | `no`) and `ttl_response`; the
 * `cancel_request` list may carry only `initiated_by`.
 */
const buildCancelDescriptor = ({ force, ttlResponse, fulfillmentId, initiatedBy }) => {
  const params = [{ code: "force", value: force ? "yes" : "no" }];
  if (ttlResponse) params.push({ code: "ttl_response", value: ttlResponse });

  const tags = [{ code: "params", list: params }];
  if (initiatedBy) {
    tags.push({ code: "cancel_request", list: [{ code: "initiated_by", value: initiatedBy }] });
  }

  return {
    name: "fulfillment",
    ...(fulfillmentId ? { short_desc: String(fulfillmentId) } : {}),
    tags,
  };
};

/**
 * Build DigiDukaan / ONDC retail `return_request` tag list for /update.
 */
const buildReturnRequestTagList = (returnRequest = {}) => {
  const images = Array.isArray(returnRequest.images)
    ? returnRequest.images.filter(Boolean).join(",")
    : String(returnRequest.images || "");
  return [
    { code: "id", value: String(returnRequest.id) },
    { code: "item_id", value: String(returnRequest.itemId) },
    { code: "item_quantity", value: String(returnRequest.itemQuantity ?? 1) },
    { code: "reason_id", value: String(returnRequest.reasonId || "008") },
    { code: "reason_desc", value: String(returnRequest.reasonDesc || "") },
    { code: "images", value: images },
    { code: "ttl_approval", value: String(returnRequest.ttlApproval || "PT24H") },
    { code: "ttl_reverseqc", value: String(returnRequest.ttlReverseQc || "P3D") },
    // Replacement_Flow: same /update as a return, this tag is the only protocol
    // difference. Default "no" so Return_Flow stays valid when the caller omits it.
    {
      code: "replace",
      value: returnRequest.replace === true || returnRequest.replace === "yes" ? "yes" : "no",
    },
  ];
};

/**
 * ONDC `update` — DigiDukaan buyer return: `update_target: "item"` with a
 * Return fulfillment + `return_request` tags. Prefer `returnRequest` /
 * `returnRequests`. Legacy `fulfillmentId` + Return_Initiated kept as fallback.
 */
const update = ({
  bppId,
  bppUri,
  orderId,
  returnRequest,
  returnRequests,
  fulfillmentId,
  updateTarget = "item",
  transactionId,
  messageId,
  city,
  domain,
} = {}) => {
  if (!orderId) throw new Error("ONDC update: orderId is required");

  const requests = Array.isArray(returnRequests) && returnRequests.length
    ? returnRequests
    : returnRequest
      ? [returnRequest]
      : null;

  if (requests) {
    for (const req of requests) {
      if (!req?.id) throw new Error("ONDC update: returnRequest.id is required");
      if (!req?.itemId) throw new Error("ONDC update: returnRequest.itemId is required");
    }
    return bppOrderAction("update", {
      bppId,
      bppUri,
      message: {
        update_target: updateTarget,
        order: {
          id: orderId,
          fulfillments: requests.map((req, index) => {
            // FULFILLMENTS_ID: a Return fulfillment with only tags and no id is
            // how /update NACKed — the return_request tag's id is not the same
            // field. Keep tag id and fulfillment id identical.
            const id = normalizeOndcNetworkId(req.id, `R${index + 1}`);
            const tags = [
              {
                code: "return_request",
                list: buildReturnRequestTagList({ ...req, id }),
              },
            ];
            if (req.issueId) {
              tags.push({
                code: "igm_request",
                list: [{ code: "id", value: String(req.issueId) }],
              });
            }
            return {
              id,
              type: "Return",
              tags,
            };
          }),
        },
      },
      transactionId,
      messageId,
      city,
      domain,
    });
  }

  if (!fulfillmentId) throw new Error("ONDC update: returnRequest or fulfillmentId is required");
  return bppOrderAction("update", {
    bppId,
    bppUri,
    message: {
      update_target: updateTarget,
      order: {
        id: orderId,
        fulfillments: [
          {
            id: normalizeOndcNetworkId(fulfillmentId),
            state: { descriptor: { code: "Return_Initiated" } },
          },
        ],
      },
    },
    transactionId,
    messageId,
    city,
    domain,
  });
};

/**
 * BNP settlement trail after a refund trigger — DigiDukaan `/update` with
 * settlement_phase "refund".
 */
const updateSettlementTrail = ({
  bppId,
  bppUri,
  orderId,
  settlementAmount,
  settlementType = "upi",
  fulfillmentId,
  // "Return" for a return refund, "Cancel" for a cancellation refund, "RTO" for a
  // return-to-origin. The network reads the fulfillment type to attribute the
  // settlement, so sending "Return" for a cancellation misfiles it.
  fulfillmentType = "Return",
  settlementPhase = "refund",
  transactionId,
  messageId,
  city,
  domain,
} = {}) => {
  if (!orderId) throw new Error("ONDC updateSettlementTrail: orderId is required");
  if (settlementAmount == null || !(Number(settlementAmount) >= 0)) {
    throw new Error("ONDC updateSettlementTrail: settlementAmount is required");
  }
  const amount = parseFloat(Number(settlementAmount).toFixed(2));
  const fulfillments = fulfillmentId
    ? [{ id: normalizeOndcNetworkId(fulfillmentId), type: fulfillmentType }]
    : [{ id: "F1", type: fulfillmentType }];

  return bppOrderAction("update", {
    bppId,
    bppUri,
    message: {
      update_target: "payment",
      order: {
        id: orderId,
        fulfillments,
        payment: {
          "@ondc/org/settlement_details": [
            {
              settlement_counterparty: "buyer",
              settlement_phase: settlementPhase,
              settlement_type: settlementType,
              settlement_amount: amount.toFixed(2),
              settlement_timestamp: new Date().toISOString(),
            },
          ],
        },
      },
    },
    transactionId,
    messageId,
    city,
    domain,
  });
};

/**
 * ONDC `issue` — raise a NEW IGM issue (complainant_action OPEN) against a
 * confirmed order, or send a follow-up complainant action on an EXISTING one
 * (also OPEN — IGM's complainant_action enum is {OPEN, ESCALATE, CLOSE}; both
 * a plain reply and "I can't prove this" re-assert OPEN, since the buyer
 * never unilaterally closes an issue). Sent
 * DIRECTLY to the BPP (`${bppUri}/issue`). Unlike cancel/status, IGM expects
 * the FULL current issue_actions history echoed on every call — the caller
 * (raiseOndcIssue/respondToOndcIssue in ondcEcommerce.js) builds
 * complainantActions/respondentActions from our own stored event thread, not
 * just the new delta. subCategory is a Peko-authored placeholder, not a
 * verified ONDC sub_category code — see models/entities/ondc_issue.js.
 *
 * @param {Object} params
 * @param {string} params.bppId
 * @param {string} params.bppUri
 * @param {string} params.issueId    our own minted uuid — the ONDC issue.id
 * @param {string} params.orderId    BPP-issued order id (on_confirm's order.id)
 * @param {string} params.category   ITEM | FULFILLMENT | ORDER | AGENT
 * @param {string} [params.subCategory]
 * @param {string} [params.description]
 * @param {string[]} [params.images=[]] public image URLs — sent to the seller in description.images
 * @param {Array} [params.complainantActions=[]] full echoed history (each entry carries its own complainant_action: OPEN | ESCALATE | CLOSE)
 * @param {Array} [params.respondentActions=[]]  full echoed history
 * @param {string} [params.transactionId] shared order-session transaction id (reused, not regenerated)
 * @param {string} [params.messageId]
 * @param {string} [params.city]
 * @param {string} [params.domain]
 * @returns {Promise<{status:number,data:any,transactionId:string,messageId:string}>}
 */
const issue = ({
  bppId,
  bppUri,
  issueId,
  orderId,
  category,
  subCategory,
  description,
  images = [],
  complainantActions = [],
  respondentActions = [],
  igm2Session,
  igm2UpdateTarget = false,
  wireStatus,
  transactionId,
  messageId,
  city,
  domain,
} = {}) => {
  if (!orderId) throw new Error("ONDC issue: orderId is required");
  if (!issueId) throw new Error("ONDC issue: issueId is required");
  if (igm2Session) {
    return bppOrderAction("issue", {
      bppId,
      bppUri,
      message: buildIgm2IssueMessage(igm2Session, {
        issueId,
        status: wireStatus,
        now: new Date().toISOString(),
        withUpdateTarget: Boolean(igm2UpdateTarget),
      }),
      transactionId,
      messageId,
      city,
      domain,
    });
  }
  if (!category) throw new Error("ONDC issue: category is required");
  // Only emit `description` when there's real content — but if there are
  // evidence images with no text, still send them under description.images
  // (the seller-visible attachment field IGM expects).
  const desc = (description || images.length)
    ? { short_desc: description, long_desc: description, images }
    : undefined;
  return bppOrderAction("issue", {
    bppId,
    bppUri,
    message: {
      issue: {
        id: issueId,
        category,
        sub_category: subCategory || null,
        order_details: { id: orderId },
        description: desc,
        issue_actions: {
          complainant_actions: complainantActions,
          respondent_actions: respondentActions,
        },
      },
    },
    transactionId,
    messageId,
    city,
    domain,
  });
};

/**
 * ONDC `issue_status` — poll an issue's current state by id. Not called
 * anywhere in v1 (the seller's on_issue/on_issue_status pushes are what drive
 * updates) — kept for parity with the other actions and a future "force
 * refresh" affordance, same posture as the existing status()/track() split.
 *
 * @param {Object} params
 * @param {string} params.bppId
 * @param {string} params.bppUri
 * @param {string} params.issueId
 * @param {string} [params.transactionId]
 * @param {string} [params.messageId]
 * @param {string} [params.city]
 * @param {string} [params.domain]
 * @returns {Promise<{status:number,data:any,transactionId:string,messageId:string}>}
 */
const issueStatus = ({ bppId, bppUri, issueId, transactionId, messageId, city, domain } = {}) => {
  if (!issueId) throw new Error("ONDC issue_status: issueId is required");
  return bppOrderAction("issue_status", {
    bppId,
    bppUri,
    message: { issue_id: issueId },
    transactionId,
    messageId,
    city,
    domain,
  });
};

// =======================
// ON_SEARCH RESPONSE HANDLER
// =======================
// const toInt = (value) => {
//   const n = parseInt(value, 10);
//   return Number.isFinite(n) ? n : null;
// };




module.exports = {
  createOndcAuthorizationHeader,
  createOndcSigningString,
  decodeBase64Loose,
  parseOndcAuthorizationHeader,
  verifyOndcAuthorizationHeader,
  probeSenderSerialization,
  pickSigningPublicKey,
  lookupSigningPublicKey,
  signedPost,
  getServiceOperator,
  search,
  bppOrderAction,
  buildSelectOrder,
  select,
  init,
  confirm,
  status,
  track,
  cancel,
  buildCancelDescriptor,
  update,
  updateSettlementTrail,
  buildReturnRequestTagList,
  issue,
  issueStatus,
  getOndcConfig,
  clearOndcConfigCache,
  OndcAckError,
  assertOndcAck,
  buildSearchCatalogTags,
};
