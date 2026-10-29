const { fn, col, Op } = require('sequelize')
const corporateCardLedgerEntry = require('../entities/corporateCardLedgerEntry')
const asyncHandler = require('../../middlewares/async')
const { LEDGER_DIRECTION } = require('../../constants/ledger')

const createEntry = asyncHandler(async (fields, options = {}) => {
    try {
        const row = await corporateCardLedgerEntry.create(fields, options)
        row.wasCreated = true
        return row
    } catch (err) {
        if (err?.name === 'SequelizeUniqueConstraintError' && fields.refType && fields.refId) {
            // Redelivered reference — the existing row comes back without wasCreated, so callers can
            // skip once-only side effects (customer emails) on a duplicate.
            // F-CC-09: scope the dedup lookup to the owning corporate so a cross-tenant refId collision
            // never returns another corporate's row.
            return corporateCardLedgerEntry.findOne({
                where: { refType: fields.refType, refId: fields.refId, corporateId: fields.corporateId },
                ...(options.transaction ? { transaction: options.transaction } : {}),
            })
        }
        throw err
    }
})

const sumByDirection = asyncHandler(async ({ corporateId, transaction }) => {
    const rows = await corporateCardLedgerEntry.findAll({
        where: { corporateId },
        attributes: ['direction', [fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
        group: ['direction'],
        raw: true,
        ...(transaction ? { transaction } : {}),
    })
    const totals = { in: 0, out: 0 }
    rows.forEach((r) => {
        if (r.direction === LEDGER_DIRECTION.IN) totals.in = Number(r.total || 0)
        else if (r.direction === LEDGER_DIRECTION.OUT) totals.out = Number(r.total || 0)
    })
    return totals
})

const findAndCountByCorporate = asyncHandler(async ({ corporateId, direction, entryType, entryTypes, limit, offset }) => {
    const where = { corporateId }
    if (direction) where.direction = direction
    if (entryType) where.entryType = entryType
    else if (Array.isArray(entryTypes) && entryTypes.length) where.entryType = { [Op.in]: entryTypes }
    return corporateCardLedgerEntry.findAndCountAll({
        where,
        order: [['occurredAt', 'DESC'], ['id', 'DESC']],
        limit,
        offset,
    })
})

module.exports = { createEntry, sumByDirection, findAndCountByCorporate }
