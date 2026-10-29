const { updateOneOrder, findOneOrder } = require("../models/use-cases/order");
const { findServiceOperatorByAccessKey } = require("./checkAndFetchServiceDetails");
const { customLog } = require("./loggerHelper");
const { default: axios } = require("axios");
const operatorsData = require("./operatorsData.json");
const { refundFailure, refundInitiated } = require("./emailTemplate/common");
const accessKey = operatorsData["cashFreePaymentGateway"]["accessKey"];
// ONDC (Office Supplies) captures on its own Cashfree merchant — the same one Easy
// Split pays sellers from. A Cashfree order exists only on the merchant it was created
// against, so refunds must authenticate as this one too.
const ONDC_ACCESS_KEY = operatorsData["cashFreeOndc"]["accessKey"];
const emailer = require("./emailer");
const { isMswipePayment, requestMswipeManualRefund } = require("./mswipeManualRefund");
const { findByName } = require("../models/use-cases/setting");
const { resolveEmailTemplate } = require("../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("./emailTemplateKeys");
const { v2LayoutVariables } = require("./emailTemplate/sharedLayout");

/**
 * The capture side of a refund: the payment order row, the parsed
 * paymentModeResponse blob, the gateway order id and what was actually captured.
 *
 * Deliberately does NOT resolve credentials — cancelPGTransaction checks the
 * amount and its already-refunded flag BEFORE touching the serviceOperator, and
 * splitting the two keeps that original ordering intact.
 *
 * Returns `{ error }` rather than throwing; both callers report rather than throw.
 */
const resolveCaptureContext = async (corporateTxnId) => {
  const orderDetails = await findOneOrder({ corporateTxnId });
  if (!orderDetails) return { error: "Order details not found" };

  let paymentBodyData = {};
  try {
    paymentBodyData = orderDetails?.paymentModeResponse
      ? JSON.parse(orderDetails.paymentModeResponse)
      : {};
  } catch (parseError) {
    customLog(null, "error", {
      message: "Invalid paymentModeResponse JSON in order details",
      corporateTxnId,
      error: parseError,
    });
    return { error: "Invalid payment response details" };
  }

  const capturedAmount = Number(paymentBodyData?.payment_amount || 0);
  if (!Number.isFinite(capturedAmount) || capturedAmount <= 0) {
    return { error: "Invalid refund amount" };
  }

  return { orderDetails, paymentBodyData, orderId: paymentBodyData?.order_id, capturedAmount };
};

/**
 * Cashfree credentials + refund URL for a capture. One definition of where creds come
 * from.
 *
 * `isOndc` selects the `cashfree_ondc` merchant instead of the shared `cashfree_pg`
 * cascade. This is NOT cosmetic: **a Cashfree order exists only on the merchant it was
 * created against**, and the ONDC Office Supplies checkout captures on `cashfree_ondc`
 * (see pickCashfreeCredentials in paymentGateway/utils/cashfreeMerchant.js — the same
 * merchant Easy Split pays sellers from). Refunding an ONDC capture with the shared PG
 * credentials authenticates as the wrong merchant and Cashfree answers
 * "Order Reference Id does not exist".
 *
 * Mirrors that resolver's ONDC branch exactly, including falling back to the shared
 * vendor's apiUrl/version when the ONDC row omits them.
 */
const resolveRefundAuth = async (orderDetails, orderId, { isOndc = false } = {}) => {
  const shared = await findServiceOperatorByAccessKey(accessKey);
  if (Object.prototype.hasOwnProperty.call(shared, "error")) {
    return { error: shared.error };
  }

  let clientId;
  let clientSecret;
  let baseUrl;
  let version;
  let merchant;

  const ondc = isOndc ? await findServiceOperatorByAccessKey(ONDC_ACCESS_KEY) : null;
  const ondcUsable = ondc && !Object.prototype.hasOwnProperty.call(ondc, "error");
  const ondcRow = ondcUsable ? ondc : null;

  if (
    ondcRow &&
    (ondcRow.paymentclientid || ondcRow.vendor?.optional1) &&
    (ondcRow.paymentclientsecret || ondcRow.vendor?.optional2)
  ) {
    // All-or-nothing on the credential pair — mixing this row's apiUrl with another
    // row's client id would point at the wrong merchant.
    clientId = ondcRow.paymentclientid || ondcRow.vendor?.optional1;
    clientSecret = ondcRow.paymentclientsecret || ondcRow.vendor?.optional2;
    baseUrl = ondcRow.vendor?.apiUrl || shared.vendor.apiUrl;
    version = ondcRow.vendor?.optional3 || shared.vendor.optional3;
    merchant = ONDC_ACCESS_KEY;
  } else {
    if (isOndc) {
      // Loud, because the refund is about to be attempted against the wrong merchant
      // and will fail with "Order Reference Id does not exist".
      customLog(null, "error", {
        message:
          `ONDC refund falling back to the shared "${accessKey}" merchant — the ` +
          `"${ONDC_ACCESS_KEY}" operator row is missing or has no credentials. The ONDC ` +
          "capture lives on that merchant, so this refund will almost certainly be rejected.",
        orderId,
      }, "VENDOR");
    }
    clientId = orderDetails.serviceOperator?.paymentclientid ?? shared.vendor.optional1;
    clientSecret = orderDetails.serviceOperator?.paymentclientsecret ?? shared.vendor.optional2;
    baseUrl = shared.vendor.apiUrl;
    version = shared.vendor.optional3;
    merchant = accessKey;
  }

  if (!clientId || !clientSecret || !baseUrl || !version) {
    return { error: "Missing Cashfree configuration for refund" };
  }

  return {
    serviceDetails: shared,
    merchant,
    headers: {
      "x-api-version": version,
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      "Content-Type": "application/json",
    },
    url: `${baseUrl}/pg/orders/${orderId}/refunds`,
  };
};

/**
 * Refund a Cashfree capture recorded against `corporateTxnId`.
 *
 * `opts.refundAmount` refunds only part of the capture — used by the ONDC
 * Office Supplies checkout, where money is collected before /confirm and only
 * the sellers that failed to confirm have to be paid back. Omit it for the
 * default full refund. `opts.reason` is a free-text label (logged + sent to
 * Cashfree as the refund note).
 *
 * Pass `opts.isOndc` when the capture is an ONDC Office Supplies one — it lives on the
 * `cashfree_ondc` merchant, and refunding it with the shared PG credentials gets
 * "Order Reference Id does not exist" from Cashfree.
 *
 * Allows at most ONE refund per capture (see the refundStatus guard below), so it
 * is unsuitable for per-seller admin refunds on a shared ONDC capture — use
 * refundOndcOrderPayment for those.
 */
exports.cancelPGTransaction = async (corporateTxnId, opts = {}) => {
  let refundAmount = 0;
  let serviceProvider, serviceCategory;
  let paymentBodyData = {};
  const requestedRefund = Number(opts.refundAmount);
  const isPartialRefund = Number.isFinite(requestedRefund) && requestedRefund > 0;

  try {
    const ctx = await resolveCaptureContext(corporateTxnId);
    if (ctx.error) {
      return { status: false, message: ctx.error };
    }
    const { orderDetails, orderId: order_id, capturedAmount } = ctx;
    paymentBodyData = ctx.paymentBodyData;

    serviceProvider = orderDetails.serviceOperator?.serviceProvider;
    serviceCategory = orderDetails.serviceOperator?.serviceCategory;

    // Never refund more than Cashfree actually captured.
    refundAmount = isPartialRefund
      ? Number(Math.min(requestedRefund, capturedAmount).toFixed(2))
      : capturedAmount;
    if (refundAmount <= 0) {
      return { status: false, message: "Invalid refund amount" };
    }
    if (!order_id) {
      return { status: false, message: "Order id not found for refund" };
    }
    if (
      paymentBodyData?.refundStatus &&
      paymentBodyData?.refundStatus !== "Refund failed" &&
      paymentBodyData?.refundStatus !== "FAILED"
    ) {
      return { status: true, message: "Refund already initiated", refundStatus: paymentBodyData.refundStatus };
    }

    if (isMswipePayment(paymentBodyData)) {
      const customer = orderDetails?.credential;
      return await requestMswipeManualRefund({
        corporateTxnId,
        paymentBodyData,
        refundAmount,
        reason: opts.reason,
        saveOrder: (fields) => updateOneOrder(corporateTxnId, fields),
        sendMail: ({ to, subject, html }) => emailer.email(to, subject, html),
        notifyCustomer: customer?.email
          ? () => paymentRefundInitiatedEmailInternal({
            name: customer.name || customer.username || "Corporate",
            email: customer.email,
            amount: refundAmount,
            transactionId: corporateTxnId,
            serviceProvider,
            typeOfService: serviceCategory,
          })
          : undefined,
      });
    }

    const auth = await resolveRefundAuth(orderDetails, order_id, { isOndc: Boolean(opts.isOndc) });
    // serviceDetails is the full service operator row (Cashfree client id/secret) — never log it
    customLog(null, "info", {
      merchant: auth.merchant,
      message: "from cancel pgt transaction",
    });
    if (auth.error) {
      return { status: false, message: auth.error };
    }

    const refundBody = {
      // Cashfree requires refund_id to be unique per order, so a partial refund
      // can't reuse the full-refund id.
      refund_id: isPartialRefund
        ? `refund_${corporateTxnId}_partial`
        : `refund_${corporateTxnId}`,
      refund_amount: refundAmount,
      refund_note: opts.reason || corporateTxnId.toString(),
      // refund_speed, //STANDARD, INSTANT
    };

    const config = {
      method: "POST",
      url: auth.url,
      headers: auth.headers,
      data: refundBody,
    };

    customLog(null, "info", { message: "Initiating Cashfree refund", orderId: order_id, refundAmount, corporateTxnId }, "VENDOR");

    const response = await axios(config);

    customLog(null, "info", {
      message: "Cashfree refund response",
      response: response?.data,
    }, "VENDOR");

    const vendorRefundStatus = response?.data?.refund_status;
    const refundStatus = vendorRefundStatus === "SUCCESS" ? "INITIATED" : vendorRefundStatus;
    paymentBodyData.refundStatus = refundStatus;
    paymentBodyData.refundResults = [response?.data];

    await updateOneOrder(corporateTxnId, {
      paymentModeResponse: JSON.stringify(paymentBodyData),
    });

    try {
      const corporateEmail = orderDetails?.credential?.email;
      const corporateName = orderDetails?.credential?.name || orderDetails?.credential?.username || "Corporate";
      
      if (corporateEmail) {
        await paymentRefundInitiatedEmailInternal({
          name: corporateName,
          email: corporateEmail,
          amount: refundAmount,
          transactionId: corporateTxnId,
          serviceProvider,
          typeOfService: serviceCategory,
        });
      } else {
        customLog(null, "info", {
          message: "Corporate email not found in orderDetails, skipping refund initiated email",
          corporateTxnId,
        });
      }
    } catch (emailError) {
      customLog(null, "error", {
        message: "Error while sending refund initiated email",
        error: emailError,
      });
    }

    return {
      status: true,
      refundStatus: response?.data?.refund_status,
      message: "Refund successful",
    };
  } catch (error) {
    customLog(null, "error", {
      message: "Cashfree refund failed",
      error: error?.response?.data ?? error?.response ?? error?.message ?? error,
      corporateTxnId,
    }, "VENDOR");

    try {
      const orderDetails = await findOneOrder({ corporateTxnId });
      if (orderDetails?.paymentModeResponse) {
        let failedPaymentBodyData = {};
        try {
          failedPaymentBodyData = JSON.parse(orderDetails.paymentModeResponse);
        } catch (parseError) {
          failedPaymentBodyData = {};
        }
        failedPaymentBodyData.refundResults = [error?.response?.data];
        failedPaymentBodyData.refundStatus = "Refund failed";
        await updateOneOrder(corporateTxnId, {
          paymentModeResponse: JSON.stringify(failedPaymentBodyData),
        });
      }
    } catch (updateError) {
      customLog(null, "error", { message: "Error updating order after refund failure", error: updateError });
    }

    try {
      await paymentRefundFailureEmailInternal({
        amount: refundAmount,
        transactionId: corporateTxnId,
        serviceProvider,
        typeOfService: serviceCategory,
      });
    } catch (emailError) {
      customLog(null, "error", {
        message: "Error while sending refund failure email",
        error: emailError,
      });
    }

    return {
      status: false,
      message: "Something went wrong",
      error: error?.response?.data,
    };
  }
};

/**
 * Did Cashfree reject the request specifically because of `refund_splits`?
 *
 * Deliberately narrow: only a message that names the field (or says split refunds are
 * unsupported/not enabled) counts. A broad match would silently retry a genuine
 * failure — a bad amount, a dead vendor — as an unattributed refund, quietly shifting
 * the loss onto Peko.
 */
const isRefundSplitsRejection = (error) => {
  const text = [
    error?.response?.data?.message,
    error?.response?.data?.error_description,
    error?.response?.data?.type,
    error?.response?.data?.code,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!text) return false;
  if (text.includes("refund_splits")) return true;
  return (
    (text.includes("split") &&
      (text.includes("not supported") ||
        text.includes("not enabled") ||
        text.includes("unsupported") ||
        text.includes("not allowed"))) ||
    false
  );
};

/**
 * Refund part of an ONDC checkout capture for ONE seller order.
 *
 * A checkout captures ONCE against orders.corporateTxnId (= ondcOrders.paymentRef)
 * but mints one ondcOrders row per seller, so refunding a single seller order is
 * always a partial refund of a shared capture. That rules out cancelPGTransaction,
 * which (a) only ever mints two refund_ids per capture and (b) silently returns
 * "Refund already initiated" once refundStatus is set — and confirmOndcOrder
 * already sets it on any partial-confirm failure. Either would make an admin
 * refund report success while moving no money.
 *
 * So: the CALLER owns the refund_id (unique per refund), there is no
 * already-refunded short-circuit, and `refundStatus` on the shared blob is left
 * alone for the legacy flow. Over-refunding is prevented by the caller summing
 * the per-order ondcOrderRefunds ledger — see services/ondcOrderRefund.js.
 *
 * `refundSplits` attributes the refund to a seller's Easy Split allocation:
 * `[{ vendor_id, amount, tags }]`, sent as Cashfree's `refund_splits`. Without it the
 * WHOLE refund comes out of Peko's balance while the seller keeps their claim on the
 * split — so on a shared capture, naming the vendor is what stops Peko absorbing one
 * seller's failure and what leaves the OTHER sellers in that capture untouched.
 *
 * The split rule itself is written with `disable_split: true` and cannot be amended;
 * this is a separate mechanism that debits the vendor's balance instead.
 *
 * Never throws.
 *
 * @param {string} params.paymentRef  ondcOrders.paymentRef (= orders.corporateTxnId)
 * @param {string} params.refundId    caller-minted, unique per refund
 * @param {number} params.amount      already capped by the caller
 * @param {Array}  [params.refundSplits] `[{ vendor_id, amount, tags }]`; omit/empty for
 *                 an unattributed refund borne entirely by Peko
 * @returns {Promise<{status:boolean, refundId:string, amount:number, refundStatus?:string, message?:string, error?:any}>}
 */
exports.refundOndcOrderPayment = async ({
  paymentRef,
  refundId,
  amount,
  reason,
  refundSplits = [],
  logTraceId,
} = {}) => {
  const log = (level, data) =>
    customLog(logTraceId, level, { scope: "ondcRefund", flow: "gateway", paymentRef, refundId, ...data }, "VENDOR");

  const refundAmount = Number(Number(amount).toFixed(2));
  if (!paymentRef) return { status: false, refundId, amount: refundAmount, message: "paymentRef is required" };
  if (!refundId) return { status: false, refundId, amount: refundAmount, message: "refundId is required" };
  if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
    return { status: false, refundId, amount: refundAmount, message: "Invalid refund amount" };
  }

  try {
    const ctx = await resolveCaptureContext(paymentRef);
    if (ctx.error) {
      log("error", { step: "context", message: ctx.error });
      return { status: false, refundId, amount: refundAmount, message: ctx.error };
    }
    if (!ctx.orderId) {
      log("error", { step: "context", message: "Order id not found for refund" });
      return { status: false, refundId, amount: refundAmount, message: "Order id not found for refund" };
    }
    // Cashfree rejects a refund exceeding the capture regardless of our own cap.
    if (refundAmount > ctx.capturedAmount) {
      const message = `Refund ${refundAmount} exceeds the captured amount ${ctx.capturedAmount}`;
      log("error", { step: "cap", message });
      return { status: false, refundId, amount: refundAmount, message };
    }

    // isOndc — the capture is on the cashfree_ondc merchant, not the shared PG one.
    const auth = await resolveRefundAuth(ctx.orderDetails, ctx.orderId, { isOndc: true });
    if (auth.error) {
      log("error", { step: "auth", message: auth.error });
      return { status: false, refundId, amount: refundAmount, message: auth.error };
    }

    const splits = Array.isArray(refundSplits) ? refundSplits.filter((s) => s && s.vendor_id) : [];
    const vendorTotal = parseFloat(splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0).toFixed(2));
    const refundBody = {
      refund_id: refundId,
      refund_amount: refundAmount,
      refund_note: reason || `ONDC admin refund ${refundId}`,
      // Only when non-empty — sending `refund_splits: []` would read as "split
      // nothing" rather than "no split intended".
      ...(splits.length && { refund_splits: splits }),
    };

    log("info", {
      step: "request",
      message: "Initiating ONDC Cashfree refund",
      url: auth.url,
      // Which merchant we authenticated as — the first thing to check if Cashfree
      // answers "Order Reference Id does not exist".
      merchant: auth.merchant,
      // Who bears it: vendorTotal off the sellers' balances, the rest off Peko's.
      vendorTotal,
      merchantTotal: parseFloat((refundAmount - vendorTotal).toFixed(2)),
      requestPayload: refundBody,
    });

    let response;
    let splitsApplied = splits.length > 0;
    try {
      response = await axios({ method: "POST", url: auth.url, headers: auth.headers, data: refundBody });
    } catch (error) {
      // Not every Cashfree account has split refunds enabled, and their FAQ and API
      // reference disagree about it. If the account rejects the field, the BUYER's
      // refund must still happen — retry once without it rather than leaving them
      // unpaid, and log loudly because Peko then bears the whole amount.
      if (splitsApplied && isRefundSplitsRejection(error)) {
        log("error", {
          step: "retry-without-splits",
          message:
            "Cashfree rejected refund_splits — retrying WITHOUT vendor attribution. The buyer " +
            "will be refunded but PEKO bears the full amount and the seller keeps their split. " +
            "Check whether split refunds are enabled on this merchant account.",
          vendorTotal,
          gatewayMessage: error?.response?.data?.message ?? error?.message ?? null,
        });
        const withoutSplits = { ...refundBody };
        delete withoutSplits.refund_splits;
        splitsApplied = false;
        response = await axios({ method: "POST", url: auth.url, headers: auth.headers, data: withoutSplits });
      } else {
        throw error;
      }
    }
    const data = response?.data || {};

    log("info", {
      step: "response",
      message: "ONDC Cashfree refund SUCCESS",
      httpStatus: response?.status ?? 200,
      splitsApplied,
      responseBody: data,
    });

    // Append to the audit array WITHOUT touching `refundStatus` — that field is
    // the legacy single-refund flag and overwriting it would block later refunds.
    try {
      const blob = ctx.paymentBodyData || {};
      blob.refundResults = [...(Array.isArray(blob.refundResults) ? blob.refundResults : []), data];
      await updateOneOrder(paymentRef, { paymentModeResponse: JSON.stringify(blob) });
    } catch (blobErr) {
      log("error", { step: "persist-blob", message: "Could not append the refund to paymentModeResponse", error: blobErr?.message || blobErr });
    }

    return {
      status: true,
      refundId,
      amount: refundAmount,
      refundStatus: data?.refund_status,
      responseBody: data,
      // false when the account rejected refund_splits — the caller records that the
      // refund was NOT attributed to the vendor, so reconciliation reflects reality.
      splitsApplied,
      vendorAmount: splitsApplied ? vendorTotal : 0,
      message: "Refund initiated",
    };
  } catch (error) {
    const body = error?.response?.data ?? null;
    log("error", {
      step: "response",
      message: "ONDC Cashfree refund FAILED",
      httpStatus: error?.response?.status ?? null,
      responseBody: body,
      error: error?.message || String(error),
    });
    return {
      status: false,
      refundId,
      amount: refundAmount,
      message: body?.message || error?.message || "Refund failed",
      error: body,
    };
  }
};

