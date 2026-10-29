const { Op } = require('sequelize')
const cardIssuance = require('../../entities/cardIssuance')
const cardRequest = require('../../entities/cardRequest')
const {
    findCardsByScope,
    findByExternalRequestId,
    findByExternalCardIdentifier,
    findBlockingIssuance,
    findFirstIssuedByCardholder,
    findWalletByCardholder,
    createCard,
    countPhysicalCardsUsed,
    countPaidPhysicalCards,
    updateCardById,
    sumCardLimits,
    findByIdScoped,
    findByIdForUpdate,
    applyLimit,
    updateCardStateById,
    findAndCountCardsWithHolder,
} = require('../cardIssuance')

jest.mock('../../entities/cardIssuance', () => ({
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findAndCountAll: jest.fn(),
}))

jest.mock('../../entities/cardRequest', () => ({
    findAll: jest.fn(),
}))

describe('findCardsByScope', () => {
    beforeEach(() => jest.clearAllMocks())

    it('scopes to corporateId only when no cardholder is given, no join, newest first', async () => {
        cardIssuance.findAll.mockResolvedValue([{ id: 1 }])

        const result = await findCardsByScope({ corporateId: 42 })

        const options = cardIssuance.findAll.mock.calls[0][0]
        expect(options.where).toEqual({ corporateId: 42, status: { [Op.ne]: 'REPLACED' } })
        expect(options.order).toEqual([['id', 'DESC']])
        expect(options.include).toBeUndefined()
        expect(result).toEqual([{ id: 1 }])
    })

    it('narrows to a single cardholder when userId is given', async () => {
        cardIssuance.findAll.mockResolvedValue([])

        await findCardsByScope({ corporateId: 42, cardholder: { userId: 99 } })

        expect(cardIssuance.findAll.mock.calls[0][0].where).toEqual({ corporateId: 42, userId: 99, status: { [Op.ne]: 'REPLACED' } })
    })
})

describe('findByExternalRequestId / findByExternalCardIdentifier', () => {
    beforeEach(() => jest.clearAllMocks())

    it('coerces the external request id to a string for the lookup', async () => {
        cardIssuance.findOne.mockResolvedValue({ id: 1 })

        await findByExternalRequestId(12345)

        expect(cardIssuance.findOne).toHaveBeenCalledWith({ where: { externalRequestId: '12345' } })
    })

    it('coerces the external card identifier to a string for the lookup', async () => {
        cardIssuance.findOne.mockResolvedValue({ id: 1 })

        await findByExternalCardIdentifier(98765)

        expect(cardIssuance.findOne).toHaveBeenCalledWith({ where: { externalCardIdentifier: '98765' } })
    })

    it('returns the card as-is when it is not REPLACED (no second lookup)', async () => {
        cardIssuance.findOne.mockResolvedValueOnce({ id: 1, status: 'ISSUED', referenceNumber: 'REF1' })

        const result = await findByExternalCardIdentifier('ext-1')

        expect(cardIssuance.findOne).toHaveBeenCalledTimes(1)
        expect(result).toEqual({ id: 1, status: 'ISSUED', referenceNumber: 'REF1' })
    })

    it('resolves through to the ISSUED replacement when the matched card is REPLACED', async () => {
        cardIssuance.findOne
            .mockResolvedValueOnce({ id: 1, status: 'REPLACED', referenceNumber: 'REF1' })
            .mockResolvedValueOnce({ id: 2, status: 'ISSUED', referenceNumber: 'REF1' })

        const result = await findByExternalCardIdentifier('old-virtual-identifier')

        expect(cardIssuance.findOne).toHaveBeenNthCalledWith(2, { where: { referenceNumber: 'REF1', status: 'ISSUED' } })
        expect(result).toEqual({ id: 2, status: 'ISSUED', referenceNumber: 'REF1' })
    })

    it('falls back to the REPLACED card itself when no ISSUED replacement is found', async () => {
        cardIssuance.findOne
            .mockResolvedValueOnce({ id: 1, status: 'REPLACED', referenceNumber: 'REF1' })
            .mockResolvedValueOnce(null)

        const result = await findByExternalCardIdentifier('old-virtual-identifier')

        expect(result).toEqual({ id: 1, status: 'REPLACED', referenceNumber: 'REF1' })
    })

    it('does not attempt a replacement lookup when the REPLACED card has no referenceNumber', async () => {
        cardIssuance.findOne.mockResolvedValueOnce({ id: 1, status: 'REPLACED', referenceNumber: null })

        const result = await findByExternalCardIdentifier('old-virtual-identifier')

        expect(cardIssuance.findOne).toHaveBeenCalledTimes(1)
        expect(result).toEqual({ id: 1, status: 'REPLACED', referenceNumber: null })
    })

    it('returns null/falsy as-is when no card matches at all', async () => {
        cardIssuance.findOne.mockResolvedValueOnce(null)

        const result = await findByExternalCardIdentifier('unknown')

        expect(cardIssuance.findOne).toHaveBeenCalledTimes(1)
        expect(result).toBeNull()
    })
})

