/**
 * Cancellation, return and refund emails for ONDC (office supplies) orders —
 * spec templates 10, 11, 12, 13, 14 and 15, plus the return-raised
 * acknowledgement (which the spec has no template for but buyers already get).
 *
 * Same house style as ondcInvoiceNotify.js / ondcOrderStatusNotify.js: resolve
 * recipient -> claim -> render -> emailer.email() -> customLog. Fire-and-forget
 * and fully guarded — a mail/lookup/template failure must never affect the
 * cancel/refund outcome already computed by the caller.
 *
 * Every send here is claimed in ondcOrderNotifications, for the same reason the
 * status mails are: an order can be cancelled from three places (buyer, admin,
 * seller callback) and refunded from three (manual, after-cancel, after-return),
 * and two of those paths racing must produce one mail, not two.
 */

const emailer = require("../utils/emailer");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const {
  osCancelledByBuyerTemplate,
  osCancelledBySellerTemplate,
  osRefundInitiatedTemplate,
  osRefundCreditedTemplate,
  osReturnPickupScheduledTemplate,
  osReturnCompletedTemplate,
  subjects,
  REFUND_TIMELINE_TEXT,
} = require("../utils/emailTemplate/officeSuppliesNotifications");
const { ondcReturnInitiatedTemplate } = require("../utils/emailTemplate/ecommerce");
const { refundFailure } = require("../utils/emailTemplate/common");
const { dateIST, dateTimeIST } = require("../utils/emailTemplate/ondcShell");
const { buildEmailItemRows } = require("../utils/ondcOrderItemsForEmail");
const { getDeliveryAddressLine } = require("../utils/ondcTracking");
const { partnerLogos } = require("../utils/partnerLogos");
const { customLog } = require("../utils/loggerHelper");
const { resolveOndcOrderRecipient } = require("../utils/ondcRecipient");
const { claimOndcOrderNotification } = require("../models/use-cases/ondc_order_notification");

const FLOW = "ondcRefundCancelNotify";

/**
 * Compatibility shim for services/ondcInvoiceNotify.js (and its test), which reads
 * `.email` and `.contactPersonName || .name` off a corporate-shaped object.
 *
 * The real resolver is utils/ondcRecipient.js — this used to key on corporateUserId
 * alone and returned null for every sub-corporate order, i.e. no mail at all for a
 * whole class of buyer. `name` here is already the best available, so the
 * `contactPersonName || name` chain in callers resolves to it.
 */
const resolveCorporateRecipient = async (row) => {
  const { email, name, corporate } = await resolveOndcOrderRecipient(row);
  if (!email) return null;
  return { ...(corporate || {}), email, name, contactPersonName: null };
};

const sendEmail = (to, subject, body) =>
  new Promise((resolve) => {
    emailer.email(to, subject, body, () => resolve());
  });

const log = (logTraceId, level, data) =>
  customLog(logTraceId, level, { flow: FLOW, ...data }, "VENDOR");

/**
 * Shared prologue for every sender here: recipient, claim, chrome.
 *
 * Returns null when there is nothing to send — and, crucially, does NOT claim when
 * the recipient is missing, so a later path can still deliver the mail. There is
 * no un-claim, so a claim we don't follow with a send silences the event forever.
 *
 * @returns {Promise<{to, name, templateDetails}|null>}
 */
const prepare = async ({ row, eventKey, step, logTraceId }) => {
  const { email: to, name, corporate } = await resolveOndcOrderRecipient(row);
  if (!to) {
    log(logTraceId, "warn", {
      step,
      message: "No recipient resolved — not claimed, so a later path can still send",
      ondcOrderId: row?.id,
      eventKey,
      corporateUserId: row?.corporateUserId || null,
      subCorporateUserId: row?.subCorporateUserId || null,
    });
    return null;
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
      step,
      message: "Already sent — claimed by another path",
      ondcOrderId: row.id,
      eventKey,
    });
    return null;
  }

  const templateDetails = corporate?.registeredBy
    ? await fetchPartnerDetails(corporate.registeredBy)
    : await partnerLogos();
  return { to, name, templateDetails };
};

