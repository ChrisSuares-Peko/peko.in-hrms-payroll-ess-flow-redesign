/**
 * The payment's status after a Cashfree refund event (handlePGWebhook).
 *
 * Every refund event used to mark the whole payment REFUNDED. That is right for a
 * full refund, but an ONDC Office Supplies checkout refunds only the sellers that
 * could not be placed — `refund_<paymentRef>_partial`, minted by purchase's
 * cancelPGTransaction — while the orders that were placed stand. For those the
 * payment becomes REFUNDED only once the refunds that have settled cover the whole
 * capture; until then it keeps the status it had. Every other refund id behaves as
 * it always did.
 */

const PARTIAL_REFUND_ID = /^refund_.+_partial$/;

const isPartialRefundId = (refundId) => PARTIAL_REFUND_ID.test(String(refundId || ""));

/**
 * @param {Object} params
 * @param {string} params.refundId             the event's refund_id
 * @param {Array}  params.refundResults        every refund recorded on the payment, this one included
 * @param {number|string} params.capturedAmount what Cashfree captured (payment_amount)
 * @param {string} [params.currentStatus]      the payment's status before this event
 * @returns {string|undefined} the status to write; undefined means leave it unchanged
 */
const resolveRefundOrderStatus = ({ refundId, refundResults = [], capturedAmount, currentStatus } = {}) => {
  if (!isPartialRefundId(refundId)) return "REFUNDED";

  const captured = Number(capturedAmount) || 0;
  const settled = (Array.isArray(refundResults) ? refundResults : [])
    .filter((r) => r?.refund_status === "SUCCESS")
    .reduce((sum, r) => sum + (Number(r?.refund_amount) || 0), 0);
  if (captured > 0 && settled + 0.005 >= captured) return "REFUNDED";
  return currentStatus || undefined;
};

module.exports = { isPartialRefundId, resolveRefundOrderStatus };
