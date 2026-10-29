const { Op } = require('sequelize')
const cardRequest = require('../../entities/cardRequest')
const {
    createRequest,
    findActiveByTarget,
    findActiveTerminateCardIds,
    findByIdScoped,
    findByIdUnscoped,
    findAndCountForQueue,
    findByRequester,
    countPending,
    decideFromPendingCAS,
    updateById,
    hasBlockingTermination,
    findTerminationStatusByCardIds,
    findOpenRequestStatusByCardIds,
    resolveActiveByCards,
    resolveByCardholder,
    MEMBERSHIP_HELD_STATUSES,
    finalizeFromProcessingCAS,
} = require('../cardRequest')

jest.mock('../../entities/cardRequest', () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
}))
jest.mock('../../entities/cardIssuance', () => ({}))

describe('createRequest', () => {
    beforeEach(() => jest.clearAllMocks())

    it('creates the request inside the supplied transaction', async () => {
        const created = { id: 1 }
        cardRequest.create.mockResolvedValue(created)
        const txn = {}
        const fields = { requestType: 'CARD_ISSUANCE', corporateId: 42, userId: 900 }

        const result = await createRequest(fields, txn)

        expect(cardRequest.create).toHaveBeenCalledWith(fields, { transaction: txn })
        expect(result).toBe(created)
    })

    // `userId` is nullable and every caller defaults it to null, so a headless row was storable: it names no
    // member in the queue, cannot be approved, and generates a NULL activeDedupeKey — which a UNIQUE index
    // does not constrain, so the duplicate-request guard silently stops applying to it too.
    it('refuses a request that identifies neither a card nor a cardholder', async () => {
        await expect(createRequest({ requestType: 'CARD_ISSUANCE', corporateId: 42 })).rejects.toThrow()

        expect(cardRequest.create).not.toHaveBeenCalled()
    })

    it('refuses a request with no corporate', async () => {
        await expect(createRequest({ requestType: 'CARD_ISSUANCE', userId: 900 })).rejects.toThrow()

        expect(cardRequest.create).not.toHaveBeenCalled()
    })

    // A card identifies the target on its own, which is what lets a legacy card whose holder was never
    // backfilled still be frozen or terminated.
    it('allows a card-targeted request with no cardholder', async () => {
        cardRequest.create.mockResolvedValue({ id: 2 })

        await createRequest({ requestType: 'TERMINATE', corporateId: 42, cardIssuanceId: 7 })

        expect(cardRequest.create).toHaveBeenCalled()
    })
})

describe('findActiveByTarget', () => {
    beforeEach(() => jest.clearAllMocks())

    it('matches an active request on a specific card when cardIssuanceId is given', async () => {
        cardRequest.findOne.mockResolvedValue({ id: 1 })

        await findActiveByTarget({ requestType: 'LIMIT_INCREASE', cardIssuanceId: 7 })

        expect(cardRequest.findOne).toHaveBeenCalledWith({
            where: { requestType: 'LIMIT_INCREASE', status: { [Op.in]: ['PENDING', 'PROCESSING'] }, cardIssuanceId: 7 },
        })
    })

    it('matches only card-less rows (cardIssuanceId NULL) for a cardholder-scoped issuance', async () => {
        cardRequest.findOne.mockResolvedValue(null)

        await findActiveByTarget({ requestType: 'CARD_ISSUANCE', cardholder: { userId: 99 } })

        expect(cardRequest.findOne).toHaveBeenCalledWith({
            where: { requestType: 'CARD_ISSUANCE', status: { [Op.in]: ['PENDING', 'PROCESSING'] }, userId: 99, cardIssuanceId: null },
        })
    })

    // `|| {}` turned "no identity" into "no filter", so the duplicate check asked whether ANY member anywhere
    // held a pending card-less request — and the 409 it produced blamed this caller for someone else's.
    it('refuses rather than dropping the cardholder predicate when there is no identity', async () => {
        await expect(findActiveByTarget({ requestType: 'CARD_ISSUANCE', cardholder: { userId: null } })).rejects.toThrow()
        await expect(findActiveByTarget({ requestType: 'CARD_ISSUANCE' })).rejects.toThrow()

        expect(cardRequest.findOne).not.toHaveBeenCalled()
    })
})

