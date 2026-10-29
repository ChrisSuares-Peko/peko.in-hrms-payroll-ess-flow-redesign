const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const {
    listAllTransactions,
    findByIdWithPayloads,
    listTransactedCorporateIds,
} = require('../../models/use-cases/cardTransaction')
const {
    TRANSACTION_DECISION,
    TRANSACTION_STATUS,
    feTransactionStatus,
    feTransactionApproval,
} = require('../../constants/jit')
const { parsePaging, last4, toNum, attachCardholders } = require('../../utils/cardHelpers')
const { getCorporatesByIds } = require('../../utils/sharedDirectory')
const { customLog } = require('../../utils/loggerHelper')

const DECISIONS = Object.values(TRANSACTION_DECISION)
const INTERNAL_STATUSES = Object.values(TRANSACTION_STATUS)
const EVENT_TYPES = ['AUTH', 'NOTIFY']

const trimmed = (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined)

const parsePositiveInt = (raw) => {
    const value = Number(raw)
    return Number.isInteger(value) && value > 0 ? value : undefined
}

const parseIntegerOrUndefined = (raw) => {
    if (raw === undefined || raw === null || raw === '') return undefined
    const value = Number(raw)
    return Number.isInteger(value) ? value : undefined
}

const attachCorporates = async (rows, req) => {
    try {
        const corporates = await getCorporatesByIds(rows.map((row) => row.corporateId), req)
        rows.forEach((row) => {
            row.corporate = row.corporateId ? corporates.get(String(row.corporateId)) || null : null
        })
    } catch (err) {
        customLog(req?.LogTraceId, 'error', {
            message: '[Internal] corporate hydration failed — rendering transaction rows without corporate identity',
            action: 'corporateCard:report:corporateHydrationFailed',
            error: err?.message,
        }, 'INTERNAL')
        rows.forEach((row) => { row.corporate = null })
    }
    return rows
}

const corporateName = (corporate) =>
    corporate?.companyName
    || corporate?.credential?.name
    || corporate?.contactPersonName
    || corporate?.name
    || null

const inheritCardholderFromCard = (rows) => {
    rows.forEach((row) => {
        if (!row.userId && row.cardIssuance?.userId) row.userId = row.cardIssuance.userId
    })
    return rows
}

const serializeReportRow = (row) => ({
    id: row.id,
    displayId: row.displayId,
    transactionUniqueId: String(row.transactionUniqueId),
    notificationUniqueId: row.notificationUniqueId ? String(row.notificationUniqueId) : null,
    corporateId: row.corporateId,
    corporateName: corporateName(row.corporate),
    userId: row.userId ? String(row.userId) : null,
    cardholderName: row.cardholder?.name ?? row.cardIssuance?.nameOnCard ?? null,
    cardIssuanceId: row.cardIssuanceId ? String(row.cardIssuanceId) : null,
    cardLast4: last4(row.cardIssuance?.maskedCardNumber),
    maskedCardNumber: row.cardIssuance?.maskedCardNumber ?? null,
    referenceNumber: row.referenceNumber ?? null,
    externalCardIdentifier: row.externalCardIdentifier ?? null,
    eventType: row.eventType,
    transactionType: row.transactionType,
    transactionMode: row.transactionMode,
    transactionAmount: toNum(row.transactionAmount) ?? 0,
    issuerWalletBalance: toNum(row.issuerWalletBalance),
    merchantName: row.merchantName ?? null,
    merchantCity: row.merchantCity ?? null,
    merchantCategoryCode: row.merchantCategoryCode ?? null,
    category: row.category ?? null,
    decision: row.decision ?? null,
    declineReason: row.declineReason ?? null,
    internalStatus: row.status,
    status: feTransactionStatus(row.decision, row.status),
    approval: feTransactionApproval(row.adminApproval),
    createdAt: row.createdAt,
    notifiedAt: row.notifiedAt,
})

exports.listTransactions = asyncHandler(async (req, res, next) => {
    const decision = trimmed(req.query.decision)?.toUpperCase()
    if (decision && !DECISIONS.includes(decision)) return next(new ErrorResponse('Invalid decision filter.', 400))

    const internalStatus = trimmed(req.query.internalStatus)?.toUpperCase()
    if (internalStatus && !INTERNAL_STATUSES.includes(internalStatus)) {
        return next(new ErrorResponse('Invalid status filter.', 400))
    }

    const eventType = trimmed(req.query.eventType)?.toUpperCase()
    if (eventType && !EVENT_TYPES.includes(eventType)) return next(new ErrorResponse('Invalid event type filter.', 400))

    const { limit, offset } = parsePaging(req)

    const { count, rows } = await listAllTransactions({
        corporateId: parsePositiveInt(req.query.corporateId),
        userId: trimmed(req.query.userId),
        cardIssuanceId: trimmed(req.query.cardIssuanceId),
        cardLast4: trimmed(req.query.cardLast4),
        decision,
        internalStatus,
        eventType,
        transactionType: parseIntegerOrUndefined(req.query.transactionType),
        category: trimmed(req.query.category),
        dateFrom: trimmed(req.query.dateFrom),
        dateTo: trimmed(req.query.dateTo),
        searchText: trimmed(req.query.searchText),
        limit,
        offset,
    })

    await attachCardholders(inheritCardholderFromCard(rows), req)
    await attachCorporates(rows, req)

    return res.status(200).json({
        status: true,
        message: 'Transactions fetched.',
        data: { count, rows: rows.map(serializeReportRow) },
        responseCode: '000',
    })
})

exports.getTransaction = asyncHandler(async (req, res, next) => {
    const id = parsePositiveInt(req.params.id)
    if (!id) return next(new ErrorResponse('A valid transaction is required.', 400))

    const row = await findByIdWithPayloads(id)
    if (!row) return next(new ErrorResponse('Transaction not found.', 404))

    await attachCardholders(inheritCardholderFromCard([row]), req)
    await attachCorporates([row], req)

    return res.status(200).json({
        status: true,
        message: 'Transaction fetched.',
        data: {
            transaction: {
                ...serializeReportRow(row),
                rawAuthPayload: row.rawAuthPayload ?? null,
                rawNotifyPayload: row.rawNotifyPayload ?? null,
            },
        },
        responseCode: '000',
    })
})

exports.listTransactionCorporates = asyncHandler(async (req, res) => {
    const ids = await listTransactedCorporateIds()
    if (!ids.length) {
        return res.status(200).json({
            status: true,
            message: 'Corporates fetched.',
            data: { corporates: [] },
            responseCode: '000',
        })
    }

    const corporates = await getCorporatesByIds(ids, req).catch((err) => {
        customLog(req?.LogTraceId, 'error', {
            message: '[Internal] corporate hydration failed for the transaction report filter',
            action: 'corporateCard:report:corporateFilterHydrationFailed',
            error: err?.message,
        }, 'INTERNAL')
        return new Map()
    })

    return res.status(200).json({
        status: true,
        message: 'Corporates fetched.',
        data: {
            corporates: ids.map((corporateId) => ({
                corporateId,
                name: corporateName(corporates.get(String(corporateId))) || `Corporate #${corporateId}`,
            })),
        },
        responseCode: '000',
    })
})
