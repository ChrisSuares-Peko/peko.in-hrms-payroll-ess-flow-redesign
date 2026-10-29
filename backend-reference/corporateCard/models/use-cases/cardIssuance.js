const { Op, fn, col, literal } = require('sequelize')
const cardIssuance = require('../entities/cardIssuance')
const cardRequest = require('../entities/cardRequest')
const sequelizeConfig = require('../../configs/database/index')
const asyncHandler = require('../../middlewares/async')
const { cardholderWhere } = require('../../utils/cardholderIdentity')
const { customLog } = require('../../utils/loggerHelper')
const { CARD_STATUS, CARD_STATE } = require('../../constants/card')
const { CARD_TYPE, CARD_TYPE_OPTIONS, CARD_REQUEST_TYPE, CARD_REQUEST_STATUS } = require('../../constants/cardRequest')
const { RECONCILE_OUTCOME } = require('../../constants/cardReconcile')
const { QUOTA_STALE_PENDING_HOURS } = require('../../constants/cardQuota')

const TERMINATED_REQUEST_STATUSES = [CARD_REQUEST_STATUS.PENDING, CARD_REQUEST_STATUS.PROCESSING, CARD_REQUEST_STATUS.APPROVED]

const sqlEnumLiteral = (value) => {
    if (!/^[A-Z_]+$/.test(String(value))) {
        throw new Error(`Unsafe SQL enum literal in the termination filter: ${value}`)
    }
    return `'${value}'`
}

const LIVE_TERMINATION_SQL =
    'EXISTS (SELECT 1 FROM `cardRequests` AS `liveTermination` '
    + 'WHERE `liveTermination`.`cardIssuanceId` = `cardIssuance`.`id` '
    + `AND \`liveTermination\`.\`requestType\` = ${sqlEnumLiteral(CARD_REQUEST_TYPE.TERMINATE)} `
    + `AND \`liveTermination\`.\`status\` IN (${TERMINATED_REQUEST_STATUSES.map(sqlEnumLiteral).join(', ')}))`

const buildStatusWhere = (raw) => {
    switch (String(raw).trim().toLowerCase()) {
        case 'frozen':
            return { cardState: CARD_STATE.FROZEN }
        case 'frozennotterminated':
            return { cardState: CARD_STATE.FROZEN, [Op.and]: [literal(`NOT ${LIVE_TERMINATION_SQL}`)] }
        case 'active':
            return { status: CARD_STATUS.ISSUED, cardState: { [Op.ne]: CARD_STATE.FROZEN } }
        case 'pending':
            return { status: CARD_STATUS.PENDING }
        case 'failed':
            return { status: CARD_STATUS.FAILED }
        default:
            return { status: raw }
    }
}

const findCardsByScope = asyncHandler(async ({ corporateId, cardholder }) => {
    const where = { corporateId, status: { [Op.ne]: CARD_STATUS.REPLACED }, ...(cardholderWhere(cardholder) || {}) }
    return cardIssuance.findAll({
        where,
        order: [['id', 'DESC']],
    })
})

const findByExternalRequestId = asyncHandler(async (externalRequestId) =>
    cardIssuance.findOne({ where: { externalRequestId: String(externalRequestId) } }))

const findByExternalCardIdentifier = asyncHandler(async (externalCardIdentifier) => {
    const card = await cardIssuance.findOne({ where: { externalCardIdentifier: String(externalCardIdentifier) } })
    if (!card || card.status !== CARD_STATUS.REPLACED || !card.referenceNumber) return card
    const replacement = await cardIssuance.findOne({ where: { referenceNumber: card.referenceNumber, status: CARD_STATUS.ISSUED } })
    return replacement || card
})

const findCardById = asyncHandler(async (id) => cardIssuance.findOne({ where: { id } }))

