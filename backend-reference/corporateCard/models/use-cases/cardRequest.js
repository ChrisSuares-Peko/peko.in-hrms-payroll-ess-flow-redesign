const { Op } = require('sequelize')
const cardRequest = require('../entities/cardRequest')
const cardIssuance = require('../entities/cardIssuance')
const asyncHandler = require('../../middlewares/async')
const { cardholderWhere } = require('../../utils/cardholderIdentity')
const { CARD_REQUEST_STATUS, CARD_REQUEST_TYPE, CARD_TYPE_OPTIONS } = require('../../constants/cardRequest')

const ACTIVE_STATUSES = [CARD_REQUEST_STATUS.PENDING, CARD_REQUEST_STATUS.PROCESSING]
const TERMINATION_BLOCKING_STATUSES = [CARD_REQUEST_STATUS.PENDING, CARD_REQUEST_STATUS.PROCESSING, CARD_REQUEST_STATUS.APPROVED]
const MEMBERSHIP_HELD_STATUSES = [CARD_REQUEST_STATUS.PENDING, CARD_REQUEST_STATUS.PROCESSING, CARD_REQUEST_STATUS.APPROVED]
const APPROVABLE_REQUEST_TYPES = [
    CARD_REQUEST_TYPE.CARD_ISSUANCE,
    CARD_REQUEST_TYPE.LIMIT_INCREASE,
    CARD_REQUEST_TYPE.UNFREEZE,
]

// Membership requests share this table but not the Approvals screen: they are decided from People →
// Request for Membership. An untyped queue call means "the card approvals queue", so they are excluded
// unless asked for by name.
const QUEUE_OPT_IN_TYPES = [CARD_REQUEST_TYPE.MEMBERSHIP]

const canonicalCardType = (cardType) =>
    (cardType ? CARD_TYPE_OPTIONS.find((t) => t.toLowerCase() === String(cardType).trim().toLowerCase()) : undefined)

/**
 * Refuses to store a request nobody owns.
 *
 * `userId` is nullable on the table and every caller defaults it to null, so a session that somehow reached a
 * writer without a cardholder identity persisted a headless row: it names no member in the approval queue,
 * cannot be approved (the holder lookup 404s), and — because `activeDedupeKey` is generated as NULL when
 * `userId` is NULL — is not covered by the unique index that stops duplicate requests.
 *
 * Required only when nothing else identifies the target. With a `cardIssuanceId` the card is the target and
 * the cardholder is descriptive, which is what lets a legacy card whose holder was never backfilled still be
 * frozen or terminated. Exactly the split the generated column already makes.
 */
const assertRequestTarget = (fields) => {
    if (!fields?.corporateId) throw new Error('A card request cannot be stored without a corporate.')
    if (!fields?.cardIssuanceId && !fields?.userId) {
        throw new Error('A card request cannot be stored without a cardholder.')
    }
}

const createRequest = asyncHandler(async (fields, transaction) => {
    assertRequestTarget(fields)
    return cardRequest.create(fields, { transaction })
})

const findActiveByTarget = asyncHandler(async ({ requestType, cardIssuanceId, cardholder }) => {
    const where = { requestType, status: { [Op.in]: ACTIVE_STATUSES } }
    if (cardIssuanceId) {
        where.cardIssuanceId = cardIssuanceId
    } else {
        // No identity means refuse, never "no filter". `|| {}` dropped the predicate, so for a cardholder-less
        // session the duplicate check asked "is ANY member anywhere holding a pending request?" — and a 409
        // then blamed this caller for someone else's.
        const holder = cardholderWhere(cardholder)
        if (!holder) throw new Error('A cardholder is required to look up an active request.')
        Object.assign(where, holder)
        where.cardIssuanceId = null
    }
    return cardRequest.findOne({ where })
})

const findActiveTerminateCardIds = asyncHandler(async ({ cardIssuanceIds }) => {
    if (!cardIssuanceIds?.length) return []
    const rows = await cardRequest.findAll({
        where: {
            requestType: CARD_REQUEST_TYPE.TERMINATE,
            status: { [Op.in]: ACTIVE_STATUSES },
            cardIssuanceId: { [Op.in]: cardIssuanceIds },
        },
        attributes: ['cardIssuanceId'],
    })
    return rows.map((r) => r.cardIssuanceId)
})