describe('findActiveTerminateCardIds', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns an empty array without querying when the id list is empty/absent', async () => {
        expect(await findActiveTerminateCardIds({ cardIssuanceIds: [] })).toEqual([])
        expect(await findActiveTerminateCardIds({})).toEqual([])
        expect(cardRequest.findAll).not.toHaveBeenCalled()
    })

    it('queries for ACTIVE (PENDING/PROCESSING) TERMINATE requests scoped to the given card ids', async () => {
        cardRequest.findAll.mockResolvedValue([{ cardIssuanceId: 5 }, { cardIssuanceId: 9 }])

        const result = await findActiveTerminateCardIds({ cardIssuanceIds: [5, 7, 9] })

        expect(cardRequest.findAll).toHaveBeenCalledWith({
            where: {
                requestType: 'TERMINATE',
                status: { [Op.in]: ['PENDING', 'PROCESSING'] },
                cardIssuanceId: { [Op.in]: [5, 7, 9] },
            },
            attributes: ['cardIssuanceId'],
        })
        expect(result).toEqual([5, 9])
    })
})

describe('findByIdScoped', () => {
    beforeEach(() => jest.clearAllMocks())

    it('scopes to the corporate and joins the card (own table only — no cardholder join)', async () => {
        cardRequest.findOne.mockResolvedValue({ id: 1 })

        await findByIdScoped(1, 42)

        const options = cardRequest.findOne.mock.calls[0][0]
        expect(options.where).toEqual({ id: 1, corporateId: 42 })
        expect(options.include).toEqual([
            expect.objectContaining({ as: 'card', attributes: ['id', 'maskedCardNumber', 'status', 'cardLimit'], required: false }),
        ])
    })
})

