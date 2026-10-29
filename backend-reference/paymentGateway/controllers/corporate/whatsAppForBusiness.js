const { createNotification } = require("../../models/use-cases/notification");
const {
  fetchServiceDetails,
  calculateSurcharge,
  calculateAmountWithTax,
  calculateSurchargeWithTax,
} = require("../../utils/checkAndFetchServiceDetails");

const {
  createWalletTransaction,
  refundWalletTransaction,
  updateWalletTransaction,
} = require("../../utils/walletTransaction");
const emailer = require("../../utils/emailer");
const asyncHandler = require("../../middlewares/async");
const { wccCreditUpdateApi, createProjectApi, fetchVendorDetailsByServiceDetails, ReActivateProjectPlanApi, UpdateProjectPlanApi } = require("../../services/whatsAppForBusiness");
const wallet = require("../../models/entities/wallet");
const { whatsappForBusiness } = require("../../utils/emailTemplate/whatsAppForBusiness");
const { fetchWhatsAppBusinessByCredentialId, findActiveSubscriptionByCredentialId, findActiveBotBuilderByCredentialId, findActiveShopifyIntegrationByCredentialId } = require("../../models/use-cases/whatsappforBusiness");
const { subscriptionIndividualSuccessEmail } = require("../../utils/emailTemplates/subscription");
const { createWhatsApSubscription, createBotBuilderSubscription, updateWhatsAppSubscription } = require("../../utils/whatsappForBusiness");
const { computeUpgradeCredit } = require("../../utils/upgradeCredit");
const { formatNumberWithLocalString } = require("../../utils/formatter");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { findOneOrderByTxnId } = require("../../models/use-cases/order");
const { customLog } = require("../../utils/loggerHelper");
const { createPGTransaction } = require("../../utils/paymentGatewayTransaction");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const ErrorResponse = require("../../utils/error-response");
const { getBotBuilderValues, getShopifyIntegrationValues } = require("../../models/use-cases/setting");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const WhatsAppSubscription = require("../../models/entities/whatsappSubscription");
const { cancelCardTransaction } = require("./payment_gateway");
const { paymentGateWayRefundFailureEmail } = require("../../utils/emailSender");
const { commonFailedTemplate } = require("../../utils/emailTemplates");
const Package = require("../../models/entities/package");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");

// const { generatePekoReceipt } = require("../../utils/pekoRecieptHelper");

let accessKey = "REDACTED";

// Single call site (exports.payment).
async function resolveWhatsappConversationCreditsSuccessEmail(name, transactionId, service, amount, partnerDetails, subject, logTraceId) {
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.WHATSAPP_CONVERSATION_CREDITS_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.WHATSAPP,
    variables: {
      name,
      transactionId,
      service,
      amount,
      branding: partnerDetails?.branding || 'Peko',
      website: partnerDetails?.baseUrl || 'https://peko.one/in',
      logo: partnerDetails?.logo,
      ...v2LayoutVariables(partnerDetails),
    },
    fallback: () => whatsappForBusiness(name, transactionId, service, amount, partnerDetails),
    fallbackSubject: subject,
    logTraceId,
  });
}

// Shared by 4 call sites in this file (ProjectSubscriptionPayment's isUpgrade/isRenewal/create
// branches, and botBuilderpayment) that all reuse subscription.js's own SUBSCRIPTION_INDIVIDUAL_SUCCESS
// key/design — same key already registered by controllers/corporate/subscription.js, reused here
// since it's the exact same template, just triggered from a different controller file.
async function resolveWhatsappSubscriptionIndividualSuccessEmail(name, transactionId, subscription, packageDetails, partnerDetails, subject, logTraceId) {
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_INDIVIDUAL_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.SUBSCRIPTION,
    variables: {
      name,
      transactionId,
      packageName: packageDetails?.packageName,
      branding: partnerDetails?.branding || 'Peko',
      website: partnerDetails?.baseUrl || 'https://peko.one/in',
      logo: partnerDetails?.logo,
      ...v2LayoutVariables(partnerDetails),
    },
    fallback: () => subscriptionIndividualSuccessEmail(name, transactionId, subscription, packageDetails, partnerDetails),
    fallbackSubject: subject,
    logTraceId,
  });
}