const findBlockingIssuance = asyncHandler(async ({ cardholder, cardType, sourceCardIssuanceId }) => {
    const holderWhere = cardholderWhere(cardholder)
    if (cardType === CARD_TYPE.PHYSICAL) {
        const or = []
        if (sourceCardIssuanceId) {
            or.push({ sourceCardIssuanceId, status: { [Op.in]: [CARD_STATUS.PENDING, CARD_STATUS.ISSUED] } })
        }
        if (holderWhere) {
            or.push({ ...holderWhere, sourceCardIssuanceId: null, status: CARD_STATUS.PENDING })
        }
        if (!or.length) return null
        return cardIssuance.findOne({
            where: { cardType: CARD_TYPE.PHYSICAL, [Op.or]: or },
            order: [['id', 'DESC']],
        })
    }
    // No identity means no cardholder to block on — and a bare status query would match a stranger's
    // pending card and refuse this issuance.
    if (!holderWhere) return null
    return cardIssuance.findOne({
        where: { ...holderWhere, cardType: { [Op.ne]: CARD_TYPE.PHYSICAL }, status: CARD_STATUS.PENDING },
        order: [['id', 'DESC']],
    })
})

const findFirstIssuedByCardholder = asyncHandler(async (userId) =>
    cardIssuance.findOne({ where: { userId, status: CARD_STATUS.ISSUED }, order: [['id', 'ASC']] }))

const findWalletByCardholder = asyncHandler(async (userId) =>
    cardIssuance.findOne({
        where: { userId, walletNumber: { [Op.ne]: null } },
        order: [['id', 'ASC']],
    }))

/**
 * Refuses to issue a card nobody holds.
 *
 * Unlike a request, a card has no second identifier to fall back on: `userId` is the only thing tying a live
 * spending instrument to a person. Without it the card appears on no cardholder's list, its holder cannot
 * freeze it, the JIT webhook stamps its transactions with a null holder, and `activeIssuanceKey` generates as
 * NULL — so the unique index that stops a duplicate card being issued does not cover it either.
 */
const createCard = asyncHandler(async (fields, transaction) => {
    if (!fields?.corporateId) throw new Error('A card cannot be issued without a corporate.')
    if (!fields?.userId) throw new Error('A card cannot be issued without a cardholder.')
    return cardIssuance.create(fields, { transaction })
})

const PHYSICAL_COUNTED_STATUSES = [CARD_STATUS.PENDING, CARD_STATUS.ISSUED]

const STALE_PENDING_SQL =
    `\`cardIssuance\`.\`status\` = '${CARD_STATUS.PENDING}' `
    + `AND \`cardIssuance\`.\`createdAt\` < DATE_SUB(NOW(), INTERVAL ${QUOTA_STALE_PENDING_HOURS} HOUR)`

const countPhysicalCardsUsed = asyncHandler(async ({ corporateId }, transaction) => {
    if (!corporateId) return Number.MAX_SAFE_INTEGER
    return cardIssuance.count({
        where: {
            corporateId,
            cardType: CARD_TYPE.PHYSICAL,
            status: { [Op.in]: PHYSICAL_COUNTED_STATUSES },
            [Op.and]: [literal(`NOT (${STALE_PENDING_SQL})`)],
        },
        transaction,
    })
})

/**
 * Physical cards this corporate has paid for, counted across every status.
 *
 * A FAILED paid card still counts here while dropping out of `countPhysicalCardsUsed` — that difference
 * IS the credit: the corporate paid, the issuer refused, so their next physical card is free.
 */
const countPaidPhysicalCards = asyncHandler(async ({ corporateId }, transaction) => {
    if (!corporateId) return 0
    return cardIssuance.count({
        where: { corporateId, purchasePaymentRefId: { [Op.ne]: null } },
        transaction,
    })
})

const findByPurchasePaymentRef = asyncHandler(async (purchasePaymentRefId) =>
    cardIssuance.findOne({ where: { purchasePaymentRefId: String(purchasePaymentRefId) } }))

const updateCardById = asyncHandler(async (id, fields) => {
    await cardIssuance.update(fields, { where: { id } })
    return cardIssuance.findOne({ where: { id } })
})

const replaceVirtualCardById = asyncHandler(async (sourceCardIssuanceId) => {
    if (!sourceCardIssuanceId) return
    await cardIssuance.update(
        { status: CARD_STATUS.REPLACED, lastEventAt: new Date().toISOString() },
        {
            where: {
                id: sourceCardIssuanceId,
                cardType: { [Op.ne]: CARD_TYPE.PHYSICAL },
                status: CARD_STATUS.ISSUED,
            },
        }
    )
})

