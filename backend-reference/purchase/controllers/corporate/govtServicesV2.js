'use strict'

const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { getActiveCatalog, findByVendorKey } = require('../../models/use-cases/govtServicesCatalog')
const governmentServicesApplicationUseCase = require('../../models/use-cases/governmentServicesApplication')
const { uploadFile } = require('../../utils/commonUploadFile')
const { customLog } = require('../../utils/loggerHelper')
const gateway = require('../../utils/indiaFilingsGateway')
const withRetry = require('../../utils/withRetry')
const { applyCommissionMarkup } = require('../../utils/applyCommissionMarkup')

// GET /vendor-businesses?gid= -> businesses under the given gid (doc v1.1
// §22), used to prefill Legal Business Name/PAN for catalog services needing
// an existing business. 
exports.getVendorBusinessesV2 = asyncHandler(async (req, res, next) => {

  const cfg = await gateway.getConfig()

  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const explicitGid = req.query.gid
  const gids = explicitGid
    ? [explicitGid]
    : await governmentServicesApplicationUseCase.findAllVendorGidsByCredential(req.user.id)

  if (!gids.length) {
    return res.status(200).json({
      status: true,
      message: 'Vendor businesses fetched',
      data: { total: 0, businesses: [] },
      responseCode: '000'
    })
  }

  try {
    const results = await Promise.all(gids.map(gid => withRetry(() => gateway.getBusinessList(cfg, gid))))
    const rows = results.flatMap(data => (Array.isArray(data?.data) ? data.data : []))
    // Same business can otherwise appear twice if two of this credential's
    // gids somehow overlap on the vendor side.
    const seen = new Set()
    const businesses = rows.filter(row => {
      if (seen.has(row.application_id)) return false
      seen.add(row.application_id)
      return true
    })
    return res.status(200).json({
      status: true,
      message: 'Vendor businesses fetched',
      data: { total: businesses.length, businesses },
      responseCode: '000'
    })
  } catch (error) {
    return next(new ErrorResponse('Unable to fetch vendor businesses', 502))
  }
})

// GET /vendor-business-detail?application_id= -> View Business (same
// /v4/business endpoint as Business List, scoped by application_id instead of
// gid) — auto-fills Applicant Details when resuming a known application.
exports.getVendorBusinessDetailV2 = asyncHandler(async (req, res, next) => {
  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const { application_id: applicationId } = req.query
  if (!applicationId) return next(new ErrorResponse('application_id is required', 400))

  try {
    const data = await withRetry(() => gateway.getBusinessByApplicationId(cfg, applicationId))
    customLog(null, 'info', { message: '[govtServicesV2] View Business response', applicationId, data })
    return res.status(200).json({
      status: true,
      message: 'Vendor business fetched',
      data: {
        business: data?.business_info ?? null,
        directors: data?.promoter_info ?? [],
        shareholding: data?.shareholder_info ?? []
      },
      responseCode: '000'
    })
  } catch (error) {
    customLog(null, 'error', { message: '[govtServicesV2] View Business failed', applicationId, error: error?.response?.data ?? error.message })
    return next(new ErrorResponse('Unable to fetch vendor business', 502))
  }
})

exports.getVendorDirectorsV2 = asyncHandler(async (req, res, next) => {
  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const { gid } = req.query
  if (!gid) return next(new ErrorResponse('gid is required', 400))

  try {
    const data = await withRetry(() => gateway.getDirectors(cfg, gid))
    return res.status(200).json({
      status: true,
      message: 'Directors fetched',
      data: Array.isArray(data?.data) ? data.data : [],
      responseCode: '000'
    })
  } catch (error) {
    customLog(null, 'error', { message: '[govtServicesV2] Get Directors failed', gid, error: error?.response?.data ?? error.message })
    return next(new ErrorResponse('Unable to fetch directors', 502))
  }
})

exports.addVendorDirectorV2 = asyncHandler(async (req, res, next) => {
  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const { gid, application_id: applicationId, relationship } = req.body
  if (!gid) return next(new ErrorResponse('gid is required', 400))
  if (!applicationId) return next(new ErrorResponse('application_id is required', 400))
  if (!relationship) return next(new ErrorResponse('relationship is required', 400))

  try {
    const data = await withRetry(() => gateway.addDirector(cfg, req.body))
    customLog(null, 'info', { message: '[govtServicesV2] Add Director response', applicationId, data })
    return res.status(200).json({
      status: true,
      message: data?.message || 'Director added',
      data: { peopleId: data?.people_id ?? null },
      responseCode: '000'
    })
  } catch (error) {
    customLog(null, 'error', { message: '[govtServicesV2] Add Director failed', applicationId, error: error?.response?.data ?? error.message })
    return next(new ErrorResponse(error?.response?.data?.message || 'Unable to add director', 502))
  }
})

exports.createVendorBusinessV2 = asyncHandler(async (req, res, next) => {
  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const { pan, entityType, proposedName, state, name, email, mobile, vendorCatalogId } = req.body
  if (!pan) return next(new ErrorResponse('pan is required', 400))
  if (!entityType) return next(new ErrorResponse('entityType is required', 400))
  if (!name || !email || !mobile) return next(new ErrorResponse('name, email and mobile are required to create a vendor lead', 400))

  try {
    let gid = null
    let leadCreated = false
    const createLeadBody = {
      name,
      email,
      country_code: 91,
      mobile,
      lead_source: 'PEKO_PARTNER',
      catalog_id: vendorCatalogId
    }
    customLog(null, 'info', { message: '[govtServicesV2] Create Lead request', body: createLeadBody })
    try {
      const leadRes = await withRetry(() => gateway.createLead(cfg, createLeadBody))
      customLog(null, 'info', { message: '[govtServicesV2] Create Lead response', data: leadRes })
      gid = leadRes?.customer_id != null ? String(leadRes.customer_id) : null
      if (!gid) throw new Error(`Create Lead did not return a customer_id: ${JSON.stringify(leadRes)}`)
      leadCreated = true
    } catch (leadError) {
      customLog(null, 'error', { message: '[govtServicesV2] Create Lead failed', error: leadError?.response?.data ?? leadError.message })
      return next(new ErrorResponse('Unable to create vendor lead', 502))
    }

    const createBusinessBody = {
      gid,
      proposed_name: proposedName,
      state,
      entity_type: entityType,
      pan
    }
    customLog(null, 'info', { message: '[govtServicesV2] Create Business request', body: createBusinessBody })
    const data = await withRetry(() => gateway.createBusinessByPan(cfg, createBusinessBody))
    customLog(null, 'info', { message: '[govtServicesV2] Create Business response', data })

    
    const applicationId = data?.application_id ?? null
    const vendorSaysAlreadyExists = /already exist/i.test(data?.message || '')
    const existingRow = applicationId
      ? await governmentServicesApplicationUseCase.findByApplicationId(String(applicationId))
      : null
    const alreadyExists = vendorSaysAlreadyExists && Boolean(existingRow)
    const created = Boolean(applicationId) && !alreadyExists
    if (alreadyExists) {
      customLog(null, 'info', { message: '[govtServicesV2] Vendor business already exists in our records', vendorCatalogId, applicationId })
    }

    return res.status(200).json({
      status: true,
      message: data?.message || 'Vendor business resolved',
      data: {
        applicationId,
        created,
        alreadyExists,
        gid,
        leadCreated
      },
      responseCode: '000'
    })
  } catch (error) {
    customLog(null, 'error', { message: '[govtServicesV2] createVendorBusinessV2 failed', error: error?.response?.data ?? error.message, stack: error.stack })
    return next(new ErrorResponse('Unable to create vendor business', 502))
  }
})

// POST /verify-pan { pan } -> holder details (doc v1.1 §12), validated before
// creating a vendor business; same response shape as officeAndBusiness's
// verify-pan so the FE reuses its parsePanHolder parser.
exports.verifyVendorPanV2 = asyncHandler(async (req, res, next) => {
  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const { pan } = req.body
  if (!pan) return next(new ErrorResponse('pan is required', 400))

  try {
    const data = await withRetry(() => gateway.verifyPan(cfg, pan))
    return res.status(200).json({
      status: true,
      message: 'PAN verified',
      data,
      responseCode: '000'
    })
  } catch (error) {
    return next(new ErrorResponse('Unable to verify PAN', 502))
  }
})

