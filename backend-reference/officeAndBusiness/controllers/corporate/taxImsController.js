const crypto = require('crypto')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const sandboxApi = require('../../services/sandboxApi')
const { getValue } = require('../../utils/cacheDataMethods')

const {
    createReconciliation,
    findActiveReconciliation,
} = require('../../models/use-cases/taxImsReconciliation')

const {
    upsertImsInvoices,
    findImsInvoices,
    findImsInvoiceById,
    updateImsInvoiceAction,
    findImsInvoicesByIds,
    resetImsInvoiceActions,
    autoAcceptNoaction,
    getItcEstimate,
    getImsTabCounts,
    getImsInvoiceCount,
} = require('../../models/use-cases/taxImsInvoice')

const {
    createSaveHistoryRecord,
    findSaveHistory,
} = require('../../models/use-cases/taxImsSaveHistory')

const portalSessionKey = (userId, gstin) => `gst_portal_session_${userId}_${gstin}`

// Sandbox section param → DB invoiceType
const SECTION_TYPE_MAP = {
    B2B: 'B2B', B2BA: 'B2BA',
    CN: 'B2BCN', CNA: 'B2BCNA',
    DN: 'B2BDN', DNA: 'B2BDNA',
    ECOM: 'ECOM', ECOMA: 'ECOMA',
}

// Sandbox section param → response JSON key
const SECTION_KEY_MAP = {
    B2B: 'b2b', B2BA: 'b2ba',
    CN: 'b2bcn', CNA: 'b2bcna',
    DN: 'b2bdn', DNA: 'b2bdna',
    ECOM: 'ecom', ECOMA: 'ecoma',
}

// DB invoiceType → Sandbox invdata key (for save/reset payload)
const TYPE_INVDATA_MAP = {
    B2B: 'b2b', B2BA: 'b2ba',
    B2BCN: 'b2bcn', B2BCNA: 'b2bcna',
    B2BDN: 'b2bdn', B2BDNA: 'b2bdna',
    ECOM: 'ecom', ECOMA: 'ecoma',
}

const ACTION_FROM_PORTAL = { A: 'accepted', R: 'rejected', P: 'pending', N: 'noaction' }
const ACTION_TO_PORTAL = { accepted: 'A', rejected: 'R', pending: 'P', noaction: 'N' }

const SECTIONS = ['B2B', 'B2BA', 'CN', 'CNA', 'DN', 'DNA', 'ECOM', 'ECOMA']

// Tab name → which DB invoiceTypes to show
const TAB_INVOICE_TYPES = {
    all:        ['B2B', 'B2BA', 'B2BCN', 'B2BCNA', 'B2BDN', 'B2BDNA', 'ECOM', 'ECOMA'],
    b2b:        ['B2B'],
    amendments: ['B2BA'],
    notes:      ['B2BCN', 'B2BCNA', 'B2BDN', 'B2BDNA'],
    ecom:       ['ECOM', 'ECOMA'],
}

// Sub-tab actionFilter param → DB imsAction value
const ACTION_FILTER_MAP = {
    to_review: 'noaction',
    accepted:  'accepted',
    rejected:  'rejected',
    pending:   'pending',
}


async function fetchSupplierNames(gstins) {
    const nameMap = {}
    await Promise.all(gstins.map(async (gstin) => {
        try {
            const res = await sandboxApi.searchGstin(gstin)
            nameMap[gstin] = res?.data?.data?.tradeNam || res?.data?.data?.lgnm || null
        } catch (error) {
            customLog('error', 'Failed to fetch supplier name for GSTIN: ' + gstin, { error })
        }
    }))
    return nameMap
}

function parseInvoiceDate(dateStr) {
    if (!dateStr) return null
    const [dd, mm, yyyy] = dateStr.split('-')
    return `${yyyy}-${mm}-${dd}`
}

function deriveCalendarYear(financialYear, month) {
    const startYear = parseInt(financialYear.split('-')[0])
    return month >= 4 ? startYear : startYear + 1
}

function getRawData(inv) {
    if (!inv.rawData) return {}
    return typeof inv.rawData === 'string' ? JSON.parse(inv.rawData) : inv.rawData
}

function generateRefId() {
    return 'IMS-' + crypto.randomBytes(3).toString('hex').toUpperCase()
}