const restoreReplacedVirtualById = asyncHandler(async (sourceCardIssuanceId) => {
    if (!sourceCardIssuanceId) return
    const liveCompanions = await cardIssuance.count({
        where: { sourceCardIssuanceId, cardType: CARD_TYPE.PHYSICAL, status: CARD_STATUS.ISSUED },
    })
    if (liveCompanions > 0) return
    await cardIssuance.update(
        { status: CARD_STATUS.ISSUED, lastEventAt: new Date().toISOString() },
        { where: { id: sourceCardIssuanceId, status: CARD_STATUS.REPLACED } }
    )
})

const asInt = (value, fallback) => (Number.isInteger(value) && value >= 0 ? value : fallback)

const scheduleReconcile = asyncHandler(async (id, { delaySeconds = 0, lastError, vendorOrderStatus } = {}) => {
    const seconds = asInt(delaySeconds, 0)
    await cardIssuance.update(
        {
            reconcileNextAt: literal(`DATE_ADD(NOW(), INTERVAL ${seconds} SECOND)`),
            ...(lastError !== undefined ? { reconcileLastError: lastError } : {}),
            ...(vendorOrderStatus !== undefined ? { vendorOrderStatus } : {}),
        },
        { where: { id, status: CARD_STATUS.PENDING } }
    )
})

const claimForReconcile = asyncHandler(async (id, leaseSeconds) => {
    const lease = asInt(leaseSeconds, 120)
    const [affected] = await cardIssuance.update(
        {
            reconcileNextAt: literal(`DATE_ADD(NOW(), INTERVAL ${lease} SECOND)`),
            reconcileAttempts: literal('`reconcileAttempts` + 1'),
        },
        {
            where: {
                id,
                status: CARD_STATUS.PENDING,
                [Op.and]: [literal('`reconcileNextAt` IS NOT NULL'), literal('`reconcileNextAt` <= NOW()')],
            },
            silent: true,
        }
    )
    return affected
})

const releaseReconcileClaim = asyncHandler(async (id, { delaySeconds = 0 } = {}) => {
    const seconds = asInt(delaySeconds, 0)
    await cardIssuance.update(
        {
            reconcileNextAt: literal(`DATE_ADD(NOW(), INTERVAL ${seconds} SECOND)`),
            reconcileAttempts: literal('GREATEST(`reconcileAttempts` - 1, 0)'),
        },
        { where: { id, status: CARD_STATUS.PENDING }, silent: true }
    )
})

/**
 * PENDING cards the sweep should look at.
 *
 * Two ways in. The first is the normal one: a card whose scheduled check is due. The second exists
 * because a give-up nulls `reconcileNextAt` while leaving the row PENDING — such a card was invisible to
 * this query and so was never retried and never resolved, sitting Pending forever. Anything PENDING past
 * the give-up cut-off is therefore collected regardless of its schedule, gets one more status call, and
 * ends in a terminal state either way.
 */
const findDueForReconcile = asyncHandler(async ({ limit = 25, maxAgeDays = 10, giveUpHours = 1 } = {}) => {
    const days = asInt(maxAgeDays, 10)
    const hours = asInt(giveUpHours, 1)
    return cardIssuance.findAll({
        where: {
            status: CARD_STATUS.PENDING,
            [Op.and]: [
                literal(`\`cardIssuance\`.\`createdAt\` > DATE_SUB(NOW(), INTERVAL ${days} DAY)`),
                literal(
                    '((`cardIssuance`.`reconcileNextAt` IS NOT NULL AND `cardIssuance`.`reconcileNextAt` <= NOW())'
                    + ` OR (\`cardIssuance\`.\`reconcileNextAt\` IS NULL AND \`cardIssuance\`.\`createdAt\` < DATE_SUB(NOW(), INTERVAL ${hours} HOUR)))`
                ),
            ],
        },
        order: [['reconcileNextAt', 'ASC']],
        limit,
    })
})

const finishReconcile = asyncHandler(async (id, { outcome, status, fields = {} } = {}) => {
    const [affected] = await cardIssuance.update(
        {
            ...fields,
            ...(status ? { status } : {}),
            reconcileOutcome: outcome,
            reconcileNextAt: null,
        },
        { where: { id, status: CARD_STATUS.PENDING } }
    )
    return affected
})

