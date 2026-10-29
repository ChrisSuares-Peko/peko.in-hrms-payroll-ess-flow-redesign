const { Op, fn, col, cast, literal, where: sqlWhere } = require('sequelize')
const cardTransaction = require('../entities/cardTransaction')
const cardIssuance = require('../entities/cardIssuance')
const asyncHandler = require('../../middlewares/async')
const {
    TRANSACTION_STATUS,
    TRANSACTION_DECISION,
    FE_STATUS_FILTERS,
    TRANSACTION_APPROVAL,
} = require('../../constants/jit')
const { categoryForMcc } = require('../../constants/mccCategory')
const { escapeLike } = require('../../utils/cardHelpers')
const { cardholderWhere } = require('../../utils/cardholderIdentity')

const LIST_INCLUDE = [
    { model: cardIssuance, attributes: ['id', 'maskedCardNumber', 'userId', 'nameOnCard'], required: false },
]

// A refund is its own row (eventType REFUND) linked to the original debit row via parentTransactionId,
// not a status flip on the original — so summing "what's actually still spent" means netting the two
// rows against each other rather than excluding one. Shared by every spend-total query below.
const SIGNED_SPEND_SUM = literal(
    "COALESCE(SUM(CASE WHEN eventType = 'REFUND' THEN -transactionAmount ELSE transactionAmount END), 0)"
)

// A whole number or a decimal amount, e.g. "1200" or "1200.50". Anything else is not an amount.
const AMOUNT_TEXT = /^\d+(\.\d+)?$/
// Date forms a person actually types off the table: 2026-08-12, 12/08/2026, 12-08-2026, or a whole
// month as 2026-08. Deliberately narrow — Date.parse would happily read "12" as a date and quietly
// turn a search for an amount into a date filter.
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/
const ISO_MONTH = /^(\d{4})-(\d{2})$/
const LOCAL_DAY = /^(\d{2})[/-](\d{2})[/-](\d{4})$/

const utcDayRange = (term) => {
    const iso = ISO_DAY.exec(term)
    const local = LOCAL_DAY.exec(term)
    const month = ISO_MONTH.exec(term)
    let start
    let end
    if (iso) {
        start = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]))
        end = new Date(start); end.setUTCDate(end.getUTCDate() + 1)
    } else if (local) {
        start = new Date(Date.UTC(+local[3], +local[2] - 1, +local[1]))
        end = new Date(start); end.setUTCDate(end.getUTCDate() + 1)
    } else if (month) {
        start = new Date(Date.UTC(+month[1], +month[2] - 1, 1))
        end = new Date(start); end.setUTCMonth(end.getUTCMonth() + 1)
    } else {
        return null
    }
    return Number.isNaN(start.getTime()) ? null : { start, end }
}

// Status and approval read as words on screen ("Declined", "Pending"), so match them by what the
// column shows rather than by the enum stored underneath.
const statusMatches = (term) => Object.entries(FE_STATUS_FILTERS)
    .filter(([label]) => label.toLowerCase().startsWith(term))
    .map(([, filter]) => filter)

const approvalMatches = (term) => Object.values(TRANSACTION_APPROVAL)
    .filter((value) => value.toLowerCase().startsWith(term))

/**
 * Everything the transactions table shows, made searchable from the one box above it.
 *
 * The columns are: card, date, merchant, member, category, transaction id, status, approval, amount
 * and policy reason. Card is on the joined issuance and member is not in this database at all — it is
 * resolved to ids by the caller through the directory — so those two arrive as `searchMatchIds` and a
 * qualified column reference rather than as plain LIKEs.
 */