// ─── GET /tax/gst/ims ─────────────────────────────────────────────────────────
exports.getImsData = asyncHandler(async (req, res) => {
    try {
        const { gstin, financialYear, month, search, tab = 'all', actionFilter, page = 1, limit = 20, refresh } = req.query
        const corporateUserId = req.user.corporateId
        const monthNum  = parseInt(month)
        const pageNum   = Math.max(1, parseInt(page))
        const limitNum  = Math.min(100, Math.max(1, parseInt(limit)))

        const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
        if (!portalToken) {
            return res.status(401).json({ status: false, message: 'GST portal session expired. Please reconnect via OTP.', data: {}, responseCode: '401' })
        }

        const calendarYear = deriveCalendarYear(financialYear, monthNum)
        const paddedMonth  = String(monthNum).padStart(2, '0')

        let record = await findActiveReconciliation(corporateUserId, gstin, financialYear, monthNum)
        if (!record) {
            record = await createReconciliation({
                corporateUserId, gstin, financialYear,
                month: monthNum, reconciliationCriteria: 'strict', status: 'succeeded',
            })
        }

        // Only fetch from sandbox on first load or explicit refresh — not on every tab/page change
        const existingCount = await getImsInvoiceCount(record.id, corporateUserId)
        if (refresh === 'true' || existingCount === 0) {
            const allRows = []
            for (const section of SECTIONS) {
                try {
                    const sectionKey = SECTION_KEY_MAP[section]
                    // Response: data.data.gstr1.[sectionKey] → array of {ctin, inv:[...], cfs}
                    const groups = (await sandboxApi.getImsInvoices(portalToken, calendarYear, paddedMonth, section))?.data?.data?.gstr1?.[sectionKey] || []

                    for (const group of groups) {
                        const supplierGstin = group.ctin || null
                        for (const inv of (group.inv || [])) {
                            const igst         = (inv.itms || []).reduce((s, i) => s + parseFloat(i.itm_det?.iamt || 0), 0)
                            const cgst         = (inv.itms || []).reduce((s, i) => s + parseFloat(i.itm_det?.camt || 0), 0)
                            const sgst         = (inv.itms || []).reduce((s, i) => s + parseFloat(i.itm_det?.samt || 0), 0)
                            const taxableAmount = (inv.itms || []).reduce((s, i) => s + parseFloat(i.itm_det?.txval || 0), 0)

                            allRows.push({
                                corporateUserId,
                                reconciliationId: record.id,
                                gstin, financialYear,
                                month:         monthNum,
                                supplierGstin,
                                supplierName:  null,
                                invoiceNo:     inv.inum   || inv.nt_num || null,
                                invoiceDate:   parseInvoiceDate(inv.idt || inv.nt_dt),
                                invoiceType:   SECTION_TYPE_MAP[section],
                                taxableAmount: parseFloat(taxableAmount.toFixed(2)),
                                igst:          parseFloat(igst.toFixed(2)),
                                cgst:          parseFloat(cgst.toFixed(2)),
                                sgst:          parseFloat(sgst.toFixed(2)),
                                totalTax:      parseFloat((igst + cgst + sgst).toFixed(2)),
                                imsAction:     ACTION_FROM_PORTAL[inv.imsactn || (inv.cflag !== 'N' ? inv.cflag : null)] || 'noaction',
                                isAutoAccepted: false,
                                rawData:       { ...inv, stin: supplierGstin },
                            })
                        }
                    }
                } catch (_) {
                    // Section has no data — skip
                }
            }
            if (allRows.length) {
                const uniqueGstins = [...new Set(allRows.map(r => r.supplierGstin).filter(Boolean))]
                const nameMap = await fetchSupplierNames(uniqueGstins)
                for (const row of allRows) {
                    if (row.supplierGstin) row.supplierName = nameMap[row.supplierGstin] || null
                }
                await upsertImsInvoices(allRows)
            }
        }

        // Read from DB with tab and action filters applied
        const invoiceTypes   = TAB_INVOICE_TYPES[tab] || TAB_INVOICE_TYPES.all
        const imsActionFilter = ACTION_FILTER_MAP[actionFilter] || null
        let invoices = await findImsInvoices(corporateUserId, record.id, { invoiceTypes, imsAction: imsActionFilter })

        // Search filter
        if (search) {
            const s = search.toLowerCase().trim()
            const matchedGstins = new Set()
            const matchedIds    = new Set()
            for (const inv of invoices) {
                if ((inv.supplierName  || '').toLowerCase().includes(s) ||
                    (inv.supplierGstin || '').toLowerCase().includes(s)) {
                    matchedGstins.add(inv.supplierGstin)
                }
                if ((inv.invoiceNo || '').toLowerCase().includes(s)) matchedIds.add(inv.id)
            }
            invoices = invoices.filter(inv => matchedGstins.has(inv.supplierGstin) || matchedIds.has(inv.id))
        }

        // Group by supplier
        const bySupplier = {}
        for (const inv of invoices) {
            const key = inv.supplierGstin || 'Unknown'
            if (!bySupplier[key]) {
                const raw = getRawData(inv)
                bySupplier[key] = {
                    supplierGstin:  inv.supplierGstin,
                    supplierName:   inv.supplierName,
                    gstr1NotFiled:  raw.srcfilstatus === 'Not Filed',
                    isItcBlocked:   raw.ispendactblocked === 'Y',
                    accepted: 0, pending: 0, rejected: 0, noaction: 0,
                    totalTax: 0,
                    invoices: [],
                }
            }
            const s = bySupplier[key]
            s[inv.imsAction] = (s[inv.imsAction] || 0) + 1
            s.totalTax = parseFloat((s.totalTax + parseFloat(inv.totalTax || 0)).toFixed(2))
            s.invoices.push(inv)
        }

        // Paginate at supplier level
        const supplierList    = Object.values(bySupplier)
        const totalSuppliers  = supplierList.length
        const paginatedSuppliers = supplierList.slice((pageNum - 1) * limitNum, pageNum * limitNum)

        const [itcEstimate, { tabCounts, actionCounts }] = await Promise.all([
            getItcEstimate(record.id, corporateUserId),
            getImsTabCounts(corporateUserId, record.id),
        ])

        const dlMonth  = monthNum === 12 ? 1 : monthNum + 1
        const dlYear   = monthNum === 12 ? calendarYear + 1 : calendarYear
        const deadline = `${dlYear}-${String(dlMonth).padStart(2, '0')}-20`

        return res.status(200).json({
            status: true,
            message: 'IMS data retrieved',
            data: {
                reconciliationId: record.id,
                suppliers:        paginatedSuppliers,
                pagination: {
                    page:           pageNum,
                    limit:          limitNum,
                    totalSuppliers,
                    totalPages:     Math.ceil(totalSuppliers / limitNum),
                },
                tabCounts,
                actionCounts,
                itcEstimate,
                totalInvoices: invoices.length,
                deadline,
            },
            responseCode: '000',
        })
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message })
        return res.status(500).json({ status: false, message: 'Something went wrong', data: {}, responseCode: '001' })
    }
})