describe('findAndCountForQueue', () => {
    beforeEach(() => jest.clearAllMocks())

    it('scopes to the corporate with no optional filters', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountForQueue({ corporateId: 42, limit: 10, offset: 0 })

        const options = cardRequest.findAndCountAll.mock.calls[0][0]
        expect(options.where).toEqual({ corporateId: 42, requestType: { [Op.notIn]: ['MEMBERSHIP'] } })
        expect(options).toEqual(expect.objectContaining({ order: [['id', 'DESC']], limit: 10, offset: 0 }))
        expect(options.subQuery).toBeUndefined()
    })

    it('omits corporateId from the where clause when not given (cross-corporate system-user queue)', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountForQueue({ requestType: 'TERMINATE', status: 'PENDING', limit: 10, offset: 0 })

        const { where } = cardRequest.findAndCountAll.mock.calls[0][0]
        expect(where).toEqual({ requestType: 'TERMINATE', status: 'PENDING' })
        expect(where).not.toHaveProperty('corporateId')
    })

    it('applies requestType / status / userId and a canonical cardType', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountForQueue({ corporateId: 42, requestType: 'CARD_ISSUANCE', status: 'PENDING', cardType: 'virtual', cardholder: { userId: 99 }, limit: 10, offset: 0 })

        expect(cardRequest.findAndCountAll.mock.calls[0][0].where).toEqual({
            corporateId: 42, requestType: 'CARD_ISSUANCE', status: 'PENDING', cardType: 'Virtual', userId: 99,
        })
    })

    it('keeps membership requests out of the card approvals queue', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountForQueue({ corporateId: 42, limit: 10, offset: 0 })

        expect(cardRequest.findAndCountAll.mock.calls[0][0].where.requestType)
            .toEqual({ [Op.notIn]: ['MEMBERSHIP'] })
    })

    it('returns membership requests only when asked for by name', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountForQueue({ corporateId: 42, requestType: 'MEMBERSHIP', limit: 10, offset: 0 })

        expect(cardRequest.findAndCountAll.mock.calls[0][0].where.requestType).toBe('MEMBERSHIP')
    })

    it('ignores an unrecognised cardType rather than leaking', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountForQueue({ corporateId: 42, cardType: 'metal', limit: 10, offset: 0 })

        expect(cardRequest.findAndCountAll.mock.calls[0][0].where).toEqual({ corporateId: 42, requestType: { [Op.notIn]: ['MEMBERSHIP'] } })
    })

    // The client has always sent cardIssuanceId; nothing read it, so the card filter narrowed nothing.
    it('narrows to a single card when cardIssuanceId is given', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountForQueue({ corporateId: 42, cardIssuanceId: '77', limit: 10, offset: 0 })

        expect(cardRequest.findAndCountAll.mock.calls[0][0].where).toEqual({ corporateId: 42, cardIssuanceId: '77', requestType: { [Op.notIn]: ['MEMBERSHIP'] } })
    })

    it('leaves the card filter out when no cardIssuanceId is given', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountForQueue({ corporateId: 42, limit: 10, offset: 0 })

        expect(cardRequest.findAndCountAll.mock.calls[0][0].where).not.toHaveProperty('cardIssuanceId')
    })

    it('searches local columns (reason/cardType) and widens by cardholder ids when a name/email matched', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountForQueue({ corporateId: 42, searchText: 'alice', searchMatchIds: ['11', '12'], limit: 10, offset: 0 })

        const options = cardRequest.findAndCountAll.mock.calls[0][0]
        expect(options.where[Op.or]).toEqual([
            { reason: { [Op.like]: '%alice%' } },
            { cardType: { [Op.like]: '%alice%' } },
            { userId: { [Op.in]: ['11', '12'] } },
        ])
        expect(options.subQuery).toBeUndefined()
    })

    it('matches the VISIBLE status label (pending → PENDING+PROCESSING, rejected → REJECTED+CANCELLED)', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountForQueue({ corporateId: 42, searchText: 'rejected', searchMatchIds: [], limit: 10, offset: 0 })
        expect(cardRequest.findAndCountAll.mock.calls[0][0].where[Op.or]).toEqual([
            { reason: { [Op.like]: '%rejected%' } },
            { cardType: { [Op.like]: '%rejected%' } },
            { status: { [Op.in]: ['REJECTED', 'CANCELLED'] } },
        ])

        jest.clearAllMocks()
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await findAndCountForQueue({ corporateId: 42, searchText: 'pending', limit: 10, offset: 0 })
        expect(cardRequest.findAndCountAll.mock.calls[0][0].where[Op.or]).toContainEqual({
            status: { [Op.in]: ['PENDING', 'PROCESSING'] },
        })

        jest.clearAllMocks()
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await findAndCountForQueue({ corporateId: 42, searchText: 'rej', limit: 10, offset: 0 })
        expect(cardRequest.findAndCountAll.mock.calls[0][0].where[Op.or]).toContainEqual({
            status: { [Op.in]: ['REJECTED', 'CANCELLED'] },
        })
    })

    it('does not treat a short/substring term as a status match (search must narrow, never broaden)', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountForQueue({ corporateId: 42, searchText: 'ed', limit: 10, offset: 0 })
        const or = cardRequest.findAndCountAll.mock.calls[0][0].where[Op.or]
        expect(or).toEqual([{ reason: { [Op.like]: '%ed%' } }, { cardType: { [Op.like]: '%ed%' } }])
        expect(or.some((c) => 'status' in c)).toBe(false)
    })

    it('omits the cardType search term when cardType is already pinned to one value', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountForQueue({ corporateId: 42, cardType: 'virtual', searchText: 'vi', limit: 10, offset: 0 })
        const { where } = cardRequest.findAndCountAll.mock.calls[0][0]
        expect(where.cardType).toBe('Virtual')
        expect(where[Op.or]).toEqual([{ reason: { [Op.like]: '%vi%' } }])
        expect(where[Op.or].some((c) => 'cardType' in c)).toBe(false)
    })

    it('escapes LIKE wildcards in the search term', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountForQueue({ corporateId: 42, searchText: '50%_off', limit: 10, offset: 0 })
        expect(cardRequest.findAndCountAll.mock.calls[0][0].where[Op.or]).toContainEqual({
            reason: { [Op.like]: '%50\\%\\_off%' },
        })
    })

    it('applies the optional created-date window (mirrors the transactions list)', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountForQueue({ corporateId: 42, dateFrom: '2026-07-01', dateTo: '2026-07-14', limit: 10, offset: 0 })

        const { where } = cardRequest.findAndCountAll.mock.calls[0][0]
        expect(where.createdAt[Op.gte]).toEqual(new Date('2026-07-01'))
        expect(where.createdAt[Op.lt]).toEqual(new Date('2026-07-15'))
        expect(where.createdAt[Op.lte]).toBeUndefined()
    })

    it('scopes search to a pinned cardholder (AND) without widening by name/email ids', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountForQueue({ corporateId: 42, cardholder: { userId: '11' }, searchText: 'gift', searchMatchIds: ['11', '12'], limit: 10, offset: 0 })
        const { where } = cardRequest.findAndCountAll.mock.calls[0][0]
        expect(where.userId).toBe('11')
        expect(where[Op.or]).toEqual([
            { reason: { [Op.like]: '%gift%' } },
            { cardType: { [Op.like]: '%gift%' } },
        ])
    })
})

