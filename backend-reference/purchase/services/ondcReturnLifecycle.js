/**
 * DigiDukaan return lifecycle — persist on_update Return fulfillment states and
 * fire idempotent Cashfree refund + BNP settlement trail at refund triggers.
 */

const { customLog } = require("../utils/loggerHelper");
const {
  RETURN_REFUND_TRIGGER_CODES,
  RETURN_FAILED_CODES,
  getReturnFulfillments,
  getReturnStateCode,
} = require("../utils/ondcReturnEligibility");
const { parseOndcAmount } = require("../utils/ondc_helper");
const {
  findOndcOrderByTransactionId,
  updateOndcOrderReturnLifecycle,
} = require("../models/use-cases/ondc_order");
const { refundOndcOrderAfterReturn } = require("./ondcOrderRefund");
const { updateSettlementTrail } = require("./ondc");

const log = (logTraceId, level, data) =>
  customLog(logTraceId, level, { scope: "ondcReturnLifecycle", ...data }, "VENDOR");

const SUCCESS_TERMINAL = new Set(["Liquidated", "Return_Delivered", "Return_Picked"]);

/**
 * Sum refundable amount from Return fulfillment quote_trail tags when present.
 * Falls back to null so the refund helper uses full remaining.
 */
const extractQuoteTrailRefundAmount = (returnFulfillment) => {
  const tags = Array.isArray(returnFulfillment?.tags) ? returnFulfillment.tags : [];
  const trail = tags.find((t) => t?.code === "quote_trail");
  if (!trail || !Array.isArray(trail.list)) return null;
  let sum = 0;
  let found = false;
  for (const entry of trail.list) {
    if (entry?.code === "value" || entry?.code === "amount") {
      // NaN fallback (not 0) so an unparseable trail stays distinguishable from a
      // genuine ₹0 — `found` must stay false so the caller refunds full remaining.
      const n = parseOndcAmount(entry.value, NaN);
      if (Number.isFinite(n)) {
        sum += Math.abs(n);
        found = true;
      }
    }
  }
  return found ? parseFloat(sum.toFixed(2)) : null;
};

/**
 * True when a Return fulfillment's return_request tags carry replace=yes.
 */
