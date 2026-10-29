/**
 * Admin-issued buyer refund on a DELAYED ONDC order — the promised delivery date has
 * passed and the goods have not arrived.
 *
 * Safe by construction: `payoutDueAt` is only set once delivery is observed and the
 * sweep only releases a payout after that date, so an undelivered order's money is
 * still in Peko's Cashfree balance. Refunding debits Peko and the seller who missed
 * the date is never paid — no clawback needed.
 *
 * Owns the whole decision (eligibility, cap, gateway call, ledger, payout block) so
 * the controller stays thin. Never throws — every outcome is a reason code.
 */

const { customLog } = require("../utils/loggerHelper");
const { refundOndcOrderPayment } = require("../utils/cashFreeGateway");
const { publishJournalEvent } = require("../utils/bull/queue/accountingEventsQueue");
const { sendOndcOrderRefundEmail } = require("./ondcRefundCancelNotify");
const {
  findOndcOrderByIdAdmin,
  incrementOndcOrderRefundedAmount,
  claimOndcOrderPayout,
} = require("../models/use-cases/ondc_order");
const {
  recordOndcOrderRefund,
  sumOndcOrderRefunds,
  sumOndcOrderVendorRefunds,
} = require("../models/use-cases/ondc_order_refund");

const log = (logTraceId, level, data) =>
  customLog(logTraceId, level, { scope: "ondcRefund", flow: "adminRefund", ...data }, "VENDOR");

/** Reason codes, so the controller can map them to messages/status codes. */
const REASONS = {
  NOT_FOUND: "order_not_found",
  NOT_DELAYED: "not_delayed",
  ALREADY_DELIVERED: "already_delivered",
  NO_PAYMENT_REF: "no_payment_ref",
  ORDER_CANCELLED: "order_cancelled",
  ORDER_NOT_CANCELLED: "order_not_cancelled",
  PAYOUT_RELEASED: "payout_already_released",
  NOTHING_REFUNDABLE: "nothing_left_to_refund",
  INVALID_AMOUNT: "invalid_amount",
  DUPLICATE: "duplicate_refund",
  GATEWAY_FAILED: "gateway_failed",
};

const cancelLog = (logTraceId, level, data) =>
  customLog(logTraceId, level, { scope: "ondcRefund", flow: "ondcCancelRefund", ...data }, "VENDOR");

const returnLog = (logTraceId, level, data) =>
  customLog(logTraceId, level, { scope: "ondcRefund", flow: "ondcReturnRefund", ...data }, "VENDOR");


/**
 * How long after an order is placed it counts as delayed when the seller declared no
 * delivery estimate. `expectedDeliveryDate` is derived from on_confirm's
 * `@ondc/org/TAT` and is null whenever the BPP omitted it — without a fallback those
 * orders could never be judged late, which is the one case a buyer most needs a refund.
 */
const DELAY_FALLBACK_HOURS = 24;

/**
 * Can this order be refunded right now, and how much is left?
 *
 * THE CONDITION IS DELAY: the promised delivery date has passed and the goods have not
 * arrived. Everything else below is a precondition for the operation to be possible at
 * all, not a business rule.
 *
 * Financially this is safe by construction. `payoutDueAt` is only set when delivery is
 * observed, and the sweep only releases a payout once `payoutDueAt` has passed — so an
 * undelivered order's money is still sitting in Peko's Cashfree balance. Refunding it
 * debits Peko and the seller who missed the date is simply never paid.
 *
 * Exported so the admin screens gate the button with exactly the same predicate the
 * write path enforces — the UI must never offer a refund the service would reject.
 *
 * @param {Object} row an ondcOrders row (raw)
 * @param {Date} [now]
 * @returns {{eligible: boolean, reason: string|null, refundableAmount: number, dueBy: Date|null}}
 */
