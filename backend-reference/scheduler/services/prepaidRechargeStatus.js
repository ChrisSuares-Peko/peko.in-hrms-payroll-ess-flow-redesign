/* eslint-disable no-prototype-builtins */
const axios = require("axios");
const { Op } = require("sequelize");
const transaction = require("../models/entities/transaction");
const order = require("../models/entities/order");
const credential = require("../models/entities/credential");
const { updateWalletTransaction, refundWalletTransaction } = require("../utils/walletTransaction");
const { cancelPGTransaction } = require("../utils/pgRefund");
const { findServiceOperatorByAccessKey } = require("../utils/checkAndFetchServiceDetails");
const { createNotification } = require("../models/use-cases/notification");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const emailer = require("../utils/emailer");
const { generateMobilePaymentSuccessEmailBill, commonFailedTemplateforBillPayments } = require("../utils/email/emailTemplates/billpayments");
const { customLog } = require("../utils/loggerHelper");
const operatorsData = require("../utils/operatorsData.json");
const { formatNumberWithLocalString } = require("../utils/formatter");
const { resolveEmailTemplate } = require("./emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/emailTemplate/sharedLayout");

const frontendBaseUrl = process.env.NODE_ENV === "production" ? process.env.PRODUCTION_URL : process.env.FRONTEND_STAGING_URL;
const { generateOrderInvoiceAttachments } = require("./invoiceAndReceipt");

