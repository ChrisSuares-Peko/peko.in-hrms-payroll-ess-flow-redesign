/**
 * Office Supplies (ONDC) — spec template 13 (Refund Processed / Credited).
 *
 * This service used to own three templates. The 2026-08-24 spec revision deleted
 * 2 (Payment Receipt) — its four lines moved into purchase's Order Confirmation
 * mail — and 3 (Payment Failed), which now sends nothing at all. Only 13 is left,
 * and it stays here because it fires on the Cashfree REFUND_STATUS_WEBHOOK.
 *
 * Same house style as purchase's ondc*Notify services: resolve recipient, render,
 * emailer.email(), customLog, never throw. A mail failure must never change a
 * gateway callback's response — Cashfree retries webhooks, and a retry storm over
 * an email is strictly worse than one missing email.
 *
 * Idempotency does NOT use purchase's notification ledger (that table is
 * purchase's to write): the webhook's existing `refundStatus === "SUCCESS"`
 * short-circuit already makes this send-once.
 */

const { Op } = require("sequelize");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const emailer = require("../utils/emailer");
const {
  osRefundCreditedTemplate,
  subjects,
  dateTimeIST,
} = require("../utils/emailTemplate/officeSuppliesPayment");
const { partnerLogos } = require("../utils/partnerLogos");
const { customLog } = require("../utils/loggerHelper");
const corporateUserEntity = require("../models/entities/corporateUser");
const subCorporateUserEntity = require("../models/entities/subCorporateUsers");
const {
  ondcOrdersReadOnly,
  ondcOrderRefundsReadOnly,
  ondcProductsReadOnly,
} = require("../models/entities/ondc_order_readonly");

const FLOW = "ondcPaymentNotify";

const log = (logTraceId, level, data) =>
  customLog(logTraceId, level, { flow: FLOW, ...data }, "VENDOR");

// paymentGateway's emailer takes an object, unlike purchase's positional one.
const sendEmail = (to, subject, body) =>
  new Promise((resolve) => {
    emailer.email({ to, subject, body }, () => resolve());
  });

const trimmed = (value) => (typeof value === "string" ? value.trim() : "");

const firstNonEmpty = (...values) => {
  for (const value of values) {
    const candidate = trimmed(value);
    if (candidate) return candidate;
  }
  return "";
};

/**
 * The item rows for the "Order summary:" table the revision added to this mail.
 *
 * Mirrors purchase's utils/ondcOrderItemsForEmail.js, including its precedence:
 * `quote.rows` wins over the cart snapshot, because the quote is what the seller
 * accepted and what the buyer was actually charged for. Thumbnails come from the
 * catalog snapshot, which purchase purges on a schedule — so a missing image is
 * the normal case for an older order, and the whole thing is wrapped so a lookup
 * failure costs a picture rather than the email.
 */
const buildItemRows = async (row) => {
  const asArray = (v) => (Array.isArray(v) ? v : []);
  const fromQuote = asArray(row?.quote?.rows).filter((r) => r && r.titleType === "item");
  const cartByName = new Map(
    asArray(row?.items)
      .filter((i) => i && i.productName)
      .map((i) => [String(i.productName), i])
  );

  const rows = fromQuote.length
    ? fromQuote.map((r) => {
        const productName = r.productName || r.title || null;
        const cartItem = cartByName.get(String(productName));
        return {
          ondcProductId: cartItem?.ondcProductId || r.itemId || null,
          productName,
          quantity: r.quantity || null,
          price: r.amount ?? null,
        };
      })
    : asArray(row?.items).map((i) => ({
        ondcProductId: i.ondcProductId || null,
        productName: i.productName || null,
        quantity: parseInt(i.productQuantity, 10) || null,
        price: null,
      }));

  if (!rows.length) return rows;

  try {
    const ids = [...new Set(rows.map((r) => r.ondcProductId).filter(Boolean).map(String))];
    if (!ids.length || !row?.transactionId) return rows.map((r) => ({ ...r, image: null }));

    const products = await ondcProductsReadOnly.findAll({
      where: { transactionId: String(row.transactionId), ondcProductId: { [Op.in]: ids } },
      attributes: ["ondcProductId", "images", "symbol"],
      raw: true,
    });
    const imageById = new Map(
      products.map((p) => {
        const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
        return [String(p.ondcProductId), images[0] || p.symbol || null];
      })
    );
    return rows.map((r) => ({
      ...r,
      image: r.ondcProductId ? imageById.get(String(r.ondcProductId)) || null : null,
    }));
  } catch (_) {
    return rows.map((r) => ({ ...r, image: null }));
  }
};

/**
 * Recipient for the CHECKOUT mails, from the request context — mirrors purchase's
 * utils/ondcRecipient.js, including the sub-corporate fallback that the older
 * corporateUserId-only lookup silently skipped.
 */