describe('findByRequester', () => {
    beforeEach(() => jest.clearAllMocks())

    it('lists the cardholder\'s own requests, card joined, newest first', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findByRequester({ cardholder: { userId: 99 }, limit: 10, offset: 0 })

        const options = cardRequest.findAndCountAll.mock.calls[0][0]
        expect(options.where).toEqual({ userId: 99 })
        expect(options.include).toEqual(expect.arrayContaining([
            expect.objectContaining({ as: 'card', attributes: ['id', 'maskedCardNumber', 'status'], required: false }),
        ]))
        expect(options).toEqual(expect.objectContaining({ order: [['id', 'DESC']], limit: 10, offset: 0 }))
    })

    it('filters by requestType and canonical cardType when provided', async () => {
        cardRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

        await findByRequester({ cardholder: { userId: 99 }, requestType: 'LIMIT_INCREASE', cardType: 'PHYSICAL', limit: 10, offset: 0 })

        expect(cardRequest.findAndCountAll.mock.calls[0][0].where).toEqual({
            userId: 99, requestType: 'LIMIT_INCREASE', cardType: 'Physical',
        })
    })
})

describe('countPending', () => {
    beforeEach(() => jest.clearAllMocks())

    it('counts corporate-wide PENDING requests when no cardholder is given', async () => {
        cardRequest.count.mockResolvedValue(4)

        const result = await countPending({ corporateId: 42 })

        expect(cardRequest.count).toHaveBeenCalledWith({
            where: {
                corporateId: 42,
                status: 'PENDING',
                requestType: { [Op.in]: ['CARD_ISSUANCE', 'LIMIT_INCREASE', 'UNFREEZE'] },
            },
        })
        expect(result).toBe(4)
    })

    it('narrows to a single cardholder\'s PENDING requests when userId is given', async () => {
        cardRequest.count.mockResolvedValue(1)

        await countPending({ corporateId: 42, cardholder: { userId: 99 } })

        expect(cardRequest.count).toHaveBeenCalledWith({
            where: {
                corporateId: 42,
                status: 'PENDING',
                requestType: { [Op.in]: ['CARD_ISSUANCE', 'LIMIT_INCREASE', 'UNFREEZE'] },
                userId: 99,
            },
        })
    })

    it('excludes corporate-initiated TERMINATE requests from the pending-approvals count', async () => {
        cardRequest.count.mockResolvedValue(0)

        await countPending({ corporateId: 42 })

        const { requestType } = cardRequest.count.mock.calls[0][0].where
        expect(requestType[Op.in]).toEqual(['CARD_ISSUANCE', 'LIMIT_INCREASE', 'UNFREEZE'])
        expect(requestType[Op.in]).not.toContain('TERMINATE')
    })
})

describe('decideFromPendingCAS', () => {
    beforeEach(() => jest.clearAllMocks())

    it('compare-and-swaps only from PENDING and returns the affected count', async () => {
        cardRequest.update.mockResolvedValue([1])
        const txn = {}

        const result = await decideFromPendingCAS(7, { status: 'APPROVED' }, txn)

        expect(cardRequest.update).toHaveBeenCalledWith(
            { status: 'APPROVED' },
            { where: { id: 7, status: 'PENDING' }, transaction: txn }
        )
        expect(result).toBe(1)
    })

    it('returns 0 when another decision already won the race', async () => {
        cardRequest.update.mockResolvedValue([0])

        const result = await decideFromPendingCAS(7, { status: 'REJECTED' }, {})

        expect(result).toBe(0)
    })
})

