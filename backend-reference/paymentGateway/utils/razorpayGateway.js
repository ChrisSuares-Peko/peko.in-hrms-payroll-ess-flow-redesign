const Razorpay = require("razorpay");
const {
  validateWebhookSignature,
  validatePaymentVerification,
} = require("razorpay/dist/utils/razorpay-utils");
const { findServiceOperatorByAccessKey } = require("./checkAndFetchServiceDetails");
const operatorsData = require("./operatorsData.json");

const RAZORPAY_ACCESS_KEY = operatorsData["razorpayPaymentGateway"]["accessKey"];
// Stored on orders.paymentModeResponse / paymentGatewayOrders.paymentData so refund
// helpers and /complete can tell a Razorpay order from a Cashfree one (CCAvenue does
// the same with gateway: "CC_AVUNUE"). Cashfree rows carry no tag.
const RAZORPAY_GATEWAY = "RAZORPAY";
// Must equal the chart-of-accounts row the journal debits (lineItemBuilder matches account_name on it).
const RAZORPAY_GATEWAY_NAME = "Razorpay";

// One key pair for every service: vendor.optional1 = key_id, optional2 = key_secret,
// optional3 = webhook secret (set per webhook in the Razorpay dashboard, not the key secret).
const loadRazorpayCredentials = async () => {
  const row = await findServiceOperatorByAccessKey(RAZORPAY_ACCESS_KEY);
  if (!row || Object.prototype.hasOwnProperty.call(row, "error")) return null;
  const keyId = row.vendor?.optional1;
  const keySecret = row.vendor?.optional2;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret, webhookSecret: row.vendor?.optional3 || null };
};

const getClient = (creds) => new Razorpay({ key_id: creds.keyId, key_secret: creds.keySecret });

const toPaise = (rupees) => Math.round(Number(rupees) * 100);
const toRupees = (paise) => Number(paise || 0) / 100;

// Razorpay payment.status → the Cashfree payment_status strings every consumer switches on.
// `refunded` is deliberately not SUCCESS: a refunded payment must never complete an order.
const PAYMENT_STATUS_MAP = {
  captured: "SUCCESS",
  authorized: "PENDING",
  created: "PENDING",
  failed: "FAILED",
  refunded: "REFUNDED",
};
const STATUS_RANK = { SUCCESS: 0, PENDING: 1, REFUNDED: 2, FAILED: 3 };

const REFUND_STATUS_MAP = { pending: "PENDING", processed: "SUCCESS", failed: "FAILED" };

const cardType = (card) => {
  const t = String(card?.type || "").toLowerCase();
  if (t === "debit") return "debit_card";
  if (t === "prepaid") return "prepaid_card";
  return "credit_card";
};

const paymentGroupFor = (p) => {
  switch (p.method) {
    case "card":
      return cardType(p.card);
    case "upi":
      return "upi";
    case "netbanking":
      return "net_banking";
    case "wallet":
      return "wallet";
    case "emi":
      return "credit_card_emi";
    case "cardless_emi":
      return "cardless_emi";
    case "paylater":
      return "pay_later";
    default:
      return p.method || null;
  }
};

// Shape mirrors Cashfree's payment_method object (services/invoiceAndReceipt.js
// derivePaymentModeLabel, others/utils/paymentInstrument.js read it).
const paymentMethodFor = (p) => {
  switch (p.method) {
    case "card":
    case "emi":
      return {
        card: {
          card_type: cardType(p.card),
          card_network: p.card?.network || null,
          card_number: p.card?.last4 ? `XXXXXXXXXXXX${p.card.last4}` : null,
          card_bank_name: p.card?.issuer || null,
        },
      };
    case "upi":
      return { upi: { upi_id: p.vpa || p.upi?.vpa || null } };
    case "netbanking":
      return { netbanking: { netbanking_bank_name: p.bank || null } };
    case "wallet":
      return { wallet: { provider: p.wallet || null } };
    case "cardless_emi":
      return { cardless_emi: { provider: p.provider || null } };
    default:
      return p.method ? { [p.method]: {} } : null;
  }
};

const normalizeRazorpayPayment = (p, { receipt = null } = {}) => ({
  gateway: RAZORPAY_GATEWAY,
  paymentGatewayName: RAZORPAY_GATEWAY_NAME,
  order_id: p.order_id,
  payment_id: p.id,
  receipt,
  payment_status: PAYMENT_STATUS_MAP[p.status] || "FAILED",
  payment_amount: toRupees(p.amount),
  payment_currency: p.currency || "INR",
  payment_group: paymentGroupFor(p),
  payment_method: paymentMethodFor(p),
  bank_reference:
    p.acquirer_data?.rrn ||
    p.acquirer_data?.upi_transaction_id ||
    p.acquirer_data?.bank_transaction_id ||
    null,
  payment_time: p.created_at ? new Date(p.created_at * 1000).toISOString() : null,
  payment_message: p.error_description || null,
  error_code: p.error_code || null,
  fee: toRupees(p.fee),
  tax: toRupees(p.tax),
  method: p.method || null,
  razorpay_status: p.status,
});

