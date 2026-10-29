const { Transaction } = require('sequelize')
const sequelize = require('../configs/database/index')
const { customLog } = require('../utils/loggerHelper')
const { GENERIC_ERROR } = require('../constants/messages')
const { createCard } = require('../models/use-cases/cardIssuance')
const { lockByCorporate } = require('../models/use-cases/corporateCardAdminApplication')
const { assertPhysicalCardAllowed } = require('../utils/cardQuota')

class CardSlotError extends Error {
    constructor(statusCode, message, quota = null) {
        super(message)
        this.statusCode = statusCode
        this.quota = quota
    }
}

const reservePhysicalCardSlot = async ({ corporateId, baseLimit, unitPrice, prepaid, fields, logTraceId }) =>
    sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED }, async (t) => {
        // A missing row takes a gap lock, and InnoDB gap locks co-exist — both transactions would acquire
        // it and neither would block, so the allowance would not serialise at all.
        const application = await lockByCorporate(corporateId, t)
        if (!application) {
            customLog(logTraceId, 'error', {
                message: '[PhysicalCard] Refusing to issue — no application row to serialise the allowance on',
                corporateId,
            }, 'CONSOLE')
            throw new CardSlotError(500, GENERIC_ERROR)
        }

        // A prepaid card was already bought; the row that records the payment is the one being inserted
        // here, so the allowance cannot yet see it.
        if (!prepaid) {
            const quota = await assertPhysicalCardAllowed({ corporateId, baseLimit, unitPrice }, t)
            if (!quota.ok) throw new CardSlotError(402, quota.message, quota)
        }

        return createCard(fields, t)
    })

module.exports = { reservePhysicalCardSlot, CardSlotError }
