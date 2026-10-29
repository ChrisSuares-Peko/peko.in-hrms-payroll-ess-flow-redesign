const { Op } = require('sequelize')
const cardAuditLog = require('../entities/cardAuditLog')
const asyncHandler = require('../../middlewares/async')

const writeAudit = asyncHandler(async (fields, transaction) =>
    cardAuditLog.create(fields, transaction ? { transaction } : undefined))

const findByCard = asyncHandler(async ({ cardIssuanceId, category, limit, offset }) => {
    const where = { cardIssuanceId }
    if (category) where.category = category
    return cardAuditLog.findAndCountAll({ where, order: [['id', 'DESC']], limit, offset })
})

const findByCorporate = asyncHandler(async ({ corporateId, category, limit, offset }) => {
    const where = { corporateId }
    if (category) where.category = category
    return cardAuditLog.findAndCountAll({ where, order: [['id', 'DESC']], limit, offset })
})

const findAllByCard = asyncHandler(async ({ cardIssuanceId, category, limit }) => {
    const where = { cardIssuanceId }
    if (category) where.category = category
    return cardAuditLog.findAll({ where, order: [['id', 'DESC']], limit })
})

// The newest entry per card for one action — e.g. why each failed card failed. Newest-first, so the first
// row seen for a card wins.
const findLatestByCardsAndAction = asyncHandler(async ({ cardIssuanceIds, action }) => {
    const map = new Map()
    if (!Array.isArray(cardIssuanceIds) || !cardIssuanceIds.length) return map
    const rows = await cardAuditLog.findAll({
        where: { cardIssuanceId: { [Op.in]: cardIssuanceIds }, action },
        order: [['id', 'DESC']],
        raw: true,
    })
    rows.forEach((row) => {
        const key = String(row.cardIssuanceId)
        if (!map.has(key)) map.set(key, row)
    })
    return map
})

module.exports = { writeAudit, findByCard, findByCorporate, findAllByCard, findLatestByCardsAndAction }