const orderLabel = (row) => row?.orderId || row?.transactionId;

/** Where the money goes back to. Truthful when we don't know the instrument. */
const refundDestination = (row) => {
  const payment = row?.payment && typeof row.payment === "object" ? row.payment : {};
  const method = payment.type || payment.method || null;
  return method && String(method).toUpperCase() !== "ON-ORDER"
    ? String(method)
    : "Your original payment method";
};

/**
 * The item table's data for the mails the 2026-08-24 spec revision gave one:
 * cancellation (10, 11), refund initiated (12) and return pickup (14).
 *
 * One indexed lookup per mail on the catalog snapshot for thumbnails.
 * buildEmailItemRows swallows its own failures and returns rows with image:null,
 * so a purged catalog costs a picture, never the email.
 */
const orderSummaryFor = async (row) => ({
  items: await buildEmailItemRows(row),
  orderTotal: row?.amountPaid ?? row?.totalAmount ?? null,
});

// ===========================================================================
// 10 / 11. Cancellation
// ===========================================================================
/**
 * Spec 10 (buyer-initiated) or 11 (seller-initiated).
 *
 * `initiatedBy` defaults to "buyer" because both existing callers — the buyer's own
 * cancelOndcOrder and the admin approving a buyer's request — are cancellations the
 * buyer asked for. The seller-initiated variant comes from the on_cancel / on_status
 * callback path (services/ondcOrderStatusNotify.js), which passes "seller".
 */
const sendOndcOrderCancelledEmail = async ({
  row,
  cancelReason,
  refundAmount = null,
  initiatedBy = "buyer",
  logTraceId,
} = {}) => {
  try {
    const eventKey = initiatedBy === "seller" ? "cancel:seller" : "cancel:buyer";
    const ready = await prepare({ row, eventKey, step: "cancel-email-skip", logTraceId });
    if (!ready) return;

    const details = {
      ondcOrderId: row.id,
      orderId: orderLabel(row),
      sellerName: row.vendorName?.trim() || null,
      cancellationDate: dateTimeIST(row.cancelledAt || new Date()),
      cancellationReason: cancelReason || row.cancelReason || null,
      refundAmount: refundAmount ?? row.refundedAmount ?? null,
      refundTimeline: REFUND_TIMELINE_TEXT,
      ...(await orderSummaryFor(row)),
    };

    const subject =
      initiatedBy === "seller"
        ? subjects.cancelledBySeller(details.orderId)
        : subjects.cancelledByBuyer(details.orderId);
    const body =
      initiatedBy === "seller"
        ? osCancelledBySellerTemplate(ready.name, details, ready.templateDetails)
        : osCancelledByBuyerTemplate(ready.name, details, ready.templateDetails);

    await sendEmail(ready.to, subject, body);
    log(logTraceId, "info", {
      step: "cancel-email-sent",
      message: "Cancellation email sent",
      ondcOrderId: row.id,
      to: ready.to,
      initiatedBy,
      cancelReason: details.cancellationReason,
    });
  } catch (err) {
    log(logTraceId, "error", {
      step: "cancel-email-failed",
      message: err?.message || String(err),
      ondcOrderId: row?.id,
    });
  }
};

// ===========================================================================
// Return raised (no spec template — the acknowledgement buyers get today)
// ===========================================================================
/**
 * Sent once the SELLER has confirmed the return request — the caller only reaches
 * this after its on_update waiter resolves without error, so a request the seller
 * rejected or never answered mails nothing.
 *
 * No refund figure here on purpose: the refund fires later on its own trigger
 * states and sends its own mail.
 */
