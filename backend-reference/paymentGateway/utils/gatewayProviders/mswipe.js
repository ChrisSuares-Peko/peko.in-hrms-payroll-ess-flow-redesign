const crypto = require("crypto");
const axios = require("axios");
const { getValue, setValue } = require("../cacheDataMethods");
const { customLog } = require("../loggerHelper");
const operatorsData = require("../operatorsData.json");

const PROVIDER = operatorsData.mswipePaymentGateway.accessKey;
const PBL_API_PATH = "/ipg/api";
const PBL_APPLICATION_ID = "api";
const PBL_CHANNEL_ID = "pbl";
const PBL_VERSION = "VER4.0.0";
const PAYMENT_STATUS_SUCCESS = 1;
const PAYMENT_STATUS_PENDING = 2;
const REQUEST_TIMEOUT_MS = 30000;
const DEFAULT_TOKEN_TTL_SECONDS = 24 * 60 * 60;
const TOKEN_EXPIRY_MARGIN_SECONDS = 60 * 60;
const MIN_TOKEN_TTL_SECONDS = 60;
const IST_OFFSET_MS = 330 * 60 * 1000;
const LINK_VALIDITY_MS = 24 * 60 * 60 * 1000;
const SESSION_TOKEN_REJECTION_PATTERN = /token|authori[sz]/i;
const UNUSED_NOTES = Object.freeze({
  addlnote2: "",
  addlnote3: "",
  addlnote4: "",
  addlnote5: "",
  addlnote6: "",
  addlnote7: "",
  addlnote8: "",
  addlnote9: "",
  addlnote10: "",
});

const isTruthyFlag = (value) => String(value ?? "").trim().toLowerCase() === "true";
const isFilled = (value) => typeof value === "string" && value.trim() !== "";
const toPaise = (amount) => Math.round(Number(amount) * 100);
const jsonRequestConfig = { timeout: REQUEST_TIMEOUT_MS, headers: { "Content-Type": "application/json" } };

const paymentCredentials = (operator) => {
  const vendor = operator?.vendor;
  const credentials = {
    apiUrl: isFilled(vendor?.apiUrl) ? vendor.apiUrl.trim().replace(/\/+$/, "") : null,
    clientId: vendor?.optional1,
    secretKey: vendor?.optional2,
    userId: vendor?.optional3,
    custCode: vendor?.optional4,
  };
  return Object.values(credentials).every(isFilled) ? credentials : null;
};

const missingOrderDetails = (order) => {
  if (!order?.customer?.mobileNo) {
    return "A valid mobile number is required to pay with this method. Please update your profile and try again.";
  }
  if (!order?.customer?.email) {
    return "A valid email address is required to pay with this method. Please update your profile and try again.";
  }
  return null;
};

const sessionTokenCacheKey = (credentials) => `mswipe:pbl:sessionToken:${credentials.clientId}`;

const sessionTokenTtlSeconds = (token, nowMs = Date.now()) => {
  let expiresAt;
  try {
    const payload = String(token).split(".")[1];
    expiresAt = Number(JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))?.exp);
  } catch {
    return DEFAULT_TOKEN_TTL_SECONDS;
  }
  if (!Number.isFinite(expiresAt)) return DEFAULT_TOKEN_TTL_SECONDS;
  return Math.max(MIN_TOKEN_TTL_SECONDS, Math.floor(expiresAt - nowMs / 1000) - TOKEN_EXPIRY_MARGIN_SECONDS);
};

const requestSessionToken = async (credentials, logTraceId) => {
  const response = await axios.post(
    `${credentials.apiUrl}${PBL_API_PATH}/CreatePBLAuthToken`,
    {
      userId: credentials.userId,
      clientId: credentials.clientId,
      password: credentials.secretKey,
      applId: PBL_APPLICATION_ID,
      channelId: PBL_CHANNEL_ID,
    },
    jsonRequestConfig
  );
  const token = isTruthyFlag(response?.data?.status) && isFilled(response?.data?.token) ? response.data.token : null;
  if (!token) {
    customLog(logTraceId, "error", {
      action: "mswipe:sessionTokenRejected",
      responseMessage: response?.data?.msg,
    }, "VENDOR");
    throw new Error("Mswipe session token request was rejected");
  }
  await setValue(sessionTokenCacheKey(credentials), sessionTokenTtlSeconds(token), token);
  return token;
};

