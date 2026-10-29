/**
 * Confirmation email + cart cleanup for the PG-direct confirm path.
 * (Previously only lived inside confirmOndcOrder, which the FE no longer calls.)
 */

const ondcOrders = require("../models/entities/ondc_order");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const corporateUserEntity = require("../models/entities/corporateUser");
const { findOne: findCorporateUser } = require("../models/use-cases/corporateUser");
const { findOneOrder, updateOneOrder } = require("../models/use-cases/order");
const { removeOndcProductsFromCart } = require("../models/use-cases/cart");
const emailer = require("../utils/emailer");
const { ondcOrderFailedTemplate } = require("../utils/emailTemplate/ecommerce");
const {
  osOrderConfirmedTemplate,
  subjects,
} = require("../utils/emailTemplate/officeSuppliesNotifications");
const { partnerLogos } = require("../utils/partnerLogos");
const { customLog } = require("../utils/loggerHelper");
const { buildEmailItemRows } = require("../utils/ondcOrderItemsForEmail");
const { getDeliveryAddressLine } = require("../utils/ondcTracking");
const { dateIST, dateTimeIST } = require("../utils/emailTemplate/ondcShell");
const { findCheckoutConfirmSummary } = require("../models/use-cases/ondc_checkout_confirm");

const FLOW = "ondcPgDirectConfirm";

const parseOrderResponse = (raw) => {
  if (!raw) return {};
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (_) {
    return {};
  }
};

/**
 * Prefer credential-based lookup (same as confirmOndcOrder), then corporate PK.
 */
const resolveCorporateRecipient = async (paymentData) => {
  if (paymentData?.userId) {
    const byCred = await findCorporateUser({ corporateId: paymentData.userId });
    if (byCred?.email) return byCred;
  }
  if (paymentData?.corporateId) {
    const byPk = await corporateUserEntity.findOne({
      where: { id: paymentData.corporateId },
      raw: true,
    });
    if (byPk?.email) return byPk;
  }
  return null;
};

/**
 * The order-confirmation mail (spec template 1), for a whole checkout.
 *
 * Per CHECKOUT, not per seller: this is the one mail that spans every seller the
 * basket hit, which is why it carries an item table PER SELLER — those parcels
 * arrive separately and the buyer needs to know which is coming from whom. The
 * per-seller progress mails that follow are a different service
 * (services/ondcOrderStatusNotify.js).
 *
 * Exported so confirmOndcOrder (the legacy FE path) and the PG-direct path below
 * cannot drift into sending two differently-shaped confirmations.
 *
 * The 2026-08-24 spec revision deleted the standalone Payment Receipt template
 * and folded its four lines into this one, so `txn` (the `orders` row for this
 * paymentRef) is now part of the input. Callers already hold it — the PG-direct
 * path reads it for the ondcEmailSentAt stamp — so this costs no extra query.
 *
 * @param {Array} rows ondcOrders rows for one paymentRef
 * @param {Object} [txn] the `orders` row: paymentMode, amountInINR, transactionDate
 * @returns {Promise<{subject: string, body: string, orderIds: string[]}>}
 */