const sendOndcReturnInitiatedEmail = async ({
  row,
  returnRequestId,
  items,
  reason,
  logTraceId,
} = {}) => {
  try {
    // Keyed on the request id, not the order: a buyer can raise a second return on
    // a multi-item order and deserves an acknowledgement for each.
    const eventKey = `return:raised:${returnRequestId || row?.id}`.slice(0, 64);
    const ready = await prepare({ row, eventKey, step: "return-email-skip", logTraceId });
    if (!ready) return;

    const body = ondcReturnInitiatedTemplate(
      ready.name,
      {
        ondcOrderId: row.id,
        orderId: orderLabel(row),
        returnRequestId,
        items: items || [],
        reason,
        requestedAt: new Date(),
      },
      ready.templateDetails
    );
    await sendEmail(ready.to, "Your return request has been raised", body);

    log(logTraceId, "info", {
      step: "return-email-sent",
      message: "Return initiated email sent",
      ondcOrderId: row.id,
      to: ready.to,
      returnRequestId: returnRequestId || null,
    });
  } catch (err) {
    log(logTraceId, "error", {
      step: "return-email-failed",
      message: err?.message || String(err),
      ondcOrderId: row?.id,
    });
  }
};

// ===========================================================================
// 14. Return Pickup Scheduled
// ===========================================================================
/** @param {Object} params { row, returnItems, pickupDate, pickupWindow, logTraceId } */
const sendOndcReturnPickupScheduledEmail = async ({
  row,
  returnItems = null,
  pickupDate = null,
  pickupWindow = null,
  logTraceId,
} = {}) => {
  try {
    const eventKey = "return:pickup-scheduled";
    const ready = await prepare({ row, eventKey, step: "return-pickup-email-skip", logTraceId });
    if (!ready) return;

    const orderId = orderLabel(row);
    await sendEmail(
      ready.to,
      subjects.returnPickupScheduled(orderId, Boolean(pickupDate || pickupWindow)),
      osReturnPickupScheduledTemplate(
        ready.name,
        {
          ondcOrderId: row.id,
          orderId,
          returnItems,
          pickupDate,
          pickupWindow,
          ...(await orderSummaryFor(row)),
        },
        ready.templateDetails
      )
    );

    log(logTraceId, "info", {
      step: "return-pickup-email-sent",
      message: "Return pickup scheduled email sent",
      ondcOrderId: row.id,
      to: ready.to,
    });
  } catch (err) {
    log(logTraceId, "error", {
      step: "return-pickup-email-failed",
      message: err?.message || String(err),
      ondcOrderId: row?.id,
    });
  }
};

// ===========================================================================
// 15. Return Completed
// ===========================================================================
/** @param {Object} params { row, returnItems, isReplacement, refundAmount, logTraceId } */
const sendOndcReturnCompletedEmail = async ({
  row,
  returnItems = null,
  isReplacement = false,
  refundAmount = null,
  logTraceId,
} = {}) => {
  try {
    const eventKey = "return:completed";
    const ready = await prepare({ row, eventKey, step: "return-completed-email-skip", logTraceId });
    if (!ready) return;

    const orderId = orderLabel(row);
    // Figma's "Order Details" block and item table - all pulled from data the
    // order row already carries, nothing new collected for this email.
    const items = await buildEmailItemRows(row);
    await sendEmail(
      ready.to,
      subjects.returnCompleted(orderId),
      osReturnCompletedTemplate(
        ready.name,
        {
          ondcOrderId: row.id,
          orderId,
          placedOn: dateIST(row.createdAt),
          pickupAddress: getDeliveryAddressLine(row),
          mobile: row?.billing?.phone || null,
          remarks: row?.returnReason || null,
          items,
          // The revision's intro line names the seller: "X has received the item".
          sellerName: row.vendorName?.trim() || null,
          returnItems,
          resolutionType: isReplacement ? "Replacement" : "Refund",
          resolutionDetail: isReplacement
            ? "the seller will ship a replacement"
            : "the amount will be returned to your original payment method",
          isReplacement,
          refundAmount,
          refundTimeline: REFUND_TIMELINE_TEXT,
        },
        ready.templateDetails
      )
    );

    log(logTraceId, "info", {
      step: "return-completed-email-sent",
      message: "Return completed email sent",
      ondcOrderId: row.id,
      to: ready.to,
      isReplacement,
    });
  } catch (err) {
    log(logTraceId, "error", {
      step: "return-completed-email-failed",
      message: err?.message || String(err),
      ondcOrderId: row?.id,
    });
  }
};

