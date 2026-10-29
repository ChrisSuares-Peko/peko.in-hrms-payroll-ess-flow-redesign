/**
 * orders.paymentMode only records the funding split (PAYMENT GATEWAY / WALLET / both).
 * The instrument the customer actually used already arrives in the Cashfree payments
 * payload that every order writer persists to orders.paymentModeResponse — this derives
 * the short label stored alongside it in orders.paymentInstrument.
 */

// Width of orders.paymentInstrument.
const MAX_LENGTH = 64;

// Cashfree payment_group / payment_method codes. "wallet" here is a vendor wallet
// (Paytm, PhonePe), never the Peko wallet — hence the "Digital Wallet" label.
const INSTRUMENT_LABELS = {
  upi: 'UPI',
  upi_credit_card: 'UPI',
  upi_debit_card: 'UPI',
  upi_ppi: 'UPI',
  credit_card: 'Credit Card',
  credit_card_emi: 'Credit Card',
  emi_credit_card: 'Credit Card',
  card_emi: 'Credit Card',
  debit_card: 'Debit Card',
  debit_card_emi: 'Debit Card',
  emi_debit_card: 'Debit Card',
  card: 'Card',
  net_banking: 'Internet Banking',
  netbanking: 'Internet Banking',
  wallet: 'Digital Wallet',
  app: 'Digital Wallet',
  cardless_emi: 'Cardless EMI',
  paylater: 'Pay Later',
  banktransfer: 'Bank Transfer',
  enach: 'Net Banking / NACH',
  emandate: 'Net Banking / NACH',
  nach: 'Net Banking / NACH',
};

// Unknown codes are surfaced readably rather than dropped — a new Cashfree instrument
// should show up in the report as itself, not silently fall back to "PAYMENT GATEWAY".
const toLabel = (code) => {
  if (!code) return null;
  const key = String(code).trim().toLowerCase();
  if (!key) return null;
  if (INSTRUMENT_LABELS[key]) return INSTRUMENT_LABELS[key];
  return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

// payment_method is a string on subscription payloads and a single-key object
// ({ upi: {...} }) on one-time order payloads.
const codeFromMethod = (method) => {
  if (!method) return null;
  if (typeof method === 'string') return method;
  if (typeof method === 'object') return Object.keys(method)[0] || null;
  return null;
};

const resolveCode = (parsed) => {
  if (!parsed || typeof parsed !== 'object') return null;
  // Subscription and webhook payloads nest everything under data; fall through to the
  // top level when they don't, so an unexpected `data` key can't mask a payment_group.
  if (parsed.data && typeof parsed.data === 'object') {
    const nested =
      codeFromMethod(parsed.data.authorization_details?.payment_method) ||
      codeFromMethod(parsed.data.payment_method) ||
      parsed.data.payment_group;
    if (nested) return nested;
  }
  // payment_group is preferred over the payment_method key — it distinguishes
  // credit_card from debit_card, where payment_method only says "card".
  return parsed.payment_group || codeFromMethod(parsed.payment_method) || null;
};

/**
 * @param {string|object|Array} paymentModeResponse raw orders.paymentModeResponse
 * @param {string} paymentMode raw orders.paymentMode, used only to detect a split payment
 * @returns {string|null} e.g. "UPI", "Credit Card", "UPI + Wallet"; null when not derivable
 */
exports.derivePaymentInstrument = (paymentModeResponse, paymentMode) => {
  if (!paymentModeResponse) return null;

  let parsed = paymentModeResponse;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (_) {
      return null;
    }
  }

  // Writers wrap the payload inconsistently — plain object, [obj] and [[obj]] all occur.
  while (Array.isArray(parsed)) {
    parsed = parsed.find((entry) => entry?.payment_status === 'SUCCESS') || parsed[0];
  }

  const label = toLabel(resolveCode(parsed));
  if (!label) return null;

  // Split payments debit the Peko wallet for the remainder — keep both legs visible.
  const full = /\+\s*WALLET/i.test(String(paymentMode || '')) ? `${label} + Wallet` : label;

  // Must never exceed the column width: this runs inside the order INSERT, and a
  // truncation error there would fail a payment the customer has already made.
  return full.slice(0, MAX_LENGTH);
};
