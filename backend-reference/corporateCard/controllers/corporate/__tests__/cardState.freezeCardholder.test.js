const { freezeCardholderCards } = require('../cardState')
const { findCardsByScope, updateCardStateById } = require('../../../models/use-cases/cardIssuance')
const { hasBlockingTermination, resolveActiveByCards, resolveByCardholder } = require('../../../models/use-cases/cardRequest')
const { pinelabsRequest, isPinelabsSuccess, resolvePinelabsCredsForRequest } = require('../../../utils/pinelabsGateway')

jest.mock('../../../models/use-cases/cardIssuance', () => ({
    findByIdScoped: jest.fn(),
    findCardsByScope: jest.fn(),
    updateCardStateById: jest.fn(),
}))
jest.mock('../../../models/use-cases/cardRequest', () => ({
    hasBlockingTermination: jest.fn(),
    resolveActiveByCards: jest.fn(),
    resolveByCardholder: jest.fn(),
    MEMBERSHIP_HELD_STATUSES: ['PENDING', 'PROCESSING', 'APPROVED'],
}))
jest.mock('../../../utils/pinelabsGateway', () => ({
    pinelabsRequest: jest.fn(),
    isPinelabsSuccess: jest.fn(),
    resolvePinelabsCredsForRequest: jest.fn(),
}))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const adminReq = (overrides = {}) => ({
    user: { role: 'CORPORATE', corporateId: 42, id: 5 },
    params: { userId: '99' },
    body: {},
    ...overrides,
})

const card = (overrides = {}) => ({
    id: 1,
    userId: '99',
    status: 'ISSUED',
    cardState: 'ACTIVE',
    referenceNumber: 'REF-1',
    maskedCardNumber: '1234 56** **** 7890',
    ...overrides,
})