describe('findBlockingIssuance', () => {
    beforeEach(() => jest.clearAllMocks())

    it('blocks a virtual issuance only on another PENDING non-physical card', async () => {
        cardIssuance.findOne.mockResolvedValue(null)

        await findBlockingIssuance({ cardholder: { userId: 99 }, cardType: 'Virtual' })

        expect(cardIssuance.findOne).toHaveBeenCalledWith({
            where: { userId: 99, cardType: { [Op.ne]: 'Physical' }, status: 'PENDING' },
            order: [['id', 'DESC']],
        })
    })

    it('blocks a physical on any PENDING-or-ISSUED companion of the same source card', async () => {
        cardIssuance.findOne.mockResolvedValue(null)

        await findBlockingIssuance({ cardholder: { userId: 99 }, cardType: 'Physical', sourceCardIssuanceId: 10 })

        const { where } = cardIssuance.findOne.mock.calls[0][0]
        expect(where.cardType).toBe('Physical')
        expect(where[Op.or]).toEqual(expect.arrayContaining([
            { sourceCardIssuanceId: 10, status: { [Op.in]: ['PENDING', 'ISSUED'] } },
        ]))
    })

    it('also blocks a physical on a SOURCE-LESS pending physical for the same cardholder', async () => {
        cardIssuance.findOne.mockResolvedValue(null)

        await findBlockingIssuance({ cardholder: { userId: 99 }, cardType: 'Physical', sourceCardIssuanceId: 10 })

        const { where } = cardIssuance.findOne.mock.calls[0][0]
        expect(where[Op.or]).toEqual(expect.arrayContaining([
            { userId: 99, sourceCardIssuanceId: null, status: 'PENDING' },
        ]))
    })

    it('never issues an unbounded query when a physical has neither a source card nor a cardholder', async () => {
        const result = await findBlockingIssuance({ cardType: 'Physical' })

        expect(result).toBeNull()
        expect(cardIssuance.findOne).not.toHaveBeenCalled()
    })
})

describe('findFirstIssuedByCardholder / findWalletByCardholder', () => {
    beforeEach(() => jest.clearAllMocks())

    it('finds the oldest ISSUED card for the cardholder (ascending)', async () => {
        cardIssuance.findOne.mockResolvedValue({ id: 3 })

        await findFirstIssuedByCardholder(99)

        expect(cardIssuance.findOne).toHaveBeenCalledWith({ where: { userId: 99, status: 'ISSUED' }, order: [['id', 'ASC']] })
    })

    it('finds any card already carrying a wallet (walletNumber not null)', async () => {
        cardIssuance.findOne.mockResolvedValue(null)

        await findWalletByCardholder(99)

        expect(cardIssuance.findOne).toHaveBeenCalledWith({
            where: { userId: 99, walletNumber: { [Op.ne]: null } },
            order: [['id', 'ASC']],
        })
    })
})

