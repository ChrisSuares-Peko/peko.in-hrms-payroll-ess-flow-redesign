const { Op } = require("sequelize");
const ondc = require("./ondc");
const ondcOrders = require("../models/entities/ondc_order");
const setting = require("../models/entities/setting");
const { customLog } = require("../utils/loggerHelper");

/**
 * Ask the BPP about orders whose state we are still waiting on — ones that should have
 * arrived but were never reported delivered, and ones with a return in flight.
 *
 * Neither "this order has been delivered" nor "the return moved on" is something anyone
 * pushes to us reliably — no seller is obliged to volunteer either — so it needs a clock.
 * This job is that clock. One /status covers both: the reply carries the whole order,
 * Delivery and Return legs alike, and purchase's on_status handler routes a Return leg
 * into the same lifecycle an on_update would.
 *
 * It used to be pass 1 of the seller-payout sweep, which had two costs: that
 * sweep bails out entirely when payoutHoldEnabled is false, silently freezing
 * every order's status with it, and there was no way to refresh status without
 * also releasing money through Cashfree. This job owns the poll; the payout
 * sweep (ondcSellerPayout.js) only moves money.
 *
 * Fires signed ONDC calls itself and reads the shared DB directly rather than
 * calling purchase — same pattern as the office-supply purge job. Purchase is
 * still where the ANSWER lands: bap_uri points there, so its on_status webhook
 * persists orderState/fulfillments/deliveredAt/statusCheckedAt exactly as before.
 */

const SETTINGS_NAME = "ONDC_DELIVERY_STATUS_POLL";

/** Tunables an admin can change without a deploy — `settings` row ONDC_DELIVERY_STATUS_POLL. */
const DEFAULT_SETTINGS = {
  // Kill switch.
  enabled: true,
  // Min gap between /status calls for the same order, so an hourly cron doesn't hammer
  // a seller about an order it already answered on.
  throttleHours: 6,
  // How long after placement an order is worth chasing when the BPP declared no
  // @ondc/org/TAT. Keep in step with ondcTatBreach's noEtaFallbackHours and purchase's
  // DELAY_FALLBACK_HOURS — all three answer the same question about the same orders.
  noEtaFallbackHours: 24,
  batchLimit: 200,
};

/** Gap between outbound /status calls so one pass can't hammer a slow BPP. */
const THROTTLE_MS = 300;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const log = (level, data) =>
  customLog(null, level, { scope: "ondcDeliveryStatus", flow: "deliveryStatusPoll", ...data }, "VENDOR");

const getPollSettings = async () => {
  try {
    const row = await setting.findOne({ where: { name: SETTINGS_NAME }, raw: true });
    if (!row?.details) return { ...DEFAULT_SETTINGS };
    const details = typeof row.details === "string" ? JSON.parse(row.details) : row.details;
    return { ...DEFAULT_SETTINGS, ...details };
  } catch (error) {
    // Asking a seller twice costs nothing, so a settings outage degrades to the defaults
    // rather than stopping the poll.
    log("error", {
      step: "settings",
      message: `Could not read the ${SETTINGS_NAME} settings row — using defaults`,
      error: error?.message || String(error),
    });
    return { ...DEFAULT_SETTINGS };
  }
};

/**
 * Return states that are over — nothing left to chase. Everything else with a
 * returnStatus is still moving. Mirrors RETURN_FAILED_CODES in purchase's
 * utils/ondcReturnEligibility.js plus the two settled states; keep them in step.
 */
const RETURN_TERMINAL = ["Liquidated", "Returned", "Return_Rejected", "Return_Failed"];

/**
 * Orders worth asking a BPP about, on either of two counts:
 *
 *   1. undelivered past their promise — the delivery never got reported;
 *   2. a return in flight — a returning order is DELIVERED, so branch 1 excludes it,
 *      yet Return_Initiated → Picked → Liquidated still has to be chased. Without this
 *      branch a return only ever advanced if the seller volunteered an on_update.
 *
 * Branch 1 is ported from purchase's findOndcOrdersAwaitingDelivery — keep the two in
 * step. Its ETA condition stays inside that branch: a live return is due to be polled
 * regardless of what the delivery estimate was.
 *
 * Both branches share the statusCheckedAt throttle (server-clock time of the last
 * persisted on_status), which is what lets this run hourly without re-asking about the
 * same order every pass.
 *
 * expectedDeliveryDate is null whenever on_confirm carried no @ondc/org/TAT. Those orders
 * must still be polled — keying only on a non-null ETA would leave them permanently
 * unpolled and never seen as delivered — so they fall back to createdAt + the fallback.
 */
