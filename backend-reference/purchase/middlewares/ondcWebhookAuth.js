const {
  lookupSigningPublicKey,
  parseOndcAuthorizationHeader,
  verifyOndcAuthorizationHeader,
  getOndcConfig,
} = require("../services/ondc");
const { customLog } = require("../utils/loggerHelper");
const { reportInbound } = require("../services/ondcObservability");

const authNack = (req, res, message = "Cannot verify Authorization signature") => {
  const ackBody = {
    message: { ack: { status: "NACK" } },
    error: {
      type: "AuthenticationError",
      code: "401",
      message,
    },
  };
  reportInbound({ reqBody: req?.body, ackBody });
  return res.status(401).json(ackBody);
};

/**
 * Bodies to try the signature against, most likely first.
 *
 * Passed as Buffers, never strings. The digest must be over the exact bytes the
 * sender signed; `buffer.toString("utf8")` replaces any invalid UTF-8 sequence
 * with U+FFFD, which is always the case for a gzip body — so the old
 * `rawBody.toString("utf8")` could never verify a compressed request.
 * verifyOndcAuthorizationHeader hashes a Buffer as raw bytes and only
 * UTF-8-encodes actual strings.
 *
 *   1. req.rawWireBody — exactly what arrived. GCR sends gzip and signs the
 *      COMPRESSED bytes, so for GCR this is the one that verifies.
 *   2. req.rawBody     — the decoded bytes: what a sender that compresses after
 *      signing would have hashed. Identical to #1 for an uncompressed request, in
 *      which case it is skipped.
 *   3. re-serialized   — for senders that sign a re-serialization of their object
 *      rather than the bytes they transmit.
 *
 * Offering all three is safe: a signature binds to one digest, so an extra
 * candidate costs one hash on the failure path and cannot make a forged body verify.
 * Both buffers are set by middlewares/captureOndcWireBody.js.
 */
const bodyCandidates = (req) => {
  const candidates = [];
  const addBytes = (buf) => {
    if (!Buffer.isBuffer(buf) || !buf.length) return;
    if (candidates.some((c) => Buffer.isBuffer(c) && c.equals(buf))) return;
    candidates.push(buf);
  };

  addBytes(req.rawWireBody);
  addBytes(req.rawBody);

  const reserialized = Buffer.from(JSON.stringify(req.body ?? {}), "utf8");
  addBytes(reserialized);

  return candidates;
};

/**
 * GCR (the ONDC Global Catalog Repository) signs everything it sends a Buyer App
 * with TWO headers: the standard `Authorization`, plus this one carrying GCR's
 * own Ed25519 signature. Its presence is also the documented way to tell that a
 * payload was relayed by GCR rather than sent by the seller directly.
 */
const GATEWAY_AUTH_HEADER = "x-gateway-authorization";

/**
 * Verify one ONDC signature header against the request body.
 *
 * Delegates the actual check to services/ondc.js `verifyOndcAuthorizationHeader`
 * rather than re-implementing it here. That one also enforces the created/expires
 * window (clock skew via ONDC_WEBHOOK_AUTH_SKEW_SECONDS), the ed25519 algorithm
 * and the signed-header list — none of which this middleware used to check, so a
 * captured request could be replayed indefinitely.
 *
 * Returns `{ valid, reason, subscriberId }`; `reason` is what makes a rejection
 * diagnosable from the logs instead of a bare "verification failed".
 */
const verifySignatureHeader = async ({
  header,
  bodies,
  label,
  domain,
  subscriberIdOverride = null,
}) => {
  const parts = parseOndcAuthorizationHeader(header);
  if (!parts?.subscriberId || !parts?.uniqueKeyId || !parts?.signature) {
    return { valid: false, reason: "invalid_header", label, subscriberId: null };
  }

  // When pinned, resolve the key for the subscriber WE configured rather than the
  // one the request claims to be. The request no longer gets to choose whose key
  // it is checked against: anything not signed by that subscriber fails.
  const lookupSubscriberId = subscriberIdOverride || parts.subscriberId;

  let publicKey = null;
  try {
    publicKey = await lookupSigningPublicKey({
      subscriberId: lookupSubscriberId,
      uniqueKeyId: parts.uniqueKeyId,
      algorithm: parts.algorithm,
      domain,
    });
  } catch (lookupErr) {
    // lookupSigningPublicKey throws (rather than returning null) when the
    // registry has no key for this subscriber — e.g. a GCR subscriber id that
    // is not in the registry we are pointed at.
    return {
      valid: false,
      reason: "registry_lookup_failed",
      label,
      subscriberId: parts.subscriberId,
      error: lookupErr?.message || String(lookupErr),
    };
  }

  if (!publicKey) {
    return {
      valid: false,
      reason: "no_public_key",
      label,
      subscriberId: parts.subscriberId,
    };
  }

  const result = await verifyOndcAuthorizationHeader({
    header,
    bodyStrings: bodies,
    publicKey,
  });

  return {
    ...result,
    label,
    subscriberId: parts.subscriberId,
    lookupSubscriberId,
  };
};

