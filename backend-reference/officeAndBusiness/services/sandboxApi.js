const axios = require('axios')
const { getValue, setValue } = require('../utils/cacheDataMethods')
const { findServiceOperatorByAccessKey } = require('../utils/checkAndFetchServiceDetails')
const { customLog } = require('../utils/loggerHelper')

const ACCESS_KEY  = 'tax_and_more_gst'
const TOKEN_KEY   = 'sandbox_access_token'
const TOKEN_TTL   = 82800 // 23 hrs — token valid 24h, refresh 1h early

async function getVendorConfig() {
  const service = await findServiceOperatorByAccessKey(ACCESS_KEY)
  if (service.error) throw new Error(`Sandbox vendor not configured: ${service.error}`)
  const { apiUrl, optional1: apiKey, optional2: apiSecret, optional3: apiVersion } = service.vendor
  customLog(null, 'info', { message: 'Vendor config loaded', apiUrl, apiVersion: apiVersion || '1.0' }, 'VENDOR')
  return { apiUrl, apiKey, apiSecret, apiVersion: apiVersion || '1.0' }
}

async function getAccessToken() {
  const cached = await getValue(TOKEN_KEY)
  if (cached) return cached

  const { apiUrl, apiKey, apiSecret } = await getVendorConfig()
  customLog(null, 'info', { message: 'Sandbox authenticate request', url: `${apiUrl}/authenticate` }, 'VENDOR')
  try {
    const res = await axios.post(`${apiUrl}/authenticate`, {}, {
      headers: {
        'x-api-key':     apiKey,
        'x-api-secret':  apiSecret,
        'x-api-version': '1.0.0',
        'Content-Type':  'application/json',
      },
    })
    customLog(null, 'info', { message: 'Sandbox authenticate response', status: res.status }, 'VENDOR')

    const token = res.data.data.access_token
    await setValue(TOKEN_KEY, TOKEN_TTL, token)
    return token
  } catch (err) {
    customLog(null, 'error', { message: 'Sandbox authenticate failed', error: err.message, response: err?.response?.data }, 'VENDOR')
    throw err
  }
}

async function buildHeaders(token, useCache = false) {
  const { apiKey, apiVersion } = await getVendorConfig()
  const headers = {
    'authorization':  token,
    'x-api-key':      apiKey,
    'x-api-version':  apiVersion,
    'x-source':       'primary',
    'Content-Type':   'application/json',
  }
  if (useCache) headers['x-accept-cache'] = 'true'
  return headers
}

async function sandboxGet(path, params = {}, overrideToken = null) {
  const { apiUrl } = await getVendorConfig()
  const token = overrideToken || await getAccessToken()
  customLog(null, 'info', { message: 'Sandbox GET request', path, params }, 'VENDOR')
  try {
    const res = await axios.get(`${apiUrl}${path}`, {
      params,
      headers: await buildHeaders(token),
    })
    customLog(null, 'info', { message: 'Sandbox GET response', path, response: res.data }, 'VENDOR')
    return res.data
  } catch (err) {
    customLog(null, 'error', { message: 'Sandbox GET failed', path, params, error: err.message, response: err?.response?.data }, 'VENDOR')
    throw err
  }
}

async function sandboxPost(path, body = {}, params = {}, useCache = false, overrideToken = null) {
  const { apiUrl } = await getVendorConfig()
  const token = overrideToken || await getAccessToken()
  customLog(null, 'info', { message: 'Sandbox POST request', path, params, body }, 'VENDOR')
  try {
    const res = await axios.post(`${apiUrl}${path}`, body, {
      params,
      headers: await buildHeaders(token, useCache),
    })
    customLog(null, 'info', { message: 'Sandbox POST response', path, response: res.data }, 'VENDOR')
    return res.data
  } catch (err) {
    customLog(null, 'error', { message: 'Sandbox POST failed', path, params, body, error: err.message, response: err?.response?.data }, 'VENDOR')
    throw err
  }
}

// ─── GST Compliance ──────────────────────────────────────────────────────────

exports.searchGstin = (gstin) =>
  sandboxPost('/gst/compliance/public/gstin/search', { gstin }, {}, true)

exports.trackGstReturns = (gstin, financialYear, gstr = null) =>
  sandboxPost(
    '/gst/compliance/public/gstrs/track',
    { gstin },
    { financial_year: financialYear, ...(gstr && { gstr }) },
    true
  )

