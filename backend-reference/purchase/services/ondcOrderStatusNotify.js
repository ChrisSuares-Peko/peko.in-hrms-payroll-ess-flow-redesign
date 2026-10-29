/**
 * Buyer notification emails for ONDC (office supplies) order-lifecycle events:
 * accepted, packed, shipped, out for delivery, delivered, delayed, cancelled,
 * return pickup scheduled, return completed.
 *
 * Same house style as ondcInvoiceNotify.js / ondcRefundCancelNotify.js — resolve
 * recipient, render, emailer.email(), customLog — and fully guarded, so a mail,
 * lookup or template failure can never affect the ONDC callback that triggered it.
 *
 * ------------------------------------------------------------------------------
 * The two things that make this safe on an at-least-once webhook
 * ------------------------------------------------------------------------------
 * 1. It fires on `appended` from diffStatusHistory (utils/ondcStatusHistory.js) —
 *    the events a callback GENUINELY introduced. on_status is not a one-off: the
 *    delivery poll re-asks hourly, unsolicited pushes are allowed, and every reply
 *    restates the whole order. A replayed callback appends nothing, so nothing mails.
 * 2. Every send is claimed in ondcOrderNotifications on a UNIQUE (order, eventKey)
 *    index BEFORE it goes out. Belt and braces: (1) alone would still double-send
 *    if two callbacks raced, and the failure mode is mailing a buyer "Packed" every
 *    hour for the life of the order.
 *
 * Order of operations is deliberate and mirrors sendOndcInvoiceEmail:
 *    recipient -> (no recipient? skip WITHOUT claiming) -> claim -> send if won.
 * Claiming a row we then fail to email about would silence that event permanently,
 * because there is no un-claim.
 *
 * ------------------------------------------------------------------------------
 * NON-GOAL: batching
 * ------------------------------------------------------------------------------
 * One checkout creates one ondcOrders row per seller, so a three-seller checkout
 * can produce three "Packed" mails minutes apart. That is intended. Those parcels
 * ship, arrive and are cancellable separately, each with its own order id, courier
 * and ETA, and a merged mail could not carry the per-order Track Shipment CTA the
 * spec requires. Volume is held down instead by mailing only the buyer-meaningful
 * transitions (see SILENT_CODES) and by the ONDC_ORDER_EMAILS kill switches.
 * Please don't "fix" this with a debounce timer.
 */

const emailer = require("../utils/emailer");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const setting = require("../models/entities/setting");
const templates = require("../utils/emailTemplate/officeSuppliesNotifications");
const { partnerLogos } = require("../utils/partnerLogos");
const { customLog } = require("../utils/loggerHelper");
const { resolveOndcOrderRecipient } = require("../utils/ondcRecipient");
const { claimOndcOrderNotification } = require("../models/use-cases/ondc_order_notification");
const {
  findOndcOrderByTransactionId,
  markOndcOrderCancelledFromCallback,
  findDelayedOndcOrders,
} = require("../models/use-cases/ondc_order");
const {
  getAwbNumber,
  getCourierName,
  getDeliveryWindow,
  getPickupWindow,
  getPickupDate,
} = require("../utils/ondcTracking");
const { resolveDeliveredAt, parseIsoDurationMs } = require("../utils/ondc_helper");
const { getReturnFulfillments } = require("../utils/ondcReturnEligibility");
const { dateIST, timeIST } = require("../utils/emailTemplate/ondcShell");
const {
  resolveCancellationReason,
  resolveCancelledBy,
  extractCancellationReasonId,
} = require("../utils/ondcCancellationReasons");
const {
  summariseItems,
  resolveEmailItemRows,
  buildEmailItemRows,
} = require("../utils/ondcOrderItemsForEmail");
// Templates 10/11/14/15 are owned by this module — they are raised from the buyer,
// admin and refund paths too, so the dispatcher delegates rather than duplicating.
const {
  sendOndcOrderCancelledEmail,
  sendOndcReturnPickupScheduledEmail,
  sendOndcReturnCompletedEmail,
} = require("./ondcRefundCancelNotify");

