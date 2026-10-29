const router = require('express').Router({ mergeParams: true })

const {
  getSalesInvoiceImportTemplate,
  parseSalesInvoiceImport,
  getOverview,
  setupGst,
  getSetups,
  getSalesInvoices,
  addSalesInvoice,
  updateSalesInvoiceById,
  deleteSalesInvoiceById,
  syncInvoicesFromPeko,
  getGstr1Months,
  getGstr1Summary,
  markGstr1Filed,
  getAmendments,
  addAmendments,
  deleteAmendment,
  addGstr1HsnManual,
  deleteGstr1HsnManual,
  addGstr1Document,
  deleteGstr1Document,
  searchGstin,
  searchByPan,
  verifyPanKyc,
  generateGstPortalOtp,
  authenticateGstPortal,
  getPortalSession,
  getTdsOverview,
  getCashItcBalance,
  getReturnLiability,
  getCashLedger,
  exportCashLedger,
  getItcLedger,
  exportItcLedger,
  fetchGstr2b,
  regenerateGstr2b,
  getGstr2bRegenStatus,
  markGstr2bReconciled,
  getGstr2bReconciliationStatus,
  exportGstr2bCsv,
  downloadReconciliationReport,
  saveGstr1ToPortal,
  getGstr1PortalSummary,
  generateGstrEvcOtp,
  fileGstr1Return,
  resetGstr1Return,
  getGstr3bDetails,
  updateGstr3bFormData,
  saveGstr3bToPortal,
  validateGstr3bReturn,
  getGstr3bAutoLiabilityCalc,
  getGstr3bLedgers,
  offsetGstr3bLiability,
  fileGstr3bReturn,
  getGstr3bFiling,
  exportGstr3bPdf,
  getFilingHistory,
  getGstr9Details,
  getGstr9AutoCalculated,
  getGstr9Section8a,
  saveGstr9ToPortal,
  generateGstr9EvcOtp,
  fileGstr9Return,
  getGstr9Filing,
  exportGstr9Pdf,
  getGstReturnStatus,
} = require('../../../../controllers/corporate/taxAndMore')

const upload = require('../../../../middlewares/multer')

const {
  validateGstSetup,
  validateAddSalesInvoices,
  validateUpdateSalesInvoice,
  validateGstinSearch,
  validateVerifyPan,
  validateGstPortalOtp,
  validateGstPortalAuth,
  validateGstrEvcOtp,
  validateAddAmendments,
} = require('../../../../utils/apiValidation')

// ─── Overview ─────────────────────────────────────────────────────────────────
router.get('/overview', getOverview)

// ─── KYC ─────────────────────────────────────────────────────────────────────
router.post('/kyc/verify-pan', validateVerifyPan, verifyPanKyc)

// ─── GST Setup ────────────────────────────────────────────────────────────────
router.get('/gst/setup',        getSetups)
router.post('/gst/setup',       validateGstSetup,     setupGst)

// ─── Step 1 — Sales Invoices (GSTR-1 data) ───────────────────────────────────
router.get('/gst/sales-invoices/import/template',              getSalesInvoiceImportTemplate)
router.post('/gst/sales-invoices/import/parse', upload.single('file'), parseSalesInvoiceImport)
router.get('/gst/sales-invoices',                   getSalesInvoices)
router.post('/gst/sales-invoices',                  validateAddSalesInvoices,   addSalesInvoice)
router.post('/gst/sales-invoices/sync-from-peko',                               syncInvoicesFromPeko)
router.put('/gst/sales-invoices/:id',               validateUpdateSalesInvoice, updateSalesInvoiceById)
router.delete('/gst/sales-invoices/:id',                                        deleteSalesInvoiceById)

// ─── GSTR-1 Filing ───────────────────────────────────────────────────────────
router.get('/gst/gstr1/months',              getGstr1Months)
router.get('/gst/gstr1/summary',             getGstr1Summary)
router.post('/gst/gstr1/mark-filed',         markGstr1Filed)
router.post('/gst/gstr1/hsn',                addGstr1HsnManual)
router.delete('/gst/gstr1/hsn/:id',          deleteGstr1HsnManual)
router.post('/gst/gstr1/documents',          addGstr1Document)
router.delete('/gst/gstr1/documents/:id',    deleteGstr1Document)