describe('updateById', () => {
    beforeEach(() => jest.clearAllMocks())

    it('updates unconditionally (within the txn) then returns the reloaded row', async () => {
        cardRequest.update.mockResolvedValue([1])
        const reloaded = { id: 7, status: 'APPROVED' }
        cardRequest.findOne.mockResolvedValue(reloaded)
        const txn = {}

        const result = await updateById(7, { status: 'APPROVED' }, txn)

        expect(cardRequest.update).toHaveBeenCalledWith({ status: 'APPROVED' }, { where: { id: 7 }, transaction: txn })
        expect(cardRequest.findOne).toHaveBeenCalledWith({ where: { id: 7 } })
        expect(result).toBe(reloaded)
    })
})

describe('findByIdUnscoped', () => {
    beforeEach(() => jest.clearAllMocks())

    it('looks up by id alone (no corporateId), with the card joined', async () => {
        cardRequest.findOne.mockResolvedValue({ id: 7 })

        await findByIdUnscoped(7)

        const options = cardRequest.findOne.mock.calls[0][0]
        expect(options.where).toEqual({ id: 7 })
        expect(options.include).toEqual([
            expect.objectContaining({ as: 'card', attributes: ['id', 'maskedCardNumber', 'status', 'cardState'], required: false }),
        ])
    })
})

describe('hasBlockingTermination', () => {
    beforeEach(() => jest.clearAllMocks())

    it('is true when a TERMINATE request exists in PENDING/PROCESSING/APPROVED', async () => {
        cardRequest.findOne.mockResolvedValue({ id: 1 })

        const result = await hasBlockingTermination(55)

        expect(cardRequest.findOne).toHaveBeenCalledWith({
            where: { cardIssuanceId: 55, requestType: 'TERMINATE', status: { [Op.in]: ['PENDING', 'PROCESSING', 'APPROVED'] } },
        })
        expect(result).toBe(true)
    })

    it('is false when no such request exists', async () => {
        cardRequest.findOne.mockResolvedValue(null)

        expect(await hasBlockingTermination(55)).toBe(false)
    })
})

describe('findTerminationStatusByCardIds', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns an empty map for an empty/invalid id list without querying', async () => {
        expect(await findTerminationStatusByCardIds([])).toEqual(new Map())
        expect(await findTerminationStatusByCardIds(null)).toEqual(new Map())
        expect(cardRequest.findAll).not.toHaveBeenCalled()
    })

    it('maps PENDING/PROCESSING to REQUESTED and APPROVED to COMPLETED', async () => {
        cardRequest.findAll.mockResolvedValue([
            { cardIssuanceId: '1', status: 'PENDING' },
            { cardIssuanceId: '2', status: 'PROCESSING' },
            { cardIssuanceId: '3', status: 'APPROVED' },
        ])

        const map = await findTerminationStatusByCardIds(['1', '2', '3'])

        expect(cardRequest.findAll).toHaveBeenCalledWith({
            where: { cardIssuanceId: { [Op.in]: ['1', '2', '3'] }, requestType: 'TERMINATE', status: { [Op.in]: ['PENDING', 'PROCESSING', 'APPROVED'] } },
        })
        expect(map.get('1')).toBe('REQUESTED')
        expect(map.get('2')).toBe('REQUESTED')
        expect(map.get('3')).toBe('COMPLETED')
    })
})

describe('findOpenRequestStatusByCardIds', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns an empty map for an empty/invalid id list without querying', async () => {
        expect(await findOpenRequestStatusByCardIds({ cardIssuanceIds: [], requestType: 'UNFREEZE' })).toEqual(new Map())
        expect(await findOpenRequestStatusByCardIds({ cardIssuanceIds: null, requestType: 'UNFREEZE' })).toEqual(new Map())
        expect(cardRequest.findAll).not.toHaveBeenCalled()
    })

    it('maps card id to the raw open status, over PENDING and PROCESSING only', async () => {
        cardRequest.findAll.mockResolvedValue([
            { cardIssuanceId: '1', status: 'PENDING' },
            { cardIssuanceId: '2', status: 'PROCESSING' },
        ])

        const map = await findOpenRequestStatusByCardIds({ cardIssuanceIds: ['1', '2'], requestType: 'UNFREEZE' })

        expect(cardRequest.findAll).toHaveBeenCalledWith({
            where: {
                cardIssuanceId: { [Op.in]: ['1', '2'] },
                requestType: 'UNFREEZE',
                status: { [Op.in]: ['PENDING', 'PROCESSING'] },
            },
        })
        expect(map.get('1')).toBe('PENDING')
        expect(map.get('2')).toBe('PROCESSING')
    })
})

