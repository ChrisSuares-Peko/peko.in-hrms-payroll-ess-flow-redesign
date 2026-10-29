const cardTransaction = require('../entities/cardTransaction')
const sequelizeConfig = require('../../configs/database/index')
const asyncHandler = require('../../middlewares/async')

const appendComment = asyncHandler(async (cardTransactionId, entry, { maxComments } = {}) =>
    sequelizeConfig.transaction(async (t) => {
        const row = await cardTransaction.findOne({
            where: { id: cardTransactionId },
            attributes: ['id', 'comments'],
            transaction: t,
            lock: t.LOCK.UPDATE,
        })
        if (!row) return null

        const existing = row.comments || []
        if (maxComments && existing.length >= maxComments) return null

        const updated = [...existing, entry]
        await row.update({ comments: updated }, { transaction: t })
        return updated
    }))

const listComments = asyncHandler(async (cardTransactionId) => {
    const row = await cardTransaction.findOne({
        where: { id: cardTransactionId },
        attributes: ['comments'],
    })
    return row?.comments || []
})

module.exports = { appendComment, listComments }
