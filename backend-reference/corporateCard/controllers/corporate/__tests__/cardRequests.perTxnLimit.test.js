const { createCardRequest, approveRequest } = require('../cardRequests')
const {
    createRequest, findActiveByTarget, findByIdScoped: findRequestScoped,
    decideFromPendingCAS, updateById,
} = require('../../../models/use-cases/cardRequest')
const { findCardUserScoped } = require('../../../models/use-cases/cardUser')
const { findByMobile } = require('../../../models/use-cases/cardholderKyc')
const { findByCorporate } = require('../../../models/use-cases/corporateCardAdminApplication')
const { issueCardCore } = require('../pinelabsCardIssuance')
const { resolvePinelabsCredsForRequest } = require('../../../utils/pinelabsGateway')
const { safeAudit } = require('../../../utils/cardHelpers')

jest.mock('../../../configs/database/index', () => ({ transaction: jest.fn((cb) => cb({})) }))
jest.mock('../../../models/use-cases/cardIssuance', () => ({
    findByIdScoped: jest.fn(),
    findByIdForUpdate: jest.fn(),
    applyLimit: jest.fn(),
    updateCardStateById: jest.fn(),
}))
jest.mock('../../../models/use-cases/cardRequest', () => ({
    createRequest: jest.fn(),
    findActiveByTarget: jest.fn(),
    findByIdScoped: jest.fn(),
    findAndCountForQueue: jest.fn(),
    findByRequester: jest.fn(),
    decideFromPendingCAS: jest.fn(),
    updateById: jest.fn(),
    finalizeFromProcessingCAS: jest.fn(),
    hasBlockingTermination: jest.fn(),
    resolveActiveByCards: jest.fn(),
}))
jest.mock('../../../models/use-cases/corporateCardAdminApplication', () => ({ findByCorporate: jest.fn() }))
jest.mock('../../../models/use-cases/cardholderKyc', () => ({ findByMobile: jest.fn() }))
jest.mock('../../../models/use-cases/cardUser', () => ({ findCardUserScoped: jest.fn() }))
jest.mock('../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }))
jest.mock('../pinelabsCardIssuance', () => ({ issueCardCore: jest.fn() }))
jest.mock('../cardState', () => ({ applyCardStateChange: jest.fn() }))
jest.mock('../../../utils/serializeCard', () => ({ serializeCard: jest.fn((c) => ({ id: c?.id })) }))
jest.mock('../../../utils/pinelabsGateway', () => ({ resolvePinelabsCredsForRequest: jest.fn() }))
jest.mock('../../../utils/sharedDirectory', () => ({ searchCardUserIds: jest.fn() }))
jest.mock('../../../utils/emailer', () => ({ email: jest.fn() }))
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../../utils/cardHelpers', () => ({
    rowCardholderIdentity: jest.fn((row) => (row?.userId ? { userId: row.userId } : null)),
    rowBelongsToCardholder: jest.fn((row, identity) => {
        if (!identity?.userId) return false
        return String(row?.userId ?? '') === String(identity.userId)
    }),
    parsePaging: jest.fn(),
    toNum: jest.fn((v) => (v === null || v === undefined || v === '' ? null : Number(v))),
    round2: jest.fn((v) => Math.round(v * 100) / 100),
    fmt: jest.fn((v) => String(v)),
    last4: jest.fn(() => null),
    adminActor: jest.fn(() => 'Admin'),
    cardholderActor: jest.fn(() => 'Cardholder'),
    actorCredentialId: jest.fn(() => 5),
    actorUsername: jest.fn(() => 'PEKO123'),
    actorDisplay: jest.fn(() => 'Admin'),
    safeAudit: jest.fn(),
    attachCardholders: jest.fn(),
    isSubAdminSelfTarget: jest.fn(() => false),
    isProtectedOwnerTarget: jest.fn(async () => false),
    escapeHtml: jest.fn((v) => v),
    MOBILE_REGEX: /^\d{10}$/,
    cardholderColumnsOf: jest.fn((row) => ({ userId: row?.userId ?? null })),
    cardholderColumnsForSession: jest.fn((req) => ({ userId: req?.user?.employeeProfileId ?? null })),
}))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const holderReq = (body = {}) => ({
    user: { role: 'USER', corporateId: 42, employeeProfileId: '99', id: 7, serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] },
    body: { requestType: 'CARD_ISSUANCE', cardType: 'Virtual', period: 1, cardLimit: 5000, ...body },
})

const adminReq = (body = {}) => ({
    user: { role: 'CORPORATE', corporateId: 42, id: 5 },
    params: { id: '11' },
    body,
})

const issuanceRequest = (payload = {}) => ({
    id: 11,
    corporateId: 42,
    userId: '99',
    cardIssuanceId: null,
    requestType: 'CARD_ISSUANCE',
    status: 'PENDING',
    reason: 'Team travel',
    requestedByCredentialId: 7,
    payload: { cardType: 'Virtual', requestedLimit: 5000, ...payload },
})

const payloadOf = () => createRequest.mock.calls[0][0].payload
const issueParamsOf = () => issueCardCore.mock.calls[0][0].params

