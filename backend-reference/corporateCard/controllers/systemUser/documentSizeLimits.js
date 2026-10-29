const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { DOCUMENTS_BY_NAME } = require('../../constants/kybDocuments')
const {
    MIN_SIZE_KB,
    MAX_SIZE_KB,
    MIN_TOTAL_KB,
    MAX_TOTAL_KB,
    getMaxSizeKbMap,
    saveMaxSizeKbMap,
    getTotalLimitsKb,
    saveTotalLimitsKb,
    localLimits,
    localTotals,
} = require('../../services/documentSizeLimits')

const serialize = (limits) => {
    const defaults = localLimits()
    return Object.values(DOCUMENTS_BY_NAME)
        .filter((doc) => !doc.systemGenerated)
        .map((doc) => ({
            documentName: doc.documentName,
            label: doc.label,
            maxSizeKb: limits[doc.documentName] || defaults[doc.documentName],
            defaultMaxSizeKb: defaults[doc.documentName],
        }))
}

const body = (limits, totals) => ({
    documents: serialize(limits),
    totals: { ...totals, defaults: localTotals() },
    minSizeKb: MIN_SIZE_KB,
    maxSizeKb: MAX_SIZE_KB,
    minTotalKb: MIN_TOTAL_KB,
    maxTotalKb: MAX_TOTAL_KB,
})

exports.getDocumentSizeLimits = asyncHandler(async (req, res) => {
    const [limits, totals] = await Promise.all([
        getMaxSizeKbMap(req?.LogTraceId),
        getTotalLimitsKb(req?.LogTraceId),
    ])

    return res.status(200).json({
        status: true,
        message: 'Document size limits fetched.',
        data: body(limits, totals),
        responseCode: '000',
    })
})

exports.updateDocumentSizeLimits = asyncHandler(async (req, res, next) => {
    const wantsLimits = req.body?.limits !== undefined
    const wantsTotals = req.body?.totals !== undefined
    if (!wantsLimits && !wantsTotals) {
        return next(new ErrorResponse('Provide the document limits or the totals to update.', 400))
    }

    let limits = null
    let totals = null

    if (wantsLimits) {
        const saved = await saveMaxSizeKbMap(req.body.limits, req?.LogTraceId)
        if (saved.error) return next(new ErrorResponse(saved.error, 400))
        limits = saved.limits
    }

    if (wantsTotals) {
        const saved = await saveTotalLimitsKb(req.body.totals, req?.LogTraceId)
        if (saved.error) return next(new ErrorResponse(saved.error, 400))
        totals = saved.totals
    }

    if (!limits) limits = await getMaxSizeKbMap(req?.LogTraceId)
    if (!totals) totals = await getTotalLimitsKb(req?.LogTraceId)

    return res.status(200).json({
        status: true,
        message: 'Document size limits updated.',
        data: body(limits, totals),
        responseCode: '000',
    })
})
