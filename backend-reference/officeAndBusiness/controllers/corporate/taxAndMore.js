const path          = require('path')
const asyncHandler  = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const sandboxApi    = require('../../services/sandboxApi')
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType')
const { reportPdfTemplate } = require('../../utils/reportTemplate')
const ExcelJS = require('exceljs')
const puppeteer = require('puppeteer')
const fs = require('fs')
const { getValue, setValue } = require('../../utils/cacheDataMethods')
const { Op }        = require('sequelize')
const invoicingV2       = require('../../models/entities/invoicingV2')
const TaxSalesInvoice   = require('../../models/entities/taxSalesInvoice')
const TaxAmendment      = require('../../models/entities/taxAmendment')
const TaxGstr1Document  = require('../../models/entities/taxGstr1Document')
const TaxGstr1HsnManual = require('../../models/entities/taxGstr1HsnManual')
const TaxGstr1Filing          = require('../../models/entities/taxGstr1Filing')
const TaxGstr2bReconciliation = require('../../models/entities/taxGstr2bReconciliation')
const TaxGstr3bFiling = require('../../models/entities/taxGstr3bFiling')
const TaxGstr9Filing  = require('../../models/entities/taxGstr9Filing')

const {
  findSetupByUser,
  findActiveSetup,
  createSetup,
} = require('../../models/use-cases/taxGstSetup')

const {
  // createSalesInvoice,
  bulkCreateSalesInvoices,
  findSalesInvoices,
  findSalesInvoiceById,
  updateSalesInvoice,
  deleteSalesInvoice,
  getMonthSummary,
  findExistingInvoiceNos,
} = require('../../models/use-cases/taxSalesInvoice')

const {
  createReconciliation,
  updateReconciliation,
  findReconciliationById,
  // findActiveReconciliation,
} = require('../../models/use-cases/taxImsReconciliation')

const {
  // bulkCreateImsInvoices,
  findImsInvoices,
  findImsInvoiceById,
  updateImsInvoiceAction,
  autoAcceptPending,
  getItcEstimate,
} = require('../../models/use-cases/taxImsInvoice')

// ─── GET /tax/overview ────────────────────────────────────────────────────────
exports.getOverview = asyncHandler(async (req, res) => {
  const setups = await findSetupByUser(req.user.corporateId)
  return res.status(200).json({
    status: true,
    message: 'Tax & More overview retrieved',
    data: {
      kycRequired: setups.length === 0,
      activeSetups: setups,
      services: [
        {
          id: 'gst',
          title: 'GST Filing',
          description: 'End-to-end GST compliance — file GSTR-1, 3B, 9, manage ITC and reconcile purchases.',
          features: ['GSTR-1, 3B & 9 filing', 'Auto GSTR-2A reconciliation', 'Cash & ITC ledger', 'GSTIN verification'],
          available: true,
        },
        {
          id: 'tds',
          title: 'TDS Filing',
          description: 'Complete TDS compliance — file 24Q, 26Q returns, generate Form 16 and reconcile 26AS.',
          features: ['24Q, 26Q & 27Q returns', 'Form 16 / 16A generation', 'OLTAS challan payment', '26AS reconciliation'],
          available: false,
        },
      ],
    },
    responseCode: '000',
  })
})

// ─── POST /tax/gst/setup ─────────────────────────────────────────────────────
// Verify GSTIN via Sandbox, create setup record
exports.setupGst = asyncHandler(async (req, res) => {
  const { gstin, financialYear } = req.body
  const corporateUserId = req.user.corporateId

  const existing = await findActiveSetup(corporateUserId, gstin, financialYear)
  if (existing) {
    return res.status(200).json({
      status: true,
      message: 'GST setup already exists',
      data: existing,
      responseCode: '000',
    })
  }

  customLog(req?.LogTraceId, 'info', { message: 'setupGst: GSTIN search request', gstin }, 'VENDOR')
  const sandboxData = await sandboxApi.searchGstin(gstin)
  customLog(req?.LogTraceId, 'info', { message: 'setupGst: GSTIN search response', gstin, response: sandboxData?.data }, 'VENDOR')
  if (sandboxData?.data?.status_cd === '0') {
    customLog(req?.LogTraceId, 'error', { message: 'setupGst: invalid GSTIN', gstin, response: sandboxData?.data }, 'VENDOR')
    return res.status(200).json({
      status: false,
      message: sandboxData.data?.error?.message || 'Invalid GSTIN',
      data: {},
      responseCode: '001',
    })
  }

  const gstinDetails = sandboxData?.data?.data || {}
  const setup = await createSetup({
    corporateUserId,
    gstin,
    financialYear,
    legalName:  gstinDetails.lgnm  || null,
    tradeName:  gstinDetails.tradeNam || null,
  })

  return res.status(201).json({
    status: true,
    message: 'GST setup completed',
    data: setup,
    responseCode: '000',
  })
})

// ─── GET /tax/gst/setup ──────────────────────────────────────────────────────
exports.getSetups = asyncHandler(async (req, res) => {
  const setups = await findSetupByUser(req.user.corporateId)
  return res.status(200).json({ status: true, message: 'GST setups retrieved', data: setups, responseCode: '000' })
})

// ─── GET /tax/gst/sales-invoices ─────────────────────────────────────────────
// Returns invoice list + month-wise summary for the FY calendar strip
exports.getSalesInvoices = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.query
  const corporateUserId = req.user.corporateId

  const [invoices, monthSummary] = await Promise.all([
    findSalesInvoices(corporateUserId, gstin, financialYear, month ? parseInt(month) : null),
    getMonthSummary(corporateUserId, gstin, financialYear),
  ])

  return res.status(200).json({
    status: true,
    message: 'Sales invoices retrieved',
    data: { invoices, monthSummary },
    responseCode: '000',
  })
})

// ─── POST /tax/gst/sales-invoices ────────────────────────────────────────────
exports.addSalesInvoice = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month, invoices } = req.body
  const corporateUserId = req.user.corporateId

  const rows = invoices.map(inv => ({
    corporateUserId,
    gstin,
    financialYear,
    month: parseInt(month),
    invoiceType:      inv.invoiceType      || 'B2B',
    invoiceNo:        inv.invoiceNo,
    invoiceDate:      inv.invoiceDate,
    hsnCode:          inv.hsnCode          || null,
    placeOfSupply:    inv.placeOfSupply    || null,
    buyerGstin:       inv.buyerGstin       || null,
    buyerName:        inv.buyerName        || null,
    portCode:         inv.portCode         || null,
    shippingBillNo:   inv.shippingBillNo   || null,
    shippingBillDate: inv.shippingBillDate || null,
    taxableAmount:    inv.taxableAmount    || 0,
    igst:          inv.igst          || 0,
    cgst:          inv.cgst          || 0,
    sgst:          inv.sgst          || 0,
    totalTax:      (parseFloat(inv.igst || 0) + parseFloat(inv.cgst || 0) + parseFloat(inv.sgst || 0)).toFixed(2),
    status: (!inv.invoiceNo || !inv.invoiceDate) ? 'missing_fields' : 'uploaded',
  }))

  // Check for duplicate invoice numbers in existing records
  const existingNos = await findExistingInvoiceNos(corporateUserId, gstin, financialYear, parseInt(month))
  const duplicates = rows.filter(r => r.invoiceType !== 'NIL' && existingNos.get(r.invoiceType)?.has(r.invoiceNo)).map(r => r.invoiceNo)
  if (duplicates.length > 0) {
    return res.status(200).json({
      status: false,
      message: `Invoice number${duplicates.length > 1 ? 's' : ''} already exist${duplicates.length === 1 ? 's' : ''}.`,
      data: { duplicates },
      responseCode: '001',
    })
  }

  // NIL records are upserted (one per invoiceNo per month) to avoid duplicates
  const nilRows    = rows.filter(r => r.invoiceType === 'NIL')
  const normalRows = rows.filter(r => r.invoiceType !== 'NIL')

  let count = 0
  if (normalRows.length) {
    const created = await bulkCreateSalesInvoices(normalRows)
    count += created.length
  }
  for (const nilRow of nilRows) {
    const existing = await TaxSalesInvoice.findOne({
      where: { corporateUserId: nilRow.corporateUserId, gstin: nilRow.gstin, financialYear: nilRow.financialYear, month: nilRow.month, invoiceNo: nilRow.invoiceNo },
    })
    if (existing) {
      await existing.update(nilRow)
    } else {
      await TaxSalesInvoice.create(nilRow)
    }
    count++
  }

  // Aggregate HSN data from newly added non-NIL invoices and upsert into TaxGstr1HsnManual
  const monthInt2 = parseInt(month)
  const hsnInvoices = rows.filter(r => r.invoiceType !== 'NIL' && r.hsnCode)
  const hsnAgg = {}
  for (const inv of hsnInvoices) {
    const taxable = parseFloat(inv.taxableAmount || 0)
    const total   = parseFloat(inv.totalTax || 0)
    const rate    = taxable > 0 ? Math.round(total / taxable * 100) : 0
    const key     = `${inv.hsnCode}|${inv.uqc || 'OTH'}|${rate}`
    if (!hsnAgg[key]) {
      hsnAgg[key] = { hsnCode: inv.hsnCode, uqc: inv.uqc || 'OTH', rate, qty: 0, taxableAmount: 0, igst: 0, cgst: 0, sgst: 0, totalTax: 0 }
    }
    hsnAgg[key].qty           += parseFloat(inv.qty           || 0)
    hsnAgg[key].taxableAmount += taxable
    hsnAgg[key].igst          += parseFloat(inv.igst          || 0)
    hsnAgg[key].cgst          += parseFloat(inv.cgst          || 0)
    hsnAgg[key].sgst          += parseFloat(inv.sgst          || 0)
    hsnAgg[key].totalTax      += total
  }
  for (const agg of Object.values(hsnAgg)) {
    const existing = await TaxGstr1HsnManual.findOne({
      where: { corporateUserId, gstin, financialYear, month: monthInt2, hsnCode: agg.hsnCode, uqc: agg.uqc, rate: agg.rate, source: 'invoice' },
      paranoid: false,
    })
    if (existing) {
      await existing.update({
        qty:           parseFloat(existing.qty)           + agg.qty,
        taxableAmount: parseFloat(existing.taxableAmount) + agg.taxableAmount,
        igst:          parseFloat(existing.igst)          + agg.igst,
        cgst:          parseFloat(existing.cgst)          + agg.cgst,
        sgst:          parseFloat(existing.sgst)          + agg.sgst,
        totalTax:      parseFloat(existing.totalTax)      + agg.totalTax,
        deletedAt:     null,
      })
    } else {
      await TaxGstr1HsnManual.create({ corporateUserId, gstin, financialYear, month: monthInt2, source: 'invoice', ...agg })
    }
  }

  return res.status(201).json({
    status: true,
    message: `Invoice added successfully`,
    data: { count },
    responseCode: '000',
  })
})

// ─── PUT /tax/gst/sales-invoices/:id ─────────────────────────────────────────
exports.updateSalesInvoiceById = asyncHandler(async (req, res, next) => {
  const record = await findSalesInvoiceById(req.params.id, req.user.corporateId)
  if (!record) return next(new ErrorResponse('Invoice not found', 404))

  const update = { ...req.body }
  if (update.igst !== undefined || update.cgst !== undefined || update.sgst !== undefined) {
    update.totalTax = (
      parseFloat(update.igst ?? record.igst ?? 0) +
      parseFloat(update.cgst ?? record.cgst ?? 0) +
      parseFloat(update.sgst ?? record.sgst ?? 0)
    ).toFixed(2)
  }
  const invoiceNo   = update.invoiceNo   ?? record.invoiceNo
  const invoiceDate = update.invoiceDate ?? record.invoiceDate
  update.status = (!invoiceNo || !invoiceDate) ? 'missing_fields' : 'uploaded'

  await updateSalesInvoice(req.params.id, req.user.corporateId, update)
  return res.status(200).json({ status: true, message: 'Invoice updated', data: {}, responseCode: '000' })
})

// ─── DELETE /tax/gst/sales-invoices/:id ──────────────────────────────────────
exports.deleteSalesInvoiceById = asyncHandler(async (req, res, next) => {
  const deleted = await deleteSalesInvoice(req.params.id, req.user.corporateId)
  if (!deleted) return next(new ErrorResponse('Invoice not found', 404))
  return res.status(200).json({ status: true, message: 'Invoice deleted', data: {}, responseCode: '000' })
})

// ─── POST /tax/gst/ims/reconcile ─────────────────────────────────────────────
// Submit GSTR-2A reconciliation job to Sandbox; returns upload URLs for FE
exports.submitImsReconciliation = asyncHandler(async (req, res, next) => {
  const { gstin, financialYear, month, reconciliationCriteria = 'strict' } = req.body
  const corporateUserId = req.user.corporateId

  const record = await createReconciliation({
    corporateUserId, gstin, financialYear,
    month: parseInt(month), reconciliationCriteria, status: 'pending',
  })
  if (!record) return next(new ErrorResponse('Failed to create reconciliation record', 500))

  // derive calendar year from FY (e.g. "2024-25": months 4-12 → 2024, 1-3 → 2025)
  const [startYear] = financialYear.split('-').map(Number)
  const calendarYear = parseInt(month) >= 4 ? startYear : startYear + 1

  customLog(req?.LogTraceId, 'info', { message: 'submitImsReconciliation: submit request', gstin, calendarYear, month, reconciliationCriteria }, 'VENDOR')
  const sandboxData = await sandboxApi.submitReconcileJob(
    gstin, calendarYear, parseInt(month), reconciliationCriteria
  )
  customLog(req?.LogTraceId, 'info', { message: 'submitImsReconciliation: submit response', gstin, response: sandboxData?.data }, 'VENDOR')

  await updateReconciliation(record.id, corporateUserId, {
    sandboxJobId:           sandboxData?.data?.job_id,
    status:                 sandboxData?.data?.status || 'created',
    gstr2aUploadUrl:        sandboxData?.data?.gstr_2a_url,
    purchaseLedgerUploadUrl:sandboxData?.data?.purchase_ledger_url,
  })

  return res.status(202).json({
    status: true,
    message: 'Reconciliation job submitted. Upload GSTR-2A and purchase ledger to the provided URLs.',
    data: {
      reconciliationId:       record.id,
      sandboxJobId:           sandboxData?.data?.job_id,
      gstr2aUploadUrl:        sandboxData?.data?.gstr_2a_url,
      purchaseLedgerUploadUrl:sandboxData?.data?.purchase_ledger_url,
      status:                 sandboxData?.data?.status,
    },
    responseCode: '000',
  })
})

// ─── GET /tax/gst/ims/:reconciliationId ──────────────────────────────────────
// Poll Sandbox job; once succeeded, seed invoices into DB and return IMS data
exports.getImsData = asyncHandler(async (req, res, next) => {
  const corporateUserId = req.user.corporateId
  const record = await findReconciliationById(req.params.reconciliationId, corporateUserId)
  if (!record) return next(new ErrorResponse('Reconciliation not found', 404))

  const inFlight = ['pending', 'created', 'queued', 'in_progress'].includes(record.status)
  if (record.sandboxJobId && inFlight) {
    customLog(req?.LogTraceId, 'info', { message: 'getImsData: poll reconcile job request', jobId: record.sandboxJobId }, 'VENDOR')
    const sandboxData = await sandboxApi.pollReconcileJob(record.sandboxJobId)
    customLog(req?.LogTraceId, 'info', { message: 'getImsData: poll reconcile job response', jobId: record.sandboxJobId, response: sandboxData?.data }, 'VENDOR')
    const latest = sandboxData?.data || {}
    const newStatus = latest.status || record.status

    const updatePayload = {
      status:                  newStatus,
      reconciliationReportUrl: latest.reconciliation_report_url || null,
      validationReportUrl:     latest.validation_report_url     || null,
      resultData:              latest,
    }
    await updateReconciliation(record.id, corporateUserId, updatePayload)
    Object.assign(record, updatePayload)
  }

  const invoices   = await findImsInvoices(corporateUserId, record.id)
  const itcEstimate = await getItcEstimate(record.id, corporateUserId)

  // group invoices by supplier for the UI
  const bySupplier = {}
  invoices.forEach(inv => {
    const key = inv.supplierGstin || inv.supplierName || 'Unknown'
    if (!bySupplier[key]) {
      bySupplier[key] = { supplierGstin: inv.supplierGstin, supplierName: inv.supplierName, invoices: [] }
    }
    bySupplier[key].invoices.push(inv)
  })

  return res.status(200).json({
    status: true,
    message: 'IMS data retrieved',
    data: {
      reconciliation: {
        id:                      record.id,
        status:                  record.status,
        sandboxJobId:            record.sandboxJobId,
        reconciliationReportUrl: record.reconciliationReportUrl,
        validationReportUrl:     record.validationReportUrl,
      },
      suppliers:    Object.values(bySupplier),
      itcEstimate,
      totalInvoices:    invoices.length,
      pendingCount:     itcEstimate.pendingCount,
    },
    responseCode: '000',
  })
})

// ─── PUT /tax/gst/ims/invoice/:id ─────────────────────────────────────────────
// Accept / reject / reset a single IMS invoice
exports.updateImsInvoice = asyncHandler(async (req, res, next) => {
  const { imsAction } = req.body
  const invoice = await findImsInvoiceById(req.params.id, req.user.corporateId)
  if (!invoice) return next(new ErrorResponse('Invoice not found', 404))

  await updateImsInvoiceAction(req.params.id, req.user.corporateId, imsAction)
  return res.status(200).json({ status: true, message: 'Invoice action updated', data: {}, responseCode: '000' })
})

// ─── POST /tax/gst/ims/:reconciliationId/proceed ─────────────────────────────
// Auto-accept all pending, then return updated ITC estimate
exports.proceedIms = asyncHandler(async (req, res, next) => {
  const corporateUserId = req.user.corporateId
  const record = await findReconciliationById(req.params.reconciliationId, corporateUserId)
  if (!record) return next(new ErrorResponse('Reconciliation not found', 404))

  await autoAcceptPending(record.id, corporateUserId)
  const itcEstimate = await getItcEstimate(record.id, corporateUserId)

  return res.status(200).json({
    status: true,
    message: 'Pending invoices auto-accepted. Ready to proceed to GSTR-3B.',
    data: { itcEstimate },
    responseCode: '000',
  })
})

// ─── GET /tax/gst/ims/:reconciliationId/itc ──────────────────────────────────
exports.getItcEstimateHandler = asyncHandler(async (req, res, next) => {
  const record = await findReconciliationById(req.params.reconciliationId, req.user.corporateId)
  if (!record) return next(new ErrorResponse('Reconciliation not found', 404))

  const itcEstimate = await getItcEstimate(record.id, req.user.corporateId)
  return res.status(200).json({ status: true, message: 'ITC estimate retrieved', data: itcEstimate, responseCode: '000' })
})

// ─── POST /tax/gst/gstin/search ───────────────────────────────────────────────
exports.searchGstin = asyncHandler(async (req, res) => {
  customLog(req?.LogTraceId, 'info', { message: 'searchGstin: request', gstin: req.body.gstin }, 'VENDOR')
  const sandboxData = await sandboxApi.searchGstin(req.body.gstin)
  customLog(req?.LogTraceId, 'info', { message: 'searchGstin: response', gstin: req.body.gstin, response: sandboxData?.data }, 'VENDOR')
  if (sandboxData?.data?.status_cd === '0') {
    return res.status(200).json({
      status: false,
      message: sandboxData.data?.error?.message || 'No records found',
      data: {},
      responseCode: '001',
    })
  }
  return res.status(200).json({
    status: true,
    message: 'GSTIN details fetched',
    data: sandboxData?.data?.data || {},
    responseCode: '000',
  })
})

// ─── POST /tax/gst/pan/search ─────────────────────────────────────────────────
exports.searchByPan = asyncHandler(async (req, res) => {
  const { pan } = req.body
  if (!pan) return res.status(200).json({ status: false, message: 'PAN is required', data: {}, responseCode: '001' })

  customLog(req?.LogTraceId, 'info', { message: 'searchByPan: request', pan }, 'VENDOR')
  const sandboxData = await sandboxApi.searchByPan(pan)
  customLog(req?.LogTraceId, 'info', { message: 'searchByPan: response', pan, response: sandboxData?.data }, 'VENDOR')
  if (sandboxData?.data?.error_code || sandboxData?.data?.status_cd === '0') {
    return res.status(200).json({ status: false, message: sandboxData?.data?.message || 'No GST registrations found for this PAN', data: {}, responseCode: '001' })
  }

  const rawList = Array.isArray(sandboxData?.data) ? sandboxData.data : []
  const businesses = rawList.map(item => {
    const d    = item.data || item
    const addr = d.pradr?.addr || {}
    return {
      gstin:            d.gstin    || '',
      legalName:        d.lgnm     || null,
      tradeName:        d.tradeNam || null,
      status:           d.sts      || 'Unknown',
      taxpayerType:     d.ctb      || null,
      registrationDate: d.rgdt     || null,
      state:            d.stj      || null,
      primaryAddress:   [addr.bnm, addr.bno, addr.flno, addr.st].filter(Boolean).join(', '),
      primaryCity:      addr.loc   || '',
      primaryPincode:   addr.pncd  || '',
    }
  })

  return res.status(200).json({
    status: true,
    message: `${businesses.length} GST registration(s) found`,
    data: { pan, businesses },
    responseCode: '000',
  })
})

