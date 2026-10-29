const { freezeCardholderCards } = require('../cardState')
const { findCardsByScope, updateCardStateById } = require('../../../models/use-cases/cardIssuance')
const { hasBlockingTermination } = require('../../../models/use-cases/cardRequest')
const { writeAudit } = require('../../../models/use-cases/cardAuditLog')
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
jest.mock('../../../models/use-cases/cardAuditLog', () => ({ writeAudit: jest.fn() }))
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

const adminReq = () => ({
    user: { role: 'CORPORATE', corporateId: 42, id: 5 },
    params: { userId: '99' },
    body: {},
})

// The cardholder only ever sees a generic error for a refused freeze, so the audit row is the one place an
// admin (the Corporate Card Lookup) can learn it was attempted and why it failed.
describe('card state change failure audit', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        updateCardStateById.mockResolvedValue()
        writeAudit.mockResolvedValue()
        resolvePinelabsCredsForRequest.mockResolvedValue({ creds: { token: 't' } })
        hasBlockingTermination.mockResolvedValue(false)
        findCardsByScope.mockResolvedValue([{
            id: 1, userId: '99', status: 'ISSUED', cardState: 'ACTIVE', referenceNumber: 'REF-1', maskedCardNumber: '1234 56** **** 7890',
        }])
    })

    it('records a failed freeze with the issuer\'s reason and code', async () => {
        pinelabsRequest.mockResolvedValue({ ok: false, data: { responseCode: 12, responseMessage: 'Card not found' } })
        isPinelabsSuccess.mockReturnValue(false)

        await freezeCardholderCards(adminReq(), buildRes(), jest.fn())

        expect(updateCardStateById).not.toHaveBeenCalled()
        expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({
            corporateId: 42,
            userId: '99',
            cardIssuanceId: 1,
            action: 'CARD_FREEZE_FAILED',
            title: 'Card freeze failed',
            description: 'Card ending 7890 could not be frozen: Card not found',
            metadata: expect.objectContaining({ responseMessage: 'Card not found' }),
        }))
    })

    it('does not record a failure when the freeze succeeds', async () => {
        pinelabsRequest.mockResolvedValue({ ok: true, data: { responseCode: 0 } })
        isPinelabsSuccess.mockReturnValue(true)

        await freezeCardholderCards(adminReq(), buildRes(), jest.fn())

        expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'CARD_FROZEN' }))
        expect(writeAudit).not.toHaveBeenCalledWith(expect.objectContaining({ action: 'CARD_FREEZE_FAILED' }))
    })
})
