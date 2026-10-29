const ledger = require('../../entities/corporateCardLedgerEntry')
const { createEntry, sumByDirection, findAndCountByCorporate } = require('../corporateCardLedger')

jest.mock('../../entities/corporateCardLedgerEntry', () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
}))

describe('createEntry', () => {
    beforeEach(() => jest.clearAllMocks())

    it('creates and returns the new ledger entry on the happy path', async () => {
        const created = { id: 1 }
        ledger.create.mockResolvedValue(created)
        const fields = { corporateId: 42, direction: 'IN', amount: 500 }

        const result = await createEntry(fields)

        expect(ledger.create).toHaveBeenCalledWith(fields, {})
        expect(result).toBe(created)
    })

    it('writes inside a caller-supplied transaction when given one', async () => {
        const tx = { id: 'tx-1' }
        ledger.create.mockResolvedValue({ id: 1 })
        const fields = { corporateId: 42, direction: 'IN', amount: 500 }

        await createEntry(fields, { transaction: tx })

        expect(ledger.create).toHaveBeenCalledWith(fields, { transaction: tx })
    })

    it('looks the existing row up inside the same transaction on a duplicate', async () => {
        const tx = { id: 'tx-1' }
        const err = new Error('dup')
        err.name = 'SequelizeUniqueConstraintError'
        ledger.create.mockRejectedValue(err)
        ledger.findOne.mockResolvedValue({ id: 9 })

        await createEntry(
            { corporateId: 42, refType: 'ISSUER_BALANCE_SYNC', refId: '77' },
            { transaction: tx }
        )

        expect(ledger.findOne).toHaveBeenCalledWith({
            where: { refType: 'ISSUER_BALANCE_SYNC', refId: '77', corporateId: 42 },
            transaction: tx,
        })
    })

    it('is idempotent: on a unique-constraint clash with refType + refId, returns the existing row', async () => {
        const existing = { id: 9 }
        ledger.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' })
        ledger.findOne.mockResolvedValue(existing)
        const fields = { corporateId: 42, direction: 'IN', amount: 500, refType: 'BANK_UTR', refId: 'UTR123' }

        const result = await createEntry(fields)

        expect(ledger.findOne).toHaveBeenCalledWith({ where: { refType: 'BANK_UTR', refId: 'UTR123', corporateId: 42 } })
        expect(result).toBe(existing)
    })

    it('rethrows a unique-constraint error when there is no ref to dedupe on', async () => {
        const err = { name: 'SequelizeUniqueConstraintError' }
        ledger.create.mockRejectedValue(err)

        await expect(createEntry({ corporateId: 42, direction: 'IN', amount: 500 })).rejects.toEqual(err)
        expect(ledger.findOne).not.toHaveBeenCalled()
    })

    it('rethrows any non-unique error untouched', async () => {
        const err = new Error('db down')
        ledger.create.mockRejectedValue(err)

        await expect(createEntry({ corporateId: 42, refType: 'X', refId: 'Y' })).rejects.toThrow('db down')
        expect(ledger.findOne).not.toHaveBeenCalled()
    })
})

describe('sumByDirection', () => {
    beforeEach(() => jest.clearAllMocks())

    it('maps grouped totals into { in, out } with numeric coercion', async () => {
        ledger.findAll.mockResolvedValue([
            { direction: 'IN', total: '500' },
            { direction: 'OUT', total: '120' },
        ])

        const result = await sumByDirection({ corporateId: 42 })

        expect(ledger.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { corporateId: 42 },
            group: ['direction'],
            raw: true,
        }))
        expect(result).toEqual({ in: 500, out: 120 })
    })

    it('defaults a missing direction to zero', async () => {
        ledger.findAll.mockResolvedValue([{ direction: 'IN', total: '75' }])

        const result = await sumByDirection({ corporateId: 42 })

        expect(result).toEqual({ in: 75, out: 0 })
    })

    it('returns zeros when there are no entries', async () => {
        ledger.findAll.mockResolvedValue([])

        const result = await sumByDirection({ corporateId: 42 })

        expect(result).toEqual({ in: 0, out: 0 })
    })
})

describe('findAndCountByCorporate', () => {
    beforeEach(() => jest.clearAllMocks())

    it('lists a corporate\'s entries newest-movement-first, paginated, unfiltered', async () => {
        ledger.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountByCorporate({ corporateId: 42, limit: 10, offset: 0 })

        expect(ledger.findAndCountAll).toHaveBeenCalledWith({
            where: { corporateId: 42 },
            order: [['occurredAt', 'DESC'], ['id', 'DESC']],
            limit: 10,
            offset: 0,
        })
    })

    it('narrows by direction and entryType when provided', async () => {
        ledger.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountByCorporate({ corporateId: 42, direction: 'IN', entryType: 'TOPUP', limit: 10, offset: 0 })

        expect(ledger.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { corporateId: 42, direction: 'IN', entryType: 'TOPUP' },
        }))
    })
})