// ─── POST /tax/kyc/verify-pan ─────────────────────────────────────────────────
exports.verifyPanKyc = asyncHandler(async (req, res) => {
  const { pan, fullName, dob, stateCode } = req.body
  // Convert YYYY-MM-DD → DD/MM/YYYY for Sandbox KYC endpoint
  const sandboxDob = /^\d{4}-\d{2}-\d{2}$/.test(dob)
    ? dob.split('-').reverse().join('/')
    : dob

  let kycData
  try {
    customLog(req?.LogTraceId, 'info', { message: 'verifyPanKyc: verifyPan request', pan, fullName }, 'VENDOR')
    kycData = await sandboxApi.verifyPan(pan, fullName, sandboxDob)
    customLog(req?.LogTraceId, 'info', { message: 'verifyPanKyc: verifyPan response', pan, response: kycData?.data }, 'VENDOR')
  } catch (err) {
    customLog(req?.LogTraceId, 'error', { message: 'verifyPanKyc: verifyPan failed', pan, error: err.message, response: err?.response?.data }, 'VENDOR')
    const errMsg = 'No records found for the entered PAN. Please verify the PAN details and try again'
    return res.status(200).json({ status: false, message: errMsg, data: { pan, fullName: fullName || null, dob: dob || null, businesses: [] }, responseCode: '001' })
  }

  if (!kycData || kycData?.data?.status !== 'valid') {
    return res.status(200).json({
      status: false,
      message: kycData?.data?.message || 'PAN verification failed. Ensure the PAN is active and the details are correct.',
      data: { pan, fullName: fullName || null, dob: dob || null, businesses: [] },
      responseCode: '001',
    })
  }

  // Step 2: fetch GST registrations under this PAN
  const gstPan = process.env.NODE_ENV !== 'production' ? 'AAACJ2440E' : pan
  const gstStateCode = process.env.NODE_ENV !== 'production' ? '24' : stateCode
  customLog(req?.LogTraceId, 'info', { message: 'verifyPanKyc: searchByPan request', gstPan, gstStateCode }, 'VENDOR')
  const sandboxData = await sandboxApi.searchByPan(gstPan, gstStateCode)
  customLog(req?.LogTraceId, 'info', { message: 'verifyPanKyc: searchByPan response', gstPan, response: sandboxData?.data }, 'VENDOR')
  if (sandboxData?.data?.error_code || sandboxData?.data?.status_cd === '0') {
    return res.status(200).json({
      status: true,
      message: 'PAN verified. No GST registrations found under this PAN.',
      data: { pan, fullName: fullName || null, dob: dob || null, businesses: [] },
      responseCode: '000',
    })
  }

  // Response shape: { data: [ { data: { gstin, lgnm, ... } }, ... ] }
  const rawList = Array.isArray(sandboxData?.data) ? sandboxData.data : []
  const businesses = rawList.map(item => {
    const d = item.data || item
    return {
      gstin:            d.gstin   || d.GSTIN   || '',
      legalName:        d.lgnm    || d.legalName    || null,
      tradeName:        d.tradeNam || d.tradeName   || null,
      status:           d.sts     || d.status       || 'Unknown',
      taxpayerType:     d.ctb     || d.taxpayerType || null,
      registrationDate: d.rgdt    || d.registrationDate || null,
      state:            d.stj     || d.state        || null,
    }
  })

  return res.status(200).json({
    status: true,
    message: `${businesses.length} business registration(s) found`,
    data: {
      pan,
      fullName: fullName || null,
      dob:      dob      || null,
      businesses,
    },
    responseCode: '000',
  })
})

const GSTIN_STATE_MAP = {
  '01':'Jammu & Kashmir','02':'Himachal Pradesh','03':'Punjab','04':'Chandigarh',
  '05':'Uttarakhand','06':'Haryana','07':'Delhi','08':'Rajasthan','09':'Uttar Pradesh',
  '10':'Bihar','11':'Sikkim','12':'Arunachal Pradesh','13':'Nagaland','14':'Manipur',
  '15':'Mizoram','16':'Tripura','17':'Meghalaya','18':'Assam','19':'West Bengal',
  '20':'Jharkhand','21':'Odisha','22':'Chhattisgarh','23':'Madhya Pradesh','24':'Gujarat',
  '26':'Daman & Diu','27':'Maharashtra','29':'Karnataka','30':'Goa','32':'Kerala',
  '33':'Tamil Nadu','34':'Puducherry','36':'Telangana','37':'Andhra Pradesh',
}
const posFromGstin = (gstin) => gstin ? (GSTIN_STATE_MAP[String(gstin).substring(0, 2)] || null) : null

// ─── POST /tax/gst/sales-invoices/sync-from-peko ─────────────────────────────
// Pull INVOICE-type records from invoicings table for the selected month/FY
// and bulk-insert into tax_sales_invoices (skips already-synced invoiceNos)
exports.syncInvoicesFromPeko = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.body
  const corporateUserId = req.user.corporateId
  const monthNum = parseInt(month)

  // Derive calendar year from FY + month
  const startYear = parseInt(financialYear.split('-')[0])
  const calendarYear = monthNum >= 4 ? startYear : startYear + 1
  const dateFrom = new Date(calendarYear, monthNum - 1, 1)
  const dateTo   = new Date(calendarYear, monthNum, 0) // last day of month

  const pekoInvoices = await invoicingV2.findAll({
    where: {
      corporateUserId,
      documentType: 'INVOICE',
      status: { [Op.ne]: 'CANCELLED' },   // cancelled invoices are excluded from GST filing
      invoiceDate: { [Op.between]: [dateFrom, dateTo] },
    },
    raw: true,
  })

  // Always build the set of current Peko invoice numbers (may be empty if all deleted)
  const pekoInvoiceNos = new Set()
  const toInsert = []
  const toUpdate = []

  // Fetch existing DB invoice numbers outside the if block so orphan detection always has access
  const existingNos = await findExistingInvoiceNos(corporateUserId, gstin, financialYear, monthNum)

  if (pekoInvoices.length) {

    for (const inv of pekoInvoices) {
      if (inv.invoiceType === 'INTERNATIONAL') continue

      const invoiceNo = inv.prefix ? `${inv.prefix}${inv.invoiceNumber}` : inv.invoiceNumber
      pekoInvoiceNos.add(invoiceNo)

      const invoiceType = inv.gstNumber ? 'B2B' : 'B2C'

      const totalTax = parseFloat(inv.tax || 0)
      let igst = 0, cgst = 0, sgst = 0
      if (inv.taxType === 'Intra-State') {
        cgst = parseFloat((totalTax / 2).toFixed(2))
        sgst = parseFloat((totalTax / 2).toFixed(2))
      } else {
        igst = totalTax
      }

      let hsnCode = null, uqc = 'OTH', qty = 0
      if (Array.isArray(inv.items) && inv.items.length > 0) {
        const itemWithHsn = inv.items.find(it => it.hsn)
        hsnCode = itemWithHsn?.hsn || null
        uqc     = itemWithHsn?.unit || 'OTH'
        qty     = inv.items.reduce((s, it) => s + parseFloat(it.quantity || 0), 0)
      }

      const invoiceData = {
        invoiceType,
        invoiceDate: inv.invoiceDate,
        hsnCode, uqc, qty,
        buyerGstin:    inv.gstNumber   || null,
        buyerName:     inv.name        || null,
        placeOfSupply: posFromGstin(inv.gstNumber),
        taxableAmount: parseFloat(inv.subtotal || 0),
        igst, cgst, sgst, totalTax,
        status: (!invoiceNo || !inv.invoiceDate) ? 'missing_fields' : 'uploaded',
        source: 'peko',
      }

      if (existingNos.get(invoiceType)?.has(invoiceNo)) {
        toUpdate.push({ invoiceNo, data: invoiceData })
      } else {
        toInsert.push({ corporateUserId, gstin, financialYear, month: monthNum, invoiceNo, ...invoiceData })
      }
    }

    if (toInsert.length) await bulkCreateSalesInvoices(toInsert)

    if (toUpdate.length) {
      await Promise.all(
        toUpdate.map(({ invoiceNo, data }) =>
          TaxSalesInvoice.update(data, { where: { corporateUserId, gstin, financialYear, month: monthNum, invoiceNo } })
        )
      )
    }
  }

  // Remove peko-sourced DB records for this month that are no longer in this month's Peko results
  // (covers both deleted invoices and invoices whose date moved to a different month)
  const allExistingNos = [...existingNos.values()].flatMap(s => [...s])
  const orphanNos = allExistingNos.filter(no => !pekoInvoiceNos.has(no))
  let deleted = 0

  if (orphanNos.length) {
    deleted = await TaxSalesInvoice.destroy({
      where: {
        corporateUserId, gstin, financialYear, month: monthNum,
        invoiceNo: { [Op.in]: orphanNos },
        source: 'peko',
      },
    })
  }

  const synced  = toInsert.length
  const updated = toUpdate.length
  const parts   = []
  if (synced)  parts.push(`${synced} new invoice(s) synced`)
  if (updated) parts.push(`${updated} existing invoice(s) updated`)
  if (deleted) parts.push(`${deleted} deleted invoice(s) removed`)
  if (!parts.length) parts.push('No changes — invoices are up to date')

  return res.status(200).json({
    status: true,
    message: parts.join(', '),
    data: { synced, updated, deleted },
    responseCode: '000',
  })
})

// ─── GET /tax/gst/gstr1/months ────────────────────────────────────────────────
// Returns 12-month FY grid with 'filed' / 'not_started' status from Sandbox
exports.getGstr1Months = asyncHandler(async (req, res) => {
  const { gstin, financialYear } = req.query
  const corporateUserId = req.user.corporateId
  const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]
  const filedMonths = new Set()

  // All three sources run in parallel; a failure in any one is silently skipped
  // so partial data is always returned (allSettled never rejects)
  customLog(req?.LogTraceId, 'info', { message: 'getGstr1Months: trackGstReturns request', gstin, financialYear }, 'VENDOR')
  const [sandboxResult, portalResult, localResult] = await Promise.allSettled([
    sandboxApi.trackGstReturns(gstin, `FY ${financialYear}`, 'gstr-1'),
    TaxGstr1Filing.findAll({ where: { corporateUserId, gstin, financialYear, status: 'filed' }, attributes: ['month'], raw: true }),
    TaxSalesInvoice.findAll({ where: { corporateUserId, gstin, financialYear, status: 'filed' }, attributes: ['month'], raw: true }),
  ])

  if (sandboxResult.status === 'fulfilled') {
    customLog(req?.LogTraceId, 'info', { message: 'getGstr1Months: trackGstReturns response', gstin, response: sandboxResult.value?.data }, 'VENDOR')
    const eFiledList = sandboxResult.value?.data?.data?.EFiledlist
    const returns = Array.isArray(eFiledList) ? eFiledList : []
    returns.forEach(r => {
      if (r.dof) {
        const mm = parseInt((r.ret_prd || '').substring(0, 2), 10)
        if (mm >= 1 && mm <= 12) filedMonths.add(mm)
      }
    })
  } else {
    customLog(req?.LogTraceId, 'error', { message: 'getGstr1Months: trackGstReturns failed', gstin, error: sandboxResult.reason?.message }, 'VENDOR')
  }

  if (portalResult.status === 'fulfilled') {
    portalResult.value.forEach(r => filedMonths.add(r.month))
  }

  if (localResult.status === 'fulfilled') {
    localResult.value.forEach(r => filedMonths.add(r.month))
  }

  const months = MONTHS.map(m => ({ month: m, status: filedMonths.has(m) ? 'filed' : 'not_started' }))
  return res.status(200).json({ status: true, message: 'GSTR-1 months retrieved', data: months, responseCode: '000' })
})

// ─── GET /tax/gst/gstr1/summary ───────────────────────────────────────────────
exports.getGstr1Summary = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.query
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month)
  const [invoices, amendmentRows, docRows, hsnManualRows] = await Promise.all([
    TaxSalesInvoice.findAll({ where: { corporateUserId, gstin, financialYear, month: monthInt }, raw: true }),
    TaxAmendment.findAll({ where: { corporateUserId, gstin, financialYear, month: monthInt }, raw: true }),
    TaxGstr1Document.findAll({ where: { corporateUserId, gstin, financialYear, month: monthInt }, raw: true }),
    TaxGstr1HsnManual.findAll({ where: { corporateUserId, gstin, financialYear, month: monthInt }, raw: true }),
  ])
  const sumSection = rows => ({
    count: rows.length,
    taxableAmount: rows.reduce((s, i) => s + parseFloat(i.taxableAmount || 0), 0),
    igst:          rows.reduce((s, i) => s + parseFloat(i.igst          || 0), 0),
    cgst:          rows.reduce((s, i) => s + parseFloat(i.cgst          || 0), 0),
    sgst:          rows.reduce((s, i) => s + parseFloat(i.sgst          || 0), 0),
    totalTax:      rows.reduce((s, i) => s + parseFloat(i.totalTax      || 0), 0),
    invoices: rows,
  })
  // Build HSN rows: aggregate invoices by hsnCode, then merge with manual entries
  const buildHsnRows = (invRows, manualRows) => {
    const map = new Map()
    for (const inv of invRows) {
      if (!inv.hsnCode) continue
      const key = inv.hsnCode
      if (!map.has(key)) {
        map.set(key, { hsnCode: inv.hsnCode, description: null, uqc: inv.uqc || 'OTH', qty: 0, taxableAmount: 0, rate: 0, igst: 0, cgst: 0, sgst: 0, totalTax: 0, source: 'invoice' })
      }
      const row = map.get(key)
      row.qty          += parseFloat(inv.qty          || 0)
      row.taxableAmount+= parseFloat(inv.taxableAmount|| 0)
      row.igst         += parseFloat(inv.igst         || 0)
      row.cgst         += parseFloat(inv.cgst         || 0)
      row.sgst         += parseFloat(inv.sgst         || 0)
      row.totalTax     += parseFloat(inv.totalTax     || 0)
    }
    const invoiceHsn = [...map.values()]
    const manualHsn  = manualRows.map(r => ({ ...r, source: 'manual' }))
    // Manual entries override invoice-aggregated entries for the same hsnCode
    const manualCodes = new Set(manualHsn.map(r => r.hsnCode))
    return [...invoiceHsn.filter(r => !manualCodes.has(r.hsnCode)), ...manualHsn]
  }

  // Amendments grouped by type — each section uses same shape as sumSection
  const amendments = {
    b2ba:   sumSection(amendmentRows.filter(a => a.amendType === 'B2BA')),
    b2cla:  sumSection(amendmentRows.filter(a => a.amendType === 'B2CLA')),
    b2csa:  sumSection(amendmentRows.filter(a => a.amendType === 'B2CSA')),
    cdnra:  sumSection(amendmentRows.filter(a => a.amendType === 'CDNRA')),
    cdnura: sumSection(amendmentRows.filter(a => a.amendType === 'CDNURA')),
    expa:   sumSection(amendmentRows.filter(a => a.amendType === 'EXPA')),
  }

  return res.status(200).json({
    status: true, message: 'GSTR-1 summary retrieved',
    data: {
      b2b:        sumSection(invoices.filter(i => i.invoiceType === 'B2B')),
      b2c:        sumSection(invoices.filter(i => i.invoiceType === 'B2C')),
      b2cSmall:   sumSection(invoices.filter(i => i.invoiceType === 'B2C_SMALL')),
      export:     sumSection(invoices.filter(i => i.invoiceType === 'EXPORT')),
      cdn:        sumSection(invoices.filter(i => i.invoiceType === 'CDNR' || i.invoiceType === 'CDNUR' || i.invoiceType === 'CDN')),
      cdnr:       sumSection(invoices.filter(i => i.invoiceType === 'CDNR')),
      cdnur:      sumSection(invoices.filter(i => i.invoiceType === 'CDNUR')),
      nil:        sumSection(invoices.filter(i => i.invoiceType === 'NIL')),
      advance:    sumSection(invoices.filter(i => i.invoiceType === 'ADVANCE')),
      total:      sumSection(invoices),
      hsn:        buildHsnRows(invoices, hsnManualRows),
      documents:  docRows,
      amendments,
    },
    responseCode: '000',
  })
})

// ─── POST /tax/gst/gstr1/mark-filed ──────────────────────────────────────────
// Marks all 'uploaded' invoices for the given month as 'filed'
exports.markGstr1Filed = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.body
  const corporateUserId = req.user.corporateId
  const [count] = await TaxSalesInvoice.update(
    { status: 'filed' },
    { where: { corporateUserId, gstin, financialYear, month: parseInt(month), status: 'uploaded' } }
  )
  return res.status(200).json({ status: true, message: `${count} invoice(s) marked as filed`, data: { count }, responseCode: '000' })
})

// ─── Amendments ──────────────────────────────────────────────────────────────

// GET /tax/gst/amendments?gstin=&financialYear=&month=
exports.getAmendments = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.query
  const corporateUserId = req.user.corporateId
  const rows = await TaxAmendment.findAll({
    where: { corporateUserId, gstin, financialYear, month: parseInt(month) },
    raw: true,
  })
  return res.status(200).json({ status: true, message: 'Amendments retrieved', data: rows, responseCode: '000' })
})

// POST /tax/gst/amendments
exports.addAmendments = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month, amendments } = req.body
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month)

  // Fetch existing (amendType + origInvNo) pairs to prevent duplicates
  const existing = await TaxAmendment.findAll({
    where: { corporateUserId, gstin, financialYear, month: monthInt },
    attributes: ['amendType', 'origInvNo'],
    raw: true,
  })
  const existingSet = new Set(existing.map(r => `${r.amendType}::${r.origInvNo}`))

  const rows = amendments
    .filter(a => !existingSet.has(`${a.amendType}::${a.origInvNo}`))
    .map(a => ({
      corporateUserId,
      gstin,
      financialYear,
      month: monthInt,
      amendType:        a.amendType,
      origInvNo:        a.origInvNo,
      origPeriod:       a.origPeriod,
      receiverGstin:    a.receiverGstin    || null,
      receiverName:     a.receiverName     || null,
      placeOfSupply:    a.placeOfSupply    || null,
      noteType:         a.noteType         || null,
      portCode:         a.portCode         || null,
      shippingBillNo:   a.shippingBillNo   || null,
      shippingBillDate: a.shippingBillDate || null,
      revisedInvNo:     a.revisedInvNo     || null,
      revisedDate:      a.revisedDate      || null,
      taxableAmount:    a.taxableAmount    || 0,
      igst:             a.igst             || 0,
      cgst:             a.cgst             || 0,
      sgst:             a.sgst             || 0,
      totalTax:         (parseFloat(a.igst || 0) + parseFloat(a.cgst || 0) + parseFloat(a.sgst || 0)).toFixed(2),
    }))

  const skipped = amendments.length - rows.length
  if (!rows.length) {
    return res.status(200).json({ status: false, message: `All amendment${amendments.length !== 1 ? 's' : ''} already exist.`, data: { count: 0, skipped }, responseCode: '001' })
  }

  const created = await TaxAmendment.bulkCreate(rows)
  return res.status(201).json({ status: true, message: `${created.length} amendment(s) added${skipped > 0 ? `, ${skipped} duplicate(s) skipped` : ''}`, data: { count: created.length, skipped }, responseCode: '000' })
})

// DELETE /tax/gst/amendments/:id
exports.deleteAmendment = asyncHandler(async (req, res) => {
  const corporateUserId = req.user.corporateId
  const destroyed = await TaxAmendment.destroy({ where: { id: req.params.id, corporateUserId } })
  if (!destroyed) return res.status(404).json({ status: false, message: 'Amendment not found', responseCode: '404' })
  return res.status(200).json({ status: true, message: 'Amendment deleted', data: {}, responseCode: '000' })
})

// ─── GST Portal Session (OTP-based, 6-hr session) ────────────────────────────

const PORTAL_SESSION_TTL = 6 * 3600 - 60   // 6 hrs minus 1 min safety buffer
const portalSessionKey = (userId, gstin) => `gst_portal_session_${userId}_${gstin}`

// Sandbox test GSTIN 29AAACQ3770E000 only has valid pre-configured data for Dec 2023.
// In non-production, all portal API calls use this fixed period so save/summary/file always align.
const IS_PROD            = process.env.NODE_ENV === 'production'
const SANDBOX_TEST_YEAR  = 2024
const SANDBOX_TEST_MONTH = 10
const SANDBOX_TEST_FP    = '102024'  // MMYYYY — ret_period format

// GSTR-9 sandbox test FY: matches the SANDBOX_TEST_YEAR above (Dec 2023 → FY 2023-24)
const SANDBOX_TEST_FY_GSTR9 = '2023-24'

// POST /tax/gst/portal/otp  — send OTP to mobile registered with GSTIN
exports.generateGstPortalOtp = asyncHandler(async (req, res) => {
  const { gstin, username } = req.body

  if (process.env.NODE_ENV !== 'production') {
    return res.status(200).json({
      status: true,
      message: 'OTP sent to the mobile number registered with this GSTIN',
      data: { maskedPhone: 'XXXXXX1234' },
      responseCode: '000',
    })
  }

  customLog(req?.LogTraceId, 'info', { message: 'generateGstPortalOtp: request', gstin, username }, 'VENDOR')
  const data = await sandboxApi.generateGstPortalOtp(gstin, username)
  customLog(req?.LogTraceId, 'info', { message: 'generateGstPortalOtp: response', gstin, response: data?.data }, 'VENDOR')
  const maskedPhone = data?.data?.mobileNumber || data?.data?.mobile || null
  return res.status(200).json({
    status: true,
    message: 'OTP sent to the mobile number registered with this GSTIN',
    data: { maskedPhone },
    responseCode: '000',
  })
})