exports.searchByPan = (pan, stateCode) =>
  sandboxPost('/gst/compliance/public/pan/search', { pan }, stateCode ? { state_code: stateCode } : {}, true)

// ─── KYC ─────────────────────────────────────────────────────────────────────

exports.verifyPan = (pan, name, dob) =>
  sandboxPost('/kyc/pan/verify', {
    '@entity': 'in.co.sandbox.kyc.pan_verification.request',
    pan,
    name_as_per_pan: name,
    date_of_birth: dob,
    consent: 'Y',
    reason: 'For onboarding customers',
  })

// ─── GST Analytics — GSTR-2A Reconciliation ─────────────────────────────────

// ─── GST Compliance — Taxpayer Portal Auth ───────────────────────────────────

exports.generateGstPortalOtp = (gstin, username) =>
  sandboxPost('/gst/compliance/tax-payer/otp', {
    '@entity': 'in.co.sandbox.gst.compliance.taxpayer.otp.request',
    gstin,
    username,
  })

exports.authenticateGstPortal = (gstin, otp, username) =>
  sandboxPost('/gst/compliance/tax-payer/otp/verify', { gstin, username }, { otp })

// ─── GST Compliance — GSTR-1 Filing (taxpayer-authenticated) ─────────────────

async function sandboxPostWithPortalToken(path, body, portalToken, params = {}) {
  const { apiUrl, apiKey, apiVersion } = await getVendorConfig()
  customLog(null, 'info', { message: 'Sandbox POST (portal token) request', path, params, body }, 'VENDOR')
  try {
    const res = await axios.post(`${apiUrl}${path}`, body, {
      params,
      headers: {
        'authorization':  portalToken,
        'x-api-key':      apiKey,
        'x-api-version':  apiVersion,
        'Content-Type':   'application/json',
      },
    })
    customLog(null, 'info', { message: 'Sandbox POST (portal token) response', path, response: res.data }, 'VENDOR')
    return res.data
  } catch (err) {
    customLog(null, 'error', { message: 'Sandbox POST (portal token) failed', path, params, body, error: err.message, response: err?.response?.data }, 'VENDOR')
    throw err
  }
}

async function sandboxGetWithPortalToken(path, portalToken, params = {}) {
  const { apiUrl, apiKey, apiVersion } = await getVendorConfig()
  customLog(null, 'info', { message: 'Sandbox GET (portal token) request', path, params }, 'VENDOR')
  try {
    const res = await axios.get(`${apiUrl}${path}`, {
      params,
      headers: {
        'authorization':  portalToken,
        'x-api-key':      apiKey,
        'x-api-version':  apiVersion,
      },
    })
    customLog(null, 'info', { message: 'Sandbox GET (portal token) response', path, response: res.data }, 'VENDOR')
    return res.data
  } catch (err) {
    customLog(null, 'error', { message: 'Sandbox GET (portal token) failed', path, params, error: err.message, response: err?.response?.data }, 'VENDOR')
    throw err
  }
}


exports.generateEvcOtp = (pan, portalToken, gstrType = 'gstr-1') =>
  sandboxPostWithPortalToken('/gst/compliance/tax-payer/evc/otp', { pan }, portalToken, { gstr: gstrType })

exports.saveGstr1 = (gstin, year, month, portalToken, gstr1Data) =>
  sandboxPostWithPortalToken(
    `/gst/compliance/tax-payer/gstrs/gstr-1/${year}/${month}`,
    gstr1Data,
    portalToken
  )

exports.getGstr1SummaryLong = (gstin, year, month, portalToken) =>
  sandboxGetWithPortalToken(
    `/gst/compliance/tax-payer/gstrs/gstr-1/${year}/${month}`,
    portalToken,
    { summary_type: 'long' }
  )

exports.fileGstr1 = (gstin, year, month, pan, otp, portalToken, secSummary) =>
  sandboxPostWithPortalToken(
    `/gst/compliance/tax-payer/gstrs/gstr-1/${year}/${month}/file`,
    secSummary,
    portalToken,
    { pan, otp }
  )