const evaluateRefundEligibility = (row, now = new Date()) => {
  const amountPaid = parseFloat(row?.amountPaid || 0);
  const alreadyRefunded = parseFloat(row?.refundedAmount || 0);
  const refundableAmount = parseFloat(Math.max(0, amountPaid - alreadyRefunded).toFixed(2));

  // When the order was due: the seller's own estimate, else placed + fallback.
  const dueBy = row?.expectedDeliveryDate
    ? new Date(row.expectedDeliveryDate)
    : row?.createdAt
      ? new Date(new Date(row.createdAt).getTime() + DELAY_FALLBACK_HOURS * 3600000)
      : null;

  const out = (reason) => ({
    eligible: !reason,
    reason: reason || null,
    refundableAmount,
    dueBy: dueBy && !Number.isNaN(dueBy.getTime()) ? dueBy : null,
  });

  if (!row) return { eligible: false, reason: REASONS.NOT_FOUND, refundableAmount: 0, dueBy: null };
  if (!row.paymentRef) return out(REASONS.NO_PAYMENT_REF);
  if (row.orderState === "Cancelled") return out(REASONS.ORDER_CANCELLED);
  // Delivered means not delayed — the goods arrived, so this is a returns question.
  if (row.deliveredAt) return out(REASONS.ALREADY_DELIVERED);
  // Safety guard, not a business condition: if the payout somehow already went out
  // (e.g. Cashfree auto-released at its max-eligibility ceiling), a refund would come
  // out of Peko's own money with no way to recover it from the seller.
  if (row.payoutStatus === "RELEASED") return out(REASONS.PAYOUT_RELEASED);
  if (!dueBy || Number.isNaN(dueBy.getTime())) return out(REASONS.NOT_DELAYED);
  if (dueBy > now) return out(REASONS.NOT_DELAYED);
  if (!(refundableAmount > 0)) return out(REASONS.NOTHING_REFUNDABLE);
  return out(null);
};

/**
 * Divide one refund between the seller's Easy Split allocation and Peko's balance.
 *
 * The buyer paid `amountPaid` for this order, of which `splitAmount` was routed to the
 * seller and the rest is Peko's platform fee. A refund is divided in that same ratio,
 * so each party gives back the share it received.
 *
 * Two rules on top of the ratio:
 *
 * - A FULL refund settles EXACTLY: the vendor gives back their entire remaining
 *   allocation rather than a rounded proportion. Otherwise two partial refunds that
 *   together clear the order could leave a paisa of the seller's allocation stranded,
 *   or try to debit a paisa more than they were ever allocated.
 * - The vendor share is capped at what is left of their allocation. Cashfree cannot
 *   debit a vendor more than the split gave them, and anything above that is Peko's.
 *
 * @returns {{vendorShare: number, merchantShare: number}} summing exactly to `amount`
 */
const splitRefundAcrossVendor = ({
  amount,
  amountPaid,
  splitAmount,
  vendorAlreadyRefunded = 0,
  isFullRefund = false,
} = {}) => {
  const total = Number(amount) || 0;
  const paid = Number(amountPaid) || 0;
  const allocated = Number(splitAmount) || 0;
  const vendorRemaining = parseFloat(Math.max(0, allocated - (Number(vendorAlreadyRefunded) || 0)).toFixed(2));

  if (total <= 0 || vendorRemaining <= 0 || paid <= 0) {
    return { vendorShare: 0, merchantShare: parseFloat(Math.max(0, total).toFixed(2)) };
  }

  const proportional = parseFloat(((total * allocated) / paid).toFixed(2));
  // On a full refund the vendor gives back everything still allocated to them.
  const wanted = isFullRefund ? vendorRemaining : proportional;
  const vendorShare = parseFloat(Math.min(wanted, vendorRemaining, total).toFixed(2));

  return {
    vendorShare,
    merchantShare: parseFloat((total - vendorShare).toFixed(2)),
  };
};

/**
 * Shared Cashfree + ledger + optional payout block for one buyer refund.
 * Caller has already validated eligibility and remaining amount.
 */