const findAndCountStuckIssuances = asyncHandler(async ({ limit = 20, offset = 0, giveUpHours = 24 } = {}) => {
    const hours = asInt(giveUpHours, 24)
    return cardIssuance.findAndCountAll({
        where: {
            status: CARD_STATUS.PENDING,
            [Op.or]: [
                { reconcileOutcome: RECONCILE_OUTCOME.UNRESOLVED },
                literal(`\`cardIssuance\`.\`createdAt\` < DATE_SUB(NOW(), INTERVAL ${hours} HOUR)`),
            ],
        },
        order: [['id', 'DESC']],
        limit,
        offset,
    })
})

const sumCardLimits = asyncHandler(async ({ corporateId }) => {
    const terminatedRequests = await cardRequest.findAll({
        where: {
            corporateId,
            requestType: CARD_REQUEST_TYPE.TERMINATE,
            status: { [Op.in]: TERMINATED_REQUEST_STATUSES },
        },
        attributes: ['cardIssuanceId'],
    })
    const terminatedCardIds = terminatedRequests.map((r) => r.cardIssuanceId).filter(Boolean)

    const where = { corporateId, status: CARD_STATUS.ISSUED }
    if (terminatedCardIds.length) where.id = { [Op.notIn]: terminatedCardIds }

    const result = await cardIssuance.findOne({
        where,
        attributes: [
            [fn('COALESCE', fn('SUM', col('cardLimit')), 0), 'total'],
            [fn('COUNT', col('id')), 'count'],
        ],
        raw: true,
    })
    return { total: Number(result?.total || 0), count: Number(result?.count || 0) }
})

const findByIdScoped = asyncHandler(async (id, corporateId) =>
    cardIssuance.findOne({ where: { id, corporateId } }))

const findByIdForUpdate = asyncHandler(async (id, transaction) =>
    cardIssuance.findOne({ where: { id }, lock: transaction.LOCK.UPDATE, transaction }))

const applyLimit = asyncHandler(async (id, fields, credentialId, transaction) => {
    await cardIssuance.update(
        { ...fields, limitUpdatedAt: new Date(), limitUpdatedByCredentialId: credentialId },
        { where: { id }, transaction }
    )
    return cardIssuance.findOne({ where: { id }, transaction })
})

const updateCardStateById = asyncHandler(async (id, fields, transaction) => {
    await cardIssuance.update(fields, { where: { id }, transaction })
    return cardIssuance.findOne({ where: { id }, transaction })
})

const findAndCountCardsWithHolder = asyncHandler(async ({ corporateId, status, type, searchText, searchMatchIds, searchMatchUserIds, cardholder, limit, offset }) => {
    const where = { corporateId }
    if (status) Object.assign(where, buildStatusWhere(status))
    else where.status = { [Op.ne]: CARD_STATUS.REPLACED }
    if (type) {
        const canonical = CARD_TYPE_OPTIONS.find((t) => t.toLowerCase() === String(type).trim().toLowerCase())
        if (canonical) where.cardType = canonical
    }
    // A malformed id must match nothing rather than be dropped — dropping the predicate is what returned
    // every card in the corporate.
    const holderWhere = cardholderWhere(cardholder)
    if (holderWhere) {
        const [column, value] = Object.entries(holderWhere)[0]
        where[column] = /^\d+$/.test(String(value).trim()) ? String(value).trim() : '0'
    }
    if (searchText && searchText.trim()) {
        const escaped = searchText.trim().replace(/[\\%_]/g, '\\$&')
        const like = `%${escaped}%`
        const or = [{ maskedCardNumber: { [Op.like]: like } }]
        if (Array.isArray(searchMatchIds) && searchMatchIds.length) {
            or.push({ userId: { [Op.in]: searchMatchIds.map(String) } })
        }
        if (Array.isArray(searchMatchUserIds) && searchMatchUserIds.length) {
            or.push({ userId: { [Op.in]: searchMatchUserIds.map(String) } })
        }
        where[Op.or] = or
    }
    return cardIssuance.findAndCountAll({ where, order: [['id', 'DESC']], limit, offset })
})