const normalizeRazorpayRefund = (r) => ({
  gateway: RAZORPAY_GATEWAY,
  refund_id: r.receipt || r.id,
  razorpay_refund_id: r.id,
  payment_id: r.payment_id,
  refund_status: REFUND_STATUS_MAP[r.status] || String(r.status || "").toUpperCase(),
  refund_amount: toRupees(r.amount),
  refund_currency: r.currency || "INR",
  refund_speed: r.speed_processed || r.speed_requested || null,
  refund_note: r.notes?.reason || r.notes?.corporateTxnId || null,
  refund_arn: r.acquirer_data?.arn || null,
  created_at: r.created_at ? new Date(r.created_at * 1000).toISOString() : null,
});

const createRazorpayOrder = async ({ creds, amountRupees, receipt, notes }) =>
  getClient(creds).orders.create({
    amount: toPaise(amountRupees),
    currency: "INR",
    receipt,
    notes,
    payment_capture: 1,
  });

// Returns the order's payments in Cashfree shape, captured first — consumers persist
// [0] as the payment the order was paid with (createPGTransaction) and refund by its payment_id.
const fetchRazorpayOrderPayments = async ({ creds, razorpayOrderId, receipt }) => {
  const client = getClient(creds);
  const collection = await client.orders.fetchPayments(razorpayOrderId);
  const items = Array.isArray(collection?.items) ? collection.items : [];
  const expanded = await Promise.all(
    items.map(async (p) => {
      // The order→payments listing carries card_id only; the label on receipts needs last4/network.
      if ((p.method === "card" || p.method === "emi") && !p.card) {
        try {
          return await client.payments.fetch(p.id, { "expand[]": "card" });
        } catch (_) {
          return p;
        }
      }
      return p;
    })
  );
  return expanded
    .map((p) => normalizeRazorpayPayment(p, { receipt }))
    .sort((a, b) => (STATUS_RANK[a.payment_status] ?? 9) - (STATUS_RANK[b.payment_status] ?? 9));
};

// Same rule as the Cashfree handlers: any SUCCESS wins, else any PENDING, else FAILURE.
const deriveOrderStatus = (payments) => {
  if (payments.some((p) => p.payment_status === "SUCCESS")) return "SUCCESS";
  if (payments.some((p) => p.payment_status === "PENDING")) return "PENDING";
  return "FAILURE";
};

const verifyCheckoutSignature = ({ creds, razorpayOrderId, razorpayPaymentId, signature }) => {
  try {
    return validatePaymentVerification(
      { order_id: razorpayOrderId, payment_id: razorpayPaymentId },
      signature,
      creds.keySecret
    );
  } catch (_) {
    return false;
  }
};

const verifyWebhookSignature = ({ rawBody, signature, webhookSecret }) => {
  if (!rawBody || !signature || !webhookSecret) return false;
  try {
    return validateWebhookSignature(rawBody.toString("utf8"), signature, webhookSecret);
  } catch (_) {
    return false;
  }
};

// Razorpay refunds by payment id (Cashfree refunds by order id). `receipt` is the
// idempotency key per payment — a duplicate is rejected, not re-issued.
const refundRazorpayPayment = async ({ paymentId, amountRupees, receipt, notes, speed = "normal", creds = null }) => {
  const resolved = creds || (await loadRazorpayCredentials());
  if (!resolved) throw new Error("Razorpay credentials not configured");
  const refund = await getClient(resolved).payments.refund(paymentId, {
    amount: toPaise(amountRupees),
    speed,
    receipt,
    notes,
  });
  return normalizeRazorpayRefund(refund);
};

// SDK errors carry the API body under error.error; surface it the way axios errors do.
const razorpayErrorBody = (error) => error?.error ?? error?.response?.data ?? error?.message ?? error;

module.exports = {
  RAZORPAY_ACCESS_KEY,
  RAZORPAY_GATEWAY,
  loadRazorpayCredentials,
  toPaise,
  toRupees,
  normalizeRazorpayPayment,
  normalizeRazorpayRefund,
  createRazorpayOrder,
  fetchRazorpayOrderPayments,
  deriveOrderStatus,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  refundRazorpayPayment,
  razorpayErrorBody,
};