exports.resetGstr1 = (gstin, year, month, retPeriod, portalToken) =>
  sandboxPostWithPortalToken(
    `/gst/compliance/tax-payer/gstrs/gstr-1/${year}/${month}/reset`,
    { gstin, ret_period: retPeriod },
    portalToken
  )

// ─── GST Compliance — GSTR-3B Filing ─────────────────────────────────────────

exports.getGstr3bDetails = (gstin, year, month, portalToken) =>
  sandboxGetWithPortalToken(`/gst/compliance/tax-payer/gstrs/gstr-3b/${year}/${month}`, portalToken)

exports.saveGstr3b = (gstin, year, month, portalToken, formBody) =>
  sandboxPostWithPortalToken(`/gst/compliance/tax-payer/gstrs/gstr-3b/${year}/${month}`, formBody, portalToken)

exports.getGstr3bAutoLiability = (gstin, year, month, portalToken) =>
  sandboxGetWithPortalToken(`/gst/compliance/tax-payer/gstrs/gstr-3b/${year}/${month}/auto-liability-calc`, portalToken)

exports.validateGstr3b = (gstin, year, month, portalToken, formBody, pan = null, otp = null) =>
  sandboxPostWithPortalToken(
    `/gst/compliance/tax-payer/gstrs/gstr-3b/${year}/${month}/validate`,
    formBody,
    portalToken,
    pan && otp ? { pan, otp } : {}
  )

exports.offsetGstr3bLiability = (gstin, year, month, portalToken, offsetBody) =>
  sandboxPostWithPortalToken(`/gst/compliance/tax-payer/gstrs/gstr-3b/${year}/${month}/offset-liability`, offsetBody, portalToken)

exports.proceedToFileGstr3b = (year, month, portalToken, gstin, retPeriod, isNil = false, pan = null, otp = null) =>
  sandboxPostWithPortalToken(
    `/gst/compliance/tax-payer/gstrs/gstr-3b/${year}/${month}/file`,
    { gstin, ret_period: retPeriod },
    portalToken,
    { is_nil: isNil ? 'Y' : 'N', ...(pan && otp ? { pan, otp } : {}) }
  )

exports.getCashLedger = (portalToken, from = null, to = null) =>
  sandboxGetWithPortalToken('/gst/compliance/tax-payer/ledgers/cash', portalToken, from && to ? { from, to } : {})

exports.getItcLedger = (portalToken, from = null, to = null) =>
  sandboxGetWithPortalToken('/gst/compliance/tax-payer/ledgers/itc', portalToken, from && to ? { from, to } : {})

exports.getReturnLiabilityLedger = (year, month, portalToken) =>
  sandboxGetWithPortalToken(`/gst/compliance/tax-payer/ledgers/tax/${year}/${month}`, portalToken)

// ─── GST Analytics — GSTR-2A Reconciliation ─────────────────────────────────

exports.submitReconcileJob = (gstin, year, month, reconciliationCriteria) =>
  sandboxPost('/gst/analytics/gstr-2a-reconciliation', {
    '@entity': 'in.co.sandbox.gst.analytics.gstr-2a_reconciliation.request',
    gstin,
    year,
    month,
    reconciliation_criteria: reconciliationCriteria,
  })

exports.pollReconcileJob = (jobId) =>
  sandboxGet('/gst/analytics/gstr-2a-reconciliation', { job_id: jobId })

// ─── GSTR-2B ──────────────────────────────────────────────────────────────────

exports.getGstr2b = (gstin, year, month, portalToken, fileNumber = null) =>
  sandboxGetWithPortalToken(
    `/gst/compliance/tax-payer/gstrs/gstr-2b/${year}/${month}`,
    portalToken,
    fileNumber !== null ? { file_number: fileNumber } : {}
  )

exports.regenerateGstr2b = (year, month, portalToken) =>
  sandboxPostWithPortalToken(
    `/gst/compliance/tax-payer/gstrs/gstr-2b/${year}/${month}/regenerate`,
    {},
    portalToken
  )

exports.getGstr2bRegenStatus = (portalToken) =>
  sandboxGetWithPortalToken('/gst/compliance/tax-payer/gstrs/gstr-2b/regenerate', portalToken)

// ─── IMS — Supplier View APIs ─────────────────────────────────────────────────