const findByIdScoped = asyncHandler(async (id, corporateId) =>
    cardRequest.findOne({
        where: { id, corporateId },
        include: [
            { model: cardIssuance, as: 'card', attributes: ['id', 'maskedCardNumber', 'status', 'cardLimit'], required: false },
        ],
    }))

const findByIdUnscoped = asyncHandler(async (id) =>
    cardRequest.findOne({
        where: { id },
        include: [
            { model: cardIssuance, as: 'card', attributes: ['id', 'maskedCardNumber', 'status', 'cardState'], required: false },
        ],
    }))

const hasBlockingTermination = asyncHandler(async (cardIssuanceId) => {
    const row = await cardRequest.findOne({
        where: {
            cardIssuanceId,
            requestType: CARD_REQUEST_TYPE.TERMINATE,
            status: { [Op.in]: TERMINATION_BLOCKING_STATUSES },
        },
    })
    return !!row
})

const findTerminationStatusByCardIds = asyncHandler(async (cardIssuanceIds) => {
    const map = new Map()
    if (!Array.isArray(cardIssuanceIds) || cardIssuanceIds.length === 0) return map
    const rows = await cardRequest.findAll({
        where: {
            cardIssuanceId: { [Op.in]: cardIssuanceIds },
            requestType: CARD_REQUEST_TYPE.TERMINATE,
            status: { [Op.in]: TERMINATION_BLOCKING_STATUSES },
        },
    })
    for (const row of rows) {
        map.set(String(row.cardIssuanceId), row.status === CARD_REQUEST_STATUS.APPROVED ? 'COMPLETED' : 'REQUESTED')
    }
    return map
})

const escapeLike = (s) => String(s).replace(/[\\%_]/g, '\\$&')

const STATUS_SEARCH_LABELS = [
    { label: 'pending', statuses: [CARD_REQUEST_STATUS.PENDING, CARD_REQUEST_STATUS.PROCESSING] },
    { label: 'approved', statuses: [CARD_REQUEST_STATUS.APPROVED] },
    { label: 'rejected', statuses: [CARD_REQUEST_STATUS.REJECTED, 'CANCELLED'] },
]
const rawStatusesForSearch = (q) => {
    const needle = q.toLowerCase()
    if (needle.length < 3) return []
    return [...new Set(STATUS_SEARCH_LABELS.filter(({ label }) => label.startsWith(needle)).flatMap((g) => g.statuses))]
}

const findAndCountForQueue = asyncHandler(async ({ corporateId, requestType, status, cardType, cardholder, cardIssuanceId, searchText, searchMatchIds, searchMatchUserIds, dateFrom, dateTo, limit, offset }) => {
    const where = {}
    if (corporateId) where.corporateId = corporateId
    if (requestType) where.requestType = requestType
    else where.requestType = { [Op.notIn]: QUEUE_OPT_IN_TYPES }
    if (status) where.status = status
    const canonicalType = canonicalCardType(cardType)
    if (canonicalType) where.cardType = canonicalType
    Object.assign(where, cardholderWhere(cardholder) || {})
    if (cardIssuanceId) where.cardIssuanceId = cardIssuanceId

    const q = typeof searchText === 'string' ? searchText.trim() : ''
    if (q) {
        const like = `%${escapeLike(q)}%`
        const or = [{ reason: { [Op.like]: like } }]
        if (!canonicalType) or.push({ cardType: { [Op.like]: like } })
        const statuses = rawStatusesForSearch(q)
        if (statuses.length) or.push({ status: { [Op.in]: statuses } })
        if (!cardholder && Array.isArray(searchMatchIds) && searchMatchIds.length) {
            or.push({ userId: { [Op.in]: searchMatchIds } })
        }
        if (!cardholder && Array.isArray(searchMatchUserIds) && searchMatchUserIds.length) {
            or.push({ userId: { [Op.in]: searchMatchUserIds } })
        }
        where[Op.or] = or
    }

    if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom)
        if (dateTo) {
            const end = new Date(dateTo)
            end.setUTCDate(end.getUTCDate() + 1)
            where.createdAt[Op.lt] = end
        }
    }
    return cardRequest.findAndCountAll({
        where,
        include: [{ model: cardIssuance, as: 'card', attributes: ['id', 'maskedCardNumber', 'status'], required: false }],
        order: [['id', 'DESC']],
        limit,
        offset,
    })
})