describe('resolveActiveByCards', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns 0 without querying when corporateId or the id list is missing', async () => {
        expect(await resolveActiveByCards({ cardIssuanceIds: ['1'], requestType: 'UNFREEZE', fields: {} })).toBe(0)
        expect(await resolveActiveByCards({ corporateId: 42, cardIssuanceIds: [], requestType: 'UNFREEZE', fields: {} })).toBe(0)
        expect(cardRequest.update).not.toHaveBeenCalled()
    })

    it('scopes the update to the corporate, the cards, the type and the active statuses', async () => {
        cardRequest.update.mockResolvedValue([2])

        const count = await resolveActiveByCards({
            corporateId: 42,
            cardIssuanceIds: [1, 2],
            requestType: 'UNFREEZE',
            fields: { status: 'APPROVED' },
        })

        expect(count).toBe(2)
        expect(cardRequest.update).toHaveBeenCalledWith(
            { status: 'APPROVED' },
            {
                where: {
                    corporateId: 42,
                    cardIssuanceId: { [Op.in]: ['1', '2'] },
                    requestType: 'UNFREEZE',
                    status: { [Op.in]: ['PENDING', 'PROCESSING'] },
                },
                transaction: undefined,
            }
        )
    })

    it('honours a narrowed status list (termination leaves a claimed row alone)', async () => {
        cardRequest.update.mockResolvedValue([1])

        await resolveActiveByCards({
            corporateId: 42,
            cardIssuanceIds: [1],
            requestType: 'UNFREEZE',
            fields: { status: 'REJECTED' },
            statuses: ['PENDING'],
        })

        expect(cardRequest.update.mock.calls[0][1].where.status).toEqual({ [Op.in]: ['PENDING'] })
    })
})

describe('resolveByCardholder', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns 0 without querying when the corporate or the cardholder is missing, never widening to no filter', async () => {
        expect(await resolveByCardholder({ cardholder: { userId: '99' }, requestType: 'MEMBERSHIP', fields: {} })).toBe(0)
        expect(await resolveByCardholder({ corporateId: 42, requestType: 'MEMBERSHIP', fields: {} })).toBe(0)
        expect(await resolveByCardholder({ corporateId: 42, cardholder: {}, requestType: 'MEMBERSHIP', fields: {} })).toBe(0)
        expect(cardRequest.update).not.toHaveBeenCalled()
    })

    it('scopes the update to the corporate, the cardholder, the type and the given statuses', async () => {
        cardRequest.update.mockResolvedValue([1])

        const count = await resolveByCardholder({
            corporateId: 42,
            cardholder: { userId: '99' },
            requestType: 'MEMBERSHIP',
            statuses: MEMBERSHIP_HELD_STATUSES,
            fields: { status: 'CANCELLED' },
        })

        expect(count).toBe(1)
        expect(cardRequest.update).toHaveBeenCalledWith(
            { status: 'CANCELLED' },
            {
                where: {
                    userId: '99',
                    corporateId: 42,
                    requestType: 'MEMBERSHIP',
                    status: { [Op.in]: ['PENDING', 'PROCESSING', 'APPROVED'] },
                },
                transaction: undefined,
            }
        )
    })

    it('covers the approved row, which is the one a removal has to clear', () => {
        expect(MEMBERSHIP_HELD_STATUSES).toContain('APPROVED')
    })
})

describe('finalizeFromProcessingCAS', () => {
    beforeEach(() => jest.clearAllMocks())

    it('updates only while the row is still PROCESSING and returns the affected count', async () => {
        cardRequest.update.mockResolvedValue([1])

        const count = await finalizeFromProcessingCAS(11, { status: 'APPROVED' })

        expect(count).toBe(1)
        expect(cardRequest.update).toHaveBeenCalledWith(
            { status: 'APPROVED' },
            { where: { id: 11, status: 'PROCESSING' }, transaction: undefined }
        )
    })

    it('returns 0 when another actor already moved the row', async () => {
        cardRequest.update.mockResolvedValue([0])
        expect(await finalizeFromProcessingCAS(11, { status: 'APPROVED' })).toBe(0)
    })
})
