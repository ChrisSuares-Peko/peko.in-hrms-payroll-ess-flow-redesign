/**
 * Pure helpers for the confirm-after-payment flow (services/ondcConfirmAfterPayment.js),
 * shared with the checkout-result endpoint. No I/O here, so the controller can use
 * them without loading the flow's gateway/mail/ONDC dependencies.
 */

const ATTEMPT_STATUS = Object.freeze({
  PENDING: "PENDING",
  DISPATCHED: "DISPATCHED",
  CONFIRMED: "CONFIRMED",
  FAILED: "FAILED",
});

const CHECKOUT_STATUS = Object.freeze({
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
});

const REFUND_STATUS = Object.freeze({
  PENDING: "PENDING",
  INITIATED: "INITIATED",
  FAILED: "FAILED",
});

const round2 = (value) => parseFloat((Number(value) || 0).toFixed(2));

const parseJson = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
};

/**
 * The part of the capture no seller placed.
 *
 * Each seller's share of the capture is proportional to its on_init quote, so a
 * failed seller takes its pro-rata part of the platform fee (the capture is the
 * quotes plus the fee) back with it. Refunded = captured − the confirmed sellers'
 * shares, which also returns the share of a seller that never had a quote at all.
 *
 *   nothing confirmed  → the whole capture
 *   everything confirmed → 0
 *
 * @param {{ capturedAmount: number|string, attempts: Array<{ status: string, quoteAmount: number|string }> }} params
 * @returns {number} rounded to paise
 */
const computeCheckoutRefundAmount = ({ capturedAmount, attempts = [] } = {}) => {
  const captured = round2(capturedAmount);
  if (!(captured > 0)) return 0;
  const confirmed = attempts.filter((a) => a.status === ATTEMPT_STATUS.CONFIRMED);
  if (!confirmed.length) return captured;
  if (confirmed.length === attempts.length) return 0;

  const weight = attempts.reduce((sum, a) => sum + (Number(a.quoteAmount) || 0), 0);
  // No quotes to apportion by — the caller logs this for a manual refund rather
  // than guessing a split.
  if (!(weight > 0)) return 0;

  const kept = confirmed.reduce(
    (sum, a) => sum + round2((captured * (Number(a.quoteAmount) || 0)) / weight),
    0
  );
  return Math.max(0, round2(captured - kept));
};

/**
 * Is `userData` (ondcCartUserData of the polling request) the buyer of this checkout?
 * Same buyer split as loadPaymentContext: sub-users by subCorporateId, everyone
 * else by corporateUserId.
 */
const ownsCheckout = (checkout, { corporateUserId, subCorporateId } = {}) => {
  if (!checkout) return false;
  if (subCorporateId) {
    return checkout.subCorporateUserId != null && String(checkout.subCorporateUserId) === String(subCorporateId);
  }
  return checkout.corporateUserId != null && String(checkout.corporateUserId) === String(corporateUserId);
};

/**
 * What the buyer is told about the refund. Nothing until the checkout completes —
 * until then the amount is not known. SUCCESS once Cashfree's refund webhook has
 * marked the capture's refund settled (paymentGateway writes it onto the payment's
 * paymentModeResponse; this checkout's refund is the only one cancelPGTransaction
 * issues against the capture).
 */
const refundView = ({ checkout, paymentModeResponse }) => {
  const amount = round2(checkout?.refundAmount);
  if (checkout?.status !== CHECKOUT_STATUS.COMPLETED || !(amount > 0)) {
    return { status: "NONE", amount: 0 };
  }
  if (checkout.refundStatus === REFUND_STATUS.INITIATED) {
    const blob = parseJson(paymentModeResponse) || {};
    const settled = String(blob.refundStatus || "").toUpperCase() === "SUCCESS";
    return { status: settled ? "SUCCESS" : "INITIATED", amount };
  }
  if (checkout.refundStatus === REFUND_STATUS.FAILED) return { status: "FAILED", amount };
  return { status: "PENDING", amount };
};