// Maps a govtServicesCatalog row (purchase's own admin-synced catalog, not
// officeAndBusiness's) to the catalog-item shape. The bulk sync has only one
// price, so market_price mirrors it and government_fee_amount defaults to 0
// ("Free") — the live vendor call below surfaces the real breakdown.
const toGovtServiceCatalogItem = row => ({
  id: row.vendorCatalogId,
  service_id: row.serviceId,
  service_name: row.serviceName,
  variant_name: row.variantName,
  description: row.description,
  market_price: row.amount != null ? Number(row.amount) : Number(row.price) || 0,
  price: row.amount != null ? Number(row.amount) : Number(row.price) || 0,
  government_fee_amount: 0,
  unit: null,
  currency: row.currency,
  about: row.about,
  sortOrder: row.sortOrder,
  status: Boolean(row.status)
})



const toVendorServiceDetailItem = async (row, catalogByVendorId, credentialId) => {
  const catalogRow = catalogByVendorId.get(String(row.id))
  let price
  if (catalogRow?.amount != null) {
    price = Number(catalogRow.amount)
  } else {
    const live = { ...catalogRow, price: row.price }
    await applyCommissionMarkup(live, 'price', credentialId)
    price = live.price
  }
  return {
    ...row,
    status: Number(row.status) === 1,
    price,
    market_price: price
  }
}


exports.getVendorServiceDetailsV2 = asyncHandler(async (req, res, next) => {
  const { service_id: serviceId } = req.query
  if (!serviceId) return next(new ErrorResponse('service_id is required', 400))

  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  try {
    const [data, catalogRows] = await Promise.all([
      withRetry(() => gateway.getServiceDetailsById(cfg, { service_id: serviceId })),
      getActiveCatalog({ serviceId, credentialId: req.user.id })
    ])
    const rows = Array.isArray(data?.data) ? data.data : []
    if (!rows.length) return next(new ErrorResponse('Service details not found', 404))

    const catalogByVendorId = new Map(catalogRows.map(row => [row.vendorCatalogId, row]))

    return res.status(200).json({
      status: true,
      message: 'Vendor service details fetched',
      data: { total: rows.length, variants: await Promise.all(rows.map(row => toVendorServiceDetailItem(row, catalogByVendorId, req.user.id))) },
      responseCode: '000'
    })
  } catch (error) {
    return next(new ErrorResponse('Unable to fetch vendor service details', 502))
  }
})

// GET /service-documents?service_id= -> required document types for a vendor
// service (doc v4/docs/Service), populates the Required Documents list.
exports.getVendorServiceDocumentsV2 = asyncHandler(async (req, res, next) => {
  const { service_id: serviceId } = req.query
  if (!serviceId) return next(new ErrorResponse('service_id is required', 400))

  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  try {
    const data = await withRetry(() => gateway.getServiceDocumentTypes(cfg, { id: serviceId }))
    const docs = Array.isArray(data?.Document_types) ? data.Document_types : []

    return res.status(200).json({
      status: true,
      message: 'Vendor service documents fetched',
      data: { total: docs.length, documents: docs },
      responseCode: '000'
    })
  } catch (error) {
    return next(new ErrorResponse('Unable to fetch vendor service documents', 502))
  }
})

// GET /catalog?service_id= -> the synced Gov Services catalog (active rows
// only, see controllers/admin/govtServiceCatalog.js).
exports.getGovtServiceCatalogV2 = asyncHandler(async (req, res, next) => {
  const { service_id: serviceId } = req.query

  const rows = await getActiveCatalog({ serviceId, credentialId: req.user.id })
  if (rows === false) {
    return next(new ErrorResponse('Unable to fetch govt service catalog', 500))
  }

  const items = rows.map(toGovtServiceCatalogItem)

  return res.status(200).json({
    status: true,
    message: 'Govt service catalog fetched successfully',
    data: { total: items.length, data: items },
    responseCode: '000'
  })
})



// POST /applications { accessKey, formData, applicationId? } -> create or
// update a draft application. accessKey is the vendorCatalogId the FE carries
// throughout.
exports.saveApplicationV2 = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id
  const { accessKey: vendorCatalogId, formData, applicationId } = req.body

  if (!applicationId && !vendorCatalogId) {
    return next(new ErrorResponse('accessKey is required', 400))
  }

  const profile = formData?.profile || {}
  const summaryFields = {
    legalBusinessName: profile.legalBusinessName,
    pan: profile.pan,
    phoneNumber: profile.phoneNumber,
    stateOfRegistration: profile.stateOfRegistration,
    name: profile.name,
    // Only set when a new vendor lead was created this request — otherwise an
    // existing draft's vendorGid is left untouched.
    ...(formData?.vendor?.gid ? { vendorGid: formData.vendor.gid } : {}),
    // Fills in the vendor application_id on the next save, once resolved (the
    // draft row may already exist lead-only, with applicationId null).
    ...(formData?.vendor?.applicationId ? { applicationId: String(formData.vendor.applicationId) } : {}),
    // Quoted price before payment (price + government fee, no surcharge yet)
    // — markApplicationPaid overwrites this with the real paid amount later.
    ...(formData?.amount != null ? { amount: formData.amount } : {})
  }

  if (applicationId) {
    const application = await governmentServicesApplicationUseCase.findById(applicationId, credentialId)
    if (!application) return next(new ErrorResponse('Application not found', 404))
    // SUBMITTED (post-payment, pre-filing) must still be editable here — only
    // COMPLETED (Smart Form actually filed, see submitTrademarkFilingV2) is final.
    if (application.status === 'COMPLETED') {
      return next(new ErrorResponse('Cannot update a submitted application', 400))
    }

    const mergedData = { ...(application.applicationData || {}), ...formData }
    await governmentServicesApplicationUseCase.update(applicationId, credentialId, {
      applicationData: mergedData,
      ...summaryFields
    })

    return res.status(200).json({
      status: true,
      message: 'Application saved successfully',
      data: { applicationId: application.id, applicationNumber: application.applicationId },
      responseCode: '000'
    })
  }

  const existing = await governmentServicesApplicationUseCase.findDraftByVendorCatalogId(credentialId, vendorCatalogId)
  if (existing) {
    const mergedData = { ...(existing.applicationData || {}), ...formData }
    await governmentServicesApplicationUseCase.update(existing.id, credentialId, {
      applicationData: mergedData,
      ...summaryFields
    })
    return res.status(200).json({
      status: true,
      message: 'Application saved successfully',
      data: { applicationId: existing.id, applicationNumber: existing.applicationId },
      responseCode: '000'
    })
  }

  // The vendor's own application_id is used as our applicationId directly —
  // no separately-generated GSC-xxxx number.
  const vendorApplicationId = formData?.vendor?.applicationId
  if (!vendorApplicationId) {
    return next(new ErrorResponse('Vendor application id is required to create this application', 400))
  }

  // applicationId is intentionally not unique on this table (Create Business
  // is idempotent per PAN, so the same vendor application_id can legitimately
  // recur across separate purchases) — every fresh Continue creates its own
  // new row rather than reusing one.
  const catalogRow = await findByVendorKey(vendorCatalogId)

  const created = await governmentServicesApplicationUseCase.create({
    credentialId,
    applicationId: String(vendorApplicationId),
    vendorCatalogId,
    // paymentGateway resolves the application to pay by {credentialId,
    // serviceId} instead of trusting a client-supplied applicationId.
    serviceId: catalogRow ? catalogRow.serviceId : null,
    applicationData: formData || {},
    ...summaryFields
  })

  return res.status(201).json({
    status: true,
    message: 'Application created successfully',
    data: { applicationId: created.id, applicationNumber: created.applicationId },
    responseCode: '000'
  })
})


