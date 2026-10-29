'use strict'

const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const govtServiceUseCase = require('../../models/use-cases/govtService')
const {
  create,
  updateApplicationNumber,
  findById,
  findByCredentialId,
  findDraftByService,
  findByService,
  findDraftsByCredentialId,
  submitApplication,
  saveFormData,
  updateApplicationData
} = require('../../models/use-cases/govtServiceApplications')
const { uploadFile } = require('../../utils/commonUploadFile')
const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../utils/checkAndFetchServiceDetails')
const emailer = require('../../utils/emailer')
const { commonFailedTemplate } = require('../../utils/emailTemplate/common')
const { generateGovtServicePaymentSuccessEmail } = require('../../utils/emailTemplate/govtServices')
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser')
const { customLog } = require('../../utils/loggerHelper')
const wallet = require('../../models/entities/wallet')

const { createWalletTransaction, updateWalletTransaction } = require('../../utils/walletTransaction')
const { createNotification } = require('../../models/use-cases/notification')
const { createPGTransaction } = require('../../utils/pamentGatewayTransaction')
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt')
const { findOneOrderByTxnId } = require('../../models/use-cases/order')
const { computeJournalData } = require('../../utils/computeJournalData')
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue')
const { generateGovtServicePdf, PDF_SERVICES } = require('../../utils/govtServicePdfGenerator')
const indiaDistricts = require('../../utils/indiaDistricts.json')
const countries = require('../../utils/countries.json')
const municipalBodies = require('../../utils/municipalBodies.json')
const panBusinessCodes = require('../../utils/panBusinessCodes.json')

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

// Resolve Peko Service Fee (cashback.unitPrice) per accessKey, mirroring officeAndBusiness's getVerificationPrice
const fetchUnitPricesByAccessKey = async (accessKeys, { credentialId, corporateUserId, packageId }) => {
  const unitPriceByAccessKey = {}
  for (const accessKey of accessKeys) {
    const serviceDetails = await fetchServiceDetails({ credentialId, accessKey, packageId, corporateUserId })
    if (!Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      unitPriceByAccessKey[accessKey] = serviceDetails.unitPrice
    }
  }
  return unitPriceByAccessKey
}

const getHighestStep = (formData) => {
  const keys = Object.keys(formData || {}).filter(k => /^step\d+$/.test(k))
  if (keys.length === 0) return 0
  return Math.max(...keys.map(k => parseInt(k.replace('step', ''))))
}

// Detect document fields ({ base64, format, name }) and upload to S3, replace base64 with fileKey
const processFormData = async (formData, applicationId) => {
  const processed = {}
  for (const [stepKey, stepData] of Object.entries(formData)) {
    const processedStep = {}
    for (const [fieldKey, value] of Object.entries(stepData)) {
      if (value && typeof value === 'object' && value.base64) {
        const fileUrl = await uploadFile(value.base64, `govt-service-docs/${applicationId}`, value.format)
        console.log(`Uploaded [${fieldKey}]:`, fileUrl)
        processedStep[fieldKey] = fileUrl
      } else {
        processedStep[fieldKey] = value
      }
    }
    processed[stepKey] = processedStep
  }
  return processed
}

