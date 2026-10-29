/**
 * Advance the ONDC seller-payout state machine one tick: release payouts whose
 * return window has closed, retry ones Cashfree rejected.
 *
 * "The return window has closed" is not an event anyone sends, so it needs a
 * clock. This job is that clock. PARK and NARROW stay event-driven in purchase
 * (ondcPayoutHold.js); only RELEASE runs here.
 *
 * Delivery polling is a separate job (ondcDeliveryStatus.js). Do not /status
 * from this pass — two hourly crons asking the same BPPs about the same orders
 * is noise for the seller.
 *
 * Runs against the shared DB and Cashfree directly (same pattern as
 * ondcTatBreach / ondcDeliveryStatus). Purchase used to expose this as
 * POST /api/v1/ondc/payouts/sweep; that route is gone so money movement for
 * RELEASE has one home here.
 *
 * Safe to overlap with itself: rows are claimed with a compare-and-set before
 * any money moves, so a slow pass and the next cron tick cannot both release
 * one order.
 */

const { Op, literal, QueryTypes } = require("sequelize");
const { customLog } = require("../utils/loggerHelper");
const { getEasySplitSettings } = require("../utils/easySplit");
const { setSettlementEligibility } = require("../utils/easySplitSettlement");
const ondcOrders = require("../models/entities/ondc_order");
const order = require("../models/entities/order");

const log = (logTraceId, level, data) =>
  customLog(logTraceId, level, { scope: "easySplit", flow: "payoutSweep", ...data }, "VENDOR");

const PAYOUT_BLOCKING_ORDER_STATES = ["Cancelled", "Returned"];
const TERMINAL_ISSUE_STATUSES = ["RESOLVED", "REJECTED", "CLOSED"];

const blockingReason = (row, openIssueOrderIds) => {
  if (PAYOUT_BLOCKING_ORDER_STATES.includes(row.orderState)) return `order_state_${row.orderState.toLowerCase()}`;
  if (row.returnedAt) return "returned";
  if (row.cancelledAt) return "cancelled";
  if (openIssueOrderIds.has(row.id)) return "open_issue";
  if (!row.splitVendorId) return "no_split_vendor";
  return null;
};

