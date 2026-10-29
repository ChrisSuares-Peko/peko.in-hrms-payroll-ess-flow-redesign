/**
 * ONDC retail cancellation reason codes → buyer-safe text.
 *
 * Same shape as utils/ondcReturnReasons.js. Used by the two cancellation emails,
 * which must show a REASON rather than a bare code: "Reason: 006" tells the buyer
 * nothing, and the raw ONDC descriptions ("Order / fulfilment not received as per
 * buyer's request") are written for network operators, not customers.
 *
 * Codes below 010 are buyer-initiated, 011+ are seller/LSP-initiated, per the ONDC
 * RET cancellation reason list. Anything unknown degrades to a generic line rather
 * than leaking the code.
 */

const CANCELLATION_REASONS = [
  { id: "001", label: "Price of one or more items changed", by: "buyer" },
  { id: "002", label: "One or more items in the order are not available", by: "buyer" },
  { id: "003", label: "Product available at a lower price elsewhere", by: "buyer" },
  { id: "004", label: "Order not required any more", by: "buyer" },
  { id: "005", label: "Order delivery was delayed", by: "buyer" },
  { id: "006", label: "Order not shipped as per the promised timeline", by: "buyer" },
  { id: "007", label: "Wrong delivery address selected", by: "buyer" },
  { id: "008", label: "Order placed by mistake", by: "buyer" },
  { id: "009", label: "Buyer not available to accept the delivery", by: "buyer" },
  { id: "010", label: "Delivery could not be completed after repeated attempts", by: "seller" },
  { id: "011", label: "One or more items are out of stock with the seller", by: "seller" },
  { id: "012", label: "The seller does not deliver to this location", by: "seller" },
  { id: "013", label: "The seller could not fulfil this order", by: "seller" },
  { id: "014", label: "Merchant rejected the order", by: "seller" },
  { id: "015", label: "The delivery partner could not pick the order up", by: "seller" },
];

const CANCELLATION_REASON_BY_ID = Object.fromEntries(CANCELLATION_REASONS.map((r) => [r.id, r]));

const GENERIC_BY_SELLER = "The seller cancelled this order";
const GENERIC_BY_BUYER = "Cancelled at your request";

/**
 * @param {string|number} reasonId ONDC cancellation reason code
 * @param {string} [reasonDesc] free text the seller sent, which wins when present
 * @param {"buyer"|"seller"} [initiatedBy] used only for the fallback wording
 * @returns {string} buyer-facing reason text (never a bare code)
 */
const resolveCancellationReason = (reasonId, reasonDesc, initiatedBy = "seller") => {
  const explicit = reasonDesc == null ? "" : String(reasonDesc).trim();
  if (explicit && !/^\d{1,3}$/.test(explicit)) return explicit;
  const known = CANCELLATION_REASON_BY_ID[String(reasonId || "").trim()];
  if (known) return known.label;
  return initiatedBy === "buyer" ? GENERIC_BY_BUYER : GENERIC_BY_SELLER;
};

/**
 * Who cancelled, from `message.order.cancellation.cancelled_by` compared against
 * our own BAP id. Anything that isn't us is the seller side — including the LSP,
 * which the buyer experiences as the seller cancelling.
 *
 * @param {Object} order the ONDC order from an on_cancel / on_status callback
 * @param {string} bapId our subscriber id (getOndcConfig().bapId)
 * @returns {"buyer"|"seller"} defaults to "seller" when the field is absent: a
 *   cancellation we did not initiate is, from the buyer's seat, someone else's.
 */
const resolveCancelledBy = (order, bapId) => {
  const cancelledBy = String(order?.cancellation?.cancelled_by || "").trim().toLowerCase();
  const ours = String(bapId || "").trim().toLowerCase();
  if (!cancelledBy) return "seller";
  return ours && cancelledBy === ours ? "buyer" : "seller";
};

/** The reason code an on_cancel / on_status callback carried, if any. */
const extractCancellationReasonId = (order) =>
  order?.cancellation?.reason?.id != null ? String(order.cancellation.reason.id) : null;

module.exports = {
  CANCELLATION_REASONS,
  CANCELLATION_REASON_BY_ID,
  resolveCancellationReason,
  resolveCancelledBy,
  extractCancellationReasonId,
};
