const { setCardLimits, setCardControls, setCardSettings } = require('../cardLimits')
const { bulkChangeCardState } = require('../cardState')
const { issueCardByAdmin, issuePhysicalCardByAdmin } = require('../adminCardIssue')
const { findByIdScoped, applyLimit } = require('../../../models/use-cases/cardIssuance')
const { findCardUserScoped } = require('../../../models/use-cases/cardUser')
const { issueCardCore } = require('../pinelabsCardIssuance')
const { SELF_ADMIN_DENIED } = require('../../../constants/messages')
const { findOwnerCardholder } = require('../../../utils/sharedDirectory')

jest.mock('../../../models/use-cases/cardIssuance', () => ({
    findByIdScoped: jest.fn(),
    applyLimit: jest.fn(),
}))
jest.mock('../../../models/use-cases/cardUser', () => ({
    findCardUserScoped: jest.fn(),
    findCardholderById: jest.fn(),
}))
jest.mock('../../../models/use-cases/cardAuditLog', () => ({
    writeAudit: jest.fn(), findByCard: jest.fn(), findAllByCard: jest.fn(),
}))
jest.mock('../../../models/use-cases/cardTransaction', () => ({
    getSpendByCard: jest.fn().mockResolvedValue(new Map()),
}))
jest.mock('../../../models/use-cases/cardRequest', () => ({
    findOpenByCardIds: jest.fn().mockResolvedValue([]),
    findOpenUnfreezeByCardIds: jest.fn().mockResolvedValue([]),
    updateStatus: jest.fn(),
}))
jest.mock('../../../models/use-cases/corporateCardAdminApplication', () => ({
    findByCorporate: jest.fn().mockResolvedValue({ cardSchemeId: 'scheme-1' }),
}))
jest.mock('../pinelabsCardIssuance', () => ({ issueCardCore: jest.fn() }))
jest.mock('../cardRequests', () => ({ buildShipping: () => ({ shipping: {} }) }))
jest.mock('../../../utils/pinelabsGateway', () => ({
    resolvePinelabsCredsForRequest: jest.fn().mockResolvedValue({ creds: {} }),
    freezeCard: jest.fn(), unfreezeCard: jest.fn(),
}))
jest.mock('../../../utils/serializeCard', () => ({ serializeCard: (c) => c }))
jest.mock('../../../utils/sharedDirectory', () => ({
    findOwnerCardholder: jest.fn().mockResolvedValue(null),
    getCardUsersByIds: jest.fn().mockResolvedValue(new Map()),
    findCardholderById: jest.fn().mockResolvedValue(null),
    CORPORATE_CARDS_SERVICE: 'Corporate Cards',
}))
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))

const SELF = '77'
const OTHER = '99'

const subAdminReq = (overrides = {}) => ({
    user: {
        role: 'USER',
        corporateId: 42,
        employeeProfileId: SELF,
        id: 5001,
        employeeName: 'Priya Admin',
        serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }],
    },
    params: {},
    body: {},
    query: {},
    ...overrides,
})

const ownerReq = (overrides = {}) => ({
    user: { role: 'CORPORATE', corporateId: 42, id: 7, contactPersonName: 'Owner' },
    params: {},
    body: {},
    query: {},
    ...overrides,
})

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const card = (userId) => ({
    id: '900', userId, corporateId: 42, status: 'ISSUED', cardLimit: '10000', cardState: 'ACTIVE',
    cardType: 'VIRTUAL', referenceNumber: 'REF1',
})

const expectDenied = (next) => {
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
        status_code: 403,
        message: SELF_ADMIN_DENIED,
    }))
}

const OWNER_PROFILE = '700'

beforeEach(() => {
    jest.clearAllMocks()
    findCardUserScoped.mockResolvedValue({ id: OTHER, name: 'Aarav', mobileNo: '9999999999', email: 'a@peko.in' })
    issueCardCore.mockResolvedValue({ ok: true, confirmed: true, card: { id: '901' } })
    findOwnerCardholder.mockResolvedValue(null)
})

