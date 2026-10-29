const { freezeCard, unfreezeCard, bulkChangeCardState } = require('../cardState')
const { findByIdScoped, updateCardStateById } = require('../../../models/use-cases/cardIssuance')
const { hasBlockingTermination } = require('../../../models/use-cases/cardRequest')
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

const adminReq = (overrides = {}) => ({
    user: { role: 'CORPORATE', corporateId: 42, id: 5 },
    params: { cardIssuanceId: '1' },
    body: {},
    ...overrides,
})

const frozenCard = (overrides = {}) => ({
    id: 1,
    corporateId: 42,
    status: 'ISSUED',
    cardState: 'FROZEN',
    referenceNumber: 'REF-1',
    maskedCardNumber: '1234 56** **** 7890',
    ...overrides,
})

describe('freeze/unfreeze — locked once a termination request exists', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        resolvePinelabsCredsForRequest.mockResolvedValue({ creds: { token: 't' } })
        pinelabsRequest.mockResolvedValue({ ok: true, data: { responseCode: 0 } })
        isPinelabsSuccess.mockReturnValue(true)
        updateCardStateById.mockResolvedValue()
    })

    it('409s an unfreeze attempt once the card has a termination request (requested or completed)', async () => {
        findByIdScoped.mockResolvedValue(frozenCard())
        hasBlockingTermination.mockResolvedValue(true)
        const next = jest.fn()

        await unfreezeCard(adminReq(), buildRes(), next)

        expect(hasBlockingTermination).toHaveBeenCalledWith(1)
        expect(pinelabsRequest).not.toHaveBeenCalled()
        expect(updateCardStateById).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            status_code: 409,
            message: expect.stringContaining('termination'),
        }))
    })

    it('409s a freeze attempt too, once the card has a termination request', async () => {
        findByIdScoped.mockResolvedValue(frozenCard())
        hasBlockingTermination.mockResolvedValue(true)
        const next = jest.fn()

        await freezeCard(adminReq({ body: { reason: 1 } }), buildRes(), next)

        expect(pinelabsRequest).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409 }))
    })

    it('still allows unfreeze normally when there is no termination request', async () => {
        findByIdScoped.mockResolvedValue(frozenCard())
        hasBlockingTermination.mockResolvedValue(false)
        const res = buildRes()

        await unfreezeCard(adminReq(), res, jest.fn())

        expect(pinelabsRequest).toHaveBeenCalledTimes(1)
        expect(updateCardStateById).toHaveBeenCalledTimes(1)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: true, message: 'Card unfrozen.' }))
    })
})

describe('bulkChangeCardState — termination lock', () => {
    const bulkReq = (cardIds, body = {}) => ({
        user: { role: 'CORPORATE', corporateId: 42, id: 5 },
        body: { action: 'unfreeze', cardIds, ...body },
        query: {},
    })

    const dataOf = (res) => res.json.mock.calls[0][0].data

    beforeEach(() => {
        jest.clearAllMocks()
        resolvePinelabsCredsForRequest.mockResolvedValue({ creds: { token: 't' } })
        pinelabsRequest.mockResolvedValue({ ok: true, data: { responseCode: 0 } })
        isPinelabsSuccess.mockReturnValue(true)
        updateCardStateById.mockResolvedValue()
    })

    it('refuses to unfreeze a termination-locked card even when its id is posted directly', async () => {
        findByIdScoped.mockResolvedValue(frozenCard())
        hasBlockingTermination.mockResolvedValue(true)
        const res = buildRes()

        await bulkChangeCardState(bulkReq(['1']), res, jest.fn())

        expect(pinelabsRequest).not.toHaveBeenCalled()
        expect(updateCardStateById).not.toHaveBeenCalled()
        expect(dataOf(res).summary).toEqual(expect.objectContaining({ succeeded: 0, requested: 1 }))
    })

    it('reports the reason against that card rather than failing the whole batch', async () => {
        findByIdScoped.mockResolvedValue(frozenCard())
        hasBlockingTermination.mockResolvedValue(true)
        const res = buildRes()

        await bulkChangeCardState(bulkReq(['1']), res, jest.fn())

        expect(dataOf(res).results[0]).toEqual(expect.objectContaining({
            id: '1',
            ok: false,
            message: expect.stringContaining('termination'),
        }))
    })

    it('unfreezes the unlocked cards in the same batch', async () => {
        findByIdScoped.mockImplementation(async (id) => frozenCard({ id: Number(id) }))
        hasBlockingTermination.mockImplementation(async (id) => id === 2)
        const res = buildRes()

        await bulkChangeCardState(bulkReq(['1', '2', '3']), res, jest.fn())

        expect(dataOf(res).summary).toEqual(expect.objectContaining({ requested: 3, succeeded: 2 }))
        expect(updateCardStateById).toHaveBeenCalledTimes(2)
    })
})