// ─── PUT /tax/gst/ims/invoice/:id ─────────────────────────────────────────────
exports.updateImsInvoice = asyncHandler(async (req, res, next) => {
    try {
        const { imsAction } = req.body
        const invoice = await findImsInvoiceById(req.params.id, req.user.corporateId)
        if (!invoice) return next(new ErrorResponse('Invoice not found', 404))

        await updateImsInvoiceAction(req.params.id, req.user.corporateId, imsAction)
        return res.status(200).json({ status: true, message: 'Invoice action updated', data: {}, responseCode: '000' })
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message })
        return res.status(500).json({ status: false, message: 'Something went wrong', data: {}, responseCode: '001' })
    }
})

// ─── GET /tax/gst/ims/itc ─────────────────────────────────────────────────────
exports.getItcEstimateHandler = asyncHandler(async (req, res, next) => {
    try {
        const { gstin, financialYear, month } = req.query
        const corporateUserId = req.user.corporateId

        const record = await findActiveReconciliation(corporateUserId, gstin, financialYear, parseInt(month))
        if (!record) return next(new ErrorResponse('IMS session not found. Load IMS data first.', 404))

        const itcEstimate = await getItcEstimate(record.id, corporateUserId)
        return res.status(200).json({ status: true, message: 'ITC estimate retrieved', data: itcEstimate, responseCode: '000' })
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message })
        return res.status(500).json({ status: false, message: 'Something went wrong', data: {}, responseCode: '001' })
    }
})