const resolveCheckoutRecipient = async ({ corporateUserId, subCorporateUserId, addressEmail }) => {
  if (corporateUserId) {
    const corporate = await corporateUserEntity.findOne({ where: { id: corporateUserId }, raw: true });
    const email = firstNonEmpty(corporate?.email, addressEmail);
    if (email) {
      return {
        email,
        name: firstNonEmpty(corporate?.contactPersonName, corporate?.name) || "there",
        corporate: corporate || null,
      };
    }
  }
  if (subCorporateUserId) {
    const subUser = await subCorporateUserEntity.findOne({ where: { id: subCorporateUserId }, raw: true });
    const email = firstNonEmpty(subUser?.email, addressEmail);
    if (email) return { email, name: firstNonEmpty(subUser?.name) || "there", corporate: null };
  }
  const fallback = firstNonEmpty(addressEmail);
  return fallback ? { email: fallback, name: "there", corporate: null } : { email: null, name: "there", corporate: null };
};
// ===========================================================================
// 13. Refund Credited
// ===========================================================================
/**
 * Cashfree confirms a refund settled. The webhook only knows the refund id — but
 * that id is not opaque: purchase mints it as `refund_ondc_<ondcOrderId>_<cents>`
 * (services/ondcOrderRefund.js), so it names the order. The ledger row is looked
 * up first anyway, with the id-parse as the fallback for a truncated/legacy id.
 *
 * @param {Object} params { refund (Cashfree refund object), corporateTxnId, logTraceId }
 */
const parseOndcOrderIdFromRefundId = (refundId) => {
  const match = /^refund_ondc_(\d+)_/.exec(String(refundId || ""));
  return match ? Number(match[1]) : null;
};

const sendOndcRefundCreditedEmail = async ({ refund, corporateTxnId, logTraceId = null } = {}) => {
  try {
    const refundId = trimmed(refund?.refund_id);
    if (!refundId) return;

    // Only a settled refund is "credited". Anything else is still in flight, and
    // template 12 (refund initiated, sent by purchase) already covers that.
    const status = String(refund?.refund_status || "").toUpperCase();
    if (status && status !== "SUCCESS") {
      log(logTraceId, "info", {
        step: "refund-credited-skip",
        message: "Refund is not settled yet — no credited mail",
        refundId,
        refundStatus: status,
      });
      return;
    }

    const ledgerRow = await ondcOrderRefundsReadOnly.findOne({
      where: { refundId },
      raw: true,
    });
    const ondcOrderId = ledgerRow?.ondcOrderId || parseOndcOrderIdFromRefundId(refundId);
    if (!ondcOrderId) {
      log(logTraceId, "warn", {
        step: "refund-credited-skip",
        message: "Could not map this refund to an ONDC order — no mail",
        refundId,
        corporateTxnId: corporateTxnId ? String(corporateTxnId) : null,
      });
      return;
    }

    const row = await ondcOrdersReadOnly.findOne({ where: { id: ondcOrderId }, raw: true });
    if (!row) {
      log(logTraceId, "warn", {
        step: "refund-credited-skip",
        message: "Refund ledger points at an order this service cannot see — no mail",
        refundId,
        ondcOrderId,
      });
      return;
    }

    const { email: to, name, corporate } = await resolveCheckoutRecipient({
      corporateUserId: row.corporateUserId,
      subCorporateUserId: row.subCorporateUserId,
      addressEmail: row.billing?.email,
    });
    if (!to) {
      log(logTraceId, "warn", {
        step: "refund-credited-skip",
        message: "No recipient resolved — skipping refund credited mail",
        refundId,
        ondcOrderId,
      });
      return;
    }

    const amount = refund?.refund_amount ?? ledgerRow?.amount ?? null;
    const templateDetails = corporate?.registeredBy
      ? await fetchPartnerDetails(corporate.registeredBy)
      : await partnerLogos();
    const orderId = row.orderId || row.transactionId;
    await sendEmail(
      to,
      subjects.refundCredited(amount, orderId),
      osRefundCreditedTemplate(
        name,
        {
          ondcOrderId,
          orderId,
          refundAmount: amount,
          creditedTo: "Your original payment method",
          // The ARN is the number a buyer's own bank will recognise, so it leads.
          refundReferenceId: firstNonEmpty(refund?.refund_arn, refund?.cf_refund_id, refundId),
          refundCreditedDate: dateTimeIST(refund?.processed_at || new Date()),
          // The order-summary table the revision added to this template.
          items: await buildItemRows(row),
          orderTotal: row.amountPaid ?? row.totalAmount ?? null,
        },
        templateDetails
      )
    );

    log(logTraceId, "info", {
      step: "refund-credited-email-sent",
      message: "Refund credited email sent",
      refundId,
      ondcOrderId,
      to,
      amount,
    });
  } catch (err) {
    log(logTraceId, "error", {
      step: "refund-credited-email-failed",
      message: err?.message || String(err),
      refundId: refund?.refund_id || null,
    });
  }
};

module.exports = {
  sendOndcRefundCreditedEmail,
  parseOndcOrderIdFromRefundId,
  resolveCheckoutRecipient,
  FLOW,
};