exports.getApplicationDraftV2 = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id
  const { accessKey: vendorCatalogId, id } = req.query
  if (!vendorCatalogId) return next(new ErrorResponse('accessKey is required', 400))

  const draft = id
    ? await governmentServicesApplicationUseCase.findById(id, credentialId)
    : await governmentServicesApplicationUseCase.findLatestByVendorCatalogId(credentialId, vendorCatalogId)

  return res.status(200).json({
    status: true,
    message: 'Draft fetched successfully',
    data: draft
      ? {
          id: draft.id,
          applicationNumber: draft.applicationId,
          currentStep: 0,
          status: draft.status,
          paymentStatus: draft.paymentStatus,
          gid: draft.vendorGid,
          engagementId: draft.vendorEngagementId,
          formData: draft.applicationData || {},
          approvedDocument: null
        }
      : null,
    responseCode: '000'
  })
})

// POST /trademark-description { goods_or_services } -> Nice class(es) matched
// to the description, plus standard descriptions under those classes (doc
// v1.1 §24) — backs Step 2's Main Goods/Service search.
exports.getTrademarkClassV2 = asyncHandler(async (req, res, next) => {
  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const { goods_or_services: goodsOrServices } = req.body
  if (!goodsOrServices) return next(new ErrorResponse('goods_or_services is required', 400))

  try {
    const data = await withRetry(() => gateway.getTrademarkClass(cfg, goodsOrServices))
    return res.status(200).json({
      status: true,
      message: data?.message || 'Trademark classes identified',
      data: {
        classesIdentified: data?.classes_identified ?? [],
        descriptions: data?.descriptions ?? [],
        classResult: data?.class_result ?? null
      },
      responseCode: '000'
    })
  } catch (error) {
    return next(new ErrorResponse('Unable to identify trademark class', 502))
  }
})

// POST /location { pincode } -> state/district/country/city + serviceability
// for a PIN code, used to prefill the Applicant Details address fields when a
// new address is entered.
exports.locationLookupV2 = asyncHandler(async (req, res, next) => {
  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const { pincode } = req.body
  if (!pincode) return next(new ErrorResponse('pincode is required', 400))

  try {
    const data = await withRetry(() => gateway.locationLookup(cfg, pincode))
    return res.status(200).json({
      status: true,
      message: data?.message || 'Location fetched',
      data: data?.data ?? null,
      responseCode: '000'
    })
  } catch (error) {
    return next(new ErrorResponse('Unable to look up pincode', 502))
  }
})

// Static master list — no vendor language-master API exists, so it's served
// from here rather than hardcoded on the FE.
const TRADEMARK_LANGUAGES = [
  'Afrikaans', 'Albanian', 'Arabic', 'Armenian', 'Basque', 'Bengali', 'Bulgarian', 'Catalan',
  'Cambodian', 'Chinese', 'Croatian', 'Czech', 'Danish', 'Dutch', 'English', 'Estonian',
  'Fiji', 'Finnish', 'French', 'Georgian', 'German', 'Greek', 'Gujarati', 'Hebrew',
  'Hindi', 'Hungarian', 'Icelandic', 'Indonesian', 'Irish', 'Italian', 'Japanese', 'Javanese',
  'Kannada', 'Korean', 'Latin', 'Latvian', 'Lithuanian', 'Macedonian', 'Malay', 'Malayalam',
  'Maltese', 'Maori', 'Marathi', 'Mongolian', 'Nepali', 'Norwegian', 'Oriya', 'Persian',
  'Polish', 'Portuguese', 'Punjabi', 'Quechua', 'Romanian', 'Russian', 'Samoan', 'Serbian',
  'Sinhala', 'Slovak', 'Slovenian', 'Spanish', 'Swahili', 'Swedish', 'Tamil', 'Tatar',
  'Telugu', 'Thai', 'Tibetan', 'Tonga', 'Turkish', 'Ukrainian', 'Urdu', 'Uzbek',
  'Vietnamese', 'Welsh', 'Xhosa'
]

// GET /languages -> the static language master list for the Trademark
// Registration form's Language field (Step 2) — searchable on the FE.
exports.getTrademarkLanguagesV2 = asyncHandler(async (req, res) => {
  return res.status(200).json({
    status: true,
    message: 'Languages fetched successfully',
    data: { languages: TRADEMARK_LANGUAGES },
    responseCode: '000'
  })
})

// POST /request-callback { name, email, mobile, catalogId? } -> registers a
// vendor CRM lead (doc §6) for the "Consult expert" callback request — a
// plain marketing lead, not tied to any application.
exports.requestExpertCallbackV2 = asyncHandler(async (req, res, next) => {
  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const { name, email, mobile, catalogId } = req.body
  if (!name || !email || !mobile) return next(new ErrorResponse('name, email and mobile are required', 400))

  const body = {
    name,
    email,
    country_code: 91,
    mobile,
    lead_source: 'PEKO_PARTNER',
    catalog_id: catalogId
  }
  customLog(null, 'info', { message: '[govtServicesV2] Expert callback lead request', body })

  try {
    const leadRes = await withRetry(() => gateway.createLead(cfg, body))
    customLog(null, 'info', { message: '[govtServicesV2] Expert callback lead response', data: leadRes })
    return res.status(200).json({
      status: true,
      message: 'Request received — our expert will call you back shortly.',
      data: leadRes,
      responseCode: '000'
    })
  } catch (error) {
    customLog(null, 'error', { message: '[govtServicesV2] Expert callback lead failed', error: error?.response?.data ?? error.message })
    return next(new ErrorResponse('Unable to submit your request', 502))
  }
})

// GET /trademark-search?search_term= -> existing marks similar to the
// searched brand name (search_type=similar) — backs Step 2's Brand search icon.
exports.searchSimilarTrademarksV2 = asyncHandler(async (req, res, next) => {
  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const { search_term: searchTerm } = req.query
  if (!searchTerm) return next(new ErrorResponse('search_term is required', 400))

  try {
    const data = await withRetry(() => gateway.searchSimilarTrademarks(cfg, searchTerm))
    return res.status(200).json({
      status: true,
      message: 'Similar trademarks fetched',
      data: { similar: Array.isArray(data?.similar) ? data.similar : [] },
      responseCode: '000'
    })
  } catch (error) {
    return next(new ErrorResponse('Unable to fetch similar trademarks', 502))
  }
})

// GET /engagement-status?engagement_id= -> live engagement details for the
// Relationship Manager card — returns the raw engagement row (or null), no
// broader "application status" object like Business Registration builds.
exports.getEngagementStatusV2 = asyncHandler(async (req, res, next) => {
  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const { engagement_id: engagementId } = req.query
  if (!engagementId) return next(new ErrorResponse('engagement_id is required', 400))

  try {
    const data = await withRetry(() => gateway.getEngagementByEngagementId(cfg, engagementId))
    const rows = Array.isArray(data?.data) ? data.data : []
    return res.status(200).json({
      status: true,
      message: 'Engagement status fetched',
      data: { engagement: rows[0] ?? null },
      responseCode: '000'
    })
  } catch (error) {
    return next(new ErrorResponse('Unable to fetch engagement status', 502))
  }
})