const getSessionToken = async (credentials, { forceRefresh = false, logTraceId } = {}) => {
  if (!forceRefresh) {
    const cachedToken = await getValue(sessionTokenCacheKey(credentials));
    if (cachedToken) return cachedToken;
  }
  return requestSessionToken(credentials, logTraceId);
};

const parseTransId = (paymentUrl) => {
  try {
    return new URL(paymentUrl).searchParams.get("TransID");
  } catch {
    return null;
  }
};

const linkValidityDate = (nowMs = Date.now()) =>
  new Date(nowMs + IST_OFFSET_MS + LINK_VALIDITY_MS).toISOString().slice(0, 10);

const submitPaymentLink = (credentials, sessionToken, order) =>
  axios.post(
    `${credentials.apiUrl}${PBL_API_PATH}/MswipePayment`,
    {
      amount: order.amount,
      mobileno: order.customer.mobileNo,
      custcode: credentials.custCode,
      user_id: credentials.userId,
      sessiontoken: sessionToken,
      versionno: PBL_VERSION,
      imeino: "",
      email_id: order.customer.email,
      invoice_id: order.paymentRefId,
      request_id: crypto.randomUUID().replace(/-/g, ""),
      device_id: "",
      addlnote1: order.note ?? "",
      ...UNUSED_NOTES,
      LinkValidity: linkValidityDate(),
      paymentreason: "",
      redirect_url: order.returnUrl,
      IsSendSMS: false,
      ConvAllow: "false",
      ApplicationId: PBL_APPLICATION_ID,
      ChannelId: PBL_CHANNEL_ID,
      ClientId: credentials.clientId,
    },
    jsonRequestConfig
  );

const isSessionTokenRejection = (data) =>
  !isTruthyFlag(data?.status) && SESSION_TOKEN_REJECTION_PATTERN.test(String(data?.responsemessage ?? ""));

const createOrder = async ({ credentials, order, logTraceId }) => {
  let response = await submitPaymentLink(credentials, await getSessionToken(credentials, { logTraceId }), order);
  if (isSessionTokenRejection(response?.data)) {
    customLog(logTraceId, "info", { action: "mswipe:sessionTokenRefreshed", paymentRefId: order.paymentRefId }, "VENDOR");
    const freshToken = await getSessionToken(credentials, { forceRefresh: true, logTraceId });
    response = await submitPaymentLink(credentials, freshToken, order);
  }
  const data = response?.data ?? {};
  const paymentUrl = isFilled(data.smslink) ? data.smslink.trim() : null;
  const reference = paymentUrl ? parseTransId(paymentUrl) : null;
  if (!isTruthyFlag(data.status) || !paymentUrl || !reference) {
    customLog(logTraceId, "error", {
      action: "mswipe:paymentLinkRejected",
      paymentRefId: order.paymentRefId,
      responseCode: data.responsecode,
      responseMessage: data.responsemessage,
      hasPaymentUrl: Boolean(paymentUrl),
    }, "VENDOR");
    throw new Error("Mswipe payment link creation was rejected");
  }
  return { paymentUrl, reference, providerOrderId: data.txn_id ?? null };
};

const resolvePaymentStatus = (statusResponse, { paymentRefId, expectedAmount }) => {
  const records = Array.isArray(statusResponse?.Data) ? statusResponse.Data : [];
  const paidRecord = records.find((record) => Number(record?.Payment_Status) === PAYMENT_STATUS_SUCCESS);
  if (paidRecord) {
    const reportedOrderId = String(paidRecord.Order_Id ?? "").trim();
    if (reportedOrderId && reportedOrderId !== String(paymentRefId)) {
      return { orderStatus: "FAILURE", record: paidRecord, reason: "orderMismatch" };
    }
    const expected = Number(expectedAmount);
    if (!Number.isFinite(expected) || toPaise(paidRecord.Amount) !== toPaise(expected)) {
      return { orderStatus: "FAILURE", record: paidRecord, reason: "amountMismatch" };
    }
    return { orderStatus: "SUCCESS", record: paidRecord };
  }
  if (!records.length || records.some((record) => Number(record?.Payment_Status) === PAYMENT_STATUS_PENDING)) {
    return { orderStatus: "PENDING" };
  }
  return { orderStatus: "FAILURE", reason: "declined" };
};