const GROUP_STATUS_BY_ATTEMPT = {
  [ATTEMPT_STATUS.CONFIRMED]: "confirmed",
  [ATTEMPT_STATUS.FAILED]: "failed",
};

/**
 * The checkout-result payload for a confirm-after-payment checkout: one group per
 * seller attempt (pending / confirmed / failed), confirmed groups enriched from
 * their ondcOrders row. Same shape as the row-based answer, plus `refund` and
 * `deadlineAt` (when the slowest seller's on_confirm window closes).
 */
const buildCheckoutResultFromAttempts = ({
  paymentRef,
  checkout,
  attempts = [],
  rows = [],
  paymentModeResponse = null,
  settlement,
}) => {
  const rowsByTxn = new Map((rows || []).map((row) => [String(row.transactionId), row]));

  const groups = attempts.map((attempt) => {
    const status = GROUP_STATUS_BY_ATTEMPT[attempt.status] || "pending";
    const row = status === "confirmed" ? rowsByTxn.get(String(attempt.transactionId)) : null;
    return {
      bppId: row?.bppId || attempt.bppId || null,
      bppUri: row?.bppUri || attempt.bppUri || null,
      providerId: row?.providerId || attempt.providerId || null,
      vendorName: row?.vendorName || attempt.vendorName || "",
      cartItems: row?.items || [],
      transactionId: attempt.transactionId || undefined,
      status,
      reason: status === "failed" ? attempt.failureReason || "failed" : null,
      quote: row?.quote || null,
      deliveryTat: row?.deliveryTat || null,
      expectedDeliveryDate: row?.expectedDeliveryDate || null,
      orderState: row?.orderState || (status === "confirmed" ? attempt.orderState : null) || null,
      orderId: row?.orderId || (status === "confirmed" ? attempt.ondcOrderId : null) || null,
      payment: row?.payment || null,
      error: null,
    };
  });

  const confirmedRows = attempts
    .filter((a) => a.status === ATTEMPT_STATUS.CONFIRMED)
    .map((a) => rowsByTxn.get(String(a.transactionId)))
    .filter(Boolean);
  const confirmedTotal = round2(
    confirmedRows.reduce((sum, r) => sum + (parseFloat(r.quote?.total) || parseFloat(r.totalAmount) || 0), 0)
  );
  const amountPaidTotal = round2(
    confirmedRows.reduce((sum, r) => sum + (parseFloat(r.amountPaid) || parseFloat(r.totalAmount) || 0), 0)
  );

  const anyConfirmed = groups.some((g) => g.status === "confirmed");
  const allConfirmed = groups.length > 0 && groups.every((g) => g.status === "confirmed");
  const failedCount = groups.filter((g) => g.status === "failed").length;
  const completed = checkout?.status === CHECKOUT_STATUS.COMPLETED;

  const deadlines = attempts
    .map((a) => (a.deadlineAt ? new Date(a.deadlineAt).getTime() : NaN))
    .filter((t) => Number.isFinite(t));
  const confirmedAtSource = confirmedRows[0]?.createdAt || checkout?.completedAt || null;

  return {
    paymentRef,
    status: completed ? (anyConfirmed ? "CONFIRMED" : "FAILED") : "PENDING",
    groups,
    confirmedTotal,
    amountPaidTotal,
    allConfirmed,
    anyConfirmed,
    failedCount,
    confirmedAt: confirmedAtSource ? new Date(confirmedAtSource).toISOString() : undefined,
    deadlineAt: deadlines.length ? new Date(Math.max(...deadlines)).toISOString() : null,
    refund: refundView({ checkout, paymentModeResponse }),
    settlement,
  };
};

module.exports = {
  ATTEMPT_STATUS,
  CHECKOUT_STATUS,
  REFUND_STATUS,
  round2,
  parseJson,
  computeCheckoutRefundAmount,
  ownsCheckout,
  refundView,
  buildCheckoutResultFromAttempts,
};