exports.uploadTrademarkLogoV2 = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id
  const { vendorCatalogId, fileBase64, fileName, applicationRowId } = req.body
  if (!vendorCatalogId) return next(new ErrorResponse('vendorCatalogId is required', 400))
  if (!fileBase64) return next(new ErrorResponse('fileBase64 is required', 400))
  const application = applicationRowId
    ? await governmentServicesApplicationUseCase.findById(applicationRowId, credentialId)
    : await governmentServicesApplicationUseCase.findLatestByVendorCatalogId(credentialId, vendorCatalogId)
  if (!application) return next(new ErrorResponse('Application not found', 404))
  if (!application.vendorGid) return next(new ErrorResponse('This application has no vendor gid yet', 400))
  if (!application.applicationId) return next(new ErrorResponse('This application has no vendor application id yet', 400))
  if (!application.vendorEngagementId) {
    return next(new ErrorResponse('This application has no vendor engagement yet — complete payment first', 400))
  }

  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const catalogRow = await findByVendorKey(vendorCatalogId)
  const serviceId = catalogRow ? catalogRow.serviceId : null
  if (!serviceId) return next(new ErrorResponse('Unable to resolve vendor service id for this catalog item', 502))

  let documentNid
  try {
    const docTypes = await withRetry(() => gateway.getServiceDocumentTypes(cfg, { id: serviceId }))
    const rows = Array.isArray(docTypes?.Document_types) ? docTypes.Document_types : []
    const logoDoc = rows.find(d => String(d.doc_name ?? '').trim().toLowerCase() === 'logo')
    documentNid = logoDoc?.document_Nid ?? null
  } catch (error) {
    return next(new ErrorResponse('Unable to resolve the Logo document type', 502))
  }
  if (!documentNid) return next(new ErrorResponse('This service has no Logo document type configured', 502))

  const fields = {
    process: 'Service Document',
    request_on: 'workspace',
    document_Nid: documentNid,
    client_gid: application.vendorGid,
    application_id: application.applicationId,
    service_id: serviceId,
    // Our stored vendorEngagementId is digits-only (stripped at Create Order
    // parse time) — the vendor expects a lowercase "e" prefix here.
    engagement_id: `e${String(application.vendorEngagementId).replace(/\D/g, '')}`,
  }
  customLog(null, 'info', { message: '[govtServicesV2] Logo upload request', fields })

  try {
    const data = await withRetry(() =>
      gateway.uploadServiceDocument(cfg, fields, { buffer: Buffer.from(fileBase64, 'base64'), fileName: fileName || 'logo.png' })
    )
    customLog(null, 'info', { message: '[govtServicesV2] Logo upload response', data })

    // Persist the cloud URL, never the raw base64 — storing base64 in
    // applicationData is what bloated this table enough to trip MySQL's
    // "Out of sort memory" on ordinary ORDER BY queries.
    const logoFormat = (fileName || 'logo.png').split('.').pop() || 'png'
    let logoUrl = null
    try {
      logoUrl = await uploadFile(fileBase64, `govt-services-v2/trademark-logo/${application.id}`, logoFormat, 10)
    } catch (uploadError) {
      customLog(null, 'error', { message: '[govtServicesV2] Logo cloud upload failed', error: uploadError.message })
    }
    await governmentServicesApplicationUseCase.update(application.id, credentialId, {
      applicationData: {
        ...(application.applicationData || {}),
        trademarkLogo: { logoUrl, fileName: fileName || 'logo.png' }
      }
    })

    return res.status(200).json({
      status: true,
      message: 'Logo uploaded successfully',
      data: { logoUrl },
      responseCode: '000'
    })
  } catch (error) {
    customLog(null, 'error', { message: '[govtServicesV2] Logo upload failed', error: error?.response?.data ?? error.message })
    return next(new ErrorResponse('Unable to upload logo', 502))
  }
})

// POST /objection-document — same vendor call as uploadTrademarkLogoV2's Service Document
// upload, generalised: unlike Logo Upload's one fixed field, this is shared by any vendor-catalog
// service with several document fields (Objection, IEC) — the FE passes the document_Nid it
// already has from getVendorServiceDocumentsV2 instead of this endpoint resolving one fixed doc
// type server-side. Route/export name is historical (Objection was first) but the handler itself
// is generic.
exports.uploadObjectionDocumentV2 = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id
  const { vendorCatalogId, fileBase64, fileName, applicationRowId, documentNid, docName } = req.body
  if (!vendorCatalogId) return next(new ErrorResponse('vendorCatalogId is required', 400))
  if (!fileBase64) return next(new ErrorResponse('fileBase64 is required', 400))
  if (!documentNid) return next(new ErrorResponse('documentNid is required', 400))

  const application = applicationRowId
    ? await governmentServicesApplicationUseCase.findById(applicationRowId, credentialId)
    : await governmentServicesApplicationUseCase.findLatestByVendorCatalogId(credentialId, vendorCatalogId)
  if (!application) return next(new ErrorResponse('Application not found', 404))
  if (!application.vendorGid) return next(new ErrorResponse('This application has no vendor gid yet', 400))
  if (!application.applicationId) return next(new ErrorResponse('This application has no vendor application id yet', 400))
  if (!application.vendorEngagementId) {
    return next(new ErrorResponse('This application has no vendor engagement yet — complete payment first', 400))
  }

  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const catalogRow = await findByVendorKey(vendorCatalogId)
  const serviceId = catalogRow ? catalogRow.serviceId : null
  if (!serviceId) return next(new ErrorResponse('Unable to resolve vendor service id for this catalog item', 502))

  const fields = {
    process: 'Service Document',
    request_on: 'workspace',
    document_Nid: documentNid,
    client_gid: application.vendorGid,
    application_id: application.applicationId,
    service_id: serviceId,
    // Same digits-only-stored / lowercase-"e"-prefixed-on-send convention as the Logo upload above.
    engagement_id: `e${String(application.vendorEngagementId).replace(/\D/g, '')}`,
  }
  customLog(null, 'info', { message: '[govtServicesV2] Objection document upload request', fields })

  try {
    const data = await withRetry(() =>
      gateway.uploadServiceDocument(cfg, fields, { buffer: Buffer.from(fileBase64, 'base64'), fileName: fileName || 'document' })
    )
    customLog(null, 'info', { message: '[govtServicesV2] Objection document upload response', data })

    // Same "store the cloud URL, not the base64" reasoning as the Logo upload above.
    const fileFormat = (fileName || 'document').split('.').pop() || 'pdf'
    let fileUrl = null
    try {
      fileUrl = await uploadFile(fileBase64, `govt-services-v2/objection-documents/${application.id}`, fileFormat, 10)
    } catch (uploadError) {
      customLog(null, 'error', { message: '[govtServicesV2] Objection document cloud upload failed', error: uploadError.message })
    }

    // Generic key (not "objectionDocuments") since this same endpoint now also backs IEC's
    // Documents step — keyed by document_Nid so any vendor-catalog service can read its own
    // uploaded state back out of applicationData/formData without colliding with another.
    await governmentServicesApplicationUseCase.update(application.id, credentialId, {
      applicationData: {
        ...(application.applicationData || {}),
        vendorServiceDocuments: {
          ...(application.applicationData?.vendorServiceDocuments || {}),
          [documentNid]: { fileUrl, fileName: fileName || 'document', docName: docName || null }
        }
      }
    })

    return res.status(200).json({
      status: true,
      message: 'Document uploaded successfully',
      data: { fileUrl },
      responseCode: '000'
    })
  } catch (error) {
    customLog(null, 'error', { message: '[govtServicesV2] Objection document upload failed', error: error?.response?.data ?? error.message })
    return next(new ErrorResponse('Unable to upload document', 502))
  }
})


// Trademark Registration's own Smart Form shape (doc §21) — unchanged from before this function
// was split to also support Objection.
const buildTrademarkRegistrationSmartFormBody = (formData, catalogRow) => {
  // Vendor expects each description prefixed with its class (e.g. "Class 38 -
  // Transmission of news"); the FE only stores the plain text.
  const description = Array.isArray(formData.description)
    ? formData.description.map(d => `Class ${formData.trademarkClass || ''} - ${d}`)
    : []

  // The FE stores logo/logoFormat separately (raw base64, no data: prefix) —
  // the vendor wants a single data URI.
  const trademarkImage = formData.logo
    ? `data:image/${formData.logoFormat || 'jpeg'};base64,${formData.logo}`
    : ''

  return {
    form_id: '1',
    form_data: {
      city: formData.city || '',
      name: formData.businessName || '',
      class: formData.trademarkClass || '',
      goods: formData.mainGoodsOrService || '',
      state: formData.state || '',
      address: formData.address || '',
      country: formData.country || '',
      pincode: formData.pincode || '',
      district: formData.district || '',
      language: formData.language || '',
      signatory: formData.authorizedPerson || '',
      salutation: formData.salutation || '',
      service_id: catalogRow ? String(catalogRow.serviceId) : '',
      // Only meaningful when trademarkInUse was checked; defaults to ''.
      used_since: formData.usedSince || '',
      client_name: formData.authorizedPerson || '',
      description,
      entity_type: formData.entityType || '',
      business_name: formData.businessName || '',
      // No category-mark selector in the form yet — fixed to the common default.
      category_mark: 'Word Mark',
      associated_marks: formData.associatedMarks || '',
      trademark_applied_for: formData.brand || '',
      trademark_image: trademarkImage
    }
  }
}

