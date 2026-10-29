const crypto = require("crypto");
const zlib = require("zlib");
const { default: axios } = require("axios");
const { customLog } = require("./loggerHelper");
const { findServiceOperatorByAccessKey } = require("./checkAndFetchServiceDetails");
const operatorsData = require("./operatorsData.json");

const AIRPAY = "AIRPAY";
// Must equal the chart-of-accounts row the journal debits (lineItemBuilder matches account_name on it).
const AIRPAY_GATEWAY_NAME = "Airpay";
const accessKey = operatorsData["airPayPaymentGateway"]["accessKey"];

// Sandbox and live share these hosts; the merchant id decides the mode
const CHECKOUT_URL = "https://payments.airpay.co.in/pay/v4/";

// vendors row: optional1 merchant id, optional2 username, optional3 password,
// optional4 client id, optional5 client secret, optional6 API key, apiUrl kraken API base
const loadAirpayConfig = async () => {
  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
  const vendor = serviceDetails?.vendor;
  const config = {
    merchantId: vendor?.optional1,
    username: vendor?.optional2,
    password: vendor?.optional3,
    clientId: vendor?.optional4,
    clientSecret: vendor?.optional5,
    apiKey: vendor?.optional6,
    apiUrl: vendor?.apiUrl,
  };
  const missingFields = Object.keys(config).filter((key) => !config[key]);
  if (missingFields.length) {
    // Names and ids only — never log credential values
    customLog(null, "error", {
      message: "Airpay configuration missing",
      accessKey,
      serviceOperatorFound: Boolean(serviceDetails?.id),
      serviceOperatorId: serviceDetails?.id ?? null,
      serviceOperatorVendorId: serviceDetails?.vendorId ?? null,
      vendorFound: Boolean(vendor?.id),
      vendorId: vendor?.id ?? null,
      missingFields,
    }, "VENDOR");
    throw new Error("Airpay configuration missing");
  }
  return config;
};

// Key is md5(username~:~password) as a 32-char hex string; IV is 16 hex chars prefixed to the base64 ciphertext.
const encryptionKey = ({ username, password }) =>
  Buffer.from(crypto.createHash("md5").update(`${username}~:~${password}`).digest("hex"));

const encrypt = (config, data) => {
  const iv = crypto.randomBytes(8).toString("hex");
  const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey(config), Buffer.from(iv));
  return iv + Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()]).toString("base64");
};

const decrypt = (config, payload) => {
  const decipher = crypto.createDecipheriv("aes-256-cbc", encryptionKey(config), Buffer.from(payload.slice(0, 16)));
  const plain = Buffer.concat([decipher.update(Buffer.from(payload.slice(16), "base64")), decipher.final()]).toString();
  return JSON.parse(plain);
};

// sha256 of values sorted by key, with today's IST date (Y-m-d) appended — a UTC date breaks 00:00–05:30 IST
const checksum = (data) => {
  const values = Object.keys(data).sort().map((key) => data[key]).join("");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return crypto.createHash("sha256").update(values + today).digest("hex");
};

// Docs call it "secret"; it is the API key — the client secret fails with "Merchant Key Authentication Failed"
const privateKey = ({ apiKey, username, password }) =>
  crypto.createHash("sha256").update(`${apiKey}@${username}:|:${password}`).digest("hex");

const signedBody = (config, data) => ({
  merchant_id: config.merchantId,
  encdata: encrypt(config, data),
  checksum: checksum(data),
  privatekey: privateKey(config),
});

const readEncryptedResponse = (config, body) => (body?.response ? decrypt(config, body.response) : body);

const getAccessToken = async (config) => {
  const data = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "client_credentials",
    merchant_id: config.merchantId,
  };
  // The token call takes no privatekey
  const body = { merchant_id: config.merchantId, encdata: encrypt(config, data), checksum: checksum(data) };
  const response = await axios.post(`${config.apiUrl}/api/oauth2/`, new URLSearchParams(body));
  const result = readEncryptedResponse(config, response.data);
  const token = result?.data?.access_token;
  if (!token) {
    throw new Error(`Airpay token request failed: ${result?.message || "no token"}`);
  }
  return token;
};

// Airpay order ids must be alphanumeric, so the "_" of our peko_<ref> ids is dropped.
const toAirpayOrderId = (orderIdPrefix, paymentRefId) => `${orderIdPrefix}${paymentRefId}`;
const paymentRefIdFromAirpayOrderId = (orderId) => String(orderId || "").replace(/\D/g, "");

const buildCheckoutForm = async ({ orderIdPrefix, paymentRefId, amount, buyer, chmod }) => {
  const config = await loadAirpayConfig();
  const token = await getAccessToken(config);
  const data = {
    orderid: toAirpayOrderId(orderIdPrefix, paymentRefId),
    amount,
    currency_code: "356",
    iso_currency: "INR",
    buyer_email: buyer.email,
    buyer_phone: buyer.phone,
    buyer_firstname: buyer.firstName,
    buyer_lastname: buyer.lastName,
    // Not sent: Airpay returns to the Response URL configured on their side (sending it failed their domain check)
    // return_url: returnUrl,
    ...(chmod && { chmod }),
  };
  return {
    action: `${CHECKOUT_URL}?token=${token}`,
    fields: signedBody(config, data),
  };
};

const buildSecureHash = (payment, username) => {
  const parts = [
    payment.orderid,
    payment.ap_transactionid,
    payment.amount,
    payment.transaction_status,
    payment.message,
    payment.merchant_id,
    username,
  ];
  if (String(payment.chmod).toLowerCase() === "upi") {
    parts.push(payment.customer_vpa);
  }
  return String(zlib.crc32(parts.join(":")));
};