const verifyOndcWebhookAuth = async (req, res, next) => {
  try {
    // Skip verification wholesale in staging. WARNING: every ONDC webhook there
    // accepts UNSIGNED requests — anyone who can reach the URL can post a catalog
    // or an order callback. Kept deliberately: staging points at test harnesses
    // and partner sandboxes whose callbacks are not signed by a
    // registry-resolvable subscriber. Never extend this to production. Checked
    // before the config lookup so staging does not pay a DB round trip per call.
    if (process.env.NODE_ENV==="staging") {
      return next();
    }
    // Second bypass, config-driven: a vendor row pinning a transaction id means
    // we are pointed at a scripted test harness (the ONDC Workbench) whose
    // callbacks are not signed by a registry-resolvable subscriber. Unlike the
    // NODE_ENV check above this is per-deployment data, so production can be
    // pointed at the Workbench without redeploying. A config lookup failure must
    // NOT open the gate.
    let cfg = null;
    try {
      cfg = await getOndcConfig();
    } catch (cfgErr) {
      cfg = null;
    }
    if (cfg?.workbenchMode) {
      return next();
    }

    const authorization = req.headers["authorization"] || null;
    if (!authorization) {
      return authNack(req, res, "Missing Authorization header");
    }

    const bodies = bodyCandidates(req);
    const domain = req.body?.context?.domain;

    // Under GCR the whole network's catalog reaches us from ONE sender, so for
    // on_search we resolve the key for the subscriber pinned on the vendor row
    // (optionals.gcrSubscriberId) and ignore whichever id the request claims.
    // Which seller the catalog is FOR does not matter — context.bpp_id still
    // carries that; this is only about who signed the delivery.
    //
    // Scoped to on_search deliberately. The order callbacks (on_select, on_init,
    // on_confirm, on_status, ...) still come BAP<->BPP directly from the seller
    // and are signed with the SELLER's key, so pinning them to GCR would fail
    // every checkout.
    const isCatalogCallback =
      String(req.path || "").endsWith("/on_search") ||
      req.body?.context?.action === "on_search";
    const pinnedSigner = (isCatalogCallback && cfg?.gcrSubscriberId) || null;

    const primary = await verifySignatureHeader({
      header: authorization,
      bodies,
      label: "authorization",
      domain,
      subscriberIdOverride: pinnedSigner,
    });

    if (!primary.valid) {
      customLog(
        null,
        "error",
        {
          message: "ONDC webhook auth rejected",
          header: "authorization",
          reason: primary.reason,
          subscriberId: primary.subscriberId,
          verifiedAgainst: primary.lookupSubscriberId || null,
          action: req.body?.context?.action || null,
          transactionId: req.body?.context?.transaction_id || null,
          ...(primary.error ? { error: primary.error } : {}),
        },
        "VENDOR"
      );
      return authNack(
        req,
        res,
        `Authorization signature rejected (${primary.reason})`
      );
    }

    // A GCR-relayed payload carries GCR's signature here IN ADDITION to
    // Authorization. Verify it when present — an unverified second signature is
    // worse than none, since downstream code would otherwise trust the header as
    // proof the payload came via GCR.
    const gatewayHeader = req.headers[GATEWAY_AUTH_HEADER] || null;
    let gateway = null;
    if (gatewayHeader) {
      gateway = await verifySignatureHeader({
        header: gatewayHeader,
        bodies,
        label: GATEWAY_AUTH_HEADER,
        domain,
        subscriberIdOverride: pinnedSigner,
      });

      if (!gateway.valid) {
        customLog(
          null,
          "error",
          {
            message: "ONDC webhook auth rejected",
            header: GATEWAY_AUTH_HEADER,
            reason: gateway.reason,
            subscriberId: gateway.subscriberId,
            verifiedAgainst: gateway.lookupSubscriberId || null,
            action: req.body?.context?.action || null,
            transactionId: req.body?.context?.transaction_id || null,
            ...(gateway.error ? { error: gateway.error } : {}),
          },
          "VENDOR"
        );
        return authNack(
          req,
          res,
          `Gateway signature rejected (${gateway.reason})`
        );
      }
    }

    // Downstream (ingest, catalog rejection) needs to know who actually signed
    // this and whether it arrived via GCR.
    req.ondcAuth = {
      subscriberId: primary.subscriberId,
      gatewaySubscriberId: gateway?.subscriberId || null,
      viaGateway: Boolean(gateway),
    };

    return next();
  } catch (error) {
    customLog(
      null,
      "error",
      {
        message: "Error during ONDC webhook authentication",
        error: error?.message || String(error),
      },
      "VENDOR"
    );
    return authNack(
      req,
      res,
      "Error during ONDC webhook authentication: " +
        (error?.message || String(error))
    );
  }
};

module.exports = { verifyOndcWebhookAuth, bodyCandidates };
