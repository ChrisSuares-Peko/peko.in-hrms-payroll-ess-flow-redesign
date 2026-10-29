'use strict'

const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../utils/checkAndFetchServiceDetails')
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require('../../utils/walletTransaction')
const { createPGTransaction } = require('../../utils/paymentGatewayTransaction')
const { cancelPGTransaction } = require('../../utils/pgRefund')
const { createNotification } = require('../../models/use-cases/notification')
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser')
const { partnerLogos } = require('../../utils/partnerLogos')
const { generateGovtServicePaymentSuccessEmail } = require('../../utils/emailTemplates/govtServices')
const emailer = require('../../utils/emailer')
const { customLog } = require('../../utils/loggerHelper')
const { findUnpaidByServiceId, markApplicationPaid } = require('../../models/use-cases/governmentServicesApplication')
const { findByVendorKey } = require('../../models/use-cases/govtServicesCatalog')
const { commonFailedTemplate } = require('../../utils/emailTemplates/common')
const operatorsData = require('../../utils/operatorsData.json')
const gateway = require('../../utils/indiaFilingsGateway')
const withRetry = require('../../utils/withRetry')
const { computeJournalData } = require('../../utils/computeJournalData')
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue')
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt')

// Every catalog-sourced service's commission/cashback/surcharge and gateway
// credentials resolve off this one operator row, not a separate operator per
// catalog item.
const OPERATOR_ACCESS_KEY = operatorsData['governmentServices']['accessKey']
const TRANSACTION_CATEGORY = 'Government Services'

