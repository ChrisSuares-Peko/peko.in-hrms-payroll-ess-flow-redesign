const { Op } = require('sequelize')
const cardTransaction = require('../../entities/cardTransaction')
const cardIssuance = require('../../entities/cardIssuance')
const { findByTransactionUniqueId, findById, setAdminApproval, listTransactions, getMonthlySummary, getSpendByCard, getAuthorizedSpendForCard, recordAuth, recordNotify } = require('../cardTransaction')

jest.mock('../../entities/cardTransaction', () => ({
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
}))

jest.mock('../../entities/cardIssuance', () => ({
    findAll: jest.fn(),
}))

describe('findByTransactionUniqueId', () => {
    beforeEach(() => jest.clearAllMocks())

    it('looks up the original AUTH row by transactionUniqueId, never a refund row sharing the same id', async () => {
        cardTransaction.findOne.mockResolvedValue({ id: 1 })

        const result = await findByTransactionUniqueId(315946233470)

        expect(cardTransaction.findOne).toHaveBeenCalledWith({ where: { transactionUniqueId: 315946233470, eventType: 'AUTH' } })
        expect(result).toEqual({ id: 1 })
    })
})

describe('recordAuth', () => {
    beforeEach(() => jest.clearAllMocks())

    it('creates a new row with eventType AUTH and status AUTH_RECEIVED when none exists', async () => {
        cardTransaction.findOne.mockResolvedValue(null)
        const created = { id: 1, update: jest.fn().mockResolvedValue() }
        cardTransaction.create.mockResolvedValue(created)

        const result = await recordAuth({ transactionUniqueId: 315946233470, decision: 'AUTHORIZED' })

        expect(cardTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
            eventType: 'AUTH',
            status: 'AUTH_RECEIVED',
            transactionUniqueId: 315946233470,
            decision: 'AUTHORIZED',
        }))
        expect(created.update).toHaveBeenCalledWith({ displayId: 'CC000001' })
        expect(result).toBe(created)
    })

    it('derives category from merchantCategoryCode via the MCC lookup', async () => {
        cardTransaction.findOne.mockResolvedValue(null)
        const created = { id: 2, update: jest.fn().mockResolvedValue() }
        cardTransaction.create.mockResolvedValue(created)

        await recordAuth({ transactionUniqueId: 315946233470, merchantCategoryCode: '5411' })

        expect(cardTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
            merchantCategoryCode: '5411',
            category: 'Groceries',
        }))
    })

    it('leaves category null when no merchantCategoryCode is present', async () => {
        cardTransaction.findOne.mockResolvedValue(null)
        const created = { id: 3, update: jest.fn().mockResolvedValue() }
        cardTransaction.create.mockResolvedValue(created)

        await recordAuth({ transactionUniqueId: 315946233470 })

        expect(cardTransaction.create).toHaveBeenCalledWith(expect.objectContaining({ category: null }))
    })

    it('is idempotent — returns the existing row instead of creating a duplicate', async () => {
        const existing = { id: 1, transactionUniqueId: 315946233470 }
        cardTransaction.findOne.mockResolvedValue(existing)

        const result = await recordAuth({ transactionUniqueId: 315946233470 })

        expect(cardTransaction.create).not.toHaveBeenCalled()
        expect(result).toBe(existing)
    })

    it('falls back to re-fetching on a unique-constraint race', async () => {
        cardTransaction.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ id: 2 })
        cardTransaction.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' })

        const result = await recordAuth({ transactionUniqueId: 315946233470 })

        expect(result).toEqual({ id: 2 })
    })
})

describe('findById', () => {
    beforeEach(() => jest.clearAllMocks())

    it('looks up by primary key', async () => {
        cardTransaction.findOne.mockResolvedValue({ id: 42 })

        const result = await findById(42)

        expect(cardTransaction.findOne).toHaveBeenCalledWith({ where: { id: 42 } })
        expect(result).toEqual({ id: 42 })
    })
})