async function paymentRefundFailureEmailInternal({ amount, transactionId, serviceProvider, typeOfService }) {

  const resp = await findByName({name: "pekoWebsite"})
  const email = resp.emails;
  const params = { name: "Admin", amount, transactionId, serviceProvider, typeOfService };
  const resolved = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.REFUND_FAILED,
    service: EMAIL_TEMPLATE_SERVICES.PURCHASE_REFUND,
    variables: { name: params.name, amount, transactionId, ...v2LayoutVariables(undefined) },
    fallback: () => refundFailure(params),
    fallbackSubject: "Refund Failed",
  });
  await emailer.email(email, resolved.subject, resolved.html);

}

async function paymentRefundInitiatedEmailInternal({ name, email, amount, transactionId, serviceProvider, typeOfService }) {
  const params = { name: name || "Corporate", amount, transactionId, serviceProvider, typeOfService };
  const resolved = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.REFUND_INITIATED,
    service: EMAIL_TEMPLATE_SERVICES.PURCHASE_REFUND,
    variables: { name: params.name, amount, transactionId, serviceProvider: serviceProvider || '', typeOfService: typeOfService || '', ...v2LayoutVariables(undefined) },
    fallback: () => refundInitiated(params),
    fallbackSubject: "Refund Initiated",
  });
  await emailer.email(email, resolved.subject, resolved.html);
}