describe('CARD_ISSUANCE request — per-transaction limit', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findActiveByTarget.mockResolvedValue(null)
        createRequest.mockResolvedValue({ id: 11 })
        safeAudit.mockResolvedValue()
    })

    describe('create', () => {
        it('stores the requested cap on the request payload', async () => {
            await createCardRequest(holderReq({ perTxnLimit: 1000 }), buildRes(), jest.fn())

            expect(payloadOf()).toEqual(expect.objectContaining({ requestedLimit: 5000, perTxnLimit: 1000 }))
        })

        it('omits the cap entirely when the field is left blank', async () => {
            await createCardRequest(holderReq({ perTxnLimit: '' }), buildRes(), jest.fn())

            expect(payloadOf()).not.toHaveProperty('perTxnLimit')
        })

        it('omits the cap when the field is absent', async () => {
            await createCardRequest(holderReq(), buildRes(), jest.fn())

            expect(payloadOf()).not.toHaveProperty('perTxnLimit')
        })

        it('rejects a non-numeric cap', async () => {
            const next = jest.fn()

            await createCardRequest(holderReq({ perTxnLimit: 'abc' }), buildRes(), next)

            expect(createRequest).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        })

        it('rejects a zero cap rather than storing an unspendable card', async () => {
            const next = jest.fn()

            await createCardRequest(holderReq({ perTxnLimit: 0 }), buildRes(), next)

            expect(createRequest).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        })

        it('rejects a cap above the card limit', async () => {
            const next = jest.fn()

            await createCardRequest(holderReq({ perTxnLimit: 6000 }), buildRes(), next)

            expect(createRequest).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                status_code: 400,
                message: 'Per-transaction limit cannot exceed the card limit.',
            }))
        })
    })

    describe('approve', () => {
        beforeEach(() => {
            findCardUserScoped.mockResolvedValue({ id: '99', name: 'Aarav Sharma', mobileNo: '9876543210', email: 'aarav@peko.in' })
            findByMobile.mockResolvedValue({ kycStatus: 'COMPLETED' })
            resolvePinelabsCredsForRequest.mockResolvedValue({ creds: { token: 't' } })
            findByCorporate.mockResolvedValue({ cardSchemeId: 7 })
            decideFromPendingCAS.mockResolvedValue(1)
            updateById.mockResolvedValue(1)
            issueCardCore.mockResolvedValue({ ok: true, card: { id: 123 }, confirmed: true })
        })

        it('applies the requested cap to the issued card', async () => {
            findRequestScoped.mockResolvedValue(issuanceRequest({ perTxnLimit: 1000 }))

            await approveRequest(adminReq(), buildRes(), jest.fn())

            expect(issueParamsOf()).toEqual(expect.objectContaining({ enforcedLimit: 5000, perTxnLimit: 1000 }))
        })

        it('leaves the card uncapped when the cardholder asked for no cap', async () => {
            findRequestScoped.mockResolvedValue(issuanceRequest())

            await approveRequest(adminReq(), buildRes(), jest.fn())

            expect(issueParamsOf()).not.toHaveProperty('perTxnLimit')
        })

        it('clamps the cap to a lowered approved limit', async () => {
            findRequestScoped.mockResolvedValue(issuanceRequest({ perTxnLimit: 5000 }))

            await approveRequest(adminReq({ approvedLimit: 2000 }), buildRes(), jest.fn())

            expect(issueParamsOf()).toEqual(expect.objectContaining({ enforcedLimit: 2000, perTxnLimit: 2000 }))
        })

        it('keeps a cap that still fits under a lowered approved limit', async () => {
            findRequestScoped.mockResolvedValue(issuanceRequest({ perTxnLimit: 1000 }))

            await approveRequest(adminReq({ approvedLimit: 2000 }), buildRes(), jest.fn())

            expect(issueParamsOf()).toEqual(expect.objectContaining({ enforcedLimit: 2000, perTxnLimit: 1000 }))
        })

        it('records the applied cap on the decided request', async () => {
            findRequestScoped.mockResolvedValue(issuanceRequest({ perTxnLimit: 1000 }))

            await approveRequest(adminReq(), buildRes(), jest.fn())

            expect(updateById).toHaveBeenCalledWith('11', expect.objectContaining({
                status: 'APPROVED',
                result: expect.objectContaining({ approvedLimit: 5000, perTxnLimit: 1000 }),
            }))
        })

        it('records the applied cap when the issuer has not confirmed yet', async () => {
            findRequestScoped.mockResolvedValue(issuanceRequest({ perTxnLimit: 1000 }))
            issueCardCore.mockResolvedValue({ ok: true, card: { id: 123 }, confirmed: false })

            await approveRequest(adminReq(), buildRes(), jest.fn())

            expect(updateById).toHaveBeenCalledWith('11', expect.objectContaining({
                status: 'PROCESSING',
                result: expect.objectContaining({ approvedLimit: 5000, perTxnLimit: 1000 }),
            }))
        })
    })
})

// requireCardholder is the only middleware standing between a session and six tables that key on this value.
// A request stored without it names no member in the approval queue and can never be approved, and nothing
// downstream — not the column, not the model — refuses it.
describe('CARD_ISSUANCE request — a request must belong to someone', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findActiveByTarget.mockResolvedValue(null)
        createRequest.mockResolvedValue({ id: 11 })
        safeAudit.mockResolvedValue()
    })

    it('refuses a session carrying no cardholder identity, without writing or looking anything up', async () => {
        const req = holderReq()
        req.user.employeeProfileId = null
        const next = jest.fn()

        await createCardRequest(req, buildRes(), next)

        expect(createRequest).not.toHaveBeenCalled()
        expect(findActiveByTarget).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })

    it('refuses a session carrying no corporate', async () => {
        const req = holderReq()
        req.user.corporateId = null
        const next = jest.fn()

        await createCardRequest(req, buildRes(), next)

        expect(createRequest).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('stamps the cardholder on the row it writes', async () => {
        await createCardRequest(holderReq(), buildRes(), jest.fn())

        expect(createRequest).toHaveBeenCalledWith(
            expect.objectContaining({ corporateId: 42, userId: '99' })
        )
    })
})