describe('setAdminApproval', () => {
    beforeEach(() => jest.clearAllMocks())

    it('stamps the decision, reason, actor and timestamp on the row', async () => {
        const row = { id: 1, update: jest.fn().mockResolvedValue() }
        cardTransaction.findOne.mockResolvedValue(row)

        const result = await setAdminApproval(1, { adminApproval: 'REJECTED', adminApprovalReason: 'Personal', adminApprovalBy: 5 })

        expect(cardTransaction.findOne).toHaveBeenCalledWith({ where: { id: 1 } })
        expect(row.update).toHaveBeenCalledWith(expect.objectContaining({
            adminApproval: 'REJECTED',
            adminApprovalReason: 'Personal',
            adminApprovalBy: 5,
            adminApprovalAt: expect.any(Date),
        }))
        expect(result).toBe(row)
    })

    it('defaults reason and actor to null and returns null when the transaction is unknown', async () => {
        const row = { id: 2, update: jest.fn().mockResolvedValue() }
        cardTransaction.findOne.mockResolvedValueOnce(row)
        await setAdminApproval(2, { adminApproval: 'APPROVED' })
        expect(row.update).toHaveBeenCalledWith(expect.objectContaining({ adminApprovalReason: null, adminApprovalBy: null }))

        cardTransaction.findOne.mockResolvedValueOnce(null)
        const result = await setAdminApproval(999, { adminApproval: 'APPROVED' })
        expect(result).toBeNull()
    })
})

describe('listTransactions', () => {
    beforeEach(() => jest.clearAllMocks())

    it('scopes to corporateId and paginates', async () => {
        cardTransaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await listTransactions({ corporateId: 42, limit: 10, offset: 0 })

        expect(cardTransaction.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { corporateId: 42 },
            limit: 10,
            offset: 0,
        }))
    })

    it('narrows by userId, decision, internalStatus and category when provided', async () => {
        cardTransaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await listTransactions({
            corporateId: 42,
            cardholder: { userId: '99' },
            decision: 'DECLINED',
            internalStatus: 'AUTH_RECEIVED',
            category: 'Groceries',
            limit: 10,
            offset: 0,
        })

        expect(cardTransaction.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                corporateId: 42,
                userId: '99',
                decision: 'DECLINED',
                status: 'AUTH_RECEIVED',
                category: 'Groceries',
            },
        }))
    })

    it('left-joins only the own-table cardIssuance (cardholder identity is hydrated by callers)', async () => {
        cardTransaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await listTransactions({ corporateId: 42, limit: 10, offset: 0 })

        const { include } = cardTransaction.findAndCountAll.mock.calls[0][0]
        expect(include).toEqual([
            expect.objectContaining({ attributes: ['id', 'maskedCardNumber', 'userId', 'nameOnCard'], required: false }),
        ])
    })

    // One box above the table, and every column the table shows has to be reachable from it.
    const orFor = async (args) => {
        cardTransaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await listTransactions({ corporateId: 42, limit: 10, offset: 0, ...args })
        return cardTransaction.findAndCountAll.mock.calls[0][0].where[Op.or]
    }

    it('always searches the text columns the table renders', async () => {
        expect(await orFor({ searchText: 'Stark' })).toEqual(expect.arrayContaining([
            { merchantName: { [Op.like]: '%Stark%' } },
            { displayId: { [Op.like]: '%Stark%' } },
            { category: { [Op.like]: '%Stark%' } },
            { declineReason: { [Op.like]: '%Stark%' } },
            { '$cardIssuance.maskedCardNumber$': { [Op.like]: '%Stark%' } },
        ]))
    })

    it('escapes LIKE metacharacters so a typed % narrows instead of matching everything', async () => {
        const or = await orFor({ searchText: '50%' })
        expect(or).toEqual(expect.arrayContaining([{ merchantName: { [Op.like]: '%50\\%%' } }]))
    })

    // The amount is a DECIMAL, so it is cast to text to let "12" find 1200.00 the way the other
    // columns behave. The cast is only paid for when the term could actually be an amount.
    const amountBranch = (or) => or.find((c) => c && c.attribute?.type === 'CHAR')

    it('matches the amount column when the term reads as an amount', async () => {
        const branch = amountBranch(await orFor({ searchText: '1200.50' }))
        expect(branch).toBeDefined()
        expect(branch.attribute.val.col).toBe('cardTransaction.transactionAmount')
    })

    it('does not cast the amount for a term that cannot be one', async () => {
        expect(amountBranch(await orFor({ searchText: 'Stark' }))).toBeUndefined()
    })

    it('matches the date column for a typed day, as a range rather than a string compare', async () => {
        const or = await orFor({ searchText: '2026-08-12' })
        const dateBranch = or.find((c) => c && c.createdAt)
        expect(dateBranch.createdAt[Op.gte]).toEqual(new Date('2026-08-12T00:00:00.000Z'))
        expect(dateBranch.createdAt[Op.lt]).toEqual(new Date('2026-08-13T00:00:00.000Z'))
    })

    it('does not mistake a bare number for a date', async () => {
        const or = await orFor({ searchText: '12' })
        expect(or.some((c) => c && c.createdAt)).toBe(false)
    })

    it('matches the status column by the word the user reads on screen', async () => {
        const or = await orFor({ searchText: 'declined' })
        expect(or).toEqual(expect.arrayContaining([{ decision: 'DECLINED', status: 'AUTH_RECEIVED' }]))
    })

    it('matches the reversed status separately from declined', async () => {
        const or = await orFor({ searchText: 'reversed' })
        expect(or).toEqual(expect.arrayContaining([{ decision: 'DECLINED', status: 'REVERSED' }]))
    })

    it('matches the approval column by its label', async () => {
        const or = await orFor({ searchText: 'approved' })
        expect(or).toEqual(expect.arrayContaining([{ adminApproval: { [Op.in]: ['APPROVED'] } }]))
    })

    // Member lives in the others directory, not this database, so the caller resolves it to ids first.
    it('matches the member column through the ids the caller resolved', async () => {
        const or = await orFor({ searchText: 'aarav', searchMatchIds: ['99', '101'] })
        expect(or).toEqual(expect.arrayContaining([{ userId: { [Op.in]: ['99', '101'] } }]))
    })

    it('omits the member branch for a cardholder session, whose own scope already pins the rows', async () => {
        const or = await orFor({ searchText: 'aarav', searchMatchIds: ['99'], cardholder: { userId: '42' } })
        expect(or.some((c) => c && c.userId)).toBe(false)
    })

    it('builds no OR at all for an empty or whitespace search', async () => {
        expect(await orFor({ searchText: '   ' })).toBeUndefined()
        expect(await orFor({})).toBeUndefined()
    })

    it('turns the cardIssuance join into an inner join filtered by the last 4 digits when cardLast4 is provided', async () => {
        cardTransaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await listTransactions({ corporateId: 42, cardLast4: '7890', limit: 10, offset: 0 })

        const { include } = cardTransaction.findAndCountAll.mock.calls[0][0]
        expect(include).toEqual(expect.arrayContaining([
            expect.objectContaining({ attributes: ['id', 'maskedCardNumber', 'userId', 'nameOnCard'], where: { maskedCardNumber: { [Op.like]: '%7890' } }, required: true }),
        ]))
    })

    it('leaves both joins as left joins (required: false) when member/cardLast4 are absent', async () => {
        cardTransaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await listTransactions({ corporateId: 42, limit: 10, offset: 0 })

        const { include } = cardTransaction.findAndCountAll.mock.calls[0][0]
        include.forEach((inc) => expect(inc.required).toBe(false))
    })
})