describe('createCard', () => {
    beforeEach(() => jest.clearAllMocks())

    it('creates the issuance row from the given fields', async () => {
        const created = { id: 1 }
        cardIssuance.create.mockResolvedValue(created)
        const fields = { corporateId: 42, userId: 99, cardType: 'Virtual' }

        const result = await createCard(fields)

        expect(cardIssuance.create).toHaveBeenCalledWith(fields, { transaction: undefined })
        expect(result).toBe(created)
    })

    it('inserts inside the transaction it was handed', async () => {
        const transaction = { id: 'tx-1' }
        cardIssuance.create.mockResolvedValue({ id: 1 })
        const fields = { corporateId: 42, userId: 99 }

        await createCard(fields, transaction)

        expect(cardIssuance.create).toHaveBeenCalledWith(fields, { transaction })
    })

    // A card has no second identifier to fall back on: without a holder it appears on nobody's list, its
    // holder cannot freeze it, the JIT webhook stamps its transactions with a null holder, and the generated
    // activeIssuanceKey is NULL — so the unique index against duplicate cards stops covering it too.
    it('refuses to issue a card with no cardholder', async () => {
        await expect(createCard({ corporateId: 42, cardType: 'Virtual' })).rejects.toThrow()

        expect(cardIssuance.create).not.toHaveBeenCalled()
    })

    it('refuses to issue a card with no corporate', async () => {
        await expect(createCard({ userId: 99, cardType: 'Virtual' })).rejects.toThrow()

        expect(cardIssuance.create).not.toHaveBeenCalled()
    })
})

describe('updateCardById', () => {
    beforeEach(() => jest.clearAllMocks())

    it('updates by id then returns the reloaded row', async () => {
        cardIssuance.update.mockResolvedValue([1])
        const reloaded = { id: 5, cardLimit: 1000 }
        cardIssuance.findOne.mockResolvedValue(reloaded)

        const result = await updateCardById(5, { cardLimit: 1000 })

        expect(cardIssuance.update).toHaveBeenCalledWith({ cardLimit: 1000 }, { where: { id: 5 } })
        expect(cardIssuance.findOne).toHaveBeenCalledWith({ where: { id: 5 } })
        expect(result).toBe(reloaded)
    })
})

describe('sumCardLimits', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        cardRequest.findAll.mockResolvedValue([])
    })

    it('sums enforced limits + counts ISSUED cards, coercing to numbers', async () => {
        cardIssuance.findOne.mockResolvedValue({ total: '15000', count: '3' })

        const result = await sumCardLimits({ corporateId: 42 })

        expect(cardIssuance.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { corporateId: 42, status: 'ISSUED' },
            raw: true,
        }))
        expect(result).toEqual({ total: 15000, count: 3 })
    })

    it('defaults to zeros when there are no ISSUED cards', async () => {
        cardIssuance.findOne.mockResolvedValue(null)

        const result = await sumCardLimits({ corporateId: 42 })

        expect(result).toEqual({ total: 0, count: 0 })
    })

    it('excludes cards with an active or approved termination request (ADO 28791)', async () => {
        cardRequest.findAll.mockResolvedValue([{ cardIssuanceId: 7 }, { cardIssuanceId: 9 }])
        cardIssuance.findOne.mockResolvedValue({ total: '10000', count: '2' })

        const result = await sumCardLimits({ corporateId: 42 })

        expect(cardRequest.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                corporateId: 42,
                requestType: 'TERMINATE',
                status: { [Op.in]: ['PENDING', 'PROCESSING', 'APPROVED'] },
            }),
        }))
        expect(cardIssuance.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { corporateId: 42, status: 'ISSUED', id: { [Op.notIn]: [7, 9] } },
        }))
        expect(result).toEqual({ total: 10000, count: 2 })
    })

    it('does not add an id filter when no card has a termination request', async () => {
        cardRequest.findAll.mockResolvedValue([])
        cardIssuance.findOne.mockResolvedValue({ total: '5000', count: '1' })

        await sumCardLimits({ corporateId: 42 })

        expect(cardIssuance.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { corporateId: 42, status: 'ISSUED' },
        }))
    })
})

describe('findByIdScoped', () => {
    beforeEach(() => jest.clearAllMocks())

    it('scopes a single card to its owning corporate', async () => {
        cardIssuance.findOne.mockResolvedValue({ id: 5 })

        await findByIdScoped(5, 42)

        expect(cardIssuance.findOne).toHaveBeenCalledWith({ where: { id: 5, corporateId: 42 } })
    })
})

