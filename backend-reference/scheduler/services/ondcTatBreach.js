const { Op } = require("sequelize");
const ondcOrders = require("../models/entities/ondc_order");
const ondcSellers = require("../models/entities/ondc_seller");
const corporateUser = require("../models/entities/corporateUser");
const setting = require("../models/entities/setting");
const { findOne: findServiceOperator } = require("../models/use-cases/serviceOperator");
const { ONDC_ACCESS_KEY } = require("./ondc");
const emailer = require("../utils/emailer");
const {
  buildTatBreachSubject,
  buildTatBreachEmail,
} = require("../utils/emailTemplates/ondcTatBreach");
const { customLog } = require("../utils/loggerHelper");

/**
 * Alert the internal team when an ONDC office-supplies order blows its promised
 * delivery TAT.
 *
 * "This order is now late" is not an event anyone sends — no BPP notifies us that a
 * promise it made has expired — so it needs a clock. This job is that clock.
 *
 * Unlike the seller-payout sweep next door (which calls purchase over HTTP because
 * its work is money movement through Cashfree Easy Split, and that must have exactly
 * one home), this job reads orders, claims a row and sends mail. It touches no
 * gateway and moves no money, so it runs against the shared DB directly, like the
 * office-supply search job. That also removes a failure mode: purchase being down
 * no longer means no alerts.
 *
 * One email per order, ever. `tatBreachNotifiedAt` IS the lock: it is claimed with a
 * compare-and-set from NULL before the mail goes out, so two overlapping passes
 * cannot double-alert. The corollary matters more than the rule — NEVER claim a row
 * we are not about to email about, because a claim without a send silences that
 * order permanently.
 */

const SETTINGS_NAME = "ONDC_TAT_BREACH";

/** Tunables an admin can change without a deploy — `settings` row ONDC_TAT_BREACH. */
const DEFAULT_SETTINGS = {
  // Kill switch.
  enabled: true,
  // Who gets alerted. EMPTY BY DEFAULT AND ON PURPOSE: with no recipients the sweep
  // sends nothing and claims nothing, so switching it on later still alerts on the
  // whole existing backlog rather than finding every order already marked.
  notifyEmails: [],
  // Matches DELAY_FALLBACK_HOURS in purchase's services/ondcOrderRefund.js — how
  // long after placement an order counts as late when the BPP declared no
  // @ondc/org/TAT. Keep the two in step; purchase uses the same rule for the admin
  // panel's Delayed badge, and a divergence would make badge and alert disagree.
  noEtaFallbackHours: 24,
  batchLimit: 200,
};

const log = (level, data) =>
  customLog(null, level, { scope: "ondcTatBreach", flow: "ondcTatBreach", ...data }, "VENDOR");

const getTatBreachSettings = async () => {
  try {
    const row = await setting.findOne({ where: { name: SETTINGS_NAME }, raw: true });
    if (!row?.details) return { ...DEFAULT_SETTINGS };
    const details = typeof row.details === "string" ? JSON.parse(row.details) : row.details;
    return { ...DEFAULT_SETTINGS, ...details };
  } catch (error) {
    log("error", {
      step: "settings",
      message: `Could not read the ${SETTINGS_NAME} settings row — using defaults`,
      error: error?.message || String(error),
    });
    return { ...DEFAULT_SETTINGS };
  }
};

/**
 * Accepts an array, a JSON-encoded array, or a comma-separated string — vendors.vendorEmail
 * is a JSON column that can come back either already parsed or still a string.
 */
const parseRecipients = (value) => {
  let raw = value;
  if (typeof raw === "string" && raw.trim().startsWith("[")) {
    try {
      raw = JSON.parse(raw);
    } catch (_) {
      // Not valid JSON after all — fall through to the comma split below.
    }
  }
  const list = Array.isArray(raw) ? raw : String(raw ?? "").split(",");
  return list.map((entry) => String(entry ?? "").trim()).filter(Boolean);
};

/**
 * Who gets the delay alert: the ONDC vendor row's admin list — vendors.vendorEmail,
 * reached through the serviceOperators row whose accessKey is the ONDC one. Same place
 * the WhatsApp jobs read their admin recipients from, so the ops list lives in one
 * table rather than being restated per job.
 *
 * Falls back to notifyEmails on the settings row, so an environment already configured
 * that way keeps alerting instead of going silent on deploy.
 */
const resolveRecipients = async (settings) => {
  try {
    const service = await findServiceOperator({ accessKey: ONDC_ACCESS_KEY });
    const fromVendor = parseRecipients(service?.vendor?.vendorEmail);
    if (fromVendor.length) return fromVendor;
    log("info", {
      step: "recipients",
      message: `No vendorEmail on the ${ONDC_ACCESS_KEY} vendor row — falling back to the settings row`,
    });
  } catch (error) {
    log("error", {
      step: "recipients",
      message: "Could not read the ONDC vendor row — falling back to the settings row",
      error: error?.message || String(error),
    });
  }
  return parseRecipients(settings.notifyEmails);
};