// ─── Amendments ───────────────────────────────────────────────────────────────
router.get('/gst/amendments',          getAmendments)
router.post('/gst/amendments',         validateAddAmendments, addAmendments)
router.delete('/gst/amendments/:id',   deleteAmendment)

// ─── Step 3 — IMS (Invoice Management System) ────────────────────────────────
router.use('/gst/ims', require('./taxIms'))

// ─── GSTIN Search ─────────────────────────────────────────────────────────────
router.post('/gst/gstin/search',   validateGstinSearch,  searchGstin)
router.post('/gst/pan/search',                           searchByPan)

// ─── GST Portal Session (OTP-based, 6-hr session) ─────────────────────────────
router.post('/gst/portal/otp',          validateGstPortalOtp,  generateGstPortalOtp)
router.post('/gst/portal/authenticate', validateGstPortalAuth, authenticateGstPortal)
router.get('/gst/portal/session',                              getPortalSession)

// ─── GSTR-1 Portal Filing ─────────────────────────────────────────────────────
router.post('/gst/gstr1/portal-save',   saveGstr1ToPortal)
router.get('/gst/gstr1/portal-summary', getGstr1PortalSummary)
router.post('/gst/gstr1/evc-otp',       validateGstrEvcOtp, generateGstrEvcOtp)
router.post('/gst/gstr1/file',          fileGstr1Return)
router.post('/gst/gstr1/reset',         resetGstr1Return)

// ─── Cash & ITC Balance Ledger ───────────────────────────────────────────────
router.get('/gst/ledger/balance',    getCashItcBalance)
router.get('/gst/ledger/liability',  getReturnLiability)
router.get('/gst/ledger/cash',        getCashLedger)
router.get('/gst/ledger/cash/export', exportCashLedger)
router.get('/gst/ledger/itc',         getItcLedger)
router.get('/gst/ledger/itc/export',  exportItcLedger)

// ─── GSTR-2B Purchase Register ───────────────────────────────────────────────
router.get('/gst/gstr2b',                       fetchGstr2b)
router.post('/gst/gstr2b/regenerate',           regenerateGstr2b)
router.get('/gst/gstr2b/regen-status',          getGstr2bRegenStatus)
router.post('/gst/gstr2b/mark-reconciled',      markGstr2bReconciled)
router.get('/gst/gstr2b/reconciliation-status', getGstr2bReconciliationStatus)
router.get('/gst/gstr2b/export/:type',          exportGstr2bCsv)
router.get('/gst/gstr2b/reconciliation-report', downloadReconciliationReport)

// ─── GSTR-3B Filing ───────────────────────────────────────────────────────────
router.get('/gst/gstr3b/details',        getGstr3bDetails)
router.get('/gst/gstr3b/filing',         getGstr3bFiling)
router.put('/gst/gstr3b/form-data',      updateGstr3bFormData)
router.post('/gst/gstr3b/save',          saveGstr3bToPortal)
router.post('/gst/gstr3b/validate',      validateGstr3bReturn)
router.get('/gst/gstr3b/auto-liability', getGstr3bAutoLiabilityCalc)
router.get('/gst/gstr3b/ledgers',        getGstr3bLedgers)
router.post('/gst/gstr3b/offset',        offsetGstr3bLiability)
router.post('/gst/gstr3b/file',          fileGstr3bReturn)
router.get('/gst/gstr3b/export/pdf',     exportGstr3bPdf)

// ─── GSTR-9 Annual Return ─────────────────────────────────────────────────────
router.get('/gst/gstr9/filing',           getGstr9Filing)
router.get('/gst/gstr9/details',          getGstr9Details)
router.get('/gst/gstr9/auto-calculated',  getGstr9AutoCalculated)
router.get('/gst/gstr9/section8a',        getGstr9Section8a)
router.post('/gst/gstr9/save',            saveGstr9ToPortal)
router.post('/gst/gstr9/evc-otp',         validateGstrEvcOtp, generateGstr9EvcOtp)
router.post('/gst/gstr9/file',            fileGstr9Return)
router.get('/gst/gstr9/export/pdf',       exportGstr9Pdf)

// ─── Filing History ───────────────────────────────────────────────────────────
router.get('/gst/filing-history', getFilingHistory)

// ─── GST Return Status ────────────────────────────────────────────────────────
router.get('/gst/return-status', getGstReturnStatus)

// ─── TDS stub ─────────────────────────────────────────────────────────────────
router.get('/tds/overview', getTdsOverview)

module.exports = router
