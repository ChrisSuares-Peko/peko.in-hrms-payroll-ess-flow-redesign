const { fetchServiceDetails, calculateSurcharge, calculateAmountWithTax } = require("../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../../utils/error-response");
// const { createLeanTransaction } = require("../../utils/leanTransaction");
const { createPGTransaction, createPaytmTransaction } = require("../../utils/pamentGatewayTransaction");
const { createWalletTransaction, updateWalletTransaction } = require("../../utils/walletTransaction");

const emailer = require("../../utils/emailer");
const { findAllActiveHikes, findHikesByIds } = require("../../models/use-cases/hike");
const { createNotification } = require("../../models/use-cases/notification");
const { commonFailedTemplate } = require("../../utils/emailTemplate/common");
const { generateHikePurchaseSuccessEmail } = require("../../utils/emailTemplate/hike");
const { PLAN_COMMISSION, removeCommissionFields } = require("../../utils/configuredFlag");

const wallet = require("../../models/entities/wallet");

const asyncHandler = require("../../middlewares/async");
const { findAllTransactions } = require("../../models/use-cases/transaction");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { partnerLogos } = require("../../utils/partnerLogos");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { findOneOrderByTxnId } = require("../../models/use-cases/order");
const { customLog } = require("../../utils/loggerHelper");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");
const { formatNumberWithLocalString } = require("../../utils/formatter");

const accessKey = 'hike_service';

exports.findAllHikes = asyncHandler(async (req, res, next) => {
  const hikes = await findAllActiveHikes(req.user.id);
  if (!hikes.success) {
    return next(
      new ErrorResponse(`Something went wrong while fetching hikes`, 500)
    );
  }
  removeCommissionFields(hikes.data, [...PLAN_COMMISSION.fields, PLAN_COMMISSION.flag]);
  return res.status(200).json({
    status: true,
    message: "Hikes fetched successfully",
    data: hikes.data,
    responseCode: "000",
  });
});

exports.findAllHikeTransactionsAndCount = asyncHandler(async (req, res, next) => {
  let { from, to, searchText, page, itemsPerPage } = req.query;
  let corporateId = req.user.id

  const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
  const filter = req.query.filter || undefined;

  // Parse page and itemsPerPage to integers
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage

  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
    offset = (page - 1) * itemsPerPage;
  }

  let categoryName = 'Hike'
  let sortField = 'transactionDate'

  let serviceAttribute = []
  let credentialAttribute = []
  let transactionAttribute = []
  let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'status', 'orderResponse', 'transactionDate', 'corporateTxnId']

  let params = {
    from,
    to,
    categoryName,
    searchText,
    sort,
    filter,
    limit,
    offset,
    corporateId,
    serviceAttribute,
    credentialAttribute,
    transactionAttribute,
    orderAttribute,
    sortField
  }

  if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
    params.subCorporateUserId = req.user.subCorporateId;
  }

  const hikeTransactionsData = await findAllTransactions(params);
  if (!hikeTransactionsData) {
    return next(new ErrorResponse(`Something went wrong while fetching hike transactions from DB`, 500))
  } else {
    return res.status(200).json({
      'status': true,
      'data': {
        result: hikeTransactionsData.rows,
        totalData: hikeTransactionsData.count
      },
      'message': 'Hike transactions fetched successfully!',
      'responseCode': '000'
    })
  }
})

