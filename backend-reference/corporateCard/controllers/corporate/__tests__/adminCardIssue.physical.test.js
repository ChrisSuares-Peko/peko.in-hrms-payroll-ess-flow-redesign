const { issuePhysicalCardByAdmin } = require('../adminCardIssue')
const { issueCardCore } = require('../pinelabsCardIssuance')
const { buildShipping } = require('../cardRequests')
const { resolvePinelabsCredsForRequest } = require('../../../utils/pinelabsGateway')
const { findCardUserScoped } = require('../../../models/use-cases/cardUser')
const { findByIdScoped } = require('../../../models/use-cases/cardIssuance')
const { findByCorporate } = require('../../../models/use-cases/corporateCardAdminApplication')

jest.mock('../pinelabsCardIssuance', () => ({ issueCardCore: jest.fn() }))
jest.mock('../cardRequests', () => ({ buildShipping: jest.fn() }))
jest.mock('../../../utils/pinelabsGateway', () => ({ resolvePinelabsCredsForRequest: jest.fn() }))
jest.mock('../../../models/use-cases/cardUser', () => ({ findCardUserScoped: jest.fn() }))
jest.mock('../../../models/use-cases/cardIssuance', () => ({ findByIdScoped: jest.fn(), applyLimit: jest.fn() }))
jest.mock('../../../models/use-cases/corporateCardAdminApplication', () => ({ findByCorporate: jest.fn() }))
jest.mock('../../../utils/serializeCard', () => ({ serializeCard: jest.fn((c) => ({ id: c.id })) }))
jest.mock('../../../constants/merchantCategories', () => ({ findMerchantCategory: jest.fn() }))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const adminReq = (overrides = {}) => ({
    user: { role: 'CORPORATE', corporateId: 42, id: 5 },
    params: { cardIssuanceId: '10' },
    body: {},
    ...overrides,
})

const sourceCard = (overrides = {}) => ({
    id: 10,
    userId: '99',
    status: 'ISSUED',
    cardType: 'Virtual',
    referenceNumber: 'REF-1',
    serialNumber: 'SER-1',
    cardLimit: '5000.00',
    ...overrides,
})

const wireHappyPath = () => {
    findByIdScoped.mockResolvedValue(sourceCard())
    buildShipping.mockReturnValue({ shipping: { nameOnCard: 'Aarav', addressLine1: 'A1', city: 'Kochi', state: 'Kerala', pinCode: '682001', mobileNumber: '9876543210' } })
    findCardUserScoped.mockResolvedValue({ id: '99', name: 'Aarav Sharma', mobileNo: '9876543210', email: 'aarav@peko.in' })
    resolvePinelabsCredsForRequest.mockResolvedValue({ creds: { token: 't' } })
    findByCorporate.mockResolvedValue({ cardSchemeId: 7 })
    issueCardCore.mockResolvedValue({ ok: true, card: { id: 123 } })
}