// ─── POST /tax/gst/ims/save ───────────────────────────────────────────────────
exports.saveImsChanges = asyncHandler(async (req, res, next) => {
    try {
        const { gstin, financialYear, month } = req.body
        const corporateUserId = req.user.corporateId
        const monthNum = parseInt(month)

        const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
        if (!portalToken) {
            return res.status(401).json({ status: false, message: 'GST portal not connected.', data: {}, responseCode: '401' })
        }

        const record = await findActiveReconciliation(corporateUserId, gstin, financialYear, monthNum)
        if (!record) return next(new ErrorResponse('IMS session not found', 404))

        const invoices = await findImsInvoices(corporateUserId, record.id)

        const invdata = {}
        for (const inv of invoices) {
            const sectionKey = TYPE_INVDATA_MAP[inv.invoiceType]
            if (!sectionKey) continue
            const raw = getRawData(inv)
            if (!raw.stin) continue

            if (!invdata[sectionKey]) invdata[sectionKey] = []
            invdata[sectionKey].push({
                ...raw,
                action: ACTION_TO_PORTAL[inv.imsAction] || 'N',
                prev_status: raw.action || 'N',
            })
        }
        let portalRefId = null
        try {
            const saveRes = await sandboxApi.saveImsActions(portalToken, gstin, invdata)
            portalRefId = saveRes?.data?.data?.reference_id || null
        } catch (err) {
            customLog(req?.LogTraceId, 'error', { message: 'Sandbox save failed', error: err.message })
        }

        const counts = invoices.reduce((acc, inv) => {
            acc[inv.imsAction] = (acc[inv.imsAction] || 0) + 1
            return acc
        }, {})

        const historyRecord = await createSaveHistoryRecord({
            corporateUserId,
            reconciliationId: record.id,
            gstin,
            financialYear,
            month: monthNum,
            action: 'save',
            invoiceCount: invoices.length,
            acceptedCount: counts.accepted || 0,
            pendingCount: counts.pending || 0,
            rejectedCount: counts.rejected || 0,
            noactionCount: counts.noaction || 0,
            referenceId: portalRefId || generateRefId(),
            status: 'confirmed',
        })

        return res.status(200).json({
            status: true,
            message: 'Saved to portal successfully',
            data: {
                referenceId: historyRecord.referenceId,
                totalInvoices: invoices.length,
                acceptedCount: counts.accepted || 0,
                pendingCount: counts.pending || 0,
                rejectedCount: counts.rejected || 0,
                noactionCount: counts.noaction || 0,
            },
            responseCode: '000',
        })
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message })
        return res.status(500).json({ status: false, message: 'Something went wrong', data: {}, responseCode: '001' })
    }
})

// ─── GET /tax/gst/ims/saves ───────────────────────────────────────────────────
exports.getSaveHistory = asyncHandler(async (req, res) => {
    try {
        const { gstin, financialYear, month } = req.query
        const corporateUserId = req.user.corporateId

        const record = await findActiveReconciliation(corporateUserId, gstin, financialYear, parseInt(month))
        if (!record) return res.status(200).json({ status: true, message: 'No session yet', data: [], responseCode: '000' })

        const history = await findSaveHistory(corporateUserId, record.id)
        return res.status(200).json({ status: true, message: 'Save history retrieved', data: history, responseCode: '000' })
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message })
        return res.status(500).json({ status: false, message: 'Something went wrong', data: {}, responseCode: '001' })
    }
})