const executeBuyerRefund = async ({
  row,
  refundAmount,
  remaining,
  reason,
  userId = null,
  logTraceId,
  logFn = log,
} = {}) => {
  const isFullRefund = refundAmount >= remaining;
  const hasVendor = row.splitStatus === "SPLIT" && Boolean(row.splitVendorId);
  const vendorAlreadyRefunded = hasVendor
    ? await sumOndcOrderVendorRefunds({ ondcOrderId: row.id })
    : 0;
  const { vendorShare, merchantShare } = hasVendor
    ? splitRefundAcrossVendor({
        amount: refundAmount,
        amountPaid: row.amountPaid,
        splitAmount: row.splitAmount,
        vendorAlreadyRefunded,
        isFullRefund,
      })
    : { vendorShare: 0, merchantShare: refundAmount };

  const refundSplits =
    vendorShare > 0
      ? [
          {
            vendor_id: row.splitVendorId,
            amount: vendorShare,
            tags: {
              transaction_id: String(row.transactionId || ""),
              provider_id: String(row.providerId || ""),
              ondc_order_id: String(row.orderId || ""),
            },
          },
        ]
      : [];

  const ledgerRefunded = await sumOndcOrderRefunds({ ondcOrderId: row.id });
  const refundId = `refund_ondc_${row.id}_${Math.round(ledgerRefunded * 100)}`;

  logFn(logTraceId, "info", {
    step: "refund-splits",
    message: hasVendor
      ? "Attributing cancel/refund to Easy Split vendor allocation"
      : "No Easy Split vendor allocation — refund from merchant balance only",
    ondcOrderId: row.id,
    paymentRef: row.paymentRef,
    refundAmount,
    vendorShare,
    merchantShare,
    splitStatus: row.splitStatus || null,
    splitVendorId: row.splitVendorId || null,
  });

  const claim = await recordOndcOrderRefund({
    ondcOrderId: row.id,
    transactionId: row.transactionId,
    paymentRef: row.paymentRef,
    refundId,
    amount: refundAmount,
    reason: reason || null,
    status: "PENDING",
    splitVendorId: vendorShare > 0 ? row.splitVendorId : null,
    vendorAmount: vendorShare,
    merchantAmount: merchantShare,
    initiatedByUserId: userId,
    logTraceId,
  });
  if (claim.duplicate) {
    logFn(logTraceId, "info", {
      step: "idempotency",
      message: "Refund already recorded for this order and prior total — not refunding again",
      ondcOrderId: row.id,
      refundId,
    });
    return {
      status: false,
      reason: REASONS.DUPLICATE,
      message: "This refund has already been processed",
      refundId,
      refundableAmount: remaining,
    };
  }

  logFn(logTraceId, "info", {
    step: "gateway",
    message: "Calling Cashfree refund for ONDC order",
    ondcOrderId: row.id,
    paymentRef: row.paymentRef,
    refundId,
    amount: refundAmount,
    hasRefundSplits: refundSplits.length > 0,
  });

  const result = await refundOndcOrderPayment({
    paymentRef: row.paymentRef,
    refundId,
    amount: refundAmount,
    reason: reason || `Refund for ONDC order ${row.orderId || row.id}`,
    refundSplits,
    logTraceId,
  });

  const appliedVendorAmount =
    result.status && result.splitsApplied === false ? 0 : vendorShare;
  const appliedMerchantAmount = parseFloat(
    (refundAmount - appliedVendorAmount).toFixed(2)
  );

  try {
    await claim.row.update({
      ...(result.status ? {} : { refundId: `${refundId}#f${claim.row.id}` }),
      status: result.status ? "OK" : "FAILED",
      splitVendorId: appliedVendorAmount > 0 ? row.splitVendorId : null,
      vendorAmount: appliedVendorAmount,
      merchantAmount: appliedMerchantAmount,
      gatewayRefundStatus: result.refundStatus || null,
      responseBody: result.responseBody || result.error || null,
      error: result.status ? null : result.message || "gateway_failed",
    });
  } catch (updErr) {
    logFn(logTraceId, "error", {
      step: "ledger",
      message: result.status
        ? "Refund SUCCEEDED but the ledger row could not be finalised — reconcile manually"
        : "Refund failed and the ledger row could not be finalised",
      refundId,
      gatewayStatus: result.status,
      error: updErr?.message || updErr,
    });
  }

  if (!result.status) {
    logFn(logTraceId, "error", {
      step: "failed",
      message: "Cashfree rejected the refund",
      ondcOrderId: row.id,
      refundId,
      amount: refundAmount,
      gatewayMessage: result.message || null,
    });
    const failedRefund = {
      status: false,
      reason: REASONS.GATEWAY_FAILED,
      message: result.message || "Refund failed at the payment gateway",
      refundId,
      refundableAmount: remaining,
    };
    await sendOndcOrderRefundEmail({ row, refund: failedRefund, refundAmount, logTraceId });
    return failedRefund;
  }

  await incrementOndcOrderRefundedAmount({ id: row.id, amount: refundAmount });

  if (row.paymentRef) {
    publishJournalEvent(
      {
        transactionRef: row.paymentRef,
        type: "adminRefund",
        contextSnapshot: { reason: reason || null },
        amounts: {
          refundAmount,
          totalOrderAmount: parseFloat(row.amountPaid || 0),
        },
      },
      logTraceId
    );
  }

  let blocked = false;
  if (isFullRefund) {
    blocked = Boolean(
      await claimOndcOrderPayout({ id: row.id, fromStatus: "HELD", toStatus: "BLOCKED" })
    );
    if (!blocked) {
      logFn(logTraceId, "error", {
        step: "payout-block",
        message:
          "Refund succeeded but the payout was no longer HELD — may need manual reconciliation",
        ondcOrderId: row.id,
        refundId,
      });
    }
  }

  logFn(logTraceId, "info", {
    step: "done",
    message: isFullRefund
      ? "Buyer fully refunded; seller payout blocked"
      : "Buyer partially refunded; seller remaining share stays scheduled",
    ondcOrderId: row.id,
    orderId: row.orderId,
    refundId,
    amount: refundAmount,
    vendorAmount: appliedVendorAmount,
    merchantAmount: appliedMerchantAmount,
    splitVendorId: appliedVendorAmount > 0 ? row.splitVendorId : null,
    splitsApplied: result.splitsApplied !== false,
    isFullRefund,
    remainingAfter: parseFloat((remaining - refundAmount).toFixed(2)),
    payoutBlocked: blocked,
    gatewayRefundStatus: result.refundStatus || null,
  });

  const successRefund = {
    status: true,
    amount: refundAmount,
    refundId,
    refundableAmount: parseFloat((remaining - refundAmount).toFixed(2)),
    vendorAmount: appliedVendorAmount,
    merchantAmount: appliedMerchantAmount,
    payoutBlocked: blocked,
    message: "Refund initiated",
  };
  await sendOndcOrderRefundEmail({ row, refund: successRefund, refundAmount, logTraceId });
  return successRefund;
};