const toPaymentGroup = (record) => {
  const paymentType = String(record?.PaymentType ?? "").trim().toUpperCase();
  const cardType = String(record?.CardType ?? "").trim().toUpperCase();
  if (paymentType === "QR" || paymentType === "UPI") return "upi";
  if (cardType === "C") return "credit_card";
  if (cardType === "D") return "debit_card";
  return null;
};

const toPaymentMethod = (record, paymentGroup) => {
  if (paymentGroup === "upi") return { upi: {} };
  if (paymentGroup !== "credit_card" && paymentGroup !== "debit_card") return {};
  const lastFour = String(record?.CardNumber ?? "").replace(/\D/g, "").slice(-4);
  return {
    card: {
      card_network: String(record?.PaymentType ?? "").trim().toLowerCase() || null,
      card_number: lastFour ? `XXXXXXXXXXXX${lastFour}` : null,
      card_type: paymentGroup,
    },
  };
};

const toGatewayPaymentResponse = (record, { paymentRefId, reference }) => {
  const paymentGroup = toPaymentGroup(record);
  return [
    {
      gateway: PROVIDER,
      order_id: String(paymentRefId),
      payment_status: "SUCCESS",
      payment_amount: Number(record.Amount),
      payment_currency: "INR",
      payment_group: paymentGroup,
      payment_method: toPaymentMethod(record, paymentGroup),
      payment_time: record.TrxDateTime || null,
      bank_reference: record.Payment_Id || null,
      gatewayDetails: {
        providerOrderId: record.IPG_ID || null,
        reference,
        rrn: record.Payment_Id || null,
        mid: record.MID || null,
        tid: record.TID || null,
        paymentType: record.PaymentType || null,
        cardType: record.CardType || null,
      },
    },
  ];
};

const verifyOrder = async ({ credentials, reference, paymentRefId, expectedAmount, logTraceId }) => {
  const statusResponse = (
    await axios.post(`${credentials.apiUrl}${PBL_API_PATH}/getPBLTransactionDetails`, { id: reference }, jsonRequestConfig)
  )?.data;

  if (!isTruthyFlag(statusResponse?.Status)) {
    customLog(logTraceId, "error", {
      action: "mswipe:statusLookupRejected",
      paymentRefId,
      responseCode: statusResponse?.ResponseCode,
      responseMessage: statusResponse?.ResponseMessage,
    }, "VENDOR");
    return { orderStatus: "PENDING", paymentResponse: { gateway: PROVIDER, reason: "statusLookupRejected" } };
  }

  const { orderStatus, record, reason } = resolvePaymentStatus(statusResponse, { paymentRefId, expectedAmount });
  if (reason === "amountMismatch" || reason === "orderMismatch") {
    customLog(logTraceId, "error", {
      action: reason === "amountMismatch" ? "mswipe:paidAmountMismatch" : "mswipe:paidOrderMismatch",
      paymentRefId,
      providerOrderId: record?.IPG_ID ?? null,
      paidAmount: record?.Amount ?? null,
      expectedAmount: expectedAmount ?? null,
      reportedOrderId: record?.Order_Id ?? null,
    }, "VENDOR");
  }
  customLog(logTraceId, "info", {
    action: "mswipe:paymentStatusResolved",
    paymentRefId,
    orderStatus,
    reason: reason ?? null,
    providerOrderId: record?.IPG_ID ?? null,
  }, "VENDOR");

  return {
    orderStatus,
    paymentResponse:
      orderStatus === "SUCCESS"
        ? toGatewayPaymentResponse(record, { paymentRefId, reference })
        : { gateway: PROVIDER, orderStatus, reason: reason ?? null, transactions: statusResponse.Data ?? [] },
  };
};

const parseNotification = (body) => ({
  paymentRefId: body?.ME_InvNo ?? body?.InvNo ?? null,
  providerOrderId: body?.IPG_ID ?? null,
  status: body?.TRAN_STATUS ?? null,
});

module.exports = {
  provider: PROVIDER,
  paymentCredentials,
  missingOrderDetails,
  createOrder,
  verifyOrder,
  parseNotification,
  sessionTokenTtlSeconds,
  parseTransId,
  linkValidityDate,
  resolvePaymentStatus,
  toGatewayPaymentResponse,
};