describe('the owner\'s own card is out of reach of a member', () => {
    beforeEach(() => findOwnerCardholder.mockResolvedValue({ id: OWNER_PROFILE, name: 'Asha Owner' }))

    it('refuses a sub-corporate Admin setting limits on the owner\'s card', async () => {
        findByIdScoped.mockResolvedValue(card(OWNER_PROFILE))
        const next = jest.fn()

        await setCardLimits(
            subAdminReq({ params: { cardIssuanceId: '900' }, body: { cardLimit: 5000, frequency: 'monthly' } }),
            buildRes(), next
        )

        expectDenied(next)
        expect(applyLimit).not.toHaveBeenCalled()
    })

    it('refuses a sub-corporate Admin issuing a card to the owner', async () => {
        findCardUserScoped.mockResolvedValue({ id: OWNER_PROFILE, name: 'Asha Owner', mobileNo: '8888888888', email: 'asha@peko.in' })
        const next = jest.fn()

        await issueCardByAdmin(
            subAdminReq({ body: { userId: OWNER_PROFILE, cardLimit: 100000, frequency: 'monthly' } }),
            buildRes(), next
        )

        expectDenied(next)
        expect(issueCardCore).not.toHaveBeenCalled()
    })

    it('skips the owner\'s card in a bulk state change', async () => {
        findByIdScoped.mockResolvedValue(card(OWNER_PROFILE))
        const res = buildRes()

        await bulkChangeCardState(subAdminReq({ body: { action: 'freeze', reason: 1, cardIds: ['900'] } }), res, jest.fn())

        expect(res.json.mock.calls[0][0].data.results).toEqual([
            expect.objectContaining({ id: '900', ok: false, skipped: true, message: SELF_ADMIN_DENIED }),
        ])
    })

    it('does not restrict the corporate owner on their own card', async () => {
        findByIdScoped.mockResolvedValue(card(OWNER_PROFILE))

        await setCardLimits(
            ownerReq({ params: { cardIssuanceId: '900' }, body: { cardLimit: 5000, frequency: 'monthly' } }),
            buildRes(), jest.fn()
        )

        expect(applyLimit).toHaveBeenCalled()
    })
})

describe('setCardLimits', () => {
    const body = { cardLimit: 9999999999, frequency: 'monthly' }

    it('refuses a sub-corporate Admin raising the limit on their OWN card', async () => {
        findByIdScoped.mockResolvedValue(card(SELF))
        const next = jest.fn()

        await setCardLimits(subAdminReq({ params: { cardIssuanceId: '900' }, body }), buildRes(), next)

        expectDenied(next)
        expect(applyLimit).not.toHaveBeenCalled()
    })

    it('still lets them set another member\'s limit', async () => {
        findByIdScoped.mockResolvedValue(card(OTHER))

        await setCardLimits(subAdminReq({ params: { cardIssuanceId: '900' }, body }), buildRes(), jest.fn())

        expect(applyLimit).toHaveBeenCalled()
    })

    it('does not restrict the corporate owner on any card', async () => {
        findByIdScoped.mockResolvedValue(card(SELF))

        await setCardLimits(ownerReq({ params: { cardIssuanceId: '900' }, body }), buildRes(), jest.fn())

        expect(applyLimit).toHaveBeenCalled()
    })
})

describe('setCardControls', () => {
    it('refuses a sub-corporate Admin clearing restrictions on their OWN card', async () => {
        findByIdScoped.mockResolvedValue(card(SELF))
        const next = jest.fn()

        await setCardControls(
            subAdminReq({ params: { cardIssuanceId: '900' }, body: { atmEnabled: true, restrictedCategories: [] } }),
            buildRes(), next
        )

        expectDenied(next)
        expect(applyLimit).not.toHaveBeenCalled()
    })
})

describe('setCardSettings', () => {
    it('refuses a sub-corporate Admin editing their OWN card settings', async () => {
        findByIdScoped.mockResolvedValue(card(SELF))
        const next = jest.fn()

        await setCardSettings(
            subAdminReq({
                params: { cardIssuanceId: '900' },
                body: { cardLimit: 500000, frequency: 'monthly', atmEnabled: true, restrictedCategories: [] },
            }),
            buildRes(), next
        )

        expectDenied(next)
        expect(applyLimit).not.toHaveBeenCalled()
    })
})

describe('bulkChangeCardState', () => {
    it('skips the caller\'s own card instead of acting on it as admin', async () => {
        findByIdScoped.mockImplementation(async (id) => (id === '900' ? card(SELF) : card(OTHER)))
        const res = buildRes()

        await bulkChangeCardState(
            subAdminReq({ body: { action: 'unfreeze', cardIds: ['900'] } }),
            res, jest.fn()
        )

        const payload = res.json.mock.calls[0][0]
        expect(payload.data.results).toEqual([
            expect.objectContaining({ id: '900', ok: false, skipped: true, message: SELF_ADMIN_DENIED }),
        ])
    })
})

describe('issueCardByAdmin', () => {
    it('refuses a sub-corporate Admin issuing a card to themselves', async () => {
        const next = jest.fn()

        await issueCardByAdmin(
            subAdminReq({ body: { userId: SELF, cardLimit: 100000, frequency: 'monthly' } }),
            buildRes(), next
        )

        expectDenied(next)
        expect(issueCardCore).not.toHaveBeenCalled()
    })

    it('still lets them issue a card to another member', async () => {
        await issueCardByAdmin(
            subAdminReq({ body: { userId: OTHER, cardLimit: 100000, frequency: 'monthly' } }),
            buildRes(), jest.fn()
        )

        expect(issueCardCore).toHaveBeenCalled()
    })
})

describe('issuePhysicalCardByAdmin', () => {
    it('refuses a sub-corporate Admin ordering a physical card for their OWN card', async () => {
        findByIdScoped.mockResolvedValue(card(SELF))
        const next = jest.fn()

        await issuePhysicalCardByAdmin(subAdminReq({ params: { cardIssuanceId: '900' } }), buildRes(), next)

        expectDenied(next)
        expect(issueCardCore).not.toHaveBeenCalled()
    })
})
