const { freezeCard, unfreezeCard } = require('../cardState')
const { findByIdScoped, updateCardStateById } = require('../../../models/use-cases/cardIssuance')
const { hasBlockingTermination, resolveActiveByCards } = require('../../../models/use-cases/cardRequest')
const { pinelabsRequest, isPinelabsSuccess, resolvePinelabsCredsForRequest } = require('../../../utils/pinelabsGateway')

jest.mock('../../../models/use-cases/cardIssuance', () => ({
    findByIdScoped: jest.fn(),
    findCardsByScope: jest.fn(),
    updateCardStateById: jest.fn(),
}))
jest.mock('../../../models/use-cases/cardRequest', () => ({
    hasBlockingTermination: jest.fn(),
    resolveActiveByCards: jest.fn(),
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

const adminReq = (body = {}) => ({
    user: { role: 'CORPORATE', corporateId: 42, id: 5 },
    params: { cardIssuanceId: '1' },
    body,
})

const cardholderReq = (body = {}) => ({
    user: { role: 'USER', corporateId: 42, employeeProfileId: '99', id: 7, serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] },
    params: { cardIssuanceId: '1' },
    body,
})

const card = (overrides = {}) => ({
    id: 1,
    userId: '99',
    status: 'ISSUED',
    cardState: 'FROZEN',
    referenceNumber: 'REF-1',
    maskedCardNumber: '1234 56** **** 7890',
    ...overrides,
})

describe('admin freeze lock', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        updateCardStateById.mockResolvedValue()
        resolveActiveByCards.mockResolvedValue(0)
        resolvePinelabsCredsForRequest.mockResolvedValue({ creds: { token: 't' } })
        pinelabsRequest.mockResolvedValue({ ok: true, data: { responseCode: 0 } })
        isPinelabsSuccess.mockReturnValue(true)
        hasBlockingTermination.mockResolvedValue(false)
    })

    describe('cardholder unfreeze is refused for a freeze they did not place', () => {
        it.each([
            ['ADMIN', 'ADMIN'],
            ['SYSTEM', 'SYSTEM'],
            ['NULL (fails closed)', null],
            ['an unrecognised value (fails closed)', 'ROBOT'],
        ])('403s when frozenByRole is %s', async (_label, frozenByRole) => {
            findByIdScoped.mockResolvedValue(card({ frozenByRole }))
            const next = jest.fn()

            await unfreezeCard(cardholderReq(), buildRes(), next)

            expect(pinelabsRequest).not.toHaveBeenCalled()
            expect(updateCardStateById).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                status_code: 403,
                message: expect.stringContaining("needs your admin's approval"),
            }))
        })
    })

    it('refuses a cardholder lifting even their OWN freeze, and never reaches the vendor', async () => {
        findByIdScoped.mockResolvedValue(card({ frozenByRole: 'CARDHOLDER' }))
        const next = jest.fn()

        await unfreezeCard(cardholderReq(), buildRes(), next)

        expect(pinelabsRequest).not.toHaveBeenCalled()
        expect(updateCardStateById).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            status_code: 403,
            message: expect.stringContaining("needs your admin's approval"),
        }))
    })

    it('lets an admin lift an admin freeze, with the reactivation reason on the admin endpoint', async () => {
        findByIdScoped.mockResolvedValue(card({ frozenByRole: 'ADMIN' }))
        const next = jest.fn()

        await unfreezeCard(adminReq(), buildRes(), next)

        expect(next).not.toHaveBeenCalled()
        expect(pinelabsRequest.mock.calls[0][0].body).toEqual(expect.objectContaining({ cardState: 1, reason: 4 }))
    })

    it('409s a cardholder re-freezing an already-frozen card (the downgrade bypass)', async () => {
        findByIdScoped.mockResolvedValue(card({ frozenByRole: 'ADMIN' }))
        const next = jest.fn()

        await freezeCard(cardholderReq({ reason: 1 }), buildRes(), next)

        expect(pinelabsRequest).not.toHaveBeenCalled()
        expect(updateCardStateById).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            status_code: 409,
            message: 'This card is already frozen.',
        }))
    })

    it('409s a cardholder unfreezing a card that is already active', async () => {
        findByIdScoped.mockResolvedValue(card({ cardState: 'ACTIVE', frozenByRole: null }))
        const next = jest.fn()

        await unfreezeCard(cardholderReq(), buildRes(), next)

        expect(pinelabsRequest).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            status_code: 409,
            message: 'This card is not frozen.',
        }))
    })

    it('stamps CARDHOLDER on a cardholder self-freeze and ADMIN on an admin freeze', async () => {
        findByIdScoped.mockResolvedValue(card({ cardState: 'ACTIVE', frozenByRole: null }))

        await freezeCard(cardholderReq({ reason: 1 }), buildRes(), jest.fn())
        expect(updateCardStateById).toHaveBeenCalledWith(1, expect.objectContaining({ frozenByRole: 'CARDHOLDER' }))

        jest.clearAllMocks()
        updateCardStateById.mockResolvedValue()
        resolvePinelabsCredsForRequest.mockResolvedValue({ creds: { token: 't' } })
        pinelabsRequest.mockResolvedValue({ ok: true, data: { responseCode: 0 } })
        isPinelabsSuccess.mockReturnValue(true)
        hasBlockingTermination.mockResolvedValue(false)
        findByIdScoped.mockResolvedValue(card({ cardState: 'ACTIVE', frozenByRole: null }))

        await freezeCard(adminReq({ reason: 2 }), buildRes(), jest.fn())
        expect(updateCardStateById).toHaveBeenCalledWith(1, expect.objectContaining({ frozenByRole: 'ADMIN' }))
    })

    it('re-classifies a cardholder freeze to an admin lock without calling the vendor', async () => {
        findByIdScoped.mockResolvedValue(card({ frozenByRole: 'CARDHOLDER' }))
        const next = jest.fn()

        await freezeCard(adminReq({ reason: 2 }), buildRes(), next)

        expect(next).not.toHaveBeenCalled()
        expect(pinelabsRequest).not.toHaveBeenCalled()
        expect(updateCardStateById).toHaveBeenCalledWith(1, expect.objectContaining({
            cardState: 'FROZEN',
            freezeReason: 2,
            frozenByRole: 'ADMIN',
        }))
    })

    it('keeps the termination lock outermost — ahead of the new 403', async () => {
        findByIdScoped.mockResolvedValue(card({ frozenByRole: 'ADMIN' }))
        hasBlockingTermination.mockResolvedValue(true)
        const next = jest.fn()

        await unfreezeCard(cardholderReq(), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            status_code: 409,
            message: expect.stringContaining('termination request'),
        }))
    })

    it('keeps the card FROZEN when a termination commits mid-unfreeze', async () => {
        findByIdScoped.mockResolvedValue(card({ frozenByRole: 'ADMIN' }))
        hasBlockingTermination.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
        const next = jest.fn()

        await unfreezeCard(adminReq(), buildRes(), next)

        expect(pinelabsRequest).toHaveBeenCalled()
        expect(updateCardStateById).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            status_code: 409,
            message: expect.stringContaining('termination request'),
        }))
    })

    it('closes any open unfreeze request after a direct admin unfreeze', async () => {
        findByIdScoped.mockResolvedValue(card({ frozenByRole: 'ADMIN' }))

        await unfreezeCard(adminReq(), buildRes(), jest.fn())

        expect(resolveActiveByCards).toHaveBeenCalledWith(expect.objectContaining({
            corporateId: 42,
            cardIssuanceIds: [1],
            requestType: 'UNFREEZE',
            fields: expect.objectContaining({ status: 'APPROVED' }),
        }))
    })

    it('does not close requests on a cardholder self-unfreeze', async () => {
        findByIdScoped.mockResolvedValue(card({ frozenByRole: 'CARDHOLDER' }))

        await unfreezeCard(cardholderReq(), buildRes(), jest.fn())

        expect(resolveActiveByCards).not.toHaveBeenCalled()
    })
})
