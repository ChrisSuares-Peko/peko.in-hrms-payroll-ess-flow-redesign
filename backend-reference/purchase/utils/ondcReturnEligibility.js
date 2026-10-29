/**
 * Corporate/admin ONDC return eligibility — delivered orders within return window.
 */

const {
  resolveOrderReturnWindow,
  parseIsoDurationMs,
  isOrderDelivered,
} = require("./ondc_helper");

const TERMINAL_NON_RETURNABLE_STATES = ["Cancelled", "Returned"];

/** Return fulfillment states that mean a return is already in progress. */
const RETURN_IN_FLIGHT_CODES = new Set([
  "Return_Requested",
  "Return_Initiated",
  "Return_Approved",
  "Return_Picked",
  "Return_Pick_Failed",
  "Return_Delivered",
  "Liquidated",
]);

/** Terminal failure states — buyer may retry a new return. */
const RETURN_FAILED_CODES = new Set(["Return_Rejected", "Return_Failed"]);

/** States that trigger buyer refund (fire once). */
const RETURN_REFUND_TRIGGER_CODES = new Set([
  "Liquidated",
  "Return_Picked",
  "Return_Delivered",
]);

const getReturnFulfillments = (fulfillments) => {
  if (!Array.isArray(fulfillments)) return [];
  return fulfillments.filter((f) => f && f.type === "Return");
};

const getReturnStateCode = (fulfillment) =>
  fulfillment?.state?.descriptor?.code || fulfillment?.state?.descriptor?.name || null;

/**
 * True when the parcel has been delivered to the buyer.
 */
const isDeliveredForReturn = (row = {}) => {
  if (row.deliveredAt) return true;
  if (String(row.orderState || "") === "Completed") return true;
  return isOrderDelivered(row);
};

const getActiveReturnStatus = (row = {}) => {
  if (row.returnStatus && RETURN_IN_FLIGHT_CODES.has(String(row.returnStatus))) {
    return String(row.returnStatus);
  }
  if (row.returnStatus && !RETURN_FAILED_CODES.has(String(row.returnStatus))) {
    return String(row.returnStatus);
  }
  const returns = getReturnFulfillments(row.fulfillments);
  for (const f of returns) {
    const code = getReturnStateCode(f);
    if (code && RETURN_IN_FLIGHT_CODES.has(code)) return code;
  }
  return null;
};

/**
 * @param {Object} row ondc_orders row
 * @param {Object} [opts]
 * @param {Array<{itemId:string,quantity:number}>} [opts.items] requested return lines
 * @param {Object} [opts.settings] Easy Split / return-window settings
 * @param {Date} [opts.now]
 * @returns {{ ok: true } | { ok: false, statusCode: number, message: string, reason: string }}
 */
const assertOndcOrderReturnable = (row, opts = {}) => {
  const { items = null, settings = {}, now = new Date() } = opts;

  if (!row) {
    return {
      ok: false,
      statusCode: 404,
      reason: "not_found",
      message: "Order not found",
    };
  }
  if (TERMINAL_NON_RETURNABLE_STATES.includes(row.orderState)) {
    return {
      ok: false,
      statusCode: 400,
      reason: "terminal_state",
      message: `This order can't be returned — it's already ${(row.orderState || "").toLowerCase()}`,
    };
  }
  if (!row.bppUri || !row.orderId) {
    return {
      ok: false,
      statusCode: 400,
      reason: "missing_seller_ref",
      message: "This order can't be returned yet — missing seller order reference",
    };
  }
  if (!isDeliveredForReturn(row)) {
    return {
      ok: false,
      statusCode: 400,
      reason: "not_delivered",
      message: "This order can only be returned after it has been delivered",
    };
  }

  const inFlight = getActiveReturnStatus(row);
  if (inFlight) {
    return {
      ok: false,
      statusCode: 400,
      reason: "return_in_progress",
      message: "A return is already in progress for this order",
    };
  }

  const quoteItems = (row.quote?.rows || []).filter((r) => r.titleType === "item");
  if (quoteItems.length && quoteItems.every((i) => i.returnable === false)) {
    return {
      ok: false,
      statusCode: 400,
      reason: "seller_policy",
      message: "This order can't be returned per the seller's policy",
    };
  }

  if (Array.isArray(items) && items.length) {
    for (const req of items) {
      const line = quoteItems.find((r) => String(r.itemId) === String(req.itemId));
      if (!line) {
        return {
          ok: false,
          statusCode: 400,
          reason: "unknown_item",
          message: "One or more items are not part of this order",
        };
      }
      if (line.returnable === false) {
        return {
          ok: false,
          statusCode: 400,
          reason: "seller_policy",
          message: `"${line.productName || line.title || "Item"}" can't be returned per the seller's policy`,
        };
      }
      const qty = Number(req.quantity);
      const maxQty = Number(line.quantity) || 0;
      if (!Number.isFinite(qty) || qty < 1 || (maxQty > 0 && qty > maxQty)) {
        return {
          ok: false,
          statusCode: 400,
          reason: "invalid_quantity",
          message: "Return quantity is invalid for one or more items",
        };
      }
    }
  }

  const windowInfo = resolveOrderReturnWindow(row, {
    defaultReturnWindow: settings.defaultReturnWindow || "P2D",
  });
  if (!windowInfo.returnable) {
    return {
      ok: false,
      statusCode: 400,
      reason: "seller_policy",
      message: "This order can't be returned per the seller's policy",
    };
  }

  const deliveredAt = row.deliveredAt
    ? new Date(row.deliveredAt)
    : null;
  if (deliveredAt && !Number.isNaN(deliveredAt.getTime()) && windowInfo.ms > 0) {
    const expiresAt = new Date(deliveredAt.getTime() + windowInfo.ms);
    if (now.getTime() > expiresAt.getTime()) {
      return {
        ok: false,
        statusCode: 400,
        reason: "return_window_expired",
        message: "The return window for this order has expired",
      };
    }
  }

  return { ok: true };
};

module.exports = {
  TERMINAL_NON_RETURNABLE_STATES,
  RETURN_IN_FLIGHT_CODES,
  RETURN_FAILED_CODES,
  RETURN_REFUND_TRIGGER_CODES,
  getReturnFulfillments,
  getReturnStateCode,
  isDeliveredForReturn,
  getActiveReturnStatus,
  assertOndcOrderReturnable,
  parseIsoDurationMs,
};