exports.saveApplication = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id
  const { accessKey: service, applicationId, formData, status } = req.body

  // Update existing application
  if (applicationId) {
    const application = await findById(applicationId, credentialId)
    if (!application) {
      return next(new ErrorResponse('Application not found', 404))
    }
    if (application.status !== 'DRAFT' && application.status !== 'REUPLOAD') {
      return next(new ErrorResponse('Cannot update a submitted application', 400))
    }

    const updateData = {}
    let mergedFormData = null

    if (formData && Object.keys(formData).length > 0) {
      const processedFormData = await processFormData(formData, applicationId)
      mergedFormData = { ...application.formData, ...processedFormData }
      updateData.formData = mergedFormData
      updateData.currentStep = getHighestStep(mergedFormData)
    }

    if (status) {
      updateData.status = status
    }

    if (Object.keys(updateData).length > 0) {
      await updateApplicationData(applicationId, credentialId, updateData)
    }

    const existingFormData = application.formData || {}
    const formDataForPdf = mergedFormData || existingFormData
    const shouldGeneratePdf =
      PDF_SERVICES.has(application.service) &&
      formDataForPdf.step3 &&
      (mergedFormData?.step3 || !existingFormData.generatedDocument)

    if (shouldGeneratePdf) {
      try {
        const pdfUrl = await generateGovtServicePdf(application.service, formDataForPdf, applicationId)
        if (pdfUrl) {
          await updateApplicationData(applicationId, credentialId, {
            formData: { ...formDataForPdf, generatedDocument: pdfUrl }
          })
        }
      } catch (err) {
        console.error('Error generating govt service PDF:', err)
      }
    }

    return res.status(200).json({
      status: true,
      message: 'Application saved successfully',
      data: { applicationId },
      responseCode: '000'
    })
  }

  // Create new application (first step)
  if (!service) {
    return next(new ErrorResponse('accessKey is required', 400))
  }

  // Return existing DRAFT if user already started this service
  const existing = await findDraftByService(credentialId, service)
  if (existing) {
    let existingMergedFormData = null
    if (formData) {
      const processedFormData = await processFormData(formData, existing.id)
      existingMergedFormData = { ...existing.formData, ...processedFormData }
      const currentStep = getHighestStep(existingMergedFormData)
      await saveFormData(existing.id, credentialId, existingMergedFormData, currentStep)
    }

    const existingFD = existing.formData || {}
    const fdForPdf = existingMergedFormData || existingFD
    const shouldGenExisting =
      PDF_SERVICES.has(existing.service) &&
      fdForPdf.step3 &&
      (existingMergedFormData?.step3 || !existingFD.generatedDocument)

    if (shouldGenExisting) {
      try {
        const pdfUrl = await generateGovtServicePdf(existing.service, fdForPdf, existing.id)
        if (pdfUrl) {
          await updateApplicationData(existing.id, credentialId, {
            formData: { ...fdForPdf, generatedDocument: pdfUrl }
          })
        }
      } catch (err) {
        console.error('Error generating govt service PDF:', err)
      }
    }

    return res.status(200).json({
      status: true,
      message: 'Application saved successfully',
      data: { applicationId: existing.id, applicationNumber: existing.applicationNumber },
      responseCode: '000'
    })
  }

  const application = await create({
    service,
    credentialId,
    status: 'DRAFT',
    currentStep: 0,
    formData: {}
  })

  const serviceCode = service.split('-').map(w => w[0]).join('').toUpperCase()
  const applicationNumber = `${serviceCode}-${new Date().getFullYear()}-${String(application.id).padStart(5, '0')}`
  await updateApplicationNumber(application.id, applicationNumber)

  if (formData) {
    const processedFormData = await processFormData(formData, application.id)
    const currentStep = getHighestStep(processedFormData)
    await saveFormData(application.id, credentialId, processedFormData, currentStep)
  }

  return res.status(201).json({
    status: true,
    message: 'Application created successfully',
    data: { applicationId: application.id, applicationNumber },
    responseCode: '000'
  })
})

