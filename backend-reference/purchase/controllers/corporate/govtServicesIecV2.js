'use strict'

const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const governmentServicesApplicationUseCase = require('../../models/use-cases/governmentServicesApplication')
const gateway = require('../../utils/indiaFilingsGateway')
const withRetry = require('../../utils/withRetry')

// Confirmed vendor SmartForm payload for IEC (form_id '1', same vendor /smartservices endpoint as
// Trademark). No OTP/email confirmation step — filing is a direct submission like Trademark
// Registration/Objection. bid/partner_bid/business_name aren't stored on our own application row,
// so they're resolved from the vendor's own business record (same View Business call
// getVendorBusinessDetailV2 makes) rather than trusted from the client.
const buildIecSmartFormBody = (formData, businessInfo) => {
  const authorizedPerson = formData.authorizedPerson || ''
  const businessName = businessInfo?.business_name || ''
  const preferredSectors = Array.isArray(formData.preferredSectors) ? formData.preferredSectors : []

  const smartFormData = {
    bid: businessInfo?.bid != null ? String(businessInfo.bid) : '',
    partner_bid: businessInfo?.partner_bid != null ? String(businessInfo.partner_bid) : '0',
    name: authorizedPerson,
    people_id: formData.authorizedPersonId || '',
    signatory: authorizedPerson,
    salutation: formData.salutation || '',
    entity_type: formData.entityType || '',
    business_name: businessName,
    director_name: authorizedPerson,
    // Vendor's own confirmed key, space and all — kept alongside authorized_person below.
    'authorized person': authorizedPerson,
    authorized_person: authorizedPerson,
    preferred_sectors: preferredSectors,
    // Vendor's own Create Business application_id, not our row's own id — same reasoning as
    // Trademark Registration's open_application_id.
    open_application_id: String(formData.businessApplicationId ?? ''),
    authorized_person_id: formData.authorizedPersonId || ''
  }

  if (preferredSectors.includes('Import')) {
    smartFormData.import_details = Array.isArray(formData.importDetails) ? formData.importDetails : []
    smartFormData.import_goods = Array.isArray(formData.importGoods) ? formData.importGoods : []
    smartFormData.import_services = Array.isArray(formData.importServices) ? formData.importServices : []
  }
  if (preferredSectors.includes('Export')) {
    smartFormData.export_details = Array.isArray(formData.exportDetails) ? formData.exportDetails : []
    smartFormData.export_goods = Array.isArray(formData.exportGoods) ? formData.exportGoods : []
    smartFormData.export_services = Array.isArray(formData.exportServices) ? formData.exportServices : []
  }

  return {
    form_id: '1',
    form_data: smartFormData,
    email_template: {
      signatory: authorizedPerson,
      salutation: formData.salutation || '',
      business_name: businessName,
      preferred_sectors: preferredSectors,
      import_goods: Array.isArray(formData.importGoods) ? formData.importGoods : [],
      import_services: Array.isArray(formData.importServices) ? formData.importServices : [],
      export_goods: Array.isArray(formData.exportGoods) ? formData.exportGoods : [],
      export_services: Array.isArray(formData.exportServices) ? formData.exportServices : []
    }
  }
}

// POST /iec/filing { applicationRowId, formData } -> files the IEC application directly with the
// vendor's SmartForm endpoint, same pattern as Trademark's submitTrademarkFilingV2 — no OTP/email
// confirmation step.
exports.submitIecFilingV2 = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id
  const { applicationRowId, formData } = req.body
  if (!applicationRowId) return next(new ErrorResponse('applicationRowId is required', 400))
  if (!formData) return next(new ErrorResponse('formData is required', 400))

  const application = await governmentServicesApplicationUseCase.findById(applicationRowId, credentialId)
  if (!application) return next(new ErrorResponse('Application not found', 404))
  if (!application.vendorEngagementId) {
    return next(new ErrorResponse('This application has no vendor engagement yet — complete payment first', 400))
  }

  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  let businessInfo = null
  try {
    const businessResp = await withRetry(() => gateway.getBusinessByApplicationId(cfg, formData.businessApplicationId))
    businessInfo = businessResp?.business_info ?? null
  } catch (error) {
    customLog(req?.LogTraceId, 'error', {
      message: '[iecFiling] business lookup failed',
      applicationRowId,
      err: error.message
    })
  }

  const body = {
    engagement_id: String(application.vendorEngagementId),
    form: 'DRAFT',
    ...buildIecSmartFormBody(formData, businessInfo)
  }

  customLog(null, 'info', { message: '[iecFiling] IEC Smart Form request', applicationRowId, body })

  try {
    const data = await withRetry(() => gateway.submitTrademarkSmartForm(cfg, body))
    customLog(null, 'info', { message: '[iecFiling] IEC Smart Form response', applicationRowId, data })

    // Same "vendor can 200 while rejecting" guard as Trademark's own submit — result_id only
    // appears on genuine success.
    const vendorStatus = Number(data?.status)
    const resultId = data?.result_id
    if (vendorStatus < 200 || vendorStatus >= 300 || resultId == null) {
      customLog(null, 'error', { message: '[iecFiling] IEC Smart Form rejected by vendor', applicationRowId, data })
      return next(new ErrorResponse(data?.message || 'Unable to file the application', 502))
    }

    await governmentServicesApplicationUseCase.update(application.id, credentialId, {
      status: 'SUBMITTED',
      submittedAt: new Date()
    })

    return res.status(200).json({
      status: true,
      message: 'Your Application has been filed successfully.',
      data: { applicationId: Number(application.id) },
      responseCode: '000'
    })
  } catch (error) {
    customLog(req?.LogTraceId, 'error', {
      message: '[iecFiling] vendor submit failed',
      applicationRowId,
      status: error.response?.status,
      err: error.response?.data ? JSON.stringify(error.response.data) : error.message
    })
    return next(new ErrorResponse('Could not submit the application. Please try again.', 502))
  }
})

// Doc §4.3/§15 "Load Filing Status" — no operational status pipeline exists yet for IEC; the
// Overview correctly falls back to "No Status Available" rather than inventing stage names.
exports.getIecFilingStatus = asyncHandler(async (req, res) => {
  return res.status(200).json({
    status: true,
    message: 'Filing status fetched successfully',
    data: { status: [] },
    responseCode: '000',
  })
})

// Dropdowns API doc — GET /v3/dropdowns?service_id=11&operation=iec_details. The vendor returns
// a single-element data array wrapping { iec_goods, iec_service } (total_count is always 1 for
// this nested-object shape, per the doc) — goods and services stay separate here so the FE can
// split a selected Import/Export Details item back into the right payload key on submission, even
// though both lists are shown merged as one combined dropdown.
exports.getIecDropdowns = asyncHandler(async (req, res, next) => {
  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  try {
    const resp = await withRetry(() => gateway.getDropdowns(cfg, { service_id: 11, operation: 'iec_details' }))
    console.log("dropdown responses",resp)
    const catalogue = (Array.isArray(resp?.data) ? resp.data[0] : null) || {}
    return res.status(200).json({
      status: true,
      message: 'Dropdowns fetched successfully',
      data: {
        goods: Array.isArray(catalogue.iec_goods) ? catalogue.iec_goods : [],
        services: Array.isArray(catalogue.iec_service) ? catalogue.iec_service : [],
      },
      responseCode: '000',
    })
  } catch (error) {
    return next(new ErrorResponse('Unable to fetch dropdowns', 502))
  }
})