// Trademark Objection's own Smart Form shape — confirmed vendor payload (form_id is the SAME
// '1' as Trademark Registration; the two forms are told apart by their form_data shape, not by
// form_id). No open_application_id (unlike Registration) and no application_date/notice_date —
// neither is part of the confirmed payload. email_template mirrors application_number/brand/class
// from form_data — the vendor uses it for the notification email, not the filing itself.
const buildObjectionSmartFormBody = formData => {
  const applicationNumber = formData.applicationNumber || ''
  const brand = formData.brand || ''
  // FE stores this prefixed as "Class 12" for display — vendor wants the bare number/code.
  const objectionClass = (formData.trademarkClass || '').replace(/^Class\s*/i, '')

  return {
    form_id: '1',
    form_data: {
      brand,
      class: objectionClass,
      signatory: formData.authorizedPerson || '',
      salutation: formData.salutation || '',
      applicant_name: formData.applicantName || '',
      proofs_available: Array.isArray(formData.proofAvailable) ? formData.proofAvailable : [],
      applicant_address: formData.applicantAddress || '',
      objection_section: Array.isArray(formData.objectionSections) ? formData.objectionSections : [],
      application_number: applicationNumber
    },
    email_template: {
      application_number: applicationNumber,
      brand,
      class: objectionClass
    }
  }
}

// Expedited Trademark Registration's own Smart Form shape — confirmed vendor payload (form_id is
// the SAME '1' as the other three; form_data shape is what tells the vendor which form this is).
// No open_application_id, same as Objection's own confirmed payload.
const buildExpeditedTrademarkSmartFormBody = formData => {
  const applicationNumber = formData.applicationNumber || ''
  const brand = formData.brand || ''
  // FE stores this prefixed as "Class 12" for display — vendor wants the bare number/code.
  const expeditedClass = (formData.trademarkClass || '').replace(/^Class\s*/i, '')

  return {
    form_id: '1',
    form_data: {
      brand,
      class: expeditedClass,
      signatory: formData.authorizedPerson || '',
      salutation: formData.salutation || '',
      entity_type: formData.entityType || '',
      applicant_name: formData.applicantName || '',
      // FE's DatePickerInput already stores/displays this as DD-MM-YYYY, matching the vendor's own
      // dd-MM-yyyy expectation directly — no separator conversion needed (unlike Protection).
      application_date: formData.applicationDate || '',
      applicant_address: formData.applicantAddress || '',
      application_number: applicationNumber,
      declaration_reason: formData.declarationReason || ''
    },
    email_template: {
      applicant_name: formData.applicantName || '',
      brand,
      class: expeditedClass,
      application_number: applicationNumber
    }
  }
}

exports.submitTrademarkFilingV2 = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id
  const { vendorCatalogId, formData, applicationRowId } = req.body
  if (!vendorCatalogId) return next(new ErrorResponse('vendorCatalogId is required', 400))
  if (!formData) return next(new ErrorResponse('formData is required', 400))

  const application = applicationRowId
    ? await governmentServicesApplicationUseCase.findById(applicationRowId, credentialId)
    : await governmentServicesApplicationUseCase.findLatestByVendorCatalogId(credentialId, vendorCatalogId)
  if (!application) return next(new ErrorResponse('Application not found', 404))
  if (!application.vendorEngagementId) {
    return next(new ErrorResponse('This application has no vendor engagement yet — complete payment first', 400))
  }

  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const catalogRow = await findByVendorKey(vendorCatalogId)
  const isObjection = Boolean(catalogRow?.serviceName?.toLowerCase().includes('objection'))
  const isExpedited = Boolean(catalogRow?.serviceName?.toLowerCase().includes('expedited'))

  const wrapper = {
    // Vendor requires this as a string, hence the explicit wrap.
    engagement_id: String(application.vendorEngagementId),
    form: 'DRAFT'
  }

  const body = isObjection
    ? { ...wrapper, ...buildObjectionSmartFormBody(formData) }
    : isExpedited
    ? { ...wrapper, ...buildExpeditedTrademarkSmartFormBody(formData) }
    : {
        ...wrapper,
        // Sent to avoid the vendor's "Engagement has no application_id linked"
        // error (ETM002) — application.applicationId is the vendor's own Create
        // Business application_id. Not part of Objection's/Expedited's confirmed payload.
        open_application_id: String(application.applicationId ?? ''),
        ...buildTrademarkRegistrationSmartFormBody(formData, catalogRow)
      }

  // Redact the base64 image before logging — the actual request sent to the
  // vendor uses the unredacted body.
  const redactedBody = {
    ...body,
    form_data: {
      ...body.form_data,
      trademark_image: body.form_data.trademark_image
        ? `<base64 ${body.form_data.trademark_image.length} chars>`
        : ''
    }
  }
  customLog(null, 'info', { message: '[govtServicesV2] Trademark Smart Form request', body: redactedBody })

  try {
    const data = await withRetry(() => gateway.submitTrademarkSmartForm(cfg, body))
    customLog(null, 'info', { message: '[govtServicesV2] Trademark Smart Form response', data })

    // Vendor can reject the submission while still returning HTTP 200 — the
    // real success/failure is in the response body. result_id only appears on
    // genuine success, so require both a 2xx body status and a result_id.
    const vendorStatus = Number(data?.status)
    const resultId = data?.result_id
    if (vendorStatus < 200 || vendorStatus >= 300 || resultId == null) {
      customLog(null, 'error', { message: '[govtServicesV2] Trademark Smart Form rejected by vendor', data })
      return next(new ErrorResponse(data?.message || 'Unable to submit trademark application', 502))
    }

    // Persist the redacted copy, not body.form_data — same "Out of sort
    // memory" reasoning as the logo upload above; the vendor already has the
    // real image via this call and the separate Logo Upload document.
    await governmentServicesApplicationUseCase.update(application.id, credentialId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      applicationData: {
        ...(application.applicationData || {}),
        // Mirrors the objectionForm/expeditedForm/trademarkForm draft-key split used when saving progress.
        [isObjection ? 'objectionFiling' : isExpedited ? 'expeditedFiling' : 'trademarkFiling']: { formData: redactedBody.form_data, resultId, vendorResponse: data }
      }
    })

    return res.status(200).json({
      status: true,
      message: data?.message || 'Trademark application submitted successfully',
      data: { applicationId: application.id, resultId },
      responseCode: '000'
    })
  } catch (error) {
    customLog(null, 'error', { message: '[govtServicesV2] Trademark smart form submission failed', error: error?.response?.data ?? error.message })
    return next(new ErrorResponse('Unable to submit trademark application', 502))
  }
})

// Entity types where the CIN/LLPIN + Date of Incorporation section is shown
// and validated (GST_Registration.pdf §E1). Hidden for the rest.
const ENTITY_TYPES_WITHOUT_CIN_DOI = ['proprietorship', 'individual', 'trust', 'partnership']
const requiresCinDoi = entityType => !ENTITY_TYPES_WITHOUT_CIN_DOI.includes(String(entityType || '').trim().toLowerCase())

// GET /hsn-search?search_term= -> HSN (goods) codes matching the search term,
// for Step 3's "Top 5 - Goods & Services" field (GST_Registration.pdf §E5).
// Goods only — see gateway.searchHsnCode's comment; SAC (services) search is
// a separate, still-unconfirmed endpoint.
exports.searchHsnCodeV2 = asyncHandler(async (req, res, next) => {
  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const { search_term: searchTerm } = req.query
  if (!searchTerm) return next(new ErrorResponse('search_term is required', 400))

  try {
    const data = await withRetry(() => gateway.searchHsnCode(cfg, searchTerm))
    const rows = Array.isArray(data?.data) ? data.data : []
    return res.status(200).json({
      status: true,
      message: data?.message || 'HSN codes fetched',
      data: {
        hsn: rows.map(row => ({
          code: row.code,
          description: row.description,
          display: `HSN - ${row.code} - ${row.description}`
        }))
      },
      responseCode: '000'
    })
  } catch (error) {
    customLog(null, 'error', { message: '[govtServicesV2] HSN code search failed', error: error?.response?.data ?? error.message })
    return next(new ErrorResponse('Unable to search HSN codes', 502))
  }
})