// ─── POST /tax/gst/ims/reset ──────────────────────────────────────────────────
exports.resetImsInvoices = asyncHandler(async (req, res, next) => {
    try {
        const { gstin, financialYear, month, invoiceIds } = req.body
        const corporateUserId = req.user.corporateId
        const monthNum = parseInt(month)

        if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
            return next(new ErrorResponse('invoiceIds must be a non-empty array', 400))
        }

        const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
        if (!portalToken) {
            return res.status(401).json({ status: false, message: 'GST portal not connected.', data: {}, responseCode: '401' })
        }

        const record = await findActiveReconciliation(corporateUserId, gstin, financialYear, monthNum)
        if (!record) return next(new ErrorResponse('IMS session not found', 404))

        const invoices = await findImsInvoicesByIds(invoiceIds, corporateUserId, record.id)
        if (!invoices.length) return next(new ErrorResponse('No matching invoices found', 404))

        let portalRefId = null
        const invdata = {}
        for (const inv of invoices) {
            const sectionKey = TYPE_INVDATA_MAP[inv.invoiceType]
            if (!sectionKey) continue
            const raw = getRawData(inv)
            if (!raw.stin) continue

            if (!invdata[sectionKey]) invdata[sectionKey] = []
            invdata[sectionKey].push({
                ...raw,
                action: 'N',
                prev_status: ACTION_TO_PORTAL[inv.imsAction] || 'N',
            })
        }
        try {
            const resetRes = await sandboxApi.resetImsInvoices(portalToken, gstin, invdata)
            portalRefId = resetRes?.data?.data?.reference_id || null
        } catch (err) {
            customLog(req?.LogTraceId, 'error', { message: 'Sandbox reset failed', error: err.message })
        }

        await resetImsInvoiceActions(invoiceIds, corporateUserId)

        await createSaveHistoryRecord({
            corporateUserId,
            reconciliationId: record.id,
            gstin,
            financialYear,
            month: monthNum,
            action: 'reset',
            invoiceCount: invoices.length,
            acceptedCount: 0,
            pendingCount: 0,
            rejectedCount: 0,
            noactionCount: invoices.length,
            referenceId: portalRefId || generateRefId(),
            status: 'confirmed',
        })

        return res.status(200).json({
            status: true,
            message: `${invoices.length} invoice(s) reset to noaction`,
            data: { resetCount: invoices.length },
            responseCode: '000',
        })
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message })
        return res.status(500).json({ status: false, message: 'Something went wrong', data: {}, responseCode: '001' })
    }
})

const NEXT_STEP_MAP = { A: null, P: 'follow_up', R: 'amend_gstr1a', N: null }


function buildSupplierResponse(flatInvoices) {
    const byCustomer = {}
    const summary = { totalInvoices: 0, totalTaxable: 0, totalTax: 0, acceptedCount: 0, rejectedCount: 0, pendingCount: 0, noResponseCount: 0 }

    for (const inv of flatInvoices) {
        const key = inv.customerGstin || 'Unknown'
        if (!byCustomer[key]) {
            byCustomer[key] = {
                customerGstin: inv.customerGstin,
                customerName: inv.customerName || null,
                accepted: 0, pending: 0, rejected: 0, noResponse: 0,
                invoices: [],
            }
        }
        const action = inv.customerAction
        const entry = byCustomer[key]

        if (action === 'A') entry.accepted++
        else if (action === 'R') entry.rejected++
        else if (action === 'P') entry.pending++
        else entry.noResponse++

        entry.invoices.push({ ...inv, nextStep: NEXT_STEP_MAP[action] || null })

        summary.totalInvoices++
        summary.totalTaxable = parseFloat((summary.totalTaxable + parseFloat(inv.taxableAmount || 0)).toFixed(2))
        summary.totalTax = parseFloat((summary.totalTax + parseFloat(inv.totalTax || 0)).toFixed(2))
        if (action === 'A') summary.acceptedCount++
        else if (action === 'R') summary.rejectedCount++
        else if (action === 'P') summary.pendingCount++
        else summary.noResponseCount++
    }

    return { customers: Object.values(byCustomer), summary, hasRejected: summary.rejectedCount > 0 }
}