// Gov Services V2 payment fulfilment — Cashfree PG callback/webhook path.
// Unlike Business Registration, there's no separate vendor chain, so the
// IndiaFilings Create Order call (doc v1.1 §19) happens here right after the
// debit succeeds.
exports.payment = asyncHandler(async (req, res, next) => {
  // gid is the customer_id from purchase's Create Lead call (doc §6),
  // required for the vendor Create Order call below — no longer resolved
  // server-side via the shared JWT-derived gid.
  const { serviceId, amount, payCashback, gid } = req.body
  if (!serviceId || !amount) {
    return next(new ErrorResponse('serviceId and amount are required', 400))
  }
  if (!gid) {
    return next(new ErrorResponse('gid is required', 400))
  }

  const credentialId = req.user.id
  const corporateUserId = req.user.corporateId
  const packageId = req.user.packageId
  const name = req.user.name
  const emailId = req.user.email
  const subCorporateEmail = req.user.subCorporateEmail
  const isSubCorporateUser = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername
  let subCorporateUserId
  if (req.user.role === 'CORPORATE_SUB_USER') subCorporateUserId = req.user.subCorporateId

  // Resolved server-side by {credentialId, serviceId} rather than trusting a
  // client-supplied applicationId/vendorCatalogId.
  const application = await findUnpaidByServiceId(credentialId, serviceId)
  if (!application) return next(new ErrorResponse('Application not found', 404))
  const applicationId = application.id
  const vendorCatalogId = application.vendorCatalogId

  // Idempotency: the PG callback and the webhook can both reach this handler
  // for the same order — if it's already paid, acknowledge success instead of
  // debiting again.
  if (application.paymentStatus === 'COMPLETED') {
    return res.status(200).json({
      status: true,
      message: 'Payment already processed successfully',
      data: { corporateTxnId: application.corporateTxnId, applicationId },
      responseCode: '000',
    })
  }

  const corporateTxnId = req.body.corporateTxnId || new Date().valueOf()

  let partnerDetails
  if (req.user.registeredBy) {
    partnerDetails = await fetchPartnerDetails(req.user.registeredBy)
  } else {
    partnerDetails = await partnerLogos()
  }

  const serviceUrl = process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_PRODUCTION_URL
    : process.env.FRONTEND_STAGING_URL

  // Friendly service name (e.g. "Trademark Registration") for notifications/
  // emails — the application row only stores vendorCatalogId, not a display
  // name, so it's resolved here via the catalog. Needed by both the success
  // and failure paths below.
  const catalogRow = vendorCatalogId ? await findByVendorKey(vendorCatalogId, credentialId) : null
  const serviceLabel = catalogRow?.serviceName
    ? `${catalogRow.serviceName}${catalogRow.variantName ? ` (${catalogRow.variantName})` : ''}`
    : 'Government Service'

  const serviceDetails = await fetchServiceDetails({ credentialId, accessKey: OPERATOR_ACCESS_KEY, packageId, corporateUserId })
  if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
    return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 500))
  }

  const { commissionType, cashbackType, providerCommission, cashback: corporateCashback, id: serviceOperatorId } = serviceDetails

  const numericAmount = parseFloat(amount)
  // The vendor is sent the catalog price without our commission; the marked-up row above is for the journal.
  const vendorRow = vendorCatalogId ? await findByVendorKey(vendorCatalogId, null, false) : null
  const vendorAmount = vendorRow
    ? (vendorRow.amount != null ? Number(vendorRow.amount) : Number(vendorRow.price) || 0)
    : numericAmount
  const surchargeDetails = await calculateSurchargeWithTax(serviceDetails.surcharge, serviceDetails.surchargeType, numericAmount, credentialId)
  const surcharge = surchargeDetails.surcharge
  const totalAttemptedAmount = (numericAmount + surcharge).toFixed(2)

  const journalPlanDetails = catalogRow ? [{
    name: serviceLabel,
    commissionMode: catalogRow.commissionMode,
    commissionType: catalogRow.commissionType,
    commission: catalogRow.commission,
    fixedCommissionPerTransaction: catalogRow.fixedCommissionPerTransaction,
    isCommissionInclGST: catalogRow.isCommissionInclGST,
    isCommissionConfigured: catalogRow.isCommissionConfigured,
    amount: catalogRow.amount != null ? Number(catalogRow.amount) : Number(catalogRow.price) || 0,
  }] : []

  const pgResponse = Array.isArray(req.body?.paymentGatewayResponse)
    ? req.body.paymentGatewayResponse[0]
    : req.body?.paymentGatewayResponse
  const reportData = await computeJournalData({
    serviceDetails,
    pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
    amount: numericAmount,
    paymentMethod: pgResponse?.payment_method || {},
    partnerDetails,
    paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
    couponTotalDiscount: req.body.couponTotalDiscount,
    planDetails: journalPlanDetails,
    corporateState: req.user.state || '',
    credentialId,
  })

  let to, cc
  if (subCorporateEmail) {
    to = subCorporateEmail
    cc = emailId
  } else {
    to = emailId
    cc = undefined
  }

  const commonParams = {
    providerId: applicationId,
    corporateTxnId,
    credentialId,
    serviceOperatorId,
    corporateCashback,
    accountNo: application.applicationId || String(applicationId),
    transactionCategory: TRANSACTION_CATEGORY,
    orderAmount: amount,
    commissionType,
    cashbackType,
    providerCommission,
    payCashback,
    surcharge,
    subCorporateUserId,
    reportData,
  }

  let transactionResponse = {}
  if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
    transactionResponse = await createPGTransaction({
      ...commonParams,
      pgAmount: req.body.pgAmount,
      pgResponse: req.body.paymentGatewayResponse,
      couponCode: req.body.couponCode,
      corporateUserId,
      partnerId: req.user.registeredBy,
    })
  } else {
    transactionResponse = await createWalletTransaction({ ...commonParams, amount })
  }

  if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
    return next(new ErrorResponse(transactionResponse.error, 402))
  }

  publishJournalEvent(
    {
      transactionRef: corporateTxnId,
      type: 'payment',
      contextSnapshot: {
        credentialId,
        vendor: serviceDetails?.vendor || null,
        registeredBy: req?.user?.registeredBy || null,
      },
      reportData,
    },
    req?.LogTraceId
  )

  // Money is already taken past this point — any failure below must refund it.
  const refund = async (reason, err) => {
    customLog(req?.LogTraceId, 'error', { message: reason, applicationId, err: err?.message })
    try {
      if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        await cancelPGTransaction(corporateTxnId)
      }
      await refundWalletTransaction({
        corporateTxnId,
        providerId: applicationId,
        status: 'REFUNDED',
        message: reason,
        orderResponse: JSON.stringify({ applicationId }),
      })
      publishJournalEvent(
        {
          transactionRef: corporateTxnId,
          type: 'refund',
          contextSnapshot: {
            credentialId,
            vendor: serviceDetails?.vendor || null,
            registeredBy: req?.user?.registeredBy || null,
          },
          reportData,
        },
        req?.LogTraceId
      )
    } catch (refundErr) {
      customLog(req?.LogTraceId, 'error', { message: 'Refund failed', corporateTxnId, err: refundErr.message })
    }

    // Same failure notification/email shape as the gift card payment
    // handler's own voucher-failure branch — only here, where money was
    // actually taken and had to be reversed.
    createNotification({
      notificationTitle: 'Government Service Payment - unsuccessful',
      notificationBrief: `The payment of ₹${totalAttemptedAmount} for ${serviceLabel} was unsuccessful. Transaction ID: ${corporateTxnId}.`,
      notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
      notificationCategory: 'CORPORATE',
      notificationBy: 'ADMIN',
    })

    const failureBody = commonFailedTemplate(name, 'Government Services', serviceUrl, partnerDetails)
    emailer.email({ to, cc, subject: 'Payment Failed', body: failureBody }, () => {
      customLog(req?.LogTraceId, 'info', { message: `Failure email sent to ${to}` })
    })
  }

  // Create the vendor payment order/engagement (doc §19). application_id
  // (Create Business's response, doc §23) must be included — omitting it is
  // what caused the later Smart Form "Engagement has no application_id
  // linked" error.
  let vendorPaymentMeta
  let vendorOrderResponse
  try {
    const cfg = await gateway.getConfig()
    if (cfg.error) throw new Error(cfg.error)

    const vendorApplicationId = application.applicationData?.vendor?.applicationId
    if (!vendorApplicationId) throw new Error('Missing vendor business application id on this application')
    if (!vendorCatalogId) throw new Error('Missing vendorCatalogId on this application')

    const createOrderBody = {
      gid: String(gid),
      currency: 'INR',
      catalog_id: Number(vendorCatalogId),
      total_amount: vendorAmount,
      payment_id: Number(corporateTxnId),
      application_id: Number(vendorApplicationId),
    }
    customLog(req?.LogTraceId, 'info', { message: '[govtServicesV2] Create Order request', body: createOrderBody })
    const orderRes = await withRetry(() => gateway.createOrder(cfg, createOrderBody))
    customLog(req?.LogTraceId, 'info', { message: '[govtServicesV2] Create Order response', data: orderRes })
    vendorOrderResponse = orderRes

    // Vendor can reject the order while still returning HTTP 200 — the real
    // success/failure is in the response body's own status.
    const vendorStatus = Number(orderRes?.status)
    if (vendorStatus < 200 || vendorStatus >= 300) {
      throw new Error(orderRes?.message || `Vendor rejected the order (status ${orderRes?.status})`)
    }

    // Accept both response shapes: sandbox returns data as an array of
    // {transaction_id, engagement_id}; the doc shows { engagement_id: [...] }.
    const engagementIds = Array.isArray(orderRes?.data)
      ? orderRes.data.map(d => d?.engagement_id).filter(Boolean)
      : orderRes?.data?.engagement_id || []
    const transactionIds = Array.isArray(orderRes?.data)
      ? orderRes.data.map(d => d?.transaction_id).filter(Boolean)
      : []

    const vendorEngagementId = String(engagementIds[0] ?? '').replace(/\D/g, '') || null
    // The vendor can return a 2xx status with no engagement_id in the body —
    // a malformed "success" that isn't caught by the status check above. If
    // this fell through silently, the application would get marked paid with
    // no usable engagement, and every step after payment (logo upload, Smart
    // Form) hard-requires vendorEngagementId — so treat this as a failure too.
    if (!vendorEngagementId) {
      throw new Error('Vendor order response did not include an engagement id')
    }

    vendorPaymentMeta = {
      gid: String(gid),
      applicationId: vendorApplicationId,
      vendorEngagementId,
      vendorTransactionId: transactionIds[0] ?? null,
    }
  } catch (err) {
    await refund('Govt service vendor order creation failed', err)
    return next(new ErrorResponse('Payment could not be completed — amount refunded', 500))
  }

  // Money is taken and the vendor order exists — mark the draft paid; refund
  // if we can't record it.
  const paidAmount = (numericAmount + surcharge - (transactionResponse.couponDiscount || 0)).toFixed(2)
  try {
    await markApplicationPaid(applicationId, credentialId, {
      amount: paidAmount,
      corporateTxnId: String(corporateTxnId),
      paidAt: new Date(),
      vendor: vendorPaymentMeta,
    })
  } catch (err) {
    await refund('Govt service application update failed', err)
    return next(new ErrorResponse('Payment could not be recorded — amount refunded', 500))
  }

  await updateWalletTransaction({
    corporateTxnId,
    providerId: applicationId,
    status: 'SUCCESS',
    message: 'Payment Successful',
    orderResponse: JSON.stringify({ applicationId }),
  })

  createNotification({
    notificationTitle: 'Government Service - Payment Successful',
    notificationBrief: `Payment of ₹${paidAmount} for ${serviceLabel} was successful.`,
    notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
    notificationCategory: 'CORPORATE',
    notificationBy: 'ADMIN',
  })

  const attachments = await generateOrderInvoiceAttachments({
    amount: numericAmount,
    surcharge,
    couponDiscount: transactionResponse.couponDiscount ?? 0,
    corporateTxnId,
    orderId: transactionResponse.orderId,
    paymentType: 'Government Services',
    description: serviceLabel,
    credentialId,
    pgAmount: Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse') ? req.body.pgAmount : null,
    paymentMethod: pgResponse?.payment_method,
    vendor: serviceDetails?.vendor,
    commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
    commissionMode: reportData?.journalData?.commissionMode || 'MARGIN',
    planDetails: journalPlanDetails,
    traceId: req?.LogTraceId,
  })

  const subject = 'Government Service Application Submitted'
  const body = generateGovtServicePaymentSuccessEmail(
    name,
    corporateTxnId,
    amount,
    surcharge,
    application.applicationId || String(applicationId),
    serviceLabel,
    partnerDetails,
    serviceUrl
  )

  emailer.emailWithMultipleAttachment(to, subject, body, attachments, cc, (emailErr) => {
    if (emailErr) {
      customLog(req?.LogTraceId, 'error', { message: 'Error sending email', emailErr })
    } else {
      customLog(req?.LogTraceId, 'info', { message: `Success email sent to ${to}` })
    }
  })

  customLog(req?.LogTraceId, 'info', {
    message: 'Govt service payment successful',
    applicationId,
    corporateTxnId,
    vendorEngagementId: vendorPaymentMeta?.vendorEngagementId,
  })

  return res.status(200).json({
    status: true,
    message: 'Payment completed successfully',
    data: {
      ...transactionResponse,
      corporateTxnId,
      applicationId,
      vendorOrderResponse,
      vendor: vendorPaymentMeta,
    },
    responseCode: '000',
  })
})