const { accessKey, transactionCategory: TRANSACTION_CATEGORY } = operatorsData.prepaid;
const POLL_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.pollPrepaidRechargeStatus = async () => {
  customLog(null, "info", { message: "Prepaid recharge status poll started" });
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const pendingTransactions = await transaction.findAll({
      where: {
        transactionCategory: TRANSACTION_CATEGORY,
        status: { [Op.in]: ["PENDING", "PROCESSING"] },
        transactionDate: { [Op.lt]: fifteenMinutesAgo, [Op.gt]: tenDaysAgo },
      },
      include: [
        { model: order, attributes: ["id", "accountNo", "baseAmount", "corporateTxnId", "amountInINR", "paymentMode", "surcharge"] },
        { model: credential, attributes: ["email", "name", "username", "registeredBy"] },
      ],
      raw: true,
      nest: true,
    });

    if (!pendingTransactions.length) {
      customLog(null, "info", { message: "No pending/processing prepaid transactions found" });
      return;
    }

    customLog(null, "info", { message: `Found ${pendingTransactions.length} pending/processing prepaid transactions` });

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    if (serviceDetails.hasOwnProperty("error")) {
      customLog(null, "info", { message: "Failed to fetch service details" });
      return;
    }

    const statusApiUrl = serviceDetails.vendor.optionals?.["STATUS_URL"];
    const corporateNumber = serviceDetails.vendor.optional3;

    if (!statusApiUrl) {
      customLog(null, "info", { message: "STATUS_URL not configured in vendor optionals" });
      return;
    }

    for (const txn of pendingTransactions) {
      try {
        const corporateTxnId = txn.corporateTxnId;

        const config = {
          method: "post",
          url: `${statusApiUrl}/api/RechargeStatus`,
          headers: { "Content-Type": "application/json" },
          data: { CorporateNumber: corporateNumber, SystemReference: corporateTxnId },
        };

        customLog(null, "info", { message: "Calling recharge status API", url: config.url, corporateTxnId }, "VENDOR");
        const result = await axios(config);
        customLog(null, "info", { message: "Response from recharge status API", url: config.url, result: result?.data, corporateTxnId }, "VENDOR");

        // eslint-disable-next-line no-prototype-builtins
        if (!result?.data || !result.data.hasOwnProperty("Status")) {
          customLog(null, "info", { message: "Blank or malformed response, keeping as PROCESSING", corporateTxnId });
          continue;
        }

        const { Status, Message, TransactionReference } = result.data;

        const userName = txn.credential?.name;
        const userEmail = txn.credential?.email;
        const username = txn.credential?.username;
        const registeredBy = txn.credential?.registeredBy;
        const amount = formatNumberWithLocalString(txn.order?.amountInINR || txn.order?.baseAmount);
        const accountNo = txn.order?.accountNo;
        const partnerData = await fetchPartnerDetails(registeredBy);

        if (Status === "0") {
          await updateWalletTransaction({
            corporateTxnId,
            providerId: TransactionReference || "Not Available",
            status: "SUCCESS",
            message: "Payment Successful",
            orderResponse: JSON.stringify({ billDetails: result.data }),
          });
          customLog(null, "info", { message: "Transaction marked SUCCESS", corporateTxnId, TransactionReference });

          const loginUrl = `${frontendBaseUrl}/auth/login`;
          const resolvedSuccess = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_SUCCESS,
            service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
            variables: {
              serviceType: "Recharge",
              name: userName,
              loginUrl,
              branding: partnerData?.branding || 'Peko',
              website: partnerData?.website || 'https://www.peko.one',
              ...v2LayoutVariables(partnerData),
            },
            fallback: () => generateMobilePaymentSuccessEmailBill("Recharge", userName, partnerData, loginUrl),
            fallbackSubject: "Recharge Successful",
          });
          const baseAmount = Number(txn.order?.amountInINR ?? txn.order?.baseAmount) || 0;
          const orderSurcharge = Number(txn.order?.surcharge) || 0;
          const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount: baseAmount,
            surcharge: orderSurcharge,
            couponDiscount: 0,
            corporateTxnId,
            orderId: txn.order?.id,
            paymentType: "Mobile Recharge",
            description: "Mobile Recharge",
            credentialId: txn.credentialId,
            pgAmount:
              txn.order?.paymentMode === "PAYMENT GATEWAY"
                ? baseAmount + orderSurcharge
                : null,
            traceId: null,
          });
          emailer.emailWithMultipleAttachment(userEmail, resolvedSuccess.subject, resolvedSuccess.html, invoiceAttachments, () => {});
          createNotification({
            notificationTitle: "Payment Successful",
            notificationBrief: `Recharge of ₹${amount} for ${accountNo} with transaction ID ${corporateTxnId} was successful.`,
            notificationTo: [username],
            notificationCategory: "CORPORATE",
            notificationBy: "ADMIN",
          });
        } else if (Status === "2") {
          const paymentMode = txn.order?.paymentMode || "WALLET";
          const failureUpdate = {
            corporateTxnId,
            status: "REFUNDED",
            providerId: TransactionReference || "Not Available",
            message: Message,
            orderResponse: JSON.stringify({ billDetails: result.data, failed: "from poll prepaid status" }),
            registeredById: registeredBy ?? undefined,
          };

          if (paymentMode === "PAYMENT GATEWAY" || paymentMode === "PAYMENT GATEWAY + WALLET") {
            const refundStatus = await cancelPGTransaction(
              null,
              corporateTxnId,
              Number(txn.order?.amountInINR || txn.order?.baseAmount || 0)
            );
            if (refundStatus?.status) {
              await refundWalletTransaction(failureUpdate);
            } else if (paymentMode === "PAYMENT GATEWAY + WALLET") {
              await refundWalletTransaction(failureUpdate);
            } else {
              await updateWalletTransaction({
                corporateTxnId,
                status: "FAILURE",
                providerId: TransactionReference || "Not Available",
                message: Message || "Transaction Failed",
                orderResponse: JSON.stringify({
                  billDetails: result.data,
                  refundStatus,
                  failed: "pg-refund-failed-from-poll-prepaid-status",
                }),
              });
              customLog(null, "error", {
                message: "PG refund failed for prepaid status polling",
                corporateTxnId,
                refundStatus,
              });
            }
          } else {
            await refundWalletTransaction(failureUpdate);
          }

          const resolvedFailure = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_FAILED,
            service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
            variables: {
              serviceType: operatorsData.prepaid.type,
              account: accountNo,
              serviceProvider: operatorsData.prepaid.transactionCategory,
              name: userName,
              branding: partnerData?.branding || 'Peko',
              website: partnerData?.website || 'https://www.peko.one',
              ...v2LayoutVariables(partnerData),
            },
            fallback: () => commonFailedTemplateforBillPayments(
              operatorsData.prepaid.type, accountNo, operatorsData.prepaid.transactionCategory, userName, partnerData
            ),
            fallbackSubject: "Transaction Failed",
          });
          emailer.email(userEmail, resolvedFailure.subject, resolvedFailure.html, () => {});
          createNotification({
            notificationTitle: "Payment Failed",
            notificationBrief: `Recharge of ₹${amount} for ${accountNo} with transaction ID ${corporateTxnId} was Failed.`,
            notificationTo: [username],
            notificationCategory: "CORPORATE",
            notificationBy: "ADMIN",
          });
        } else {
          // Status 1, 4, 5, 6 — still inprocess, leave as-is
          customLog(null, "info", { message: "Transaction still inprocess", corporateTxnId, Status });
        }
      } catch (innerError) {
        customLog(null, "error", { message: "Error processing transaction", corporateTxnId: txn.corporateTxnId, error: innerError.message });
      } finally {
        await sleep(POLL_DELAY_MS);
      }
    }

    customLog(null, "info", { message: "Prepaid recharge status poll completed" });
  } catch (error) {
    customLog(null, "error", { message: "Unhandled error in prepaid recharge status poll", error: error.message });
  }
};