const FLOW = "ondcOrderStatusNotify";
const SETTINGS_NAME = "ONDC_ORDER_EMAILS";

/** Tunables an admin can change without a deploy — `settings` row ONDC_ORDER_EMAILS. */
const DEFAULT_SETTINGS = {
  // Master kill switch for every mail in this module.
  enabled: true,
  // Per-template mutes, keyed by the `template` field of STATUS_EVENTS below. Absent
  // or true means "send"; only an explicit false mutes.
  templates: {},
};

const log = (logTraceId, level, data) =>
  customLog(logTraceId, level, { flow: FLOW, ...data }, "VENDOR");

const sendEmail = (to, subject, body) =>
  new Promise((resolve) => {
    emailer.email(to, subject, body, () => resolve());
  });

const getSettings = async (logTraceId) => {
  try {
    const row = await setting.findOne({ where: { name: SETTINGS_NAME }, raw: true });
    if (!row?.details) return { ...DEFAULT_SETTINGS };
    const details = typeof row.details === "string" ? JSON.parse(row.details) : row.details;
    return { ...DEFAULT_SETTINGS, ...details };
  } catch (error) {
    log(logTraceId, "error", {
      step: "settings",
      message: `Could not read the ${SETTINGS_NAME} settings row — using defaults`,
      error: error?.message || String(error),
    });
    return { ...DEFAULT_SETTINGS };
  }
};

// ---------------------------------------------------------------------------
// Which ONDC codes mail what
// ---------------------------------------------------------------------------

/**
 * Codes that deliberately mail NOTHING. Logistics interior: the buyer already sees
 * them on the Track timeline, and mailing them turns 5 mails per order into 8 with
 * no new information. This set is the main lever on volume — think before shrinking it.
 */
const SILENT_CODES = new Set([
  "Agent-assigned",
  "Out-for-pickup",
  "At-destination-hub",
  // "Order Packed" was spec template 5 until the 2026-08-24 revision deleted it.
  // The buyer now hears nothing between Accepted and Shipped.
  "Packed",
  // Return-leg interior, covered by the two return mails at either end.
  "Return_Requested",
  "Return_Initiated",
  "Return_Picked",
  "Return_Rejected",
  "Return_Pick_Failed",
  "Return_Failed",
]);

/**
 * code -> { template, eventKey }.
 *
 * Several codes share one eventKey on purpose, where two ONDC codes mean one
 * buyer-facing fact: Accepted/Pending, Order-picked-up/In-transit,
 * Completed/Order-delivered, Liquidated/Return_Delivered. appendStatusHistory
 * already collapses most of these into one history entry, but a seller that sends
 * them in SEPARATE callbacks would still produce two appended events — and the
 * shared key makes the second one a no-op at the claim.
 */
const STATUS_EVENTS = {
  // 4. Order Accepted by Seller
  Accepted: { template: "accepted", eventKey: "status:accepted" },
  Pending: { template: "accepted", eventKey: "status:accepted" },
  // (5. Order Packed was deleted by the spec revision — see SILENT_CODES.)
  // 6. Order Shipped / Dispatched
  "Order-picked-up": { template: "shipped", eventKey: "status:shipped" },
  "In-transit": { template: "shipped", eventKey: "status:shipped" },
  // 7. Out for Delivery
  "Out-for-delivery": { template: "ofd", eventKey: "status:ofd" },
  // 8. Order Delivered
  "Order-delivered": { template: "delivered", eventKey: "status:delivered" },
  Completed: { template: "delivered", eventKey: "status:delivered" },
  // 9. Delivery Delayed — the spec's "LSP exception" trigger. One mail per code per
  // order: a second failed attempt the same day is not news.
  "Pickup-failed": { template: "delayed", eventKey: "exception:Pickup-failed" },
  "Delivery-failed": { template: "delayed", eventKey: "exception:Delivery-failed" },
  // 10/11. Cancellation — which of the two is decided by cancellation.cancelled_by.
  Cancelled: { template: "cancelled", eventKey: null },
  // 14. Return Pickup Scheduled
  Return_Approved: { template: "returnPickup", eventKey: "return:pickup-scheduled" },
  // 15. Return Completed
  Liquidated: { template: "returnCompleted", eventKey: "return:completed" },
  Return_Delivered: { template: "returnCompleted", eventKey: "return:completed" },
};