exports.payment = asyncHandler(async (req, res, next) => {
  //check disableService?
  //search for package,cashback,serviceOperator,vendor?
  //userBalance
  //Entry for payment
  //API call
  //update the payment
  // let isMobile = false;
  const platform = req.headers['platform']
  if (req.headers['platform'] && platform === 'mobile') {
      // isMobile = true;
  }
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId;
  const name = req.user.name;
  const email = req.user.email;
  const { account, amount, payCashback, project_id } = req.body;

  let partnerDetails;
  partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
  // Fetch service details
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });

  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        400
      )
    );
  }

  // Prepare transaction data
  const transactionCategory = "WhatsApp for Business";
  const transactionId = req.body.corporateTxnId || new Date().valueOf();
  const providerId = transactionId;
  const serviceOperatorId = serviceDetails.id;
  const surchargeWithoutTax = await calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId)
  const surcharge = await calculateAmountWithTax(surchargeWithoutTax)
  const commissionType = serviceDetails.commissionType;
  const cashbackType = serviceDetails.cashbackType;
  const providerCommission = serviceDetails.providerCommission;
  const corporateCashback = serviceDetails.cashback;

  let subCorporateUserId;
  if (req.user.role === "CORPORATE_SUB_USER") {
    subCorporateUserId = req.user.subCorporateId;
  }

  const pgAmountNum = Number(req.body.pgAmount || 0);

  const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
  const reportData = await computeJournalData({
      serviceDetails,
      pgAmount: pgAmountNum,
      amount: Number(amount),
      paymentMethod: pgResponse?.payment_method || {},
      partnerDetails,
      paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
      couponTotalDiscount: req.body.couponTotalDiscount,
      corporateState: req.user.state || '',
      credentialId,
  })

  const corporateTxnId = req.body.corporateTxnId;
  let transactionResponse = {};

  if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
    transactionResponse = await createPGTransaction({
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      accountNo: account,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      pgAmount: req.body.pgAmount,
      pgResponse: req.body.paymentGatewayResponse,
      surcharge,
      subCorporateUserId,
      couponCode: req.body.couponCode,
      corporateUserId,
      partnerId: req.user.registeredBy,
      reportData
    });
  } else {
    transactionResponse = await createWalletTransaction({
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      surcharge,
      accountNo: account,
      amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      subCorporateUserId,
    });
  }

  if (
    transactionResponse &&
    Object.prototype.hasOwnProperty.call(transactionResponse, "error")
  ) {
    return next(new ErrorResponse(transactionResponse["error"], 500));
  }

  if (reportData) {
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

  // api call
  let { status, data } = await wccCreditUpdateApi(
    project_id,
    amount,
    serviceDetails?.vendor
  );

  let updateDetails = {};
  if (!status) {
    updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: data?.message || "Wcc Credit Update failed",
      registeredById: req.user.registeredBy,
      orderResponse: JSON.stringify(data),
      couponId: transactionResponse.couponId
    };
    if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
      await cancelPGTransaction(corporateTxnId);
      await refundWalletTransaction(updateDetails);
    } else {
      await refundWalletTransaction(updateDetails);
    }
    if (reportData) {
      publishJournalEvent(
        {
          transactionRef: corporateTxnId,
          type: "refund",
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
    // handle notifications-----------------------
    const paymentDetails = {
      transactionId: corporateTxnId,
      account: account,
      amount: (parseFloat(amount) + parseFloat(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2),
    };
    const notificationData = {
      notificationTitle: "Payment Failed",
      notificationBrief: `The payment of ₹ ${paymentDetails.amount} for WhatsApp for Business with transaction ID ${paymentDetails.transactionId} was Failed`,
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };
    if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
      const subcorporateUsername = req.user.subCorporateUsername;
      if (subcorporateUsername) {
        notificationData.notificationTo.push(subcorporateUsername);
      }
    }
    createNotification(notificationData);
    //-------------------------------------------------------

    const walletDetails = await wallet.findOne({
      where: {
        credentialId,
      },
      attributes: ["balance"],
    });
    return res.status(400).json({
      status: false,
      message: "Payment Failed",
      responseCode: "001",
      data: {
        ...data,
        corporateFinalBalance: walletDetails["balance"],
      },
    });
  } else {
    updateDetails = {
      corporateTxnId,
      providerId: "Not Available",
      status: "SUCCESS",
      message: "Payment Successful",
      orderResponse: JSON.stringify(data),
    };
    await updateWalletTransaction(updateDetails);
    transactionResponse.datetime = new Date();
    transactionResponse.amount = (Number(amount) + Number(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2);

    // handle email and notifications-----------------------
    const paymentDetails = {
      transactionId: corporateTxnId,
      account: account,
      amount: (parseFloat(amount) + parseFloat(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2),
    };
    const emailSubject = "Payment Successful";
    const resolvedWcc = await resolveWhatsappConversationCreditsSuccessEmail(name, paymentDetails.transactionId, "WhatsApp for Business", paymentDetails.amount, partnerDetails, emailSubject, req?.LogTraceId);
    const emailBody = resolvedWcc.html;
    const invoiceAttachments = await generateOrderInvoiceAttachments({
      amount,
      surcharge,
      couponDiscount: transactionResponse.couponDiscount || 0,
      corporateTxnId,
      orderId: transactionResponse.orderId,
      paymentType: "WhatsApp for Business",
      description: "WhatsApp credits",
      credentialId,
      pgAmount: Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse") ? req.body.pgAmount : null,
      paymentMethod: pgResponse?.payment_method,
      vendor: serviceDetails?.vendor,
      commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
      traceId: req?.LogTraceId,
    })
    emailer.emailWithMultipleAttachment(email, resolvedWcc.subject, emailBody, invoiceAttachments, async (emailErr) => {
      if (emailErr) {
        customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr })
      } else {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + email })
      }
    });
    const notificationData = {
      notificationTitle: "Payment Successful",
      notificationBrief: `The payment of ₹ ${paymentDetails.amount} for WhatsApp for Business with transaction ID ${paymentDetails.transactionId} was successful`,
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };
    if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
      const subcorporateUsername = req.user.subCorporateUsername;
      if (subcorporateUsername) {
        notificationData.notificationTo.push(subcorporateUsername);
      }
    }
    createNotification(notificationData);
    //-------------------------------------------------------

    return res.status(200).json({
      status: true,
      data: {
        ...{},
        ...transactionResponse,
        corporateTxnId,
      },
      message: "payment successfull",
      responseCode: "000",
    });
  }
});