describe('findByIdForUpdate', () => {
    beforeEach(() => jest.clearAllMocks())

    it('reads the row FOR UPDATE inside the supplied transaction', async () => {
        cardIssuance.findOne.mockResolvedValue({ id: 5 })
        const txn = { LOCK: { UPDATE: 'UPDATE' } }

        await findByIdForUpdate(5, txn)

        expect(cardIssuance.findOne).toHaveBeenCalledWith({ where: { id: 5 }, lock: 'UPDATE', transaction: txn })
    })
})

describe('applyLimit', () => {
    beforeEach(() => jest.clearAllMocks())

    it('applies the limit fields, stamps who/when, and returns the reloaded row within the txn', async () => {
        cardIssuance.update.mockResolvedValue([1])
        const reloaded = { id: 5 }
        cardIssuance.findOne.mockResolvedValue(reloaded)
        const txn = {}

        const result = await applyLimit(5, { cardLimit: 2000 }, 11, txn)

        const [values, options] = cardIssuance.update.mock.calls[0]
        expect(values).toEqual(expect.objectContaining({ cardLimit: 2000, limitUpdatedByCredentialId: 11 }))
        expect(values.limitUpdatedAt).toBeInstanceOf(Date)
        expect(options).toEqual({ where: { id: 5 }, transaction: txn })
        expect(cardIssuance.findOne).toHaveBeenCalledWith({ where: { id: 5 }, transaction: txn })
        expect(result).toBe(reloaded)
    })
})

describe('updateCardStateById', () => {
    beforeEach(() => jest.clearAllMocks())

    it('applies freeze/unfreeze fields within the txn then returns the reloaded row', async () => {
        cardIssuance.update.mockResolvedValue([1])
        const reloaded = { id: 5, cardState: 'FROZEN' }
        cardIssuance.findOne.mockResolvedValue(reloaded)
        const txn = {}

        const result = await updateCardStateById(5, { cardState: 'FROZEN' }, txn)

        expect(cardIssuance.update).toHaveBeenCalledWith({ cardState: 'FROZEN' }, { where: { id: 5 }, transaction: txn })
        expect(cardIssuance.findOne).toHaveBeenCalledWith({ where: { id: 5 }, transaction: txn })
        expect(result).toBe(reloaded)
    })
})

