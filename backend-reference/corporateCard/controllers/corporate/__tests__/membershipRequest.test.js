jest.mock('../../../models/use-cases/corporateCardAdminApplication', () => ({ findByCorporate: jest.fn() }))
jest.mock('../../../models/use-cases/cardRequest', () => ({
    createRequest: jest.fn(),
    findActiveByTarget: jest.fn(),
    findByRequester: jest.fn(),
    resolveByCardholder: jest.fn(),
}))
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../../utils/sharedDirectory', () => ({ getSelfCorporate: jest.fn(), findCardholderById: jest.fn() }))
jest.mock('../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }))

const { findByCorporate } = require('../../../models/use-cases/corporateCardAdminApplication')
const { createRequest, findActiveByTarget, findByRequester, resolveByCardholder } = require('../../../models/use-cases/cardRequest')
const { getSelfCorporate, findCardholderById } = require('../../../utils/sharedDirectory')
const { createNotification } = require('../../../models/use-cases/notification')
const { getKybState, getMyMembershipRequest, createMembershipRequest } = require('../membershipRequest')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const payload = (res) => res.json.mock.calls[0][0].data
const errorOf = (next) => next.mock.calls[0][0]

const employeeReq = (overrides = {}) => ({
    user: {
        id: 11,
        role: 'USER',
        corporateId: 42,
        employeeProfileId: 77,
        serviceMemberships: [{ label: 'Payroll', hasAccess: true, status: 'ACTIVE' }],
        ...overrides,
    },
    body: {},
    LogTraceId: 't',
})

beforeEach(() => {
    jest.clearAllMocks()
    findByCorporate.mockResolvedValue({ kybStatus: 'COMPLETED' })
    findActiveByTarget.mockResolvedValue(null)
    findByRequester.mockResolvedValue({ count: 0, rows: [] })
    createRequest.mockResolvedValue({ id: 5, status: 'PENDING', createdAt: '2026-10-14T06:00:00.000Z' })
    getSelfCorporate.mockResolvedValue({ credential: { username: 'admin@example.com' } })
    findCardholderById.mockResolvedValue({ id: 77, status: 'ACTIVE', role: 'Employee' })
    resolveByCardholder.mockResolvedValue(1)
    createNotification.mockResolvedValue(undefined)
})

describe('getKybState', () => {
    it('reports availability only when KYB is COMPLETED', async () => {
        const res = buildRes()
        await getKybState(employeeReq(), res, jest.fn())
        expect(payload(res)).toEqual({ kybComplete: true })
    })

    it.each(['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'])(
        'treats %s as not available',
        async (kybStatus) => {
            findByCorporate.mockResolvedValue({ kybStatus })
            const res = buildRes()
            await getKybState(employeeReq(), res, jest.fn())
            expect(payload(res)).toEqual({ kybComplete: false })
        }
    )

    it('treats a corporate with no application at all as not available', async () => {
        findByCorporate.mockResolvedValue(null)
        const res = buildRes()
        await getKybState(employeeReq(), res, jest.fn())
        expect(payload(res)).toEqual({ kybComplete: false })
    })
})

describe('createMembershipRequest', () => {
    it('opens a request for an employee of a KYB-complete corporate', async () => {
        const res = buildRes()
        await createMembershipRequest(employeeReq(), res, jest.fn())

        expect(createRequest).toHaveBeenCalledWith(expect.objectContaining({
            corporateId: 42,
            userId: 77,
            requestType: 'MEMBERSHIP',
            status: 'PENDING',
        }))
        expect(payload(res).request).toEqual(expect.objectContaining({ status: 'PENDING', requestId: 'CCA-00000005' }))
    })

    it('captures who to notify on the decision, since the deciding session is the admin\'s', async () => {
        const res = buildRes()
        await createMembershipRequest(employeeReq({ username: 'rakshita@example.com', employeeName: 'Rakshita' }), res, jest.fn())

        expect(createRequest.mock.calls[0][0].payload).toEqual(
            expect.objectContaining({ cardholderUsername: 'rakshita@example.com', cardholderName: 'Rakshita' })
        )
    })

    it('tells the corporate admin a request is waiting', async () => {
        await createMembershipRequest(employeeReq({ employeeName: 'Rakshita' }), buildRes(), jest.fn())

        expect(createNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                notificationCategory: 'CARD_ACCESS_REQUEST',
                notificationTo: 'admin@example.com',
                notificationBy: 'CARDHOLDER',
            }),
            expect.anything()
        )
    })

    it('still records the request when the admin cannot be resolved to notify', async () => {
        getSelfCorporate.mockResolvedValue(null)
        const res = buildRes()

        await createMembershipRequest(employeeReq(), res, jest.fn())

        expect(createRequest).toHaveBeenCalled()
        expect(payload(res).request).toEqual(expect.objectContaining({ status: 'PENDING' }))
        expect(createNotification).not.toHaveBeenCalled()
    })

    it('refuses someone who already holds Corporate Cards', async () => {
        const next = jest.fn()
        await createMembershipRequest(
            employeeReq({ serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, status: 'ACTIVE' }] }),
            buildRes(),
            next
        )
        expect(errorOf(next).status_code).toBe(409)
        expect(createRequest).not.toHaveBeenCalled()
    })

    it('refuses when the corporate has not completed KYB', async () => {
        findByCorporate.mockResolvedValue({ kybStatus: 'UNDER_REVIEW' })
        const next = jest.fn()
        await createMembershipRequest(employeeReq(), buildRes(), next)

        expect(errorOf(next).status_code).toBe(403)
        expect(createRequest).not.toHaveBeenCalled()
    })

    it('refuses a second open request', async () => {
        findActiveByTarget.mockResolvedValue({ id: 4 })
        const next = jest.fn()
        await createMembershipRequest(employeeReq(), buildRes(), next)

        expect(errorOf(next).status_code).toBe(409)
        expect(createRequest).not.toHaveBeenCalled()
    })

    it('turns the unique-index race into the same 409', async () => {
        createRequest.mockRejectedValue(Object.assign(new Error('dup'), { name: 'SequelizeUniqueConstraintError' }))
        const next = jest.fn()
        await createMembershipRequest(employeeReq(), buildRes(), next)

        expect(errorOf(next).status_code).toBe(409)
    })

    it('refuses a corporate session', async () => {
        const next = jest.fn()
        await createMembershipRequest(
            { user: { id: 11, role: 'CORPORATE', corporateId: 42 }, body: {} },
            buildRes(),
            next
        )
        expect(errorOf(next).status_code).toBe(403)
    })

    it('refuses a session carrying no employee identity', async () => {
        const next = jest.fn()
        await createMembershipRequest(employeeReq({ employeeProfileId: null }), buildRes(), next)
        expect(errorOf(next).status_code).toBe(400)
    })
})