/**
 * Refund `amount` of one ONDC order to the buyer.
 *
 * @returns {Promise<{status:boolean, reason?:string, message?:string, amount?:number, refundId?:string, refundableAmount?:number}>}
 */
const refundOndcOrder = async ({ ondcOrderId, amount, reason, userId = null, logTraceId } = {}) => {
  const row = await findOndcOrderByIdAdmin(ondcOrderId);
  const eligibility = evaluateRefundEligibility(row);
  if (!eligibility.eligible) {
    log(logTraceId, "info", {
      step: "eligibility",
      message: "Refund rejected — order is not eligible",
      ondcOrderId,
      reason: eligibility.reason,
      payoutStatus: row?.payoutStatus ?? null,
      deliveredAt: row?.deliveredAt ?? null,
      payoutDueAt: row?.payoutDueAt ?? null,
    });
    return { status: false, reason: eligibility.reason, refundableAmount: eligibility.refundableAmount };
  }

  const ledgerRefunded = await sumOndcOrderRefunds({ ondcOrderId: row.id });
  const remaining = parseFloat(Math.max(0, parseFloat(row.amountPaid || 0) - ledgerRefunded).toFixed(2));
  if (!(remaining > 0)) {
    return { status: false, reason: REASONS.NOTHING_REFUNDABLE, refundableAmount: 0 };
  }

  const requested = Number(amount);
  if (!Number.isFinite(requested) || requested <= 0) {
    return { status: false, reason: REASONS.INVALID_AMOUNT, refundableAmount: remaining };
  }
  const refundAmount = parseFloat(Math.min(requested, remaining).toFixed(2));

  return executeBuyerRefund({
    row,
    refundAmount,
    remaining,
    reason,
    userId,
    logTraceId,
    logFn: log,
  });
};

/**
 * Full remaining buyer refund after a successful ONDC cancel (corporate/admin).
 * Does not use delayed-undelivered eligibility — Cancelled is required.
 */
const refundOndcOrderAfterCancel = async ({
  ondcOrderId,
  userId = null,
  logTraceId,
  reason = "Order cancelled",
} = {}) => {
  cancelLog(logTraceId, "info", {
    step: "start",
    message: "Cancel-refund: starting full remaining refund",
    ondcOrderId,
  });

  const row = await findOndcOrderByIdAdmin(ondcOrderId);
  if (!row) {
    cancelLog(logTraceId, "error", {
      step: "failed",
      message: "Cancel-refund: order not found",
      ondcOrderId,
    });
    return { status: false, reason: REASONS.NOT_FOUND, refundableAmount: 0 };
  }
  if (row.orderState !== "Cancelled") {
    cancelLog(logTraceId, "error", {
      step: "failed",
      message: "Cancel-refund: order is not Cancelled",
      ondcOrderId,
      orderState: row.orderState,
    });
    return { status: false, reason: REASONS.ORDER_NOT_CANCELLED, refundableAmount: 0 };
  }
  if (!row.paymentRef) {
    return { status: false, reason: REASONS.NO_PAYMENT_REF, refundableAmount: 0 };
  }
  if (row.payoutStatus === "RELEASED") {
    cancelLog(logTraceId, "error", {
      step: "failed",
      message:
        "Cancel-refund: seller payout already RELEASED — cannot safely claw back; needs ops",
      ondcOrderId,
      paymentRef: row.paymentRef,
    });
    return { status: false, reason: REASONS.PAYOUT_RELEASED, refundableAmount: 0 };
  }

  const ledgerRefunded = await sumOndcOrderRefunds({ ondcOrderId: row.id });
  const remaining = parseFloat(
    Math.max(0, parseFloat(row.amountPaid || 0) - ledgerRefunded).toFixed(2)
  );
  if (!(remaining > 0)) {
    cancelLog(logTraceId, "info", {
      step: "done",
      message: "Cancel-refund: nothing left to refund (already refunded)",
      ondcOrderId,
    });
    return {
      status: true,
      amount: 0,
      alreadyRefunded: true,
      refundableAmount: 0,
      message: "Already fully refunded",
    };
  }

  return executeBuyerRefund({
    row,
    refundAmount: remaining,
    remaining,
    reason,
    userId,
    logTraceId,
    logFn: cancelLog,
  });
};