const resolveGatewayOrderId = async (paymentRef, logTraceId) => {
  if (!paymentRef) return null;
  let paymentOrder = null;
  try {
    paymentOrder = await order.findOne({
      where: { corporateTxnId: String(paymentRef) },
      attributes: ["paymentModeResponse"],
      raw: true,
    });
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

const findOpenIssueOrderIds = async () => {
  // Statuses inlined (same pattern as invoicingV2Reminder). A bind-list
  // replacement that expanded wrong would either pay out on an open issue or
  // abort the whole pass.
  const rows = await ondcOrders.sequelize.query(
    `SELECT DISTINCT ondcOrderId AS ondcOrderId
       FROM ondcIssues
      WHERE status NOT IN ('RESOLVED', 'REJECTED', 'CLOSED')`,
    { type: QueryTypes.SELECT }
  );
  return rows.map((r) => r.ondcOrderId);
};

const claimOndcOrderPayout = async ({ id, fromStatus, toStatus }) => {
  if (!id || !fromStatus || !toStatus) return 0;
  const [affected] = await ondcOrders.update(
    { payoutStatus: toStatus },
    { where: { id, payoutStatus: fromStatus } }
  );
  return affected;
};

const updateOndcOrderPayout = async ({
  id, payoutStatus, payoutEligibilityDate, payoutReleasedAt, payoutError,
  incrementAttempts = false,
}) => {
  if (!id) return [0];
  const changes = {};
  if (payoutStatus !== undefined) changes.payoutStatus = payoutStatus;
  if (payoutEligibilityDate !== undefined) changes.payoutEligibilityDate = payoutEligibilityDate;
  if (payoutReleasedAt !== undefined) changes.payoutReleasedAt = payoutReleasedAt;
  if (payoutError !== undefined) changes.payoutError = payoutError;
  if (incrementAttempts) changes.payoutAttempts = literal("payoutAttempts + 1");
  if (!Object.keys(changes).length) return [0];
  return await ondcOrders.update(changes, { where: { id } });
};

const releaseOne = async ({ row, fromStatus, openIssueOrderIds, settings, logTraceId }) => {
  const blocked = blockingReason(row, openIssueOrderIds);
  if (blocked) {
    await updateOndcOrderPayout({ id: row.id, payoutStatus: "BLOCKED", payoutError: blocked });
    log(logTraceId, "info", {
      step: "release", message: "Payout blocked — not releasing to the seller",
      transactionId: row.transactionId, orderId: row.orderId, reason: blocked, orderState: row.orderState,
    });
    return { outcome: "blocked", reason: blocked };
  }

  const claimed = await claimOndcOrderPayout({ id: row.id, fromStatus, toStatus: "RELEASING" });
  if (!claimed) return { outcome: "skipped", reason: "not_claimed" };

  const gatewayOrderId = await resolveGatewayOrderId(row.paymentRef, logTraceId);
  const now = new Date();
  const result = await setSettlementEligibility({
    gatewayOrderId, vendorId: row.splitVendorId, date: now, action: "RELEASE",
    ondcOrderId: row.id, transactionId: row.transactionId, paymentRef: row.paymentRef,
    amount: row.splitAmount, settings, logTraceId,
  });

  if (!result.status) {
    await updateOndcOrderPayout({
      id: row.id, payoutStatus: "RELEASE_FAILED", incrementAttempts: true,
      payoutError: `release_failed: ${result.reason || "unknown"}${result.message ? ` — ${result.message}` : ""}`,
    });
    log(logTraceId, "error", {
      step: "release", message: "Payout release REJECTED by Cashfree — money stays held, will retry",
      transactionId: row.transactionId, orderId: row.orderId, vendorId: row.splitVendorId,
      gatewayOrderId, attempts: (row.payoutAttempts || 0) + 1,
      reason: result.reason || null, gatewayMessage: result.message || null,
    });
    return { outcome: "failed", reason: result.reason };
  }

  await updateOndcOrderPayout({
    id: row.id, payoutStatus: "RELEASED", payoutEligibilityDate: now,
    payoutReleasedAt: now, payoutError: null, incrementAttempts: true,
  });
  log(logTraceId, "info", {
    step: "release", message: "Return window closed — seller payout released",
    transactionId: row.transactionId, orderId: row.orderId, vendorId: row.splitVendorId,
    gatewayOrderId, amount: row.splitAmount, returnWindow: row.returnWindow,
    deliveredAt: row.deliveredAt, payoutDueAt: row.payoutDueAt,
  });
  return { outcome: "released" };
};

const runReleaseBatch = async ({ rows, fromStatus, settings, logTraceId }) => {
  const summary = { candidates: rows.length, released: 0, blocked: 0, failed: 0, skipped: 0 };
  if (!rows.length) return summary;

  let openIssueOrderIds;
  try {
    openIssueOrderIds = new Set(await findOpenIssueOrderIds());
  } catch (error) {
    log(logTraceId, "error", {
      step: "release",
      message: "Could not load open issues — skipping this release pass rather than paying out unverified",
      fromStatus, error: error?.message || String(error),
    });
    return { ...summary, skipped: rows.length, aborted: true };
  }

  for (const row of rows) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const { outcome } = await releaseOne({ row, fromStatus, openIssueOrderIds, settings, logTraceId });
      if (outcome === "released") summary.released += 1;
      else if (outcome === "blocked") summary.blocked += 1;
      else if (outcome === "failed") summary.failed += 1;
      else summary.skipped += 1;
    } catch (error) {
      summary.failed += 1;
      log(logTraceId, "error", {
        step: "release", message: "Payout release threw — leaving the row for the next pass",
        transactionId: row.transactionId, orderId: row.orderId, error: error?.message || String(error),
      });
      try {
        // eslint-disable-next-line no-await-in-loop
        await claimOndcOrderPayout({ id: row.id, fromStatus: "RELEASING", toStatus: "RELEASE_FAILED" });
      } catch (_) {
        // Best-effort — unstickStalePayouts is the real safety net.
      }
    }
  }
  return summary;
};