/** Same rule as purchase's evaluateRefundEligibility: the seller's promise, else placed + fallback. */
const resolveDueBy = (row, noEtaFallbackHours) => {
  if (row?.expectedDeliveryDate) {
    const at = new Date(row.expectedDeliveryDate);
    return Number.isNaN(at.getTime()) ? null : { dueBy: at, isFallback: false };
  }
  if (!row?.createdAt) return null;
  const placed = new Date(row.createdAt);
  if (Number.isNaN(placed.getTime())) return null;
  return {
    dueBy: new Date(placed.getTime() + noEtaFallbackHours * 3600000),
    isFallback: true,
  };
};

const daysBetween = (from, to) =>
  Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86400000));

const summariseItems = (items) =>
  (Array.isArray(items) ? items : [])
    .map((i) => `${i?.productName || "item"} × ${i?.productQuantity || 1}`)
    .join(", ");

/**
 * Orders past their delivery promise that have not been alerted on yet.
 * `tatBreachNotifiedAt IS NULL` is what makes the alert once-per-order.
 */
const findBreachedOrders = async ({ now, noEtaFallbackHours, limit }) => {
  const noEtaBefore = new Date(now.getTime() - noEtaFallbackHours * 3600000);
  return ondcOrders.findAll({
    where: {
      tatBreachNotifiedAt: { [Op.is]: null },
      deliveredAt: { [Op.is]: null },
      orderState: { [Op.or]: [{ [Op.notIn]: ["Cancelled", "Returned"] }, { [Op.is]: null }] },
      [Op.or]: [
        { expectedDeliveryDate: { [Op.ne]: null, [Op.lte]: now } },
        { expectedDeliveryDate: { [Op.is]: null }, createdAt: { [Op.lte]: noEtaBefore } },
      ],
    },
    // MySQL sorts nulls first ASC, so no-ETA orders lead — most at risk of being forgotten.
    order: [["expectedDeliveryDate", "ASC"]],
    limit,
    raw: true,
  });
};

/**
 * Atomically claim the right to alert on one order. The row is the lock, so two
 * overlapping passes cannot both email about it.
 * @returns {Promise<number>} 1 = claimed, 0 = already alerted / someone else has it
 */
const claimOrder = async (id, now) => {
  const [affected] = await ondcOrders.update(
    { tatBreachNotifiedAt: now },
    { where: { id, tatBreachNotifiedAt: { [Op.is]: null } } }
  );
  return affected;
};

/**
 * Seller network participant, best available. Populated by purchase from the
 * on_search catalog descriptor; orders placed before that capture existed fall back
 * to the bppId, which at least identifies the seller app in a support ticket.
 */
const resolveSellerNp = async (row) => {
  let seller = null;
  try {
    if (row.bppId && row.providerId) {
      seller = await ondcSellers.findOne({
        where: { bppId: row.bppId, providerId: row.providerId },
        raw: true,
      });
    }
  } catch (_) {
    seller = null;
  }
  return {
    sellerNpName: seller?.npName || row.bppId || null,
    npContactEmail: seller?.npContactEmail || null,
    npContactPhone: seller?.npContactPhone || null,
  };
};

/** Company name + city. billing.name is the checkout contact person, not the company. */
const resolveBuyer = async (row) => {
  let corporate = null;
  if (row.corporateUserId) {
    try {
      corporate = await corporateUser.findOne({ where: { id: row.corporateUserId }, raw: true });
    } catch (_) {
      corporate = null;
    }
  }
  const billing = typeof row.billing === "string" ? safeJson(row.billing) : row.billing;
  const address = billing?.address || {};
  return {
    buyerCompanyName: corporate?.companyName || corporate?.name || null,
    // The India-Post lookup can leave city empty — the pincode still locates them.
    buyerCity: address.city || address.area_code || corporate?.city || null,
  };
};

/** JSON columns come back parsed, but tolerate a string in case the driver differs. */
const safeJson = (value) => {
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
};

/** The Delivery leg specifically — a return/cancel leg can sit at index 0. */
const getDeliveryFulfillment = (fulfillments) => {
  const legs = typeof fulfillments === "string" ? safeJson(fulfillments) : fulfillments;
  return (Array.isArray(legs) ? legs : []).find((f) => f?.type === "Delivery") || null;
};

