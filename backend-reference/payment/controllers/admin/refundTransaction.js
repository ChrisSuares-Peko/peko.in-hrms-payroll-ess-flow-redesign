
const asyncHandler = require('../../middlewares/async');
const { findAllRefundTransactions, findTransactionsById } = require('../../models/use-cases/transaction');
const { createNotification } = require("../../models/use-cases/notification");
const ErrorResponse = require('../../utils/error-response')
// const { refundCardTransaction } = require('../corporate/payment_gateway');
const { refundWalletTransaction, getPartialRefundDetails } = require('../../utils/walletTransaction');
const { formatNumberWithLocalString } = require('../../utils/formatter');
const { findOne, fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { createOtp, verifyOtp } = require("../../models/use-cases/otp");
const { customLog } = require('../../utils/loggerHelper');
const { emailOTPTemaplte } = require("../../utils/emailTemplates");
const emailer = require("../../utils/emailer");
const { partnerLogos } = require("../../utils/partnerLogos");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");

// const walletTransaction = require('./../models/entities/transaction')
// const emailer = require('../../utils/emailer');
// const {generateRefundTransactionEmail} = require('../../utils/emailTemplate/refundTransaction');
const moment = require('moment');
const { cancelPGTransaction } = require('../../utils/pgRefund');
const { cancelCcAvenueTransaction } = require('../../utils/ccavenueGateway');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');

exports.findRefundTransactions = asyncHandler(async (req, res, next) => {
    let { corporateId, page, itemsPerPage, sort, sortField, partnerId } = req.query;
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage;

    let offset;
    if (page && itemsPerPage) {
        offset = (page - 1) * itemsPerPage;
    }
    let serviceAccessKey = req.query.serviceAccessKey || undefined;
    let searchText = req.query.searchText || '';
    let fromStart = req.query.fromStart || moment(new Date()).format('YYYY-MM-DD') + " 00:00:00";
    let endDate = req.query.endDate || moment(new Date()).format('YYYY-MM-DD') + " 23:59:59";
    let params = { limit, offset, serviceAccessKey, corporateId, fromStart, endDate, searchText, sort, sortField, partnerId };
    const transactionsData = await findAllRefundTransactions(params);
    if (!transactionsData) {
        return next(new ErrorResponse(`Something went wrong while fetching data`, 400))
    } else {
        return res.status(200).json({
            status: true,
            message: 'Transactions fetched successfully',
            responseCode: '000',
            data: transactionsData
        })
    }
})

exports.refundAndUpdateOrder = asyncHandler(async (req, res, next) => {
    let data = req.body;
    let { corporateTxnId, refundAmount } = data;
    if (!corporateTxnId) {
        return next(new ErrorResponse("Please select transaction to continue", 400));
    }

    let response;
    let email;
    // F-PAY-14: OTP is mandatory for every refund (was only enforced when the client sent scope:"email").
    if (!data.otp) {
        return res.status(401).json({ status: false, message: "otp is required", data: {}, responseCode: "001" });
    }
    email = req.user.email;
    if (!req.user.email) {
        const result = await findOne(req.user);
        email = result.email;
    }
    response = await verifyOtp({ contact: email, otp: data.otp, context: "email" });
    if (response.isVerified === false) {
        return res.status(401).json({ status: false, message: response.message, data: {}, responseCode: "000" });
    }

    let transactions = await findTransactionsById(corporateTxnId);
    let totalRefundAmount = transactions.order.amountInINR;
    let couponUsed = 0;

    if (transactions.order.couponData && transactions.order.couponData.usedCouponData) {
        try {
            const parsedCoupon = transactions.order.couponData.usedCouponData;
            couponUsed = parsedCoupon?.discountAmount || 0;
        } catch (err) {
            customLog(req?.LogTraceId, "error", {
                message: "Error parsing coupon data",
                error: err.message,
                couponData: transactions.order.couponData,
            });
            return next(new ErrorResponse("Invalid coupon data format", 400));
        }
    }
    totalRefundAmount = Number(totalRefundAmount) - Number(couponUsed);

    if (totalRefundAmount <= 0) {
        return next(new ErrorResponse("Refund amount should be greater than zero", 400));
    }

    // Validate the admin-entered amount; undefined => full refund.
    let normalizedRefund;
    if (refundAmount !== undefined && refundAmount !== null && `${refundAmount}`.trim() !== "") {
        normalizedRefund = Number(refundAmount);
        if (!Number.isFinite(normalizedRefund) || normalizedRefund <= 0) {
            return next(new ErrorResponse("Refund amount must be a number greater than zero", 400));
        }
        if (normalizedRefund > totalRefundAmount) {
            return next(new ErrorResponse("Refund amount should not be greater than total amount", 400));
        }
    }

    let username = transactions.credential.username;
    let id = transactions.credential.id;
    let serviceProvider = transactions.serviceOperator.serviceProvider;
    let paymentMode = "";
    let paymentData;

    paymentMode = transactions.order.paymentMode;

    if (transactions?.order?.paymentModeResponse) {
        paymentData = JSON.parse(transactions?.order?.paymentModeResponse);
    }

    const pgAmountFloat = parseFloat(paymentData?.pgAmount);
    const partialRefund = await getPartialRefundDetails({ corporateTxnId, refundAmount: normalizedRefund });

    if (paymentMode == "WALLET") {
        let updateDetails;
        if (transactions.remarks === "Payment Successful") {
            updateDetails = {
                corporateTxnId,
                status: "REFUNDED",
                providerId: "Not Available",
                message: "Refund initiated",
                registeredById: req.user.registeredBy,
            };
        } else {
            updateDetails = {
                corporateTxnId,
                status: "FAILURE",
                providerId: "Not Available",
                message: "Payment Failed",
                registeredById: req.user.registeredBy,
            };
        }
        updateDetails.partialRefund = partialRefund;
        updateDetails.refundedAmount = normalizedRefund ?? totalRefundAmount;
        await refundWalletTransaction(updateDetails);

        publishJournalEvent({
            transactionRef: corporateTxnId,
            type: "adminRefund",
            contextSnapshot: { credentialId: id },
            amounts: { refundAmount: normalizedRefund ?? totalRefundAmount, totalOrderAmount: totalRefundAmount },
        }, req?.LogTraceId);
    }
    // A corporate card payment is gateway-shaped money: refunded through cancelPGTransaction, which routes it to a
    // Pine Labs Cancel Redeem instead of Cashfree.
    else if (paymentMode == "Payment Gateway" || paymentMode == "PAYMENT GATEWAY" || paymentMode == "PAYMENT GATEWAY + WALLET"
        || paymentMode == "CORPORATE CARD" || paymentMode == "CORPORATE CARD + WALLET") {
        if (!isNaN(pgAmountFloat)) {
            paymentData.pgAmount = pgAmountFloat;
        }

        // Split PG + Wallet partial: Cashfree refunds only the card leg; the wallet leg is handled by refundWalletTransaction.
        let cardLegToRefund;
        if (normalizedRefund !== undefined) {
            cardLegToRefund = String(paymentMode).endsWith("+ WALLET")
                ? Number(partialRefund?.bankCardRefund ?? 0)
                : normalizedRefund;
        }
        // Card leg of 0 (refund fully attributable to the wallet) => skip the gateway, refund the wallet leg only.
        const skipGateway = cardLegToRefund !== undefined && cardLegToRefund <= 0;
        const isCcAvenue = paymentData?.gateway === "CC_AVUNUE";
        const status = skipGateway
            ? { refundStatus: "SUCCESS" }
            : isCcAvenue
                ? await cancelCcAvenueTransaction(corporateTxnId, cardLegToRefund, normalizedRefund ?? totalRefundAmount, req?.LogTraceId)
                : await cancelPGTransaction(corporateTxnId, cardLegToRefund, normalizedRefund ?? totalRefundAmount, req?.LogTraceId);

        if (status.message === "Refund already initiated") {
            return next(new ErrorResponse("A refund has already been initiated for this transaction", 400));
        }

        if (status.refundStatus === 'SUCCESS' || status.refundStatus === 'PENDING' || status.refundStatus === 'INITIATED') {
            const updateDetails = {
                corporateTxnId,
                status: transactions.remarks === "Payment Successful" ? "REFUNDED" : "FAILURE",
                providerId: "Not Available",
                message: transactions.remarks === "Payment Successful" ? "Refund initiated" : "Payment Failed",
                registeredById: req.user.registeredBy,
            };
            updateDetails.partialRefund = partialRefund;
            updateDetails.refundedAmount = normalizedRefund ?? totalRefundAmount;
            await refundWalletTransaction(updateDetails);

            publishJournalEvent({
                transactionRef: corporateTxnId,
                type: "adminRefund",
                contextSnapshot: { credentialId: id },
                amounts: { refundAmount: normalizedRefund ?? totalRefundAmount, totalOrderAmount: totalRefundAmount },
            }, req?.LogTraceId);

            // A gateway refund is only INITIATED synchronously; Cashfree's refund webhook confirms final success.
            // (skipGateway = wallet-only leg of a split refund, which settles instantly => reported as completed below.)
            if (!skipGateway) {
                createNotification({
                    notificationTitle: 'Refund Initiated',
                    notificationBrief: `Your refund of ₹ ${formatNumberWithLocalString(normalizedRefund ?? totalRefundAmount)} for ${serviceProvider} has been initiated. Transaction ID: ${corporateTxnId}.`,
                    notificationTo: [username],
                    notificationCategory: 'CORPORATE',
                    notificationBy: 'ADMIN',
                    accessKey: null,
                    action: '1'
                }, id);
                return res.status(200).json({
                    status: true,
                    message: "Refund process initiated",
                    responseCode: "000",
                    data: {},
                });
            }
        } else {
            return next(new ErrorResponse(`Something went wrong in refunding`, 400));
        }
    }
    else {
        return next(new ErrorResponse(`Refund is not available for this payment mode`, 400));
    }

    const notificationData = {
        notificationTitle: 'Refund successful',
        notificationBrief: `We have processed your refund of ₹ ${formatNumberWithLocalString(normalizedRefund ?? totalRefundAmount)} for ${serviceProvider}. Transaction ID: ${corporateTxnId}.`,
        notificationTo: [username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN',
        accessKey: null,
        action: '1'
    };
    createNotification(notificationData, id);
    return res.status(200).json({
        status: true,
        message: "Refund process is completed",
        responseCode: "000",
        data: {},
    });
});

exports.getOtp = asyncHandler(async (req, res) => {
  let { scope } = req.query;
  let otp;
  let email;
  if (scope === "email") {
    email = req.user.email;
    if (!req.user.email) {
      //get email from system user
      const result = await findOne(req.user);
      email = result?.email;
    }
    if (!email) {
      return res.status(400).json({
        status: false,
        message: "No email address is configured to send the OTP.",
        data: {},
        responseCode: "000",
      });
    }
    //it will create a bycrypted otp in db and return the created otp to send via email
    otp = await createOtp({ contact: email });
    if (!otp) {
      return res
        .status(500)
        .json({
          status: false,
          message: "Failed to create OTP.",
          data: {},
          responseCode: "000",
        });
    }
    //Sending Email with otp
    let partnerData;
    req.user.registeredBy ? (partnerData = await fetchPartnerDetails(req.user.registeredBy)) : (partnerData = await partnerLogos());
    const resolvedRefundOtp = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.TRANSACTION_REFUND_REQUEST_OTP,
      service: EMAIL_TEMPLATE_SERVICES.REFUND,
      variables: {
        name: req.user.name,
        otp,
        branding: partnerData?.branding || 'Peko',
        website: partnerData?.website || 'https://www.peko.one',
        ...v2LayoutVariables(partnerData),
      },
      fallback: () => emailOTPTemaplte(req.user.name, otp),
      fallbackSubject: "Transaction Refund Request",
      partnerId: req.user.registeredBy || null,
      logTraceId: req?.LogTraceId,
    });
    await emailer.email(
      email,
      resolvedRefundOtp.subject,
      resolvedRefundOtp.html
    );
  }
  customLog(req?.LogTraceId, "info", {
    message: "Email OTP generated",
    scope: scope,
  });

  return res.status(200).json({
    status: true,
    message: "OTP sent successfully via email.",
    data: { email },
    responseCode: "000",
  });
});