exports.ProjectSubscriptionPayment = asyncHandler(async (req, res) => {

  customLog(req?.LogTraceId, "info", { body: req.body, user: req.user })

  const corporateId = req.user.corporateId
  const credentialId = req.user.id
  const emailId = req.user.email
  const subCorporateEmail = req.user.subCorporateEmail;
  const companyName = req.user.name
  const corporateTxnId = req.body.paymentRefId || new Date().valueOf()
  const data = req.body
  // const { shopifyIntegration } = req.body
  const pgAmount = req.body.pgAmount
  const amount = req.body.amount
  const isSubCorporateUser = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername;

  let partnerDetails;
  partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

  const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;

  if (req.body.isUpgrade) {
    const projectdata = await updateProject(req)

    // If project creation fails, handle the refund process
    if (projectdata.error) {
      if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        await cancelPGTransaction(corporateTxnId);
      }

      // must use this in transaction events
      // cleverTap.uploadEvent({
      //     eventName: "Transactions",
      //     eventData: {
      //     Status: "Payment Failure",
      //     },
      //     email: emailId,
      // },partnerDetails);

      // Notify user about failure
      const notificationData = {
        notificationTitle: 'Project updating Failed',
        notificationBrief: 'Your attempt to updating project has failed. A refund has been initiated.',
        notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN'
      };
     
      createNotification(notificationData);

      // Send failure email
      let to, cc;
      if (subCorporateEmail) {
        to = subCorporateEmail;
        cc = emailId;
      } else {
        to = emailId;
        cc = undefined; // or omit if not needed
      }
      const subject = "Project updating Failed";
      const body = 'We regret to inform you that the project updating failed. A refund has been processed.';
      emailer.email({to,cc, subject, body},()=>{});

      // AJAX /complete endpoint — return JSON (frontend navigates), never res.redirect.
      return res.status(500).json({
        'status': false,
        "message": "Project updating failed",
        'data': {
          message: projectdata.message
        },
        'responseCode': '001'
      });
    }

    if (projectdata.status === true) {
      const project_id = projectdata?.data?.updatedProject?.id
      const serviceDetails = projectdata?.data?.serviceDetails
      let serviceOperatorId = serviceDetails?.id || null;
      const surchargeWithoutTax = await calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId)
      const surcharge = await calculateAmountWithTax(surchargeWithoutTax)

      // this flow is working as no surcharge, once surcharge implemented need to review the flow
      const reportData = {};

      const transactionResponse = await updateWhatsAppSubscription({ ...data, corporateId, credentialId, corporateTxnId, serviceOperatorId, project_id, reportData, surcharge, ...(await fetchUpgradingDiscountPrice(credentialId)) })

      if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {

        if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
          let refundPGResponse = await cancelCardTransaction(req, req.body.paymentGatewayResponse)
          if (refundPGResponse?.state != 'REVERSED') {
            await paymentGateWayRefundFailureEmail(req)
          }
        }

        // must use this in transaction events
        // cleverTap.uploadEvent({
        //     eventName: "Transactions",
        //     eventData: {
        //     Status: "Payment Failure",
        //     },
        //     email: emailId,
        // },partnerDetails);

        const notificationData = {
          notificationTitle: 'Subscription Failed',
          notificationBrief: 'We regret to inform you that the plan purchase failed. Please try again.',
          notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
          notificationCategory: 'CORPORATE',
          notificationBy: 'ADMIN'
        };
        createNotification(notificationData);

        let to, cc;

        if (subCorporateEmail) {
          to = subCorporateEmail;
          cc = emailId;
        } else {
          to = emailId;
          cc = undefined; // or omit if not needed
        }
        const subject = "Subscription Failed";
        const body = 'hello'
        emailer.email({to,cc, subject, body},()=>{});

        return res.status(500).json({
          'status': false,
          "message": "Something went wrong",
          'data': {
            message: transactionResponse['message']
          },
          'responseCode': '001'
        })
      } else {
        // must use this in transaction events
        // cleverTap.uploadEvent({
        //     eventName: "Transactions",
        //     eventData: {
        //     Status: "Payment Success",
        //     },
        //     email: emailId,
        // },partnerDetails);
        const { subscription, packageDetails } = transactionResponse
        // const tax = calculateSurchargeAndTax(amount, 0.05)
        // const line_item = [
        //     {
        //         item_id: zoho_configs.common_item_id,
        //         name: packageDetails.packageName,
        //         rate: tax.actualSurcharge,
        //         quantity: 1,
        //         tax_id: zoho_configs.vat_tax_id,
        //       },
        // ]
        // const invoice_id = await createZohoInvoice(customer_id, undefined , corporateTxnId, surchargeWithoutTax, parseFloat(amount).toFixed(2), undefined, line_item)
        // // record zoho invoice id in whatsappSubscription table
        // await whatsappSubscriptionUpdate({ id:subscription?.id}, {invoiceId:invoice_id })

        let to, cc;
        if (subCorporateEmail) {
          to = subCorporateEmail;
          cc = emailId;
        } else {
          to = emailId;
          cc = undefined; // or omit if not needed
        }
        let subject = `${packageDetails.packageName} Subscription Purchase Confirmation`;

        let notificationData;
        let body;

        if (packageDetails.packageType === "INDIVIDUAL") {
          notificationData = {
            notificationTitle: 'Subscription Successful ',
            notificationBrief: `We are pleased to inform you that your ${packageDetails.packageName} subscription purchase has been successful with the payment of ₹ ${formatNumberWithLocalString(pgAmount)}. Your service is now active.`,
            notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN'
          };
          const resolvedSub = await resolveWhatsappSubscriptionIndividualSuccessEmail(companyName, corporateTxnId, subscription, packageDetails, partnerDetails, subject, req?.LogTraceId);
          subject = resolvedSub.subject;
          body = resolvedSub.html;
        }
        // const paymentMethod = req.body.paymentGatewayResponse.paymentMethod
        // await createZohoPaymentRecord({customer_id, invoice_id, paymentMode: "PAYMENT GATEWAY", reference_number: corporateTxnId, amount: paymentDetails.amount, paymentMethod: paymentMethod, isBankChargeApplicable: true})

        // const invoicePdf = await getInvoicePDF({ invoice_id });
        const orderRecord = await findOneOrderByTxnId(corporateTxnId)
        const invoiceAttachments = await generateOrderInvoiceAttachments({
          amount,
          surcharge,
          couponDiscount: transactionResponse.couponDiscount || 0,
          corporateTxnId,
          orderId: orderRecord?.id,
          paymentType: "WhatsApp Subscription",
          description: packageDetails.packageName,
          credentialId,
          pgAmount: Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse") ? req.body.pgAmount : null,
          paymentMethod: pgResponse?.payment_method,
          traceId: req?.LogTraceId,
        })
        emailer.emailWithMultipleAttachment(to, subject, body, invoiceAttachments,cc, async (emailErr) => {
          if (emailErr) {
            customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr })
          } else {
            customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
          }
        });
        createNotification(notificationData);

        return res.status(200).json({
          'status': true,
          'data': {
              subscription: subscription,
              corporateTxnId,
              successUrl: req.body.successUrl
          },
          'message': 'payment successfull',
          'responseCode': '000'
      })

      }
    }
  } else if (req.body.isRenewal) {
    const projectdata = await ReActivateProject(req)

    // If project creation fails, handle the refund process
    if (projectdata.error) {
      if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        await cancelPGTransaction(corporateTxnId);
      }

      // must use this in transaction events
      // cleverTap.uploadEvent({
      //     eventName: "Transactions",
      //     eventData: {
      //     Status: "Payment Failure",
      //     },
      //     email: emailId,
      // },partnerDetails);

      // Notify user about failure
      const notificationData = {
        notificationTitle: 'Subscription Failed',
        notificationBrief: 'We regret to inform you that the plan purchase failed. Please try again.',
        notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN'
      };
    
      createNotification(notificationData);

      // Send failure email
      let to, cc;
      if (subCorporateEmail) {
        to = subCorporateEmail;
        cc = emailId;
      } else {
        to = emailId;
        cc = undefined; // or omit if not needed
      }
      const subject = "Subscription Failed";
      const body = 'We regret to inform you that the plan purchase failed. A refund has been processed.';
      emailer.email({to,cc, subject, body},()=>{});

      // AJAX /complete endpoint — return JSON (frontend navigates), never res.redirect.
      return res.status(500).json({
        'status': false,
        "message": "Project updating failed",
        'data': {
          message: projectdata.message
        },
        'responseCode': '001'
      });
    }

    if (projectdata.status === true) {
      const project_id = projectdata?.data?.updatedProject?.id
      const serviceDetails = projectdata?.data?.serviceDetails
      let serviceOperatorId = serviceDetails?.id || null;
      const surchargeWithoutTax = await calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId)
      const surcharge = await calculateAmountWithTax(surchargeWithoutTax)

      const reportData = {}

      const transactionResponse = await updateWhatsAppSubscription({ ...data, corporateId, credentialId, corporateTxnId, serviceOperatorId, project_id, reportData, surcharge })

      if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {

        if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {

          if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
            await cancelPGTransaction(corporateTxnId);
          }

          // must use this in transaction events
          // cleverTap.uploadEvent({
          //     eventName: "Transactions",
          //     eventData: {
          //     Status: "Payment Failure",
          //     },
          //     email: emailId,
          // },partnerDetails);

          const notificationData = {
            notificationTitle: 'Subscription Failed',
            notificationBrief: 'We regret to inform you that the plan purchase failed. Please try again.',
            notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN'
          };
          
          createNotification(notificationData);

          let to, cc;
          if (subCorporateEmail) {
            to = subCorporateEmail;
            cc = emailId;
          } else {
            to = emailId;
            cc = undefined; // or omit if not needed
          }
          const subject = "Subscription Failed";
          const body = 'hello'
          emailer.email({to,cc, subject, body},()=>{});

          return res.status(500).json({
            'status': false,
            "message": "Something went wrong",
            'data': {
              message: transactionResponse['message']
            },
            'responseCode': '001'
          })
        } else {
          // must use this in transaction events
          // cleverTap.uploadEvent({
          //     eventName: "Transactions",
          //     eventData: {
          //     Status: "Payment Success",
          //     },
          //     email: emailId,
          // },partnerDetails);
          const { subscription, packageDetails } = transactionResponse
          // const tax = calculateSurchargeAndTax(amount, 0.05)
          // const line_item = [
          //     {
          //         item_id: zoho_configs.common_item_id,
          //         name: packageDetails.packageName,
          //         rate: tax.actualSurcharge,
          //         quantity: 1,
          //         tax_id: zoho_configs.vat_tax_id,
          //       },
          // ]
          // const invoice_id = await createZohoInvoice(customer_id, undefined , corporateTxnId, surchargeWithoutTax, parseFloat(amount).toFixed(2), undefined, line_item)
          // // record zoho invoice id in whatsappSubscription table
          // await whatsappSubscriptionUpdate({ id:subscription?.id}, {invoiceId:invoice_id })

          let to, cc;
          if (subCorporateEmail) {
            to = subCorporateEmail;
            cc = emailId;
          } else {
            to = emailId;
            cc = undefined; // or omit if not needed
          }
          let subject = `${packageDetails.packageName} Subscription Purchase Confirmation`;

          let notificationData;
          let body;

          if (packageDetails.packageType === "INDIVIDUAL") {
            notificationData = {
              notificationTitle: 'Subscription Successful ',
              notificationBrief: `We are pleased to inform you that your ${packageDetails.packageName} subscription purchase has been successful with the payment of ₹ ${formatNumberWithLocalString(pgAmount)}. Your service is now active.`,
              notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
              notificationCategory: 'CORPORATE',
              notificationBy: 'ADMIN'
            };
            const resolvedSub = await resolveWhatsappSubscriptionIndividualSuccessEmail(companyName, corporateTxnId, subscription, packageDetails, partnerDetails, subject, req?.LogTraceId);
            subject = resolvedSub.subject;
            body = resolvedSub.html;
          }
          // const paymentMethod = req.body.paymentGatewayResponse.paymentMethod
          // await createZohoPaymentRecord({ customer_id, invoice_id, paymentMode: "PAYMENT GATEWAY", reference_number: corporateTxnId, amount: paymentDetails.amount, paymentMethod: paymentMethod, isBankChargeApplicable: true })

          // const invoicePdf = await getInvoicePDF({ invoice_id });
          const orderRecord = await findOneOrderByTxnId(corporateTxnId)
          const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount,
            surcharge,
            couponDiscount: transactionResponse.couponDiscount || 0,
            corporateTxnId,
            orderId: orderRecord?.id,
            paymentType: "WhatsApp Subscription",
            description: packageDetails.packageName,
            credentialId,
            pgAmount: Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse") ? req.body.pgAmount : null,
            paymentMethod: pgResponse?.payment_method,
            traceId: req?.LogTraceId,
          })
          emailer.emailWithMultipleAttachment(to, subject, body, invoiceAttachments,cc, async (emailErr) => {
            if (emailErr) {
              customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr })
            } else {
              customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
            }
          });

          createNotification(notificationData);

          return res.status(200).json({
            'status': true,
            'data': {
                subscription: subscription,
                corporateTxnId,
                successUrl: req.body.successUrl
            },
            'message': 'payment successfull',
            'responseCode': '000'
        })

        }
      }
    }
  }else {
      const projectdata = await createProject(req)

      // If project creation fails, handle the refund process
      if (projectdata.error) {
        if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
          await cancelPGTransaction(corporateTxnId);
        }

        // must use this in transaction events
        // cleverTap.uploadEvent({
        //     eventName: "Transactions",
        //     eventData: {
        //     Status: "Payment Failure",
        //     },
        //     email: emailId,
        // },partnerDetails);

        // Notify user about failure
        const notificationData = {
          notificationTitle: 'Project Creation Failed',
          notificationBrief: 'Your attempt to create a project has failed. A refund has been initiated.',
          notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
          notificationCategory: 'CORPORATE',
          notificationBy: 'ADMIN'
        };
       
        createNotification(notificationData);

        // Send failure email
        let to, cc;
        if (subCorporateEmail) {
          to = subCorporateEmail;
          cc = emailId;
        } else {
          to = emailId;
          cc = undefined; // or omit if not needed
        }
        const subject = "Project Creation Failed";
        const body = 'We regret to inform you that the project creation failed. A refund has been processed.';
        emailer.email({to,cc, subject, body},()=>{});

        return res.status(500).json({
          'status': false,
          "message": "Project creation failed",
          'data': {
            message: projectdata.message
          },
          'responseCode': '001'
        });

      }

      if (projectdata.status === true) {
        const project_id = projectdata?.data?.createdProject?.id
        const serviceDetails = projectdata?.data?.serviceDetails
        let serviceOperatorId = serviceDetails?.id || null;
        const surchargeWithoutTax = await calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId)
        const surcharge = await calculateAmountWithTax(surchargeWithoutTax)

          // this flow is working as no surcharge, once surcharge implemented need to review the flow
        const reportData = {};

        const transactionResponse = await createWhatsApSubscription({ ...data, corporateId, credentialId, corporateTxnId, serviceOperatorId, project_id, reportData, surcharge })

        if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {

          if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
            await cancelPGTransaction(corporateTxnId);
          }

          // must use this in transaction events
          // cleverTap.uploadEvent({
          //     eventName: "Transactions",
          //     eventData: {
          //     Status: "Payment Failure",
          //     },
          //     email: emailId,
          // },partnerDetails);

          const notificationData = {
            notificationTitle: 'Subscription Failed',
            notificationBrief: 'We regret to inform you that the plan purchase failed. Please try again.',
            notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN'
          };
          createNotification(notificationData);

          let to, cc;
          if (subCorporateEmail) {
            to = subCorporateEmail;
            cc = emailId;
          } else {
            to = emailId;
            cc = undefined; // or omit if not needed
          }
          const subject = "Subscription Failed";
          const body = 'hello'
          emailer.email({to,cc, subject, body},()=>{});
          return res.status(500).json({
            'status': false,
            "message": "Something went wrong",
            'data': {
              message: transactionResponse['message']
            },
            'responseCode': '001'
          })

        } else {
          // must use this in transaction events
          // cleverTap.uploadEvent({
          //     eventName: "Transactions",
          //     eventData: {
          //     Status: "Payment Success",
          //     },
          //     email: emailId,
          // },partnerDetails);
          const { subscription, packageDetails } = transactionResponse
          // const tax = calculateSurchargeAndTax(amount, 0.05)
          // const line_item = [
          //     {
          //         item_id: zoho_configs.common_item_id,
          //         name: packageDetails.packageName,
          //         rate: tax.actualSurcharge,
          //         quantity: 1,
          //         tax_id: zoho_configs.vat_tax_id,
          //       },
          // ]
          // const invoice_id = await createZohoInvoice(customer_id, undefined , corporateTxnId, surchargeWithoutTax, parseFloat(amount).toFixed(2), undefined, line_item)
          // // record zoho invoice id in whatsappSubscription table
          // await whatsappSubscriptionUpdate({ id:subscription?.id}, {invoiceId:invoice_id })

          let to, cc;
          if (subCorporateEmail) {
            to = subCorporateEmail;
            cc = emailId;
          } else {
            to = emailId;
            cc = undefined; // or omit if not needed
          }
          let subject = `${packageDetails.packageName} Subscription Purchase Confirmation`;

          let notificationData;
          let body;

          if (packageDetails.packageType === "INDIVIDUAL") {
            notificationData = {
              notificationTitle: 'Subscription Successful ',
              notificationBrief: `We are pleased to inform you that your ${packageDetails.packageName} subscription purchase has been successful with the payment of ₹ ${formatNumberWithLocalString(pgAmount)}. Your service is now active.`,
              notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
              notificationCategory: 'CORPORATE',
              notificationBy: 'ADMIN'
            };
            const resolvedSub = await resolveWhatsappSubscriptionIndividualSuccessEmail(companyName, corporateTxnId, subscription, packageDetails, partnerDetails, subject, req?.LogTraceId);
            subject = resolvedSub.subject;
            body = resolvedSub.html;
          }
          // const paymentMethod = req.body.paymentGatewayResponse.paymentMethod
          // await createZohoPaymentRecord({customer_id, invoice_id, paymentMode: "PAYMENT GATEWAY", reference_number: corporateTxnId, amount: paymentDetails.amount, paymentMethod: paymentMethod, isBankChargeApplicable: true})

          // const invoicePdf = await getInvoicePDF({ invoice_id });
          const orderRecord = await findOneOrderByTxnId(corporateTxnId)
          const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount,
            surcharge,
            couponDiscount: transactionResponse.couponDiscount || 0,
            corporateTxnId,
            orderId: orderRecord?.id,
            paymentType: "WhatsApp Subscription",
            description: packageDetails.packageName,
            credentialId,
            pgAmount: Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse") ? req.body.pgAmount : null,
            paymentMethod: pgResponse?.payment_method,
            traceId: req?.LogTraceId,
          })
          emailer.emailWithMultipleAttachment(to, subject, body, invoiceAttachments,cc, async (emailErr) => {
            if (emailErr) {
              customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr })
            } else {
              customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
            }
          });
          if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
            const subcorporateUsername = req.user.subCorporateUsername
            if (subcorporateUsername) {
                notificationData.notificationTo.push(subcorporateUsername);
            }
        }
          createNotification(notificationData);

            return res.status(200).json({
                'status': true,
                'data': {
                    subscription: subscription,
                    corporateTxnId,
                    successUrl: req.body.successUrl
                },
                'message': 'payment successfull',
                'responseCode': '000'
            })

        }
      }
    }




  }
)
const updateProject = asyncHandler(async (req) => {

  // Fetch vendor details
  let serviceDetails = await fetchVendorDetailsByServiceDetails(req.user, accessKey);
  customLog(req?.LogTraceId, "info", { serviceDetails })

  // Call createProjectApi to create a project
  const { status: status2, message: message2, data: updatedProject } = await UpdateProjectPlanApi(serviceDetails.vendor, req);

  if (!status2) {
    return {
      error: true,
      message: message2
    };
  }

  customLog(req?.LogTraceId, "info", { updatedProject })

  // Return success response if project is created
  return {
    status: true,
    message: "Project updated successfully!!",
    data: { updatedProject, serviceDetails }
  };
});
const ReActivateProject = asyncHandler(async (req) => {

  // Fetch vendor details
  let serviceDetails = await fetchVendorDetailsByServiceDetails(req.user, accessKey);
  customLog(req?.LogTraceId, "info", { serviceDetails })

  // Call createProjectApi to create a project
  const { status: status2, message: message2, data: updatedProject } = await ReActivateProjectPlanApi(serviceDetails.vendor, req);

  if (!status2) {
    return {
      error: true,
      message: message2
    };
  }

  customLog(req?.LogTraceId, "info", { updatedProject })

  // Return success response if project is created
  return {
    status: true,
    message: "Project renewed successfully!!",
    data: { updatedProject, serviceDetails }
  };
});
const createProject = asyncHandler(async (req) => {
  const { id: credentialId, } = req.user;

  // Fetch vendor details
  let serviceDetails = await fetchVendorDetailsByServiceDetails(req.user, accessKey);

  // Fetch WhatsApp business by credential ID
  const { status, businessId } = await fetchWhatsAppBusinessByCredentialId(credentialId);

  if (!status) {
    return {
      error: true,
      message: "WhatsApp business data not found"
    };
  }

  // Call createProjectApi to create a project
  const { status: status2, message: message2, data: createdProject } = await createProjectApi(serviceDetails, businessId, req);

  if (!status2) {
    return {
      error: true,
      message: message2
    };
  }

  // Return success response if project is created
  return {
    status: true,
    message: "Project Created successfully!!",
    data: { createdProject, serviceDetails }
  };
});