describe('freezeCardholderCards', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        updateCardStateById.mockResolvedValue()
        resolvePinelabsCredsForRequest.mockResolvedValue({ creds: { token: 't' } })
        pinelabsRequest.mockResolvedValue({ ok: true, data: { responseCode: 0 } })
        isPinelabsSuccess.mockReturnValue(true)
        hasBlockingTermination.mockResolvedValue(false)
        resolveByCardholder.mockResolvedValue(1)
    })

    describe('the membership request behind the removed member', () => {
        it('cancels it so the employee sees the request-access screen and can ask again', async () => {
            findCardsByScope.mockResolvedValue([card({ id: 1 })])

            await freezeCardholderCards(adminReq(), buildRes(), jest.fn())

            expect(resolveByCardholder).toHaveBeenCalledWith(expect.objectContaining({
                corporateId: 42,
                cardholder: { userId: '99' },
                requestType: 'MEMBERSHIP',
                statuses: ['PENDING', 'PROCESSING', 'APPROVED'],
                fields: expect.objectContaining({
                    status: 'CANCELLED',
                    decisionNote: 'Member removed from the corporate',
                }),
            }))
        })

        it('cancels it for a member who never held a card, the usual case', async () => {
            findCardsByScope.mockResolvedValue([])
            const res = buildRes()

            await freezeCardholderCards(adminReq(), res, jest.fn())

            expect(resolveByCardholder).toHaveBeenCalledWith(expect.objectContaining({
                cardholder: { userId: '99' },
                requestType: 'MEMBERSHIP',
            }))
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'No active cards to freeze.',
            }))
        })

        it('does not fail the removal when the request could not be cancelled', async () => {
            findCardsByScope.mockResolvedValue([card({ id: 1 })])
            resolveByCardholder.mockRejectedValue(new Error('db down'))
            const next = jest.fn()
            const res = buildRes()

            await freezeCardholderCards(adminReq(), res, next)

            expect(next).not.toHaveBeenCalled()
            expect(pinelabsRequest).toHaveBeenCalledTimes(1)
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: '1 card frozen.' }))
        })

        it('leaves an already-decided request alone, cancelling only a held one', async () => {
            findCardsByScope.mockResolvedValue([card({ id: 1 })])

            await freezeCardholderCards(adminReq(), buildRes(), jest.fn())

            const { statuses } = resolveByCardholder.mock.calls[0][0]
            expect(statuses).not.toContain('REJECTED')
            expect(statuses).not.toContain('CANCELLED')
        })
    })

    it('400s on an invalid member id, without touching the vendor', async () => {
        const next = jest.fn()
        await freezeCardholderCards(adminReq({ params: { userId: 'abc' } }), buildRes(), next)
        expect(findCardsByScope).not.toHaveBeenCalled()
        expect(resolvePinelabsCredsForRequest).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('is a no-op (no vendor call) when the member has no active, unfrozen cards', async () => {
        findCardsByScope.mockResolvedValue([
            card({ id: 1, cardState: 'FROZEN' }),
            card({ id: 2, status: 'PENDING' }),
        ])
        const res = buildRes()

        await freezeCardholderCards(adminReq(), res, jest.fn())

        expect(resolvePinelabsCredsForRequest).not.toHaveBeenCalled()
        expect(pinelabsRequest).not.toHaveBeenCalled()
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'No active cards to freeze.',
            data: { summary: { requested: 0, succeeded: 0, failed: 0 }, results: [] },
        }))
    })

    it('freezes every eligible card (skips already-frozen / non-issued) via the vendor', async () => {
        findCardsByScope.mockResolvedValue([
            card({ id: 1 }),
            card({ id: 2 }),
            card({ id: 3, cardState: 'FROZEN' }),
            card({ id: 4, status: 'PENDING' }),
        ])
        const res = buildRes()

        await freezeCardholderCards(adminReq(), res, jest.fn())

        expect(findCardsByScope).toHaveBeenCalledWith({ corporateId: 42, userId: '99' })
        expect(pinelabsRequest).toHaveBeenCalledTimes(2)
        expect(updateCardStateById).toHaveBeenCalledTimes(2)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: '2 cards frozen.',
            data: expect.objectContaining({ summary: { requested: 2, succeeded: 2, failed: 0 } }),
        }))
    })

    it('rejects open unfreeze requests across ALL the member cards, including already-frozen ones', async () => {
        findCardsByScope.mockResolvedValue([card({ id: 1 }), card({ id: 2, cardState: 'FROZEN' })])

        await freezeCardholderCards(adminReq(), buildRes(), jest.fn())

        expect(resolveActiveByCards).toHaveBeenCalledWith(expect.objectContaining({
            corporateId: 42,
            cardIssuanceIds: [1, 2],
            requestType: 'UNFREEZE',
            fields: expect.objectContaining({
                status: 'REJECTED',
                decisionNote: 'Member removed from the corporate',
            }),
        }))
    })

    it('still rejects open requests when every card is already frozen', async () => {
        findCardsByScope.mockResolvedValue([card({ id: 1, cardState: 'FROZEN' })])
        const res = buildRes()

        await freezeCardholderCards(adminReq(), res, jest.fn())

        expect(pinelabsRequest).not.toHaveBeenCalled()
        expect(resolveActiveByCards).toHaveBeenCalledWith(expect.objectContaining({
            cardIssuanceIds: [1],
            requestType: 'UNFREEZE',
        }))
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'No active cards to freeze.' }))
    })

    it('stamps the SYSTEM actor, not ADMIN, so the member can never self-unfreeze', async () => {
        findCardsByScope.mockResolvedValue([card({ id: 1 })])

        await freezeCardholderCards(adminReq(), buildRes(), jest.fn())

        expect(updateCardStateById).toHaveBeenCalledWith(1, expect.objectContaining({ frozenByRole: 'SYSTEM' }))
    })

    it('reports a partial failure when one card fails at the vendor (still freezes the rest)', async () => {
        findCardsByScope.mockResolvedValue([card({ id: 1 }), card({ id: 2 })])
        isPinelabsSuccess.mockReturnValueOnce(true).mockReturnValueOnce(false)
        const res = buildRes()

        await freezeCardholderCards(adminReq(), res, jest.fn())

        expect(pinelabsRequest).toHaveBeenCalledTimes(2)
        expect(updateCardStateById).toHaveBeenCalledTimes(1)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ summary: { requested: 2, succeeded: 1, failed: 1 } }),
        }))
    })
})
