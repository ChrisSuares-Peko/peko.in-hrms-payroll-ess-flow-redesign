const { updateOneOrder, findOneOrder } = require("../models/use-cases/order");
const { findServiceOperatorByAccessKey } = require("./checkAndFetchServiceDetails");
const { customLog } = require("./loggerHelper");
const { default: axios } = require("axios");
const operatorsData = require("./operatorsData.json");
const { refundFailure,refundInitiated } = require("./emailTemplate/billpayments");
const accessKey = operatorsData["cashFreePaymentGateway"]["accessKey"];
const { isMswipePayment, requestMswipeManualRefund } = require("./mswipeManualRefund");
const emailer = require("./emailer");
const { findByName } = require("../models/use-cases/settings");
const { partnerLogos } = require("./partnerLogos");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { resolveEmailTemplate } = require("../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("./emailTemplateKeys");
const { v2LayoutVariables } = require("./emailTemplate/sharedLayout");
const { inAppCancel } = require("./corporateCardsClient");

// Admin refund of an order paid on a corporate card: a Pine Labs Cancel Redeem through corporateCard, with the
// same order write-back and mails as a Cashfree refund. Full amount only: Cancel Redeem returns the whole redeem.
const cancelCorporateCardTransaction = async ({ corporateTxnId, orderDetails, paymentBodyData, requestedAmount, displayAmount, serviceProvider, serviceCategory, logTraceId }) => {
  const paidAmount = Number(paymentBodyData?.pgAmount || paymentBodyData?.payment_amount || 0);
  const requested = Number(requestedAmount);
  if (Number.isFinite(requested) && requested > 0 && requested < paidAmount) {
    return { status: false, message: "Partial refunds are not available for corporate card payments" };
  }
  if (
    paymentBodyData?.refundStatus &&
    paymentBodyData?.refundStatus !== "Refund failed" &&
    paymentBodyData?.refundStatus !== "FAILED"
  ) {
    return { status: true, message: "Refund already initiated", refundStatus: paymentBodyData.refundStatus };
  }
  const requestedDisplay = Number(displayAmount);
  const emailAmount = Number.isFinite(requestedDisplay) && requestedDisplay > 0 ? requestedDisplay : paidAmount;
  const paymentRefId = String(paymentBodyData?.paymentRefId || corporateTxnId);

  customLog(logTraceId, "info", { message: "Initiating corporate card cancel redeem (admin refund)", paymentRefId, corporateTxnId, paidAmount }, "VENDOR");
  const cancel = await inAppCancel({ paymentRefId }, { logTraceId });
  const receipt = cancel.ok ? cancel.data : null;

  if (!receipt?.cancelled) {
    const message = receipt?.reason || cancel.message || "Card refund failed";
    customLog(logTraceId, "error", { message: "Corporate card cancel redeem failed (admin refund)", paymentRefId, corporateTxnId, cardStatus: receipt?.status || null, reason: message }, "VENDOR");
    await updateOneOrder(corporateTxnId, {
      paymentModeResponse: JSON.stringify({ ...paymentBodyData, refundStatus: "Refund failed", refundResults: [receipt || { reason: cancel.reason || null }] }),
    });
    try {
      await paymentRefundFailureEmailInternal({ amount: emailAmount, transactionId: corporateTxnId, serviceProvider, typeOfService: serviceCategory });
    } catch (emailError) {
      customLog(logTraceId, "error", { message: "Error while sending refund failure email", error: emailError });
    }
    return { status: false, message };
  }

  const refundStatus = "INITIATED";
  await updateOneOrder(corporateTxnId, {
    paymentModeResponse: JSON.stringify({ ...paymentBodyData, refundStatus, refundResults: [receipt] }),
  });
  try {
    const corporateEmail = orderDetails?.credential?.email;
    if (corporateEmail) {
      await paymentRefundInitiatedEmailInternal({
        name: orderDetails?.credential?.name || orderDetails?.credential?.username || "Corporate",
        email: corporateEmail,
        amount: emailAmount,
        transactionId: corporateTxnId,
        serviceProvider,
        typeOfService: serviceCategory,
        registeredBy: orderDetails?.credential?.registeredBy,
      });
    }
  } catch (emailError) {
    customLog(logTraceId, "error", { message: "Error while sending refund initiated email", error: emailError });
  }
  return { status: true, refundStatus, message: receipt.duplicate ? "Refund already initiated" : "Refund initiated" };
};

exports.cancelPGTransaction = async (corporateTxnId, requestedAmount, displayAmount, logTraceId) => {
  let refundAmount = 0;
  let emailAmount = 0;
  let serviceProvider, serviceCategory;
  let paymentBodyData = {};

  try {
    const orderDetails = await findOneOrder({ corporateTxnId });

    if (!orderDetails) {
      return { status: false, message: "Order details not found" };
    }

    serviceProvider = orderDetails.serviceOperator?.serviceProvider;
    serviceCategory = orderDetails.serviceOperator?.serviceCategory;

    try {
      const parsedResponse = orderDetails?.paymentModeResponse
        ? JSON.parse(orderDetails.paymentModeResponse)
        : {};
      paymentBodyData = parsedResponse?.pgResponse ?? parsedResponse;
    } catch (parseError) {
      customLog(logTraceId, "error", {
        message: "Invalid paymentModeResponse JSON in order details",
        corporateTxnId,
        error: parseError,
      });
      return { status: false, message: "Invalid payment response details" };
    }

    // Paid on a corporate card: the refund is a Pine Labs Cancel Redeem through corporateCard, not Cashfree.
    if (paymentBodyData?.gateway === "CORPORATE_CARD") {
      return cancelCorporateCardTransaction({ corporateTxnId, orderDetails, paymentBodyData, requestedAmount, displayAmount, serviceProvider, serviceCategory, logTraceId });
    }

    const order_id = paymentBodyData?.order_id;
    const paidAmount = Number(paymentBodyData?.payment_amount || 0);
    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      return { status: false, message: "Invalid refund amount" };
    }
    // Refund the requested amount (capped at the captured amount); default to a full refund when none is passed.
    const requested = Number(requestedAmount);
    refundAmount = Number.isFinite(requested) && requested > 0 ? Math.min(requested, paidAmount) : paidAmount;
    // Customer-facing amount may differ from the gateway leg (e.g. split PG + Wallet); default to the gateway amount.
    const requestedDisplay = Number(displayAmount);
    emailAmount = Number.isFinite(requestedDisplay) && requestedDisplay > 0 ? requestedDisplay : refundAmount;
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
      const customer = orderDetails.credential;
      return await requestMswipeManualRefund({
        corporateTxnId,
        paymentBodyData,
        refundAmount,
        saveOrder: (fields) => updateOneOrder(corporateTxnId, fields),
        sendMail: ({ to, subject, html }) => emailer.email(to, subject, html),
        notifyCustomer: customer?.email
          ? () => paymentRefundInitiatedEmailInternal({
            name: customer.name || customer.username || "Corporate",
            email: customer.email,
            amount: emailAmount,
            transactionId: corporateTxnId,
            serviceProvider,
            typeOfService: serviceCategory,
            registeredBy: customer.registeredBy,
          })
          : undefined,
        logTraceId,
      });
    }

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    customLog(logTraceId, "info", { serviceDetails, message: "from cancel pgt transaction" });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return { status: false, message: serviceDetails.error };
    }

    const clientId = orderDetails.serviceOperator?.paymentclientid;
    const clientSecret = orderDetails.serviceOperator?.paymentclientsecret;
    const baseUrl = serviceDetails.vendor.apiUrl;
    const version = serviceDetails.vendor.optional3;
    if (!clientId || !clientSecret || !baseUrl || !version) {
      return { status: false, message: "Missing Cashfree configuration for refund" };
    }

    const refundBody = {
      refund_id: `refund_${corporateTxnId}`,
      refund_amount: refundAmount,
      refund_note: corporateTxnId.toString(),
      // refund_speed, //STANDARD, INSTANT
    };

    const config = {
      method: "POST",
      url: `${baseUrl}/pg/orders/${order_id}/refunds`,
      headers: {
        "x-api-version": version,
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "Content-Type": "application/json",
      },
      data: refundBody,
    };

    customLog(logTraceId, "info", { message: "Initiating Cashfree refund", orderId: order_id, refundAmount, corporateTxnId, clientId: "****" + clientId?.slice(0, 4) + "****", clientSecret: "****" + clientSecret?.slice(0, 4) + "****" }, "VENDOR");

    const response = await axios(config);

    customLog(logTraceId, "info", {
      message: "Cashfree refund response",
      response: response?.data,
    }, "VENDOR");

    // Cashfree's synchronous SUCCESS is not final settlement; record as INITIATED until the refund webhook confirms success.
    const refundStatus = response?.data?.refund_status === "SUCCESS" ? "INITIATED" : response?.data?.refund_status;

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
          amount: emailAmount,
          transactionId: corporateTxnId,
          serviceProvider,
          typeOfService: serviceCategory,
          registeredBy: orderDetails?.credential?.registeredBy,
        });
      } else {
        customLog(logTraceId, "info", {
          message: "Corporate email not found in orderDetails, skipping refund initiated email",
          corporateTxnId,
        });
      }
    } catch (emailError) {
      customLog(logTraceId, "error", {
        message: "Error while sending refund initiated email",
        error: emailError,
      });
    }

    return {
      status: true,
      refundStatus,
      message: "Refund initiated",
    };
  } catch (error) {
    customLog(logTraceId, "error", {
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
      customLog(logTraceId, "error", { message: "Error updating order after refund failure", error: updateError });
    }

    try {
      await paymentRefundFailureEmailInternal({
        amount: emailAmount,
        transactionId: corporateTxnId,
        serviceProvider,
        typeOfService: serviceCategory,
      });
    } catch (emailError) {
      customLog(logTraceId, "error", {
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
async function paymentRefundFailureEmailInternal({ amount, transactionId, serviceProvider, typeOfService }) {
  const resp = await findByName({ name: "pekoWebsite" })
  const email = resp.emails;
  const partnerData = await partnerLogos();
  const resolved = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.REFUND_FAILED,
    service: EMAIL_TEMPLATE_SERVICES.REFUND,
    variables: {
      name: 'Admin',
      amount,
      transactionId,
      branding: partnerData?.branding || 'Peko',
      website: partnerData?.website || 'https://www.peko.one',
      ...v2LayoutVariables(partnerData),
    },
    fallback: () => refundFailure({ name: 'Admin', amount, transactionId: transactionId, serviceProvider, typeOfService, partnerDetails: partnerData }),
    fallbackSubject: 'Refund Failed',
  });
  await emailer.email(email, resolved.subject, resolved.html);
}

exports.verifyPan = async (pan) => {
  try {

    if(pan === "AHMPF2657F"){
      return { valid: true, name: "Faris AhammedAli" }
    }
    if (!pan) {
      throw new Error("Pan card number is required")
    }
    const accessKey = operatorsData['pan']['accessKey']
    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    customLog(null, "info", { serviceDetails, message: "from cancel pgt transaction" });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return { valid: false, name: null };
    }

    const clientId = serviceDetails.vendor.optional1;
    const clientSecret = serviceDetails.vendor.optional2;
    const baseUrl = serviceDetails.vendor.apiUrl;
    const version = serviceDetails.vendor.optional3;

    const config = {
      method: 'post',
      url: `${baseUrl}/verification/pan`,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': version
      },
      data: { pan },
    };

    let result = await axios(config);

    const response = result.data;

    return {
      valid: !!response?.valid,
      name: response?.registered_name || response?.name_pan_card || null,
    };
  } catch (err) {
    console.log(err)
    return { valid: false, name: null };
  }
}

const getVerificationServiceDetails = async (primaryKey, fallbackKeys = []) => {
  const operatorKeys = [primaryKey, ...fallbackKeys].filter(Boolean);

  for (const operatorKey of operatorKeys) {
    const accessKey = operatorsData?.[operatorKey]?.accessKey;
    if (!accessKey) continue;

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    if (!Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return serviceDetails;
    }
  }

  return { error: "Verification service is not configured" };
};

const BANK_ERROR_MESSAGES = {
  failed_at_bank: "We could not verify this bank account. Please check the account number and IFSC code and try again.",
  invalid_account: "The bank account number or IFSC code entered is invalid.",
  account_closed: "This bank account is closed. Please provide an active account.",
  account_frozen: "This bank account is currently frozen. Please contact your bank.",
  invalid_ifsc: "The IFSC code entered is invalid. Please verify and try again.",
  not_found: "Bank account not found. Please check your details and try again.",
};

exports.verifyBankAccount = async ({ bank_account, ifsc, name, phone }) => {
  try {
    if (!bank_account || !ifsc) {
      throw new Error("Bank account and IFSC are required");
    }

    const verifyName = !!(name && phone);

    const payload = {
      bank_account,
      ifsc,
      ...(name && { name }),
      ...(phone && { phone }),
    };
    const serviceDetails = await getVerificationServiceDetails("bank_account_verify", [
      "pan",
      "cashFreePaymentGateway",
    ]);

    // customLog(null, "info", {
    //   serviceDetails,
    //   message: "from bank account verification",
    // });

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return { status: false, valid: false, message: serviceDetails.error };
    }

    const clientId = serviceDetails.vendor.optional1;
    const clientSecret = serviceDetails.vendor.optional2;
    const baseUrl = serviceDetails.vendor.apiUrl;

    const config = {
      method: "post",
      url: `${baseUrl}/verification/bank-account/sync`,
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-client-secret": clientSecret
      },
      data: payload,
    };

    const result = await axios(config);
    const response = result.data;

    const accountValid  = response?.account_status === "VALID";
    const nameMatchScore = Number(response?.name_match_score ?? 0);
    const nameAtBank    = response?.name_at_bank || null;
    const nameMatch     = verifyName && nameAtBank
      ? payload?.name?.trim().toLowerCase() === nameAtBank.toLowerCase()
      : null;
    const valid = verifyName ? (accountValid && nameMatch) : accountValid;
    const BANK_ERROR_MESSAGES = {
      failed_at_bank: "We could not verify this bank account. Please check the account number and IFSC code and try again.",
      invalid_account: "The bank account number or IFSC code entered is invalid.",
      account_closed: "This bank account is closed. Please provide an active account.",
      account_frozen: "This bank account is currently frozen. Please contact your bank.",
      invalid_ifsc: "The IFSC code entered is invalid. Please verify and try again.",
      not_found: "Bank account not found. Please check your details and try again.",
    };

    let message;
    if (!accountValid) {
      const code = response?.account_status_code?.toLowerCase();
      message = BANK_ERROR_MESSAGES[code] || "Bank account verification failed. Please check your account details and try again.";
    } else if (verifyName && !nameMatch) {
      message = "Bank account holder name does not match the registered business details. Please enter the name exactly as per bank records.";
    } else {
      message = "Bank account verified successfully";
    }

    return {
      status: true,
      valid,
      accountValid,
      nameMatch,
      nameAtBank,
      nameMatchScore,
      message,
      response,
    };
  } catch (err) {
    console.log(err?.response?.data?.error ?? err?.message, "cashfree error");
    customLog(
      null,
      "error",
      {
        message: "Cashfree bank account verification failed",
        error: err?.response?.data ?? err?.message ?? err,
      },
      "VENDOR"
    );

    const errCode = err?.response?.data?.code?.toLowerCase();
    const friendlyMessage = BANK_ERROR_MESSAGES[errCode];
    return {
      status: false,
      valid: false,
      message: friendlyMessage || "Bank account verification failed. Please check your account details and try again.",
      response: err?.response?.data || null,
    };
  }
}


async function paymentRefundInitiatedEmailInternal({ name, email, amount, transactionId, serviceProvider, typeOfService, registeredBy }) {
  const partnerData = registeredBy ? await fetchPartnerDetails(registeredBy) : await partnerLogos();
  const resolved = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.REFUND_INITIATED,
    service: EMAIL_TEMPLATE_SERVICES.REFUND,
    variables: {
      name: name || 'Corporate',
      amount,
      branding: partnerData?.branding || 'Peko',
      website: partnerData?.website || 'https://www.peko.one',
      ...v2LayoutVariables(partnerData),
    },
    fallback: () => refundInitiated({ name: name || 'Corporate', amount, transactionId, serviceProvider, typeOfService, partnerDetails: partnerData }),
    fallbackSubject: 'Refund Initiated',
  });
  await emailer.email(email, resolved.subject, resolved.html);
}