describe('issuePhysicalCardByAdmin', () => {
    beforeEach(() => jest.clearAllMocks())

    it('404s when the source card is not found in the corporate', async () => {
        findByIdScoped.mockResolvedValue(null)
        const next = jest.fn()

        await issuePhysicalCardByAdmin(adminReq(), buildRes(), next)

        expect(issueCardCore).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }))
    })

    it('400s when the source card is not active (ISSUED)', async () => {
        findByIdScoped.mockResolvedValue(sourceCard({ status: 'PENDING' }))
        const next = jest.fn()

        await issuePhysicalCardByAdmin(adminReq(), buildRes(), next)

        expect(issueCardCore).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('400s a frozen source card rather than reissuing it as an active physical card', async () => {
        findByIdScoped.mockResolvedValue(sourceCard({ cardState: 'FROZEN' }))
        const next = jest.fn()

        await issuePhysicalCardByAdmin(adminReq(), buildRes(), next)

        expect(issueCardCore).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            status_code: 400,
            message: expect.stringContaining('frozen'),
        }))
    })

    it('400s a card frozen for termination', async () => {
        findByIdScoped.mockResolvedValue(
            sourceCard({ cardState: 'FROZEN', freezeReasonNote: 'Card termination requested' })
        )
        const next = jest.fn()

        await issuePhysicalCardByAdmin(adminReq(), buildRes(), next)

        expect(issueCardCore).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('still converts a card whose cardState is unset', async () => {
        wireHappyPath()
        findByIdScoped.mockResolvedValue(sourceCard({ cardState: null }))

        await issuePhysicalCardByAdmin(adminReq(), buildRes(), jest.fn())

        expect(issueCardCore).toHaveBeenCalledTimes(1)
    })

    it('400s when the source card is already physical', async () => {
        findByIdScoped.mockResolvedValue(sourceCard({ cardType: 'Physical' }))
        const next = jest.fn()

        await issuePhysicalCardByAdmin(adminReq(), buildRes(), next)

        expect(issueCardCore).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('400s when the source card has no vendor reference', async () => {
        findByIdScoped.mockResolvedValue(sourceCard({ referenceNumber: null }))
        const next = jest.fn()

        await issuePhysicalCardByAdmin(adminReq(), buildRes(), next)

        expect(issueCardCore).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('400s when the delivery details are invalid', async () => {
        findByIdScoped.mockResolvedValue(sourceCard())
        buildShipping.mockReturnValue({ error: 'Enter a valid address line 1.' })
        const next = jest.fn()

        await issuePhysicalCardByAdmin(adminReq(), buildRes(), next)

        expect(issueCardCore).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('404s when the source cardholder can no longer be resolved', async () => {
        wireHappyPath()
        findCardUserScoped.mockResolvedValue(null)
        const next = jest.fn()

        await issuePhysicalCardByAdmin(adminReq(), buildRes(), next)

        expect(issueCardCore).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }))
    })

    it('issues a PHYSICAL card inheriting the source limit, no request/approval cycle', async () => {
        wireHappyPath()
        const res = buildRes()
        const next = jest.fn()

        await issuePhysicalCardByAdmin(adminReq(), res, next)

        expect(next).not.toHaveBeenCalled()
        expect(issueCardCore).toHaveBeenCalledWith(expect.objectContaining({
            cardholder: expect.objectContaining({ userId: '99', corporateId: 42, credentialId: null }),
            params: expect.objectContaining({
                cardType: 'Physical',
                enforcedLimit: 5000,
                requestedLimit: 5000,
                sourceReferenceNumber: 'REF-1',
                sourceCardIssuanceId: 10,
            }),
        }))
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Physical card issued.',
            data: { card: { id: 123 }, confirmed: true },
        }))
    })

    // The physical card REPLACES the virtual one, so controls that do not travel with it are silently
    // reset on replacement.
    it('carries the source card spend controls onto the companion card', async () => {
        wireHappyPath()
        findByIdScoped.mockResolvedValue(sourceCard({
            perTxnLimit: '1000.00',
            limitFrequency: 'weekly',
            atmEnabled: true,
            restrictedCategories: [{ category: 'Gambling', mccs: ['7995'] }],
        }))

        await issuePhysicalCardByAdmin(adminReq(), buildRes(), jest.fn())

        expect(issueCardCore).toHaveBeenCalledWith(expect.objectContaining({
            params: expect.objectContaining({
                perTxnLimit: 1000,
                limitFrequency: 'weekly',
                atmEnabled: true,
                restrictedCategories: [{ category: 'Gambling', mccs: ['7995'] }],
            }),
        }))
    })

    it('surfaces a vendor/KYC failure from issueCardCore', async () => {
        wireHappyPath()
        issueCardCore.mockResolvedValue({ ok: false, statusCode: 400, message: 'KYC is not completed for this cardholder.' })
        const next = jest.fn()

        await issuePhysicalCardByAdmin(adminReq(), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })
})