const buildSearchConditions = ({ searchText, searchMatchIds, searchMatchUserIds, cardholder }) => {
    const term = typeof searchText === 'string' ? searchText.trim() : ''
    if (!term) return null

    const like = `%${escapeLike(term)}%`
    const lower = term.toLowerCase()
    const or = [
        { merchantName: { [Op.like]: like } },
        { displayId: { [Op.like]: like } },
        { category: { [Op.like]: like } },
        { declineReason: { [Op.like]: like } },
        { '$cardIssuance.maskedCardNumber$': { [Op.like]: like } },
    ]

    if (AMOUNT_TEXT.test(term)) {
        or.push(sqlWhere(cast(col('cardTransaction.transactionAmount'), 'CHAR'), { [Op.like]: like }))
    }

    const day = utcDayRange(term)
    if (day) or.push({ createdAt: { [Op.gte]: day.start, [Op.lt]: day.end } })

    for (const filter of statusMatches(lower)) {
        or.push(filter.status ? { decision: filter.decision, status: filter.status } : { decision: filter.decision })
    }

    const approvals = approvalMatches(lower)
    if (approvals.length) or.push({ adminApproval: { [Op.in]: approvals } })

    // Only for an admin: a cardholder is already pinned to their own userId by the scope above,
    // which is ANDed with this OR, so their own rows are all they could ever match anyway.
    if (!cardholder) {
        if (Array.isArray(searchMatchIds) && searchMatchIds.length) {
            or.push({ userId: { [Op.in]: searchMatchIds.map(String) } })
        }
        // The matching members live in both tables, so a name has to be matched in both id spaces or a
        // re-keyed member drops out of every name search.
        if (Array.isArray(searchMatchUserIds) && searchMatchUserIds.length) {
            or.push({ userId: { [Op.in]: searchMatchUserIds.map(String) } })
        }
    }

    return or
}

// transactionUniqueId is no longer unique alone — a refund row shares it with the original AUTH row it
// refunds (distinguished by eventType) — so every lookup of "the original transaction" must say AUTH.
const findByTransactionUniqueId = asyncHandler(async (transactionUniqueId) =>
    cardTransaction.findOne({ where: { transactionUniqueId, eventType: 'AUTH' } }))

const displayIdFor = (id) => `CC${String(id).padStart(6, '0')}`

const recordAuth = asyncHandler(async (fields) => {
    const existing = await cardTransaction.findOne({ where: { transactionUniqueId: fields.transactionUniqueId, eventType: 'AUTH' } })
    if (existing) return existing

    const { merchantCategoryCode } = fields
    const enriched = { ...fields, category: merchantCategoryCode ? categoryForMcc(merchantCategoryCode) : null }

    let created
    try {
        created = await cardTransaction.create({ eventType: 'AUTH', status: TRANSACTION_STATUS.AUTH_RECEIVED, ...enriched })
    } catch (err) {
        if (err?.name !== 'SequelizeUniqueConstraintError') throw err
        return cardTransaction.findOne({ where: { transactionUniqueId: fields.transactionUniqueId, eventType: 'AUTH' } })
    }

    await created.update({ displayId: displayIdFor(created.id) })
    return created
})

const recordNotify = asyncHandler(async (transactionUniqueId, fields) => {
    const existing = await cardTransaction.findOne({ where: { transactionUniqueId, eventType: 'AUTH' } })
    if (!existing) return null
    await existing.update({ status: TRANSACTION_STATUS.NOTIFIED, notifiedAt: new Date(), ...fields })
    return existing
})

/**
 * A refund gets its own row instead of mutating the original debit — the debit genuinely happened and
 * stays on record exactly as it settled; the refund is a separate, linked credit event. `parent` is the
 * original AUTH row (found by the caller via findByTransactionUniqueId), whose identifying fields
 * (card/corporate/merchant) are copied onto the new row since Pine Labs' refund NOTIFY doesn't resend
 * merchant/card detail the way the original AUTH did.
 *
 * Idempotent against a redelivered refund NOTIFY: (transactionUniqueId, eventType) is unique, so a
 * duplicate create() hits that constraint and this just returns the refund row already on file.
 */
const recordRefund = asyncHandler(async ({ parent, notificationUniqueId, transactionAmount, transactionType, issuerWalletBalance, rawNotifyPayload }) => {
    const refundFields = {
        transactionUniqueId: parent.transactionUniqueId,
        parentTransactionId: parent.id,
        notificationUniqueId,
        externalCardIdentifier: parent.externalCardIdentifier,
        referenceNumber: parent.referenceNumber,
        cardIssuanceId: parent.cardIssuanceId,
        corporateId: parent.corporateId,
        userId: parent.userId ?? null,
        eventType: 'REFUND',
        transactionType,
        transactionMode: parent.transactionMode,
        transactionAmount,
        decision: TRANSACTION_DECISION.AUTHORIZED,
        status: TRANSACTION_STATUS.REFUNDED,
        issuerWalletBalance,
        rawNotifyPayload,
        notifiedAt: new Date(),
        merchantName: parent.merchantName,
        merchantCategoryCode: parent.merchantCategoryCode,
        merchantCity: parent.merchantCity,
        category: parent.category,
    }

    let created
    try {
        created = await cardTransaction.create(refundFields)
    } catch (err) {
        if (err?.name !== 'SequelizeUniqueConstraintError') throw err
        return cardTransaction.findOne({ where: { transactionUniqueId: parent.transactionUniqueId, eventType: 'REFUND' } })
    }

    await created.update({ displayId: displayIdFor(created.id) })
    return created
})

