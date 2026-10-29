const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { findById, setAdminApproval, listTransactions, getMonthlySummary } = require('../../models/use-cases/cardTransaction')
const { feTransactionStatus, FE_STATUS_FILTERS, TRANSACTION_APPROVAL, feTransactionApproval } = require('../../constants/jit')
const { PERMISSION_DENIED } = require('../../constants/messages')
const { parsePaging, isAdmin, MONTH_REGEX, last4, toNum, toCsv, attachCardholders, monthRangeUtc, actorCredentialId, resolveScope, rowBelongsToCardholder } = require('../../utils/cardHelpers')
const { searchCardUserIds } = require('../../utils/sharedDirectory')

const EXPORT_MAX_ROWS = 10000

const serializeTransaction = (row) => ({
    id: row.id,
    displayId: row.displayId,
    transactionUniqueId: String(row.transactionUniqueId),
    parentTransactionId: row.parentTransactionId ?? null,
    userId: row.userId,
    cardholderName: row.cardholder?.name ?? null,
    maskedCardNumber: row.cardIssuance?.maskedCardNumber ?? null,
    merchantName: row.merchantName,
    merchantCity: row.merchantCity,
    category: row.category,
    transactionAmount: row.transactionAmount,
    transactionType: row.transactionType,
    transactionMode: row.transactionMode,
    status: feTransactionStatus(row.decision, row.status),
    declineReason: row.declineReason,
    approval: feTransactionApproval(row.adminApproval),
    approvalReason: row.adminApprovalReason ?? null,
    createdAt: row.createdAt,
    notifiedAt: row.notifiedAt,
})

const serializeTransactionListRow = (row) => ({
    id: row.id,
    parentTransactionId: row.parentTransactionId ?? null,
    cardLast4: last4(row.cardIssuance?.maskedCardNumber),
    date: row.createdAt,
    merchant: row.merchantName,
    member: row.cardholder?.name || '',
    holderId: row.userId ? String(row.userId) : null,
    category: row.category,
    transactionId: row.displayId,
    status: feTransactionStatus(row.decision, row.status),
    approval: feTransactionApproval(row.adminApproval),
    declineReason: row.declineReason ?? null,
    fee: 0,
    amount: toNum(row.transactionAmount) ?? 0,
})

const serializeTransactionDetail = (row, cardholder) => ({
    ...serializeTransaction(row),
    cardholderName: cardholder?.name ?? null,
    cardholder: cardholder ? { name: cardholder.name, email: cardholder.email, team: null, role: cardholder.role } : null,
})

const loadOwnedTransaction = async (req) => {
    const scope = resolveScope(req)
    if (scope.error) return { error: scope.error, statusCode: 400 }

    const transaction = await findById(req.params.id)
    if (!transaction) return { error: 'Transaction not found.', statusCode: 404 }
    if (String(transaction.corporateId) !== String(scope.corporateId)) {
        return { error: PERMISSION_DENIED, statusCode: 403 }
    }
    if (!isAdmin(req) && !rowBelongsToCardholder(transaction, scope.cardholder)) {
        return { error: PERMISSION_DENIED, statusCode: 403 }
    }
    return { transaction }
}

const resolveStatusFilter = (statusQuery) => {
    if (!statusQuery) return {}
    const filter = FE_STATUS_FILTERS[statusQuery]
    return filter ? { decision: filter.decision, internalStatus: filter.status } : null
}
const EXPORT_VARIANT = { USER: 'user', ADMIN: 'admin' }
const resolveExportVariant = (req) => {
    const requested = typeof req.query.variant === 'string' ? req.query.variant.trim().toLowerCase() : undefined
    if (requested === EXPORT_VARIANT.USER || requested === EXPORT_VARIANT.ADMIN) return requested
    return isAdmin(req) ? EXPORT_VARIANT.ADMIN : EXPORT_VARIANT.USER
}

const resolveListFilters = (req) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    const dateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom : undefined
    const dateTo = typeof req.query.dateTo === 'string' ? req.query.dateTo : undefined
    const cardLast4 = typeof req.query.cardLast4 === 'string' ? req.query.cardLast4 : undefined
    const searchText = typeof req.query.searchText === 'string' ? req.query.searchText.trim() || undefined : undefined
    const statusFilter = resolveStatusFilter(typeof req.query.status === 'string' ? req.query.status : undefined)
    if (statusFilter === null) return { error: 'Invalid status filter.' }
    return { category, dateFrom, dateTo, cardLast4, searchText, ...statusFilter }
}

/**
 * The "Member" column is not in this service's database — it is stitched on after the query from the
 * others directory — so a name has to become ids before the query can use it. Cards and Requests
 * already resolve search text this way; transactions was the one list that did not, which is why
 * typing a cardholder's name there matched nothing.
 *
 * Skipped for a cardholder session: their own identity already scopes the query.
 */
const resolveSearchMatchIds = async (req, { searchText, cardholder }) => {
    if (!searchText || cardholder) return {}
    const { ids, userIds } = await searchCardUserIds({ searchText, fields: ['name', 'email'], req })
    return { searchMatchIds: ids, searchMatchUserIds: userIds }
}