// POST /tax/gst/portal/authenticate  — verify OTP, store auth_token in Redis (6 hrs)
// POST /tax/gst/portal/authenticate  — verify OTP, store auth_token in Redis (6 hrs)
exports.authenticateGstPortal = asyncHandler(async (req, res) => {
  const { gstin, otp, username } = req.body
  const corporateUserId = req.user.corporateId
 
  customLog(req?.LogTraceId, 'info', { message: 'authenticateGstPortal: request', gstin, username }, 'VENDOR')
  const data = await sandboxApi.authenticateGstPortal(gstin, otp, username)
  customLog(req?.LogTraceId, 'info', { message: 'authenticateGstPortal: response', gstin, response: data?.data }, 'VENDOR')
  const authToken = data?.data?.access_token

  if (!authToken) {
    customLog(req?.LogTraceId, 'error', { message: 'authenticateGstPortal: OTP verification failed', gstin, response: data?.data }, 'VENDOR')
    return res.status(200).json({
      status: false,
      message: data?.data?.message || 'OTP verification failed. Please check the OTP and try again.',
      data: {},
      responseCode: '001',
    })
  }
 
  const sessionKey    = portalSessionKey(corporateUserId, gstin)
  const sessionExpiry = data?.data?.session_expiry   // ms timestamp from sandbox
  const ttl = sessionExpiry && sessionExpiry > Date.now()
    ? Math.floor((sessionExpiry - Date.now()) / 1000)
    : PORTAL_SESSION_TTL
  await setValue(sessionKey, ttl, authToken)
 
  const expiresAt = sessionExpiry && sessionExpiry > Date.now() ? sessionExpiry : Date.now() + ttl * 1000
  return res.status(200).json({
    status: true,
    message: 'GST portal connected successfully. Session valid for 6 hours.',
    data: { expiresAt },
    responseCode: '000',
  })
})

// GET /tax/gst/portal/session  — check if a valid session exists for this GSTIN
exports.getPortalSession = asyncHandler(async (req, res) => {
  const { gstin } = req.query
  const corporateUserId = req.user.corporateId
  const sessionKey = portalSessionKey(corporateUserId, gstin)
  const token = await getValue(sessionKey)
  return res.status(200).json({
    status: true,
    data: { connected: !!token },
    responseCode: '000',
  })
})

// ─── POST /tax/gst/gstr1/hsn ─────────────────────────────────────────────────
exports.addGstr1HsnManual = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month, hsnCode, description, uqc, qty, taxableAmount, rate, igst, cgst, sgst } = req.body
  const corporateUserId = req.user.corporateId
  const totalTax = parseFloat(igst || 0) + parseFloat(cgst || 0) + parseFloat(sgst || 0)
  const row = await TaxGstr1HsnManual.create({
    corporateUserId, gstin, financialYear, month: parseInt(month),
    hsnCode, description: description || null,
    uqc: uqc || 'OTH', qty: parseFloat(qty) || 0,
    taxableAmount: parseFloat(taxableAmount) || 0,
    rate: parseFloat(rate) || 0,
    igst: parseFloat(igst) || 0,
    cgst: parseFloat(cgst) || 0,
    sgst: parseFloat(sgst) || 0,
    totalTax,
  })
  return res.status(200).json({ status: true, message: 'HSN row added', data: row, responseCode: '000' })
})

// ─── DELETE /tax/gst/gstr1/hsn/:id ───────────────────────────────────────────
exports.deleteGstr1HsnManual = asyncHandler(async (req, res) => {
  const corporateUserId = req.user.corporateId
  const row = await TaxGstr1HsnManual.findOne({ where: { id: req.params.id, corporateUserId } })
  if (!row) return res.status(404).json({ status: false, message: 'HSN row not found', data: {}, responseCode: '404' })
  await row.destroy()
  return res.status(200).json({ status: true, message: 'HSN row deleted', data: {}, responseCode: '000' })
})

// ─── POST /tax/gst/gstr1/documents ───────────────────────────────────────────
exports.addGstr1Document = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month, documentType, serialFrom, serialTo, totalIssued, cancelled } = req.body
  const corporateUserId = req.user.corporateId
  const net = parseInt(totalIssued || 0) - parseInt(cancelled || 0)
  const row = await TaxGstr1Document.create({
    corporateUserId, gstin, financialYear, month: parseInt(month),
    documentType, serialFrom: serialFrom || null, serialTo: serialTo || null,
    totalIssued: parseInt(totalIssued) || 0,
    cancelled: parseInt(cancelled) || 0,
    netIssued: net,
  })
  return res.status(200).json({ status: true, message: 'Document added', data: row, responseCode: '000' })
})

// ─── DELETE /tax/gst/gstr1/documents/:id ─────────────────────────────────────
exports.deleteGstr1Document = asyncHandler(async (req, res) => {
  const corporateUserId = req.user.corporateId
  const count = await TaxGstr1Document.destroy({ where: { id: req.params.id, corporateUserId } })
  if (!count) return res.status(404).json({ status: false, message: 'Document not found', data: {}, responseCode: '404' })
  return res.status(200).json({ status: true, message: 'Document deleted', data: {}, responseCode: '000' })
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return ''
  const s = String(d).slice(0, 10) // YYYY-MM-DD
  const [y, m, day] = s.split('-')
  return `${day}-${m}-${y}` // DD-MM-YYYY for Sandbox
}

function pad2(n) { return String(n).padStart(2, '0') }

function calYear(financialYear, month) {
  const startYear = parseInt(financialYear.split('-')[0])
  return parseInt(month) >= 4 ? startYear : startYear + 1
}

function stateCode(gstin) {
  return (gstin || '').slice(0, 2) || '00'
}

function itm(inv) {
  const rt    = parseFloat(inv.totalTax || 0) > 0 && parseFloat(inv.taxableAmount || 0) > 0
    ? Math.round(parseFloat(inv.totalTax) / parseFloat(inv.taxableAmount) * 100)
    : 0
  const igst  = parseFloat(inv.igst  || 0)
  const cgst  = parseFloat(inv.cgst  || 0)
  const sgst  = parseFloat(inv.sgst  || 0)
  const txval = parseFloat(inv.taxableAmount || 0)
  const det = { rt, txval, csamt: 0 }
  if (igst > 0)  det.iamt = igst
  if (cgst > 0)  det.camt = cgst
  if (sgst > 0)  det.samt = sgst
  return [{ num: 1, itm_det: det }]
}

function buildGstr1Json({ invoices, amendmentRows, hsnRows, hsnManualRows, docRows, gstin, financialYear, month }) {
  const monthInt = parseInt(month)
  const fp = pad2(monthInt) + String(calYear(financialYear, monthInt))

  // ── B2B ──────────────────────────────────────────────────────────────────
  const b2bMap = {}
  invoices.filter(i => i.invoiceType === 'B2B').forEach(inv => {
    const ctin = inv.buyerGstin || ''
    if (!b2bMap[ctin]) b2bMap[ctin] = { ctin, inv: [] }
    const val = parseFloat(inv.taxableAmount || 0) + parseFloat(inv.totalTax || 0)
    b2bMap[ctin].inv.push({
      inum: inv.invoiceNo,
      idt:  fmtDate(inv.invoiceDate),
      val:  parseFloat(val.toFixed(2)),
      pos:  stateCode(inv.buyerGstin),
      rchrg: 'N',
      inv_typ: 'R',
      itms: itm(inv),
    })
  })
  const b2b = Object.values(b2bMap)

  // ── B2CL (inter-state B2C > 2.5L) ────────────────────────────────────────
  const b2clMap = {}
  invoices.filter(i => i.invoiceType === 'B2C').forEach(inv => {
    const pos = INDIAN_STATE_MAP[inv.buyerName] || '00'
    if (pos === stateCode(gstin)) return // intra-state → goes to b2cs
    if (!b2clMap[pos]) b2clMap[pos] = { pos, inv: [] }
    const val = parseFloat(inv.taxableAmount || 0) + parseFloat(inv.totalTax || 0)
    b2clMap[pos].inv.push({
      inum: inv.invoiceNo,
      idt:  fmtDate(inv.invoiceDate),
      val:  parseFloat(val.toFixed(2)),
      itms: itm(inv),
    })
  })
  const b2cl = Object.values(b2clMap)

  // ── B2CS (intra-state B2C, aggregated by rate+pos) ────────────────────────
  const b2csMap = {}
  invoices.filter(i => i.invoiceType === 'B2C_SMALL').forEach(inv => {
    const pos = INDIAN_STATE_MAP[inv.buyerName] || stateCode(gstin)
    const rt  = parseFloat(inv.totalTax || 0) > 0 && parseFloat(inv.taxableAmount || 0) > 0
      ? Math.round(parseFloat(inv.totalTax) / parseFloat(inv.taxableAmount) * 100) : 0
    const key = `${rt}|${pos}`
    if (!b2csMap[key]) b2csMap[key] = { sply_ty: 'INTRA', rt, pos, txval: 0, camt: 0, samt: 0, csamt: 0 }
    b2csMap[key].txval += parseFloat(inv.taxableAmount || 0)
    b2csMap[key].camt  += parseFloat(inv.cgst  || 0)
    b2csMap[key].samt  += parseFloat(inv.sgst  || 0)
  })
  const b2cs = Object.values(b2csMap).map(r => ({
    ...r,
    txval: parseFloat(r.txval.toFixed(2)),
    camt:  parseFloat(r.camt.toFixed(2)),
    samt:  parseFloat(r.samt.toFixed(2)),
  }))

  // ── EXP ──────────────────────────────────────────────────────────────────
  const expMap = {}
  invoices.filter(i => i.invoiceType === 'EXPORT').forEach(inv => {
    const expTyp = inv.buyerName || 'WOPAY' // buyerName reused for WPAY/WOPAY
    if (!expMap[expTyp]) expMap[expTyp] = { exp_typ: expTyp, inv: [] }
    const val = parseFloat(inv.taxableAmount || 0) + parseFloat(inv.totalTax || 0)
    expMap[expTyp].inv.push({
      inum:    inv.invoiceNo,
      idt:     fmtDate(inv.invoiceDate),
      val:     parseFloat(val.toFixed(2)),
      sbpcode: inv.portCode    || '',
      sbnum:   inv.shippingBillNo   || '',
      sbdt:    fmtDate(inv.shippingBillDate),
      itms:    itm(inv),
    })
  })
  const exp = Object.values(expMap)

  // ── NIL ───────────────────────────────────────────────────────────────────
  const nilInv = invoices.filter(i => i.invoiceType === 'NIL')
  const nilMap = { INTRB2B: { nil_amt: 0, expt_amt: 0, ngsup_amt: 0 }, INTRB2C: { nil_amt: 0, expt_amt: 0, ngsup_amt: 0 } }
  nilInv.forEach(inv => {
    const key = inv.buyerGstin ? 'INTRB2B' : 'INTRB2C'
    nilMap[key].nil_amt   += parseFloat(inv.taxableAmount || 0)
  })
  const nil = { inv: Object.entries(nilMap).map(([sply_ty, d]) => ({ sply_ty, ...d })) }

  // ── CDNR ──────────────────────────────────────────────────────────────────
  const cdnrMap = {}
  invoices.filter(i => i.invoiceType === 'CDNR').forEach(inv => {
    const ctin = inv.buyerGstin || ''
    if (!cdnrMap[ctin]) cdnrMap[ctin] = { ctin, nt: [] }
    const val = parseFloat(inv.taxableAmount || 0) + parseFloat(inv.totalTax || 0)
    cdnrMap[ctin].nt.push({
      ntty:   inv.buyerName || 'C', // buyerName reused for C/D
      nt_num: inv.invoiceNo,
      nt_dt:  fmtDate(inv.invoiceDate),
      pos:    stateCode(inv.buyerGstin),
      rchrg:  'N',
      val:    parseFloat(val.toFixed(2)),
      itms:   itm(inv),
    })
  })
  const cdnr = Object.values(cdnrMap)

  // ── CDNUR ─────────────────────────────────────────────────────────────────
  const cdnur = invoices.filter(i => i.invoiceType === 'CDNUR').map(inv => {
    const val = parseFloat(inv.taxableAmount || 0) + parseFloat(inv.totalTax || 0)
    return {
      typ:    inv.portCode  || 'B2CL', // portCode reused for supply type
      ntty:   inv.buyerName || 'C',
      nt_num: inv.invoiceNo,
      nt_dt:  fmtDate(inv.invoiceDate),
      pos:    '00',
      val:    parseFloat(val.toFixed(2)),
      itms:   itm(inv),
    }
  })

  // ── AT (Advances) ─────────────────────────────────────────────────────────
  const atMap = {}
  invoices.filter(i => i.invoiceType === 'ADVANCE').forEach(inv => {
    const pos    = INDIAN_STATE_MAP[inv.buyerName] || stateCode(gstin)
    const splyTy = 'INTRA'
    const rt     = parseFloat(inv.totalTax || 0) > 0 && parseFloat(inv.taxableAmount || 0) > 0
      ? Math.round(parseFloat(inv.totalTax) / parseFloat(inv.taxableAmount) * 100) : 0
    const key = `${rt}|${pos}`
    if (!atMap[key]) atMap[key] = { pos, sply_ty: splyTy, itms: [{ rt, ad_amt: 0, camt: 0, samt: 0, csamt: 0 }] }
    atMap[key].itms[0].ad_amt += parseFloat(inv.taxableAmount || 0)
    atMap[key].itms[0].camt   += parseFloat(inv.cgst || 0)
    atMap[key].itms[0].samt   += parseFloat(inv.sgst || 0)
  })
  const at = Object.values(atMap)

  // ── HSN ───────────────────────────────────────────────────────────────────
  const hsnAll = [...Object.values(
    [...hsnRows, ...hsnManualRows].reduce((m, r, idx) => {
      const key = `${r.hsnCode}|${r.uqc || 'OTH'}`
      if (!m[key]) m[key] = { num: idx + 1, hsn_sc: r.hsnCode, desc: r.description || '', uqc: r.uqc || 'OTH', qty: 0, txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0, rt: r.rate || 0 }
      m[key].qty   += parseFloat(r.qty || 0)
      m[key].txval += parseFloat(r.taxableAmount || 0)
      m[key].iamt  += parseFloat(r.igst || 0)
      m[key].camt  += parseFloat(r.cgst || 0)
      m[key].samt  += parseFloat(r.sgst || 0)
      return m
    }, {})
  )]
  const hsn = { data: hsnAll }

  // ── DOC_ISSUE ─────────────────────────────────────────────────────────────
  const DOC_TYPE_MAP = {
    'Invoices for outward supply': 1, 'Invoices for inward supply (import)': 2,
    'Revised Invoice': 3, 'Debit Note': 4, 'Credit Note': 5,
    'Receipt Voucher': 6, 'Payment Voucher': 7, 'Refund Voucher': 8, 'Delivery Challan': 9,
  }
  const doc_issue = {
    doc_det: docRows.map(d => ({
      doc_num: DOC_TYPE_MAP[d.documentType] || 1,
      docs: [{
        num:       1,
        from:      d.serialFrom  || '',
        to:        d.serialTo    || '',
        totnum:    parseInt(d.totalIssued) || 0,
        cancel:    parseInt(d.cancelled)  || 0,
        net_issue: parseInt(d.netIssued)  || 0,
      }],
    })),
  }

  // ── Amendments ────────────────────────────────────────────────────────────
  const buildAmend = (type) => amendmentRows.filter(a => a.amendType === type).map(a => ({
    oinum:  a.origInvNo,
    oidt:   a.origPeriod,
    ctin:   a.receiverGstin || '',
    inum:   a.revisedInvNo  || '',
    idt:    fmtDate(a.revisedDate),
    val:    parseFloat(a.taxableAmount || 0) + parseFloat(a.totalTax || 0),
    diff_percent: 1,
    itms: [{
      num: 1,
      itm_det: {
        rt:    parseFloat(a.totalTax || 0) > 0 ? Math.round(parseFloat(a.totalTax) / parseFloat(a.taxableAmount) * 100) : 0,
        txval: parseFloat(a.taxableAmount || 0),
        iamt:  parseFloat(a.igst || 0),
        camt:  parseFloat(a.cgst || 0),
        samt:  parseFloat(a.sgst || 0),
        csamt: 0,
      },
    }],
  }))

  // ── Totals ────────────────────────────────────────────────────────────────
  const gt = invoices.reduce((s, i) => s + parseFloat(i.taxableAmount || 0) + parseFloat(i.totalTax || 0), 0)

  return {
    fp, gstin,
    gt:     parseFloat(gt.toFixed(2)),
    cur_gt: parseFloat(gt.toFixed(2)),
    b2b,
    b2cl,
    b2cs,
    exp,
    nil,
    cdnr,
    cdnur,
    at,
    hsn,
    doc_issue,
    b2ba:   buildAmend('B2BA'),
    b2cla:  buildAmend('B2CLA'),
    b2csa:  buildAmend('B2CSA'),
    cdnra:  buildAmend('CDNRA'),
    cdnura: buildAmend('CDNURA'),
    expa:   buildAmend('EXPA'),
    txpd:  [], txpda: [], ata: [],
  }
}

// State name → 2-digit state code map (for B2CL/B2CS POS lookup)
const INDIAN_STATE_MAP = {
  'Jammu & Kashmir': '01', 'Himachal Pradesh': '02', 'Punjab': '03', 'Chandigarh': '04',
  'Uttarakhand': '05', 'Haryana': '06', 'Delhi': '07', 'Rajasthan': '08',
  'Uttar Pradesh': '09', 'Bihar': '10', 'Sikkim': '11', 'Arunachal Pradesh': '12',
  'Nagaland': '13', 'Manipur': '14', 'Mizoram': '15', 'Tripura': '16',
  'Meghalaya': '17', 'Assam': '18', 'West Bengal': '19', 'Jharkhand': '20',
  'Odisha': '21', 'Chhattisgarh': '22', 'Madhya Pradesh': '23', 'Gujarat': '24',
  'Daman & Diu': '26', 'Maharashtra': '27', 'Karnataka': '29', 'Goa': '30',
  'Kerala': '32', 'Tamil Nadu': '33', 'Puducherry': '34', 'Telangana': '36',
  'Andhra Pradesh': '37', 'Ladakh': '38',
}

// ─── POST /tax/gst/gstr1/portal-save ─────────────────────────────────────────
exports.saveGstr1ToPortal = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.body
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month)

  const sessionKey  = `gst_portal_session_${corporateUserId}_${gstin}`
  const portalToken = await getValue(sessionKey)
  if (!portalToken) {
    return res.status(401).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: {}, responseCode: '401' })
  }

  const [invoices, amendmentRows, docRows, hsnManualRows] = await Promise.all([
    TaxSalesInvoice.findAll({ where: { corporateUserId, gstin, financialYear, month: monthInt }, raw: true }),
    TaxAmendment.findAll({ where: { corporateUserId, gstin, financialYear, month: monthInt }, raw: true }),
    TaxGstr1Document.findAll({ where: { corporateUserId, gstin, financialYear, month: monthInt }, raw: true }),
    TaxGstr1HsnManual.findAll({ where: { corporateUserId, gstin, financialYear, month: monthInt }, raw: true }),
  ])

  const gstr1Json = buildGstr1Json({ invoices, amendmentRows, hsnRows: [], hsnManualRows, docRows, gstin, financialYear, month: monthInt })
  const year = calYear(financialYear, monthInt)

  // In non-prod: override fp + year/month to match sandbox test period (Dec 2023)
  const sbYear  = IS_PROD ? year : SANDBOX_TEST_YEAR
  const sbMonth = IS_PROD ? monthInt : SANDBOX_TEST_MONTH
  if (!IS_PROD) gstr1Json.fp = SANDBOX_TEST_FP

  customLog(req?.LogTraceId, 'info', { message: 'saveGstr1: request body', gstr1Json }, 'VENDOR')
  const sandboxResp = await sandboxApi.saveGstr1(gstin, sbYear, sbMonth, portalToken, gstr1Json)
  customLog(req?.LogTraceId, 'info', { message: 'saveGstr1: sandbox response', response: sandboxResp?.data }, 'VENDOR')

  if (sandboxResp?.data?.status_cd !== '1' && sandboxResp?.data?.status_cd !== 1) {
    customLog(req?.LogTraceId, 'error', { message: 'saveGstr1: save failed', gstin, response: sandboxResp?.data }, 'VENDOR')
    return res.status(200).json({ status: false, message: sandboxResp?.data?.message || 'GSTR-1 save failed', data: {}, responseCode: '001' })
  }

  const referenceId = sandboxResp?.data?.data?.reference_id || null
  const existingFiling = await TaxGstr1Filing.findOne({ where: { corporateUserId, gstin, financialYear, month: monthInt } })
  if (existingFiling) {
    await existingFiling.update({ referenceId, status: 'saved' })
  } else {
    await TaxGstr1Filing.create({ corporateUserId, gstin, financialYear, month: monthInt, referenceId, status: 'saved' })
  }

  return res.status(200).json({ status: true, message: 'GSTR-1 data saved to portal', data: { referenceId }, responseCode: '000' })
})

