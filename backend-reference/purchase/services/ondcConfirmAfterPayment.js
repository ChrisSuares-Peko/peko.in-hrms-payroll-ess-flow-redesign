/**
 * Confirm-after-payment for Office Supplies (ONDC) checkouts — purchase's half.
 *
 * paymentGateway sends each seller's /confirm itself, straight from the Cashfree
 * payment callback, and records it (paymentGateway/services/ondcConfirmDispatch.js):
 *
 *   ondcCheckoutConfirms   one row per capture          IN_PROGRESS -> COMPLETED
 *   ondcConfirmAttempts    one row per seller group     PENDING -> DISPATCHED -> CONFIRMED | FAILED
 *
 * From there the checkout is settled here, with no call between the services — they
 * only share these tables:
 * - on_confirm decides the attempt and is stored on it (onConfirmResponse).
 * - Every checkout-result poll (the placing-order page asks every 3 s) settles the
 *   checkout: a seller silent past CONFIRM_TIMEOUT_MS is failed, and a refund or a
 *   late-confirm cancel that did not go through is retried.
 * - When every attempt has settled the checkout completes ONCE and the share no
 *   seller placed goes back in ONE Cashfree refund (cancelPGTransaction, which
 *   allows at most one refund per capture).
 * - A seller that confirms after its attempt already failed is a late confirm: its
 *   share is part of that refund, so the order is cancelled with the seller and
 *   never becomes an ondcOrders row.
 *
 * Every transition is a compare-and-set, so paymentGateway, the webhook and
 * overlapping polls can race safely. Checkouts that predate this flow have no
 * checkout row and keep the old on_confirm path unchanged.
 */

const { findLatestOnConfirmByTransactionId } = require("../models/use-cases/ondc_callback_log");
const {
  findCheckoutConfirm,
  updateCheckoutConfirmIf,
} = require("../models/use-cases/ondc_checkout_confirm");
const {
  findConfirmAttempts,
  findConfirmAttemptById,
  findConfirmAttemptByMessageId,
  findLatestConfirmAttemptByTransactionId,
  updateConfirmAttemptIf,
} = require("../models/use-cases/ondc_confirm_attempt");
const ondc = require("./ondc");
const { cancelPGTransaction } = require("../utils/pgRefund");
const { customLog } = require("../utils/loggerHelper");
const {
  ATTEMPT_STATUS,
  CHECKOUT_STATUS,
  REFUND_STATUS,
  round2,
  parseJson,
  computeCheckoutRefundAmount,
} = require("../utils/ondcCheckoutResult");
const { registerCheckout, recordOnConfirmAndMaybeSplit } = require("./ondcEasySplitAfterConfirm");
const { maybeNotifyOndcCheckoutAndClearCart } = require("./ondcCheckoutNotify");
const { persistAndSettleFromOnConfirm, loadPaymentContext } = require("./ondcOnConfirmPersist");

const FLOW = "ondcConfirmAfterPayment";

/**
 * How long a seller has to answer /confirm with on_confirm before its share is
 * refunded. paymentGateway stamps it on each attempt as deadlineAt; this copy only
 * words the timeout reason.
 */
const CONFIRM_TIMEOUT_MS = 5 * 60 * 1000;
/**
 * An attempt still PENDING (or a seller group never recorded) this long after the
 * capture means paymentGateway died mid-dispatch: /confirm was never sent, so the
 * seller's share is refunded instead.
 */
const UNDISPATCHED_AFTER_MS = 2 * 60 * 1000;
/** A refund is retried no sooner than this after the previous request. */
const REFUND_RETRY_AFTER_MS = 10 * 60 * 1000;
const MAX_REFUND_ATTEMPTS = 3;
/** A late-confirm /cancel the seller did not accept is retried this often, this many times. */
const CANCEL_RETRY_AFTER_MS = 60 * 1000;
const MAX_CANCEL_ATTEMPTS = 3;
/** "Order not required any more" (utils/ondcCancellationReasons.js) — buyer-initiated. */
const LATE_CONFIRM_CANCEL_REASON_ID = "004";