/** Buyer-facing wording for the two LSP exception codes. */
const DELAY_REASONS = {
  "exception:Delivery-failed": "the courier's delivery attempt was unsuccessful",
  "exception:Pickup-failed": "the courier could not collect the parcel from the seller",
};

/** "In-progress"/"Created" and anything new ONDC invents: no mail, no error. */
const resolveEvent = (code) => {
  if (!code || SILENT_CODES.has(code)) return null;
  return STATUS_EVENTS[code] || null;
};

// ---------------------------------------------------------------------------
// Detail builders — one per template
// ---------------------------------------------------------------------------

const orderLabel = (row) => row?.orderId || row?.transactionId;

const expectedDelivery = (row) => dateIST(row?.expectedDeliveryDate);

/**
 * The "Order summary:" item table's data. The 2026-08-24 spec revision added that
 * table to the shipped, delivered and delayed mails, so each of those now costs
 * one indexed lookup on the catalog snapshot for thumbnails (buildEmailItemRows
 * swallows its own failures and returns rows with image:null).
 */
const orderSummaryFor = async (row) => ({
  items: await buildEmailItemRows(row),
  orderTotal: row?.amountPaid ?? row?.totalAmount ?? null,
});

const baseDetails = (row) => ({
  ondcOrderId: row?.id,
  orderId: orderLabel(row),
  sellerName: row?.vendorName?.trim() || null,
});

const returnItemsLabel = (row) => {
  const meta = row?.returnMeta && typeof row.returnMeta === "object" ? row.returnMeta : {};
  if (typeof meta.itemsLabel === "string" && meta.itemsLabel.trim()) return meta.itemsLabel.trim();
  const requested = Array.isArray(meta.items) ? meta.items : null;
  if (requested?.length) {
    const byId = new Map(resolveEmailItemRows(row).map((item) => [String(item.itemId), item]));
    const labels = requested
      .map((item) => {
        const id = String(item?.itemId ?? item?.id ?? item ?? "");
        const known = byId.get(id);
        const quantity = item?.quantity ?? item?.count ?? known?.quantity;
        const productName = known?.productName || id;
        return productName ? `${productName}${quantity ? ` × ${quantity}` : ""}` : "";
      })
      .filter(Boolean);
    if (labels.length) return labels.join(", ");
  }
  // Whole-order return: list what the order contained.
  return summariseItems(resolveEmailItemRows(row)) || null;
};

/**
 * The per-template (subject, body) pair. Returns null when this template can't be
 * built for this row, so the caller skips without claiming.
 */
