/**
 * Corporate/admin ONDC cancel eligibility — only before the shipment leaves the
 * seller (pre-pickup). Mirrors FE fulfillmentStatus shipped codes.
 */

const TERMINAL_ORDER_STATES = ["Completed", "Cancelled"];

/** Delivery fulfillment codes that mean the parcel has shipped (or been delivered). */
const SHIPPED_OR_BEYOND_CODES = new Set([
  "Order-picked-up",
  "In-transit",
  "At-destination-hub",
  "Out-for-delivery",
  "Delivery-failed",
  "Order-delivered",
]);

const getDeliveryFulfillment = (fulfillments) => {
  if (!Array.isArray(fulfillments)) return null;
  return fulfillments.find((f) => f && f.type === "Delivery") || null;
};

const getDeliveryStateCode = (fulfillments) => {
  const delivery = getDeliveryFulfillment(fulfillments);
  return delivery?.state?.descriptor?.code || delivery?.state?.descriptor?.name || null;
};

/**
 * True once the Delivery fulfillment has been picked up (or further), or the
 * order already has deliveredAt / Completed.
 */
const isShippedOrBeyond = (row = {}) => {
  if (row.deliveredAt) return true;
  if (String(row.orderState || "") === "Completed") return true;
  const code = getDeliveryStateCode(row.fulfillments);
  if (!code) return false;
  return SHIPPED_OR_BEYOND_CODES.has(String(code));
};

/**
 * The reasons a force cancellation is allowed to override.
 *
 * ONDC's `descriptor.tags[params].force = yes` exists precisely to cancel past a
 * seller's refusal or after the parcel has left them (triggering RTO), so those
 * two are overridable. The rest are structural — a cancelled order cannot be
 * cancelled again, and without a seller order reference there is nothing to send.
 */
const FORCE_OVERRIDABLE_REASONS = new Set(["already_shipped", "seller_policy"]);

/**
 * @param {object} row the ondcOrders row
 * @param {{ force?: boolean }} [options] force skips the overridable checks above
 * @returns {{ ok: true } | { ok: false, statusCode: number, message: string, reason: string }}
 */
const assertOndcOrderCancellable = (row, { force = false } = {}) => {
  const verdict = evaluateCancellable(row);
  if (verdict.ok) return verdict;
  if (force && FORCE_OVERRIDABLE_REASONS.has(verdict.reason)) return { ok: true };
  return verdict;
};

/** The unconditional checks. Kept separate so the force filter reads in one place. */
const evaluateCancellable = (row) => {
  if (!row) {
    return {
      ok: false,
      statusCode: 404,
      reason: "not_found",
      message: "Order not found",
    };
  }
  if (TERMINAL_ORDER_STATES.includes(row.orderState)) {
    return {
      ok: false,
      statusCode: 400,
      reason: "terminal_state",
      message: `This order can't be cancelled — it's already ${(row.orderState || "").toLowerCase()}`,
    };
  }
  if (!row.bppUri || !row.orderId) {
    return {
      ok: false,
      statusCode: 400,
      reason: "missing_seller_ref",
      message: "This order can't be cancelled yet — missing seller order reference",
    };
  }
  const items = (row.quote?.rows || []).filter((r) => r.titleType === "item");
  if (items.length && items.some((i) => i.cancellable === false)) {
    return {
      ok: false,
      statusCode: 400,
      reason: "seller_policy",
      message: "This order can't be cancelled per the seller's policy",
    };
  }
  if (isShippedOrBeyond(row)) {
    return {
      ok: false,
      statusCode: 400,
      reason: "already_shipped",
      message: "This order can't be cancelled after it has shipped",
    };
  }
  return { ok: true };
};

/**
 * Whether a normal cancel is blocked only by something force could override —
 * i.e. whether it is worth offering the operator the force path at all.
 */
const isForceCancellable = (row) => {
  const verdict = evaluateCancellable(row);
  return !verdict.ok && FORCE_OVERRIDABLE_REASONS.has(verdict.reason);
};

module.exports = {
  TERMINAL_ORDER_STATES,
  SHIPPED_OR_BEYOND_CODES,
  FORCE_OVERRIDABLE_REASONS,
  getDeliveryFulfillment,
  getDeliveryStateCode,
  isShippedOrBeyond,
  assertOndcOrderCancellable,
  isForceCancellable,
};