// Each gst_jurisdiction sub-array item is already {id, name} — no parsing needed, just relabel
// for the FE's dropdown shape ({label, value}).
const toJurisdictionOptions = rows =>
  (Array.isArray(rows) ? rows : []).map(row => ({ label: row.name, value: row.id }))

// POST /gst-jurisdiction { pincode } -> Commissionerate/Circle/Division/Range options for
// Step 2's Address Details dropdowns (GST_Registration.pdf §E6), confirmed live via
// gateway.gstJurisdictionLookup — POST {baseGeneral}/pincode { pincode, type: 'gst' }.
exports.gstJurisdictionLookupV2 = asyncHandler(async (req, res, next) => {
  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const { pincode } = req.body
  if (!pincode) return next(new ErrorResponse('pincode is required', 400))

  try {
    const data = await withRetry(() => gateway.gstJurisdictionLookup(cfg, pincode))
    const jurisdiction = data?.data?.gst_jurisdiction ?? {}
    return res.status(200).json({
      status: true,
      message: 'GST jurisdiction fetched',
      data: {
        state: data?.data?.state ?? '',
        district: data?.data?.district ?? '',
        // city/place for the filing payload's §E7a #18/#19 fields — confirmed live (2026-09-28)
        // that this same /pincode call already returns a top-level `city` (distinct from
        // gst_jurisdiction's own circle/division, which reuse "circle"/"division" as key names
        // for unrelated values — don't confuse the two). No dedicated "place" field in the raw
        // response; IndiaFilings' own reference sample showed place === district's value, so
        // mirroring district here until/unless they confirm otherwise.
        city: data?.data?.city ?? '',
        place: data?.data?.district ?? '',
        commissionerate: toJurisdictionOptions(jurisdiction.commissionerate),
        circle: toJurisdictionOptions(jurisdiction.circle),
        division: toJurisdictionOptions(jurisdiction.division),
        range: toJurisdictionOptions(jurisdiction.range)
      },
      responseCode: '000'
    })
  } catch (error) {
    customLog(null, 'error', { message: '[govtServicesV2] GST jurisdiction lookup failed', error: error?.response?.data ?? error.message })
    return next(new ErrorResponse('Unable to fetch GST jurisdiction for this pincode', 502))
  }
})

// POST /gst-document { vendorCatalogId, fileBase64, fileName, docType,
// applicationRowId } -> uploads a GST KYC/business document. Generalizes
// uploadTrademarkLogoV2's pattern: docType picks the document type instead of
// a hardcoded "logo", and the cloud URL is stored under
// applicationData.gstDocuments[docType] instead of a fixed trademarkLogo key.
exports.uploadGstDocumentV2 = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id
  const { vendorCatalogId, fileBase64, fileName, docType, applicationRowId } = req.body
  if (!vendorCatalogId) return next(new ErrorResponse('vendorCatalogId is required', 400))
  if (!fileBase64) return next(new ErrorResponse('fileBase64 is required', 400))
  if (!docType) return next(new ErrorResponse('docType is required', 400))

  const application = applicationRowId
    ? await governmentServicesApplicationUseCase.findById(applicationRowId, credentialId)
    : await governmentServicesApplicationUseCase.findLatestByVendorCatalogId(credentialId, vendorCatalogId)
  if (!application) return next(new ErrorResponse('Application not found', 404))
  if (!application.vendorGid) return next(new ErrorResponse('This application has no vendor gid yet', 400))
  if (!application.applicationId) return next(new ErrorResponse('This application has no vendor application id yet', 400))
  if (!application.vendorEngagementId) {
    return next(new ErrorResponse('This application has no vendor engagement yet — complete payment first', 400))
  }

  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const catalogRow = await findByVendorKey(vendorCatalogId)
  const serviceId = catalogRow ? catalogRow.serviceId : null
  if (!serviceId) return next(new ErrorResponse('Unable to resolve vendor service id for this catalog item', 502))

  let documentNid
  try {
    const docTypes = await withRetry(() => gateway.getServiceDocumentTypes(cfg, { id: serviceId }))
    const rows = Array.isArray(docTypes?.Document_types) ? docTypes.Document_types : []
    const matchedDoc = rows.find(d => String(d.doc_name ?? '').trim().toLowerCase() === String(docType).trim().toLowerCase())
    documentNid = matchedDoc?.document_Nid ?? null
  } catch (error) {
    return next(new ErrorResponse('Unable to resolve the document type', 502))
  }
  if (!documentNid) return next(new ErrorResponse(`This service has no "${docType}" document type configured`, 502))

  const fields = {
    process: 'Service Document',
    request_on: 'workspace',
    document_Nid: documentNid,
    client_gid: application.vendorGid,
    application_id: application.applicationId,
    service_id: serviceId,
    // Our stored vendorEngagementId is digits-only (stripped at Create Order
    // parse time) — the vendor expects a lowercase "e" prefix here.
    engagement_id: `e${String(application.vendorEngagementId).replace(/\D/g, '')}`,
  }
  customLog(null, 'info', { message: '[govtServicesV2] GST document upload request', docType, fields })

  try {
    const data = await withRetry(() =>
      gateway.uploadServiceDocument(cfg, fields, { buffer: Buffer.from(fileBase64, 'base64'), fileName: fileName || `${docType}.pdf` })
    )
    customLog(null, 'info', { message: '[govtServicesV2] GST document upload response', data })

    // Persist the cloud URL, never the raw base64 — same "Out of sort memory"
    // reasoning as the trademark logo upload above.
    const docFormat = (fileName || `${docType}.pdf`).split('.').pop() || 'pdf'
    let docUrl = null
    try {
      docUrl = await uploadFile(fileBase64, `govt-services-v2/gst-documents/${application.id}`, docFormat, 10)
    } catch (uploadError) {
      customLog(null, 'error', { message: '[govtServicesV2] GST document cloud upload failed', error: uploadError.message })
    }
    await governmentServicesApplicationUseCase.update(application.id, credentialId, {
      applicationData: {
        ...(application.applicationData || {}),
        gstDocuments: {
          ...(application.applicationData?.gstDocuments || {}),
          [docType]: { docUrl, fileName: fileName || `${docType}.pdf` }
        }
      }
    })

    return res.status(200).json({
      status: true,
      message: 'Document uploaded successfully',
      data: { docUrl },
      responseCode: '000'
    })
  } catch (error) {
    customLog(null, 'error', { message: '[govtServicesV2] GST document upload failed', error: error?.response?.data ?? error.message })
    return next(new ErrorResponse('Unable to upload document', 502))
  }
})