const findById = asyncHandler(async (id) => cardTransaction.findOne({ where: { id } }))

const setAdminApproval = asyncHandler(async (id, { adminApproval, adminApprovalReason, adminApprovalBy }) => {
    const row = await cardTransaction.findOne({ where: { id } })
    if (!row) return null
    await row.update({
        adminApproval,
        adminApprovalReason: adminApprovalReason ?? null,
        adminApprovalBy: adminApprovalBy ?? null,
        adminApprovalAt: new Date(),
    })
    return row
})

const listTransactions = asyncHandler(async ({
    corporateId, cardholder, decision, internalStatus, category, dateFrom, dateTo, cardLast4, searchText, searchMatchIds, searchMatchUserIds, limit, offset,
}) => {
    const whereClause = { corporateId }
    Object.assign(whereClause, cardholderWhere(cardholder) || {})
    if (decision) whereClause.decision = decision
    if (internalStatus) whereClause.status = internalStatus
    if (category) whereClause.category = category
    if (dateFrom || dateTo) {
        whereClause.createdAt = {}
        if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom)
        if (dateTo) {
            const end = new Date(dateTo)
            end.setUTCDate(end.getUTCDate() + 1)
            whereClause.createdAt[Op.lt] = end
        }
    }
    const searchConditions = buildSearchConditions({ searchText, searchMatchIds, searchMatchUserIds, cardholder })
    if (searchConditions) whereClause[Op.or] = searchConditions

    const cardLast4Digits = cardLast4 ? String(cardLast4).slice(-4) : undefined
    const include = LIST_INCLUDE.map((inc) => {
        if (inc.model === cardIssuance && cardLast4Digits) {
            return { ...inc, where: { maskedCardNumber: { [Op.like]: `%${cardLast4Digits}` } }, required: true }
        }
        return inc
    })

    return cardTransaction.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['rawAuthPayload', 'rawNotifyPayload', 'comments'] },
        include,
        order: [['id', 'DESC']],
        limit,
        offset,
        subQuery: false,
    })
})

const reportSearchConditions = (searchText) => {
    const term = typeof searchText === 'string' ? searchText.trim() : ''
    if (!term) return null

    const like = `%${escapeLike(term)}%`
    const or = [
        { displayId: { [Op.like]: like } },
        { merchantName: { [Op.like]: like } },
        { referenceNumber: { [Op.like]: like } },
        { externalCardIdentifier: { [Op.like]: like } },
        { '$cardIssuance.maskedCardNumber$': { [Op.like]: like } },
    ]

    if (/^\d+$/.test(term)) {
        or.push(sqlWhere(cast(col('cardTransaction.transactionUniqueId'), 'CHAR'), { [Op.like]: like }))
        or.push(sqlWhere(cast(col('cardTransaction.notificationUniqueId'), 'CHAR'), { [Op.like]: like }))
    }

    return or
}

const REPORT_EXCLUDED_ATTRIBUTES = ['rawAuthPayload', 'rawNotifyPayload', 'comments']

const listAllTransactions = asyncHandler(async ({
    corporateId, cardholder, cardIssuanceId, cardLast4, decision, internalStatus, eventType,
    transactionType, category, dateFrom, dateTo, searchText, limit, offset,
}) => {
    const whereClause = {}
    if (corporateId) whereClause.corporateId = corporateId
    Object.assign(whereClause, cardholderWhere(cardholder) || {})
    if (cardIssuanceId) whereClause.cardIssuanceId = cardIssuanceId
    if (decision) whereClause.decision = decision
    if (internalStatus) whereClause.status = internalStatus
    if (eventType) whereClause.eventType = eventType
    if (transactionType !== undefined && transactionType !== null) whereClause.transactionType = transactionType
    if (category) whereClause.category = category
    if (dateFrom || dateTo) {
        whereClause.createdAt = {}
        if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom)
        if (dateTo) {
            const end = new Date(dateTo)
            end.setUTCDate(end.getUTCDate() + 1)
            whereClause.createdAt[Op.lt] = end
        }
    }

    const searchConditions = reportSearchConditions(searchText)
    if (searchConditions) whereClause[Op.or] = searchConditions

    const cardLast4Digits = cardLast4 ? String(cardLast4).slice(-4) : undefined
    const include = LIST_INCLUDE.map((inc) => {
        if (inc.model === cardIssuance && cardLast4Digits) {
            return { ...inc, where: { maskedCardNumber: { [Op.like]: `%${cardLast4Digits}` } }, required: true }
        }
        return inc
    })

    return cardTransaction.findAndCountAll({
        where: whereClause,
        attributes: { exclude: REPORT_EXCLUDED_ATTRIBUTES },
        include,
        order: [['id', 'DESC']],
        limit,
        offset,
        subQuery: false,
    })
})