describe('getMyMembershipRequest', () => {
    it('returns null before anything has been requested', async () => {
        const res = buildRes()
        await getMyMembershipRequest(employeeReq(), res, jest.fn())
        expect(payload(res)).toEqual({ request: null })
    })

    it('returns only the caller\'s own latest request', async () => {
        findByRequester.mockResolvedValue({
            count: 1,
            rows: [{ id: 9, status: 'REJECTED', createdAt: '2026-10-14T06:00:00.000Z', decidedAt: '2026-10-14T07:00:00.000Z', decisionNote: 'Not now' }],
        })
        const res = buildRes()
        await getMyMembershipRequest(employeeReq(), res, jest.fn())

        expect(findByRequester).toHaveBeenCalledWith(expect.objectContaining({
            cardholder: { userId: 77 },
            requestType: 'MEMBERSHIP',
            limit: 1,
        }))
        expect(payload(res).request).toEqual(expect.objectContaining({ status: 'REJECTED', decisionNote: 'Not now' }))
    })

    const approvedRow = (overrides = {}) => ({
        count: 1,
        rows: [{
            id: 201,
            status: 'APPROVED',
            createdAt: '2026-10-16T09:42:36.000Z',
            decidedAt: '2026-10-16T09:47:55.000Z',
            decisionNote: null,
            ...overrides,
        }],
    })

    describe('a requester who has since been removed from members', () => {
        it('serves the approved request while they are still a member', async () => {
            findByRequester.mockResolvedValue(approvedRow())
            const res = buildRes()

            await getMyMembershipRequest(employeeReq(), res, jest.fn())

            expect(payload(res).request).toEqual(expect.objectContaining({ status: 'APPROVED' }))
            expect(resolveByCardholder).not.toHaveBeenCalled()
        })

        it('serves it for a member the directory does not know yet, the just-approved session', async () => {
            findByRequester.mockResolvedValue(approvedRow())
            findCardholderById.mockResolvedValue(null)
            const res = buildRes()

            await getMyMembershipRequest(employeeReq(), res, jest.fn())

            expect(payload(res).request).toEqual(expect.objectContaining({ status: 'APPROVED' }))
            expect(resolveByCardholder).not.toHaveBeenCalled()
        })

        it('reports no request once their membership reads INACTIVE', async () => {
            findByRequester.mockResolvedValue(approvedRow())
            findCardholderById.mockResolvedValue({ id: 77, status: 'INACTIVE', role: 'Employee' })
            const res = buildRes()

            await getMyMembershipRequest(employeeReq(), res, jest.fn())

            expect(payload(res)).toEqual({ request: null })
        })

        it('cancels the stale approval so it is gone on the next read too', async () => {
            findByRequester.mockResolvedValue(approvedRow())
            findCardholderById.mockResolvedValue({ id: 77, status: 'INACTIVE' })

            await getMyMembershipRequest(employeeReq(), buildRes(), jest.fn())

            expect(resolveByCardholder).toHaveBeenCalledWith(expect.objectContaining({
                corporateId: 42,
                cardholder: { userId: 77 },
                requestType: 'MEMBERSHIP',
                statuses: ['APPROVED'],
                fields: expect.objectContaining({
                    status: 'CANCELLED',
                    decisionNote: 'Member removed from the corporate',
                }),
            }))
        })

        it('leaves a fresh PENDING request alone, because a removed entry stays INACTIVE until re-approval', async () => {
            findByRequester.mockResolvedValue(approvedRow({ status: 'PENDING', decidedAt: null }))
            findCardholderById.mockResolvedValue({ id: 77, status: 'INACTIVE' })
            const res = buildRes()

            await getMyMembershipRequest(employeeReq(), res, jest.fn())

            expect(payload(res).request).toEqual(expect.objectContaining({ status: 'PENDING' }))
            expect(resolveByCardholder).not.toHaveBeenCalled()
        })

        it('serves a fresh approval after the member was re-approved, not a cached revocation', async () => {
            findByRequester.mockResolvedValue(approvedRow({ id: 205 }))
            findCardholderById.mockResolvedValue({ id: 77, status: 'ACTIVE', role: 'Employee' })
            const res = buildRes()

            await getMyMembershipRequest(employeeReq(), res, jest.fn())

            expect(payload(res).request).toEqual(expect.objectContaining({ status: 'APPROVED' }))
            expect(resolveByCardholder).not.toHaveBeenCalled()
        })

        it('reads the membership live, because a cached one goes stale the moment they are re-approved', async () => {
            findByRequester.mockResolvedValue(approvedRow())

            await getMyMembershipRequest(employeeReq(), buildRes(), jest.fn())

            expect(findCardholderById).toHaveBeenCalledWith(77, expect.anything(), { bypassCache: true })
        })

        it('serves the request as stored when the directory cannot be reached', async () => {
            findByRequester.mockResolvedValue(approvedRow())
            findCardholderById.mockRejectedValue(new Error('others down'))
            const res = buildRes()
            const next = jest.fn()

            await getMyMembershipRequest(employeeReq(), res, next)

            expect(next).not.toHaveBeenCalled()
            expect(payload(res).request).toEqual(expect.objectContaining({ status: 'APPROVED' }))
            expect(resolveByCardholder).not.toHaveBeenCalled()
        })
    })
})