// ─── GET /tax/gst/ims/supplier ────────────────────────────────────────────────
exports.getSupplierInvoices = asyncHandler(async (req, res) => {
    try {
        const { gstin, financialYear, month, search } = req.query
        const corporateUserId = req.user.corporateId
        const monthNum = parseInt(month)

        const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
        if (!portalToken) {
            return res.status(401).json({
                status: false,
                message: 'GST portal not connected. Please authenticate via OTP first.',
                data: { requiresAuth: true },
                responseCode: '401',
            })
        }

        let flatInvoices = []

        const calendarYear = deriveCalendarYear(financialYear, monthNum)
        const raw = await sandboxApi.getImsSalesInvoices(portalToken, calendarYear, String(monthNum).padStart(2, '0'))
        console.log("rawww", JSON.stringify(raw))
            const b2bList = raw?.data?.data?.gstr1?.b2b || []

            for (const customer of b2bList) {
                const customerGstin = customer.ctin || null
                for (const inv of (customer.inv || [])) {
                    const igst = (inv.itms || []).reduce((s, i) => s + parseFloat(i.itm_det?.iamt || 0), 0)
                    const cgst = (inv.itms || []).reduce((s, i) => s + parseFloat(i.itm_det?.camt || 0), 0)
                    const sgst = (inv.itms || []).reduce((s, i) => s + parseFloat(i.itm_det?.samt || 0), 0)
                    const taxableAmount = (inv.itms || []).reduce((s, i) => s + parseFloat(i.itm_det?.txval || 0), 0)

                    flatInvoices.push({
                        invoiceNo: inv.inum || null,
                        invoiceDate: parseInvoiceDate(inv.idt) || null,
                        invoiceType: inv.inv_typ || 'B2B',
                        customerGstin,
                        customerName: null,
                        taxableAmount: parseFloat(taxableAmount.toFixed(2)),
                        igst: parseFloat(igst.toFixed(2)),
                        cgst: parseFloat(cgst.toFixed(2)),
                        sgst: parseFloat(sgst.toFixed(2)),
                        totalTax: parseFloat((igst + cgst + sgst).toFixed(2)),
                        customerAction: inv.imsactn || null,
                    })
                }
            }

        if (search) {
            const s = search.toLowerCase().trim()
            const customerGstins = new Set()
            const invoiceNos = new Set()

            for (const inv of flatInvoices) {
                if ((inv.customerName || '').toLowerCase().includes(s) ||
                    (inv.customerGstin || '').toLowerCase().includes(s)) {
                    customerGstins.add(inv.customerGstin)
                }
                if ((inv.invoiceNo || '').toLowerCase().includes(s)) {
                    invoiceNos.add(inv.invoiceNo)
                }
            }

            flatInvoices = flatInvoices.filter(inv =>
                customerGstins.has(inv.customerGstin) || invoiceNos.has(inv.invoiceNo)
            )
        }

        return res.status(200).json({
            status: true,
            message: 'Supplier invoices retrieved',
            data: buildSupplierResponse(flatInvoices),
            responseCode: '000',
        })
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message })
        return res.status(500).json({ status: false, message: 'Something went wrong', data: {}, responseCode: '001' })
    }
})

// ─── GET /tax/gst/ims/added-back ─────────────────────────────────────────────
exports.getAddedBackLiabilities = asyncHandler(async (req, res) => {
    try {
        const { gstin, financialYear, month } = req.query
        const corporateUserId = req.user.corporateId
        const monthNum = parseInt(month)

        const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
        if (!portalToken) {
            return res.status(401).json({
                status: false,
                message: 'GST portal not connected. Please authenticate via OTP first.',
                data: { requiresAuth: true },
                responseCode: '401',
            })
        }

        const calendarYear = deriveCalendarYear(financialYear, monthNum)
        const raw = await sandboxApi.getImsAddedBackLiabilities(portalToken, calendarYear, String(monthNum).padStart(2, '0'))
        const sections = raw?.data?.data?.rejInvAddBackLiab || {}

        const liabilities = []

        for (const inv of (sections.cdnr || [])) {
            liabilities.push({
                type: 'cdnr',
                noteType: inv.ntty || null,
                invoiceNo: inv.nt_num || null,
                invoiceDate: parseInvoiceDate(inv.nt_dt) || null,
                customerGstin: inv.ctin || null,
                customerName: inv.tradenm || null,
                taxableAmount: parseFloat(inv.txval || 0),
                igst: parseFloat(inv.iamt || 0),
                cgst: parseFloat(inv.camt || 0),
                sgst: parseFloat(inv.samt || 0),
                cess: parseFloat(inv.csamt || 0),
                totalTax: parseFloat(((inv.iamt || 0) + (inv.camt || 0) + (inv.samt || 0)).toFixed(2)),
                supplyPeriod: inv.supPrd || null,
                form: inv.form || null,
                remarks: inv.remarks || null,
            })
        }

        for (const inv of (sections.b2ba || [])) {
            liabilities.push({
                type: 'b2ba',
                noteType: null,
                invoiceNo: inv.inum || null,
                invoiceDate: parseInvoiceDate(inv.idt) || null,
                originalInvoiceNo: inv.oinum || null,
                originalInvoiceDate: parseInvoiceDate(inv.oidt) || null,
                customerGstin: inv.ctin || null,
                customerName: inv.tradenm || null,
                taxableAmount: parseFloat(inv.txval || 0),
                igst: parseFloat(inv.iamt || 0),
                cgst: parseFloat(inv.camt || 0),
                sgst: parseFloat(inv.samt || 0),
                cess: parseFloat(inv.csamt || 0),
                totalTax: parseFloat(((inv.iamt || 0) + (inv.camt || 0) + (inv.samt || 0)).toFixed(2)),
                supplyPeriod: inv.supPrd || null,
                form: inv.form || null,
                remarks: inv.remarks || null,
            })
        }

        for (const inv of (sections.cdnra || [])) {
            liabilities.push({
                type: 'cdnra',
                noteType: inv.ntty || null,
                invoiceNo: inv.nt_num || null,
                invoiceDate: parseInvoiceDate(inv.nt_dt) || null,
                originalInvoiceNo: inv.ont_num || null,
                originalInvoiceDate: parseInvoiceDate(inv.ont_dt) || null,
                customerGstin: inv.ctin || null,
                customerName: inv.tradenm || null,
                taxableAmount: parseFloat(inv.txval || 0),
                igst: parseFloat(inv.iamt || 0),
                cgst: parseFloat(inv.camt || 0),
                sgst: parseFloat(inv.samt || 0),
                cess: parseFloat(inv.csamt || 0),
                totalTax: parseFloat(((inv.iamt || 0) + (inv.camt || 0) + (inv.samt || 0)).toFixed(2)),
                supplyPeriod: inv.supPrd || null,
                form: inv.form || null,
                remarks: inv.remarks || null,
            })
        }

        for (const inv of (sections.ecoma || [])) {
            liabilities.push({
                type: 'ecoma',
                noteType: null,
                invoiceNo: inv.inum || null,
                invoiceDate: parseInvoiceDate(inv.idt) || null,
                originalInvoiceNo: inv.oinum || null,
                originalInvoiceDate: parseInvoiceDate(inv.oidt) || null,
                customerGstin: inv.rtin || null,
                customerName: inv.rtinNam || null,
                taxableAmount: parseFloat(inv.txval || 0),
                igst: parseFloat(inv.iamt || 0),
                cgst: parseFloat(inv.camt || 0),
                sgst: parseFloat(inv.samt || 0),
                cess: parseFloat(inv.csamt || 0),
                totalTax: parseFloat(((inv.iamt || 0) + (inv.camt || 0) + (inv.samt || 0)).toFixed(2)),
                supplyPeriod: inv.supPrd || null,
                form: inv.form || null,
                remarks: inv.remarks || null,
            })
        }

        return res.status(200).json({
            status: true,
            message: 'Added-back liabilities retrieved',
            data: { liabilities, totalCount: liabilities.length },
            responseCode: '000',
        })
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message })
        return res.status(500).json({ status: false, message: 'Something went wrong', data: {}, responseCode: '001' })
    }
})