const findByIdWithPayloads = asyncHandler(async (id) => cardTransaction.findOne({
    where: { id },
    include: LIST_INCLUDE,
}))

const listTransactedCorporateIds = asyncHandler(async () => {
    const rows = await cardTransaction.findAll({
        attributes: [[fn('DISTINCT', col('corporateId')), 'corporateId']],
        where: { corporateId: { [Op.ne]: null } },
        order: [['corporateId', 'ASC']],
        raw: true,
    })
    return rows.map((row) => row.corporateId).filter(Boolean)
})

const getMonthlySummary = asyncHandler(async ({ corporateId, cardholder, monthStart, monthEnd }) => {
    const whereClause = {
        corporateId,
        decision: TRANSACTION_DECISION.AUTHORIZED,
        createdAt: { [Op.gte]: monthStart, [Op.lt]: monthEnd },
    }
    Object.assign(whereClause, cardholderWhere(cardholder) || {})

    const result = await cardTransaction.findOne({
        where: whereClause,
        attributes: [
            [SIGNED_SPEND_SUM, 'amountSpent'],
            [fn('COUNT', col('id')), 'transactionCount'],
        ],
        raw: true,
    })
    return { amountSpent: Number(result?.amountSpent || 0), transactionCount: Number(result?.transactionCount || 0) }
})

const authorizedInMonth = ({ corporateId, cardholder, monthStart, monthEnd }) => {
    const where = {
        corporateId,
        decision: TRANSACTION_DECISION.AUTHORIZED,
        createdAt: { [Op.gte]: monthStart, [Op.lt]: monthEnd },
    }
    Object.assign(where, cardholderWhere(cardholder) || {})
    return where
}

const getSpendByCard = asyncHandler(async ({ corporateId, cardIssuanceIds, cardholder, monthStart, monthEnd }) => {
    const where = { ...authorizedInMonth({ corporateId, cardholder, monthStart, monthEnd }), cardIssuanceId: { [Op.ne]: null } }

    let requestedToFamily = null
    if (Array.isArray(cardIssuanceIds)) {
        if (cardIssuanceIds.length === 0) return new Map()
        const requestedIds = cardIssuanceIds.map((id) => String(id))
        const requestedRows = await cardIssuance.findAll({
            where: { id: { [Op.in]: requestedIds } },
            attributes: ['id', 'referenceNumber'],
            raw: true,
        })
        const refs = [...new Set(requestedRows.map((r) => r.referenceNumber).filter(Boolean))]
        const familyRows = refs.length
            ? await cardIssuance.findAll({ where: { referenceNumber: { [Op.in]: refs } }, attributes: ['id', 'referenceNumber'], raw: true })
            : []
        const idsByRef = new Map()
        familyRows.forEach((r) => {
            const key = String(r.referenceNumber)
            if (!idsByRef.has(key)) idsByRef.set(key, [])
            idsByRef.get(key).push(String(r.id))
        })
        requestedToFamily = new Map()
        const allFamilyIds = new Set()
        requestedRows.forEach((r) => {
            const family = r.referenceNumber ? (idsByRef.get(String(r.referenceNumber)) || [String(r.id)]) : [String(r.id)]
            requestedToFamily.set(String(r.id), family)
            family.forEach((id) => allFamilyIds.add(id))
        })
        requestedIds.forEach((id) => {
            if (!requestedToFamily.has(id)) {
                requestedToFamily.set(id, [id])
                allFamilyIds.add(id)
            }
        })
        where.cardIssuanceId = { [Op.in]: [...allFamilyIds] }
    }

    const rows = await cardTransaction.findAll({
        where,
        attributes: ['cardIssuanceId', [SIGNED_SPEND_SUM, 'spent']],
        group: ['cardIssuanceId'],
        raw: true,
    })
    const spentById = new Map()
    rows.forEach((r) => spentById.set(String(r.cardIssuanceId), Number(r.spent || 0)))

    if (!requestedToFamily) return spentById

    const map = new Map()
    requestedToFamily.forEach((familyIds, requestedId) => {
        const total = familyIds.reduce((sum, id) => sum + (spentById.get(id) || 0), 0)
        map.set(requestedId, total)
    })
    return map
})

