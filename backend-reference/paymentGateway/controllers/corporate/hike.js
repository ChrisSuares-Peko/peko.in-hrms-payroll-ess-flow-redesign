const { fetchServiceDetails, calculateSurchargeWithTax } = require("../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../../utils/error-response");
const { createWalletTransaction, updateWalletTransaction } = require("../../utils/walletTransaction");
// const { getInvoicePDF, createZohoPaymentRecord, createZohoInvoice, calculateAmountWithTax, calculateSurchargeAndTax } = require("../../utils/zohoMethods");
const emailer = require("../../utils/emailer");
const { createNotification } = require("../../models/use-cases/notification");
const { commonFailedTemplate } = require("../../utils/emailTemplates/common");
const wallet = require("../../models/entities/wallet");
const { generateHikePurchaseSuccessEmail } = require("../../utils/emailTemplates/hike");
const asyncHandler = require("../../middlewares/async");
const accessKey = 'hike_service';
// const { generatePekoReceipt } = require("../../utils/pekoRecieptHelper");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { findHikesByIds } = require("../../models/use-cases/hike");
const { customLog } = require("../../utils/loggerHelper");
const { createPGTransaction } = require("../../utils/paymentGatewayTransaction");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");
const { formatNumberWithLocalString } = require("../../utils/formatter");

exports.payment = asyncHandler(async (req, res, next) => {
  let transactionCategory = "Hike";
  const account = req.body.account;
  const totalAmount = req.body.amount;
  const payCashback = req.body.payCashback;
  const credentialId = req.user.id;
  const corporateUserId = req.user.corporateId;
  const packageId = req.user.packageId;
  const name = req.user.name;
  const emailId = req.user.email;
  const subCorporateEmail = req.user.subCorporateEmail;
  const selectedHikes = req.body.selectedHikes;
  const isSubCorporateUser = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername;

  let partnerDetails;
  partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails["error"], 500));
  }

  let commissionType = serviceDetails.commissionType;
  let cashbackType = serviceDetails.cashbackType;
  let providerCommission = serviceDetails.providerCommission;
  let corporateCashback = serviceDetails.cashback;
  let serviceOperatorId = serviceDetails.id;
  // Calculate surcharge with tax using common function
  const surchargeDetails = await calculateSurchargeWithTax(
    serviceDetails.surcharge,
    serviceDetails.surchargeType,
    totalAmount,
    credentialId
  );
  const surcharge = surchargeDetails.surcharge;  // first we will  do transaction
  let subCorporateUserId;
  if (req.user.role === "CORPORATE_SUB_USER") {
    subCorporateUserId = req.user.subCorporateId;
  }
  const corporateTxnId = req.body.corporateTxnId;
  const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
  let transactionResponse = {};

  const hikeIds = selectedHikes.map((item) => item.id).filter(Boolean);
  const hikeRecords = hikeIds.length ? await findHikesByIds(hikeIds, credentialId) : [];
  const hikesMap = Object.fromEntries(hikeRecords.map((h) => [h.id, h]));
  const planDetails = selectedHikes.map((item) => {
      const hikeRecord = hikesMap[item.id] || {};
      return {
          name: hikeRecord.name || "Hike Service",
          commissionMode: hikeRecord.commissionMode,
          commissionType: hikeRecord.commissionType,
          commission: hikeRecord.commission,
          fixedCommissionPerTransaction:
              hikeRecord.fixedCommissionPerTransaction,
          isCommissionInclGST: hikeRecord.isCommissionInclGST,
          isCommissionConfigured: hikeRecord.isCommissionConfigured,
          amount: hikeRecord.amount,
          quantity: item.quantity,
      };
  });

  const reportData = await computeJournalData({
    serviceDetails,
    pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
    amount: totalAmount,
    paymentMethod: pgResponse?.payment_method || {},
    partnerDetails,
    paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
    couponTotalDiscount: req.body.couponTotalDiscount,
    planDetails,
    corporateState: req.user.state,
    credentialId,
  });

  const commonParams = {
    providerId: corporateTxnId,
    corporateTxnId,
    credentialId,
    serviceOperatorId,
    corporateCashback,
    accountNo: account,
    transactionCategory,
    orderAmount: totalAmount,
    commissionType,
    cashbackType,
    providerCommission,
    payCashback,
    surcharge,
    subCorporateUserId,
    reportData,
  };


