const { approveRequest, listRequests } = require('../cardRequests')
const {
    findByIdScoped: findRequestScoped,
    decideFromPendingCAS,
    findAndCountForQueue,
} = require('../../../models/use-cases/cardRequest')
const { grantCardMembership } = require('../../../utils/sharedDirectory')
const { safeAudit, parsePaging } = require('../../../utils/cardHelpers')
const { createNotification } = require('../../../models/use-cases/notification')

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
jest.mock('../../../utils/sharedDirectory', () => ({
    searchCardUserIds: jest.fn(),
    getSelfCorporate: jest.fn(),
    grantCardMembership: jest.fn(),
}))
jest.mock('../../../utils/emailer', () => ({ email: jest.fn() }))
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../../utils/cardHelpers', () => ({
    rowCardholderIdentity: jest.fn((row) => (row?.userId ? { userId: row.userId } : null)),
    rowBelongsToCardholder: jest.fn(() => false),
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

const adminReq = (body = {}) => ({ user: { role: 'CORPORATE', corporateId: 42, id: 5 }, params: { id: '11' }, body })

const membershipRequest = (overrides = {}) => ({
    id: 11,
    corporateId: 42,
    userId: '99',
    cardIssuanceId: null,
    requestType: 'MEMBERSHIP',
    status: 'PENDING',
    payload: { cardholderUsername: 'rakshita@example.com' },
    ...overrides,
})

const errorOf = (next) => next.mock.calls[0][0]
const auditOf = () => safeAudit.mock.calls[0][1]

beforeEach(() => {
    jest.clearAllMocks()
    findRequestScoped.mockResolvedValue(membershipRequest())
    grantCardMembership.mockResolvedValue({ userId: '99', alreadyHeld: false })
    decideFromPendingCAS.mockResolvedValue(1)
})

describe('approving a membership request', () => {
    it('grants the service and marks the request approved', async () => {
        const res = buildRes()
        await approveRequest(adminReq(), res, jest.fn())

        expect(grantCardMembership).toHaveBeenCalledWith(expect.objectContaining({ userId: '99' }))
        expect(decideFromPendingCAS).toHaveBeenCalledWith(
            '11',
            expect.objectContaining({ status: 'APPROVED', decidedByCredentialId: 5 })
        )
        expect(res.json.mock.calls[0][0].data).toEqual({ id: '11', status: 'APPROVED' })
    })

    it('grants before marking, so a failed mark leaves the request re-approvable', async () => {
        const grantOrder = []
        grantCardMembership.mockImplementation(async () => {
            grantOrder.push('grant')
            return { userId: '99', alreadyHeld: false }
        })
        decideFromPendingCAS.mockImplementation(async () => {
            grantOrder.push('mark')
            return 1
        })

        await approveRequest(adminReq(), buildRes(), jest.fn())

        expect(grantOrder).toEqual(['grant', 'mark'])
    })

    it('leaves the request pending when the grant fails', async () => {
        grantCardMembership.mockRejectedValue(new Error('others unreachable'))
        const next = jest.fn()

        await approveRequest(adminReq(), buildRes(), next)

        expect(errorOf(next).status_code).toBe(502)
        expect(decideFromPendingCAS).not.toHaveBeenCalled()
    })

    it('refuses a request someone else already decided', async () => {
        decideFromPendingCAS.mockResolvedValue(0)
        const next = jest.fn()

        await approveRequest(adminReq(), buildRes(), next)

        expect(errorOf(next).status_code).toBe(409)
    })

    it('refuses a request with no employee on it', async () => {
        findRequestScoped.mockResolvedValue(membershipRequest({ userId: null }))
        const next = jest.fn()

        await approveRequest(adminReq(), buildRes(), next)

        expect(errorOf(next).status_code).toBe(400)
        expect(grantCardMembership).not.toHaveBeenCalled()
    })

    it('refuses a request already decided before it reaches the branch', async () => {
        findRequestScoped.mockResolvedValue(membershipRequest({ status: 'APPROVED' }))
        const next = jest.fn()

        await approveRequest(adminReq(), buildRes(), next)

        expect(errorOf(next).status_code).toBe(409)
        expect(grantCardMembership).not.toHaveBeenCalled()
    })

    it('tells the employee their access was approved', async () => {
        await approveRequest(adminReq(), buildRes(), jest.fn())

        expect(createNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                notificationCategory: 'CARD_ACCESS_APPROVED',
                notificationTo: 'rakshita@example.com',
                notificationBy: 'ADMIN',
            }),
            expect.anything()
        )
    })

    it('still approves when the request carries nobody to notify', async () => {
        findRequestScoped.mockResolvedValue(membershipRequest({ payload: {} }))
        const res = buildRes()

        await approveRequest(adminReq(), res, jest.fn())

        expect(res.json.mock.calls[0][0].data).toEqual({ id: '11', status: 'APPROVED' })
        expect(createNotification).not.toHaveBeenCalled()
    })

    it('audits the approval against the employee', async () => {
        await approveRequest(adminReq(), buildRes(), jest.fn())

        expect(auditOf()).toEqual(
            expect.objectContaining({
                corporateId: 42,
                userId: '99',
                action: 'MEMBERSHIP_APPROVED',
                actorCredentialId: 5,
            })
        )
    })
})

describe('listing membership requests', () => {
    const listReq = (query = {}) => ({ user: { role: 'CORPORATE', corporateId: 42, id: 5 }, query, params: {} })
    const payloadOf = (res) => res.json.mock.calls[0][0].data.rows[0]

    beforeEach(() => {
        parsePaging.mockReturnValue({ limit: 10, offset: 0 })
    })

    it('names the requester from the directory when it answers', async () => {
        findAndCountForQueue.mockResolvedValue({
            count: 1,
            rows: [membershipRequest({ cardholder: { name: 'Ananya Das', email: 'ananya@example.com' } })],
        })
        const res = buildRes()

        await listRequests(listReq({ requestType: 'MEMBERSHIP' }), res)

        expect(payloadOf(res)).toMatchObject({ member: 'Ananya Das', memberEmail: 'ananya@example.com' })
    })

    // attachCardholders swallows a directory failure into a null cardholder, which rendered the queue's
    // Employee column as "-". A membership request captured the requester when it was raised.
    it('falls back to the name captured on the request when the directory answers nothing', async () => {
        findAndCountForQueue.mockResolvedValue({
            count: 1,
            rows: [membershipRequest({
                payload: { cardholderName: 'Ananya Das', cardholderUsername: 'ananya@example.com' },
            })],
        })
        const res = buildRes()

        await listRequests(listReq({ requestType: 'MEMBERSHIP' }), res)

        expect(payloadOf(res)).toMatchObject({ member: 'Ananya Das', memberEmail: 'ananya@example.com' })
    })

    it('answers null rather than a placeholder when neither source has a name', async () => {
        findAndCountForQueue.mockResolvedValue({ count: 1, rows: [membershipRequest({ payload: {} })] })
        const res = buildRes()

        await listRequests(listReq({ requestType: 'MEMBERSHIP' }), res)

        expect(payloadOf(res)).toMatchObject({ member: null, memberEmail: null })
    })

    it('passes a status filter through to the query so a decided request can be excluded', async () => {
        findAndCountForQueue.mockResolvedValue({ count: 0, rows: [] })

        await listRequests(listReq({ requestType: 'MEMBERSHIP', status: 'PENDING' }), buildRes())

        expect(findAndCountForQueue).toHaveBeenCalledWith(
            expect.objectContaining({ requestType: 'MEMBERSHIP', status: 'PENDING' })
        )
    })
})
