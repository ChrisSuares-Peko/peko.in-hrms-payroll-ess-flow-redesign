/**
 * The return-window hold on a seller's Easy Split share. Three transitions:
 *
 *   PARK    (split written)     push eligibility as far out as the account allows
 *   NARROW  (delivery observed) tighten it to deliveredAt + return window + buffer
 *   RELEASE (window closed)     move it to now — scheduler/services/ondcSellerPayout.js
 *
 * Nothing here throws: settlement timing must never fail an order confirmation or
 * abort a sweep. Failures are logged, laddered into the ondcSellerPayouts ledger,
 * and left on the order row for retry.
 */

const { customLog } = require("../utils/loggerHelper");
const { findOneOrder } = require("../models/use-cases/order");
const {
  markOndcOrderDelivered,
  updateOndcOrderPayout,
  findOndcOrderByTransactionId,
} = require("../models/use-cases/ondc_order");
const { getEasySplitSettings } = require("../utils/easySplit");
const { setSettlementEligibility } = require("../utils/easySplitSettlement");
const {
  parseIsoDurationMs,
  isOrderDelivered,
  resolveDeliveredAt,
  resolveOrderReturnWindow,
  computePayoutDueAt,
} = require("../utils/ondc_helper");

const log = (logTraceId, level, data) =>
  customLog(logTraceId, level, { scope: "easySplit", flow: "payoutHold", ...data }, "VENDOR");

const DAY_MS = 86400000;

/**
 * The Cashfree order id a split was written against — `order_id` inside the payment
 * order's paymentModeResponse JSON.
 *
 * The confirm path passes OUR checkout paymentRef; the delivery and sweep paths only
 * have `ondcOrders.paymentRef`, which is whatever the BPP echoed in
 * payment.params.transaction_id. We send our own Cashfree ref there and BPPs echo the
 * payment block verbatim, so they normally agree — but a BPP substituting its own id
 * makes this miss, hence the specific failure log.
 */
const resolveGatewayOrderId = async (paymentRef, logTraceId) => {
  if (!paymentRef) return null;
  let paymentOrder = null;
  try {
    paymentOrder = await findOneOrder({ corporateTxnId: String(paymentRef) });
  } catch (err) {
    log(logTraceId, "error", {
      step: "gateway-order-id",
      message: "Payment order lookup threw while resolving the Cashfree order id",
      paymentRef,
      error: err?.message || String(err),
    });
    return null;
  }

  let gatewayOrderId = null;
  let parseError = null;
  try {
    gatewayOrderId = paymentOrder?.paymentModeResponse
      ? JSON.parse(paymentOrder.paymentModeResponse)?.order_id || null
      : null;
  } catch (err) {
    parseError = err?.message || String(err);
  }

  if (!gatewayOrderId) {
    log(logTraceId, "error", {
      step: "gateway-order-id",
      message: paymentOrder
        ? "Payment order carries no Cashfree order_id — settlement timing cannot be addressed"
        : `No payment order has corporateTxnId "${paymentRef}". From the delivery/sweep path this ` +
          "usually means the BPP echoed its own id in payment.params.transaction_id, so " +
          "ondcOrders.paymentRef is not our Cashfree ref — the payout stays held and needs manual release.",
      paymentRef,
      foundPaymentOrder: Boolean(paymentOrder),
      parseError,
    });
  }
  return gatewayOrderId;
};

/** Return window + derived due date for an order row, per current settings. */
const resolvePayoutSchedule = (order, settings, deliveredAt) => {
  const { returnWindow, ms, returnable } = resolveOrderReturnWindow(order, settings);
  const bufferMs = parseIsoDurationMs(settings.returnWindowBuffer) || 0;
  // Nothing returnable still gets the buffer, not an instant release — that is also
  // the window in which a buyer raises a damaged-on-arrival issue.
  return { returnWindow, returnWindowMs: ms, returnable, payoutDueAt: computePayoutDueAt(deliveredAt, ms, bufferMs) };
};

/**
 * PARK — hold a freshly-written split as far out as the account permits.
 *
 * Load-bearing: once the split exists Cashfree settles on the vendor's cycle
 * (merchant default when schedule_option was omitted at create — T+21 on our PG).
 * That can still land before the goods have shipped. Parking buys the time NARROW
 * and RELEASE then spend precisely.
 */