const releaseDuePayouts = async ({ settings, logTraceId, now = new Date() }) => {
  const rows = await ondcOrders.findAll({
    where: { payoutStatus: "HELD", payoutDueAt: { [Op.ne]: null, [Op.lte]: now } },
    order: [["payoutDueAt", "ASC"]],
    limit: 200,
    raw: true,
  });
  const summary = await runReleaseBatch({ rows, fromStatus: "HELD", settings, logTraceId });
  log(logTraceId, "info", { step: "release-due", message: "Due-payout pass complete", ...summary });
  return summary;
};

const retryFailedReleases = async ({ settings, logTraceId, now = new Date() }) => {
  const maxAttempts = Number(settings.payoutMaxAttempts) || 5;

  let unstuck = 0;
  try {
    const [affected] = await ondcOrders.update(
      { payoutStatus: "RELEASE_FAILED", payoutError: "stuck_in_releasing" },
      {
        where: {
          payoutStatus: "RELEASING",
          updatedAt: { [Op.lte]: new Date(now.getTime() - 30 * 60000) },
        },
      }
    );
    unstuck = affected || 0;
    if (unstuck) {
      log(logTraceId, "error", {
        step: "release-retry",
        message: "Recovered payout rows stranded in RELEASING by an interrupted pass",
        unstuck,
      });
    }
  } catch (error) {
    log(logTraceId, "error", {
      step: "release-retry", message: "Could not recover stranded RELEASING rows",
      error: error?.message || String(error),
    });
  }

  const rows = await ondcOrders.findAll({
    where: { payoutStatus: "RELEASE_FAILED", payoutAttempts: { [Op.lt]: maxAttempts } },
    order: [["payoutDueAt", "ASC"]],
    limit: 100,
    raw: true,
  });
  const summary = await runReleaseBatch({ rows, fromStatus: "RELEASE_FAILED", settings, logTraceId });
  log(logTraceId, "info", { step: "release-retry", message: "Payout retry pass complete", maxAttempts, unstuck, ...summary });
  return { ...summary, unstuck };
};

/**
 * Cron entry point. Never throws — an escaping rejection inside node-schedule
 * would take the scheduler process down. Each phase is isolated so one failure
 * doesn't cost the other.
 */
const runSellerPayoutSweep = async ({ logTraceId = null } = {}) => {
  const now = new Date();

  let settings;
  try {
    settings = await getEasySplitSettings(logTraceId);
  } catch (error) {
    log(logTraceId, "error", {
      step: "sweep", message: "Seller payout sweep aborted — could not read the ONDC_EASY_SPLIT settings",
      error: error?.message || String(error),
    });
    return { skipped: true, reason: "settings_unavailable", error: error?.message || String(error) };
  }

  if (settings.payoutHoldEnabled === false) {
    log(logTraceId, "info", {
      step: "sweep", message: "Seller payout sweep skipped — payoutHoldEnabled is false in ONDC_EASY_SPLIT",
    });
    return { skipped: true, reason: "hold_disabled" };
  }

  const summary = { startedAt: now.toISOString() };
  const phase = async (name, fn) => {
    try {
      summary[name] = await fn();
    } catch (error) {
      summary[name] = { error: error?.message || String(error) };
      log(logTraceId, "error", {
        step: "sweep", message: `Seller payout sweep phase "${name}" failed — other phases still ran`,
        error: error?.message || String(error), stack: error?.stack || null,
      });
    }
  };

  await phase("due", () => releaseDuePayouts({ settings, logTraceId, now }));
  await phase("retry", () => retryFailedReleases({ settings, logTraceId, now }));

  log(logTraceId, "info", { step: "sweep", message: "Seller payout sweep complete", ...summary });
  return summary;
};

const triggerOndcSellerPayoutSweep = async () => {
  try {
    const data = await runSellerPayoutSweep();
    return { status: true, data };
  } catch (error) {
    log(null, "error", {
      step: "sweep",
      message: "ONDC seller payout sweep failed",
      error: error?.message || String(error),
    });
    return { status: false, error: error?.message || String(error) };
  }
};

module.exports = {
  PAYOUT_BLOCKING_ORDER_STATES,
  TERMINAL_ISSUE_STATUSES,
  blockingReason,
  runSellerPayoutSweep,
  triggerOndcSellerPayoutSweep,
};