const buildMail = async ({ template, row, order, templateDetails, name, extra = {} }) => {
  const base = baseDetails(row);
  const { subjects } = templates;

  switch (template) {
    case "accepted":
      return {
        subject: subjects.orderAccepted(base.sellerName, base.orderId),
        body: templates.osOrderAcceptedTemplate(
          name,
          { ...base, expectedDelivery: expectedDelivery(row) },
          templateDetails
        ),
      };

    case "shipped":
      return {
        subject: subjects.orderShipped(base.orderId),
        body: templates.osOrderShippedTemplate(
          name,
          {
            ...base,
            courierName: getCourierName(row),
            awbNumber: getAwbNumber(row),
            expectedDelivery: expectedDelivery(row),
            ...(await orderSummaryFor(row)),
          },
          templateDetails
        ),
      };

    case "ofd":
      return {
        subject: subjects.outForDelivery(base.orderId),
        body: templates.osOutForDeliveryTemplate(
          name,
          { ...base, courierName: getCourierName(row), deliveryWindow: getDeliveryWindow(row) },
          templateDetails
        ),
      };

    case "delivered": {
      // The seller's own clock where it is sane, our observation otherwise — the
      // same rule the payout hold uses, so the two never disagree about "when".
      const deliveredAt = row?.deliveredAt || resolveDeliveredAt(order || row);
      return {
        subject: subjects.orderDelivered(base.orderId),
        body: templates.osOrderDeliveredTemplate(
          name,
          {
            ...base,
            deliveryDate: dateIST(deliveredAt),
            deliveryTime: timeIST(deliveredAt),
            ...(await orderSummaryFor(row)),
          },
          templateDetails
        ),
      };
    }

    case "delayed":
      return {
        subject: subjects.deliveryDelayed(base.orderId),
        body: templates.osDeliveryDelayedTemplate(
          name,
          {
            ...base,
            oldEta: expectedDelivery(row),
            newEta: extra.newEta || null,
            delayReason: extra.delayReason || null,
            ...(await orderSummaryFor(row)),
          },
          templateDetails
        ),
      };

    // Cancellation (10/11) and the two return mails (14/15) are owned by
    // ondcRefundCancelNotify — they are also raised from the buyer, admin and
    // refund paths, and one template must have one sender. The dispatcher routes
    // to them in dispatchOndcStatusEmails rather than rendering them here.
    default:
      return null;
  }
};

/**
 * Hand a return-leg event to the sender that owns those two templates, filling in
 * the pickup slot / resolution facts that only the callback payload carries.
 */
const delegateReturnEmail = async ({ template, row, order, logTraceId }) => {
  if (template === "returnPickup") {
    const returnLeg = getReturnFulfillments(order?.fulfillments || row?.fulfillments)[0];
    await sendOndcReturnPickupScheduledEmail({
      row,
      returnItems: returnItemsLabel(row),
      pickupDate: getPickupDate(returnLeg),
      pickupWindow: getPickupWindow(returnLeg),
      logTraceId,
    });
    return true;
  }
  const meta = row?.returnMeta && typeof row.returnMeta === "object" ? row.returnMeta : {};
  await sendOndcReturnCompletedEmail({
    row,
    returnItems: returnItemsLabel(row),
    isReplacement: meta.replace === true || meta.replace === "yes",
    refundAmount: meta.refundAmount ?? row?.refundedAmount ?? null,
    logTraceId,
  });
  return true;
};

// ---------------------------------------------------------------------------
// The one send path
// ---------------------------------------------------------------------------

/**
 * Claim-then-send one notification. Never throws.
 *
 * @returns {Promise<boolean>} true when a mail actually went out
 */