exports.getImsSalesInvoices = (portalToken, year, month) =>
  sandboxGet(`/gst/compliance/tax-payer/invoices/${year}/${month}/sales`, {}, portalToken)

exports.getImsAddedBackLiabilities = (portalToken, year, month) =>
  sandboxGet(`/gst/compliance/tax-payer/invoices/added-back-liabilities/${year}/${month}`, {}, portalToken)

// ─── IMS — Taxpayer Portal APIs ──────────────────────────────────────────────

exports.getImsInvoiceCount = (portalToken, typeOfGoods = 'others') =>
  sandboxGet('/gst/compliance/tax-payer/invoices/count', { type_of_goods: typeOfGoods }, portalToken)

exports.getImsInvoices = (portalToken, year, month, section) =>
  sandboxGet(`/gst/compliance/tax-payer/invoices/${year}/${month}/sales`, { section, return_type: 'gstr-1' }, portalToken)

exports.saveImsActions = (portalToken, rtin, invdata) =>
  sandboxPost('/gst/compliance/tax-payer/invoices/status/save', { rtin, reqtyp: 'SAVE', invdata }, {}, false, portalToken)

exports.getImsSaveStatus = (portalToken) =>
  sandboxGet('/gst/compliance/tax-payer/invoices/status', {}, portalToken)

exports.resetImsInvoices = (portalToken, rtin, invdata) =>
  sandboxPost('/gst/compliance/tax-payer/invoices/status/reset', { rtin, reqtyp: 'RESET', invdata }, {}, false, portalToken)

// ─── Cash & ITC Balance Ledger ────────────────────────────────────────────────
exports.getCashItcBalance = (portalToken, year, month) =>
  sandboxGetWithPortalToken(`/gst/compliance/tax-payer/ledgers/bal/${year}/${month}`, portalToken)

// ─── Return Liability Ledger ──────────────────────────────────────────────────
exports.getReturnLiability = (portalToken, year, month, from, to) =>
  sandboxGetWithPortalToken(`/gst/compliance/tax-payer/ledgers/tax/${year}/${month}`, portalToken, { from, to })

// ─── Cash Ledger Transactions ─────────────────────────────────────────────────
exports.getCashLedger = (portalToken, year, month, from, to, taxHead = null) =>
  sandboxGetWithPortalToken(
    `/gst/compliance/tax-payer/ledgers/cash/${year}/${month}`,
    portalToken,
    { from, to, ...(taxHead ? { tax_head: taxHead } : {}) }
  )

// ─── ITC Ledger Transactions ──────────────────────────────────────────────────
exports.getItcLedger = (portalToken, year, month, from, to, taxHead = null) =>
  sandboxGetWithPortalToken(
    `/gst/compliance/tax-payer/ledgers/itc/${year}/${month}`,
    portalToken,
    { from, to, ...(taxHead ? { tax_head: taxHead } : {}) }
  )

// ─── GST Compliance — GSTR-9 Annual Return ───────────────────────────────────
// fy = financial year string e.g. '2023-24' (the 'FY ' prefix is added here)

exports.getGstr9Details = (portalToken, fy) =>
  sandboxGetWithPortalToken('/gst/compliance/tax-payer/gstrs/gstr-9', portalToken, { financial_year: `FY ${fy}` })

exports.getGstr9AutoCalculated = (portalToken, fy) =>
  sandboxGetWithPortalToken('/gst/compliance/tax-payer/gstrs/gstr-9/auto-calculated', portalToken, { financial_year: `FY ${fy}` })

exports.getGstr9Section8a = (portalToken, fy, fileNumber = null) =>
  sandboxGetWithPortalToken('/gst/compliance/tax-payer/gstrs/gstr-9/table-8a', portalToken, {
    financial_year: `FY ${fy}`,
    ...(fileNumber !== null ? { file_number: fileNumber } : {}),
  })

exports.saveGstr9 = (portalToken, fy, formBody) =>
  sandboxPostWithPortalToken('/gst/compliance/tax-payer/gstrs/gstr-9/save', formBody, portalToken, { financial_year: `FY ${fy}` })

exports.fileGstr9 = (portalToken, fy, pan, otp, formBody) =>
  sandboxPostWithPortalToken('/gst/compliance/tax-payer/gstrs/gstr-9/file', formBody || {}, portalToken, { financial_year: `FY ${fy}`, pan, otp })