exports.payApplication = asyncHandler(async (req, res, next) => {
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

  const corporateTxnId = new Date().valueOf()
  const surchargeDetails = await calculateSurchargeWithTax(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId)
  const surcharge = surchargeDetails.surcharge
  const totalAmount = (parseFloat(amount) + parseFloat(surcharge)).toFixed(2)

  const serviceRecord = await govtServiceUseCase.findOne({ slug: application.service })
  const pekoServiceFee = parseFloat(serviceRecord?.price ?? amount)

  const reportData = await computeJournalData({
    serviceDetails,
    amount: parseFloat(amount),
    paymentMethod: 'WALLET',
    partnerDetails,
    paymentGatewayName: 'WALLET',
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
      price: serviceDetails?.unitPrice || null,
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
      notificationBrief: `The payment of ₹${totalAmount} for ${application.service} was successful. Transaction ID: ${corporateTxnId}.`,
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
      name: serviceRecord?.name || application.service || 'Government Service',
      amount: pekoServiceFee,
      quantity: 1,
    }]

    const invoiceAttachments = await generateOrderInvoiceAttachments({
      amount: amount,
      surcharge: surcharge || 0,
      couponDiscount: transactionResponse?.couponDiscount || 0,
      corporateTxnId,
      orderId:
        transactionResponse?.orderId ||
        (await findOneOrderByTxnId(corporateTxnId))?.id,
      paymentType: 'Government Services',
      credentialId,
      vendor: serviceDetails?.vendor,
      commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
      planDetails,
      commissionMode: reportData?.journalData?.commissionMode || 'MARGIN',
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

exports.submitApplication = asyncHandler(async (req, res, next) => {
  const { id } = req.params
  const credentialId = req.user.id

  const application = await findById(id, credentialId)
  if (!application) {
    return next(new ErrorResponse('Application not found', 404))
  }
  if (application.status !== 'DRAFT') {
    return next(new ErrorResponse('Application is already submitted', 400))
  }

  const [updated] = await submitApplication(id, credentialId)
  if (!updated) {
    return next(new ErrorResponse('Failed to submit application', 500))
  }

  return res.status(200).json({
    status: true,
    message: 'Application submitted successfully',
    data: null,
    responseCode: '000'
  })
})

exports.getMyDrafts = asyncHandler(async (req, res) => {
  const credentialId = req.user.id
  const { accessKey: service } = req.query

  if (service) {
    const draft = await findDraftByService(credentialId, service)
    if (draft) {
      draft.dataValues.currentStep = getHighestStep(draft.formData || {})
    }
    return res.status(200).json({
      status: true,
      message: 'Draft fetched successfully',
      data: draft || null,
      responseCode: '000'
    })
  }

  const drafts = await findDraftsByCredentialId(credentialId)
  return res.status(200).json({
    status: true,
    message: 'Drafts fetched successfully',
    data: drafts,
    responseCode: '000'
  })
})

exports.getMyApplications = asyncHandler(async (req, res) => {
  const credentialId = req.user.id
  const { accessKey: service } = req.query

  if (service) {
    const application = await findByService(credentialId, service)
    if (application) {
      application.dataValues.currentStep = getHighestStep(application.formData || {})
    }
    return res.status(200).json({
      status: true,
      message: 'Application fetched successfully',
      data: application || null,
      responseCode: '000'
    })
  }

  const applications = await findByCredentialId(credentialId)
  return res.status(200).json({
    status: true,
    message: 'Applications fetched successfully',
    data: applications,
    responseCode: '000'
  })
})

exports.getApplicationById = asyncHandler(async (req, res, next) => {
  const { id } = req.params
  const credentialId = req.user.id

  const application = await findById(id, credentialId)
  if (!application) {
    return next(new ErrorResponse('Application not found', 404))
  }

  application.dataValues.currentStep = getHighestStep(application.formData || {})

  return res.status(200).json({
    status: true,
    message: 'Application fetched successfully',
    data: application,
    responseCode: '000'
  })
})

exports.downloadFile = asyncHandler(async (req, res, next) => {
  const { url } = req.query

  if (!url) {
    return next(new ErrorResponse('url is required', 400))
  }

  if (!url.startsWith('https://firebasestorage.googleapis.com/')) {
    return next(new ErrorResponse('Invalid file URL', 400))
  }

  const response = await fetch(url)
  if (!response.ok) {
    return next(new ErrorResponse('Failed to fetch document', 500))
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const extension = url.split('.').pop().split('?')[0].toLowerCase()
  const mimeMap = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' }
  const type = mimeMap[extension] || response.headers.get('content-type') || 'application/octet-stream'

  return res.status(200).json({
    status: true,
    data: { buffer, type },
    message: 'Fetched document successfully',
    responseCode: '000'
  })
})

exports.getServiceBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params
  const credentialId = req.user.id
  const corporateUserId = req.user.corporateId
  const packageId = req.user.packageId

  const service = await govtServiceUseCase.findOne({ slug })
  if (!service) {
    return next(new ErrorResponse('Service not found', 404))
  }

  const unitPriceByAccessKey = await fetchUnitPricesByAccessKey([service.accessKey], { credentialId, corporateUserId, packageId })

  return res.status(200).json({
    status: true,
    message: 'Service fetched successfully',
    data: {
      ...service.dataValues,
      price: unitPriceByAccessKey[service.accessKey] ?? null
    },
    responseCode: '000'
  })
})

exports.getServiceByAccessKey = asyncHandler(async (req, res, next) => {
  const { accessKey } = req.params
  const credentialId = req.user.id
  const corporateUserId = req.user.corporateId
  const packageId = req.user.packageId

  const service = await govtServiceUseCase.findOne({ accessKey })
  if (!service) {
    return next(new ErrorResponse('Service not found', 404))
  }

  const unitPriceByAccessKey = await fetchUnitPricesByAccessKey([accessKey], { credentialId, corporateUserId, packageId })

  return res.status(200).json({
    status: true,
    message: 'Service fetched successfully',
    data: {
      ...service.dataValues,
      price: unitPriceByAccessKey[accessKey] ?? null
    },
    responseCode: '000'
  })
})

exports.getServices = asyncHandler(async (req, res, next) => {
  const { searchText, category, tag, authority } = req.query
  const credentialId = req.user.id
  const corporateUserId = req.user.corporateId
  const packageId = req.user.packageId

  const where = { status: true }
  if (category) where.category = category
  if (tag) where.tag = tag
  if (authority) where.authority = authority

  const services = await govtServiceUseCase.findAll(where, searchText)
  if (!services) {
    return next(new ErrorResponse('Something went wrong while fetching services', 500))
  }

  const accessKeys = [...new Set(services.map(s => s.accessKey))]
  const unitPriceByAccessKey = await fetchUnitPricesByAccessKey(accessKeys, { credentialId, corporateUserId, packageId })
  console.log("these are unit prices",unitPriceByAccessKey)
  return res.status(200).json({
    status: true,
    message: 'Services fetched successfully',
    data: services.map(s => ({
      ...s.dataValues,
      price: unitPriceByAccessKey[s.accessKey] ?? null
    })),
    responseCode: '000'
  })
})

exports.getDistricts = asyncHandler(async (req, res, next) => {
  const { state } = req.query

  if (!state) {
    return res.status(200).json({
      status: true,
      message: 'All states and districts fetched successfully',
      data: indiaDistricts,
      responseCode: '000'
    })
  }

  const districts = indiaDistricts[state]
  if (!districts) {
    return next(new ErrorResponse(`No districts found for state: ${state}`, 404))
  }

  return res.status(200).json({
    status: true,
    message: 'Districts fetched successfully',
    data: districts,
    responseCode: '000'
  })
})

exports.getStates = asyncHandler(async (req, res) => {
  return res.status(200).json({
    status: true,
    message: 'States fetched successfully',
    data: Object.keys(indiaDistricts),
    responseCode: '000'
  })
})

exports.getCountries = asyncHandler(async (req, res) => {
  return res.status(200).json({
    status: true,
    message: 'Countries fetched successfully',
    data: countries,
    responseCode: '000'
  })
})

exports.getMunicipalBodies = asyncHandler(async (req, res, next) => {
  const { state } = req.query

  if (!state) {
    return res.status(200).json({
      status: true,
      message: 'All municipal bodies fetched successfully',
      data: municipalBodies,
      responseCode: '000'
    })
  }

  const bodies = municipalBodies[state]
  if (!bodies) {
    return next(new ErrorResponse(`No municipal bodies found for state: ${state}`, 404))
  }

  return res.status(200).json({
    status: true,
    message: 'Municipal bodies fetched successfully',
    data: bodies,
    responseCode: '000'
  })
})

exports.getPanBusinessCodes = asyncHandler(async (req, res) => {
  const { sectorCode } = req.query

  if (sectorCode) {
    const code = parseInt(sectorCode, 10)
    const filtered = panBusinessCodes.filter(item => item.sectorCode === code)
    return res.status(200).json({
      status: true,
      message: 'PAN business codes fetched successfully',
      data: filtered,
      responseCode: '000'
    })
  }

  return res.status(200).json({
    status: true,
    message: 'PAN business codes fetched successfully',
    data: panBusinessCodes,
    responseCode: '000'
  })
})