if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
    transactionResponse = await createPGTransaction({
      ...commonParams,
      pgAmount: req.body.pgAmount,
      pgResponse: req.body.paymentGatewayResponse,
      couponCode: req.body.couponCode,
      corporateUserId,
      partnerId: req.user.registeredBy,
    });
  } else {
    transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount: totalAmount,
    });
  }



  if (
    transactionResponse &&
    Object.prototype.hasOwnProperty.call(transactionResponse, "error")
  ) {
    return next(new ErrorResponse(transactionResponse["error"], 500));
  }


  let updateDetails = {
    corporateTxnId,
    providerId: "Not Available",
    status: "SUCCESS",
    message: "Payment Successful",
    orderResponse: JSON.stringify({
      selectedHikes,
    }),
  };

  if (updateDetails.message === "Payment Successful") {
    // if (process.env.NODE_ENV === "production") {
    //   cleverTap.uploadEvent({
    //     eventName: "Transactions",
    //     eventData: {
    //       Status: "Payment Success",
    //     },
    //     email: emailId,
    //   });
    // }

    const paymentDetails = {
      transactionId: corporateTxnId,
      account: account,
      amount: (parseFloat(totalAmount) + parseFloat(surcharge) - transactionResponse.couponDiscount).toFixed(2),
    };

    // Send notification
    const notificationData = {
      notificationTitle: "Hike Purchase - Payment Successful",
      notificationBrief: `Payment of ₹ ${paymentDetails.amount} for Hike Purchase was successful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };


    // const paymentMethod = req.body.paymentGatewayResponse.paymentMethod

    // await createZohoPaymentRecord({customer_id, invoice_id, paymentMode: "PAYMENT GATEWAY", reference_number: corporateTxnId, amount: paymentDetails?.amount, paymentMethod: paymentMethod, isBankChargeApplicable: true})

    createNotification(notificationData);

    // Send email
    let to, cc;
    if (subCorporateEmail) {
      to = subCorporateEmail;
      cc = emailId;
    } else {
      to = emailId;
      cc = undefined; // or omit if not needed
    }
    const subject = "Hike purchase successful";
    const resolvedHikeSuccess = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.HIKE_PURCHASE_SUCCESS,
      service: EMAIL_TEMPLATE_SERVICES.HIKE,
      variables: {
        name,
        transactionId: paymentDetails.transactionId,
        amount: formatNumberWithLocalString(totalAmount),
        surcharge: formatNumberWithLocalString(surcharge),
        branding: partnerDetails?.branding || 'Peko',
        website: partnerDetails?.baseUrl || 'https://peko.one/in',
        ...v2LayoutVariables(partnerDetails),
      },
      fallback: () => generateHikePurchaseSuccessEmail(
        name,
        paymentDetails.transactionId,
        totalAmount,
        surcharge,
        selectedHikes,
        partnerDetails
      ),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedHikeSuccess.html;

    const invoiceAttachments = await generateOrderInvoiceAttachments({
      amount: totalAmount,
      surcharge,
      couponDiscount: transactionResponse.couponDiscount,
      corporateTxnId,
      orderId: transactionResponse.orderId,
      paymentType: "Hike",
      credentialId,
      pgAmount: Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse") ? req.body.pgAmount : null,
      paymentMethod: pgResponse?.payment_method,
      vendor: serviceDetails?.vendor,
      commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
      planDetails,
      commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
      traceId: req?.LogTraceId,
    })

    emailer.emailWithMultipleAttachment(
      to,
      resolvedHikeSuccess.subject,
      body,
      invoiceAttachments,
      cc,
      async (emailErr) => {
        if (emailErr) {
          customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr })
        } else {
          customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
        }
      }
    );
  }

  await updateWalletTransaction(updateDetails);

  if (updateDetails.message === "Payment Successful") {
    publishJournalEvent(
      {
        transactionRef: corporateTxnId,
        type: "payment",
        contextSnapshot: {
          credentialId,
          vendor: serviceDetails?.vendor || null,
          registeredBy: req?.user?.registeredBy || null,
        },
        reportData,
      },
      req?.LogTraceId
    );
  }

  if (updateDetails.message !== "Payment Successful") {
    // if (process.env.NODE_ENV === "production") {
    //   cleverTap.uploadEvent({
    //     eventName: "Transactions",
    //     eventData: {
    //       Status: "Payment Failure",
    //     },
    //     email: emailId,
    //   });
    // }

    const paymentDetails = {
      transactionId: corporateTxnId,
      account: account,
      amount: (parseFloat(totalAmount) + parseFloat(surcharge) - transactionResponse.couponDiscount).toFixed(2),
    };

    const notificationData = {
      notificationTitle: "Hike Purchase - Payment unsuccessful",
      notificationBrief: `Payment of ₹ ${paymentDetails.amount} for Hike Purchase was unsuccessful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };

   
    createNotification(notificationData);

    const subject = "Payment Failed";
    let to, cc;
    if (subCorporateEmail) {
      to = subCorporateEmail;
      cc = emailId;
    } else {
      to = emailId;
      cc = undefined; // or omit if not needed
    }
    const serviceUrl = partnerDetails?.baseUrl;
    const body = commonFailedTemplate(name, "Hike", serviceUrl, partnerDetails);

    emailer.email({to,cc, subject, body}, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });

    const walletDetails = await wallet.findOne({
      where: { credentialId },
      attributes: ["balance"],
    });

   
      return res.status(500).json({
        status: false,
        message: "Something went wrong",
        data: {
          corporateFinalBalance: walletDetails["balance"],
        },
        responseCode: "001",
      });
    
  } else {
   
      return res.status(200).json({
        status: true,
        data: {
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment successful",
        responseCode: "000",
      });
    
  }
});
