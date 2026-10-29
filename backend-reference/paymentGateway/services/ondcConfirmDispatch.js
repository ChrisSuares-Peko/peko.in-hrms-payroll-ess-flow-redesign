const { v4: uuidv4 } = require("uuid");
const { UniqueConstraintError } = require("sequelize");
const { ondcCheckoutConfirms, ondcConfirmAttempts } = require("../models/entities/ondc_confirm_readwrite");
const { findLatestOnInitByTransactionId } = require("../models/use-cases/ondc_callback_log");
const ondc = require("./ondc");
const { customLog } = require("../utils/loggerHelper");

/**
 * Send each seller's ONDC /confirm for a captured Office Supplies checkout, straight
 * from the Cashfree payment callback, and record what happened.
 *
 *   ondcCheckoutConfirms   one row per capture (paymentRef)
 *   ondcConfirmAttempts    one row per seller group: PENDING -> DISPATCHED | FAILED,
 *                          with the seller's synchronous answer in confirmResponse
 *
 * That is all this service does. purchase owns the rest from the same tables — no
 * call between the services: its on_confirm webhook settles each attempt, and every
 * checkout-result poll (the placing-order page asks every 3 s) times out a seller
 * silent past deadlineAt, completes the checkout and refunds the share no seller
 * placed (purchase/services/ondcConfirmAfterPayment.js).
 *
 * Every step is idempotent: the checkout row is unique on paymentRef, attempts are
 * unique on (paymentRef, transactionId) and are claimed PENDING -> DISPATCHED before
 * /confirm goes out, so a repeated callback never sends a seller /confirm twice.
 * Never throws — the payment is already recorded and answered.
 */

const FLOW = "ondcPgDirectConfirm";

/** How long a seller has to answer with on_confirm; purchase fails it after this. */
const CONFIRM_TIMEOUT_MS = 5 * 60 * 1000;

const log = (logTraceId, level, data) =>
  customLog(logTraceId, level, { flow: FLOW, ...data }, "VENDOR");

const clip = (value, max = 255) => (value == null ? null : String(value).slice(0, max));

const parseJson = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
};

/** "₹1,234.50" / "1234.5" / 1234.5 -> 1234.5 (0 when unreadable). */
const parseAmount = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const match = String(value ?? "").replace(/,/g, "").match(/\d*\.?\d+/);
  const parsed = match ? parseFloat(match[0]) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
};

/** What Cashfree captured: the SUCCESS payment's amount, else the checkout's pgAmount. */
const resolveCapturedAmount = (pgResponse, pgAmount) => {
  const payments = Array.isArray(pgResponse) ? pgResponse : pgResponse ? [pgResponse] : [];
  const settled = payments.find((p) => p?.payment_status === "SUCCESS") || payments[0];
  const captured = Number(settled?.payment_amount) || Number(pgAmount) || 0;
  return parseFloat(captured.toFixed(2));
};

/** Same buyer split as purchase's loadPaymentContext / checkout-result ownership check. */
const resolveBuyer = (user = {}) => {
  const isSub = user.role === "CORPORATE_SUB_USER" && user.subCorporateId;
  return {
    corporateUserId: isSub ? null : user.corporateId || null,
    subCorporateUserId: isSub ? user.subCorporateId : null,
  };
};

/** Compare-and-set on an attempt; true when this call won. */
const updateAttemptIf = async (id, where, patch) => {
  const [affected] = await ondcConfirmAttempts.update(patch, { where: { ...where, id } });
  return affected > 0;
};

const findOrCreateCheckout = async (paymentRef, defaults) => {
  const where = { paymentRef };
  const existing = await ondcCheckoutConfirms.findOne({ where, raw: true });
  if (existing) return existing;
  try {
    const created = await ondcCheckoutConfirms.create({ ...defaults, ...where });
    return created.get({ plain: true });
  } catch (error) {
    // The same capture recorded twice at once (both Cashfree completion paths).
    if (!(error instanceof UniqueConstraintError)) throw error;
    return ondcCheckoutConfirms.findOne({ where, raw: true });
  }
};