/**
 * Full remaining buyer refund after a successful DigiDukaan return
 * (Liquidated / Return_Picked / Return_Delivered).
 */
const refundOndcOrderAfterReturn = async ({
  ondcOrderId,
  userId = null,
  logTraceId,
  reason = "Order returned",
  refundAmount: requestedAmount = null,
} = {}) => {
  returnLog(logTraceId, "info", {
    step: "start",
    message: "Return-refund: starting refund",
    ondcOrderId,
    requestedAmount,
  });

  const row = await findOndcOrderByIdAdmin(ondcOrderId);
  if (!row) {
    returnLog(logTraceId, "error", {
      step: "failed",
      message: "Return-refund: order not found",
      ondcOrderId,
    });
    return { status: false, reason: REASONS.NOT_FOUND, refundableAmount: 0 };
  }
  if (row.returnRefundedAt) {
    return {
      status: true,
      amount: 0,
      alreadyRefunded: true,
      refundableAmount: 0,
      message: "Return already refunded",
    };
  }
  if (!row.paymentRef) {
    return { status: false, reason: REASONS.NO_PAYMENT_REF, refundableAmount: 0 };
  }
  if (row.payoutStatus === "RELEASED") {
    returnLog(logTraceId, "error", {
      step: "failed",
      message:
        "Return-refund: seller payout already RELEASED — cannot safely claw back; needs ops",
      ondcOrderId,
      paymentRef: row.paymentRef,
    });
    return { status: false, reason: REASONS.PAYOUT_RELEASED, refundableAmount: 0 };
  }

  const ledgerRefunded = await sumOndcOrderRefunds({ ondcOrderId: row.id });
  const remaining = parseFloat(
    Math.max(0, parseFloat(row.amountPaid || 0) - ledgerRefunded).toFixed(2)
  );
  if (!(remaining > 0)) {
    return {
      status: true,
      amount: 0,
      alreadyRefunded: true,
      refundableAmount: 0,
      message: "Already fully refunded",
    };
  }

  let refundAmount = remaining;
  if (requestedAmount != null && Number.isFinite(Number(requestedAmount))) {
    refundAmount = parseFloat(
      Math.min(remaining, Math.max(0, Number(requestedAmount))).toFixed(2)
    );
  }
  if (!(refundAmount > 0)) {
    return {
      status: true,
      amount: 0,
      alreadyRefunded: true,
      refundableAmount: remaining,
      message: "Nothing left to refund for this return",
    };
  }

  const result = await executeBuyerRefund({
    row,
    refundAmount,
    remaining,
    reason,
    userId,
    logTraceId,
    logFn: returnLog,
  });

  if (result?.status) {
    try {
      await ondcOrdersUpdateReturnRefunded(row.id);
    } catch (_) {
      // best-effort stamp; ledger already recorded
    }
  }
  return result;
};

/** Lazy require to avoid circular deps with use-cases at module load. */
const ondcOrdersUpdateReturnRefunded = async (id) => {
  const { updateOndcOrderReturnLifecycle } = require("../models/use-cases/ondc_order");
  await updateOndcOrderReturnLifecycle({
    id,
    returnRefundedAt: new Date(),
    markReturned: true,
    returnStatus: "Returned",
  });
};

module.exports = {
  REASONS,
  evaluateRefundEligibility,
  splitRefundAcrossVendor,
  refundOndcOrder,
  refundOndcOrderAfterCancel,
  refundOndcOrderAfterReturn,
  executeBuyerRefund,
};