const findByRequester = asyncHandler(async ({ cardholder, requestType, cardType, limit, offset }) => {
    const where = { ...cardholderWhere(cardholder) }
    if (requestType) where.requestType = requestType
    const canonicalType = canonicalCardType(cardType)
    if (canonicalType) where.cardType = canonicalType
    return cardRequest.findAndCountAll({
        where,
        include: [{ model: cardIssuance, as: 'card', attributes: ['id', 'maskedCardNumber', 'status'], required: false }],
        order: [['id', 'DESC']],
        limit,
        offset,
    })
})

const countPending = asyncHandler(async ({ corporateId, cardholder }) => {
    const where = {
        corporateId,
        status: CARD_REQUEST_STATUS.PENDING,
        requestType: { [Op.in]: APPROVABLE_REQUEST_TYPES },
    }
    Object.assign(where, cardholderWhere(cardholder) || {})
    return cardRequest.count({ where })
})

const decideFromPendingCAS = asyncHandler(async (id, fields, transaction) => {
    const [count] = await cardRequest.update(
        fields,
        { where: { id, status: CARD_REQUEST_STATUS.PENDING }, transaction }
    )
    return count
})

const updateById = asyncHandler(async (id, fields, transaction) => {
    await cardRequest.update(fields, { where: { id }, transaction })
    return cardRequest.findOne({ where: { id } })
})

const finalizeFromProcessingCAS = asyncHandler(async (id, fields, transaction) => {
    const [count] = await cardRequest.update(
        fields,
        { where: { id, status: CARD_REQUEST_STATUS.PROCESSING }, transaction }
    )
    return count
})

const findOpenRequestStatusByCardIds = asyncHandler(async ({ cardIssuanceIds, requestType }) => {
    const map = new Map()
    if (!Array.isArray(cardIssuanceIds) || cardIssuanceIds.length === 0) return map
    const rows = await cardRequest.findAll({
        where: {
            cardIssuanceId: { [Op.in]: cardIssuanceIds },
            requestType,
            status: { [Op.in]: ACTIVE_STATUSES },
        },
    })
    for (const row of rows) map.set(String(row.cardIssuanceId), row.status)
    return map
})

const resolveActiveByCards = asyncHandler(async (
    { corporateId, cardIssuanceIds, requestType, fields, statuses = ACTIVE_STATUSES },
    transaction
) => {
    const ids = (Array.isArray(cardIssuanceIds) ? cardIssuanceIds : []).map(String).filter(Boolean)
    if (!corporateId || ids.length === 0) return 0
    const [count] = await cardRequest.update(
        fields,
        {
            where: {
                corporateId,
                cardIssuanceId: { [Op.in]: ids },
                requestType,
                status: { [Op.in]: statuses },
            },
            transaction,
        }
    )
    return count
})

const resolveByCardholder = asyncHandler(async (
    { corporateId, cardholder, requestType, fields, statuses = ACTIVE_STATUSES },
    transaction
) => {
    const holder = cardholderWhere(cardholder)
    if (!corporateId || !holder) return 0
    const [count] = await cardRequest.update(
        fields,
        {
            where: {
                ...holder,
                corporateId,
                requestType,
                status: { [Op.in]: statuses },
            },
            transaction,
        }
    )
    return count
})

module.exports = {
    MEMBERSHIP_HELD_STATUSES,
    createRequest,
    findActiveByTarget,
    findActiveTerminateCardIds,
    findByIdScoped,
    findByIdUnscoped,
    findAndCountForQueue,
    findByRequester,
    countPending,
    decideFromPendingCAS,
    updateById,
    finalizeFromProcessingCAS,
    hasBlockingTermination,
    findTerminationStatusByCardIds,
    findOpenRequestStatusByCardIds,
    resolveActiveByCards,
    resolveByCardholder,
}
