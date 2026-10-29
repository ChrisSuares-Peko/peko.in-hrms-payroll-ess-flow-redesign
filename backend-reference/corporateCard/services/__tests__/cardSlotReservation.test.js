const TX = { LOCK: { UPDATE: 'UPDATE' }, id: 'tx-1' }

jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../models/use-cases/cardIssuance', () => ({ createCard: jest.fn() }))
jest.mock('../../models/use-cases/corporateCardAdminApplication', () => ({ lockByCorporate: jest.fn() }))
jest.mock('../../utils/cardQuota', () => ({ assertPhysicalCardAllowed: jest.fn() }))

const sequelize = require('../../configs/database/index')
const { createCard } = require('../../models/use-cases/cardIssuance')
const { lockByCorporate } = require('../../models/use-cases/corporateCardAdminApplication')
const { assertPhysicalCardAllowed } = require('../../utils/cardQuota')
const { reservePhysicalCardSlot, CardSlotError } = require('../cardSlotReservation')
const { GENERIC_ERROR } = require('../../constants/messages')

const FIELDS = { corporateId: 42, cardType: 'Physical' }
const reserve = (over = {}) =>
    reservePhysicalCardSlot({ corporateId: 42, baseLimit: 1, unitPrice: 19, fields: FIELDS, logTraceId: 't', ...over })

beforeEach(() => {
    jest.clearAllMocks()
    sequelize.transaction.mockImplementation((opts, cb) => cb(TX))
    lockByCorporate.mockResolvedValue({ corporateId: 42 })
    assertPhysicalCardAllowed.mockResolvedValue({ ok: true })
    createCard.mockResolvedValue({ id: 7 })
})

describe('serialising the allowance', () => {
    it('locks the corporate before counting anything', async () => {
        await reserve()

        expect(lockByCorporate).toHaveBeenCalledWith(42, TX)
        expect(lockByCorporate.mock.invocationCallOrder[0])
            .toBeLessThan(assertPhysicalCardAllowed.mock.invocationCallOrder[0])
    })

    it('counts and inserts in the same transaction', async () => {
        await reserve()

        expect(assertPhysicalCardAllowed).toHaveBeenCalledWith(expect.any(Object), TX)
        expect(createCard).toHaveBeenCalledWith(FIELDS, TX)
    })

    /**
     * READ COMMITTED is not decoration: under REPEATABLE READ whether the post-lock count sees a
     * committed insert depends on read-view timing, and an allowance must not rest on that.
     */
    it('runs at READ COMMITTED', async () => {
        await reserve()

        expect(sequelize.transaction.mock.calls[0][0]).toMatchObject({ isolationLevel: 'READ COMMITTED' })
    })

    /**
     * A missing row takes a gap lock, and InnoDB gap locks co-exist — both transactions would acquire it
     * and neither would block, so the allowance would not serialise at all.
     */
    it('refuses when there is no application row to serialise on', async () => {
        lockByCorporate.mockResolvedValue(null)

        await expect(reserve()).rejects.toMatchObject({ statusCode: 500, message: GENERIC_ERROR })
        expect(createCard).not.toHaveBeenCalled()
    })
})

describe('an exhausted allowance', () => {
    it('refuses with 402 and the quota, and writes no card', async () => {
        const quota = { requiresPayment: true, unitPrice: 19 }
        assertPhysicalCardAllowed.mockResolvedValue({ ok: false, message: 'pay up', ...quota })

        await expect(reserve()).rejects.toBeInstanceOf(CardSlotError)
        await expect(reserve()).rejects.toMatchObject({ statusCode: 402, message: 'pay up' })
        expect(createCard).not.toHaveBeenCalled()
    })
})

/**
 * The card was already bought. The row proving that payment is the very row being inserted here, so the
 * allowance cannot see it yet — checking would refuse the card the corporate has just paid for.
 */
describe('a prepaid card', () => {
    it('skips the allowance check entirely', async () => {
        await reserve({ prepaid: true })

        expect(assertPhysicalCardAllowed).not.toHaveBeenCalled()
        expect(createCard).toHaveBeenCalledWith(FIELDS, TX)
    })

    it('is inserted even when the allowance would have refused it', async () => {
        assertPhysicalCardAllowed.mockResolvedValue({ ok: false, message: 'pay up', requiresPayment: true })

        await expect(reserve({ prepaid: true })).resolves.toEqual({ id: 7 })
    })

    // Still serialised: two concurrent paid orders must not race the count for the cards that follow.
    it('still takes the corporate lock', async () => {
        await reserve({ prepaid: true })

        expect(lockByCorporate).toHaveBeenCalledWith(42, TX)
    })
})
