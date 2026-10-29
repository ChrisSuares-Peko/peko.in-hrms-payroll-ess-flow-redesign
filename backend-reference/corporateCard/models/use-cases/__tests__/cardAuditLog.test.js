const cardAuditLog = require('../../entities/cardAuditLog')
const { writeAudit, findByCard, findByCorporate, findAllByCard } = require('../cardAuditLog')

jest.mock('../../entities/cardAuditLog', () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
}))

describe('writeAudit', () => {
    beforeEach(() => jest.clearAllMocks())

    it('creates the row inside the supplied transaction', async () => {
        const created = { id: 1 }
        cardAuditLog.create.mockResolvedValue(created)
        const txn = {}
        const fields = { cardIssuanceId: 5, category: 'LIMIT', description: 'raised to ₹2000' }

        const result = await writeAudit(fields, txn)

        expect(cardAuditLog.create).toHaveBeenCalledWith(fields, { transaction: txn })
        expect(result).toBe(created)
    })

    it('creates the row with no options object when no transaction is supplied', async () => {
        cardAuditLog.create.mockResolvedValue({ id: 2 })
        const fields = { cardIssuanceId: 5 }

        await writeAudit(fields)

        expect(cardAuditLog.create).toHaveBeenCalledWith(fields, undefined)
    })
})

describe('findByCard', () => {
    beforeEach(() => jest.clearAllMocks())

    it('lists a card\'s audit rows newest-first, paginated, without a category filter', async () => {
        cardAuditLog.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findByCard({ cardIssuanceId: 5, limit: 10, offset: 0 })

        expect(cardAuditLog.findAndCountAll).toHaveBeenCalledWith({
            where: { cardIssuanceId: 5 },
            order: [['id', 'DESC']],
            limit: 10,
            offset: 0,
        })
    })

    it('narrows by category when provided', async () => {
        cardAuditLog.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findByCard({ cardIssuanceId: 5, category: 'STATE', limit: 10, offset: 0 })

        expect(cardAuditLog.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { cardIssuanceId: 5, category: 'STATE' },
        }))
    })
})

describe('findByCorporate', () => {
    beforeEach(() => jest.clearAllMocks())

    it('lists org-wide audit rows scoped to the corporate, newest-first, paginated', async () => {
        cardAuditLog.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findByCorporate({ corporateId: 42, limit: 20, offset: 40 })

        expect(cardAuditLog.findAndCountAll).toHaveBeenCalledWith({
            where: { corporateId: 42 },
            order: [['id', 'DESC']],
            limit: 20,
            offset: 40,
        })
    })

    it('narrows by category when provided', async () => {
        cardAuditLog.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findByCorporate({ corporateId: 42, category: 'ISSUANCE', limit: 20, offset: 0 })

        expect(cardAuditLog.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { corporateId: 42, category: 'ISSUANCE' },
        }))
    })
})

describe('findAllByCard', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns all rows for a card (findAll, no offset) capped by limit, newest-first', async () => {
        const rows = [{ id: 2 }, { id: 1 }]
        cardAuditLog.findAll.mockResolvedValue(rows)

        const result = await findAllByCard({ cardIssuanceId: 5, limit: 5000 })

        expect(cardAuditLog.findAll).toHaveBeenCalledWith({
            where: { cardIssuanceId: 5 },
            order: [['id', 'DESC']],
            limit: 5000,
        })
        expect(result).toBe(rows)
    })

    it('narrows by category when provided', async () => {
        cardAuditLog.findAll.mockResolvedValue([])

        await findAllByCard({ cardIssuanceId: 5, category: 'STATE', limit: 5000 })

        expect(cardAuditLog.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { cardIssuanceId: 5, category: 'STATE' },
        }))
    })
})
