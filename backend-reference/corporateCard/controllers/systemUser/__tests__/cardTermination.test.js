const { listTerminationRequests, completeTermination } = require('../cardTermination')
const { findAndCountForQueue, findByIdUnscoped, decideFromPendingCAS } = require('../../../models/use-cases/cardRequest')
const { getCorporatesByIds } = require('../../../utils/sharedDirectory')
const { email: sendEmail } = require('../../../utils/emailer')

jest.mock('../../../models/use-cases/cardRequest', () => ({
    findAndCountForQueue: jest.fn(),
    findByIdUnscoped: jest.fn(),
    decideFromPendingCAS: jest.fn(),
}))
jest.mock('../../../utils/sharedDirectory', () => ({ getCorporatesByIds: jest.fn() }))
jest.mock('../../../utils/emailer', () => ({ email: jest.fn() }))
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../../utils/cardHelpers', () => ({
    parsePaging: jest.fn(() => ({ limit: 10, offset: 0 })),
    safeAudit: jest.fn(),
    last4: jest.fn((masked) => (masked ? String(masked).slice(-4) : null)),
    attachCardholders: jest.fn((rows) => { rows.forEach((r) => { r.cardholder = null }); return rows }),
}))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const sysUserReq = (overrides = {}) => ({
    user: { role: 'SYSTEM_USER', id: 9, name: 'Ops Admin' },
    query: {},
    params: {},
    ...overrides,
})

beforeEach(() => {
    jest.clearAllMocks()
    getCorporatesByIds.mockResolvedValue(new Map([['42', { id: 42, companyName: 'Steel & Co', email: 'ops@steel.co' }]]))
})

describe('listTerminationRequests', () => {
    it('defaults to PENDING ("Requested") and queries cross-corporate (no corporateId)', async () => {
        findAndCountForQueue.mockResolvedValue({
            count: 1,
            rows: [{ id: 1, corporateId: 42, userId: 99, cardIssuanceId: 5, reason: 'lost', createdAt: 't', status: 'PENDING', card: { maskedCardNumber: '1234 56** **** 7890' } }],
        })

        const res = buildRes()
        await listTerminationRequests(sysUserReq(), res, jest.fn())

        expect(findAndCountForQueue).toHaveBeenCalledWith(expect.objectContaining({ requestType: 'TERMINATE', status: 'PENDING' }))
        expect(findAndCountForQueue.mock.calls[0][0]).not.toHaveProperty('corporateId')
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: { count: 1, rows: [expect.objectContaining({ id: 1, companyName: 'Steel & Co', cardLast4: '7890', status: 'PENDING' })] },
        }))
    })

    it('rejects an unrecognised status filter', async () => {
        const next = jest.fn()
        await listTerminationRequests(sysUserReq({ query: { status: 'REJECTED' } }), buildRes(), next)
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        expect(findAndCountForQueue).not.toHaveBeenCalled()
    })
})

describe('completeTermination', () => {
    const pendingRequest = {
        id: 1,
        corporateId: 42,
        userId: 99,
        cardIssuanceId: 5,
        requestType: 'TERMINATE',
        status: 'PENDING',
        result: { frozen: true },
        card: { maskedCardNumber: '1234 56** **** 7890' },
    }

    it('404s when the request does not exist or is not a TERMINATE request', async () => {
        findByIdUnscoped.mockResolvedValue(null)
        const next = jest.fn()
        await completeTermination(sysUserReq({ params: { id: '1' } }), buildRes(), next)
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }))
        expect(decideFromPendingCAS).not.toHaveBeenCalled()
    })

    it('409s when the request is already decided', async () => {
        findByIdUnscoped.mockResolvedValue({ ...pendingRequest, status: 'APPROVED' })
        const next = jest.fn()
        await completeTermination(sysUserReq({ params: { id: '1' } }), buildRes(), next)
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409 }))
        expect(decideFromPendingCAS).not.toHaveBeenCalled()
    })

    it('409s when a concurrent completion already won the CAS race', async () => {
        findByIdUnscoped.mockResolvedValue(pendingRequest)
        decideFromPendingCAS.mockResolvedValue(0)
        const next = jest.fn()
        await completeTermination(sysUserReq({ params: { id: '1' } }), buildRes(), next)
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409 }))
    })

    it('marks the request APPROVED, audits, and emails the corporate — without touching cardIssuance', async () => {
        findByIdUnscoped.mockResolvedValue(pendingRequest)
        decideFromPendingCAS.mockResolvedValue(1)
        const res = buildRes()

        await completeTermination(sysUserReq({ params: { id: '1' } }), res, jest.fn())

        expect(decideFromPendingCAS).toHaveBeenCalledWith('1', expect.objectContaining({
            status: 'APPROVED',
            decidedByCredentialId: 9,
            result: expect.objectContaining({ frozen: true, terminated: true }),
        }))
        expect(sendEmail).toHaveBeenCalledWith(undefined, 'ops@steel.co', expect.any(String), expect.any(String))
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: true,
            data: { requestId: 1, status: 'APPROVED' },
        }))
    })

    it('never fails the response when the corporate email lookup fails (best-effort)', async () => {
        findByIdUnscoped.mockResolvedValue(pendingRequest)
        decideFromPendingCAS.mockResolvedValue(1)
        getCorporatesByIds.mockRejectedValue(new Error('directory unreachable'))
        const res = buildRes()

        await completeTermination(sysUserReq({ params: { id: '1' } }), res, jest.fn())

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: true }))
    })
})