// Docs name it ap_SecureHash; the sandbox return actually sends ap_securehash
const isSecureHashValid = (payment, config) => {
  const received = payment?.ap_SecureHash ?? payment?.ap_securehash;
  return Boolean(received) && String(received) === buildSecureHash(payment, config.username);
};

// The return POST and the IPN may arrive encrypted (`response`) or as plain fields, wrapped in `data` or not.
const parseCallbackPayload = async (body) => {
  const config = await loadAirpayConfig();
  let payload = body;
  if (typeof body?.response === "string") {
    payload = decrypt(config, body.response);
  }
  payload = payload?.data && payload.data.orderid ? payload.data : payload;
  return { payment: payload, hashValid: isSecureHashValid(payload, config), config };
};

const toPaymentStatus = (transactionStatus) => {
  const code = Number(transactionStatus);
  if (code === 200) return "SUCCESS";
  if ([211, 402, 403].includes(code)) return "PENDING";
  return "FAILED";
};

const toPaymentGroup = (chmod, cardType) => {
  const mode = String(chmod || "").toLowerCase();
  if (mode === "upi") return "upi";
  if (mode === "ppc") return "wallet";
  if (mode === "nb") return "net_banking";
  if (mode === "pgcc") return "credit_card";
  if (mode === "pgdc") return "debit_card";
  if (mode === "pg") return String(cardType || "").toLowerCase().includes("debit") ? "debit_card" : "credit_card";
  return mode || null;
};

const toPaymentMethod = (payment, paymentGroup) => {
  if (paymentGroup === "upi") return { upi: { channel: "collect", upi_id: payment.customer_vpa || null } };
  if (paymentGroup === "net_banking") return { netbanking: { netbanking_bank_name: payment.bank_name || null } };
  if (paymentGroup === "credit_card" || paymentGroup === "debit_card") {
    return {
      card: {
        card_number: payment.card_number || null,
        card_network: payment.card_scheme || null,
        card_type: paymentGroup,
        card_bank_name: payment.bank_name || null,
      },
    };
  }
  return { [paymentGroup || "other"]: {} };
};

// Shapes an Airpay transaction like a Cashfree payment so the existing service handlers and refunds read it unchanged.
const normalizePayment = (payment, { orderIdPrefix, paymentRefId }) => {
  const paymentGroup = toPaymentGroup(payment.chmod, payment.card_type);
  return {
    gateway: AIRPAY,
    paymentGatewayName: AIRPAY_GATEWAY_NAME,
    order_id: `${orderIdPrefix}_${paymentRefId}`,
    cf_payment_id: payment.ap_transactionid,
    payment_amount: Number(payment.amount),
    payment_currency: "INR",
    payment_status: toPaymentStatus(payment.transaction_status),
    payment_message: payment.message || null,
    payment_time: payment.transaction_time || null,
    bank_reference: payment.rrn || payment.utr_no || null,
    payment_group: paymentGroup,
    payment_method: toPaymentMethod(payment, paymentGroup),
    airpay: payment,
  };
};

const verifyTransaction = async (config, airpayOrderId) => {
  const token = await getAccessToken(config);
  const response = await axios.post(
    `${config.apiUrl}/api/verify/?token=${token}`,
    new URLSearchParams(signedBody(config, { orderid: airpayOrderId }))
  );
  return readEncryptedResponse(config, response.data);
};

// Returns a Cashfree-shaped payments array from the server-side verify API (works on sandbox too).
// No answer → PENDING, never FAILED, so a network blip can't fail a paid order.
const fetchAirpayPayments = async ({ paymentRefId, orderIdPrefix, logTraceId }) => {
  const config = await loadAirpayConfig();
  const context = { orderIdPrefix, paymentRefId };
  try {
    const result = await verifyTransaction(config, toAirpayOrderId(orderIdPrefix, paymentRefId));
    if (String(result?.status_code) === "200" && result?.data?.transaction_status) {
      return [normalizePayment(result.data, context)];
    }
    customLog(logTraceId, "info", { message: "Airpay verify returned no transaction", paymentRefId, result }, "VENDOR");
  } catch (error) {
    customLog(logTraceId, "error", { message: "Airpay verify failed", paymentRefId, error: error?.message }, "VENDOR");
  }

  return [{ gateway: AIRPAY, paymentGatewayName: AIRPAY_GATEWAY_NAME, order_id: `${orderIdPrefix}_${paymentRefId}`, payment_status: "PENDING" }];
};

const refundAirpay = async ({ apTransactionId, amount, logTraceId }) => {
  const config = await loadAirpayConfig();
  const token = await getAccessToken(config);
  const transactions = Buffer.from(
    JSON.stringify([{ ap_transactionid: String(apTransactionId), amount: Number(amount).toFixed(2) }])
  ).toString("base64");
  const response = await axios.post(
    `${config.apiUrl}/api/refund/?token=${token}`,
    // Docs say JSON, but the API only reads form-encoded fields
    new URLSearchParams(signedBody(config, { mode: "refund", transactions }))
  );
  const result = readEncryptedResponse(config, response.data);
  customLog(logTraceId, "info", { message: "Airpay refund response", apTransactionId, amount, result }, "VENDOR");
  const item = result?.data?.transactions?.[0];
  if (String(result?.status_code) !== "200" || String(item?.success) !== "true") {
    const error = new Error(item?.message || result?.message || "Airpay refund failed");
    error.response = { data: result };
    throw error;
  }
  return { refund_status: "SUCCESS", refund_id: item.refund_id, refund_amount: Number(amount), airpay: item };
};

module.exports = {
  AIRPAY,
  buildCheckoutForm,
  parseCallbackPayload,
  paymentRefIdFromAirpayOrderId,
  toPaymentStatus,
  fetchAirpayPayments,
  refundAirpay,
};