exports.payment = asyncHandler(async (req, res, next) => {
  let transactionCategory = 'Hike'
  const account = req.body.account
  const totalAmount = req.body.amount
  const payCashback = req.body.payCashback
  const credentialId = req.user.id
  const corporateUserId = req.user.corporateId
  const packageId = req.user.packageId
  const name = req.user.name
  const emailId = req.user.email
  const selectedHikes = req.body.selectedHikes
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId
  })
  if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
    return next(new ErrorResponse(serviceDetails['error'], 500))
  }

  let commissionType = serviceDetails.commissionType
  let cashbackType = serviceDetails.cashbackType
  let providerCommission = serviceDetails.providerCommission
  let corporateCashback = serviceDetails.cashback
  let serviceOperatorId = serviceDetails.id
  const surchargeWithoutTax = await calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, totalAmount, credentialId)
  const surcharge = await calculateAmountWithTax(surchargeWithoutTax)  // first we will  do transaction
  serviceDetails.transactionReportRule = "SERVICE_WITH_INVOICE_AND_SURCHARGE" //ONLY TEMP
  const partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy)

  const hikeIds = selectedHikes.map((item) => item.id).filter(Boolean)
  const hikeRecords = hikeIds.length ? await findHikesByIds(hikeIds, credentialId) : []
  const hikesMap = Object.fromEntries(hikeRecords.map((h) => [h.id, h]))
  const planDetails = selectedHikes.map((item) => {
    const hikeRecord = hikesMap[item.id] || {}
    return {
      name: hikeRecord.name || "Hike Service",
      commissionMode: hikeRecord.commissionMode,
      commissionType: hikeRecord.commissionType,
      commission: hikeRecord.commission,
      fixedCommissionPerTransaction: hikeRecord.fixedCommissionPerTransaction,
      isCommissionInclGST: hikeRecord.isCommissionInclGST,
      amount: hikeRecord.amount,
      quantity: item.quantity,
    }
  })

  const reportData = await computeJournalData({
    serviceDetails,
    amount: totalAmount,
    paymentMethod: "WALLET",
    partnerDetails,
    paymentGatewayName: "WALLET",
    couponTotalDiscount: req.body.couponTotalDiscount,
    planDetails,
    corporateState: req.user.state,
    credentialId,
  })
  let corporateTxnId = new Date().valueOf()
  let transactionResponse = {}

  if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
    transactionResponse = await createPGTransaction({
      providerId: corporateTxnId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      accountNo: account,
      pgAmount: req.body.pgAmount,
      transactionCategory,
      orderAmount: totalAmount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      pgResponse: req.body.paymentGatewayResponse,
      surcharge,
      reportData
    })
  } else if (req.body.hasOwnProperty.call(req.body, 'paytmResponse')) {
    transactionResponse = await createPaytmTransaction({
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
      pgResponse: req.body.paymentGatewayResponse,
      paytmAmount: req.body.paytmAmount,
      paytmResponse: req.body.paytmResponse,
      reportData
    });
  } else {
    transactionResponse = await createWalletTransaction({
      providerId: corporateTxnId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      surcharge,
      accountNo: account,
      amount: totalAmount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      reportData
    })
  }
  if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
    return next(new ErrorResponse(transactionResponse['error'], 500))
  }


  let updateDetails = {
    corporateTxnId,
    providerId: "Not Available",
    status: "SUCCESS",
    message: "Payment Successful",
    orderResponse: JSON.stringify({
      selectedHikes,
    }),
  }

  if (updateDetails.message === "Payment Successful") {

    const paymentDetails = {
      transactionId: corporateTxnId,
      account: account,
      amount: (parseFloat(totalAmount) + parseFloat(surcharge)).toFixed(2),
    };

    // Send notification
    const notificationData = {
      notificationTitle: "Hike Purchase - Payment Successful",
      notificationBrief: `Payment of ₹ ${paymentDetails.amount} for Hike Purchase was successful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };

    createNotification(notificationData);
    // Send email
    const to = emailId;
    const subject = "Hike purchase successful";
    let templateDetails;
    req.user.registeredBy ?
      templateDetails = await fetchPartnerDetails(req.user.registeredBy)
      :
      templateDetails = await partnerLogos()
    const resolvedHikeSuccess = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.HIKE_PURCHASE_SUCCESS,
      service: EMAIL_TEMPLATE_SERVICES.HIKE,
      variables: {
        name,
        transactionId: paymentDetails.transactionId,
        amount: formatNumberWithLocalString(totalAmount),
        surcharge: formatNumberWithLocalString(surcharge),
        branding: templateDetails?.branding || 'Peko',
        website: templateDetails?.website || 'https://www.peko.one',
        ...v2LayoutVariables(templateDetails),
      },
      fallback: () => generateHikePurchaseSuccessEmail(name, paymentDetails.transactionId, totalAmount, surcharge, selectedHikes, templateDetails),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedHikeSuccess.html;
    const invoiceAttachments = await generateOrderInvoiceAttachments({
      amount: totalAmount,
      surcharge: surcharge || 0,
      couponDiscount: transactionResponse?.couponDiscount || 0,
      corporateTxnId,
      orderId:
        transactionResponse?.orderId ||
        (await findOneOrderByTxnId(corporateTxnId))?.id,
      paymentType: "Hike",
      credentialId,
      vendor: serviceDetails?.vendor,
      commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
      planDetails,
      commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
      traceId: req?.LogTraceId,
    });

    emailer.emailWithMultipleAttachment(
      to,
      resolvedHikeSuccess.subject,
      body,
      invoiceAttachments,
      async (emailErr) => {
        if (emailErr) {
          customLog(req?.LogTraceId, "error", { emailErr })
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
    )
  }

  if (updateDetails.message !== "Payment Successful") {
    // if (process.env.NODE_ENV === 'production') {
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
      amount: (parseFloat(totalAmount) + parseFloat(surcharge)).toFixed(2),
    };

    const notificationData = {
      notificationTitle: "Hike Purchase - Payment unsuccessful",
      notificationBrief: `Payment of ₹ ${paymentDetails.amount} for Hike Purchase was unsuccessful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };

    createNotification(notificationData);

    const subject = "Payment Failed";
    const to = emailId;
    let templateDetails;
    req.user.registeredBy ?
      templateDetails = await fetchPartnerDetails(req.user.registeredBy)
      :
      templateDetails = await partnerLogos()
    let serviceUrl = process.env.NODE_ENV === "staging" ? process.env.STAGING_FRONT_END_URL : process.env.PRODUCTION_FRONT_END_URL;
    const resolvedHikeFailed = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.HIKE_PAYMENT_FAILED,
      service: EMAIL_TEMPLATE_SERVICES.HIKE,
      variables: {
        name,
        serviceName: "Hike",
        retryUrl: serviceUrl || `${templateDetails?.baseUrl}/payments`,
        branding: templateDetails?.branding || 'Peko',
        website: templateDetails?.website || 'https://www.peko.one',
        ...v2LayoutVariables(templateDetails),
      },
      fallback: () => commonFailedTemplate(name, "Hike", serviceUrl, templateDetails),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedHikeFailed.html;

    emailer.email(to, resolvedHikeFailed.subject, body, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });

    const walletDetails = await wallet.findOne({
      where: { credentialId },
      attributes: ["balance"],
    });

    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
      res.redirect(`${req.body.pageAddress}?status="failure"&transactionId=${corporateTxnId}`);
    } else {
      return res.status(500).json({
        status: false,
        message: "Something went wrong",
        data: {
          corporateFinalBalance: walletDetails["balance"],
        },
        responseCode: "001",
      });
    }
  } else {
    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
      res.redirect(`${req.body.pageAddress}?status="success"&transactionId=${corporateTxnId}`);
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
  }
});