const buildOrderConfirmedMail = async ({ rows, name, corporate, templateDetails, txn }) => {
  const orders = Array.isArray(rows) ? rows.filter(Boolean) : [];
  const orderIds = orders.map((r) => r.orderId || r.transactionId).filter(Boolean);
  const sellerNames = [...new Set(orders.map((r) => r.vendorName?.trim()).filter(Boolean))];

  const groups = [];
  for (const row of orders) {
    groups.push({
      sellerName: row.vendorName?.trim() || null,
      orderId: row.orderId || row.transactionId,
      items: await buildEmailItemRows(row),
      total: row.amountPaid ?? row.totalAmount,
    });
  }

  const orderTotal = orders.reduce((sum, row) => {
    const amount = Number(row.amountPaid ?? row.totalAmount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  // The whole basket is delivered by its SLOWEST seller, so the buyer-facing ETA
  // is the latest of them — quoting the earliest would promise something no
  // single seller committed to.
  const etas = orders
    .map((row) => (row.expectedDeliveryDate ? new Date(row.expectedDeliveryDate).getTime() : null))
    .filter((value) => Number.isFinite(value));
  const expectedDelivery = etas.length ? dateIST(new Date(Math.max(...etas))) : null;

  const deliveryAddress =
    getDeliveryAddressLine(orders[0]) ||
    [orders[0]?.billing?.name || corporate?.companyName, orders[0]?.billing?.address?.area_code]
      .filter(Boolean)
      .join(", ") ||
    null;

  return {
    subject: subjects.orderConfirmed(orderIds),
    body: osOrderConfirmedTemplate(
      name,
      {
        // A track link needs one order; a multi-seller checkout has no single
        // order page, so those mails carry Manage Orders alone.
        ondcOrderId: orders.length === 1 ? orders[0].id : null,
        orderIds,
        sellerNames,
        deliveryAddress,
        mobileNumber: orders[0]?.billing?.phone || null,
        remarks: orders[0]?.billing?.remarks || null,
        expectedDelivery,
        orderTotal: orderTotal || null,
        groups,
        // The absorbed payment receipt. Falls back to the summed order total when
        // the txn row is unavailable, and each line drops itself if still empty.
        amountPaid: txn?.amountInINR ?? orderTotal ?? null,
        paymentMethod: txn?.paymentMode || "Payment Gateway",
        transactionId: txn?.corporateTxnId || orders[0]?.paymentRef || null,
        paymentDateTime: dateTimeIST(txn?.transactionDate || new Date()),
      },
      templateDetails
    ),
    orderIds,
  };
};

const markEmailSent = async (paymentRef, logTraceId) => {
  try {
    const txn = await findOneOrder({ corporateTxnId: String(paymentRef) });
    const parsed = parseOrderResponse(txn?.orderResponse);
    await updateOneOrder(String(paymentRef), {
      orderResponse: JSON.stringify({
        ...parsed,
        ondcEmailSentAt: new Date().toISOString(),
      }),
    });
  } catch (err) {
    customLog(
      logTraceId,
      "error",
      {
        flow: FLOW,
        step: "email-stamp-failed",
        message: "Could not stamp ondcEmailSentAt",
        paymentRef: String(paymentRef),
        error: err?.message || String(err),
      },
      "VENDOR"
    );
  }
};

/**
 * Once per paymentRef when enough confirmed rows exist: email + cart clear.
 * Never throws to callers.
 */
const maybeNotifyOndcCheckoutAndClearCart = async ({
  paymentRef,
  ctx,
  logTraceId,
} = {}) => {
  if (!paymentRef) return;

  try {
    const txn = await findOneOrder({ corporateTxnId: String(paymentRef) });
    const parsed = parseOrderResponse(txn?.orderResponse);
    if (parsed.ondcEmailSentAt) {
      customLog(
        logTraceId,
        "info",
        {
          flow: FLOW,
          step: "email-skip",
          message: "Confirmation email already sent for this paymentRef",
          paymentRef: String(paymentRef),
          ondcEmailSentAt: parsed.ondcEmailSentAt,
        },
        "VENDOR"
      );
      return;
    }

    const rows = await ondcOrders.findAll({
      where: { paymentRef: String(paymentRef) },
      order: [["id", "ASC"]],
      raw: true,
    });
    // Confirm-after-payment checkouts (services/ondcConfirmAfterPayment.js) wait for
    // every seller to settle, confirmed or failed. A failed seller never gets a row,
    // so counting rows against the checkout's groups would wait forever — and the
    // confirmed sellers' buyer would never get the mail. Older checkouts keep the
    // row-count gate.
    let confirmSummary = null;
    try {
      confirmSummary = await findCheckoutConfirmSummary(paymentRef);
    } catch (summaryErr) {
      customLog(
        logTraceId,
        "error",
        {
          flow: FLOW,
          step: "email-gate-summary-failed",
          message: "Could not read confirm attempts — using the row-count gate",
          paymentRef: String(paymentRef),
          error: summaryErr?.message || String(summaryErr),
        },
        "VENDOR"
      );
    }

    let expected;
    let ready;
    if (confirmSummary) {
      expected = confirmSummary.attempts.filter((a) => a.status === "CONFIRMED").length;
      ready =
        confirmSummary.checkout.status === "COMPLETED" &&
        expected > 0 &&
        rows.length >= expected;
    } else {
      expected = Number(ctx?.ondcGroupCount) || 0;
      ready = rows.length > 0 && (expected <= 0 || rows.length >= expected);
    }
    if (!ready) {
      customLog(
        logTraceId,
        "info",
        {
          flow: FLOW,
          step: "email-skip",
          message: "Waiting for more seller confirms before email/cart clear",
          paymentRef: String(paymentRef),
          orderCount: rows.length,
          expectedGroupCount: expected,
          checkoutStatus: confirmSummary?.checkout?.status || null,
        },
        "VENDOR"
      );
      return;
    }

    const corporate = await resolveCorporateRecipient(ctx?.paymentData || {});
    const to = corporate?.email;
    if (!to) {
      customLog(
        logTraceId,
        "warn",
        {
          flow: FLOW,
          step: "email-skip",
          message: "No corporate email resolved — skipping confirmation mail",
          paymentRef: String(paymentRef),
          corporateId: ctx?.paymentData?.corporateId || null,
          userId: ctx?.paymentData?.userId || null,
        },
        "VENDOR"
      );
    } else {
      const name = corporate?.contactPersonName || corporate?.name || "there";
      const templateDetails = corporate?.registeredBy
        ? await fetchPartnerDetails(corporate.registeredBy)
        : await partnerLogos();
      const { subject, body, orderIds } = await buildOrderConfirmedMail({
        rows,
        name,
        corporate,
        templateDetails,
        // Already fetched at the top of this function for the idempotency check —
        // reused here for the payment lines rather than read a second time.
        txn,
      });
      await new Promise((resolve) => {
        emailer.email(to, subject, body, () => resolve());
      });
      customLog(
        logTraceId,
        "info",
        {
          flow: FLOW,
          step: "email-send",
          message: "Confirmation email sent (PG-direct path)",
          paymentRef: String(paymentRef),
          to,
          orderIds,
        },
        "VENDOR"
      );
    }

    await markEmailSent(paymentRef, logTraceId);

    try {
      const orderedItems = rows.flatMap((r) =>
        (r.items || []).map((ci) => ({
          ondcProductId: ci.ondcProductId,
          bppUri: r.bppUri,
          ondcVendorId: r.providerId,
        }))
      );
      if (orderedItems.length) {
        await removeOndcProductsFromCart(orderedItems, {
          corporateId: ctx?.corporateUserId,
          subCorporateId: ctx?.subCorporateId,
        });
        customLog(
          logTraceId,
          "info",
          {
            flow: FLOW,
            step: "cart-clear",
            message: "Cleared confirmed ONDC items from cart",
            paymentRef: String(paymentRef),
            itemCount: orderedItems.length,
          },
          "VENDOR"
        );
      }
    } catch (cartErr) {
      customLog(
        logTraceId,
        "error",
        {
          flow: FLOW,
          step: "cart-clear-failed",
          message: "Failed to clear cart after confirm",
          paymentRef: String(paymentRef),
          error: cartErr?.message || String(cartErr),
        },
        "VENDOR"
      );
    }
  } catch (err) {
    customLog(
      logTraceId,
      "error",
      {
        flow: FLOW,
        step: "email-failed",
        message: "maybeNotifyOndcCheckoutAndClearCart failed",
        paymentRef: String(paymentRef),
        error: err?.message || String(err),
      },
      "VENDOR"
    );
  }
};

/** Exported for unit tests — send failed-order mail is unused on PG path for now. */
const buildFailedEmailBody = async (name, groups, registeredBy = null) => {
  const templateDetails = registeredBy
    ? await fetchPartnerDetails(registeredBy)
    : await partnerLogos();
  return ondcOrderFailedTemplate(name, groups, templateDetails);
};

module.exports = {
  maybeNotifyOndcCheckoutAndClearCart,
  buildOrderConfirmedMail,
  resolveCorporateRecipient,
  buildFailedEmailBody,
  FLOW,
};
