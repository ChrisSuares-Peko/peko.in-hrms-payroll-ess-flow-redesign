'use strict'

const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../utils/checkAndFetchServiceDetails')
const { createWalletTransaction, updateWalletTransaction } = require('../../utils/walletTransaction')
const { createPGTransaction } = require('../../utils/paymentGatewayTransaction')
const { createNotification } = require('../../models/use-cases/notification')
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue')
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser')
const { commonFailedTemplate } = require('../../utils/emailTemplates/common')
const { generateGovtServicePaymentSuccessEmail } = require('../../utils/emailTemplates/govtServices')
const emailer = require('../../utils/emailer')
const wallet = require('../../models/entities/wallet')
const { customLog } = require('../../utils/loggerHelper')
const { computeJournalData } = require('../../utils/computeJournalData')
const { findById, submitApplication } = require('../../models/use-cases/govtServiceApplications')
const govtServiceUseCase = require('../../models/use-cases/govtService')
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt')

const VALID_ACCESS_KEYS = new Set([
  'govt_gst_registration', 'govt_pt_registration', 'govt_shop_establishment',
  'govt_tan_registration', 'govt_epf_registration', 'govt_esi_registration',
  'govt_pan_registration', 'govt_gst_composition', 'govt_msme_registration',
  'govt_trademark_registration', 'govt_startup_india', 'govt_iso_certification',
  'govt_fssai_basic', 'govt_fssai_state', 'govt_fssai_central',
  'govt_drug_license', 'govt_drug_manufacturing',
  'govt_12a_80g', 'govt_fcra_registration', 'govt_trade_license',
  'govt_fire_safety_noc', 'govt_pcb_consent', 'govt_factory_license',
  'govt_rera_registration', 'govt_iec_registration', 'govt_dsc'
])

