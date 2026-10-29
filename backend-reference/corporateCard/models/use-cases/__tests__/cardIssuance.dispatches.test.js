jest.mock('../../entities/cardIssuance', () => ({ findOne: jest.fn() }))
jest.mock('../../entities/cardRequest', () => ({}))
jest.mock('../../../configs/database/index', () => ({
    transaction: jest.fn((cb) => cb({ LOCK: { UPDATE: 'UPDATE' } })),
}))
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))

const { Op } = require('sequelize')
const cardIssuance = require('../../entities/cardIssuance')
const { customLog } = require('../../../utils/loggerHelper')
const { appendDispatches, findPhysicalByReferenceNumber, findAndCountPhysicalTracking } = require('../cardIssuance')

const logFor = (pattern) => customLog.mock.calls.find(([, , data]) => pattern.test(data?.message || ''))

const keyOf = (record) => `${record.awbNumber}|${record.dispatchedOn}`
const record = (overrides = {}) => ({ awbNumber: '358704', dispatchedOn: '2026-08-08T18:11:10', ...overrides })

describe('findPhysicalByReferenceNumber', () => {
    beforeEach(() => jest.clearAllMocks())

    // A physical card inherits the referenceNumber of the virtual it replaces, so an unscoped lookup
    // can return the virtual and file a courier event against a card that was never posted.
    it('restricts the lookup to Physical cards', async () => {
        cardIssuance.findOne.mockResolvedValue({ id: 9 })

        await findPhysicalByReferenceNumber('31157821')

        expect(cardIssuance.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { referenceNumber: '31157821', cardType: 'Physical' },
        }))
    })

    it('prefers the newest row, since a re-issue can repeat the reference', async () => {
        cardIssuance.findOne.mockResolvedValue({ id: 9 })

        await findPhysicalByReferenceNumber('31157821')

        expect(cardIssuance.findOne.mock.calls[0][0].order).toEqual([['id', 'DESC']])
    })
})

describe('findAndCountPhysicalTracking', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        cardIssuance.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] })
    })

    const whereOf = () => cardIssuance.findAndCountAll.mock.calls[0][0].where

    it('returns physical cards for the corporate, newest first', async () => {
        await findAndCountPhysicalTracking({ corporateId: 42, limit: 10, offset: 0 })

        expect(whereOf()).toEqual(expect.objectContaining({ corporateId: 42, cardType: 'Physical' }))
        expect(cardIssuance.findAndCountAll.mock.calls[0][0].order).toEqual([['createdAt', 'DESC'], ['id', 'DESC']])
    })

    // The controller pins a cardholder to their own userId; if the query dropped it, that
    // caller would read every physical order in the corporate — postal addresses included.
    it('narrows to one member when a userId is given', async () => {
        await findAndCountPhysicalTracking({ corporateId: 42, cardholder: { userId: '99' }, limit: 10, offset: 0 })

        expect(whereOf().userId).toBe('99')
    })

    it('does not constrain the member when none is given', async () => {
        await findAndCountPhysicalTracking({ corporateId: 42, limit: 10, offset: 0 })

        expect(whereOf()).not.toHaveProperty('userId')
    })

    it('hides replaced orders unless a status is asked for explicitly', async () => {
        await findAndCountPhysicalTracking({ corporateId: 42, limit: 10, offset: 0 })

        expect(whereOf().status).toEqual({ [Op.ne]: 'REPLACED' })
    })

    it('uses the asked-for status when one is given', async () => {
        await findAndCountPhysicalTracking({ corporateId: 42, status: 'PENDING', limit: 10, offset: 0 })

        expect(whereOf().status).toBe('PENDING')
    })

    it('passes the page window straight through', async () => {
        await findAndCountPhysicalTracking({ corporateId: 42, limit: 10, offset: 20 })

        expect(cardIssuance.findAndCountAll.mock.calls[0][0]).toEqual(
            expect.objectContaining({ limit: 10, offset: 20 })
        )
    })
})