/** Send /confirm for one PENDING attempt and store the seller's answer. */
const dispatchAttempt = async ({ attempt, paymentRef, logTraceId }) => {
  const fail = async (reason, detail = null, confirmResponse = null) => {
    const won = await updateAttemptIf(attempt.id, { status: "PENDING" }, {
      status: "FAILED",
      failureReason: reason,
      failureDetail: detail,
      ...(confirmResponse ? { confirmResponse } : {}),
    });
    if (won) {
      log(logTraceId, "error", {
        step: "confirm-not-sent",
        message: "BPP /confirm not sent — purchase refunds this seller's share",
        paymentRef,
        transactionId: attempt.transactionId,
        reason,
      });
    }
    return false;
  };

  const initLog = await findLatestOnInitByTransactionId(attempt.transactionId);
  const payload = parseJson(initLog?.payload);
  if (!payload) return fail("on_init_not_found");
  const initOrder = payload.message?.order;
  if (!initOrder) return fail("on_init_order_missing");

  const context = payload.context || {};
  const bppId = initLog.bppId || context.bpp_id || attempt.bppId || null;
  const bppUri = initLog.bppUri || context.bpp_uri || attempt.bppUri || null;
  const domain = initLog.domain || context.domain || null;
  const city = context.city || null;
  if (!bppUri) return fail("missing_bpp_uri");

  // Minted before sending so the attempt holds the order id even if the seller never
  // answers — it is what purchase cancels a late confirm by. confirm() keeps a valid
  // initOrder.id, so this is exactly the id the seller receives.
  const ondcOrderId = ondc.toOndcNetworkId(initOrder.id) || uuidv4().replace(/-/g, "");
  const messageId = uuidv4();
  const dispatchedAt = new Date();
  const claimed = await updateAttemptIf(attempt.id, { status: "PENDING" }, {
    status: "DISPATCHED",
    bppId: clip(bppId),
    bppUri,
    domain: clip(domain, 64),
    city: clip(city, 64),
    ondcOrderId,
    messageId,
    dispatchedAt,
    deadlineAt: new Date(dispatchedAt.getTime() + CONFIRM_TIMEOUT_MS),
  });
  // Someone else is already sending this seller's /confirm.
  if (!claimed) return false;

  log(logTraceId, "info", {
    step: "confirm-bpp-request",
    message: "Calling BPP /confirm with on_init order from DB",
    paymentRef,
    transactionId: attempt.transactionId,
    bppId,
    messageId,
    ondcOrderId,
  });

  try {
    const result = await ondc.confirm({
      bppId,
      bppUri,
      domain,
      city,
      transactionId: attempt.transactionId,
      messageId,
      initOrder: { ...initOrder, id: ondcOrderId },
      paymentRef,
    });
    await updateAttemptIf(attempt.id, {}, {
      confirmResponse: {
        at: new Date().toISOString(),
        httpStatus: result?.status ?? null,
        ackStatus: result?.data?.message?.ack?.status || null,
        data: result?.data ?? null,
      },
    });
    log(logTraceId, "info", {
      step: "confirm-bpp-response",
      message: "BPP /confirm ACK received — waiting for on_confirm",
      paymentRef,
      transactionId: attempt.transactionId,
      httpStatus: result?.status ?? null,
    });
    return true;
  } catch (err) {
    if (err?.name === "OndcAckError") {
      // The seller answered and refused: no on_confirm is coming.
      const code = err.ondcCode ? `${err.ondcCode}: ` : "";
      const http = err.httpStatus ? ` (HTTP ${err.httpStatus})` : "";
      await updateAttemptIf(attempt.id, { status: "DISPATCHED" }, {
        status: "FAILED",
        failureReason: "sync_nack",
        failureDetail: `${code}${err.ondcMessage || err.message}${http}`.slice(0, 2000),
        confirmResponse: {
          at: new Date().toISOString(),
          httpStatus: err.httpStatus ?? null,
          ackStatus: err.ackStatus || "NACK",
          error: { code: err.ondcCode || null, message: err.ondcMessage || err.message },
        },
      });
      log(logTraceId, "error", {
        step: "confirm-bpp-failed",
        message: "BPP /confirm refused — purchase refunds this seller's share",
        paymentRef,
        transactionId: attempt.transactionId,
        ondcCode: err.ondcCode || null,
        ondcMessage: err.ondcMessage || null,
      });
      return false;
    }
    // No answer (timeout, network): the seller may still have the request, so the
    // attempt stays DISPATCHED — on_confirm or purchase's deadline check decides.
    await updateAttemptIf(attempt.id, {}, {
      confirmResponse: {
        at: new Date().toISOString(),
        error: { message: String(err?.message || err).slice(0, 2000) },
      },
    });
    log(logTraceId, "warn", {
      step: "confirm-bpp-unanswered",
      message: "BPP /confirm got no answer — waiting for on_confirm or the deadline",
      paymentRef,
      transactionId: attempt.transactionId,
      error: err?.message || String(err),
    });
    return false;
  }
};