describe('findAndCountCardsWithHolder', () => {
    beforeEach(() => jest.clearAllMocks())

    const whereOf = () => cardIssuance.findAndCountAll.mock.calls[0][0].where

    it('scopes to the corporate with no join, no filters', async () => {
        cardIssuance.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountCardsWithHolder({ corporateId: 42, limit: 10, offset: 0 })

        const options = cardIssuance.findAndCountAll.mock.calls[0][0]
        expect(options.where).toEqual({ corporateId: 42, status: { [Op.ne]: 'REPLACED' } })
        expect(options.include).toBeUndefined()
        expect(options).toEqual(expect.objectContaining({ order: [['id', 'DESC']], limit: 10, offset: 0 }))
        expect(options.subQuery).toBeUndefined()
    })

    it('maps the "frozen" status filter to cardState FROZEN, terminations included', async () => {
        cardIssuance.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await findAndCountCardsWithHolder({ corporateId: 42, status: 'frozen', limit: 10, offset: 0 })
        expect(whereOf()).toEqual({ corporateId: 42, cardState: 'FROZEN' })
    })

    describe('frozenNotTerminated', () => {
        const runFilter = async () => {
            cardIssuance.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
            await findAndCountCardsWithHolder({
                corporateId: 42, status: 'frozenNotTerminated', limit: 10, offset: 0,
            })
            return whereOf()
        }

        it('still restricts to frozen cards', async () => {
            const where = await runFilter()

            expect(where.corporateId).toBe(42)
            expect(where.cardState).toBe('FROZEN')
        })

        it('excludes cards carrying a live termination', async () => {
            const where = await runFilter()

            const sql = where[Op.and].map((l) => l.val).join(' ')
            expect(sql).toContain('NOT EXISTS')
            expect(sql).toContain('`cardRequests`')
            expect(sql).toContain("'TERMINATE'")
        })

        it('treats a requested, in-progress or approved termination as blocking', async () => {
            const where = await runFilter()

            const sql = where[Op.and].map((l) => l.val).join(' ')
            expect(sql).toContain("'PENDING'")
            expect(sql).toContain("'PROCESSING'")
            expect(sql).toContain("'APPROVED'")
        })

        it('correlates on the cardIssuance define() alias, not the table name', async () => {
            const where = await runFilter()

            const sql = where[Op.and].map((l) => l.val).join(' ')
            expect(sql).toContain('`cardIssuance`.`id`')
            expect(sql).not.toContain('`cardIssuances`.`id`')
        })

        it('is case-insensitive like every other status token', async () => {
            cardIssuance.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
            await findAndCountCardsWithHolder({
                corporateId: 42, status: 'FROZENNOTTERMINATED', limit: 10, offset: 0,
            })

            expect(whereOf().cardState).toBe('FROZEN')
            expect(Array.isArray(whereOf()[Op.and])).toBe(true)
        })
    })

    it('maps "pending" to the raw PENDING issuance status', async () => {
        cardIssuance.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await findAndCountCardsWithHolder({ corporateId: 42, status: 'pending', limit: 10, offset: 0 })
        expect(whereOf()).toEqual({ corporateId: 42, status: 'PENDING' })
    })

    it('maps "failed" to the raw FAILED issuance status', async () => {
        cardIssuance.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await findAndCountCardsWithHolder({ corporateId: 42, status: 'failed', limit: 10, offset: 0 })
        expect(whereOf()).toEqual({ corporateId: 42, status: 'FAILED' })
    })

    it('maps "active" to ISSUED + not-frozen, with no validity predicate', async () => {
        cardIssuance.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await findAndCountCardsWithHolder({ corporateId: 42, status: 'active', limit: 10, offset: 0 })
        const where = whereOf()
        expect(where).toEqual(expect.objectContaining({ corporateId: 42, status: 'ISSUED' }))
        expect(where.cardState).toEqual({ [Op.ne]: 'FROZEN' })
        expect(where[Op.and]).toBeUndefined()
    })

    it('no longer recognises "expired" as a filter, so it matches nothing by that name', async () => {
        cardIssuance.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await findAndCountCardsWithHolder({ corporateId: 42, status: 'expired', limit: 10, offset: 0 })
        expect(whereOf()).toEqual({ corporateId: 42, status: 'expired' })
    })

    it('falls back to a raw status match for an unrecognised status', async () => {
        cardIssuance.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await findAndCountCardsWithHolder({ corporateId: 42, status: 'ISSUED', limit: 10, offset: 0 })
        expect(whereOf()).toEqual({ corporateId: 42, status: 'ISSUED' })
    })

    it('maps a case-insensitive card type to the canonical value', async () => {
        cardIssuance.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await findAndCountCardsWithHolder({ corporateId: 42, type: 'virtual', limit: 10, offset: 0 })
        expect(whereOf()).toEqual({ corporateId: 42, cardType: 'Virtual', status: { [Op.ne]: 'REPLACED' } })
    })

    it('ignores an unrecognised card type', async () => {
        cardIssuance.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await findAndCountCardsWithHolder({ corporateId: 42, type: 'metal', limit: 10, offset: 0 })
        expect(whereOf()).toEqual({ corporateId: 42, status: { [Op.ne]: 'REPLACED' } })
    })

    it('filters by cardholder userId when numeric', async () => {
        cardIssuance.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await findAndCountCardsWithHolder({ corporateId: 42, cardholder: { userId: '99' }, limit: 10, offset: 0 })
        expect(whereOf()).toEqual({ corporateId: 42, userId: '99', status: { [Op.ne]: 'REPLACED' } })
    })

    it('maps a non-numeric cardholder filter to an impossible id (never leaks)', async () => {
        cardIssuance.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await findAndCountCardsWithHolder({ corporateId: 42, cardholder: { userId: 'abc' }, limit: 10, offset: 0 })
        expect(whereOf()).toEqual({ corporateId: 42, userId: '0', status: { [Op.ne]: 'REPLACED' } })
    })

    it('searches the escaped card number only when no cardholder ids matched (never Op.in: [])', async () => {
        cardIssuance.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await findAndCountCardsWithHolder({ corporateId: 42, searchText: 'a_b', searchMatchIds: [], limit: 10, offset: 0 })
        const options = cardIssuance.findAndCountAll.mock.calls[0][0]
        expect(options.where[Op.or]).toEqual([
            { maskedCardNumber: { [Op.like]: '%a\\_b%' } },
        ])
        expect(options.subQuery).toBeUndefined()
    })

    it('ORs the card-number LIKE with the pre-resolved cardholder ids from the shared directory', async () => {
        cardIssuance.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await findAndCountCardsWithHolder({ corporateId: 42, searchText: 'a_b', searchMatchIds: ['11', 12], limit: 10, offset: 0 })
        const options = cardIssuance.findAndCountAll.mock.calls[0][0]
        expect(options.where[Op.or]).toEqual([
            { maskedCardNumber: { [Op.like]: '%a\\_b%' } },
            { userId: { [Op.in]: ['11', '12'] } },
        ])
    })
})