const getSpendByCategory = asyncHandler(async ({ corporateId, cardholder, monthStart, monthEnd }) => {
    const rows = await cardTransaction.findAll({
        where: authorizedInMonth({ corporateId, cardholder, monthStart, monthEnd }),
        attributes: ['category', [SIGNED_SPEND_SUM, 'amount']],
        group: ['category'],
        order: [[SIGNED_SPEND_SUM, 'DESC']],
        raw: true,
    })
    return rows.map((r) => ({ category: r.category || 'Other', amount: Number(r.amount || 0) }))
})

const getDailySpend = asyncHandler(async ({ corporateId, cardholder, monthStart, monthEnd }) => {
    const rows = await cardTransaction.findAll({
        where: authorizedInMonth({ corporateId, cardholder, monthStart, monthEnd }),
        attributes: [[fn('DATE', col('createdAt')), 'date'], [SIGNED_SPEND_SUM, 'amount']],
        group: [fn('DATE', col('createdAt'))],
        order: [[fn('DATE', col('createdAt')), 'ASC']],
        raw: true,
    })
    return rows.map((r) => ({ date: r.date, amount: Number(r.amount || 0) }))
})

const getAuthorizedSpendForCard = asyncHandler(async ({ cardIssuanceId, windowStart, windowEnd }) => {
    const result = await cardTransaction.findOne({
        where: {
            cardIssuanceId,
            decision: TRANSACTION_DECISION.AUTHORIZED,
            createdAt: { [Op.gte]: windowStart, [Op.lt]: windowEnd },
        },
        attributes: [[SIGNED_SPEND_SUM, 'amountSpent']],
        raw: true,
    })
    return Number(result?.amountSpent || 0)
})

const getAuthorizedSpendTotal = asyncHandler(async ({ corporateId, from, to, transaction }) => {
    const range = {}
    if (from) range[Op.gte] = from
    if (to) range[Op.lt] = to
    const result = await cardTransaction.findOne({
        where: {
            corporateId,
            decision: TRANSACTION_DECISION.AUTHORIZED,
            ...(from || to ? { createdAt: range } : {}),
        },
        attributes: [[SIGNED_SPEND_SUM, 'total']],
        raw: true,
        ...(transaction ? { transaction } : {}),
    })
    return Number(result?.total || 0)
})

const getAuthorizedSpendSummary = asyncHandler(async ({ corporateId, from, to }) => {
    const range = {}
    if (from) range[Op.gte] = from
    if (to) range[Op.lt] = to
    const result = await cardTransaction.findOne({
        where: {
            corporateId,
            decision: TRANSACTION_DECISION.AUTHORIZED,
            ...(from || to ? { createdAt: range } : {}),
        },
        attributes: [
            [SIGNED_SPEND_SUM, 'total'],
            [fn('COUNT', col('id')), 'count'],
        ],
        raw: true,
    })
    return { total: Number(result?.total || 0), count: Number(result?.count || 0) }
})

// The AUTH an in-app redeem just produced: Pine Labs sends nothing of ours in it, so the newest authorised AUTH
// for that card and amount inside the window is the best link there is.
const findRecentAuthorizedForCard = asyncHandler(async ({ cardIssuanceId, amount, since }) =>
    cardTransaction.findOne({
        where: {
            cardIssuanceId,
            eventType: 'AUTH',
            decision: TRANSACTION_DECISION.AUTHORIZED,
            transactionAmount: amount,
            createdAt: { [Op.gte]: since },
        },
        order: [['id', 'DESC']],
    }))

module.exports = {
    findRecentAuthorizedForCard,
    getAuthorizedSpendSummary,
    findByTransactionUniqueId,
    findById,
    setAdminApproval,
    listTransactions,
    listAllTransactions,
    findByIdWithPayloads,
    listTransactedCorporateIds,
    getMonthlySummary,
    getSpendByCard,
    getSpendByCategory,
    getDailySpend,
    getAuthorizedSpendForCard,
    getAuthorizedSpendTotal,
    recordAuth,
    recordNotify,
    recordRefund,
}
