const MAX_LENGTH = 64;
const MAX_UNWRAP_DEPTH = 5;

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

const CCAVENUE_OPTION_LABELS = {
  OPTCRDC: 'Credit Card',
  OPTDBCRD: 'Debit Card',
  OPTNBK: 'Internet Banking',
  OPTUPI: 'UPI',
  OPTWLT: 'Digital Wallet',
  OPTCASHC: 'Cash Card',
  OPTEMI: 'EMI',
  OPTMOBP: 'Mobile Payments',
};

const CCAVENUE_MODE_LABELS = {
  'net banking': 'Internet Banking',
  'credit card': 'Credit Card',
  'debit card': 'Debit Card',
  'unified payments': 'UPI',
  upi: 'UPI',
  wallet: 'Digital Wallet',
  'cash card': 'Cash Card',
  emi: 'EMI',
};

const toLabel = (code) => {
  if (!code) return null;
  const key = String(code).trim().toLowerCase();
  if (!key) return null;
  if (INSTRUMENT_LABELS[key]) return INSTRUMENT_LABELS[key];
  return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const codeFromMethod = (method) => {
  if (!method) return null;
  if (typeof method === 'string') return method;
  if (typeof method === 'object') return Object.keys(method)[0] || null;
  return null;
};

const cashfreeCode = (payload) => {
  const { data } = payload;
  if (data && typeof data === 'object') {
    const nested =
      codeFromMethod(data.authorization_details?.payment_method) ||
      codeFromMethod(data.payment_method) ||
      data.payment_group ||
      data.payment?.payment_group ||
      codeFromMethod(data.payment?.payment_method);
    if (nested) return nested;
  }
  return payload.payment_group || codeFromMethod(payload.payment_method) || null;
};

const labelFromPayload = (payload) => {
  const code = cashfreeCode(payload);
  if (code) return toLabel(code);
  const option = CCAVENUE_OPTION_LABELS[String(payload.order_option_type || '').trim().toUpperCase()];
  if (option) return option;
  return CCAVENUE_MODE_LABELS[String(payload.payment_mode || '').trim().toLowerCase()] || null;
};

const pickFromList = (list) => list.find((entry) => entry?.payment_status === 'SUCCESS') || list[0];

const numericEntries = (payload) =>
  Object.keys(payload)
    .filter((key) => /^\d+$/.test(key))
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => payload[key]);

const findLabel = (value, depth = 0) => {
  if (!value || typeof value !== 'object' || depth > MAX_UNWRAP_DEPTH) return null;
  if (Array.isArray(value)) return findLabel(pickFromList(value), depth + 1);
  const label = labelFromPayload(value);
  if (label) return label;
  if (value.pgResponse && typeof value.pgResponse === 'object') {
    return findLabel(value.pgResponse, depth + 1);
  }
  const entries = numericEntries(value);
  return entries.length ? findLabel(pickFromList(entries), depth + 1) : null;
};

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

  // A corporate card receipt carries our own marker and nothing Cashfree-shaped.
  if (parsed && typeof parsed === 'object' && parsed.gateway === 'CORPORATE_CARD') {
    return 'Corporate Card (Issued by Pine Labs)';
  }

  const label = findLabel(parsed);
  if (!label) return null;

  const full = /\+\s*WALLET/i.test(String(paymentMode || '')) ? `${label} + Wallet` : label;
  return full.slice(0, MAX_LENGTH);
};
