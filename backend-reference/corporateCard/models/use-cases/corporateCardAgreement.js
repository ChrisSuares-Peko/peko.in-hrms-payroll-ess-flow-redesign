const { Op } = require('sequelize')
const corporateCardAgreement = require('../entities/corporateCardAgreement')
const asyncHandler = require('../../middlewares/async')

const findByCorporate = asyncHandler(async (corporateId) =>
    corporateCardAgreement.findOne({ where: { corporateId } }))

const upsertByCorporate = asyncHandler(async (corporateId, fields = {}) => {
    const existing = await corporateCardAgreement.findOne({ where: { corporateId } })
    if (existing) {
        await existing.update(fields)
        return existing
    }
    return corporateCardAgreement.create({ corporateId, ...fields })
})

const ENTITY_SEARCH_LIMIT = 1000

const escapeLike = (value) => String(value).replace(/[\\%_]/g, '\\$&')

const findCorporateIdsByEntityName = asyncHandler(async ({ searchText, limit = ENTITY_SEARCH_LIMIT }) => {
    const text = typeof searchText === 'string' ? searchText.trim() : ''
    if (!text) return []
    const rows = await corporateCardAgreement.findAll({
        where: { entityName: { [Op.like]: `%${escapeLike(text)}%` } },
        attributes: ['corporateId'],
        order: [['corporateId', 'DESC']],
        limit,
        raw: true,
    })
    return rows.map((row) => row.corporateId)
})

const findEntityNamesByCorporateIds = asyncHandler(async (corporateIds) => {
    const ids = [...new Set((corporateIds || []).filter((id) => id !== null && id !== undefined))]
    if (!ids.length) return new Map()
    const rows = await corporateCardAgreement.findAll({
        where: { corporateId: { [Op.in]: ids } },
        attributes: ['corporateId', 'entityName'],
        raw: true,
    })
    return new Map(rows.map((row) => [String(row.corporateId), row.entityName || null]))
})

module.exports = {
    findByCorporate,
    upsertByCorporate,
    findEntityNamesByCorporateIds,
    findCorporateIdsByEntityName,
}