const sendOndcOrderNotification = async ({
  row,
  order = null,
  template,
  eventKey,
  extra = {},
  settings = null,
  logTraceId = null,
} = {}) => {
  try {
    if (!row?.id || !template || !eventKey) return false;

    const config = settings || (await getSettings(logTraceId));
    if (config.enabled === false) {
      log(logTraceId, "info", {
        step: "status-email-skip",
        message: `All ${SETTINGS_NAME} notifications are switched off`,
        ondcOrderId: row.id,
        eventKey,
      });
      return false;
    }
    if (config.templates && config.templates[template] === false) {
      log(logTraceId, "info", {
        step: "status-email-skip",
        message: "This template is muted in settings",
        ondcOrderId: row.id,
        template,
        eventKey,
      });
      return false;
    }

    // BEFORE the claim, always: claiming a row we then can't mail about would
    // silence this event permanently, and there is no un-claim.
    const { email: to, name, corporate } = await resolveOndcOrderRecipient(row);
    if (!to) {
      log(logTraceId, "warn", {
        step: "status-email-skip",
        message: "No recipient resolved — not claimed, so a later callback can still send",
        ondcOrderId: row.id,
        eventKey,
        corporateUserId: row.corporateUserId || null,
        subCorporateUserId: row.subCorporateUserId || null,
      });
      return false;
    }

    const templateDetails = corporate?.registeredBy
      ? await fetchPartnerDetails(corporate.registeredBy)
      : await partnerLogos();
    const mail = await buildMail({ template, row, order, templateDetails, name, extra });
    if (!mail) {
      log(logTraceId, "warn", {
        step: "status-email-skip",
        message: "No template built for this event",
        ondcOrderId: row.id,
        template,
        eventKey,
      });
      return false;
    }

    const { claimed } = await claimOndcOrderNotification({
      ondcOrderId: row.id,
      transactionId: row.transactionId,
      eventKey,
      recipient: to,
      logTraceId,
    });
    if (!claimed) {
      log(logTraceId, "info", {
        step: "status-email-skip",
        message: "Already sent — claimed by an earlier callback",
        ondcOrderId: row.id,
        eventKey,
      });
      return false;
    }

    await sendEmail(to, mail.subject, mail.body);
    log(logTraceId, "info", {
      step: "status-email-sent",
      message: "Order notification email sent",
      ondcOrderId: row.id,
      eventKey,
      template,
      to,
    });
    return true;
  } catch (err) {
    log(logTraceId, "error", {
      step: "status-email-failed",
      message: err?.message || String(err),
      ondcOrderId: row?.id,
      eventKey,
      template,
    });
    return false;
  }
};

/**
 * Cancellation: record it (write-once) and mail the right one of the two templates.
 *
 * Reached from a CALLBACK, not from our own /cancel — the buyer's own cancel mails
 * from the controller that awaited the waiter and has already written the row, so
 * the CAS here loses harmlessly and the eventKey claim stops a second mail.
 */
const notifyOndcCancellationFromCallback = async ({ row, order, settings, logTraceId } = {}) => {
  const { getOndcConfig } = require("./ondc");
  let bapId = null;
  try {
    bapId = (await getOndcConfig())?.bapId || null;
  } catch (_) {
    // Without the config we can't prove the cancel was ours, and "seller" is the
    // safe default: it is the wording that never claims the buyer asked for this.
  }
  const cancelledBy = resolveCancelledBy(order, bapId);
  const cancelReason = resolveCancellationReason(
    extractCancellationReasonId(order),
    order?.cancellation?.reason?.descriptor?.short_desc,
    cancelledBy
  );

  await markOndcOrderCancelledFromCallback({
    transactionId: row.transactionId,
    cancelReason,
  });

  const config = settings || (await getSettings(logTraceId));
  if (config.enabled === false || config.templates?.cancelled === false) {
    log(logTraceId, "info", {
      step: "cancel-email-skip",
      message: "Cancellation mail is muted in settings (the cancellation was still recorded)",
      ondcOrderId: row.id,
      cancelledBy,
    });
    return false;
  }

  await sendOndcOrderCancelledEmail({
    row: { ...row, cancelReason, cancelledAt: row.cancelledAt || new Date() },
    cancelReason,
    refundAmount: row.refundedAmount,
    initiatedBy: cancelledBy,
    logTraceId,
  });
  return true;
};

/**
 * Template 9, trigger (a): the seller REVISED its promised TAT.
 *
 * Not driven by `appended` — a new ETA is not a state change, so it can arrive on a
 * callback that introduces no status event at all. Called separately from on_status.
 *
 * Two rules make this safe, and both are load-bearing:
 *
 * 1. The candidate ETA is re-based on `row.createdAt`, NOT on the callback's own
 *    timestamp. computeExpectedDelivery uses `order.updated_at || created_at ||
 *    Date.now()`, so re-running it on each hourly poll would push the ETA forward
 *    every cycle and manufacture a permanent, fictional delay.
 * 2. It NEVER writes expectedDeliveryDate. That column is read by
 *    evaluateRefundEligibility, the admin Delayed filter, the delivery poll and the
 *    scheduler's breach sweep — moving it forward would silently un-delay orders
 *    that currently qualify for a REFUND. This is a comparison only; the new date
 *    lives in the eventKey, which is what makes each distinct revision mail once.
 *
 * @returns {Promise<boolean>} true when a delay mail went out
 */