/**
 * Record the checkout and one attempt per seller, then send every seller its
 * /confirm concurrently (one slow seller must not hold another).
 *
 * @param {Object} params
 * @param {string} params.paymentRef   the Cashfree paymentRefId (= corporateTxnId)
 * @param {Array}  params.ondcGroups   the checkout's seller groups (paymentData.ondcGroups)
 * @param {Object} params.user         req.user of the payment
 * @param {*}      params.pgResponse   Cashfree payments (req.body.paymentGatewayResponse)
 * @param {*}      params.pgAmount     what the buyer was charged
 */
const dispatchCheckoutConfirms = async ({ paymentRef, ondcGroups = [], user, pgResponse, pgAmount, logTraceId } = {}) => {
  const ref = String(paymentRef || "");
  if (!ref) return { status: false, reason: "missing_payment_ref" };

  try {
    const groups = (Array.isArray(ondcGroups) ? ondcGroups : []).filter((g) => {
      if (g?.transactionId) return true;
      log(logTraceId, "error", {
        step: "group-without-transaction",
        message: "Seller group has no transactionId — it cannot be confirmed; its share falls to the refund",
        paymentRef: ref,
        providerId: g?.providerId || null,
      });
      return false;
    });

    const rows = [];
    for (const group of groups) {
      // eslint-disable-next-line no-await-in-loop
      const initLog = await findLatestOnInitByTransactionId(group.transactionId);
      const initOrder = parseJson(initLog?.payload)?.message?.order || null;
      const initQuote = parseAmount(initOrder?.quote?.price?.value);
      rows.push({
        paymentRef: ref,
        transactionId: String(group.transactionId),
        bppId: clip(initLog?.bppId || group.bppId || null),
        bppUri: initLog?.bppUri || group.bppUri || null,
        providerId: clip(initOrder?.provider?.id || group.providerId || null),
        vendorName: clip(group.vendorName || null),
        // The seller-signed on_init quote; the checkout's own figure only when there is none.
        quoteAmount: initQuote > 0 ? initQuote : parseFloat(group.amount) || 0,
        status: "PENDING",
      });
    }

    // groupCount is how many attempts the checkout must have before purchase may
    // complete it — a failed attempt insert can never read as "no sellers, refund all".
    await findOrCreateCheckout(ref, {
      ...resolveBuyer(user),
      groupCount: rows.length,
      capturedAmount: resolveCapturedAmount(pgResponse, pgAmount),
      capturedAt: new Date(),
      status: "IN_PROGRESS",
    });
    if (rows.length) await ondcConfirmAttempts.bulkCreate(rows, { ignoreDuplicates: true });

    const attempts = await ondcConfirmAttempts.findAll({
      where: { paymentRef: ref, status: "PENDING" },
      order: [["id", "ASC"]],
      raw: true,
    });
    log(logTraceId, "info", {
      step: "confirm-dispatch-start",
      message: "Dispatching BPP /confirm for all seller groups",
      paymentRef: ref,
      ondcGroupCount: rows.length,
      pendingCount: attempts.length,
    });

    const results = await Promise.all(
      attempts.map((attempt) =>
        dispatchAttempt({ attempt, paymentRef: ref, logTraceId }).catch((err) => {
          log(logTraceId, "error", {
            step: "confirm-dispatch-threw",
            message: "Dispatching one seller threw — purchase settles it on the next poll",
            paymentRef: ref,
            transactionId: attempt.transactionId,
            error: err?.message || String(err),
          });
          return false;
        })
      )
    );
    const acked = results.filter(Boolean).length;
    log(logTraceId, acked === attempts.length ? "info" : "error", {
      step: "confirm-dispatch-done",
      message:
        acked === attempts.length
          ? "BPP /confirm acked by every seller"
          : "BPP /confirm did NOT reach every seller — purchase refunds what is not placed",
      paymentRef: ref,
      confirmAckedCount: acked,
      dispatchedCount: attempts.length,
    });
    return { status: true, dispatched: attempts.length, acked };
  } catch (err) {
    // Rows that did get written are settled by purchase's poll; nothing else to do.
    log(logTraceId, "error", {
      step: "confirm-dispatch-failed",
      message: "Could not record/dispatch the seller confirms — payment is captured",
      paymentRef: ref,
      error: err?.message || String(err),
    });
    return { status: false, reason: "exception", error: err?.message || String(err) };
  }
};

module.exports = { dispatchCheckoutConfirms, CONFIRM_TIMEOUT_MS };