const fulfillmentHasReplaceYes = (fulfillment) => {
  const tags = Array.isArray(fulfillment?.tags) ? fulfillment.tags : [];
  for (const tag of tags) {
    const list = Array.isArray(tag?.list) ? tag.list : [];
    for (const entry of list) {
      if (entry?.code === "replace" && (entry.value === "yes" || entry.value === true)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Replacement_Flow: buyer asked for a swap, or the inbound Return fulfillment
 * itself carries replace=yes. Either way there is no refund and no settlement.
 */
const isReplaceFlow = (row, fulfillment) => {
  const meta = row?.returnMeta && typeof row.returnMeta === "object" ? row.returnMeta : {};
  if (meta.replace === true || meta.replace === "yes") return true;
  return fulfillmentHasReplaceYes(fulfillment);
};

/**
 * Pick the most advanced Return fulfillment from an on_update order.
 */
const pickPrimaryReturnFulfillment = (order, preferredRequestId = null) => {
  const returns = getReturnFulfillments(order?.fulfillments);
  if (!returns.length) return null;
  if (preferredRequestId) {
    const match = returns.find((f) => String(f.id) === String(preferredRequestId));
    if (match) return match;
  }
  // Prefer a refund-trigger or failed state over Return_Initiated
  const ranked = [...returns].sort((a, b) => {
    const ac = getReturnStateCode(a) || "";
    const bc = getReturnStateCode(b) || "";
    const aScore = RETURN_REFUND_TRIGGER_CODES.has(ac) ? 3 : RETURN_FAILED_CODES.has(ac) ? 2 : 1;
    const bScore = RETURN_REFUND_TRIGGER_CODES.has(bc) ? 3 : RETURN_FAILED_CODES.has(bc) ? 2 : 1;
    return bScore - aScore;
  });
  return ranked[0] || null;
};

/**
 * Apply an on_update (or first waiter) order snapshot to our ondc_orders row.
 *
 * @returns {Promise<{row, returnStatus, refund}|null>}
 */
const applyOndcReturnOnUpdate = async ({
  transactionId,
  order,
  logTraceId = null,
  userId = null,
} = {}) => {
  if (!transactionId || !order) return null;

  const row = await findOndcOrderByTransactionId(transactionId);
  if (!row) {
    log(logTraceId, "warn", {
      step: "no-order",
      message: "on_update return: no ondc_orders row for transaction",
      transactionId,
    });
    return null;
  }

  const primary = pickPrimaryReturnFulfillment(order, row.returnRequestId);
  const hasReturnLeg = Boolean(primary) || Boolean(row.returnRequestId);
  if (!hasReturnLeg) {
    log(logTraceId, "info", {
      step: "no-return-leg",
      message: "on_update has no Return fulfillment and no in-flight return; skip return columns",
      transactionId,
    });
    return { row, returnStatus: row.returnStatus || null, refund: null };
  }

  const returnStatus = getReturnStateCode(primary) || row.returnStatus || null;
  const returnRequestId = primary?.id || row.returnRequestId || null;

  const prevMeta = row.returnMeta && typeof row.returnMeta === "object" ? row.returnMeta : {};
  const replace = isReplaceFlow(row, primary);
  const nextMeta = {
    ...prevMeta,
    lastReturnState: returnStatus,
    lastOnUpdateAt: new Date().toISOString(),
    ...(replace ? { replace: true } : {}),
  };

  const markReturned =
    SUCCESS_TERMINAL.has(returnStatus) &&
    (returnStatus === "Liquidated" || Boolean(row.returnRefundedAt));

  await updateOndcOrderReturnLifecycle({
    id: row.id,
    returnStatus,
    returnRequestId,
    fulfillments: order.fulfillments || row.fulfillments,
    returnMeta: nextMeta,
    markReturned: markReturned && returnStatus === "Liquidated" && !replace,
  });

  let refund = null;
  const shouldRefund =
    !replace &&
    RETURN_REFUND_TRIGGER_CODES.has(returnStatus) &&
    !row.returnRefundedAt;

  if (shouldRefund) {
    const trailAmount = extractQuoteTrailRefundAmount(primary);
    try {
      refund = await refundOndcOrderAfterReturn({
        ondcOrderId: row.id,
        userId,
        logTraceId,
        reason: `Return ${returnStatus}`,
        refundAmount: trailAmount,
      });
    } catch (err) {
      log(logTraceId, "error", {
        step: "refund-threw",
        message: err?.message || String(err),
        ondcOrderId: row.id,
        returnStatus,
      });
      refund = { status: false, reason: "refund_threw", message: err?.message || String(err) };
    }

    if (refund?.status && !refund.alreadyRefunded) {
      try {
        await updateSettlementTrail({
          bppId: row.bppId,
          bppUri: row.bppUri,
          orderId: row.orderId,
          transactionId: row.transactionId,
          settlementAmount: refund.amount ?? trailAmount ?? 0,
          fulfillmentId: returnRequestId,
        });
        await updateOndcOrderReturnLifecycle({
          id: row.id,
          returnMeta: {
            ...nextMeta,
            settlementSent: true,
            settlementSentAt: new Date().toISOString(),
            refundAmount: refund.amount,
          },
          markReturned: true,
          returnStatus: "Returned",
        });
      } catch (settlementErr) {
        log(logTraceId, "error", {
          step: "settlement-trail-failed",
          message: settlementErr?.message || String(settlementErr),
          ondcOrderId: row.id,
        });
      }
    } else if (refund?.alreadyRefunded || refund?.status) {
      await updateOndcOrderReturnLifecycle({
        id: row.id,
        markReturned: true,
        returnStatus: "Returned",
      });
    }
  } else if (RETURN_FAILED_CODES.has(returnStatus)) {
    await updateOndcOrderReturnLifecycle({
      id: row.id,
      returnStatus,
      returnMeta: { ...nextMeta, failed: true },
    });
  }

  const fresh = await findOndcOrderByTransactionId(transactionId);
  return { row: fresh || row, returnStatus, refund };
};

module.exports = {
  applyOndcReturnOnUpdate,
  pickPrimaryReturnFulfillment,
  extractQuoteTrailRefundAmount,
  isReplaceFlow,
};