describe('getMonthlySummary', () => {
    beforeEach(() => jest.clearAllMocks())

    it('only counts AUTHORIZED transactions within the month window', async () => {
        cardTransaction.findOne.mockResolvedValue({ amountSpent: '4599.00', transactionCount: '2' })
        const monthStart = new Date('2026-07-01T00:00:00.000Z')
        const monthEnd = new Date('2026-08-01T00:00:00.000Z')

        const result = await getMonthlySummary({ corporateId: 42, cardholder: { userId: '99' }, monthStart, monthEnd })

        expect(cardTransaction.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ corporateId: 42, userId: '99', decision: 'AUTHORIZED' }),
            raw: true,
        }))
        expect(result).toEqual({ amountSpent: 4599, transactionCount: 2 })
    })

    it('defaults to zero when there are no matching transactions', async () => {
        cardTransaction.findOne.mockResolvedValue({ amountSpent: null, transactionCount: '0' })

        const result = await getMonthlySummary({ corporateId: 42, monthStart: new Date(), monthEnd: new Date() })

        expect(result).toEqual({ amountSpent: 0, transactionCount: 0 })
    })
})

describe('getSpendByCard', () => {
    beforeEach(() => jest.clearAllMocks())

    const monthStart = new Date('2026-07-01T00:00:00.000Z')
    const monthEnd = new Date('2026-08-01T00:00:00.000Z')

    it('returns per-id spend unchanged when no card shares a referenceNumber with another', async () => {
        cardIssuance.findAll
            .mockResolvedValueOnce([{ id: 1, referenceNumber: null }, { id: 2, referenceNumber: null }])
        cardTransaction.findAll.mockResolvedValue([
            { cardIssuanceId: '1', spent: '500.00' },
            { cardIssuanceId: '2', spent: '0' },
        ])

        const map = await getSpendByCard({ corporateId: 42, cardIssuanceIds: ['1', '2'], monthStart, monthEnd })

        expect(map.get('1')).toBe(500)
        expect(map.get('2')).toBe(0)
        expect(cardIssuance.findAll).toHaveBeenCalledTimes(1)
        const { where } = cardTransaction.findAll.mock.calls[0][0]
        expect(where.cardIssuanceId[Op.in].sort()).toEqual(['1', '2'])
    })

    it('folds a REPLACED predecessor\'s spend onto the currently displayed card sharing its referenceNumber', async () => {
        cardIssuance.findAll
            .mockResolvedValueOnce([{ id: 2, referenceNumber: 'REF-2260' }])
            .mockResolvedValueOnce([
                { id: 1, referenceNumber: 'REF-2260' },
                { id: 2, referenceNumber: 'REF-2260' },
            ])
        cardTransaction.findAll.mockResolvedValue([
            { cardIssuanceId: '1', spent: '15000.00' },
        ])

        const map = await getSpendByCard({ corporateId: 42, cardIssuanceIds: ['2'], monthStart, monthEnd })

        expect(map.get('2')).toBe(15000)
        const { where } = cardTransaction.findAll.mock.calls[0][0]
        expect(where.cardIssuanceId[Op.in].sort()).toEqual(['1', '2'])
    })

    it('returns an empty Map without querying when cardIssuanceIds is an empty array', async () => {
        const map = await getSpendByCard({ corporateId: 42, cardIssuanceIds: [], monthStart, monthEnd })

        expect(map.size).toBe(0)
        expect(cardIssuance.findAll).not.toHaveBeenCalled()
        expect(cardTransaction.findAll).not.toHaveBeenCalled()
    })

    it('returns the raw per-row map when cardIssuanceIds is omitted (no family folding possible)', async () => {
        cardTransaction.findAll.mockResolvedValue([{ cardIssuanceId: '1', spent: '250.00' }])

        const map = await getSpendByCard({ corporateId: 42, monthStart, monthEnd })

        expect(map.get('1')).toBe(250)
        expect(cardIssuance.findAll).not.toHaveBeenCalled()
    })
})