// ─── GET /tax/gst/gstr1/portal-summary ───────────────────────────────────────
exports.getGstr1PortalSummary = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.query
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month)

  const sessionKey  = `gst_portal_session_${corporateUserId}_${gstin}`
  const portalToken = await getValue(sessionKey)
  if (!portalToken) {
    return res.status(401).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: {}, responseCode: '401' })
  }

  const year    = calYear(financialYear, monthInt)
  const sbYear  = IS_PROD ? year : SANDBOX_TEST_YEAR
  const sbMonth = IS_PROD ? monthInt : SANDBOX_TEST_MONTH
  customLog(req?.LogTraceId, 'info', { message: 'getGstr1PortalSummary: request', gstin, sbYear, sbMonth }, 'VENDOR')
  const sandboxResp = await sandboxApi.getGstr1SummaryLong(gstin, sbYear, sbMonth, portalToken)
  customLog(req?.LogTraceId, 'info', { message: 'getGstr1PortalSummary: response', gstin, response: sandboxResp?.data }, 'VENDOR')

  if (sandboxResp?.data?.status_cd !== '1' && sandboxResp?.data?.status_cd !== 1) {
    customLog(req?.LogTraceId, 'error', { message: 'getGstr1PortalSummary: failed', gstin, response: sandboxResp?.data }, 'VENDOR')
    return res.status(200).json({ status: false, message: sandboxResp?.data?.message || 'Failed to fetch portal summary', data: {}, responseCode: '001' })
  }

  const inner = sandboxResp?.data?.data || {}

  const secSum     = inner.sec_sum     || []
  const chksum     = inner.chksum      || ''
  const retPeriod  = inner.ret_period  || ''
  const newSumFlag = inner.newSumFlag  ?? true

  const summaryFiling = await TaxGstr1Filing.findOne({ where: { corporateUserId, gstin, financialYear, month: monthInt } })
  if (summaryFiling) {
    await summaryFiling.update({ chksum, secSum, retPeriod, newSumFlag })
  } else {
    await TaxGstr1Filing.create({ corporateUserId, gstin, financialYear, month: monthInt, chksum, secSum, retPeriod, newSumFlag })
  }

  return res.status(200).json({ status: true, message: 'Portal summary retrieved', data: { secSum, chksum, retPeriod }, responseCode: '000' })
})

// ─── POST /tax/gst/gstr1/evc-otp — generate EVC OTP for filing ───────────────
exports.generateGstrEvcOtp = asyncHandler(async (req, res) => {
  const { gstin, pan, gstrType = 'gstr-1' } = req.body
  const corporateUserId = req.user.corporateId
  const sessionKey = portalSessionKey(corporateUserId, gstin)
  const portalToken = await getValue(sessionKey)
  if (!portalToken) {
    return res.status(401).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: {}, responseCode: '401' })
  }
  customLog(req?.LogTraceId, 'info', { message: 'generateGstrEvcOtp: request', gstin, pan, gstrType }, 'VENDOR')
  const evcResp = await sandboxApi.generateEvcOtp(pan, portalToken, gstrType)
  customLog(req?.LogTraceId, 'info', { message: 'generateGstrEvcOtp: response', gstin, response: evcResp?.data }, 'VENDOR')
  return res.status(200).json({ status: true, message: 'EVC OTP sent to the mobile number registered with the authorized signatory PAN', data: {}, responseCode: '000' })
})

// ─── POST /tax/gst/gstr1/file ─────────────────────────────────────────────────
exports.fileGstr1Return = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month, pan, otp } = req.body
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month)

  const sessionKey  = `gst_portal_session_${corporateUserId}_${gstin}`
  const portalToken = await getValue(sessionKey)
  if (!portalToken) {
    return res.status(401).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: {}, responseCode: '401' })
  }

  const filing = await TaxGstr1Filing.findOne({ where: { corporateUserId, gstin, financialYear, month: monthInt }, raw: true })
  if (!filing?.chksum) {
    return res.status(400).json({ status: false, message: 'Please fetch summary before filing.', data: {}, responseCode: '400' })
  }

  const year    = calYear(financialYear, monthInt)
  const sbYear  = IS_PROD ? year : SANDBOX_TEST_YEAR
  const sbMonth = IS_PROD ? monthInt : SANDBOX_TEST_MONTH

  const secSummary = {
    ret_period:  IS_PROD ? filing.retPeriod : SANDBOX_TEST_FP,
    newSumFlag:  !!filing.newSumFlag,   // ensure boolean, not integer 0/1 from MySQL
    gstin,
    chksum:      filing.chksum,
    sec_sum:     filing.secSum || [],
  }

  customLog(req?.LogTraceId, 'info', { message: 'fileGstr1: request', gstin, pan, otp, sbYear, sbMonth, secSummary }, 'VENDOR')
  const sandboxResp = await sandboxApi.fileGstr1(gstin, sbYear, sbMonth, pan, otp, portalToken, secSummary)
  customLog(req?.LogTraceId, 'info', { message: 'fileGstr1: sandbox response', gstin, response: sandboxResp?.data }, 'VENDOR')

  const statusCd = sandboxResp?.data?.status_cd
  const ackNum   = sandboxResp?.data?.data?.ack_num
  const isSuccess = ackNum || statusCd === '1' || statusCd === 1

  if (!isSuccess) {
    const errorCd = sandboxResp?.data?.error?.error_cd
    const errMsg  = sandboxResp?.data?.error?.message || sandboxResp?.data?.message || sandboxResp?.data?.error_description || 'GSTR-1 filing failed'
    customLog(req?.LogTraceId, 'error', { message: 'fileGstr1: filing failed', gstin, errorCd, errMsg, response: sandboxResp?.data }, 'VENDOR')

    // RT_FIL_02 = sandbox confirms GSTR-1 is already filed for this period — mark our DB as filed
    if (errorCd === 'RT_FIL_02') {
      const existingFiling = await TaxGstr1Filing.findOne({ where: { corporateUserId, gstin, financialYear, month: monthInt } })
      if (existingFiling && existingFiling.status !== 'filed') {
        await existingFiling.update({ status: 'filed', filedAt: new Date() })
      } else if (!existingFiling) {
        await TaxGstr1Filing.create({ corporateUserId, gstin, financialYear, month: monthInt, status: 'filed', filedAt: new Date() })
      }
    }

    return res.status(200).json({ status: false, message: errMsg, data: { raw: sandboxResp?.data }, responseCode: '001' })
  }

  const filedAt = new Date()

  await TaxGstr1Filing.update(
    { ackNum, status: 'filed', filedAt },
    { where: { corporateUserId, gstin, financialYear, month: monthInt } }
  )

  return res.status(200).json({ status: true, message: 'GSTR-1 filed successfully', data: { ackNum, filedAt: filedAt.toISOString() }, responseCode: '000' })
})

// ─── POST /tax/gst/gstr1/reset ────────────────────────────────────────────────
exports.resetGstr1Return = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.body
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month)

  const sessionKey  = `gst_portal_session_${corporateUserId}_${gstin}`
  const portalToken = await getValue(sessionKey)
  if (!portalToken) {
    return res.status(401).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: {}, responseCode: '401' })
  }

  const filing = await TaxGstr1Filing.findOne({ where: { corporateUserId, gstin, financialYear, month: monthInt } })
  if (!filing) {
    return res.status(400).json({ status: false, message: 'No filing record found for this period.', data: {}, responseCode: '400' })
  }

  const year    = calYear(financialYear, monthInt)
  const sbYear  = IS_PROD ? year : SANDBOX_TEST_YEAR
  const sbMonth = IS_PROD ? monthInt : SANDBOX_TEST_MONTH
  const retPeriod = IS_PROD ? filing.retPeriod : SANDBOX_TEST_FP

  customLog(req?.LogTraceId, 'info', { message: 'resetGstr1: request', gstin, sbYear, sbMonth, retPeriod }, 'VENDOR')
  const sandboxResp = await sandboxApi.resetGstr1(gstin, sbYear, sbMonth, retPeriod, portalToken)
  customLog(req?.LogTraceId, 'info', { message: 'resetGstr1: sandbox response', gstin, response: sandboxResp?.data }, 'VENDOR')

  const statusCd = sandboxResp?.data?.status_cd
  const isInProgress = sandboxResp?.data?.error?.error_cd === 'RET191251'

  if (isInProgress) {
    return res.status(200).json({ status: false, message: 'Reset is already in progress. Please try again later.', data: {}, responseCode: '001' })
  }

  if (statusCd !== '1' && statusCd !== 1) {
    const errMsg = sandboxResp?.data?.error?.message || 'GSTR-1 reset failed'
    customLog(req?.LogTraceId, 'error', { message: 'resetGstr1: reset failed', gstin, response: sandboxResp?.data }, 'VENDOR')
    return res.status(200).json({ status: false, message: errMsg, data: { raw: sandboxResp?.data }, responseCode: '001' })
  }

  const prevAckNum = filing.ackNum
  const refId = sandboxResp?.data?.data?.ref_id || sandboxResp?.data?.ref_id || null

  await filing.update({ status: 'saved', ackNum: null, filedAt: null, chksum: null, secSum: null, retPeriod: null })

  return res.status(200).json({ status: true, message: 'GSTR-1 reset successfully. You may re-file for this period.', data: { refId, prevAckNum }, responseCode: '000' })
})

// ─── GSTR-3B ──────────────────────────────────────────────────────────────────

// Build sandbox-ready form body from a filing record (excludes read-only tx_pmt)
function buildGstr3bBody(filing) {
  const d = filing.formData || {}
  return {
    ret_period:  filing.retPeriod,
    gstin:       filing.gstin,
    sup_details: d.sup_details  || {},
    eco_dtls:    d.eco_dtls    || undefined,
    itc_elg:     d.itc_elg     || {},
    inward_sup:  d.inward_sup  || {},
    inter_sup:   d.inter_sup   || {},
    intr_ltfee:  d.intr_ltfee  || {},
  }
}

// ─── GET /tax/gst/gstr3b/details?gstin=&financialYear=&month= ────────────────
exports.getGstr3bDetails = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.query
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month, 10)

  const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))

  if (!portalToken) {
    return res.status(401).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: {}, responseCode: '401' })
  }

  const year    = calYear(financialYear, monthInt)
  const sbYear  = IS_PROD ? year : SANDBOX_TEST_YEAR
  const sbMonth = IS_PROD ? monthInt : SANDBOX_TEST_MONTH
  customLog(req?.LogTraceId, 'info', { message: 'getGstr3bDetails: request', gstin, sbYear, sbMonth }, 'VENDOR')
  const [detailsResp, autoResp] = await Promise.allSettled([
    sandboxApi.getGstr3bDetails(gstin, sbYear, sbMonth, portalToken),
    sandboxApi.getGstr3bAutoLiability(gstin, sbYear, sbMonth, portalToken),
  ])
  customLog(req?.LogTraceId, 'info', { message: 'getGstr3bDetails: response', gstin, detailsResponse: detailsResp.value?.data, autoResponse: autoResp.value?.data }, 'VENDOR')

  if (detailsResp.status === 'rejected' || detailsResp.value?.data?.status_cd === '0' || detailsResp.value?.data?.status_cd === 0) {
    const errCd  = detailsResp.value?.data?.error?.error_cd  || 'FETCH_FAILED'
    const errMsg = detailsResp.value?.data?.error?.message   || detailsResp.reason?.message || 'Failed to fetch GSTR-3B details from portal'
    customLog(req?.LogTraceId, 'error', { message: 'getGstr3bDetails: failed', gstin, errCd, errMsg }, 'VENDOR')
    return res.status(200).json({ status: false, message: errMsg, data: { error_cd: errCd }, responseCode: '001' })
  }

  const inner        = detailsResp.value?.data?.data || {}
  const autoLiability = autoResp.status === 'fulfilled' && (autoResp.value?.data?.status_cd === '1' || autoResp.value?.data?.status_cd === 1)
    ? autoResp.value?.data?.data?.r3bautopop || null
    : null

  const existing = await TaxGstr3bFiling.findOne({ where: { corporateUserId, gstin, financialYear, month: monthInt } })
  if (existing) {
    await existing.update({ formData: inner, retPeriod: inner.ret_period || '', autoLiability })
  } else {
    await TaxGstr3bFiling.create({ corporateUserId, gstin, financialYear, month: monthInt, formData: inner, retPeriod: inner.ret_period || '', autoLiability, status: 'draft' })
  }

  return res.status(200).json({
    status: true,
    message: 'GSTR-3B portal data fetched',
    data: { formData: inner, retPeriod: inner.ret_period || '', autoLiability, filingStatus: existing?.status || 'draft' },
    responseCode: '000',
  })
})

// ─── PUT /tax/gst/gstr3b/form-data ───────────────────────────────────────────
exports.updateGstr3bFormData = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month, formData } = req.body
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month, 10)

  const filing = await TaxGstr3bFiling.findOne({ where: { corporateUserId, gstin, financialYear, month: monthInt } })
  if (!filing) {
    return res.status(400).json({ status: false, message: 'Fetch portal data first before editing.', data: {}, responseCode: '400' })
  }

  const merged = { ...(filing.formData || {}), ...formData }
  await filing.update({ formData: merged })
  return res.status(200).json({ status: true, message: 'Form data updated', data: {}, responseCode: '000' })
})

// ─── POST /tax/gst/gstr3b/save ───────────────────────────────────────────────
exports.saveGstr3bToPortal = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.body
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month, 10)

  const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
  if (!portalToken) {
    return res.status(401).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: {}, responseCode: '401' })
  }

  const filing = await TaxGstr3bFiling.findOne({ where: { corporateUserId, gstin, financialYear, month: monthInt } })
  if (!filing?.formData) {
    return res.status(400).json({ status: false, message: 'Fetch portal data first before saving.', data: {}, responseCode: '400' })
  }

  const year    = calYear(financialYear, monthInt)
  const sbYear  = IS_PROD ? year : SANDBOX_TEST_YEAR
  const sbMonth = IS_PROD ? monthInt : SANDBOX_TEST_MONTH
  const formBody = buildGstr3bBody(filing)
  if (!IS_PROD) formBody.ret_period = SANDBOX_TEST_FP
  customLog(req?.LogTraceId, 'info', { message: 'saveGstr3b: request', gstin, sbYear, sbMonth, formBody }, 'VENDOR')
  const sandboxResp = await sandboxApi.saveGstr3b(gstin, sbYear, sbMonth, portalToken, formBody)
  customLog(req?.LogTraceId, 'info', { message: 'saveGstr3b: sandbox response', gstin, response: sandboxResp?.data }, 'VENDOR')

  if (sandboxResp?.data?.status_cd !== '1' && sandboxResp?.data?.status_cd !== 1) {
    const errMsg = sandboxResp?.data?.error?.message || sandboxResp?.data?.message || 'GSTR-3B save failed'
    customLog(req?.LogTraceId, 'error', { message: 'saveGstr3b: save failed', gstin, response: sandboxResp?.data }, 'VENDOR')
    return res.status(200).json({ status: false, message: errMsg, data: { raw: sandboxResp?.data }, responseCode: '001' })
  }

  await filing.update({ status: 'saved' })
  return res.status(200).json({ status: true, message: 'GSTR-3B saved to portal', data: {}, responseCode: '000' })
})

// ─── POST /tax/gst/gstr3b/validate ───────────────────────────────────────────
exports.validateGstr3bReturn = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.body
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month, 10)

  const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
  if (!portalToken) {
    return res.status(401).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: {}, responseCode: '401' })
  }

  const filing = await TaxGstr3bFiling.findOne({ where: { corporateUserId, gstin, financialYear, month: monthInt } })
  if (!filing || filing.status === 'draft') {
    return res.status(400).json({ status: false, message: 'Save to portal before validating.', data: {}, responseCode: '400' })
  }

  const year     = calYear(financialYear, monthInt)
  const sbYear   = IS_PROD ? year : SANDBOX_TEST_YEAR
  const sbMonth  = IS_PROD ? monthInt : SANDBOX_TEST_MONTH
  const formBody = buildGstr3bBody(filing)
  if (!IS_PROD) formBody.ret_period = SANDBOX_TEST_FP
  customLog(req?.LogTraceId, 'info', { message: 'validateGstr3b: request', gstin, sbYear, sbMonth, formBody }, 'VENDOR')
  const sandboxResp = await sandboxApi.validateGstr3b(gstin, sbYear, sbMonth, portalToken, formBody)
  customLog(req?.LogTraceId, 'info', { message: 'validateGstr3b: sandbox response', gstin, response: sandboxResp?.data }, 'VENDOR')

  if (sandboxResp?.data?.status_cd !== '1' && sandboxResp?.data?.status_cd !== 1) {
    const errMsg = sandboxResp?.data?.error?.message || sandboxResp?.data?.message || 'GSTR-3B validation failed'
    customLog(req?.LogTraceId, 'error', { message: 'validateGstr3b: validation failed', gstin, response: sandboxResp?.data }, 'VENDOR')
    return res.status(200).json({ status: false, message: errMsg, data: { raw: sandboxResp?.data }, responseCode: '001' })
  }

  await filing.update({ status: 'validated' })
  return res.status(200).json({ status: true, message: 'GSTR-3B validated successfully', data: {}, responseCode: '000' })
})

// ─── GET /tax/gst/gstr3b/auto-liability?gstin=&financialYear=&month= ─────────
exports.getGstr3bAutoLiabilityCalc = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.query
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month, 10)

  const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
  if (!portalToken) {
    return res.status(401).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: {}, responseCode: '401' })
  }

  const year        = calYear(financialYear, monthInt)
  const sbYear      = IS_PROD ? year : SANDBOX_TEST_YEAR
  const sbMonth     = IS_PROD ? monthInt : SANDBOX_TEST_MONTH
  customLog(req?.LogTraceId, 'info', { message: 'getGstr3bAutoLiability: request', gstin, sbYear, sbMonth }, 'VENDOR')
  const sandboxResp = await sandboxApi.getGstr3bAutoLiability(gstin, sbYear, sbMonth, portalToken)
  customLog(req?.LogTraceId, 'info', { message: 'getGstr3bAutoLiability: response', gstin, response: sandboxResp?.data }, 'VENDOR')

  if (sandboxResp?.data?.status_cd !== '1' && sandboxResp?.data?.status_cd !== 1) {
    const errMsg = sandboxResp?.data?.error?.message || sandboxResp?.data?.message || 'Failed to fetch auto liability'
    customLog(req?.LogTraceId, 'error', { message: 'getGstr3bAutoLiability: failed', gstin, response: sandboxResp?.data }, 'VENDOR')
    return res.status(200).json({ status: false, message: errMsg, data: {}, responseCode: '001' })
  }

  const r3bautopop = sandboxResp?.data?.data?.r3bautopop || null
  const filing = await TaxGstr3bFiling.findOne({ where: { corporateUserId, gstin, financialYear, month: monthInt } })
  if (filing) await filing.update({ autoLiability: r3bautopop })

  return res.status(200).json({ status: true, message: 'Auto liability fetched', data: { autoLiability: r3bautopop }, responseCode: '000' })
})