exports.payment = asyncHandler(async (req, res, next) => {
  const { applicationId, accessKey, amount } = req.body
  const credentialId = req.user.id
  const corporateUserId = req.user.corporateId
  const packageId = req.user.packageId
  const name = req.user.name
  const emailId = req.user.email
  const subCorporateEmail = req.user.subCorporateEmail
  const transactionCategory = 'Government Services'
  const payCashback = req.body.payCashback
  const isSubCorporateUser = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername
  let subCorporateUserId
  if (req.user.role === 'CORPORATE_SUB_USER') {
    subCorporateUserId = req.user.subCorporateId
  }

  if (!applicationId) {
    return next(new ErrorResponse('applicationId is required', 400))
  }

  const application = await findById(applicationId, credentialId)
  if (!application) {
    return next(new ErrorResponse('No application found', 404))
  }

  if (!accessKey || !VALID_ACCESS_KEYS.has(accessKey)) {
    return next(new ErrorResponse('Invalid accessKey', 400))
  }

  const serviceDetails = await fetchServiceDetails({ credentialId, accessKey, packageId, corporateUserId })
  if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
    return next(new ErrorResponse(serviceDetails.error, 400))
  }

  const commissionType = serviceDetails.commissionType
  const cashbackType = serviceDetails.cashbackType
  const providerCommission = serviceDetails.providerCommission
  const corporateCashback = serviceDetails.cashback
  const serviceOperatorId = serviceDetails.id

  let partnerDetails
  partnerDetails = await fetchPartnerDetails(req.user.registeredBy);

  const corporateTxnId = req.body.corporateTxnId ?? new Date().valueOf()
  const surchargeDetails = await calculateSurchargeWithTax(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId)
  const surcharge = surchargeDetails.surcharge
  const totalAmount = (parseFloat(amount) + parseFloat(surcharge)).toFixed(2)

  const serviceRecord = await govtServiceUseCase.findOne({ accessKey: application.service })
  const pekoServiceFee = parseFloat(serviceRecord?.price ?? amount)

  const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse
  const reportData = await computeJournalData({
    serviceDetails,
    pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
    amount: parseFloat(amount),
    paymentMethod: pgResponse?.payment_method || {},
    partnerDetails,
    paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
    couponTotalDiscount: req.body.couponTotalDiscount,
    corporateState: req.user.state || '',
    planDetails: [{
      commissionType: 'FLAT',
      commission: pekoServiceFee,
      amount: pekoServiceFee,
      fixedCommissionPerTransaction: 0,
      isCommissionInclGST: true,
    }],
    credentialId,
  })

  const commonParams = {
    providerId: corporateTxnId,
    corporateTxnId,
    credentialId,
    serviceOperatorId,
    corporateCashback,
    accountNo: application.applicationNumber,
    transactionCategory,
    orderAmount: amount,
    commissionType,
    cashbackType,
    providerCommission,
    payCashback,
    surcharge,
    subCorporateUserId,
    reportData
  };
          let transactionResponse = {};
          if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
            transactionResponse = await createPGTransaction({
              ...commonParams,
              pgAmount: req.body.pgAmount,
              pgResponse: req.body.paymentGatewayResponse,
              couponCode: req.body.couponCode,
              corporateUserId,
              partnerId: req.user.registeredBy
            });
          } else {
            transactionResponse = await createWalletTransaction({
              ...commonParams,
              amount: amount,
            });
          }

  if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
    return next(new ErrorResponse(transactionResponse.error, 500))
  }

  if (reportData) {
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
  }

  const updateDetails = {
    corporateTxnId,
    providerId: String(application.id),
    status: 'SUCCESS',
    message: 'Payment Successful',
    orderResponse: JSON.stringify({
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      service: application.service,
      serviceName: serviceRecord?.name || application.service,
      category: serviceRecord?.category || null,
      tag: serviceRecord?.tag || null,
      processingTime: serviceRecord?.processingTime || null,
      price: serviceRecord?.price || null,
      govtFee: serviceRecord?.govtFee || null,
      amountPaid: totalAmount,
      transactionId: corporateTxnId,
      paymentDate: new Date().toISOString(),
    })
  }

  await submitApplication(application.id, credentialId)

  await updateWalletTransaction(updateDetails)

  if (updateDetails.message === 'Payment Successful') {
    let to, cc
    if (subCorporateEmail) {
      to = subCorporateEmail
      cc = emailId
    } else {
      to = emailId
      cc = undefined
    }

    createNotification({
      notificationTitle: 'Government Service Application Submitted',
      notificationBrief: `The payment of ₹ ${(parseFloat(amount) + parseFloat(surcharge) - (transactionResponse.couponDiscount ?? 0)).toFixed(2)} for ${application.service} was successful. Transaction ID: ${corporateTxnId}.`,
      notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
      notificationCategory: 'CORPORATE',
      notificationBy: 'ADMIN'
    })

      const serviceUrl = partnerDetails?.baseUrl

    const subject = 'Government Service Application Submitted'
    const body = generateGovtServicePaymentSuccessEmail(
      name,
      corporateTxnId,
      amount,
      surcharge,
      application.applicationNumber,
      serviceRecord?.name || application.service,
      partnerDetails,
      serviceUrl
    )

    const planDetails = [{
      name: serviceRecord?.name || application.service || "Government Service",
      amount: pekoServiceFee,
      quantity: 1,
    }]

    const invoiceAttachments = await generateOrderInvoiceAttachments({
      amount,
      surcharge,
      couponDiscount: transactionResponse.couponDiscount ?? 0,
      corporateTxnId,
      orderId: transactionResponse.orderId,
      paymentType: 'Government Services',
      description: serviceRecord?.name || application.service,
      credentialId,
      pgAmount: Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse') ? req.body.pgAmount : null,
      paymentMethod: pgResponse?.payment_method,
      vendor: serviceDetails?.vendor,
      commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
      planDetails,
      commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
      traceId: req?.LogTraceId,
    })

    emailer.emailWithMultipleAttachment(
      to,
      subject,
      body,
      invoiceAttachments,
      cc,
      async (emailErr) => {
        if (emailErr) {
          customLog(req?.LogTraceId, 'error', { message: 'Error sending email', emailErr })
        } else {
          customLog(req?.LogTraceId, 'info', { message: `Success email sent to ${to}` })
        }
      }
    )

    return res.status(200).json({
      status: true,
      message: 'Payment successful and application submitted',
      data: {
        ...transactionResponse,
        corporateTxnId,
        applicationId: application.id,
        applicationNumber: application.applicationNumber
      },
      responseCode: '000'
    })
  } else {
    let to, cc
    if (subCorporateEmail) {
      to = subCorporateEmail
      cc = emailId
    } else {
      to = emailId
      cc = undefined
    }

    const serviceUrl = partnerDetails?.baseUrl

    createNotification({
      notificationTitle: 'Government Service Payment - unsuccessful',
      notificationBrief: `The payment of ₹${totalAmount} for ${application.service} was unsuccessful. Transaction ID: ${corporateTxnId}.`,
      notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
      notificationCategory: 'CORPORATE',
      notificationBy: 'ADMIN'
    })

    const subject = 'Payment Failed'
    const body = commonFailedTemplate(name, 'Government Services', serviceUrl, partnerDetails)

    emailer.email({ to, cc, subject, body }, function () {
      customLog(req?.LogTraceId, 'info', { message: `Failure email sent to ${to}` })
    })

    const walletDetails = await wallet.findOne({ where: { credentialId }, attributes: ['balance'] })

    return res.status(500).json({
      status: false,
      message: 'Something went wrong',
      data: { corporateFinalBalance: walletDetails['balance'] },
      responseCode: '001'
    })
  }
})