exports.botBuilderpayment = asyncHandler(async (req, res, next) => {
  //check disableService?
  //search for package,cashback,serviceOperator,vendor?
  //userBalance
  //Entry for payment
  //API call
  //update the payment

  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId;
  const name = req.user.name;
  const email = req.user.email
  const requestData = req.body
  const { amount, project_id } = req.body;
  const corporateTxnId = req.body.paymentRefId || new Date().valueOf()

  // zoho credentials
  // const customer_id = req.user.zoho_id;

  let partnerDetails;
  partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

  // Fetch service details
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId
  });

  if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
    return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400));
  }
  let serviceOperatorId = serviceDetails?.id || null;

  const { surcharge } = await calculateSurchargeWithTax(
      serviceDetails.surcharge,
      serviceDetails.surchargeType,
      amount,
      credentialId
  );
  
  // Back-compat: existing callers (FE not yet sending addOnType) purchase Bot Builder.
  const addOnType = req.body.addOnType === 'SHOPIFY_INTEGRATION' ? 'SHOPIFY_INTEGRATION' : 'BOT_BUILDER';
  const addOnDetails = addOnType === 'SHOPIFY_INTEGRATION' ? await getShopifyIntegrationValues(credentialId) : await getBotBuilderValues(credentialId)
  let month = 1;
  if (addOnDetails) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const subscriptionDetails = await findExistingSubscription(credentialId, project_id)
    const { subscriptionEndDate, billingType } = subscriptionDetails
    month = billingType?.toLowerCase() !== 'monthly' ? 12 : 1;
    const subscriptionEnd = new Date(subscriptionEndDate);
    subscriptionEnd.setHours(0, 0, 0, 0);
    if (today > subscriptionEnd) {
      customLog(req.LogTraceId, 'error', { message: "Sorry!, subscription add-on is not able to purchase after end date" })
      return res.status(500).json({
        'status': false,
        "message": "Subscription add-on cannot be purchased after the subscription end date",
        'data': {},
        'responseCode': '001'
      })
    }
  }

  const pgAmountNum = Number(req.body.pgAmount || 0);
  const planDetails = addOnDetails ? [{
    name: addOnType === 'SHOPIFY_INTEGRATION' ? "WhatsApp Shopify Integration" : "WhatsApp Bot Builder",
    isAddOn: true,
    commissionMode: addOnDetails?.details?.commissionMode,
    commissionType: addOnDetails?.details?.commissionType,
    commission: addOnDetails?.details?.commission,
    fixedCommissionPerTransaction: addOnDetails?.details?.fixedCommissionPerTransaction,
    isCommissionInclGST: addOnDetails?.details?.isCommissionInclGST,
    amount: Number(amount) / month,
    quantity: month,
  }] : [];

  const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
  const reportData = await computeJournalData({
      serviceDetails,
      pgAmount: pgAmountNum,
      amount: Number(amount),
      paymentMethod: pgResponse?.payment_method || {},
      partnerDetails,
      paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
      planDetails,
      couponTotalDiscount: req.body.couponTotalDiscount,
      corporateState: req.user.state || "",
      credentialId,
  });

  let vendor = serviceDetails?.vendor

  if (reportData) {
    publishJournalEvent(
      {
        transactionRef: corporateTxnId,
        type: "payment",
        contextSnapshot: {
          credentialId,
          vendor: vendor || null,
          registeredBy: req?.user?.registeredBy || null,
        },
        reportData,
      },
      req?.LogTraceId
    );
  }

  const transactionResponse = await createBotBuilderSubscription({ ...requestData, surcharge }, corporateUserId, credentialId, corporateTxnId, serviceOperatorId, project_id, vendor, name, reportData)
  if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
      let refundPGResponse = await cancelCardTransaction(req, req.body.paymentGatewayResponse)
      if (refundPGResponse?.state != 'REVERSED') {
        await paymentGateWayRefundFailureEmail(req)
      } else if (reportData) {
        publishJournalEvent(
          {
            transactionRef: corporateTxnId,
            type: "refund",
            contextSnapshot: {
              credentialId,
              vendor: vendor || null,
              registeredBy: req?.user?.registeredBy || null,
            },
            reportData,
          },
          req?.LogTraceId
        );
      }
    }

    // // must use this in transaction events
    // cleverTap.uploadEvent({
    //     eventName: "Transactions",
    //     eventData: {
    //     Status: "Payment Failure",
    //     },
    //     email: email,
    // },partnerDetails);
    const paymentDetails = {
      amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2)
    };
    const notificationData = {
      notificationTitle: `WhatsApp Add-on - Payment unsuccessful`,
      notificationBrief: `Payment of ₹ ${paymentDetails?.amount} for Bot builder purchase was unsuccessful. Transaction ID: ${paymentDetails?.transactionId}.`,
      notificationTo: [req.user.username],
      notificationCategory: 'CORPORATE',
      notificationBy: 'ADMIN'
    };

    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
      const subcorporateUsername = req.user.subCorporateUsername
      if (subcorporateUsername) {
        notificationData.notificationTo.push(subcorporateUsername);
      }
    }

    createNotification(notificationData);
    const serviceUrl = partnerDetails?.baseUrl ||
      (process.env.NODE_ENV === "staging" ? process.env.STAGING_FRONT_END_URL : process.env.PRODUCTION_FRONT_END_URL);
    const to = email;
    const subject = 'Payment failed'
    const resolvedWhatsappFailed = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.WHATSAPP_PAYMENT_FAILED,
      service: EMAIL_TEMPLATE_SERVICES.WHATSAPP,
      variables: {
        name,
        serviceName: "WhatsApp for Business",
        branding: partnerDetails?.branding || 'Peko',
        website: partnerDetails?.baseUrl || 'https://peko.one/in',
        logo: partnerDetails?.logo,
        ...v2LayoutVariables(partnerDetails),
      },
      fallback: () => commonFailedTemplate(name, "WhatsApp for Business", serviceUrl, partnerDetails),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedWhatsappFailed.html;

    emailer.email({to, subject: resolvedWhatsappFailed.subject, body}, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });
    //-------------------------------------------------------

    // Always return JSON: /complete is an AJAX endpoint (frontend completePGPayment) — the frontend
    // navigates to the failure page itself. A res.redirect here gets auto-followed by the AJAX call.
    return res.status(500).json({
      'status': false,
      "message": "Something went wrong",
      'data': {
        message: transactionResponse['message']
      },
      'responseCode': '001'
    })
  } else {
      // // must use this in transaction events
      // cleverTap.uploadEvent({
      //     eventName: "Transactions",
      //     eventData: {
      //     Status: "Payment Success",
      //     },
      //     email: email,
      // },partnerDetails);
      const { subscription, packageDetails } = transactionResponse
      // const tax = calculateSurchargeAndTax(amount, 0.05)
      // const line_item = [
      //     {
      //         item_id: zoho_configs.common_item_id,
      //         name: 'WhatsApp Add on',
      //         rate: tax.actualSurcharge,
      //         quantity: 1,
      //         tax_id: zoho_configs.vat_tax_id,
      //       },
      // ]
      // const invoice_id = await createZohoInvoice(customer_id, undefined , corporateTxnId, surchargeWithoutTax, parseFloat(amount).toFixed(2), undefined, line_item)
      // record zoho invoice id in whatsappSubscription table
      // await whatsappSubscriptionUpdate({ id:subscription?.id}, {invoiceId:invoice_id })

    // handle email and notifications-----------------------
    const paymentDetails = {
      amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
      transactionId: corporateTxnId
    };
    customLog(req?.LogTraceId, "info", { serviceDetails })

    const to = email;
    let emailSubject = "WhatsApp Bot builder purchase successful";
    packageDetails.packageName = "WhatsApp Bot Builder";
    const resolvedBotBuilderSub = await resolveWhatsappSubscriptionIndividualSuccessEmail(name, paymentDetails.transactionId, subscription, packageDetails, partnerDetails, emailSubject, req?.LogTraceId);
    emailSubject = resolvedBotBuilderSub.subject;
    let emailBody = resolvedBotBuilderSub.html;

    const notificationData = {
      notificationTitle: `WhatsApp Bot builder Purchase - Payment successful`,
      notificationBrief: `Payment of ₹ ${paymentDetails?.amount} for WhatsApp Bot builder was successful. Transaction ID: ${paymentDetails?.transactionId}.`,
      notificationTo: [req.user.username],
      notificationCategory: 'CORPORATE',
      notificationBy: 'ADMIN'
    };

    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
      const subcorporateUsername = req.user.subCorporateUsername
      if (subcorporateUsername) {
        notificationData.notificationTo.push(subcorporateUsername);
      }
    }
   
    try {
      await createNotification(notificationData);
      customLog(req?.LogTraceId, "info", { message: "Bot builder purchase notification created", to: req.user.username });
    } catch (notifyErr) {
      customLog(req?.LogTraceId, "error", { message: "Bot builder purchase notification failed (non-fatal)", error: notifyErr?.message ?? notifyErr });
    }

    // const paymentMethod = req.body.paymentGatewayResponse.paymentMethod
    // await createZohoPaymentRecord({customer_id, invoice_id, paymentMode: "PAYMENT GATEWAY", reference_number: corporateTxnId, amount: paymentDetails.amount, paymentMethod: paymentMethod, isBankChargeApplicable: true})
    // const invoicePdf = await getInvoicePDF({ invoice_id });
    try {
      const orderRecord = await findOneOrderByTxnId(corporateTxnId)
      const invoiceAttachments = await generateOrderInvoiceAttachments({
        amount,
        surcharge,
        couponDiscount: transactionResponse.couponDiscount || 0,
        corporateTxnId,
        orderId: orderRecord?.id,
        paymentType: "WhatsApp Bot Builder",
        credentialId,
        pgAmount: Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse") ? req.body.pgAmount : null,
        paymentMethod: pgResponse?.payment_method,
        vendor: serviceDetails?.vendor,
        commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
        planDetails,
        commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
        traceId: req?.LogTraceId,
      })
      emailer.emailWithMultipleAttachment(to, emailSubject, emailBody, invoiceAttachments, async (emailErr) => {
        if (emailErr) {
          customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr })
        } else {
          customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
        }
      });
    } catch (receiptErr) {
      customLog(req?.LogTraceId, "error", { message: "Bot builder receipt/email failed (non-fatal)", error: receiptErr?.message ?? receiptErr });
    }

    // handlePGCallback is the AJAX `/complete` endpoint the frontend completePGPayment calls.
    // Return JSON like every other PG handler (subscription.js etc.) and let the frontend navigate
    // via the slice-level successPath. This previously did res.redirect(successUrl) for web, which
    // the AJAX call auto-followed as a separate GET to the (relative) successUrl resolved against the
    // backend host (http://localhost:3000) — surfacing a successful purchase as "failed".
    return res.status(200).json({
      'status': true,
      'data': {
        subscription: subscription,
        corporateTxnId
      },
      'message': 'payment successfull',
      'responseCode': '000'
    })
  }

})

const findExistingSubscription = async (credentialId, project_id) => {
  return await WhatsAppSubscription.findOne({
    include: [{ model: Package }],
    where: {
      credentialId: credentialId,
      status: 'ACTIVE',
      projectId: project_id,
      isCustom: false
    },
    raw: true,
    nest: true
  });
}

exports.findExistingSubscriptionWB = findExistingSubscription;

const fetchUpgradingDiscountPrice = async (credentialId) => {
  const activeSubscriptions = await findActiveSubscriptionByCredentialId(credentialId);
  const activeAddOns = await findActiveBotBuilderByCredentialId(credentialId);
  const activeShopifyAddOn = await findActiveShopifyIntegrationByCredentialId(credentialId);

  return {
    subscriptionDiscountPrice: computeUpgradeCredit(activeSubscriptions),
    addOndiscountPrice: computeUpgradeCredit(activeAddOns),
    shopifyAddOndiscountPrice: computeUpgradeCredit(activeShopifyAddOn),
  };
}
exports.fetchUpgradingDiscountPrice = fetchUpgradingDiscountPrice;