// POST /gst-filing { vendorCatalogId, formData, applicationRowId } -> files
// the GST Registration Smart Form (PPOB, Service ID 79 / Form ID 1 per
// GST_Registration.pdf §E). Mirrors submitTrademarkFilingV2's structure:
// resolve the exact application row, build the vendor payload, validate the
// 200-but-rejected case, persist a redacted copy, flip status to COMPLETED.
exports.submitGstFilingV2 = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id
  const { vendorCatalogId, formData, applicationRowId } = req.body
  if (!vendorCatalogId) return next(new ErrorResponse('vendorCatalogId is required', 400))
  if (!formData) return next(new ErrorResponse('formData is required', 400))

  const application = applicationRowId
    ? await governmentServicesApplicationUseCase.findById(applicationRowId, credentialId)
    : await governmentServicesApplicationUseCase.findLatestByVendorCatalogId(credentialId, vendorCatalogId)
  if (!application) return next(new ErrorResponse('Application not found', 404))
  if (!application.vendorEngagementId) {
    return next(new ErrorResponse('This application has no vendor engagement yet — complete payment first', 400))
  }

  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  // "bid" (doc §E7) comes from the business record's own bid/partner_bid — the same View
  // Business call already used to prefill Step 1 (getVendorBusinessDetailV2). bid is often
  // empty on the vendor side (confirmed live) with partner_bid populated instead — see
  // IndiaFilings_PEKO_API_Integration_Guide_v1.1.pdf §22.3 ("bid / partner_bid / ledgers_id").
  let bid = ''
  if (application.applicationId) {
    const businessData = await gateway.getBusinessByApplicationId(cfg, application.applicationId).catch(() => null)
    const business = businessData?.business_info ?? null
    bid = String(business?.bid || business?.partner_bid || '')
  }

  // Authorized Persons — GST_REGISTRATION_PDF_SPEC.md §E7a #6/#30. The FE collects a list of
  // people on Step 1 (types/index.ts's GstApplicationValues.authorizedPersons) plus a flat
  // primaryAuthorizedPersonKey naming which one is the Authorized Person; schema validation there
  // guarantees at least one entry and a key that matches one of them. Each person is registered
  // with the vendor's People API here (only once, at final filing submit — not eagerly per "Add",
  // to avoid orphan vendor records for people added then removed) via the same createPerson
  // gateway function officeAndBusiness's vendor chain uses.
  const authorizedPersons = Array.isArray(formData.authorizedPersons) ? formData.authorizedPersons : []
  if (authorizedPersons.length === 0) {
    return next(new ErrorResponse('At least one authorized person is required', 400))
  }
  const primaryPerson = authorizedPersons.find(p => p.key === formData.primaryAuthorizedPersonKey)
  if (!primaryPerson) {
    return next(new ErrorResponse('primaryAuthorizedPersonKey must match one of authorizedPersons', 400))
  }

  const splitFullName = fullName => {
    const parts = String(fullName || '').trim().split(/\s+/)
    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || parts[0] || '' }
  }

  let createdPersons
  try {
    createdPersons = await Promise.all(
      authorizedPersons.map(async person => {
        const { firstName, lastName } = splitFullName(person.fullName)
        const personPayload = {
          gid: application.vendorGid || '',
          first_name: firstName,
          last_name: lastName,
          salutation: person.salutation || '',
          // Vendor's People API rejects a bare mobile number with ERR078 ("requires a valid ISD
          // code") — isd_code is a separate field, confirmed against
          // officeAndBusiness/utils/businessRegistrationVendorChain.js's buildPersonPayload.
          isd_code: '91',
          mobile: person.mobile || '',
          email: person.email || '',
          dob: person.dob || '',
          pan: person.pan || '',
          relationship: person.relationship || ''
        }
        const data = await gateway.createPerson(cfg, personPayload)
        const peopleId = String(data?.people_id ?? '')
        if (!peopleId) throw new Error(`Vendor did not return a people_id for ${person.fullName || 'an authorized person'}`)
        return { ...person, peopleId }
      })
    )
  } catch (error) {
    customLog(null, 'error', { message: '[govtServicesV2] Authorized person creation failed', error: error?.response?.data ?? error.message })
    return next(new ErrorResponse('Unable to register an authorized person with the vendor', 502))
  }

  const partnerDetails = createdPersons.map(person => ({
    people_id: person.peopleId,
    fullname: person.fullName || '',
    relationship: person.relationship || '',
    pan: person.pan || '',
    din: '-',
    date_of_birth: person.dob || '-',
    dsc_expiry: '-'
  }))
  const primaryCreatedPerson = createdPersons.find(p => p.key === formData.primaryAuthorizedPersonKey)

  // Field order below deliberately mirrors IndiaFilings' own reference payload (Sangeetha A,
  // "GST registration-79.txt", 2026-09-21) field-for-field, so this object can be diffed against
  // that file at a glance. That sample also corrected several field names the PDF's §E7 table had
  // stale (pan/mobile_no/client_address/district/cin_llpin/incorporated_date — not the
  // gst_applying_*/cin/doi/address names the table listed), nature_of_business_activity as a
  // comma-joined string rather than an array, and goodsorservices (not top5_goods_and_services)
  // for the combined HSN+SAC display-string list.
  //
  // Commented-out keys below are in the reference sample but have no source in our form yet —
  // see the GST_REGISTRATION_PDF_SPEC.md "Open items" section for what each needs.
  const hsnItems = Array.isArray(formData.hsnItems) ? formData.hsnItems : []
  const sacItems = Array.isArray(formData.sacItems) ? formData.sacItems : []

  const formDataPayload = {
    business_name: formData.businessName || application.legalBusinessName || '',
    applicant_type: formData.applicantType || '',
    entity: formData.entityType || '',
    salutation: formData.salutation || '',
    authorized_person: primaryCreatedPerson.fullName || '',
    authorized_person_id: primaryCreatedPerson.peopleId,
    // The name entered pre-payment (ServiceDetail's Primary Details step) — saved as
    // applicationData.profile.name by saveApplicationV2, untouched by every later gstForm save
    // since those only ever spread {gstForm, currentStep} into applicationData, never profile.
    client_name: application.applicationData?.profile?.name || '',
    pan: formData.pan || '',
    // Resolved 2026-09-29 alongside authorized_person_id — the reference sample's top-level
    // date_of_birth is distinct from each partner_details[] entry's own date_of_birth, but both
    // now source from the same primary Authorized Person.
    date_of_birth: primaryCreatedPerson.dob || '',
    // CIN/LLPIN + Date of Incorporation sent only when the entity type requires them (§E1).
    ...(requiresCinDoi(formData.entityType) ? { cin_llpin: formData.cin || '', incorporated_date: formData.doi || '' } : {}),
    gst_applying_email: formData.email || '',
    mobile_no: formData.mobileNumber || '',
    client_address: formData.address || '',
    gst_applying_state: formData.gstApplyingState || '',
    district: formData.district || '',
    pincode: formData.pincode || '',
    // city/place — confirmed live (2026-09-28): the same pincode lookup already returns a
    // top-level city; place has no dedicated field in the raw response, mirrors district per
    // IndiaFilings' reference sample (see GST_REGISTRATION_PDF_SPEC.md §E7a #18/#19).
    city: formData.city || '',
    place: formData.place || '',
    range: formData.range || '',
    range_id: formData.rangeId || '',
    division: formData.division || '',
    div_id: formData.divisionId || '',
    commissionerate: formData.commissionerate || '',
    commissionerate_id: formData.commissionerateId || '',
    circle: formData.circle || '',
    circle_id: formData.circleId || '',
    premises: formData.premises || '',
    nature_of_business_activity: (Array.isArray(formData.natureOfBusinessActivity) ? formData.natureOfBusinessActivity : []).join(', '),
    goodsorservices: [
      ...hsnItems.map(item => `HSN - ${item.code} - ${item.description}`),
      ...sacItems.map(item => `SAC - ${item.code} - ${item.description}`)
    ],
    registration_under_rule: formData.registrationUnderRule14A || '',
    // Fixed literal values sent unconditionally on every filing — confirmed via
    // officeAndBusiness's already-shipped equivalent (businessRegistrationVendorChain.js), which
    // sends these same two exact values on every GST smart-form submission, not just vendor-echoed
    // draft-state markers we can leave out.
    gstregi_draft: ' ',
    gst_ppob_form_drafted: '1',
    partner_details: partnerDetails,
    //
    // Below this point: required per the PDF's §E7 mapping table but not shown in the reference
    // sample (likely just omitted/redacted there, not evidence they're unneeded) — kept.
    bid,
    customer_gid: application.vendorGid || '',
    // Electricity Board / CA Number sent only when GST Applying State is
    // Maharashtra (GST_Registration.pdf §E4).
    ...(String(formData.gstApplyingState || '').trim().toLowerCase() === 'maharashtra'
      ? { electricity_board: formData.electricityBoard || '', ca_number: formData.caNumber || '' }
      : {})
  }

  const body = {
    engagement_id: String(application.vendorEngagementId),
    // Same ETM002 ("Engagement has no application_id linked") avoidance as
    // submitTrademarkFilingV2 above.
    open_application_id: String(application.applicationId ?? ''),
    form: 'DRAFT',
    form_id: '1',
    form_data: formDataPayload
  }
  customLog(null, 'info', { message: '[govtServicesV2] GST Smart Form request', body })

  try {
    const data = await withRetry(() => gateway.submitGstSmartForm(cfg, body))
    customLog(null, 'info', { message: '[govtServicesV2] GST Smart Form response', data })

    // Vendor can reject the submission while still returning HTTP 200 — same
    // guard as submitTrademarkFilingV2.
    const vendorStatus = Number(data?.status)
    const resultId = data?.result_id
    if (vendorStatus < 200 || vendorStatus >= 300 || resultId == null) {
      customLog(null, 'error', { message: '[govtServicesV2] GST Smart Form rejected by vendor', data })
      return next(new ErrorResponse(data?.message || 'Unable to submit GST application', 502))
    }

    await governmentServicesApplicationUseCase.update(application.id, credentialId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      applicationData: {
        ...(application.applicationData || {}),
        gstFiling: { formData: formDataPayload, resultId, vendorResponse: data }
      }
    })

    return res.status(200).json({
      status: true,
      message: data?.message || 'GST application submitted successfully',
      data: { applicationId: application.id, resultId },
      responseCode: '000'
    })
  } catch (error) {
    customLog(null, 'error', { message: '[govtServicesV2] GST smart form submission failed', error: error?.response?.data ?? error.message })
    return next(new ErrorResponse('Unable to submit GST application', 502))
  }
})