// ─── POST /tax/gst/ims/proceed ────────────────────────────────────────────────
exports.proceedIms = asyncHandler(async (req, res, next) => {
    try {
        const { gstin, financialYear, month } = req.body
        const corporateUserId = req.user.corporateId
        const monthNum = parseInt(month)

        const portalToken = await getValue(portalSessionKey(corporateUserId, gstin))
        if (!portalToken) {
            return res.status(401).json({ status: false, message: 'GST portal not connected.', data: {}, responseCode: '401' })
        }

        const record = await findActiveReconciliation(corporateUserId, gstin, financialYear, monthNum)
        if (!record) return next(new ErrorResponse('IMS session not found', 404))

        const invoices = await findImsInvoices(corporateUserId, record.id)
        const noactionInvoices = invoices.filter(inv => inv.imsAction === 'noaction')

        if (noactionInvoices.length > 0) {
            const invdata = {}
            for (const inv of noactionInvoices) {
                const sectionKey = TYPE_INVDATA_MAP[inv.invoiceType]
                if (!sectionKey) continue
                const raw = getRawData(inv)
                if (!raw.stin) continue

                if (!invdata[sectionKey]) invdata[sectionKey] = []
                invdata[sectionKey].push({
                    ...raw,
                    action: 'A',
                    prev_status: raw.action || 'N',
                })
            }
            try {
                await sandboxApi.saveImsActions(portalToken, gstin, invdata)
            } catch (err) {
                customLog(req?.LogTraceId, 'error', { message: 'Sandbox proceed save failed', error: err.message })
            }
        }

        await autoAcceptNoaction(record.id, corporateUserId)
        const itcEstimate = await getItcEstimate(record.id, corporateUserId)

        return res.status(200).json({
            status: true,
            message: 'Unreviewed invoices auto-accepted. Ready to proceed to GSTR-3B.',
            data: { itcEstimate },
            responseCode: '000',
        })
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message })
        return res.status(500).json({ status: false, message: 'Something went wrong', data: {}, responseCode: '001' })
    }
})