const parkPayoutHold = async ({
  paymentRef, transactionId, gatewayOrderId, vendorId,
  amount = null, ondcOrderId = null, settings, config, logTraceId,
} = {}) => {
  const tunables = settings || (await getEasySplitSettings(logTraceId));
  if (tunables.payoutHoldEnabled === false) return { status: false, reason: "hold_disabled" };

  const days = Number(tunables.deferMaxDays) || 0;
  if (!(days > 0)) {
    // 0 or negative would set eligibility to now-or-earlier — i.e. pay immediately.
    log(logTraceId, "error", {
      step: "park",
      message: "deferMaxDays is not a positive number — cannot park the settlement date",
      deferMaxDays: tunables.deferMaxDays,
      transactionId,
    });
    return { status: false, reason: "invalid_defer_max_days" };
  }

  const date = new Date(Date.now() + days * DAY_MS);
  const result = await setSettlementEligibility({
    gatewayOrderId, vendorId, date, action: "PARK",
    ondcOrderId, transactionId, paymentRef, amount,
    settings: tunables, config, logTraceId,
  });

  log(logTraceId, result.status ? "info" : "error", {
    step: "park",
    message: result.status
      ? "Seller payout parked — settlement deferred until the return window is known"
      : "Could not park the seller payout — Cashfree may settle on its default cycle",
    transactionId, gatewayOrderId, vendorId,
    deferMaxDays: days, parkedUntil: date.toISOString(), reason: result.reason || null,
  });
  return result;
};

/**
 * NARROW — the order was reported delivered; stamp delivery and move eligibility to
 * the real due date.
 *
 * Safe to call on every on_status: markOndcOrderDelivered's write-once guard makes a
 * repeated or unsolicited "Order-delivered" a no-op, so the return clock can never
 * restart (which would keep pushing the seller's money away).
 *
 * @param {Object} params.order the `message.order` from the on_status callback
 * @returns {Promise<{handled:boolean, reason?:string, payoutDueAt?:Date, eligibilitySet?:boolean}>}
 */
const recordDeliveryAndHoldPayout = async ({ transactionId, order, logTraceId } = {}) => {
  if (!transactionId || !order) return { handled: false, reason: "missing_input" };
  // Keyed on the DELIVERY FULFILLMENT, not orderState "Completed" — RTO terminal
  // states also map to Completed and are the opposite of a delivery.
  if (!isOrderDelivered(order)) return { handled: false, reason: "not_delivered" };

  const row = await findOndcOrderByTransactionId(transactionId);
  if (!row) return { handled: false, reason: "order_not_found" };
  if (row.deliveredAt) return { handled: false, reason: "already_recorded" };

  const settings = await getEasySplitSettings(logTraceId);
  const deliveredAt = resolveDeliveredAt(order);
  const { returnWindow, returnWindowMs, returnable, payoutDueAt } = resolvePayoutSchedule(row, settings, deliveredAt);

  // Only a written split has money to hold; SKIPPED/FAILED means no vendor share exists.
  const hasSplit = row.splitStatus === "SPLIT" && Boolean(row.splitVendorId);
  const payoutStatus = hasSplit && settings.payoutHoldEnabled !== false ? "HELD" : "NOT_APPLICABLE";

  const [affected] = await markOndcOrderDelivered({
    transactionId, deliveredAt, returnWindow, payoutDueAt, payoutStatus,
  });
  // A concurrent delivery of the same callback won the write-once race.
  if (!affected) return { handled: false, reason: "already_recorded" };

  log(logTraceId, "info", {
    step: "delivered",
    message: "Order delivered — seller payout held until the return window closes",
    transactionId, orderId: row.orderId,
    deliveredAt: deliveredAt.toISOString(),
    returnWindow, returnWindowMs, returnable,
    payoutDueAt: payoutDueAt ? payoutDueAt.toISOString() : null,
    payoutStatus, splitStatus: row.splitStatus,
  });

  if (payoutStatus !== "HELD" || !payoutDueAt) return { handled: true, payoutDueAt: payoutDueAt || null };

  const gatewayOrderId = await resolveGatewayOrderId(row.paymentRef, logTraceId);
  const result = await setSettlementEligibility({
    gatewayOrderId, vendorId: row.splitVendorId, date: payoutDueAt, action: "NARROW",
    ondcOrderId: row.id, transactionId, paymentRef: row.paymentRef,
    amount: row.splitAmount, settings, logTraceId,
  });

  // A failed NARROW is not fatal — the PARK date still holds the money and the sweep
  // will move it on RELEASE instead. Record why, so it isn't just "held for longer".
  await updateOndcOrderPayout({
    id: row.id,
    payoutEligibilityDate: result.status ? payoutDueAt : undefined,
    payoutError: result.status ? null : `narrow_failed: ${result.reason || "unknown"}`,
  });

  return { handled: true, payoutDueAt, eligibilitySet: result.status };
};

module.exports = {
  resolveGatewayOrderId,
  resolvePayoutSchedule,
  parkPayoutHold,
  recordDeliveryAndHoldPayout,
};