const checkOndcEtaRevision = async ({ transactionId, order, logTraceId = null } = {}) => {
  try {
    if (!transactionId || !order) return false;

    // Guard before any query: most callbacks carry no TAT, and the hourly poll
    // must not cost a SELECT per order for nothing.
    const delivery = (Array.isArray(order.fulfillments) ? order.fulfillments : []).find(
      (f) => f?.type === "Delivery" && f["@ondc/org/TAT"]
    );
    const tat = delivery?.["@ondc/org/TAT"];
    if (!tat) return false;

    const revisedMs = parseIsoDurationMs(tat);
    if (revisedMs == null) return false;

    const row = await findOndcOrderByTransactionId(transactionId);
    if (!row?.expectedDeliveryDate || !row.createdAt) return false;
    // Nothing to promise on an order that has arrived or is over.
    if (row.deliveredAt || ["Cancelled", "Returned"].includes(row.orderState)) return false;

    const settings = await getSettings(logTraceId);
    const thresholdMs = (Number(settings.etaRevisionThresholdHours) || 6) * 3600000;

    const candidate = new Date(new Date(row.createdAt).getTime() + revisedMs);
    const previous = new Date(row.expectedDeliveryDate);
    if (!Number.isFinite(candidate.getTime()) || candidate - previous < thresholdMs) return false;

    // One mail per DISTINCT revised date. A seller that restates the same slipped
    // TAT on every poll mails once; one that slips again mails again.
    const eventKey = `eta:${candidate.toISOString().slice(0, 10)}`;
    return await sendOndcOrderNotification({
      row,
      order,
      template: "delayed",
      eventKey,
      extra: {
        newEta: dateIST(candidate),
        delayReason: "the seller has revised the delivery timeline",
      },
      settings,
      logTraceId,
    });
  } catch (err) {
    log(logTraceId, "error", {
      step: "eta-revision-failed",
      message: err?.message || String(err),
      transactionId,
    });
    return false;
  }
};

/**
 * Template 9, trigger (c): the seller has gone QUIET past its promised date.
 *
 * The other two triggers need the seller to say something. This one is a clock, and
 * it covers the most common real-world delay — no callback at all. Driven by the
 * scheduler over the internal route (routes/API/v1/ondc.js), because the select,
 * the claim and the templates all live here.
 *
 * Deliberately NOT hung off `tatBreachNotifiedAt`: that column is the INTERNAL
 * alert's own once-per-order lock in scheduler/services/ondcTatBreach.js, and that
 * sweep no-ops entirely when no ops recipients are configured — which would silence
 * the buyer too. The buyer mail claims `delay:tat-breach` in the notification
 * ledger instead, so the two are independent.
 *
 * @returns {Promise<{found:number, sent:number, skipped:number}>}
 */
const notifyDelayedOndcOrders = async ({
  now = new Date(),
  noEtaFallbackHours = 24,
  limit = 200,
  logTraceId = null,
} = {}) => {
  const summary = { found: 0, sent: 0, skipped: 0 };
  const settings = await getSettings(logTraceId);
  if (settings.enabled === false || settings.notifyBuyerOnDelay === false) {
    log(logTraceId, "info", {
      step: "delay-sweep-skip",
      message: "Buyer delay notices are switched off",
    });
    return summary;
  }

  const rows = await findDelayedOndcOrders({ now, noEtaFallbackHours, limit });
  summary.found = rows.length;

  for (const row of rows) {
    // eslint-disable-next-line no-await-in-loop
    const sent = await sendOndcOrderNotification({
      row,
      template: "delayed",
      eventKey: "delay:tat-breach",
      extra: {
        // No revised date exists — that is the whole point of this trigger. The
        // template swaps in "we don't have a revised date yet" when newEta is null.
        newEta: null,
        delayReason: "the seller hasn't dispatched it within the promised time",
      },
      settings,
      logTraceId,
    });
    sent ? (summary.sent += 1) : (summary.skipped += 1);
  }

  log(logTraceId, "info", { step: "delay-sweep-done", message: "Buyer delay sweep complete", ...summary });
  return summary;
};