/** Build every field the template needs for one order. */
const buildAlertPayload = async (row, { now, noEtaFallbackHours }) => {
  const due = resolveDueBy(row, noEtaFallbackHours);
  const [np, buyer] = await Promise.all([resolveSellerNp(row), resolveBuyer(row)]);
  const delivery = getDeliveryFulfillment(row.fulfillments);
  const items = typeof row.items === "string" ? safeJson(row.items) : row.items;

  return {
    orderId: row.orderId || row.transactionId,
    itemSummary: summariseItems(items),
    fulfilmentAmount: row.amountPaid ?? row.totalAmount,
    providerName: row.vendorName,
    expectedDate: due?.dueBy || null,
    expectedDateIsFallback: Boolean(due?.isFallback),
    daysOverdue: due ? daysBetween(due.dueBy, now) : 0,
    lastOndcStatus:
      delivery?.state?.descriptor?.code ||
      delivery?.state?.descriptor?.name ||
      row.orderState ||
      null,
    // Our server clock for the last on_status purchase persisted, not the BPP's.
    lastStatusTimestamp: row.statusCheckedAt || row.createdAt || null,
    ...np,
    ...buyer,
  };
};

const sendMail = (to, subject, body) =>
  new Promise((resolve) => {
    emailer.email(to, subject, body, () => resolve());
  });

/**
 * Cron entry point. Resolves rather than throws: an unhandled rejection inside a
 * node-schedule callback would take down the scheduler process and every other job
 * registered in scheduleReport.js with it.
 */
exports.triggerOndcTatBreachSweep = async ({ now = new Date() } = {}) => {
  const settings = await getTatBreachSettings();

  if (settings.enabled === false) {
    log("info", { step: "skip", message: "TAT breach alerts are disabled" });
    return { skipped: true, reason: "disabled" };
  }

  const recipients = await resolveRecipients(settings);
  if (!recipients.length) {
    // Deliberately BEFORE any claim: marking rows we never emailed about would
    // silence them forever, so an unconfigured recipient must be a total no-op.
    log("error", {
      step: "skip",
      message:
        `No recipients configured — set vendorEmail on the ${ONDC_ACCESS_KEY} vendor row ` +
        `(or notifyEmails on the ${SETTINGS_NAME} settings row). ` +
        "No orders were claimed, so nothing is lost.",
    });
    return { skipped: true, reason: "no_recipients" };
  }

  const noEtaFallbackHours =
    Number(settings.noEtaFallbackHours) || DEFAULT_SETTINGS.noEtaFallbackHours;

  let breached = [];
  try {
    breached = await findBreachedOrders({
      now,
      noEtaFallbackHours,
      limit: Number(settings.batchLimit) || DEFAULT_SETTINGS.batchLimit,
    });
  } catch (error) {
    log("error", {
      step: "select-failed",
      message: "Could not read TAT-breached orders",
      error: error?.message || String(error),
    });
    return { skipped: true, reason: "select_failed", error: error?.message || String(error) };
  }

  const summary = {
    startedAt: now.toISOString(),
    found: breached.length,
    notified: 0,
    skipped: 0,
    failed: 0,
  };

  for (const row of breached) {
    try {
      // Claim first: whoever flips it out of NULL owns the alert.
      // eslint-disable-next-line no-await-in-loop
      const claimed = await claimOrder(row.id, now);
      if (!claimed) {
        summary.skipped += 1;
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const payload = await buildAlertPayload(row, { now, noEtaFallbackHours });
      // eslint-disable-next-line no-await-in-loop
      await sendMail(recipients, buildTatBreachSubject(payload), buildTatBreachEmail(payload));

      summary.notified += 1;
      log("info", {
        step: "notified",
        message: "TAT breach alert sent",
        ondcOrderId: row.id,
        orderId: payload.orderId,
        daysOverdue: payload.daysOverdue,
        to: recipients,
      });
    } catch (error) {
      summary.failed += 1;
      // The row stays claimed, so this order will NOT be retried next pass. Logged
      // as an error precisely because it needs a human — that is the deliberate
      // trade for never double-alerting.
      log("error", {
        step: "notify-failed",
        message: "TAT breach alert failed after the order was claimed — needs manual follow-up",
        ondcOrderId: row.id,
        orderId: row.orderId || row.transactionId,
        error: error?.message || String(error),
      });
    }
  }

  log("info", { step: "done", message: "TAT breach sweep complete", ...summary });
  return summary;
};

// Exported for unit tests.
exports.SETTINGS_NAME = SETTINGS_NAME;
exports.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
exports.parseRecipients = parseRecipients;
exports.resolveDueBy = resolveDueBy;
exports.daysBetween = daysBetween;
exports.summariseItems = summariseItems;
exports.buildAlertPayload = buildAlertPayload;