const findOrdersToPoll = async ({ now, throttleHours, noEtaFallbackHours, limit }) => {
  const staleBefore = new Date(now.getTime() - throttleHours * 3600000);
  const noEtaBefore = new Date(now.getTime() - noEtaFallbackHours * 3600000);
  return ondcOrders.findAll({
    where: {
      orderId: { [Op.ne]: null },
      bppUri: { [Op.ne]: null },
      orderState: { [Op.or]: [{ [Op.notIn]: ["Cancelled", "Returned"] }, { [Op.is]: null }] },
      [Op.and]: [
        {
          [Op.or]: [
            // 1. Awaiting delivery.
            {
              deliveredAt: { [Op.is]: null },
              [Op.or]: [
                { expectedDeliveryDate: { [Op.ne]: null, [Op.lte]: now } },
                { expectedDeliveryDate: { [Op.is]: null }, createdAt: { [Op.lte]: noEtaBefore } },
              ],
            },
            // 2. Return in flight.
            { returnStatus: { [Op.ne]: null, [Op.notIn]: RETURN_TERMINAL } },
          ],
        },
        {
          [Op.or]: [
            { statusCheckedAt: { [Op.is]: null } },
            { statusCheckedAt: { [Op.lte]: staleBefore } },
          ],
        },
      ],
    },
    // MySQL sorts nulls first ASC, so no-ETA orders lead — most at risk of being forgotten.
    order: [["expectedDeliveryDate", "ASC"]],
    limit,
    raw: true,
  });
};

/**
 * Cron entry point. Resolves rather than throws: an unhandled rejection inside a
 * node-schedule callback would take down the scheduler process and every other job
 * registered in scheduleReport.js with it.
 *
 * Fire-and-forget by design — it does NOT wait for on_status, and it does NOT stamp
 * statusCheckedAt. Purchase's webhook stamps that when the seller actually answers, so an
 * order whose seller stays silent keeps its stale timestamp and is retried next pass.
 * Stamping it here would mark unanswered orders as checked and quietly drop them.
 *
 * `fired` therefore means "asked", not "updated".
 */
exports.triggerOndcDeliveryStatusPoll = async ({ now = new Date() } = {}) => {
  try {
    const settings = await getPollSettings();

    if (settings.enabled === false) {
      log("info", { step: "poll", message: `Delivery status poll skipped — enabled is false in ${SETTINGS_NAME}` });
      return { skipped: true, reason: "disabled" };
    }

    // A scripted test target (the ONDC Workbench) tracks one transaction id and
    // rejects any action its scenario did not expect. An hourly /status on an
    // unrelated order is exactly that: it desyncs the scenario someone is midway
    // through, and the tester sees the failure on THEIR next click.
    if (await ondc.isOndcWorkbenchMode()) {
      log("info", { step: "poll", message: "Delivery status poll skipped — ONDC is pinned to a test scenario" });
      return { skipped: true, reason: "workbench_mode" };
    }

    const throttleHours = Number(settings.throttleHours) || DEFAULT_SETTINGS.throttleHours;
    const noEtaFallbackHours = Number(settings.noEtaFallbackHours) || DEFAULT_SETTINGS.noEtaFallbackHours;
    const limit = Number(settings.batchLimit) || DEFAULT_SETTINGS.batchLimit;

    const rows = await findOrdersToPoll({ now, throttleHours, noEtaFallbackHours, limit });

    let fired = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await ondc.status({
          bppId: row.bppId,
          bppUri: row.bppUri,
          orderId: row.orderId,
          transactionId: row.transactionId,
          city: row.city,
          domain: row.domain,
        });
        fired += 1;
      } catch (error) {
        // One unreachable seller must not cost the rest of the batch their poll.
        failed += 1;
        log("error", {
          step: "poll",
          message: "ONDC /status failed while polling for delivery",
          transactionId: row.transactionId,
          orderId: row.orderId,
          bppId: row.bppId,
          error: error?.message || String(error),
        });
      }
      // eslint-disable-next-line no-await-in-loop
      await sleep(THROTTLE_MS);
    }

    log("info", {
      step: "poll",
      message: "Delivery status poll complete",
      candidates: rows.length,
      // Split out so a pass that chased only returns is legible in the logs.
      returnsInFlight: rows.filter((r) => r.returnStatus).length,
      fired,
      failed,
      throttleHours,
    });
    return { candidates: rows.length, fired, failed };
  } catch (error) {
    log("error", {
      step: "poll",
      message: "Delivery status poll failed",
      error: error?.message || String(error),
      stack: error?.stack || null,
    });
    return { skipped: true, reason: "poll_failed", error: error?.message || String(error) };
  }
};