describe('countPhysicalCardsUsed', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        cardIssuance.count.mockResolvedValue(3)
    })

    const whereOf = () => cardIssuance.count.mock.calls[0][0].where

    it('counts physical cards only — virtual cards are unlimited', async () => {
        await countPhysicalCardsUsed({ corporateId: 42 })

        expect(whereOf().cardType).toBe('Physical')
        expect(whereOf().corporateId).toBe(42)
    })

    /**
     * A FAILED order delivered nothing, and it is what keeps a paid card usable after the vendor refuses:
     * counting it would silently consume the credit the corporate paid for.
     */
    it('does not count FAILED orders', async () => {
        await countPhysicalCardsUsed({ corporateId: 42 })

        expect(whereOf().status[Op.in]).toEqual(['PENDING', 'ISSUED'])
        expect(whereOf().status[Op.in]).not.toContain('FAILED')
    })

    // Lifetime counting: a terminated card still occupies its slot, so no termination filter belongs here.
    it('applies no termination or frozen exclusions', async () => {
        await countPhysicalCardsUsed({ corporateId: 42 })

        const extra = whereOf()[Op.and]
        expect(extra).toHaveLength(1)
        expect(extra[0].val).toContain('createdAt')
    })

    it('exhausts the allowance rather than matching every row when the tenant is missing', async () => {
        const result = await countPhysicalCardsUsed({ corporateId: null })

        expect(result).toBe(Number.MAX_SAFE_INTEGER)
        expect(cardIssuance.count).not.toHaveBeenCalled()
    })

    it('counts inside the transaction it was handed', async () => {
        const transaction = { id: 'tx-1' }

        await countPhysicalCardsUsed({ corporateId: 42 }, transaction)

        expect(cardIssuance.count.mock.calls[0][0].transaction).toBe(transaction)
    })
})

describe('countPaidPhysicalCards', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        cardIssuance.count.mockResolvedValue(2)
    })

    /**
     * A FAILED paid card still counts here while dropping out of countPhysicalCardsUsed. That difference
     * IS the credit — the corporate paid, the issuer refused, so their next physical card is free.
     */
    it('counts a paid card in every status, including FAILED', async () => {
        await countPaidPhysicalCards({ corporateId: 42 })

        const { where } = cardIssuance.count.mock.calls[0][0]
        expect(where.purchasePaymentRefId).toEqual({ [Op.ne]: null })
        expect(where.status).toBeUndefined()
    })

    it('counts nothing for a corporate that has bought nothing', async () => {
        const result = await countPaidPhysicalCards({ corporateId: null })

        expect(result).toBe(0)
        expect(cardIssuance.count).not.toHaveBeenCalled()
    })

    it('counts inside the transaction it was handed', async () => {
        const transaction = { id: 'tx-1' }

        await countPaidPhysicalCards({ corporateId: 42 }, transaction)

        expect(cardIssuance.count.mock.calls[0][0].transaction).toBe(transaction)
    })
})