// The FE's director display name can carry a leading salutation ("Dr. SIBI XAVIER"); the vendor
// wants the bare name in every person-name field, with salutation sent separately.
const SALUTATION_PREFIX = /^(Mr|Mrs|Ms|Miss|Dr|Prof)\.?\s+/i

// GST Cancellation's own Smart Form shape — form_id is the SAME '1' every other smart form here
// uses (the vendor tells forms apart by form_data shape, not form_id). form_data mirrors
// IndiaFilings' GST Cancellation smart-form payload exactly, including the space-separated
// duplicate keys ('authorized person', 'salutation signatory') the vendor's form reads.
const buildGstCancellationSmartFormBody = (formData, application, gstin) => {
  const personName = String(formData.authorizedPerson || '').replace(SALUTATION_PREFIX, '').trim()
  return {
    form_id: '1',
    form_data: {
      gstin: gstin || '',
      signatory: personName,
      salutation: formData.salutation || '',
      business_name: formData.businessName || application.legalBusinessName || '',
      director_name: personName,
      'authorized person': personName,
      authorized_person: personName,
      authorized_person_id: String(formData.selectedDirectorId || ''),
      'salutation signatory': personName,
      reason_for_cancellation: formData.reasonForCancellation || ''
    }
  }
}

// POST /gst-cancellation-filing { vendorCatalogId, formData, applicationRowId } -> files the GST
// Registration Cancellation Smart Form (GST_Registration_Cancellation_Work_Flow.docx). Mirrors
// submitTrademarkFilingV2/submitGstFilingV2's structure/error-handling.
exports.submitGstCancellationV2 = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id
  const { vendorCatalogId, formData, applicationRowId } = req.body
  if (!vendorCatalogId) return next(new ErrorResponse('vendorCatalogId is required', 400))
  if (!formData) return next(new ErrorResponse('formData is required', 400))
  if (!formData.salutation) return next(new ErrorResponse('salutation is required', 400))
  if (!formData.authorizedPerson) return next(new ErrorResponse('authorizedPerson is required', 400))
  if (!formData.reasonForCancellation) return next(new ErrorResponse('reasonForCancellation is required', 400))

  const application = applicationRowId
    ? await governmentServicesApplicationUseCase.findById(applicationRowId, credentialId)
    : await governmentServicesApplicationUseCase.findLatestByVendorCatalogId(credentialId, vendorCatalogId)
  if (!application) return next(new ErrorResponse('Application not found', 404))
  if (!application.vendorEngagementId) {
    return next(new ErrorResponse('This application has no vendor engagement yet — complete payment first', 400))
  }

  const cfg = await gateway.getConfig(req)
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  // gstin isn't collected on this form (only salutation/authorizedPerson/reason are) — same View
  // Business call submitGstFilingV2 uses for bid, here for the GSTIN the vendor's Cancellation
  // smart form requires.
  let gstin = ''
  if (application.applicationId) {
    const businessData = await gateway.getBusinessByApplicationId(cfg, application.applicationId).catch(() => null)
    gstin = String(businessData?.business_info?.gstin || '')
  }

  const body = {
    // Vendor requires this as a string, hence the explicit wrap.
    engagement_id: String(application.vendorEngagementId),
    form: 'DRAFT',
    // Sent to avoid the vendor's "Engagement has no application_id linked" error (ETM002) — same
    // reasoning as submitTrademarkFilingV2/submitGstFilingV2's own open_application_id.
    open_application_id: String(application.applicationId ?? ''),
    ...buildGstCancellationSmartFormBody(formData, application, gstin)
  }
  customLog(null, 'info', { message: '[govtServicesV2] GST Cancellation Smart Form request', body })

  try {
    const data = await withRetry(() => gateway.submitGstSmartForm(cfg, body))
    customLog(null, 'info', { message: '[govtServicesV2] GST Cancellation Smart Form response', data })

    // Vendor can reject the submission while still returning HTTP 200 — same guard as
    // submitGstFilingV2/submitTrademarkFilingV2.
    const vendorStatus = Number(data?.status)
    const resultId = data?.result_id
    if (vendorStatus < 200 || vendorStatus >= 300 || resultId == null) {
      customLog(null, 'error', { message: '[govtServicesV2] GST Cancellation Smart Form rejected by vendor', data })
      return next(new ErrorResponse(data?.message || 'Unable to submit the cancellation request', 502))
    }

    await governmentServicesApplicationUseCase.update(application.id, credentialId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      applicationData: {
        ...(application.applicationData || {}),
        cancellationFiling: { formData: body.form_data, resultId, vendorResponse: data }
      }
    })

    return res.status(200).json({
      status: true,
      message: data?.message || 'Cancellation request submitted successfully',
      data: { applicationId: application.id, resultId },
      responseCode: '000'
    })
  } catch (error) {
    customLog(null, 'error', { message: '[govtServicesV2] GST Cancellation smart form submission failed', error: error?.response?.data ?? error.message })
    return next(new ErrorResponse('Unable to submit the cancellation request', 502))
  }
})

// GET /applications?page=&limit=&status= -> all of this credential's Gov
// Services V2 applications, enriched with the vendor catalog's
// serviceName/variantName — backs the "My Applications" list page.
// isFormSubmissionComplete only flips true at COMPLETED; payment alone only
// reaches SUBMITTED (see paymentGateway's markApplicationPaid).
exports.getAllApplicationsV2 = asyncHandler(async (req, res) => {
  const credentialId = req.user.id
  const { page = 1, limit = 20, status } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  const { rows, count } = await governmentServicesApplicationUseCase.findAllByCredential(credentialId, {
    offset,
    limit: Number(limit),
    status
  })

  const catalogCache = {}
  const data = await Promise.all(rows.map(async application => {
    let catalogRow = null
    if (application.vendorCatalogId) {
      if (!(application.vendorCatalogId in catalogCache)) {
        catalogCache[application.vendorCatalogId] = await findByVendorKey(application.vendorCatalogId)
      }
      catalogRow = catalogCache[application.vendorCatalogId]
    }
    return {
      id: application.id,
      applicationId: application.applicationId,
      vendorCatalogId: application.vendorCatalogId,
      // Vendor's numeric service_id (e.g. 79 = GST Registration) — lets the FE
      // pick the right registration-form route per service (see catalogRow's
      // serviceId, stored on the row at creation time in saveApplicationV2).
      serviceId: application.serviceId ?? catalogRow?.serviceId ?? null,
      serviceName: catalogRow?.serviceName ?? null,
      variantName: catalogRow?.variantName ?? null,
      legalBusinessName: application.legalBusinessName,
      amount: application.amount,
      status: application.status,
      paymentStatus: application.paymentStatus,
      gid: application.vendorGid,
      engagementId: application.vendorEngagementId,
      // Matches the listing's own sort order (paidAt, not createdAt) — showing
      // createdAt here while sorting by paidAt would display dates that look
      // out of order even though the sort itself is correct.
      createdOn: application.paidAt ?? application.createdAt,
      isFormSubmissionComplete: application.status === 'COMPLETED'
    }
  }))

  return res.status(200).json({
    status: true,
    message: 'Applications fetched successfully',
    data: { total: count, applications: data },
    responseCode: '000'
  })
})