describe('appendDispatches', () => {
    beforeEach(() => jest.clearAllMocks())

    const row = (dispatches) => {
        const update = jest.fn().mockResolvedValue()
        cardIssuance.findOne.mockResolvedValue({ id: 1, dispatches, update })
        return update
    }

    it('creates the array on the first dispatch', async () => {
        const update = row(null)
        const first = record()

        const result = await appendDispatches(1, [first], { keyOf })

        expect(update).toHaveBeenCalledWith({ dispatches: [first] }, expect.objectContaining({ transaction: expect.anything() }))
        expect(result).toEqual({ added: 1, duplicates: 0, capped: 0, total: 1 })
    })

    it('pushes a new dispatch onto an existing array without dropping what was there', async () => {
        const existing = record({ awbNumber: 'OLD' })
        const update = row([existing])
        const next = record({ awbNumber: 'NEW' })

        const result = await appendDispatches(1, [next], { keyOf })

        expect(update).toHaveBeenCalledWith({ dispatches: [existing, next] }, expect.anything())
        expect(result.added).toBe(1)
        expect(result.total).toBe(2)
    })

    // A webhook is delivered at least once, so the same record will arrive twice.
    it('skips a record the card already holds, and writes nothing', async () => {
        const existing = record()
        const update = row([existing])

        const result = await appendDispatches(1, [{ ...existing }], { keyOf })

        expect(update).not.toHaveBeenCalled()
        expect(result).toEqual({ added: 0, duplicates: 1, capped: 0, total: 1 })
    })

    it('dedupes within a single call as well as against what is stored', async () => {
        const update = row([])
        const dupe = record()

        const result = await appendDispatches(1, [dupe, { ...dupe }], { keyOf })

        expect(update).toHaveBeenCalledWith({ dispatches: [dupe] }, expect.anything())
        expect(result).toEqual({ added: 1, duplicates: 1, capped: 0, total: 1 })
    })

    it('appends several new records in one write, not one write each', async () => {
        const update = row([])
        const a = record({ awbNumber: 'A' })
        const b = record({ awbNumber: 'B' })

        const result = await appendDispatches(1, [a, b], { keyOf })

        expect(update).toHaveBeenCalledTimes(1)
        expect(update).toHaveBeenCalledWith({ dispatches: [a, b] }, expect.anything())
        expect(result.added).toBe(2)
    })

    // Two concurrent deliveries would each read the same array and the second would overwrite the
    // first. The lock is the only thing preventing that, so it is asserted.
    it('locks the row for update rather than doing a plain read', async () => {
        row([])

        await appendDispatches(1, [record()], { keyOf })

        expect(cardIssuance.findOne).toHaveBeenCalledWith(expect.objectContaining({
            lock: 'UPDATE',
            transaction: expect.anything(),
        }))
    })

    it('refuses to grow past the cap and reports what it dropped', async () => {
        const existing = Array.from({ length: 3 }, (_, i) => record({ awbNumber: `E${i}` }))
        const update = row(existing)

        const result = await appendDispatches(1, [record({ awbNumber: 'N1' }), record({ awbNumber: 'N2' })], { keyOf, max: 3 })

        expect(update).not.toHaveBeenCalled()
        expect(result).toEqual({ added: 0, duplicates: 0, capped: 2, total: 3 })
    })

    it('stores what fits before the cap bites', async () => {
        const update = row([record({ awbNumber: 'E0' })])

        const result = await appendDispatches(1, [record({ awbNumber: 'N1' }), record({ awbNumber: 'N2' })], { keyOf, max: 2 })

        expect(result).toEqual({ added: 1, duplicates: 0, capped: 1, total: 2 })
        expect(update.mock.calls[0][0].dispatches).toHaveLength(2)
    })

    it('answers null when the card is gone, so the caller can report it unmatched', async () => {
        cardIssuance.findOne.mockResolvedValue(null)

        await expect(appendDispatches(1, [record()], { keyOf })).resolves.toBeNull()
    })

    it('logs the write with the counts needed to reconcile it later', async () => {
        row([record({ awbNumber: 'E0' })])

        await appendDispatches(7, [record({ awbNumber: 'N1' }), record({ awbNumber: 'E0' })], { keyOf, logTraceId: 'trace-1' })

        const entry = logFor(/dispatches column updated/)
        expect(entry).toBeDefined()
        expect(entry[0]).toBe('trace-1')
        expect(entry[1]).toBe('info')
        expect(entry[2]).toEqual(expect.objectContaining({
            cardIssuanceId: 7, offered: 2, added: 1, duplicates: 1, capped: 0, before: 1, total: 2,
        }))
    })

    it('says plainly in the log when it wrote nothing', async () => {
        const existing = record()
        row([existing])

        await appendDispatches(7, [{ ...existing }], { keyOf, logTraceId: 'trace-2' })

        expect(logFor(/nothing to write/)).toBeDefined()
        expect(logFor(/dispatches column updated/)).toBeUndefined()
    })

    it('logs at error level when the row vanished under the lock', async () => {
        cardIssuance.findOne.mockResolvedValue(null)

        await appendDispatches(7, [record()], { keyOf, logTraceId: 'trace-3' })

        const entry = logFor(/vanished/)
        expect(entry).toBeDefined()
        expect(entry[1]).toBe('error')
        expect(entry[2].cardIssuanceId).toBe(7)
    })

    it('tolerates a dispatches column holding something that is not an array', async () => {
        const update = row('corrupt')
        const first = record()

        const result = await appendDispatches(1, [first], { keyOf })

        expect(update).toHaveBeenCalledWith({ dispatches: [first] }, expect.anything())
        expect(result.total).toBe(1)
    })
})