// ===========================================================================
// 12. Refund Initiated  (+ the failure variant, which the spec has no template for)
// ===========================================================================
/**
 * @param {Object} params { row, refund, refundAmount, logTraceId }
 *   refund is the object executeBuyerRefund returns — { status, amount, refundId }.
 */
const sendOndcOrderRefundEmail = async ({ row, refund, refundAmount, logTraceId } = {}) => {
  try {
    const success = Boolean(refund?.status);
    const amount = refund?.amount ?? refundAmount;
    // Keyed on the gateway refund id, so a partial refund and a later second one on
    // the same order each get their own mail. Prefixed by outcome: a failed attempt
    // followed by a successful retry must not be silenced by the failure's claim.
    const eventKey = `refund:${success ? "ok" : "failed"}:${refund?.refundId || row?.id}`.slice(0, 64);
    const ready = await prepare({ row, eventKey, step: "refund-email-skip", logTraceId });
    if (!ready) return;

    const orderId = orderLabel(row);
    const subject = success
      ? subjects.refundInitiated(orderId)
      : "Your refund could not be processed";
    const body = success
      ? osRefundInitiatedTemplate(
          ready.name,
          {
            ondcOrderId: row.id,
            orderId,
            refundAmount: amount,
            refundTo: refundDestination(row),
            // The revision replaced the calculated {{refund_expected_date}} with a
            // duration, so this line now quotes the shared timeline.
            refundTimeline: REFUND_TIMELINE_TEXT,
            ...(await orderSummaryFor(row)),
          },
          ready.templateDetails
        )
      // No spec template for a failed refund — keep the existing generic one rather
      // than inventing copy for a case the document doesn't cover.
      : refundFailure({ name: ready.name, amount, transactionId: orderId }, ready.templateDetails);

    await sendEmail(ready.to, subject, body);
    log(logTraceId, "info", {
      step: "refund-email-sent",
      message: "Refund email sent",
      ondcOrderId: row.id,
      to: ready.to,
      success,
      amount,
    });
  } catch (err) {
    log(logTraceId, "error", {
      step: "refund-email-failed",
      message: err?.message || String(err),
      ondcOrderId: row?.id,
    });
  }
};

// ===========================================================================
// 13. Refund Processed / Credited
// ===========================================================================
/**
 * Sent when the gateway confirms the money actually landed — a different event from
 * 12, which fires when we ask.
 *
 * @param {Object} params { row, refundAmount, refundReferenceId, refundCreditedDate,
 *   refundId, logTraceId }
 */
const sendOndcRefundCreditedEmail = async ({
  row,
  refundAmount = null,
  refundReferenceId = null,
  refundCreditedDate = null,
  refundId = null,
  logTraceId,
} = {}) => {
  try {
    const eventKey = `refund:credited:${refundId || refundReferenceId || row?.id}`.slice(0, 64);
    const ready = await prepare({ row, eventKey, step: "refund-credited-email-skip", logTraceId });
    if (!ready) return;

    const orderId = orderLabel(row);
    await sendEmail(
      ready.to,
      subjects.refundCredited(refundAmount, orderId),
      osRefundCreditedTemplate(
        ready.name,
        {
          ondcOrderId: row.id,
          orderId,
          refundAmount,
          creditedTo: refundDestination(row),
          refundReferenceId,
          refundCreditedDate: dateTimeIST(refundCreditedDate || new Date()),
        },
        ready.templateDetails
      )
    );

    log(logTraceId, "info", {
      step: "refund-credited-email-sent",
      message: "Refund credited email sent",
      ondcOrderId: row.id,
      to: ready.to,
      refundAmount,
      refundReferenceId,
    });
  } catch (err) {
    log(logTraceId, "error", {
      step: "refund-credited-email-failed",
      message: err?.message || String(err),
      ondcOrderId: row?.id,
    });
  }
};

module.exports = {
  sendOndcOrderCancelledEmail,
  sendOndcReturnInitiatedEmail,
  sendOndcReturnPickupScheduledEmail,
  sendOndcReturnCompletedEmail,
  sendOndcOrderRefundEmail,
  sendOndcRefundCreditedEmail,
  resolveCorporateRecipient,
  refundDestination,
  FLOW,
};
