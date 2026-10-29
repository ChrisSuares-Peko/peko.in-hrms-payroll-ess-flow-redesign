const { issueCardByAdmin } = require('../adminCardIssue')
const { issueCardCore } = require('../pinelabsCardIssuance')
const { resolvePinelabsCredsForRequest } = require('../../../utils/pinelabsGateway')
const { findCardUserScoped } = require('../../../models/use-cases/cardUser')
const { findByIdScoped, applyLimit } = require('../../../models/use-cases/cardIssuance')
const { findByCorporate } = require('../../../models/use-cases/corporateCardAdminApplication')
const { findMerchantCategory } = require('../../../constants/merchantCategories')

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

const adminReq = (body = {}) => ({
    user: { role: 'CORPORATE', corporateId: 42, id: 5 },
    params: {},
    body: { userId: '99', cardLimit: 5000, ...body },
})

const wireHappyPath = () => {
    findCardUserScoped.mockResolvedValue({ id: '99', name: 'Aarav Sharma', mobileNo: '9876543210', email: 'aarav@peko.in' })
    resolvePinelabsCredsForRequest.mockResolvedValue({ creds: { token: 't' } })
    findByCorporate.mockResolvedValue({ cardSchemeId: 7 })
    issueCardCore.mockResolvedValue({ ok: true, card: { id: 123 }, confirmed: true })
    applyLimit.mockResolvedValue({ id: 123, perTxnLimit: '1000.00' })
    findByIdScoped.mockResolvedValue({ id: 123 })
    findMerchantCategory.mockImplementation((name) => ({ category: name, mccs: ['1234'] }))
}

const paramsOf = () => issueCardCore.mock.calls[0][0].params

describe('issueCardByAdmin — spend controls survive an unconfirmed issuance', () => {
    beforeEach(() => jest.clearAllMocks())

    // The controls are enforced by our own JIT webhook against this row, so writing them at creation IS
    // applying them — there is no vendor call to wait for.
    it('passes the controls to issueCardCore so they are stored on the row', async () => {
        wireHappyPath()

        await issueCardByAdmin(adminReq({ perTxnLimit: 1000, frequency: 'weekly', atmEnabled: true, restrictedCategories: ['Gambling'] }), buildRes(), jest.fn())

        expect(paramsOf()).toEqual(expect.objectContaining({
            enforcedLimit: 5000,
            perTxnLimit: 1000,
            limitFrequency: 'weekly',
            atmEnabled: true,
            restrictedCategories: [{ category: 'Gambling', mccs: ['1234'] }],
        }))
    })

    // The bug: this branch returns before applyLimit, so anything not carried into createCard was lost
    // and the Cards table showed "-" for the per-transaction limit once the card was confirmed.
    it('still stores the per-transaction limit when the issuer does not confirm synchronously', async () => {
        wireHappyPath()
        issueCardCore.mockResolvedValue({ ok: true, card: { id: 123 }, confirmed: false })
        const res = buildRes()

        await issueCardByAdmin(adminReq({ perTxnLimit: 1000, frequency: 'daily' }), res, jest.fn())

        expect(applyLimit).not.toHaveBeenCalled()
        expect(paramsOf()).toEqual(expect.objectContaining({ perTxnLimit: 1000, limitFrequency: 'daily' }))
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ confirmed: false, controlsApplied: true }),
        }))
    })

    it('omits the per-transaction limit entirely when none was entered', async () => {
        wireHappyPath()

        await issueCardByAdmin(adminReq(), buildRes(), jest.fn())

        expect(paramsOf()).not.toHaveProperty('perTxnLimit')
        expect(paramsOf()).toEqual(expect.objectContaining({ limitFrequency: 'monthly' }))
    })

    it('applies the same controls again on the confirmed path', async () => {
        wireHappyPath()

        await issueCardByAdmin(adminReq({ perTxnLimit: 1000, frequency: 'weekly', atmEnabled: false }), buildRes(), jest.fn())

        expect(applyLimit).toHaveBeenCalledWith(
            123,
            expect.objectContaining({ cardLimit: 5000, perTxnLimit: 1000, limitFrequency: 'weekly', atmEnabled: false }),
            5
        )
    })

    it('rejects a per-transaction limit above the card limit', async () => {
        wireHappyPath()
        const next = jest.fn()

        await issueCardByAdmin(adminReq({ perTxnLimit: 6000 }), buildRes(), next)

        expect(issueCardCore).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('rejects a non-numeric per-transaction limit', async () => {
        wireHappyPath()
        const next = jest.fn()

        await issueCardByAdmin(adminReq({ perTxnLimit: 'abc' }), buildRes(), next)

        expect(issueCardCore).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })
})