/**
 * The webhook entry point: mail whatever this callback newly introduced.
 *
 * @param {Object} params
 * @param {string} params.transactionId
 * @param {Object} params.order the ONDC order from the callback
 * @param {Array}  params.appended events from updateOndcOrderStatus
 * @param {string} [params.source] "on_status" | "on_update"
 * @returns {Promise<{sent: number, skipped: number}>} never throws
 */
const dispatchOndcStatusEmails = async ({
  transactionId,
  order = null,
  appended = [],
  source = "on_status",
  logTraceId = null,
} = {}) => {
  const result = { sent: 0, skipped: 0 };
  try {
    if (!transactionId || !Array.isArray(appended) || !appended.length) return result;

    // Resolve the mailable events BEFORE any query — an ordinary in-progress poll
    // appends "In-transit" only once, and every later one should cost nothing.
    const mailable = [];
    for (const event of appended) {
      const mapped = resolveEvent(event?.code);
      if (!mapped) {
        if (event?.code && !SILENT_CODES.has(event.code)) {
          log(logTraceId, "info", {
            step: "status-email-unmapped",
            message: "No email defined for this ONDC state — nothing sent",
            transactionId,
            code: event.code,
            source,
          });
        }
        continue;
      }
      mailable.push(mapped);
    }
    if (!mailable.length) return result;

    const row = await findOndcOrderByTransactionId(transactionId);
    if (!row) {
      log(logTraceId, "warn", {
        step: "status-email-skip",
        message: "No ondcOrders row for this transaction — nothing to mail",
        transactionId,
      });
      return result;
    }

    const settings = await getSettings(logTraceId);
    // De-duplicate within a single callback: Accepted + Pending in one payload are
    // one event, and both map to status:accepted.
    const seen = new Set();
    for (const mapped of mailable) {
      if (mapped.template === "cancelled") {
        if (seen.has("cancelled")) continue;
        seen.add("cancelled");
        const sent = await notifyOndcCancellationFromCallback({ row, order, settings, logTraceId });
        sent ? (result.sent += 1) : (result.skipped += 1);
        continue;
      }
      if (seen.has(mapped.eventKey)) continue;
      seen.add(mapped.eventKey);

      // 14/15 live in ondcRefundCancelNotify — they claim and log there.
      if (mapped.template === "returnPickup" || mapped.template === "returnCompleted") {
        if (settings.enabled === false || settings.templates?.[mapped.template] === false) {
          result.skipped += 1;
          continue;
        }
        await delegateReturnEmail({ template: mapped.template, row, order, logTraceId });
        result.sent += 1;
        continue;
      }

      const extra =
        mapped.template === "delayed"
          ? { delayReason: DELAY_REASONS[mapped.eventKey] || null }
          : {};
      const sent = await sendOndcOrderNotification({
        row,
        order,
        template: mapped.template,
        eventKey: mapped.eventKey,
        extra,
        settings,
        logTraceId,
      });
      sent ? (result.sent += 1) : (result.skipped += 1);
    }
    return result;
  } catch (err) {
    log(logTraceId, "error", {
      step: "dispatch-failed",
      message: err?.message || String(err),
      transactionId,
      source,
    });
    return result;
  }
};

module.exports = {
  dispatchOndcStatusEmails,
  checkOndcEtaRevision,
  notifyDelayedOndcOrders,
  sendOndcOrderNotification,
  notifyOndcCancellationFromCallback,
  resolveEvent,
  STATUS_EVENTS,
  SILENT_CODES,
  SETTINGS_NAME,
  DEFAULT_SETTINGS,
  FLOW,
};