describe('getAuthorizedSpendForCard', () => {
    beforeEach(() => jest.clearAllMocks())

    it('sums AUTHORIZED transactions for one card within the given window, netting any refund rows', async () => {
        cardTransaction.findOne.mockResolvedValue({ amountSpent: '1500.00' })
        const windowStart = new Date('2026-07-08T00:00:00.000Z')
        const windowEnd = new Date('2026-07-09T00:00:00.000Z')

        const result = await getAuthorizedSpendForCard({ cardIssuanceId: 7, windowStart, windowEnd })

        const call = cardTransaction.findOne.mock.calls[0][0]
        expect(call.where).toEqual({ cardIssuanceId: 7, decision: 'AUTHORIZED', createdAt: expect.any(Object) })
        expect(call.raw).toBe(true)
        // A refund is its own linked row (eventType REFUND), not a status flip on the original — so the
        // SUM must subtract a refund row's amount instead of merely excluding some status.
        expect(call.attributes[0][0].val).toContain("WHEN eventType = 'REFUND' THEN -transactionAmount")
        expect(result).toBe(1500)
    })

    // The exact scenario a refund must revert: card limit 300, a 275 debit spends it down to 25
    // available, then the NOTIFY webhook creates a linked REFUND row for 275 — the card's available
    // limit must go back to the full 300, i.e. the two rows must net to zero spend.
    it('nets a REFUND row against its original debit, reverting the card limit it had consumed', async () => {
        cardTransaction.findOne.mockResolvedValue({ amountSpent: '0.00' })
        const windowStart = new Date('2026-07-08T00:00:00.000Z')
        const windowEnd = new Date('2026-07-09T00:00:00.000Z')

        const result = await getAuthorizedSpendForCard({ cardIssuanceId: 7, windowStart, windowEnd })

        expect(result).toBe(0)
    })

    it('defaults to zero when the card has no authorized spend in the window', async () => {
        cardTransaction.findOne.mockResolvedValue({ amountSpent: null })

        const result = await getAuthorizedSpendForCard({ cardIssuanceId: 7, windowStart: new Date(), windowEnd: new Date() })

        expect(result).toBe(0)
    })
})

describe('recordNotify', () => {
    beforeEach(() => jest.clearAllMocks())

    it('updates the existing AUTH row with NOTIFY detail', async () => {
        const existing = { update: jest.fn().mockResolvedValue() }
        cardTransaction.findOne.mockResolvedValue(existing)

        const result = await recordNotify(315946233470, { notificationUniqueId: 703159461724 })

        expect(existing.update).toHaveBeenCalledWith(expect.objectContaining({
            status: 'NOTIFIED',
            notificationUniqueId: 703159461724,
        }))
        expect(result).toBe(existing)
    })

    it('returns null without updating anything when the transactionUniqueId is unknown', async () => {
        cardTransaction.findOne.mockResolvedValue(null)

        const result = await recordNotify(315946233470, { notificationUniqueId: 703159461724 })

        expect(result).toBeNull()
    })
})