const log = (logTraceId, level, data) =>
  customLog(logTraceId, level, { flow: FLOW, ...data }, "VENDOR");

/**
 * Fit a seller-supplied string to its column. MySQL rejects an over-long value
 * outright, and a rejected attempt write would leave a seller that answered
 * looking silent — timed out and refunded while its order stands.
 */
const clip = (value, max = 255) => (value == null ? null : String(value).slice(0, max));

const errorText = (error) =>
  String(error?.response?.data?.message || error?.message || error || "unknown error").slice(0, 2000);

const describeOnConfirmError = (error, order) => {
  if (error) {
    const code = error.code ? `${error.code}: ` : "";
    return `${code}${error.message || JSON.stringify(error)}`.slice(0, 2000);
  }
  if (!order) return "on_confirm carried no order";
  return `on_confirm order state ${order.state || "unknown"}`;
};

/** Did the gateway refuse because this refund_id was already used (an earlier request landed)? */
const isRefundIdTaken = (body) => {
  const text = [body?.message, body?.code, body?.type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /refund/.test(text) && /(already exists|already present|duplicate)/.test(text);
};

const isSuccessfulOnConfirm = (order, error) =>
  !error && Boolean(order) && String(order.state || "").toLowerCase() !== "cancelled";

const olderThan = (date, ms, now) => Boolean(date) && now.getTime() - new Date(date).getTime() > ms;

/** Tell Easy Split this seller will never send a usable on_confirm (it counts it as skipped). */
const reportFailedSellerToSplit = async (attempt, logTraceId) => {
  try {
    await recordOnConfirmAndMaybeSplit({
      paymentRef: attempt.paymentRef,
      transactionId: attempt.transactionId,
      bppId: attempt.bppId || null,
      providerId: attempt.providerId || null,
      vendorName: attempt.vendorName || null,
      orderId: null,
      quoteTotal: 0,
      error: { code: attempt.failureReason || "failed" },
      logTraceId,
    });
  } catch (splitErr) {
    log(logTraceId, "error", {
      step: "attempt-failed-split",
      message: "Could not report the failed seller to Easy Split",
      paymentRef: attempt.paymentRef,
      transactionId: attempt.transactionId,
      error: errorText(splitErr),
    });
  }
};

/**
 * Mark an attempt FAILED if it is still in `from`. On a win, report the seller to
 * Easy Split as skipped: the split for the sellers who did confirm is only written
 * once every seller has reported.
 */
const failAttempt = async ({ attempt, from, reason, detail = null, extraPatch = {}, logTraceId }) => {
  const won = await updateConfirmAttemptIf({
    id: attempt.id,
    where: { status: from },
    patch: {
      status: ATTEMPT_STATUS.FAILED,
      failureReason: reason,
      failureDetail: detail ? String(detail).slice(0, 2000) : null,
      ...extraPatch,
    },
  });
  if (!won) return false;

  log(logTraceId, "warn", {
    step: "attempt-failed",
    message: "Seller attempt FAILED — its share is refunded when the checkout completes",
    paymentRef: attempt.paymentRef,
    transactionId: attempt.transactionId,
    reason,
    detail,
  });
  await reportFailedSellerToSplit({ ...attempt, failureReason: reason }, logTraceId);
  return true;
};

/**
 * /cancel a late-confirmed order with the seller. Claims one cancel attempt first
 * (compare-and-set on cancelAttempts) so overlapping polls never double-send.
 */
const sendLateCancel = async ({ attempt, logTraceId }) => {
  const previous = Number(attempt.cancelAttempts) || 0;
  const claimed = await updateConfirmAttemptIf({
    id: attempt.id,
    where: { cancelAttempts: previous },
    patch: { cancelAttempts: previous + 1 },
  });
  if (!claimed) return false;

  if (!attempt.ondcOrderId || !attempt.bppUri) {
    await updateConfirmAttemptIf({
      id: attempt.id,
      patch: {
        cancelStatus: "FAILED",
        cancelAttempts: MAX_CANCEL_ATTEMPTS,
        cancelError: "No order id or seller URI to cancel with — needs a manual cancellation",
      },
    });
    log(logTraceId, "error", {
      step: "late-cancel-impossible",
      message: "Late confirm cannot be cancelled automatically — needs a manual cancellation with the seller",
      paymentRef: attempt.paymentRef,
      transactionId: attempt.transactionId,
    });
    return false;
  }

  try {
    await ondc.cancel({
      bppId: attempt.bppId,
      bppUri: attempt.bppUri,
      orderId: attempt.ondcOrderId,
      cancellationReasonId: LATE_CONFIRM_CANCEL_REASON_ID,
      transactionId: attempt.transactionId,
      city: attempt.city || undefined,
      domain: attempt.domain || undefined,
    });
    await updateConfirmAttemptIf({
      id: attempt.id,
      patch: { cancelStatus: "SENT", cancelError: null },
    });
    log(logTraceId, "info", {
      step: "late-cancel-sent",
      message: "Late-confirmed order cancelled with the seller (/cancel ACKed)",
      paymentRef: attempt.paymentRef,
      transactionId: attempt.transactionId,
      ondcOrderId: attempt.ondcOrderId,
    });
    return true;
  } catch (err) {
    await updateConfirmAttemptIf({
      id: attempt.id,
      patch: { cancelStatus: "FAILED", cancelError: errorText(err) },
    });
    log(logTraceId, "error", {
      step: "late-cancel-failed",
      message:
        "Late-confirm /cancel was not accepted — the seller may fulfil an order the buyer is being refunded for",
      paymentRef: attempt.paymentRef,
      transactionId: attempt.transactionId,
      ondcOrderId: attempt.ondcOrderId,
      cancelAttempts: previous + 1,
      error: errorText(err),
    });
    return false;
  }
};

/**
 * A seller confirmed an attempt that had already FAILED. Its share is part of the
 * checkout's refund, so the order must not stand: cancel it with the seller.
 * Handled once per attempt (claimed on lateConfirmAt).
 */
const cancelLateConfirm = async ({ attempt, order, context, logTraceId }) => {
  const claimed = await updateConfirmAttemptIf({
    id: attempt.id,
    where: { status: ATTEMPT_STATUS.FAILED, lateConfirmAt: null },
    patch: {
      lateConfirmAt: new Date(),
      orderState: clip(order?.state || null, 64),
      ondcOrderId: clip(order?.id || attempt.ondcOrderId || null),
      bppId: clip(context?.bpp_id || attempt.bppId || null),
      bppUri: context?.bpp_uri || attempt.bppUri || null,
      city: clip(context?.city || attempt.city || null, 64),
      domain: clip(context?.domain || attempt.domain || null, 64),
    },
  });
  if (!claimed) {
    log(logTraceId, "info", {
      step: "late-confirm-duplicate",
      message: "Late confirm already handled for this attempt",
      paymentRef: attempt.paymentRef,
      transactionId: attempt.transactionId,
    });
    return false;
  }

  log(logTraceId, "error", {
    step: "late-confirm",
    message: "Seller confirmed after its attempt had failed — cancelling with the seller; its share is refunded",
    paymentRef: attempt.paymentRef,
    transactionId: attempt.transactionId,
    failureReason: attempt.failureReason,
    orderId: order?.id || null,
  });

  const fresh = (await findConfirmAttemptById(attempt.id)) || attempt;
  await sendLateCancel({ attempt: fresh, logTraceId });
  return true;
};

/**
 * Decide the attempt an on_confirm belongs to, and store the callback on it.
 *
 * @returns {Promise<{ kind: "none"|"confirmed"|"duplicate"|"failed"|"ignored"|"late", attempt?: Object }>}
 *   `none` — no attempt: a checkout from before this flow; the caller keeps the old path.
 *   `late` — the caller must NOT persist the order (it is being cancelled).
 */
const settleAttemptFromOnConfirm = async ({ context, order, error, logTraceId } = {}) => {
  const transactionId = context?.transaction_id || context?.transactionId || null;
  const messageId = context?.message_id || context?.messageId || null;

  let attempt = messageId ? await findConfirmAttemptByMessageId(messageId) : null;
  if (!attempt && transactionId) {
    // No message_id echo. A transaction id can be reused by a retried checkout, so
    // accept the newest attempt only if it was actually sent a /confirm and, when
    // both sides carry one, the order id is the one that was sent.
    const candidate = await findLatestConfirmAttemptByTransactionId(transactionId);
    const dispatched = Boolean(candidate?.dispatchedAt);
    const sameOrder =
      !order?.id || !candidate?.ondcOrderId || String(order.id) === String(candidate.ondcOrderId);
    if (dispatched && sameOrder) attempt = candidate;
  }
  if (!attempt) return { kind: "none" };

  // What the seller said, kept whatever it decides — the /confirm answer
  // paymentGateway got sits next to it in confirmResponse.
  await updateConfirmAttemptIf({
    id: attempt.id,
    patch: {
      onConfirmResponse: {
        receivedAt: new Date().toISOString(),
        context: context || null,
        order: order || null,
        error: error || null,
      },
    },
  });

  if (isSuccessfulOnConfirm(order, error)) {
    if (attempt.status === ATTEMPT_STATUS.DISPATCHED) {
      const won = await updateConfirmAttemptIf({
        id: attempt.id,
        where: { status: attempt.status },
        patch: {
          status: ATTEMPT_STATUS.CONFIRMED,
          respondedAt: new Date(),
          orderState: clip(order.state || null, 64),
          ondcOrderId: clip(order.id || attempt.ondcOrderId || null),
        },
      });
      if (won) {
        log(logTraceId, "info", {
          step: "attempt-confirmed",
          message: "Seller confirmed the order",
          paymentRef: attempt.paymentRef,
          transactionId: attempt.transactionId,
          orderId: order.id || null,
        });
        return { kind: "confirmed", attempt };
      }
      // Lost a race (the timeout or a duplicate callback) — decide on what won.
      attempt = (await findConfirmAttemptById(attempt.id)) || attempt;
    }
    if (attempt.status === ATTEMPT_STATUS.CONFIRMED) return { kind: "duplicate", attempt };
    // Only an attempt that was sent a /confirm can be confirmed late.
    if (attempt.status === ATTEMPT_STATUS.FAILED && attempt.dispatchedAt) {
      await cancelLateConfirm({ attempt, order, context, logTraceId });
      return { kind: "late", attempt };
    }
    return { kind: "ignored", attempt };
  }

  if (attempt.status === ATTEMPT_STATUS.DISPATCHED) {
    const won = await failAttempt({
      attempt,
      from: attempt.status,
      reason: "on_confirm_error",
      detail: describeOnConfirmError(error, order),
      extraPatch: { respondedAt: new Date() },
      logTraceId,
    });
    return { kind: won ? "failed" : "ignored", attempt };
  }

  log(logTraceId, "info", {
    step: "on-confirm-error-ignored",
    message: "on_confirm error for an attempt that has already settled — ignored",
    paymentRef: attempt.paymentRef,
    transactionId: attempt.transactionId,
    status: attempt.status,
  });
  return { kind: "ignored", attempt };
};

/**
 * The on_confirm webhook's background work (after the ACK): decide the attempt,
 * persist the order unless it is a late confirm being cancelled, then try to
 * complete the checkout. Also how a poll replays a logged-but-unprocessed callback.
 */
const handleOnConfirmCallback = async ({ transactionId, order, error, context, logTraceId } = {}) => {
  let verdict = { kind: "none" };
  try {
    verdict = await settleAttemptFromOnConfirm({ context, order, error, logTraceId });
  } catch (settleErr) {
    // Fail open to the pre-attempt behaviour: losing a real confirmed order is worse
    // than a missed attempt update, and a poll replays this logged callback before
    // it would time the seller out.
    log(logTraceId, "error", {
      step: "settle-threw",
      message: "Could not record on_confirm on the confirm attempt — persisting as before",
      transactionId: transactionId || null,
      error: errorText(settleErr),
    });
  }

  if (verdict.kind === "late") return verdict;

  await persistAndSettleFromOnConfirm({ transactionId, order, error, context, logTraceId });

  if (verdict.attempt?.paymentRef) {
    await tryCompleteCheckout({ paymentRef: verdict.attempt.paymentRef, logTraceId });
  }
  return verdict;
};

/**
 * Request the checkout's refund, if this call can claim it (compare-and-set on
 * refundStatus per `claimWhere`). cancelPGTransaction issues at most one refund per
 * capture: the whole capture as refund_<ref> when nothing was placed, the unplaced
 * share as refund_<ref>_partial otherwise — ids paymentGateway's refund webhook
 * already maps back to the payment. It also mails the corporate that the refund
 * started, and admin when it fails.
 *
 * @returns {Promise<string|null>} the resulting refundStatus, or null when not claimed
 */
const issueCheckoutRefund = async ({ checkout, claimWhere, logTraceId }) => {
  const paymentRef = String(checkout.paymentRef);
  const amount = round2(checkout.refundAmount);
  if (!(amount > 0)) return null;
  const full = checkout.outcome === "FAILED";

  const claimed = await updateCheckoutConfirmIf({
    id: checkout.id,
    where: claimWhere,
    patch: {
      refundStatus: REFUND_STATUS.PENDING,
      refundRequestedAt: new Date(),
      refundAttempts: (Number(checkout.refundAttempts) || 0) + 1,
    },
  });
  if (!claimed) return null;

  const reason = full ? "ONDC confirm failed" : "ONDC partial confirm failure";
  let result;
  try {
    result = await cancelPGTransaction(paymentRef, {
      isOndc: true,
      reason,
      ...(full ? {} : { refundAmount: amount }),
    });
  } catch (err) {
    result = { status: false, message: errorText(err) };
  }

  // "Refund already initiated" (the capture's guard) and a refused duplicate
  // refund_id both mean an earlier request for this checkout got through.
  if (result?.status || isRefundIdTaken(result?.error)) {
    await updateCheckoutConfirmIf({
      id: checkout.id,
      where: { refundStatus: REFUND_STATUS.PENDING },
      patch: { refundStatus: REFUND_STATUS.INITIATED, refundError: null },
    });
    log(logTraceId, "info", {
      step: "refund-initiated",
      message: "Refund initiated for the share no seller placed",
      paymentRef,
      amount,
      full,
      gatewayMessage: result?.message || null,
    });
    return REFUND_STATUS.INITIATED;
  }

  await updateCheckoutConfirmIf({
    id: checkout.id,
    where: { refundStatus: REFUND_STATUS.PENDING },
    patch: {
      refundStatus: REFUND_STATUS.FAILED,
      refundError: String(
        [result?.message, result?.error?.message].filter(Boolean).join(" — ") || "Refund failed"
      ).slice(0, 2000),
    },
  });
  log(logTraceId, "error", {
    step: "refund-failed",
    message: "Refund could NOT be initiated — retried on a later poll; admin has been emailed",
    paymentRef,
    amount,
    full,
    attempt: (Number(checkout.refundAttempts) || 0) + 1,
    gatewayMessage: result?.message || null,
    gatewayError: result?.error || null,
  });
  return REFUND_STATUS.FAILED;
};

/**
 * Complete the checkout once every attempt has settled: refund the share no seller
 * placed, then send the confirmation mail / clear the cart for what was placed.
 * Exactly once (compare-and-set IN_PROGRESS -> COMPLETED); a no-op while any
 * attempt is still PENDING or DISPATCHED.
 */
const tryCompleteCheckout = async ({ paymentRef, logTraceId } = {}) => {
  const checkout = await findCheckoutConfirm({ paymentRef });
  if (!checkout) return { status: null };
  if (checkout.status !== CHECKOUT_STATUS.IN_PROGRESS) return { status: checkout.status };

  const attempts = await findConfirmAttempts({ paymentRef });
  // paymentGateway has not finished recording the sellers yet.
  if (attempts.length < (Number(checkout.groupCount) || 0)) return { status: CHECKOUT_STATUS.IN_PROGRESS };
  const open = attempts.filter(
    (a) => a.status === ATTEMPT_STATUS.PENDING || a.status === ATTEMPT_STATUS.DISPATCHED
  );
  if (open.length) return { status: CHECKOUT_STATUS.IN_PROGRESS };

  const confirmedCount = attempts.filter((a) => a.status === ATTEMPT_STATUS.CONFIRMED).length;
  const outcome = !confirmedCount
    ? "FAILED"
    : confirmedCount === attempts.length
      ? "CONFIRMED"
      : "PARTIAL";
  const refundAmount = computeCheckoutRefundAmount({ capturedAmount: checkout.capturedAmount, attempts });

  const won = await updateCheckoutConfirmIf({
    id: checkout.id,
    where: { status: CHECKOUT_STATUS.IN_PROGRESS },
    patch: { status: CHECKOUT_STATUS.COMPLETED, outcome, completedAt: new Date(), refundAmount },
  });
  if (!won) return { status: CHECKOUT_STATUS.COMPLETED };

  log(logTraceId, outcome === "CONFIRMED" ? "info" : "warn", {
    step: "checkout-completed",
    message: `Checkout completed: ${outcome}`,
    paymentRef,
    confirmedCount,
    attemptCount: attempts.length,
    capturedAmount: round2(checkout.capturedAmount),
    refundAmount,
  });
  if (outcome === "PARTIAL" && !(refundAmount > 0)) {
    log(logTraceId, "error", {
      step: "refund-not-computable",
      message: "Some sellers failed but no refund could be apportioned (no quotes) — needs a manual refund",
      paymentRef,
    });
  }

  // Sellers paymentGateway failed (a /confirm NACK) were never seen by this process's
  // Easy Split coordinator. Report every failed seller — the coordinator ignores a
  // repeat — so the split for the confirmed ones is written.
  registerCheckout(String(paymentRef), attempts.length, logTraceId);
  for (const attempt of attempts.filter((a) => a.status === ATTEMPT_STATUS.FAILED)) {
    // eslint-disable-next-line no-await-in-loop
    await reportFailedSellerToSplit(attempt, logTraceId);
  }

  if (refundAmount > 0) {
    await issueCheckoutRefund({
      checkout: { ...checkout, status: CHECKOUT_STATUS.COMPLETED, outcome, refundAmount },
      claimWhere: { refundStatus: null },
      logTraceId,
    });
  }

  if (confirmedCount) {
    const ctx = await loadPaymentContext(paymentRef);
    maybeNotifyOndcCheckoutAndClearCart({ paymentRef, ctx, logTraceId }).catch(() => {});
  }

  return { status: CHECKOUT_STATUS.COMPLETED, outcome, refundAmount };
};

/**
 * An on_confirm the webhook logged but never processed (the process died after the
 * audit write) must be replayed, not timed out — the seller already has the order.
 * Routed through the normal handler, which finds the right attempt by message_id.
 *
 * @returns {Promise<boolean>} true when the replay settled this attempt
 */
const replayLoggedOnConfirm = async ({ attempt, logTraceId }) => {
  const logged = await findLatestOnConfirmByTransactionId(attempt.transactionId);
  if (!logged) return false;
  const loggedAt = logged.createdAt ? new Date(logged.createdAt).getTime() : 0;
  const dispatchedAt = attempt.dispatchedAt ? new Date(attempt.dispatchedAt).getTime() : 0;
  // A callback from before this /confirm belongs to an earlier session. 1 s of skew allowed.
  if (loggedAt + 1000 < dispatchedAt) return false;

  const payload = parseJson(logged.payload) || {};
  log(logTraceId, "warn", {
    step: "replay-on-confirm",
    message: "Replaying an on_confirm that was logged but never processed",
    paymentRef: attempt.paymentRef,
    transactionId: attempt.transactionId,
    callbackLogId: logged.id,
  });
  await handleOnConfirmCallback({
    transactionId: attempt.transactionId,
    order: payload.message?.order || null,
    error: payload.error || null,
    context: payload.context || null,
    logTraceId,
  });
  const fresh = await findConfirmAttemptById(attempt.id);
  return Boolean(fresh && fresh.status !== ATTEMPT_STATUS.DISPATCHED);
};

/** Retry this checkout's refund if it was refused, or its request never came back. */
const retryRefundIfDue = async ({ checkout, now, logTraceId }) => {
  if (checkout.status !== CHECKOUT_STATUS.COMPLETED) return null;
  if (!olderThan(checkout.refundRequestedAt, REFUND_RETRY_AFTER_MS, now)) return null;
  let claimWhere = null;
  if (
    checkout.refundStatus === REFUND_STATUS.FAILED &&
    (Number(checkout.refundAttempts) || 0) < MAX_REFUND_ATTEMPTS
  ) {
    claimWhere = { refundStatus: REFUND_STATUS.FAILED };
  } else if (checkout.refundStatus === REFUND_STATUS.PENDING) {
    claimWhere = { refundStatus: REFUND_STATUS.PENDING, refundRequestedAt: checkout.refundRequestedAt };
  }
  if (!claimWhere) return null;
  return issueCheckoutRefund({ checkout, claimWhere, logTraceId });
};

/**
 * Settle one checkout — run on every checkout-result poll (the placing-order page
 * asks every 3 s). There is no cron: this is what times sellers out and retries
 * what did not go through.
 *
 * - DISPATCHED past its deadline: replay an on_confirm that was logged but never
 *   processed, otherwise FAILED timeout.
 * - PENDING long after the capture: paymentGateway died before sending /confirm —
 *   FAILED not_dispatched. A checkout whose sellers were never recorded at all is
 *   refunded in full.
 * - Then complete the checkout, and retry a refused/stuck refund or a late-confirm
 *   /cancel the seller did not accept.
 *
 * Idempotent and cheap: a handful of queries keyed on one paymentRef, every change a
 * compare-and-set, so overlapping polls are harmless.
 *
 * @returns {Promise<Object|null>} the checkout row afterwards, or null when there is none
 */
const settleCheckoutOnPoll = async ({ paymentRef, logTraceId, now = new Date() } = {}) => {
  const checkout = await findCheckoutConfirm({ paymentRef });
  if (!checkout) return null;

  if (checkout.status === CHECKOUT_STATUS.IN_PROGRESS) {
    const attempts = await findConfirmAttempts({ paymentRef });
    const capturedAt = checkout.capturedAt || checkout.createdAt;

    for (const attempt of attempts) {
      if (attempt.status === ATTEMPT_STATUS.DISPATCHED && attempt.deadlineAt && new Date(attempt.deadlineAt) < now) {
        // eslint-disable-next-line no-await-in-loop
        if (await replayLoggedOnConfirm({ attempt, logTraceId })) continue;
        // eslint-disable-next-line no-await-in-loop
        await failAttempt({
          attempt,
          from: ATTEMPT_STATUS.DISPATCHED,
          reason: "timeout",
          detail: `No on_confirm within ${CONFIRM_TIMEOUT_MS / 60000} minutes of /confirm`,
          logTraceId,
        });
      } else if (attempt.status === ATTEMPT_STATUS.PENDING && olderThan(capturedAt, UNDISPATCHED_AFTER_MS, now)) {
        // eslint-disable-next-line no-await-in-loop
        await failAttempt({
          attempt,
          from: ATTEMPT_STATUS.PENDING,
          reason: "not_dispatched",
          detail: "/confirm was never sent for this seller — refunded instead",
          logTraceId,
        });
      }
    }

    // paymentGateway inserts every attempt in one statement, so a checkout has all
    // of them or none. None, long after the capture: nothing was ever sent — count
    // it as a checkout with no sellers, which completes FAILED and refunds in full.
    if (!attempts.length && (Number(checkout.groupCount) || 0) > 0 && olderThan(capturedAt, UNDISPATCHED_AFTER_MS, now)) {
      const lowered = await updateCheckoutConfirmIf({
        id: checkout.id,
        where: { status: CHECKOUT_STATUS.IN_PROGRESS, groupCount: checkout.groupCount },
        patch: { groupCount: 0 },
      });
      if (lowered) {
        log(logTraceId, "error", {
          step: "attempts-never-recorded",
          message: "paymentGateway recorded the checkout but none of its sellers — refunding it in full",
          paymentRef,
          expected: checkout.groupCount,
        });
      }
    }

    await tryCompleteCheckout({ paymentRef, logTraceId });
  }

  const settled = (await findCheckoutConfirm({ paymentRef })) || checkout;
  await retryRefundIfDue({ checkout: settled, now, logTraceId });

  const attempts = await findConfirmAttempts({ paymentRef });
  for (const attempt of attempts) {
    if (
      attempt.cancelStatus === "FAILED" &&
      attempt.lateConfirmAt &&
      (Number(attempt.cancelAttempts) || 0) < MAX_CANCEL_ATTEMPTS &&
      olderThan(attempt.updatedAt, CANCEL_RETRY_AFTER_MS, now)
    ) {
      // eslint-disable-next-line no-await-in-loop
      await sendLateCancel({ attempt, logTraceId });
    }
  }

  return (await findCheckoutConfirm({ paymentRef })) || settled;
};

/**
 * on_cancel for a late-confirmed order (the one we asked the seller to cancel):
 * record whether the seller actually cancelled it. A no-op for every other
 * on_cancel — those orders are ondcOrders rows, handled by the webhook as before.
 */
const recordLateConfirmCancelOutcome = async ({ transactionId, order, error, logTraceId } = {}) => {
  const attempt = await findLatestConfirmAttemptByTransactionId(transactionId);
  if (!attempt?.lateConfirmAt) return false;

  if (error) {
    await updateConfirmAttemptIf({
      id: attempt.id,
      patch: { cancelStatus: "FAILED", cancelError: describeOnConfirmError(error, order) },
    });
    log(logTraceId, "error", {
      step: "late-cancel-refused",
      message:
        "Seller refused to cancel a late-confirmed order — retried on a later poll; needs manual follow-up if it keeps refusing",
      paymentRef: attempt.paymentRef,
      transactionId,
      error,
    });
    return true;
  }
  if (String(order?.state || "").toLowerCase() === "cancelled") {
    await updateConfirmAttemptIf({
      id: attempt.id,
      patch: { cancelStatus: "CANCELLED", cancelError: null },
    });
    log(logTraceId, "info", {
      step: "late-cancel-confirmed",
      message: "Seller cancelled the late-confirmed order",
      paymentRef: attempt.paymentRef,
      transactionId,
    });
    return true;
  }
  return false;
};

module.exports = {
  CONFIRM_TIMEOUT_MS,
  LATE_CONFIRM_CANCEL_REASON_ID,
  settleAttemptFromOnConfirm,
  handleOnConfirmCallback,
  tryCompleteCheckout,
  settleCheckoutOnPoll,
  recordLateConfirmCancelOutcome,
};