// ─── GET /tax/gst/gstr3b/ledgers?gstin=&financialYear=&month= ────────────────
exports.getGstr3bLedgers = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.query
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month, 10)

  const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
  if (!portalToken) {
    return res.status(401).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: {}, responseCode: '401' })
  }

  const year = calYear(financialYear, monthInt)

  // Build date range: FY start → today (DD/MM/YYYY format required by sandbox)
  const fyStartYear = parseInt(financialYear.split('-')[0], 10)
  const now  = new Date()
  const toDate   = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`
  const fromDate = `01/04/${fyStartYear}`

  const sbYear  = IS_PROD ? year : SANDBOX_TEST_YEAR
  const sbMonth = IS_PROD ? monthInt : SANDBOX_TEST_MONTH
  customLog(req?.LogTraceId, 'info', { message: 'getGstr3bLedgers: request', gstin, sbYear, sbMonth, fromDate, toDate }, 'VENDOR')
  const [cashResp, itcResp, liabResp] = await Promise.allSettled([
    sandboxApi.getCashLedger(portalToken, fromDate, toDate),
    sandboxApi.getItcLedger(portalToken, fromDate, toDate),
    sandboxApi.getReturnLiabilityLedger(sbYear, sbMonth, portalToken),
  ])
  customLog(req?.LogTraceId, 'info', {
    message: 'getGstr3bLedgers: response',
    gstin,
    cashResponse: cashResp.value?.data,
    itcResponse: itcResp.value?.data,
    liabResponse: liabResp.value?.data,
  }, 'VENDOR')

  return res.status(200).json({
    status: true,
    message: 'Ledger balances fetched',
    data: {
      cashLedger:      cashResp.status === 'fulfilled'  ? cashResp.value?.data  : null,
      itcLedger:       itcResp.status  === 'fulfilled'  ? itcResp.value?.data   : null,
      liabilityLedger: liabResp.status === 'fulfilled'  ? liabResp.value?.data  : null,
    },
    responseCode: '000',
  })
})

// ─── POST /tax/gst/gstr3b/offset-liability ───────────────────────────────────
exports.offsetGstr3bLiability = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month, offsetData } = req.body
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month, 10)

  const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
  if (!portalToken) {
    return res.status(401).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: {}, responseCode: '401' })
  }

  const year        = calYear(financialYear, monthInt)
  const sbYear      = IS_PROD ? year : SANDBOX_TEST_YEAR
  const sbMonth     = IS_PROD ? monthInt : SANDBOX_TEST_MONTH
  customLog(req?.LogTraceId, 'info', { message: 'offsetGstr3bLiability: request', gstin, sbYear, sbMonth, offsetData }, 'VENDOR')
  const sandboxResp = await sandboxApi.offsetGstr3bLiability(gstin, sbYear, sbMonth, portalToken, offsetData)
  customLog(req?.LogTraceId, 'info', { message: 'offsetGstr3bLiability: sandbox response', gstin, response: sandboxResp?.data }, 'VENDOR')

  if (sandboxResp?.data?.status_cd !== '1' && sandboxResp?.data?.status_cd !== 1) {
    const errMsg = sandboxResp?.data?.error?.message || sandboxResp?.data?.message || 'Offset liability failed'
    customLog(req?.LogTraceId, 'error', { message: 'offsetGstr3bLiability: failed', gstin, response: sandboxResp?.data }, 'VENDOR')
    return res.status(200).json({ status: false, message: errMsg, data: { raw: sandboxResp?.data }, responseCode: '001' })
  }

  return res.status(200).json({ status: true, message: 'Liability offset successfully', data: { raw: sandboxResp?.data?.data }, responseCode: '000' })
})

// ─── POST /tax/gst/gstr3b/file ───────────────────────────────────────────────
exports.fileGstr3bReturn = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month, pan, otp, isNil = false } = req.body
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month, 10)

  const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
  if (!portalToken) {
    return res.status(401).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: {}, responseCode: '401' })
  }

  // Nil return skips save/validate — go straight to new-proceed
  if (!isNil) {
    const filing = await TaxGstr3bFiling.findOne({ where: { corporateUserId, gstin, financialYear, month: monthInt } })
    if (!filing || filing.status !== 'validated') {
      return res.status(400).json({ status: false, message: 'Please validate GSTR-3B before filing.', data: {}, responseCode: '400' })
    }
  }

  const year      = calYear(financialYear, monthInt)
  const sbYear    = IS_PROD ? year : SANDBOX_TEST_YEAR
  const sbMonth   = IS_PROD ? monthInt : SANDBOX_TEST_MONTH
  const retPeriod = IS_PROD ? `${String(monthInt).padStart(2, '0')}${year}` : SANDBOX_TEST_FP
  customLog(req?.LogTraceId, 'info', { message: 'fileGstr3b: request', gstin, pan, otp, sbYear, sbMonth, retPeriod, isNil }, 'VENDOR')
  const sandboxResp = await sandboxApi.proceedToFileGstr3b(sbYear, sbMonth, portalToken, gstin, retPeriod, isNil, pan, otp)
  customLog(req?.LogTraceId, 'info', { message: 'fileGstr3b: sandbox response', gstin, response: sandboxResp?.data }, 'VENDOR')

  const statusCd = sandboxResp?.data?.status_cd
  const ackNum   = sandboxResp?.data?.data?.ack_num || sandboxResp?.data?.data?.reference_id
  const isSuccess = ackNum || statusCd === '1' || statusCd === 1

  if (!isSuccess) {
    const errorCd = sandboxResp?.data?.error?.error_cd
    const errMsg  = sandboxResp?.data?.error?.message || sandboxResp?.data?.message || 'GSTR-3B filing failed'
    customLog(req?.LogTraceId, 'error', { message: 'fileGstr3b: filing failed', gstin, errorCd, errMsg, response: sandboxResp?.data }, 'VENDOR')

    // RET00009 = sandbox confirms GSTR-3B already filed for this period — mark our DB as filed
    if (errorCd === 'RET00009') {
      const existingFiling = await TaxGstr3bFiling.findOne({ where: { corporateUserId, gstin, financialYear, month: monthInt } })
      const filedAtNow = new Date()
      if (existingFiling) {
        await existingFiling.update({ status: 'filed', filedAt: filedAtNow })
      } else {
        await TaxGstr3bFiling.create({ corporateUserId, gstin, financialYear, month: monthInt, retPeriod, status: 'filed', filedAt: filedAtNow })
      }
      const existingAckNum = existingFiling?.ackNum || null
      return res.status(200).json({ status: true, message: 'GSTR-3B already filed on the portal', data: { ackNum: existingAckNum, filedAt: filedAtNow.toISOString() }, responseCode: '000' })
    }

    return res.status(200).json({ status: false, message: errMsg, data: { raw: sandboxResp?.data }, responseCode: '001' })
  }

  const filedAt = new Date()
  const existing = await TaxGstr3bFiling.findOne({ where: { corporateUserId, gstin, financialYear, month: monthInt } })
  if (existing) {
    await existing.update({ ackNum, status: 'filed', filedAt })
  } else {
    await TaxGstr3bFiling.create({ corporateUserId, gstin, financialYear, month: monthInt, retPeriod, status: 'filed', ackNum, filedAt })
  }

  return res.status(200).json({ status: true, message: 'GSTR-3B filed successfully', data: { ackNum, filedAt: filedAt.toISOString() }, responseCode: '000' })
})

// ─── GET /tax/gst/gstr3b/filing?gstin=&financialYear=&month= ─────────────────
exports.getGstr3bFiling = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.query
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month, 10)

  const filing = await TaxGstr3bFiling.findOne({ where: { corporateUserId, gstin, financialYear, month: monthInt }, raw: true })
  return res.status(200).json({
    status: true,
    message: 'GSTR-3B filing retrieved',
    data: filing || null,
    responseCode: '000',
  })
})

// ─── GET /tax/gst/filing-history?gstin=&financialYear= ───────────────────────
exports.getFilingHistory = asyncHandler(async (req, res) => {
  const { gstin, financialYear } = req.query
  const corporateUserId = req.user.corporateId

  const [gstr1Filings, gstr3bFilings] = await Promise.all([
    TaxGstr1Filing.findAll({ where: { corporateUserId, gstin, financialYear }, raw: true }),
    TaxGstr3bFiling.findAll({ where: { corporateUserId, gstin, financialYear }, raw: true }),
  ])

  const gstr1Map = {}
  gstr1Filings.forEach(f => { gstr1Map[f.month] = f })
  const gstr3bMap = {}
  gstr3bFilings.forEach(f => { gstr3bMap[f.month] = f })

  const fyStart = parseInt(financialYear.split('-')[0], 10)
  const fyMonths = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]

  const history = fyMonths.map(m => {
    const year = m >= 4 ? fyStart : fyStart + 1
    const g1  = gstr1Map[m]  || null
    const g3b = gstr3bMap[m] || null
    return {
      month: m,
      year,
      gstr1:  g1  ? { status: g1.status,  ackNum: g1.ackNum,  filedAt: g1.filedAt,  retPeriod: g1.retPeriod  } : null,
      gstr3b: g3b ? { status: g3b.status, ackNum: g3b.ackNum, filedAt: g3b.filedAt, retPeriod: g3b.retPeriod } : null,
    }
  })

  return res.status(200).json({ status: true, message: 'Filing history retrieved', data: history, responseCode: '000' })
})

// ─── GET /tax/gst/gstr3b/export/pdf?gstin=&financialYear=&month= ──────────────
exports.exportGstr3bPdf = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.query
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month, 10)

  const filing = await TaxGstr3bFiling.findOne({
    where: { corporateUserId, gstin, financialYear, month: monthInt },
    raw: true,
  })

  if (!filing) {
    return res.status(200).json({ status: false, message: 'No GSTR-3B filing found for this period.', data: {}, responseCode: '001' })
  }

  const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const periodLabel = `${MONTH_NAMES[monthInt] || String(monthInt)} ${financialYear}`

  const formData      = filing.formData || {}
  const autoLiability = filing.autoLiability || {}
  const netTaxPay     = autoLiability?.liabitc?.net_tax_pay || []

  const fmtINR = n => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const totalLiab = netTaxPay.reduce((s, r) => s + (r?.igst?.tx || 0) + (r?.cgst?.tx || 0) + (r?.sgst?.tx || 0), 0)
  const netITC    = Number(formData?.itc_elg?.itc_net?.iamt || 0)
                  + Number(formData?.itc_elg?.itc_net?.camt || 0)
                  + Number(formData?.itc_elg?.itc_net?.samt || 0)
  const txPy      = formData?.tx_pmt?.tx_py || []

  const data = txPy.map(r => ({
    'GSTIN':              gstin,
    'Period':             periodLabel,
    'Status':             (filing.status || 'draft').toUpperCase(),
    'ARN':                filing.ackNum || '-',
    'Transaction Type':   r.trans_typ || '-',
    'Liability Category': r.tran_desc || '-',
    'IGST':               fmtINR(r?.igst?.tx),
    'CGST':               fmtINR(r?.cgst?.tx),
    'SGST/UTGST':         fmtINR(r?.sgst?.tx),
    'Total Liability':    fmtINR(totalLiab),
    'ITC Utilised':       fmtINR(netITC),
    'Cash Payment':       fmtINR(Math.max(0, totalLiab - netITC)),
  }))

  if (data.length === 0) {
    data.push({
      'GSTIN': gstin, 'Period': periodLabel, 'Status': (filing.status || 'draft').toUpperCase(),
      'ARN': filing.ackNum || '-', 'Transaction Type': '-', 'Liability Category': '-',
      'IGST': '-', 'CGST': '-', 'SGST/UTGST': '-',
      'Total Liability': fmtINR(totalLiab), 'ITC Utilised': fmtINR(netITC),
      'Cash Payment': fmtINR(Math.max(0, totalLiab - netITC)),
    })
  }

  const reportHtmlWithStyle = reportPdfTemplate(data, { title: 'GSTR-3B Return' })

  const random = new Date().valueOf()
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page    = await browser.newPage()
  await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' })
  const outputFile = `GSTR3B-${random}.pdf`
  await page.pdf({ scale: 0.6, path: outputFile, format: 'A4', preferCSSPageSize: true })
  const buffer = fs.readFileSync(outputFile)
  browser.close()
  fs.unlinkSync(outputFile)

  return res.status(200).json({
    status: true,
    message: 'GSTR-3B PDF generated successfully',
    data: { buffer, fileType: 'application/pdf' },
    responseCode: '000',
  })
})

// ─── GSTR-2B helpers ─────────────────────────────────────────────────────────

function flattenB2b(suppliers = [], isAmended = false) {
  const rows = []
  for (const sup of suppliers) {
    for (const inv of (sup.inv || [])) {
      const row = {
        supplierName:  sup.trdnm  || null,
        supplierGstin: sup.ctin   || null,
        invoiceNo:     inv.inum,
        date:          inv.dt,
        value:         inv.val     || 0,
        taxableValue:  inv.txval   || 0,
        reverseCharge: inv.rev     === 'Y',
        itcAvailable:  inv.itcavl  === 'Y',
        imsStatus:     inv.imsStatus || 'N',
        igst:          inv.igst    || 0,
        cgst:          inv.cgst    || 0,
        sgst:          inv.sgst    || 0,
        cess:          inv.cess    || 0,
      }
      if (isAmended) {
        row.origInvoiceNo   = inv.oinum || null
        row.origInvoiceDate = inv.oidt  || null
      }
      rows.push(row)
    }
  }
  return rows
}

function flattenCdn(suppliers = [], isAmended = false) {
  const rows = []
  for (const sup of suppliers) {
    for (const nt of (sup.nt || [])) {
      const row = {
        supplierName:  sup.trdnm   || null,
        supplierGstin: sup.ctin    || null,
        noteType:      nt.typ,
        noteNo:        nt.ntnum,
        date:          nt.dt,
        value:         nt.val      || 0,
        taxableValue:  nt.txval    || 0,
        reverseCharge: nt.rev      === 'Y',
        itcAvailable:  nt.itcavl   === 'Y',
        imsStatus:     nt.imsStatus || 'N',
        igst:          nt.igst     || 0,
        cgst:          nt.cgst     || 0,
        sgst:          nt.sgst     || 0,
        cess:          nt.cess     || 0,
      }
      if (isAmended) {
        row.origNoteType   = nt.onttyp  || null
        row.origNoteNo     = nt.ontnum  || null
        row.origNoteDate   = nt.ontdt   || null
      }
      rows.push(row)
    }
  }
  return rows
}

function flattenImpg(entries = []) {
  return entries.map(e => ({
    supplierGstin: null,
    supplierName:  null,
    referenceDate: e.refdt    || null,
    receivedDate:  e.recdt    || null,
    portCode:      e.portcode || null,
    boeNumber:     e.boenum   || null,
    boeDate:       e.boedt    || null,
    isAmended:     e.isamd    === 'Y',
    taxableValue:  e.txval    || 0,
    cess:          e.cess     || 0,
    igst:          e.igst     || 0,
    itcAvailable:  e.itcavl   === 'Y',
  }))
}

function flattenImpgsez(suppliers = []) {
  const rows = []
  for (const sup of suppliers) {
    for (const boe of (sup.boe || [])) {
      rows.push({
        supplierGstin: sup.ctin     || null,
        supplierName:  sup.trdnm    || null,
        referenceDate: boe.refdt    || null,
        receivedDate:  boe.recdt    || null,
        portCode:      boe.portcode || null,
        boeNumber:     boe.boenum   || null,
        boeDate:       boe.boedt    || null,
        isAmended:     boe.isamd    === 'Y',
        taxableValue:  boe.txval    || 0,
        cess:          boe.cess     || 0,
        igst:          boe.igst     || 0,
        itcAvailable:  boe.itcavl   === 'Y',
      })
    }
  }
  return rows
}

function flattenIsd(suppliers = [], isAmended = false) {
  const rows = []
  for (const sup of suppliers) {
    for (const doc of (sup.doclist || [])) {
      const row = {
        supplierName:  sup.trdnm   || null,
        supplierGstin: sup.ctin    || null,
        docType:       doc.doctyp  || null,
        docNo:         doc.docnum  || null,
        date:          doc.docdt   || null,
        origInvNo:     doc.oinvnum || null,
        origInvDate:   doc.oinvdt  || null,
        itcEligible:   doc.itcelg  === 'Y',
        igst:          doc.igst    || 0,
        cgst:          doc.cgst    || 0,
        sgst:          doc.sgst    || 0,
        cess:          doc.cess    || 0,
      }
      if (isAmended) {
        row.origDocType = doc.odoctyp || null
        row.origDocNo   = doc.odocnum || null
        row.origDocDate = doc.odocdt  || null
      }
      rows.push(row)
    }
  }
  return rows
}

function flattenTds(entries = []) {
  return entries.map(e => ({
    deducteeGstin: e.gstin_ded || null,
    amountDeducted: e.amt_ded || 0,
    igst:           e.iamt || 0,
    cgst:           e.camt || 0,
    sgst:           e.samt || 0,
  }))
}

function flattenTcs(suppliers = []) {
  const rows = []
  for (const sup of suppliers) {
    for (const inv of (sup.inv || [])) {
      rows.push({
        supplierGstin: sup.ctin      || null,
        supplierName:  sup.trdnm     || null,
        invoiceNo:     inv.inum      || null,
        date:          inv.dt        || null,
        value:         inv.val       || 0,
        taxableValue:  inv.txval     || 0,
        reverseCharge: inv.rev       === 'Y',
        itcAvailable:  inv.itcavl    === 'Y',
        placeOfSupply: inv.pos       || null,
        invoiceType:   inv.typ       || null,
        imsStatus:     inv.imsStatus || 'N',
        igst:          inv.igst      || 0,
        cgst:          inv.cgst      || 0,
        sgst:          inv.sgst      || 0,
        cess:          inv.cess      || 0,
      })
    }
  }
  return rows
}


function applyGstr2bFilters(data, search, matchStatus) {
  if (search) {
    const q = search.toLowerCase()
    const applyFilter = (rows, docField) => rows.filter(row =>
      (row.supplierName  || '').toLowerCase().includes(q) ||
      (row.supplierGstin || '').toLowerCase().includes(q) ||
      (row[docField]     || '').toLowerCase().includes(q)
    )
    data.b2b  = applyFilter(data.b2b,  'invoiceNo')
    data.b2ba = applyFilter(data.b2ba, 'invoiceNo')
    data.cdn  = applyFilter(data.cdn,  'noteNo')
    data.impg = applyFilter(data.impg, 'boeNumber')
    data.isd  = applyFilter(data.isd,  'docNo')
    data.tds  = applyFilter(data.tds,  'deducteeGstin')
    data.tcs  = applyFilter(data.tcs,  'invoiceNo')
    data.amd  = applyFilter(data.amd,  'noteNo')
  }
  if (matchStatus === 'matched') {
    const onlyMatched = rows => rows.filter(r => r.itcAvailable === true)
    data.b2b  = onlyMatched(data.b2b)
    data.b2ba = onlyMatched(data.b2ba)
    data.cdn  = onlyMatched(data.cdn)
    data.impg = onlyMatched(data.impg)
    data.isd  = onlyMatched(data.isd)
    data.tcs  = onlyMatched(data.tcs)
  } else if (matchStatus === 'unmatched') {
    const onlyUnmatched = rows => rows.filter(r => r.itcAvailable === false)
    data.b2b  = onlyUnmatched(data.b2b)
    data.b2ba = onlyUnmatched(data.b2ba)
    data.cdn  = onlyUnmatched(data.cdn)
    data.impg = onlyUnmatched(data.impg)
    data.isd  = onlyUnmatched(data.isd)
    data.tcs  = onlyUnmatched(data.tcs)
  } else if (matchStatus === 'amended') {
    data.b2b  = []
    data.cdn  = []
    data.impg = []
    data.isd  = []
    data.tds  = []
    data.tcs  = []
  }
}

function toGstr2bExportRows(data) {
  const norm = (section, r) => ({
    'Section':         section,
    'Supplier GSTIN':  r.supplierGstin  || r.distributorGstin || r.deducteeGstin || '',
    'Supplier Name':   r.supplierName   || r.distributorName  || r.deducteeName  || '',
    'Document No':     r.invoiceNo      || r.noteNo           || r.boeNumber     || r.docNo || '',
    'Document Type':   r.noteType       || r.docType          || r.invoiceType   || '',
    'Date':            r.date           || r.boeDate          || '',
    'Value':           r.value          ?? '',
    'Taxable Value':   r.taxableValue   ?? '',
    'Place of Supply': r.placeOfSupply  || r.portCode         || '',
    'Reverse Charge':  r.reverseCharge  != null ? (r.reverseCharge ? 'Y' : 'N') : '',
    'ITC Available':   r.itcAvailable   != null ? (r.itcAvailable  ? 'Y' : 'N') : '',
    'IGST':            r.igst           || 0,
    'CGST':            r.cgst           || 0,
    'SGST':            r.sgst           || 0,
    'CESS':            r.cess           || 0,
    'Gross Value':     r.grossValue     ?? '',
    'TDS':             r.tds            ?? '',
  })

  return [
    ...(data.b2b  || []).map(r => norm('B2B',  r)),
    ...(data.b2ba || []).map(r => norm('B2BA', r)),
    ...(data.cdn  || []).map(r => norm('CDN',  r)),
    ...(data.impg || []).map(r => norm('IMPG', r)),
    ...(data.isd  || []).map(r => norm('ISD',  r)),
    ...(data.tds  || []).map(r => norm('TDS',  r)),
    ...(data.tcs  || []).map(r => norm('TCS',  r)),
    ...(data.amd  || []).map(r => norm('AMD',  r)),
  ]
}

// ─── GET /tax/gst/gstr2b ──────────────────────────────────────────────────────
exports.fetchGstr2b = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month, search, matchStatus } = req.query
  const corporateUserId = req.user.corporateId
  const monthNum = parseInt(month)

  const sessionKey  = portalSessionKey(corporateUserId, gstin)
  const portalToken = await getValue(sessionKey)
  if (!portalToken && IS_PROD) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect.', data: { requiresAuth: true }, responseCode: '401' })
  }

  if (!IS_PROD) {
    const mockGstr2b = require('../../utils/mockData/gstr2b')
    const doc        = mockGstr2b.data.data.data.docdata || {}
    const itcSummary = mockGstr2b.data.data.data.itcsumm || {}
    return res.status(200).json({
      status: true, message: 'GSTR-2B data retrieved', responseCode: '000',
      data: {
        b2b: flattenB2b(doc.b2b), b2ba: flattenB2b(doc.b2ba, true),
        cdn: flattenCdn(doc.cdnr), impg: [...flattenImpg(doc.impg), ...flattenImpgsez(doc.impgsez)],
        isd: flattenIsd(doc.isd), tds: flattenTds(doc.tds), tcs: flattenTcs(doc.tcs || doc.ecom),
        amd: [...flattenCdn(doc.cdnra, true), ...flattenIsd(doc.isda, true)], itcSummary,
      },
    })
  }

  const year = calYear(financialYear, monthNum)
  const mm   = pad2(monthNum)

  customLog(req?.LogTraceId, 'info', { message: 'fetchGstr2b: request', gstin, year, mm }, 'VENDOR')
  const first    = await sandboxApi.getGstr2b(gstin, year, mm, portalToken)
  customLog(req?.LogTraceId, 'info', { message: 'fetchGstr2b: response', gstin, response: first?.data }, 'VENDOR')
  const statusCd = first?.data?.status_cd
  const fc       = first?.data?.fc || 1

  if (statusCd === '0' || statusCd === 0) {
    return res.status(200).json({
      status: false,
      message: first?.data?.error?.message || 'GSTR-2B is not yet generated for this period.',
      data: {},
      responseCode: '002',
    })
  }

  let doc      = { ...(first?.data?.data?.data?.docdata || {}) }
  const itcSummary = first?.data?.data?.data?.itcsumm || {}

  if ((statusCd === '1' || statusCd === '3') && fc > 1) {
    for (let i = 2; i <= fc; i++) {
      customLog(req?.LogTraceId, 'info', { message: 'fetchGstr2b: paginated request', gstin, page: i }, 'VENDOR')
      const page = await sandboxApi.getGstr2b(gstin, year, mm, portalToken, i)
      customLog(req?.LogTraceId, 'info', { message: 'fetchGstr2b: paginated response', gstin, page: i, response: page?.data }, 'VENDOR')
      const pd   = page?.data?.data?.data?.docdata || {}
      for (const key of ['b2b', 'b2ba', 'cdnr', 'cdnra', 'impg', 'impgsez', 'isd', 'isda', 'tds', 'tcs', 'ecom', 'ecoma']) {
        if (pd[key]?.length) doc[key] = [...(doc[key] || []), ...pd[key]]
      }
    }
  }

  const data = {
    b2b:  flattenB2b(doc.b2b),
    b2ba: flattenB2b(doc.b2ba, true),
    cdn:  flattenCdn(doc.cdnr),
    impg: [...flattenImpg(doc.impg), ...flattenImpgsez(doc.impgsez)],
    isd:  flattenIsd(doc.isd),
    tds:  flattenTds(doc.tds),
    tcs:  flattenTcs(doc.tcs || doc.ecom),
    amd:  [...flattenCdn(doc.cdnra, true), ...flattenIsd(doc.isda, true)],
    itcSummary,
  }

  if (search) {
    const q = search.toLowerCase()
    const applyFilter = (rows, docField) => rows.filter(row =>
      (row.supplierName  || '').toLowerCase().includes(q) ||
      (row.supplierGstin || '').toLowerCase().includes(q) ||
      (row[docField]     || '').toLowerCase().includes(q)
    )
    data.b2b  = applyFilter(data.b2b,  'invoiceNo')
    data.b2ba = applyFilter(data.b2ba, 'invoiceNo')
    data.cdn  = applyFilter(data.cdn,  'noteNo')
    data.impg = applyFilter(data.impg, 'boeNumber')
    data.isd  = applyFilter(data.isd,  'docNo')
    data.tds  = applyFilter(data.tds,  'deducteeGstin')
    data.tcs  = applyFilter(data.tcs,  'invoiceNo')
    data.amd  = applyFilter(data.amd,  'noteNo')
  }

  if (matchStatus === 'matched') {
    const onlyMatched = rows => rows.filter(r => r.itcAvailable === true)
    data.b2b  = onlyMatched(data.b2b)
    data.b2ba = onlyMatched(data.b2ba)
    data.cdn  = onlyMatched(data.cdn)
    data.impg = onlyMatched(data.impg)
    data.isd  = onlyMatched(data.isd)
    data.tcs  = onlyMatched(data.tcs)
  } else if (matchStatus === 'unmatched') {
    const onlyUnmatched = rows => rows.filter(r => r.itcAvailable === false)
    data.b2b  = onlyUnmatched(data.b2b)
    data.b2ba = onlyUnmatched(data.b2ba)
    data.cdn  = onlyUnmatched(data.cdn)
    data.impg = onlyUnmatched(data.impg)
    data.isd  = onlyUnmatched(data.isd)
    data.tcs  = onlyUnmatched(data.tcs)
  } else if (matchStatus === 'amended') {
    data.b2b  = []
    data.cdn  = []
    data.impg = []
    data.isd  = []
    data.tds  = []
    data.tcs  = []
  }

  return res.status(200).json({ status: true, message: 'GSTR-2B data retrieved', data, responseCode: '000' })
})

// ─── GET /tax/gst/gstr2b/export/:type ────────────────────────────────────────
exports.exportGstr2bCsv = asyncHandler(async (req, res, next) => {
  const { gstin, financialYear, month, search, matchStatus } = req.query
  const { type } = req.params
  const corporateUserId = req.user.corporateId
  const monthNum = parseInt(month)

  const sessionKey  = portalSessionKey(corporateUserId, gstin)
  const portalToken = await getValue(sessionKey)
  if (!portalToken && IS_PROD) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect.', data: { requiresAuth: true }, responseCode: '401' })
  }

  if (!IS_PROD) {
    const mockGstr2b = require('../../utils/mockData/gstr2b')
    const doc        = mockGstr2b.data.data.data.docdata || {}
    const data = {
      b2b:  flattenB2b(doc.b2b),
      b2ba: flattenB2b(doc.b2ba, true),
      cdn:  flattenCdn(doc.cdnr),
      impg: [...flattenImpg(doc.impg), ...flattenImpgsez(doc.impgsez)],
      isd:  flattenIsd(doc.isd),
      tds:  flattenTds(doc.tds),
      tcs:  flattenTcs(doc.tcs || doc.ecom),
      amd:  [...flattenCdn(doc.cdnra, true), ...flattenIsd(doc.isda, true)],
    }
    applyGstr2bFilters(data, search, matchStatus)
    const rows = toGstr2bExportRows(data)
    if (!rows.length) return next(new ErrorResponse('No data available for export', 400))
    const { buffer, fileType } = await generateExcelBufferAndType(rows, type)
    return res.status(200).json({ status: true, data: { buffer, fileType }, message: 'GSTR-2B exported successfully', responseCode: '000' })
  }

  const year = calYear(financialYear, monthNum)
  const mm   = pad2(monthNum)

  customLog(req?.LogTraceId, 'info', { message: 'exportGstr2bCsv: request', gstin, year, mm }, 'VENDOR')
  const first    = await sandboxApi.getGstr2b(gstin, year, mm, portalToken)
  customLog(req?.LogTraceId, 'info', { message: 'exportGstr2bCsv: response', gstin, response: first?.data }, 'VENDOR')
  const statusCd = first?.data?.status_cd
  const fc       = first?.data?.fc || 1

  if (statusCd === '0' || statusCd === 0) {
    return next(new ErrorResponse(first?.data?.error?.message || 'GSTR-2B is not yet generated for this period.', 400))
  }

  if (statusCd === '2') {
    return next(new ErrorResponse('GSTR-2B is being generated. Please try again after the 14th.', 400))
  }

  let doc = { ...(first?.data?.data?.data?.docdata || {}) }
  if ((statusCd === '1' || statusCd === '3') && fc > 1) {
    for (let i = 2; i <= fc; i++) {
      customLog(req?.LogTraceId, 'info', { message: 'exportGstr2bCsv: paginated request', gstin, page: i }, 'VENDOR')
      const page = await sandboxApi.getGstr2b(gstin, year, mm, portalToken, i)
      customLog(req?.LogTraceId, 'info', { message: 'exportGstr2bCsv: paginated response', gstin, page: i, response: page?.data }, 'VENDOR')
      const pd   = page?.data?.data?.data?.docdata || {}
      for (const key of ['b2b', 'b2ba', 'cdnr', 'cdnra', 'impg', 'impgsez', 'isd', 'isda', 'tds', 'tcs', 'ecom', 'ecoma']) {
        if (pd[key]?.length) doc[key] = [...(doc[key] || []), ...pd[key]]
      }
    }
  }

  const data = {
    b2b:  flattenB2b(doc.b2b),
    b2ba: flattenB2b(doc.b2ba, true),
    cdn:  flattenCdn(doc.cdnr),
    impg: [...flattenImpg(doc.impg), ...flattenImpgsez(doc.impgsez)],
    isd:  flattenIsd(doc.isd),
    tds:  flattenTds(doc.tds),
    tcs:  flattenTcs(doc.tcs || doc.ecom),
    amd:  [...flattenCdn(doc.cdnra, true), ...flattenIsd(doc.isda, true)],
  }

  applyGstr2bFilters(data, search, matchStatus)

  const rows = toGstr2bExportRows(data)
  if (!rows.length) {
    return next(new ErrorResponse('No data available for export', 400))
  }

  const { buffer, fileType } = await generateExcelBufferAndType(rows, type)
  return res.status(200).json({ status: true, data: { buffer, fileType }, message: 'GSTR-2B exported successfully', responseCode: '000' })
})

// ─── POST /tax/gst/gstr2b/mark-reconciled ────────────────────────────────────
exports.markGstr2bReconciled = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.body
  const corporateUserId = req.user.corporateId

  await TaxGstr2bReconciliation.upsert({
    corporateUserId,
    gstin,
    financialYear,
    month: parseInt(month),
    status: 'reconciled',
    reconciledAt: new Date(),
  })

  return res.status(200).json({ status: true, message: 'GSTR-2B marked as reconciled', data: {}, responseCode: '000' })
})

// ─── GET /tax/gst/gstr2b/reconciliation-status ───────────────────────────────
exports.getGstr2bReconciliationStatus = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.query
  const corporateUserId = req.user.corporateId

  const record = await TaxGstr2bReconciliation.findOne({
    where: { corporateUserId, gstin, financialYear, month: parseInt(month) },
    raw: true,
  })

  return res.status(200).json({
    status: true,
    data: {
      reconciled:   !!record,
      reconciledAt: record?.reconciledAt || null,
    },
    responseCode: '000',
  })
})

// ─── GET /tax/gst/gstr2b/reconciliation-report ───────────────────────────────
exports.downloadReconciliationReport = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.query
  const corporateUserId = req.user.corporateId
  const monthNum = parseInt(month)

  const sessionKey  = portalSessionKey(corporateUserId, gstin)
  const portalToken = await getValue(sessionKey)
  if (!portalToken) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect.', data: { requiresAuth: true }, responseCode: '401' })
  }

  const year = calYear(financialYear, monthNum)
  const mm   = pad2(monthNum)

  customLog(req?.LogTraceId, 'info', { message: 'downloadReconciliationReport: request', gstin, year, mm }, 'VENDOR')
  const first    = await sandboxApi.getGstr2b(gstin, year, mm, portalToken)
  customLog(req?.LogTraceId, 'info', { message: 'downloadReconciliationReport: response', gstin, response: first?.data }, 'VENDOR')
  const statusCd = first?.data?.data?.status_cd
  const fc       = first?.data?.data?.fc || 1

  let doc = { ...(first?.data?.data?.data?.docdata || {}) }
  if (statusCd === '3' && fc > 1) {
    for (let i = 2; i <= fc; i++) {
      customLog(req?.LogTraceId, 'info', { message: 'downloadReconciliationReport: paginated request', gstin, page: i }, 'VENDOR')
      const page = await sandboxApi.getGstr2b(gstin, year, mm, portalToken, i)
      customLog(req?.LogTraceId, 'info', { message: 'downloadReconciliationReport: paginated response', gstin, page: i, response: page?.data }, 'VENDOR')
      const pd   = page?.data?.data?.data?.docdata || {}
      for (const key of ['b2b', 'b2ba', 'cdnr', 'cdnra', 'impg', 'impgsez', 'isd', 'isda', 'tds', 'tcs', 'ecom', 'ecoma']) {
        if (pd[key]?.length) doc[key] = [...(doc[key] || []), ...pd[key]]
      }
    }
  }

  const data = {
    b2b:  flattenB2b(doc.b2b),
    b2ba: flattenB2b(doc.b2ba, true),
    cdn:  flattenCdn(doc.cdnr),
    impg: [...flattenImpg(doc.impg), ...flattenImpgsez(doc.impgsez)],
    isd:  flattenIsd(doc.isd),
    tds:  flattenTds(doc.tds),
    tcs:  flattenTcs(doc.tcs || doc.ecom),
    amd:  [...flattenCdn(doc.cdnra, true), ...flattenIsd(doc.isda, true)],
    itcSummary: first?.data?.data?.data?.itcsumm || {},
  }

  const reconRecord = await TaxGstr2bReconciliation.findOne({
    where: { corporateUserId, gstin, financialYear, month: monthNum },
    raw: true,
  })

  const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const returnPeriod = `${MONTH_NAMES[monthNum] || monthNum} ${financialYear}`

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Peko'

  // ── Sheet 1: ITC Summary ──────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('ITC Summary')

  const headerStyle = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FD' } } }
  const labelStyle  = { font: { bold: true } }

  summarySheet.columns = [{ width: 30 }, { width: 25 }, { width: 25 }, { width: 25 }]

  summarySheet.addRow(['GSTR-2B Reconciliation Report'])
  summarySheet.getRow(1).font = { bold: true, size: 14 }
  summarySheet.addRow([])
  summarySheet.addRow(['GSTIN',           gstin])
  summarySheet.addRow(['Financial Year',  financialYear])
  summarySheet.addRow(['Return Period',   returnPeriod])
  summarySheet.addRow(['Report Generated', new Date().toLocaleString('en-IN')])
  summarySheet.addRow(['Reconciled',      reconRecord ? 'Yes' : 'No'])
  if (reconRecord?.reconciledAt) summarySheet.addRow(['Reconciled On', new Date(reconRecord.reconciledAt).toLocaleString('en-IN')])
  summarySheet.addRow([])

  const sumRow = summarySheet.addRow(['Section', 'Matched ITC (₹)', 'Unmatched ITC (₹)', 'Total ITC (₹)'])
  sumRow.eachCell(cell => Object.assign(cell, headerStyle))

  const calcMatched   = (rows) => rows.filter(r => r.itcAvailable === true).reduce((s, r) => s + (r.igst || 0) + (r.cgst || 0) + (r.sgst || 0), 0)
  const calcUnmatched = (rows) => rows.filter(r => r.itcAvailable === false).reduce((s, r) => s + (r.igst || 0) + (r.cgst || 0) + (r.sgst || 0), 0)

  const sections = [
    { label: 'B2B',      rows: data.b2b  || [] },
    { label: 'B2BA',     rows: data.b2ba || [] },
    { label: 'CDN Adj.', rows: data.cdn  || [] },
    { label: 'IMPG',     rows: data.impg || [] },
    { label: 'ISD',      rows: data.isd  || [] },
    { label: 'TCS',      rows: data.tcs  || [] },
    { label: 'AMD',      rows: data.amd  || [] },
  ]

  let totalMatched = 0, totalUnmatched = 0
  for (const s of sections) {
    const matched   = calcMatched(s.rows)
    const unmatched = calcUnmatched(s.rows)
    totalMatched   += matched
    totalUnmatched += unmatched
    summarySheet.addRow([s.label, matched, unmatched, matched + unmatched])
  }

  const tdsTotal = (data.tds || []).reduce((s, r) => s + (r.tds || 0), 0)
  summarySheet.addRow(['TDS Cred.', tdsTotal, 0, tdsTotal])
  totalMatched += tdsTotal

  const totalRow = summarySheet.addRow(['Total', totalMatched, totalUnmatched, totalMatched + totalUnmatched])
  totalRow.eachCell(cell => Object.assign(cell, labelStyle))

  // ── Sheet 2: Invoice Details ──────────────────────────────────────────────
  const detailSheet = workbook.addWorksheet('Invoice Details')
  const allRows = toGstr2bExportRows(data)

  if (allRows.length) {
    const headers = Object.keys(allRows[0])
    const headerRow = detailSheet.addRow(headers)
    headerRow.eachCell(cell => Object.assign(cell, headerStyle))
    detailSheet.columns = headers.map(() => ({ width: 22 }))
    for (const row of allRows) detailSheet.addRow(Object.values(row))
  }

  const buffer   = await workbook.xlsx.writeBuffer()
  const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

  return res.status(200).json({ status: true, data: { buffer, fileType }, message: 'Reconciliation report generated', responseCode: '000' })
})

// ─── POST /tax/gst/gstr2b/regenerate ─────────────────────────────────────────
exports.regenerateGstr2b = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.body
  const corporateUserId = req.user.corporateId
  const monthNum = parseInt(month)

  if (process.env.NODE_ENV !== 'production') {
    return res.status(200).json({ status: true, message: 'GSTR-2B regeneration started', data: {}, responseCode: '000' })
  }

  const sessionKey  = portalSessionKey(corporateUserId, gstin)
  const portalToken = await getValue(sessionKey)
  if (!portalToken) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect.', data: { requiresAuth: true }, responseCode: '401' })
  }

  const year = calYear(financialYear, monthNum)
  const mm   = pad2(monthNum)

  customLog(req?.LogTraceId, 'info', { message: 'regenerateGstr2b: request', gstin, year, mm }, 'VENDOR')
  const regenResp   = await sandboxApi.regenerateGstr2b(year, mm, portalToken)
  customLog(req?.LogTraceId, 'info', { message: 'regenerateGstr2b: response', gstin, response: regenResp?.data }, 'VENDOR')
  const outerStatus = regenResp?.data?.status_cd
  if (outerStatus !== '1' && outerStatus !== 1) {
    customLog(req?.LogTraceId, 'error', { message: 'GSTR-2B regeneration trigger failed', gstin, year, mm, response: regenResp?.data })
    return res.status(200).json({
      status: false,
      message: regenResp?.data?.message || 'Failed to start GSTR-2B regeneration',
      data: {},
      responseCode: '001',
    })
  }

  return res.status(200).json({ status: true, message: 'GSTR-2B regeneration started', data: {}, responseCode: '000' })
})

// ─── GET /tax/gst/gstr2b/regen-status ────────────────────────────────────────
exports.getGstr2bRegenStatus = asyncHandler(async (req, res) => {
  const { gstin } = req.query
  const corporateUserId = req.user.corporateId

  if (process.env.NODE_ENV !== 'production') {
    return res.status(200).json({ status: true, data: { processing: false }, responseCode: '000' })
  }

  const sessionKey  = portalSessionKey(corporateUserId, gstin)
  const portalToken = await getValue(sessionKey)
  if (!portalToken) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect.', data: { requiresAuth: true }, responseCode: '401' })
  }

  customLog(req?.LogTraceId, 'info', { message: 'getGstr2bRegenStatus: request', gstin }, 'VENDOR')
  const statusResp  = await sandboxApi.getGstr2bRegenStatus(portalToken)
  customLog(req?.LogTraceId, 'info', { message: 'getGstr2bRegenStatus: response', gstin, response: statusResp?.data }, 'VENDOR')
  const innerStatus = statusResp?.data?.data?.status_cd
  const errCd       = statusResp?.data?.data?.err_cd

  if (errCd) {
    customLog(req?.LogTraceId, 'error', { message: 'GSTR-2B regeneration failed', gstin, errCd, errMsg: statusResp?.data?.data?.err_msg })
    return res.status(200).json({
      status: false,
      message: statusResp?.data?.data?.err_msg || 'GSTR-2B regeneration failed',
      data: { errCode: errCd },
      responseCode: '001',
    })
  }

  return res.status(200).json({
    status: true,
    data: { processing: innerStatus === 'P' },
    responseCode: '000',
  })
})

// ─── GET /tax/gst/ledger/balance ─────────────────────────────────────────────
exports.getCashItcBalance = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.query
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month)

  const sessionKey  = portalSessionKey(corporateUserId, gstin)
  const portalToken = await getValue(sessionKey)
  if (!portalToken) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: { requiresAuth: true }, responseCode: '401' })
  }

  const year        = calYear(financialYear, monthInt)
  const mm          = pad2(monthInt)
  customLog(req?.LogTraceId, 'info', { message: 'getCashItcBalance: request', gstin, year, mm }, 'VENDOR')
  const sandboxResp = await sandboxApi.getCashItcBalance(portalToken, year, mm)
  customLog(req?.LogTraceId, 'info', { message: 'getCashItcBalance: response', gstin, response: sandboxResp?.data }, 'VENDOR')
  if (sandboxResp?.data?.status_cd !== '1' && sandboxResp?.data?.status_cd !== 1) {
    customLog(req?.LogTraceId, 'error', { message: 'getCashItcBalance: failed', gstin, response: sandboxResp?.data }, 'VENDOR')
    return res.status(200).json({ status: false, message: sandboxResp?.data?.message || 'Failed to fetch ledger balance', data: {}, responseCode: '001' })
  }

  const raw     = sandboxResp?.data?.data || {}
  const cashBal = raw.cash_bal     || {}
  const itcBal  = raw.itc_bal      || {}
  const itcBlck = raw.itc_blck_bal || {}

  const cashBalance = {
    igst: cashBal.igst_tot_bal ?? 0,
    sgst: cashBal.sgst_tot_bal ?? 0,
    cgst: cashBal.cgst_tot_bal ?? 0,
    cess: cashBal.cess_tot_bal ?? 0,
  }
  cashBalance.total = cashBalance.igst + cashBalance.sgst + cashBalance.cgst + cashBalance.cess

  const itcBalance = {
    igst: itcBal.igst_bal || 0,
    sgst: itcBal.sgst_bal || 0,
    cgst: itcBal.cgst_bal || 0,
    cess: itcBal.cess_bal || 0,
  }
  itcBalance.total = itcBalance.igst + itcBalance.sgst + itcBalance.cgst + itcBalance.cess

  const itcBlockedBalance = {
    igst: itcBlck.igst_blck_bal || 0,
    sgst: itcBlck.sgst_blck_bal || 0,
    cgst: itcBlck.cgst_blck_bal || 0,
    cess: itcBlck.cess_blck_bal || 0,
  }
  itcBlockedBalance.total = itcBlockedBalance.igst + itcBlockedBalance.sgst + itcBlockedBalance.cgst + itcBlockedBalance.cess

  const availableBalance = {
    igst: cashBalance.igst + itcBalance.igst,
    sgst: cashBalance.sgst + itcBalance.sgst,
    cgst: cashBalance.cgst + itcBalance.cgst,
    cess: cashBalance.cess + itcBalance.cess,
  }

  const cashBreakdown = {
    igst: cashBal.igst || { tx: 0, fee: 0, intr: 0, pen: 0, oth: 0 },
    sgst: cashBal.sgst || { tx: 0, fee: 0, intr: 0, pen: 0, oth: 0 },
    cgst: cashBal.cgst || { tx: 0, fee: 0, intr: 0, pen: 0, oth: 0 },
    cess: cashBal.cess || { tx: 0, fee: 0, intr: 0, pen: 0, oth: 0 },
  }

  return res.status(200).json({
    status: true,
    message: 'Cash & ITC ledger balance retrieved',
    data: {
      gstin: raw.gstin || gstin,
      cashBalance,
      cashBreakdown,
      itcBalance,
      itcBlockedBalance,
      availableBalance,
    },
    responseCode: '000',
  })
})

// ─── GET /tax/gst/ledger/liability ───────────────────────────────────────────
exports.getReturnLiability = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month } = req.query
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month)

  const sessionKey  = portalSessionKey(corporateUserId, gstin)
  const portalToken = await getValue(sessionKey)
  if (!portalToken) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: { requiresAuth: true }, responseCode: '401' })
  }

  const year    = calYear(financialYear, monthInt)
  const mm      = pad2(monthInt)
  const lastDay = new Date(year, monthInt, 0).getDate()
  const from    = `01/${mm}/${year}`
  const to      = `${pad2(lastDay)}/${mm}/${year}`

  customLog(req?.LogTraceId, 'info', { message: 'getReturnLiability: request', gstin, year, mm, from, to }, 'VENDOR')
  const sandboxResp = await sandboxApi.getReturnLiability(portalToken, year, mm, from, to)
  customLog(req?.LogTraceId, 'info', { message: 'getReturnLiability: response', gstin, response: sandboxResp?.data }, 'VENDOR')

  if (sandboxResp?.data?.status_cd !== '1' && sandboxResp?.data?.status_cd !== 1) {
    customLog(req?.LogTraceId, 'error', { message: 'getReturnLiability: failed', gstin, response: sandboxResp?.data }, 'VENDOR')
    return res.status(200).json({ status: false, message: sandboxResp?.data?.message || 'Failed to fetch return liability ledger', data: {}, responseCode: '001' })
  }

  const raw    = sandboxResp?.data?.data || {}
  const clBal  = raw.cl_bal || {}

  const closingBalance = {
    igst: clBal.igstbal?.tot ?? 0,
    cgst: clBal.cgstbal?.tot ?? 0,
    sgst: clBal.sgstbal?.tot ?? 0,
    cess: clBal.cessbal?.tot ?? 0,
    total: clBal.tot_rng_bal ?? 0,
  }

  const transactions = (raw.tr || []).map(t => ({
    date:    t.dt       || '',
    desc:    t.desc     || '',
    refNo:   t.ref_no   || '',
    type:    t.tr_typ   || '',
    igst:    t.igst?.tot  ?? 0,
    cgst:    t.cgst?.tot  ?? 0,
    sgst:    t.sgst?.tot  ?? 0,
    cess:    t.cess?.tot  ?? 0,
    total:   t.tot_tr_amt ?? 0,
  }))

  return res.status(200).json({
    status: true,
    message: 'Return liability ledger retrieved',
    data: { gstin: raw.gstin || gstin, closingBalance, transactions },
    responseCode: '000',
  })
})

// ─── GET /tax/ledger/cash ─────────────────────────────────────────────────────
exports.getCashLedger = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month, from, to } = req.query
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month)

  const sessionKey  = portalSessionKey(corporateUserId, gstin)
  const portalToken = await getValue(sessionKey)
  if (!portalToken) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: { requiresAuth: true }, responseCode: '401' })
  }

  const year    = calYear(financialYear, monthInt)
  const mm      = pad2(monthInt)
  const fromDate = from || null
  const toDate   = to   || null

  customLog(req?.LogTraceId, 'info', { message: 'getCashLedger: request', gstin, year, mm, fromDate, toDate }, 'VENDOR')
  let sandboxResp = await sandboxApi.getCashLedger(portalToken, year, mm, fromDate, toDate)
  customLog(req?.LogTraceId, 'info', { message: 'getCashLedger: response', gstin, response: sandboxResp?.data }, 'VENDOR')

  const statusCd = sandboxResp?.data?.status_cd
  if (statusCd === '0' || statusCd === 0) {
    return res.status(200).json({ status: true, message: 'No transactions found', data: { gstin, credits: 0, debits: 0, transactions: [] }, responseCode: '000' })
  }
  if (statusCd !== '1' && statusCd !== 1) {
    customLog(req?.LogTraceId, 'error', { message: 'getCashLedger: failed', gstin, response: sandboxResp?.data }, 'VENDOR')
    return res.status(200).json({ status: false, message: sandboxResp?.data?.message || 'Failed to fetch cash ledger', data: {}, responseCode: '001' })
  }

  const raw = sandboxResp?.data?.data || {}

  const transactions = (raw.tr || []).map(t => ({
    date:         t.dt        || '',
    refNo:        t.ref_no    || '',
    desc:         t.desc      || '',
    taxHead:      t.tax_head  || '',
    type:         t.tr_typ    || '',
    amount:       t.tr_typ === 'Dr' ? -(t.tr_amt ?? 0) : (t.tr_amt ?? 0),
    balanceAfter: t.bal_after ?? 0,
  }))

  const credits = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const debits  = transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)

  return res.status(200).json({
    status: true,
    message: 'Cash ledger retrieved',
    data: { gstin: raw.gstin || gstin, credits: parseFloat(credits.toFixed(2)), debits: parseFloat(debits.toFixed(2)), transactions },
    responseCode: '000',
  })
})

// ─── Ledger date formatter: DD/MM/YYYY → "19 Jan 2023" (safe for CSV/Excel) ──
// Wrap in Excel formula ="value" so Excel treats it as text, never auto-converts to date
const fmtLedgerDate = (dt) => dt ? `="${dt}"` : ''

// ─── GET /tax/gst/ledger/cash/export ─────────────────────────────────────────
exports.exportCashLedger = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month, from, to } = req.query
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month)

  const sessionKey  = portalSessionKey(corporateUserId, gstin)
  const portalToken = await getValue(sessionKey)
  if (!portalToken) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect.', data: { requiresAuth: true }, responseCode: '401' })
  }

  const year    = calYear(financialYear, monthInt)
  const mm      = pad2(monthInt)
  const fromDate = from || null
  const toDate   = to   || null

  customLog(req?.LogTraceId, 'info', { message: 'exportCashLedger: request', gstin, year, mm, fromDate, toDate }, 'VENDOR')
  let sandboxResp = await sandboxApi.getCashLedger(portalToken, year, mm, fromDate, toDate)
  customLog(req?.LogTraceId, 'info', { message: 'exportCashLedger: response', gstin, response: sandboxResp?.data }, 'VENDOR')
  const statusCd = sandboxResp?.data?.status_cd
  const raw = (statusCd === '1' || statusCd === 1) ? (sandboxResp?.data?.data || {}) : {}

  const rows = (raw.tr || []).map(t => ({
    'Date':              fmtLedgerDate(t.dt),
    'Reference No.':     t.ref_no    || '',
    'Description':       t.desc      || '',
    'Tax Head':          t.tax_head  || '',
    'Type':              t.tr_typ    || '',
    'Amount (₹)':        t.tr_typ === 'Dr' ? -(t.tr_amt ?? 0) : (t.tr_amt ?? 0),
    'Balance After (₹)': t.bal_after ?? 0,
  }))

  if (!rows.length) {
    return res.status(200).json({ status: false, message: 'No data available for export', data: {}, responseCode: '001' })
  }

  const { buffer, fileType } = await generateExcelBufferAndType(rows, 'csv')
  return res.status(200).json({ status: true, data: { buffer, fileType }, message: 'Cash ledger exported', responseCode: '000' })
})

// ─── GET /tax/gst/ledger/itc ─────────────────────────────────────────────────
exports.getItcLedger = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month, from, to } = req.query
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month)

  const sessionKey  = portalSessionKey(corporateUserId, gstin)
  const portalToken = await getValue(sessionKey)
  if (!portalToken) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: { requiresAuth: true }, responseCode: '401' })
  }

  const year    = calYear(financialYear, monthInt)
  const mm      = pad2(monthInt)
  const fromDate = from || null
  const toDate   = to   || null

  customLog(req?.LogTraceId, 'info', { message: 'getItcLedger: request', gstin, year, mm, fromDate, toDate }, 'VENDOR')
  const sandboxResp = await sandboxApi.getItcLedger(portalToken, year, mm, fromDate, toDate)
  customLog(req?.LogTraceId, 'info', { message: 'getItcLedger: response', gstin, response: sandboxResp?.data }, 'VENDOR')
  const statusCd = sandboxResp?.data?.status_cd
  if (statusCd === '0' || statusCd === 0) {
    return res.status(200).json({ status: true, message: 'No transactions found', data: { gstin, credits: 0, debits: 0, transactions: [] }, responseCode: '000' })
  }
  if (statusCd !== '1' && statusCd !== 1) {
    customLog(req?.LogTraceId, 'error', { message: 'getItcLedger: failed', gstin, response: sandboxResp?.data }, 'VENDOR')
    return res.status(200).json({ status: false, message: sandboxResp?.data?.message || 'Failed to fetch ITC ledger', data: {}, responseCode: '001' })
  }

  const raw = sandboxResp?.data?.data || {}
  const ledger = raw.itcLdgDtls || raw
  const transactions = (ledger.tr || []).map(t => ({
    date:          t.dt            || '',
    refNo:         t.ref_no        || '',
    supplierGstin: t.supp_gstin    || '',
    desc:          t.desc          || '',
    taxHead:       t.ret_period    || '',
    type:          t.tr_typ === 'Cr' ? 'Credit' : t.tr_typ === 'Dr' ? 'Debit (offset)' : (t.tr_typ || ''),
    amount:        t.tr_typ === 'Dr' ? -(t.tot_tr_amt ?? 0) : (t.tot_tr_amt ?? 0),
    balanceAfter:  t.tot_rng_bal   ?? 0,
  }))

  const credits = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const debits  = transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)

  return res.status(200).json({
    status: true, message: 'ITC ledger retrieved',
    data: { gstin: raw.gstin || gstin, credits: parseFloat(credits.toFixed(2)), debits: parseFloat(debits.toFixed(2)), transactions },
    responseCode: '000',
  })
})

// ─── GET /tax/gst/ledger/itc/export ──────────────────────────────────────────
exports.exportItcLedger = asyncHandler(async (req, res) => {
  const { gstin, financialYear, month, from, to } = req.query
  const corporateUserId = req.user.corporateId
  const monthInt = parseInt(month)

  const sessionKey  = portalSessionKey(corporateUserId, gstin)
  const portalToken = await getValue(sessionKey)
  if (!portalToken) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect.', data: { requiresAuth: true }, responseCode: '401' })
  }

  const year    = calYear(financialYear, monthInt)
  const mm      = pad2(monthInt)
  const fromDate = from || null
  const toDate   = to   || null

  customLog(req?.LogTraceId, 'info', { message: 'exportItcLedger: request', gstin, year, mm, fromDate, toDate }, 'VENDOR')
  const sandboxResp = await sandboxApi.getItcLedger(portalToken, year, mm, fromDate, toDate)
  customLog(req?.LogTraceId, 'info', { message: 'exportItcLedger: response', gstin, response: sandboxResp?.data }, 'VENDOR')
  const statusCd = sandboxResp?.data?.status_cd
  const raw = (statusCd === '1' || statusCd === 1) ? (sandboxResp?.data?.data || {}) : {}
  const ledger = raw.itcLdgDtls || raw

  const rows = (ledger.tr || []).map(t => ({
    'Date':              fmtLedgerDate(t.dt),
    'Reference No.':     t.ref_no        || '',
    'Description':       t.desc          || '',
    'Type':              t.tr_typ === 'Cr' ? 'Credit' : t.tr_typ === 'Dr' ? 'Debit (offset)' : (t.tr_typ || ''),
    'Amount (₹)':        t.tr_typ === 'Dr' ? -(t.tot_tr_amt ?? 0) : (t.tot_tr_amt ?? 0),
    'Balance After (₹)': t.tot_rng_bal   ?? 0,
  }))

  if (!rows.length) {
    return res.status(200).json({ status: false, message: 'No data available for export', data: {}, responseCode: '001' })
  }

  const { buffer, fileType } = await generateExcelBufferAndType(rows, 'csv')
  return res.status(200).json({ status: true, data: { buffer, fileType }, message: 'ITC ledger exported', responseCode: '000' })
})

// ─── GSTR-9 Annual Return ─────────────────────────────────────────────────────

// ─── GET /tax/gst/gstr9/filing?gstin= ────────────────────────────────────────
// Returns filing status keyed by financialYear so the frontend can check any year
exports.getGstr9Filing = asyncHandler(async (req, res) => {
  const { gstin } = req.query
  const corporateUserId = req.user.corporateId

  const filings = await TaxGstr9Filing.findAll({ where: { corporateUserId, gstin } })

  const filingsByYear = {}
  for (const f of filings) {
    filingsByYear[f.financialYear] = {
      filed:        f.status === 'filed',
      ackNum:       f.ackNum  || null,
      filedAt:      f.filedAt || null,
      status:       f.status  || null,
    }
  }

  return res.status(200).json({
    status:       true,
    message:      'GSTR-9 filing status fetched',
    data:         { filingsByYear },
    responseCode: '000',
  })
})

// ─── GET /tax/gst/gstr9/details?gstin=&financialYear= ────────────────────────
exports.getGstr9Details = asyncHandler(async (req, res, next) => {
  const { gstin, financialYear } = req.query
  const corporateUserId = req.user.corporateId

  const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
  if (!portalToken) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: { requiresAuth: true }, responseCode: '401' })
  }

  if (!IS_PROD) {
    const mock = require('../../utils/mockData/gstr9AutoCalculated')
    return res.status(200).json({ status: true, message: 'GSTR-9 data fetched from portal', data: { formData: mock.data.data, retPeriod: mock.data.data.fp }, responseCode: '000' })
  }

  const sbFy = financialYear

  try {
    customLog(req?.LogTraceId, 'info', { message: 'GSTR-9 getDetails request', gstin, financialYear, sbFy }, 'VENDOR')
    const sandboxResp = await sandboxApi.getGstr9Details(portalToken, sbFy)
    customLog(req?.LogTraceId, 'info', { message: 'GSTR-9 getDetails response', gstin, financialYear, response: sandboxResp?.data }, 'VENDOR')

    if (sandboxResp?.data?.status_cd === '0' || sandboxResp?.data?.status_cd === 0) {
      const errMsg = sandboxResp?.data?.error?.message || sandboxResp?.data?.message || 'Failed to fetch GSTR-9 details from portal'
      return res.status(200).json({ status: false, message: errMsg, data: { error_cd: sandboxResp?.data?.error?.error_cd || 'FETCH_FAILED' }, responseCode: '001' })
    }

    const inner     = sandboxResp?.data?.data || {}
    const retPeriod = inner.ret_period || financialYear

    return res.status(200).json({
      status: true,
      message: 'GSTR-9 data fetched from portal',
      data: { formData: inner, retPeriod },
      responseCode: '000',
    })
  } catch (err) {
    customLog(req?.LogTraceId, 'error', { message: 'GSTR-9 getDetails failed', gstin, financialYear, error: err.message, stack: err.stack }, 'VENDOR')
    return next(new ErrorResponse(err?.response?.data?.error?.message || err?.response?.data?.message || err.message || 'Something went wrong', 400))
  }
})

// ─── GET /tax/gst/gstr9/auto-calculated?gstin=&financialYear= ────────────────
exports.getGstr9AutoCalculated = asyncHandler(async (req, res, next) => {
  const { gstin, financialYear } = req.query
  const corporateUserId = req.user.corporateId

  const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
  if (!portalToken) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: { requiresAuth: true }, responseCode: '401' })
  }

  const sbFy = IS_PROD ? financialYear : SANDBOX_TEST_FY_GSTR9

  try {
    customLog(req?.LogTraceId, 'info', { message: 'GSTR-9 autoCalculated request', gstin, financialYear, sbFy }, 'VENDOR')
    const sandboxResp = await sandboxApi.getGstr9AutoCalculated(portalToken, sbFy)
    customLog(req?.LogTraceId, 'info', { message: 'GSTR-9 autoCalculated response', gstin, financialYear, response: sandboxResp?.data }, 'VENDOR')

    if (sandboxResp?.data?.status_cd === '0' || sandboxResp?.data?.status_cd === 0) {
      const errMsg = sandboxResp?.data?.error?.message || sandboxResp?.data?.message || 'Failed to fetch GSTR-9 auto-calculated details'
      return res.status(200).json({ status: false, message: errMsg, data: { raw: sandboxResp?.data }, responseCode: '001' })
    }

    return res.status(200).json({ status: true, message: 'GSTR-9 auto-calculated details fetched', data: { formData: sandboxResp?.data?.data }, responseCode: '000' })
  } catch (err) {
    customLog(req?.LogTraceId, 'error', { message: 'GSTR-9 autoCalculated failed', gstin, financialYear, error: err.message, stack: err.stack }, 'VENDOR')
    return next(new ErrorResponse(err?.response?.data?.error?.message || err?.response?.data?.message || err.message || 'Something went wrong', 400))
  }
})

// ─── POST /tax/gst/gstr9/save ─────────────────────────────────────────────────
exports.saveGstr9ToPortal = asyncHandler(async (req, res, next) => {
  const { gstin, financialYear, formData } = req.body
  const corporateUserId = req.user.corporateId

  const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
  if (!portalToken) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: { requiresAuth: true }, responseCode: '401' })
  }

  if (!formData || typeof formData !== 'object') {
    return res.status(200).json({ status: false, message: 'formData is required to save GSTR-9.', data: {}, responseCode: '001' })
  }

  const sbFy     = IS_PROD ? financialYear : SANDBOX_TEST_FY_GSTR9
  const formBody = { ...formData, gstin }

  try {
    customLog(req?.LogTraceId, 'info', { message: 'GSTR-9 save request', gstin, financialYear, sbFy, formBodyKeys: Object.keys(formBody) }, 'VENDOR')
    const sandboxResp = await sandboxApi.saveGstr9(portalToken, sbFy, formBody)
    customLog(req?.LogTraceId, 'info', { message: 'GSTR-9 save response', gstin, financialYear, response: sandboxResp?.data }, 'VENDOR')

    if (sandboxResp?.data?.status_cd !== '1' && sandboxResp?.data?.status_cd !== 1) {
      const errMsg = sandboxResp?.data?.error?.message || sandboxResp?.data?.message || 'GSTR-9 save failed'
      return res.status(200).json({ status: false, message: errMsg, data: { raw: sandboxResp?.data }, responseCode: '001' })
    }

    return res.status(200).json({ status: true, message: 'GSTR-9 saved to portal', data: {}, responseCode: '000' })
  } catch (err) {
    customLog(req?.LogTraceId, 'error', { message: 'GSTR-9 save failed', gstin, financialYear, error: err.message, stack: err.stack }, 'VENDOR')
    return next(new ErrorResponse(err?.response?.data?.error?.message || err?.response?.data?.message || err.message || 'Something went wrong', 400))
  }
})

// ─── GET /tax/gst/gstr9/section8a?gstin=&financialYear=&fileNumber= ──────────
exports.getGstr9Section8a = asyncHandler(async (req, res, next) => {
  const { gstin, financialYear, fileNumber } = req.query
  const corporateUserId = req.user.corporateId

  const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
  if (!portalToken) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: { requiresAuth: true }, responseCode: '401' })
  }

  const sbFy = IS_PROD ? financialYear : SANDBOX_TEST_FY_GSTR9

  try {
    customLog(req?.LogTraceId, 'info', { message: 'GSTR-9 section8a request', gstin, financialYear, sbFy, fileNumber }, 'VENDOR')
    const sandboxResp = await sandboxApi.getGstr9Section8a(portalToken, sbFy, fileNumber ? parseInt(fileNumber, 10) : null)
    customLog(req?.LogTraceId, 'info', { message: 'GSTR-9 section8a response', gstin, financialYear, response: sandboxResp?.data }, 'VENDOR')

    if (sandboxResp?.data?.status_cd === '0' || sandboxResp?.data?.status_cd === 0) {
      const errMsg = sandboxResp?.data?.error?.message || sandboxResp?.data?.message || 'Failed to fetch GSTR-9 Section 8A details'
      return res.status(200).json({ status: false, message: errMsg, data: { raw: sandboxResp?.data }, responseCode: '001' })
    }

    return res.status(200).json({ status: true, message: 'GSTR-9 Section 8A details fetched', data: { formData: sandboxResp?.data?.data }, responseCode: '000' })
  } catch (err) {
    customLog(req?.LogTraceId, 'error', { message: 'GSTR-9 section8a failed', gstin, financialYear, error: err.message, stack: err.stack }, 'VENDOR')
    return next(new ErrorResponse(err?.response?.data?.error?.message || err?.response?.data?.message || err.message || 'Something went wrong', 400))
  }
})

// ─── POST /tax/gst/gstr9/evc-otp ─────────────────────────────────────────────
exports.generateGstr9EvcOtp = asyncHandler(async (req, res, next) => {
  const { gstin, pan } = req.body
  const corporateUserId = req.user.corporateId

  const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
  if (!portalToken) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: { requiresAuth: true }, responseCode: '401' })
  }

  try {
    customLog(req?.LogTraceId, 'info', { message: 'GSTR-9 EVC OTP request', gstin, pan }, 'VENDOR')
    const sandboxResp = await sandboxApi.generateEvcOtp(pan, portalToken, 'gstr-9')
    customLog(req?.LogTraceId, 'info', { message: 'GSTR-9 EVC OTP response', gstin, response: sandboxResp?.data }, 'VENDOR')

    if (sandboxResp?.data?.status_cd !== '1' && sandboxResp?.data?.status_cd !== 1) {
      const errMsg = sandboxResp?.data?.error?.message || sandboxResp?.data?.message || 'Failed to generate EVC OTP'
      return res.status(200).json({ status: false, message: errMsg, data: {}, responseCode: '001' })
    }

    return res.status(200).json({ status: true, message: 'EVC OTP sent to registered mobile/email', data: {}, responseCode: '000' })
  } catch (err) {
    customLog(req?.LogTraceId, 'error', { message: 'GSTR-9 EVC OTP failed', gstin, error: err.message, stack: err.stack }, 'VENDOR')
    return next(new ErrorResponse(err?.response?.data?.error?.message || err?.response?.data?.message || err.message || 'Something went wrong', 400))
  }
})

// ─── POST /tax/gst/gstr9/file ─────────────────────────────────────────────────
exports.fileGstr9Return = asyncHandler(async (req, res, next) => {
  const { gstin, financialYear, pan, otp, formData } = req.body
  const corporateUserId = req.user.corporateId

  const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
  if (!portalToken) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: { requiresAuth: true }, responseCode: '401' })
  }

  const sbFy     = IS_PROD ? financialYear : SANDBOX_TEST_FY_GSTR9
  const formBody = formData ? { isnil: 'N', ...formData, gstin } : { gstin, isnil: 'N' }

  try {
    customLog(req?.LogTraceId, 'info', { message: 'GSTR-9 file request', formBody }, 'VENDOR')
    const sandboxResp = await sandboxApi.fileGstr9(portalToken, sbFy, pan, otp, formBody)
    customLog(req?.LogTraceId, 'info', { message: 'GSTR-9 file response', gstin, financialYear, response: sandboxResp?.data }, 'VENDOR')

    const statusCd  = sandboxResp?.data?.status_cd
    const ackNum    = sandboxResp?.data?.data?.ack_num || sandboxResp?.data?.data?.reference_id
    const isSuccess = ackNum || statusCd === '1' || statusCd === 1

    if (!isSuccess) {
      const errorCd = sandboxResp?.data?.error?.error_cd
      const errMsg  = sandboxResp?.data?.error?.message || sandboxResp?.data?.message || 'GSTR-9 filing failed'
      customLog(req?.LogTraceId, 'error', { message: 'GSTR-9 filing failed on portal', gstin, financialYear, errorCd, errMsg }, 'VENDOR')
      return res.status(200).json({ status: false, message: errMsg, data: { errorCd, raw: sandboxResp?.data }, responseCode: '001' })
    }

    const filedAt = new Date()
    const existing = await TaxGstr9Filing.findOne({ where: { corporateUserId, gstin, financialYear } })
    if (existing) {
      await existing.update({ ackNum, status: 'filed', filedAt, formData: formBody })
    } else {
      await TaxGstr9Filing.create({ corporateUserId, gstin, financialYear, ackNum, status: 'filed', filedAt, formData: formBody })
    }

    return res.status(200).json({
      status: true,
      message: 'GSTR-9 filed successfully',
      data: { ackNum, filedAt: filedAt.toISOString() },
      responseCode: '000',
    })
  } catch (err) {
    customLog(req?.LogTraceId, 'error', { message: 'GSTR-9 file failed', gstin, financialYear, error: err.message, stack: err.stack }, 'VENDOR')
    return next(new ErrorResponse(err?.response?.data?.error?.message || err?.response?.data?.message || err.message || 'Something went wrong', 400))
  }
})

// ─── GET /tax/gst/gstr9/export/pdf?gstin=&financialYear= ─────────────────────
exports.exportGstr9Pdf = asyncHandler(async (req, res) => {
  const { gstin, financialYear } = req.query
  const corporateUserId = req.user.corporateId

  const filing = await TaxGstr9Filing.findOne({ where: { corporateUserId, gstin, financialYear }, raw: true })

  if (!filing) {
    return res.status(200).json({ status: false, message: 'No GSTR-9 filing found for this period.', data: {}, responseCode: '001' })
  }

  const fmtINR = n => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fd = filing.formData || {}

  const t4   = fd.table4  || {}
  const t6   = fd.table6  || {}
  const t9   = fd.table9  || {}

  const totalOutward = t4?.sup_adv?.txval  || 0
  const totalIGST    = t4?.sup_adv?.iamt   || 0
  const totalCGST    = t4?.sup_adv?.camt   || 0
  const totalSGST    = t4?.sup_adv?.samt   || 0
  const itcAvailed   = (t6?.total_itc_availed?.iamt || 0) + (t6?.total_itc_availed?.camt || 0) + (t6?.total_itc_availed?.samt || 0)
  const taxPayable   = (t9?.iamt?.txpyble || 0) + (t9?.camt?.txpyble || 0) + (t9?.samt?.txpyble || 0)
  const taxPaidCash  = (t9?.iamt?.txpaid_cash || 0) + (t9?.camt?.txpaid_cash || 0) + (t9?.samt?.txpaid_cash || 0)

  const data = [
    { 'GSTIN': gstin, 'Financial Year': financialYear, 'Status': (filing.status || 'draft').toUpperCase(), 'ARN': filing.ackNum || '-', 'Filed At': filing.filedAt || '-',
      'Total Outward Taxable Turnover': fmtINR(totalOutward),
      'Total IGST (Outward)': fmtINR(totalIGST), 'Total CGST (Outward)': fmtINR(totalCGST), 'Total SGST (Outward)': fmtINR(totalSGST),
      'ITC Availed': fmtINR(itcAvailed), 'Tax Payable': fmtINR(taxPayable), 'Tax Paid (Cash)': fmtINR(taxPaidCash),
    },
  ]

  const reportHtmlWithStyle = reportPdfTemplate(data, { title: 'GSTR-9 Annual Return' })

  const random = new Date().valueOf()
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page    = await browser.newPage()
  await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' })
  const outputFile = `GSTR9-${random}.pdf`
  await page.pdf({ scale: 0.6, path: outputFile, format: 'A4', preferCSSPageSize: true })
  const buffer = fs.readFileSync(outputFile)
  browser.close()
  fs.unlinkSync(outputFile)

  return res.status(200).json({
    status: true, message: 'GSTR-9 PDF generated successfully',
    data: { buffer, fileType: 'application/pdf' }, responseCode: '000',
  })
})

// ─── GET /tax/gst/return-status?gstin=&year=&month=&referenceId= ──────────────
exports.getGstReturnStatus = asyncHandler(async (req, res, next) => {
  const { gstin, year, month, referenceId } = req.query
  const corporateUserId = req.user.corporateId

  const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
  if (!portalToken) {
    return res.status(200).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: { requiresAuth: true }, responseCode: '401' })
  }

  const sbYear  = IS_PROD ? parseInt(year, 10)  : SANDBOX_TEST_YEAR
  const sbMonth = IS_PROD ? parseInt(month, 10) : SANDBOX_TEST_MONTH

  try {
    customLog(req?.LogTraceId, 'info', { message: 'GST return status request', gstin, year, month, referenceId, sbYear, sbMonth }, 'VENDOR')
    const sandboxResp = await sandboxApi.getGstReturnStatus(sbYear, sbMonth, referenceId, portalToken)
    customLog(req?.LogTraceId, 'info', { message: 'GST return status response', gstin, response: sandboxResp?.data }, 'VENDOR')

    if (sandboxResp?.data?.status_cd === '0' || sandboxResp?.data?.status_cd === 0) {
      const errMsg = sandboxResp?.data?.error?.message || sandboxResp?.data?.message || 'Failed to fetch GST return status'
      return res.status(200).json({ status: false, message: errMsg, data: { raw: sandboxResp?.data }, responseCode: '001' })
    }

    return res.status(200).json({
      status: true,
      message: 'GST return status fetched',
      data: { statusData: sandboxResp?.data?.data },
      responseCode: '000',
    })
  } catch (err) {
    customLog(req?.LogTraceId, 'error', { message: 'GST return status failed', gstin, year, month, error: err.message, stack: err.stack }, 'VENDOR')
    return next(new ErrorResponse(err?.response?.data?.error?.message || err?.response?.data?.message || err.message || 'Something went wrong', 400))
  }
})

// ─── GET /tax/tds/overview — stub ─────────────────────────────────────────────
exports.getTdsOverview = asyncHandler(async (req, res) => {
  return res.status(501).json({
    status: false,
    message: 'TDS Filing is coming soon.',
    data: {},
    responseCode: '001',
  })
})

// ─── Helpers: software import ─────────────────────────────────────────────────

const IMPORT_COL_MAP = {
  // Invoice No
  invoiceno: 'invoiceNo', invoicenum: 'invoiceNo', invoicenumber: 'invoiceNo',
  voucherno: 'invoiceNo', vouchernum: 'invoiceNo',
  billno: 'invoiceNo', billnumber: 'invoiceNo',
  refno: 'invoiceNo', referenceno: 'invoiceNo',
  // Invoice Date
  invoicedate: 'invoiceDate', invoicedt: 'invoiceDate',
  date: 'invoiceDate', billdate: 'invoiceDate',
  voucherdate: 'invoiceDate', voucherdt: 'invoiceDate',
  refdate: 'invoiceDate',
  // Invoice Type
  invoicetype: 'invoiceType', type: 'invoiceType', supplytype: 'invoiceType',
  // Buyer Name
  buyername: 'buyerName', partyname: 'buyerName', customername: 'buyerName',
  clientname: 'buyerName', tradelegalnameofrecipient: 'buyerName',
  tradelegalnameofbuyerrecipient: 'buyerName',
  receiversname: 'buyerName', receivername: 'buyerName',
  // GSTIN
  buyergstin: 'buyerGstin', gstin: 'buyerGstin', partygstin: 'buyerGstin',
  customergstin: 'buyerGstin', gstinuin: 'buyerGstin',
  gstinuinofrecipient: 'buyerGstin', gstinofrecipient: 'buyerGstin',
  // HSN
  hsncode: 'hsnCode', hsn: 'hsnCode', hsnsac: 'hsnCode',
  // Place of Supply
  placeofsupply: 'placeOfSupply', statecode: 'placeOfSupply',
  state: 'placeOfSupply', pos: 'placeOfSupply',
  // Taxable Amount
  taxableamount: 'taxableAmount', taxablevalue: 'taxableAmount',
  assessablevalue: 'taxableAmount', taxableamt: 'taxableAmount',
  // CGST
  cgst: 'cgst', cgstamount: 'cgst', cgstamt: 'cgst',
  centraltaxamt: 'cgst', centraltaxamount: 'cgst', centraltax: 'cgst',
  // SGST
  sgst: 'sgst', sgstamount: 'sgst', sgstamt: 'sgst',
  stateuttaxamt: 'sgst', stateuttaxamount: 'sgst', stateuttax: 'sgst', statetax: 'sgst',
  // IGST
  igst: 'igst', igstamount: 'igst', igstamt: 'igst',
  integratedtaxamt: 'igst', integratedtaxamount: 'igst', integratedtax: 'igst',
}

const MONTH_ABBR = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' }

const normalizeCol = s => s.toLowerCase().replace(/[^a-z0-9]/g, '')

const parseImportDate = raw => {
  if (!raw) return raw
  const t = String(raw).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  const ddmm = t.match(/^(\d{1,2})[/-](\d{2})[/-](\d{4})$/)
  if (ddmm) return `${ddmm[3]}-${ddmm[2].padStart(2,'0')}-${ddmm[1].padStart(2,'0')}`
  const tally = t.match(/^(\d{1,2})[/-]([A-Za-z]{3})[/-](\d{2,4})$/)
  if (tally) {
    const mon = MONTH_ABBR[tally[2].toLowerCase()]
    if (mon) {
      const yr = tally[3].length === 2 ? `20${tally[3]}` : tally[3]
      return `${yr}-${mon}-${tally[1].padStart(2,'0')}`
    }
  }
  return t
}

const RATE_BASED = new Set(['marg', 'busy'])

const applyRatePostProcess = (items) => items.map(item => {
  const taxable = item.taxableAmount ?? 0
  return {
    ...item,
    cgst: item.cgst != null && item.cgst <= 100 ? parseFloat(((taxable * item.cgst) / 100).toFixed(2)) : item.cgst,
    sgst: item.sgst != null && item.sgst <= 100 ? parseFloat(((taxable * item.sgst) / 100).toFixed(2)) : item.sgst,
    igst: item.igst != null && item.igst <= 100 ? parseFloat(((taxable * item.igst) / 100).toFixed(2)) : item.igst,
  }
})

const parseXlsxBuffer = (buffer) => {
  const ExcelJSWb = new ExcelJS.Workbook()
  return ExcelJSWb.xlsx.load(buffer).then(wb => {
    const ws = wb.worksheets[0]
    if (!ws) return { items: [], debugHeaders: null }

    const rawRows = []
    ws.eachRow({ includeEmpty: false }, (row) => {
      rawRows.push(row.values.slice(1))
    })

    const headerRowIdx = rawRows.findIndex(row =>
      row.some(cell => IMPORT_COL_MAP[normalizeCol(String(cell ?? ''))])
    )
    if (headerRowIdx === -1) {
      console.warn('[SoftwareImport] No header row matched. First 3 rows raw:', JSON.stringify(rawRows.slice(0, 3)))
      return { items: [], debugHeaders: rawRows.slice(0, 5).map(r => r.map(c => String(c ?? ''))) }
    }

    const headers = rawRows[headerRowIdx].map(h => normalizeCol(String(h ?? '')))
    console.warn('[SoftwareImport] Raw headers:', rawRows[headerRowIdx])
    console.warn('[SoftwareImport] Normalized headers:', headers)
    console.warn('[SoftwareImport] Mapped to fields:', headers.map(h => ({ col: h, field: IMPORT_COL_MAP[h] || null })))
    const dataRows = rawRows.slice(headerRowIdx + 1)

    const items = dataRows.map(row => {
      const item = {}
      headers.forEach((normHeader, idx) => {
        const key = IMPORT_COL_MAP[normHeader]
        const val = row[idx]
        if (!key || val === '' || val == null) return
        if (['taxableAmount','cgst','sgst','igst'].includes(key)) {
          const num = parseFloat(String(val).replace(/,/g, ''))
          if (!isNaN(num)) item[key] = num
        } else if (key === 'invoiceDate') {
          item.invoiceDate = val instanceof Date
            ? val.toISOString().split('T')[0]
            : parseImportDate(String(val))
        } else {
          item[key] = String(val)
        }
      })
      return item
    }).filter((item, i) => {
      if (i < 3) console.warn(`[SoftwareImport] Row ${i}:`, JSON.stringify(item))
      return item.invoiceNo && item.invoiceDate
    })

    return { items, debugHeaders: null }
  })
}

const parseCsvBuffer = (buffer) => {
  const text = buffer.toString('utf8')
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []

  const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const mappedKeys = rawHeaders.map(h => IMPORT_COL_MAP[normalizeCol(h)] ?? null)

  const items = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const item = {}
    mappedKeys.forEach((key, idx) => {
      if (!key) return
      const val = values[idx] ?? ''
      if (!val) return
      if (['taxableAmount','cgst','sgst','igst'].includes(key)) {
        const num = parseFloat(val.replace(/,/g, ''))
        if (!isNaN(num)) item[key] = num
      } else if (key === 'invoiceDate') {
        item.invoiceDate = parseImportDate(val)
      } else {
        item[key] = val
      }
    })
    return item
  }).filter(item => item.invoiceNo && item.invoiceDate)

  return { items, debugHeaders: null }
}

const TEMPLATE_DEFS = {
  tally: {
    headers: ['Invoice No','Invoice Date','Invoice Type','Buyer Name','Buyer GSTIN','HSN/SAC','Place of Supply','Taxable Value','Central Tax Amt.','State/UT Tax Amt.','Integrated Tax Amt.'],
    sample:  ['INV-001','01-Apr-2024','B2B','ABC Pvt Ltd','27AABCU9603R1ZX','998314','27-Maharashtra','10000','900','900','0'],
    note: 'TallyPrime GSTR-1 export format. Export from: Gateway of Tally → Display More Reports → GST Reports → GSTR-1',
  },
  zoho: {
    headers: ['Invoice No','Invoice Date','Invoice Type','Customer Name','Customer GSTIN','HSN/SAC Code','Place of Supply','Taxable Amount','CGST Amount','SGST Amount','IGST Amount'],
    sample:  ['INV-001','2024-04-01','B2B','ABC Pvt Ltd','27AABCU9603R1ZX','998314','27','10000','900','900','0'],
    note: 'Zoho Books export format. Export from: Reports → GST Reports → GSTR-1',
  },
  busy: {
    headers: ['Voucher No','Voucher Date','Party Name','GSTIN','HSN Code','Place of Supply','Taxable Amount','CGST %','SGST %','IGST %'],
    sample:  ['INV-001','01/04/2024','ABC Pvt Ltd','27AABCU9603R1ZX','998314','27','10000','9','9','0'],
    note: 'Busy Accounting export format. Tax columns are percentage rates.',
  },
  marg: {
    headers: ['Bill No','Bill Date','Party Name','GSTIN','HSN Code','State','Taxable Amount','CGST %','SGST %','IGST %'],
    sample:  ['INV-001','01/04/2024','ABC Pvt Ltd','27AABCU9603R1ZX','998314','Maharashtra','10000','9','9','0'],
    note: 'MARG ERP 9+ export format. Tax columns are percentage rates.',
  },
  default: {
    headers: ['Invoice No','Invoice Date','Invoice Type','Buyer Name','Buyer GSTIN','HSN Code','Place of Supply','Taxable Amount','CGST','SGST','IGST'],
    sample:  ['INV-001','2024-04-01','B2B','ABC Pvt Ltd','27AABCU9603R1ZX','998314','27','10000','900','900','0'],
    note: 'Peko standard import format.',
  },
}

// ─── GET /gst/sales-invoices/import/template ─────────────────────────────────
const TEMPLATE_FILES = {
  tally: { file: 'Tally_Prime_Sales_Invoice_Export_Template.xlsx', name: 'Tally_Prime_Invoice_Template.xlsx' },
  zoho:  { file: 'Zoho_Sales_Invoice_Export_Templates.xlsx',       name: 'Zoho_Invoice_Template.xlsx' },
  busy:  { file: 'Busy_Accounting_Template.xlsx',                  name: 'Busy_Accounting_Invoice_Template.xlsx' },
  marg:  { file: 'MARG_ERP_9_Template.xlsx',                       name: 'MARG_ERP_Invoice_Template.xlsx' },
}

exports.getSalesInvoiceImportTemplate = asyncHandler(async (req, res) => {
  const software = (req.query.software || '').toLowerCase()
  const templateDef = TEMPLATE_FILES[software]

  if (templateDef) {
    const filePath = path.join(__dirname, '../../public/templates', templateDef.file)
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath)
      const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      return res.status(200).json({
        status: true,
        data: { buffer, fileType, fileName: templateDef.name },
        message: 'Template ready',
        responseCode: '000',
      })
    }
  }

  // Fallback: generate a generic template with ExcelJS
  const def = TEMPLATE_DEFS.default
  const workbook = new ExcelJS.Workbook()
  const ws = workbook.addWorksheet('Invoice Import')
  const headerRow = ws.addRow(def.headers)
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
    cell.alignment = { horizontal: 'center' }
  })
  ws.addRow(def.sample)
  ws.columns = def.headers.map(() => ({ width: 22 }))

  const buffer = await workbook.xlsx.writeBuffer()
  const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  return res.status(200).json({
    status: true,
    data: { buffer, fileType, fileName: 'Peko_Invoice_Template.xlsx' },
    message: 'Template generated',
    responseCode: '000',
  })
})

// ─── POST /gst/sales-invoices/import/parse ───────────────────────────────────
exports.parseSalesInvoiceImport = asyncHandler(async (req, res) => {
  const file = req.file
  if (!file) {
    return res.status(200).json({ status: false, message: 'No file uploaded.', data: {}, responseCode: '001' })
  }

  const software = (req.body.software || '').toLowerCase()
  const isXlsx = file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')
  const isCsv  = file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')

  if (!isXlsx && !isCsv) {
    return res.status(200).json({ status: false, message: 'Only CSV or Excel (.xlsx) files are supported.', data: {}, responseCode: '001' })
  }

  const { items: rawItems, debugHeaders } = isXlsx
    ? await parseXlsxBuffer(file.buffer)
    : parseCsvBuffer(file.buffer)

  let items = rawItems

  if (RATE_BASED.has(software)) {
    items = applyRatePostProcess(items)
  }

  if (!items.length) {
    return res.status(200).json({
      status: false,
      message: 'No valid invoices found. Please check the file format and required columns.',
      data: { items: [], debugHeaders },
      responseCode: '001',
    })
  }

  return res.status(200).json({
    status: true,
    message: `${items.length} invoice${items.length !== 1 ? 's' : ''} parsed successfully.`,
    data: { items },
    responseCode: '000',
  })
})