/**
 * The card a dispatch notification belongs to.
 *
 * Scoped to Physical on purpose: a physical card is issued carrying the SAME referenceNumber as the
 * virtual it replaces (see restoreReplacedVirtualById), so a bare referenceNumber lookup matches both
 * rows and would file a courier event against a card that was never posted. Newest first, because a
 * re-issue can repeat the reference.
 */
const findPhysicalByReferenceNumber = asyncHandler(async (referenceNumber) =>
    cardIssuance.findOne({
        where: { referenceNumber, cardType: CARD_TYPE.PHYSICAL },
        order: [['id', 'DESC']],
    }))

/**
 * Append dispatch records to a card, skipping any it already holds.
 *
 * Read-modify-write on a JSON column is a lost-update waiting to happen — two deliveries for one card
 * would each read the same array and the second would overwrite the first — so the row is locked for
 * the duration, the same way appendComment does it. `keyOf` decides what "already holds" means.
 */
const appendDispatches = asyncHandler(async (id, records, { keyOf, max, logTraceId } = {}) =>
    sequelizeConfig.transaction(async (t) => {
        const row = await cardIssuance.findOne({
            where: { id },
            attributes: ['id', 'dispatches'],
            transaction: t,
            lock: t.LOCK.UPDATE,
        })
        if (!row) {
            customLog(logTraceId, 'error', {
                message: '[CardDispatch] card row vanished between lookup and locked read',
                cardIssuanceId: id,
                records: records.length,
            }, 'CONSOLE')
            return null
        }

        const existing = Array.isArray(row.dispatches) ? row.dispatches : []
        const seen = new Set(existing.map((entry) => keyOf(entry)))
        const merged = [...existing]
        let added = 0
        let duplicates = 0
        let capped = 0

        for (const record of records) {
            const key = keyOf(record)
            if (seen.has(key)) {
                duplicates += 1
                continue
            }
            if (max && merged.length >= max) {
                capped += 1
                continue
            }
            seen.add(key)
            merged.push(record)
            added += 1
        }

        if (added) await row.update({ dispatches: merged }, { transaction: t })

        customLog(logTraceId, 'info', {
            message: added
                ? '[CardDispatch] dispatches column updated'
                : '[CardDispatch] nothing to write — every record was already held or capped',
            cardIssuanceId: id,
            offered: records.length,
            added,
            duplicates,
            capped,
            total: merged.length,
            before: existing.length,
        }, 'CONSOLE')

        return { added, duplicates, capped, total: merged.length }
    }))

/**
 * Physical card orders for the "Physical card tracking" table: newest first, one row per order.
 *
 * REPLACED rows are excluded — a physical card that was itself replaced is not something anyone is
 * still waiting on a courier for.
 */
const findAndCountPhysicalTracking = asyncHandler(async ({ corporateId, cardholder, status, limit, offset }) =>
    cardIssuance.findAndCountAll({
        where: {
            corporateId,
            ...(cardholderWhere(cardholder) || {}),
            cardType: CARD_TYPE.PHYSICAL,
            ...(status ? { status } : { status: { [Op.ne]: CARD_STATUS.REPLACED } }),
        },
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
        limit,
        offset,
    }))

module.exports = {
    findCardsByScope,
    findPhysicalByReferenceNumber,
    findAndCountPhysicalTracking,
    appendDispatches,
    findByExternalRequestId, findByExternalCardIdentifier,
    findCardById,
    findBlockingIssuance,
    findFirstIssuedByCardholder,
    findWalletByCardholder,
    createCard,
    countPhysicalCardsUsed,
    countPaidPhysicalCards,
    findByPurchasePaymentRef,
    updateCardById,
    findByIdScoped,
    findByIdForUpdate,
    applyLimit,
    updateCardStateById,
    findAndCountCardsWithHolder,
    sumCardLimits,
    replaceVirtualCardById,
    restoreReplacedVirtualById,
    scheduleReconcile,
    claimForReconcile,
    releaseReconcileClaim,
    findDueForReconcile,
    finishReconcile,
    findAndCountStuckIssuances,
}