exports.listTransactions = asyncHandler(async (req, res, next) => {
    const scope = resolveScope(req)
    if (scope.error) return next(new ErrorResponse(scope.error, 400))

    const filters = resolveListFilters(req)
    if (filters.error) return next(new ErrorResponse(filters.error, 400))

    const { limit, offset } = parsePaging(req)
    const searchMatches = await resolveSearchMatchIds(req, {
        searchText: filters.searchText,
        cardholder: scope.cardholder,
    })

    const { count, rows } = await listTransactions({
        corporateId: scope.corporateId,
        cardholder: scope.cardholder,
        ...filters,
        ...searchMatches,
        limit,
        offset,
    })
    await attachCardholders(rows, req)

    return res.status(200).json({
        status: true,
        message: 'Transactions fetched.',
        data: { count, rows: rows.map(serializeTransactionListRow) },
        responseCode: '000',
    })
})

exports.exportTransactions = asyncHandler(async (req, res, next) => {
    const scope = resolveScope(req)
    if (scope.error) return next(new ErrorResponse(scope.error, 400))

    const filters = resolveListFilters(req)
    if (filters.error) return next(new ErrorResponse(filters.error, 400))

    const searchMatches = await resolveSearchMatchIds(req, {
        searchText: filters.searchText,
        cardholder: scope.cardholder,
    })

    const { rows } = await listTransactions({
        corporateId: scope.corporateId,
        cardholder: scope.cardholder,
        ...filters,
        ...searchMatches,
        limit: EXPORT_MAX_ROWS,
        offset: 0,
    })
    if (!rows.length) return next(new ErrorResponse('No transactions found to export.', 404))
    await attachCardholders(rows, req)

    const serialized = rows.map(serializeTransactionListRow)
    const cardCell = (r) => (r.cardLast4 ? `**** ${r.cardLast4}` : '')
    const dateCell = (r) => (r.date ? new Date(r.date).toISOString() : '')
    const [header, body] = resolveExportVariant(req) === EXPORT_VARIANT.ADMIN
        ? [
              ['Card', 'Date', 'Merchant', 'Member', 'Status', 'Approval', 'Fee', 'Amount'],
              serialized.map((r) => [cardCell(r), dateCell(r), r.merchant || '', r.member, r.status, r.approval, r.fee, r.amount]),
          ]
        : [
              ['Card', 'Date', 'Transaction ID', 'Merchant', 'Category', 'Status', 'Amount'],
              serialized.map((r) => [cardCell(r), dateCell(r), r.transactionId || '', r.merchant || '', r.category || '', r.status, r.amount]),
          ]
    const csv = String.fromCharCode(0xfeff) + toCsv(header, body)

    const suffix = typeof req.query.status === 'string' && req.query.status ? req.query.status.toLowerCase() : 'all'
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="transactions-${suffix}.csv"`)
    return res.status(200).send(csv)
})

exports.getTransactionsSummary = asyncHandler(async (req, res, next) => {
    const scope = resolveScope(req)
    if (scope.error) return next(new ErrorResponse(scope.error, 400))

    const month = req.query.month
    if (typeof month !== 'string' || !MONTH_REGEX.test(month)) {
        return next(new ErrorResponse('A valid month (YYYY-MM) is required.', 400))
    }
    const { monthStart, monthEnd } = monthRangeUtc(month)

    const summary = await getMonthlySummary({
        corporateId: scope.corporateId,
        cardholder: scope.cardholder,
        monthStart,
        monthEnd,
    })

    return res.status(200).json({
        status: true,
        message: 'Transaction summary fetched.',
        data: summary,
        responseCode: '000',
    })
})

exports.getTransaction = asyncHandler(async (req, res, next) => {
    const { transaction: row, error, statusCode } = await loadOwnedTransaction(req)
    if (error) return next(new ErrorResponse(error, statusCode))

    await attachCardholders([row], req)

    return res.status(200).json({
        status: true,
        message: 'Transaction fetched.',
        data: { transaction: serializeTransactionDetail(row, row.cardholder) },
        responseCode: '000',
    })
})

exports.decideTransactionApproval = asyncHandler(async (req, res, next) => {
    const { transaction, error, statusCode } = await loadOwnedTransaction(req)
    if (error) return next(new ErrorResponse(error, statusCode))

    const decision = typeof req.body?.decision === 'string' ? req.body.decision.trim().toUpperCase() : ''
    if (decision !== TRANSACTION_APPROVAL.APPROVED && decision !== TRANSACTION_APPROVAL.REJECTED) {
        return next(new ErrorResponse('A valid decision (APPROVED or REJECTED) is required.', 400))
    }

    const rawReason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : ''

    if (transaction.adminApproval !== TRANSACTION_APPROVAL.PENDING) {
        return next(new ErrorResponse('This transaction has already been reviewed.', 409))
    }

    const updated = await setAdminApproval(transaction.id, {
        adminApproval: decision,
        adminApprovalReason: rawReason ? rawReason.slice(0, 500) : null,
        adminApprovalBy: actorCredentialId(req) ?? null,
    })

    return res.status(200).json({
        status: true,
        message: decision === TRANSACTION_APPROVAL.APPROVED ? 'Transaction approved.' : 'Transaction rejected.',
        data: { approval: feTransactionApproval(updated.adminApproval), approvalReason: updated.adminApprovalReason ?? null },
        responseCode: '000',
    })
})

exports.resolveScope = resolveScope
exports.loadOwnedTransaction = loadOwnedTransaction
