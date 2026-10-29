jest.mock('../../../models/use-cases/accountClosureRequest', () => ({
    findAndCount: jest.fn(),
    findById: jest.fn(),
    updateById: jest.fn(),
    decideFromPendingCAS: jest.fn(),
}))
jest.mock('../../../services/accountClosure', () => ({ applyApprovedClosure: jest.fn() }))
jest.mock('../../../utils/sharedDirectory', () => ({ getCorporatesByIds: jest.fn() }))
jest.mock('../../../utils/cardHelpers', () => ({
    parsePaging: jest.fn(() => ({ limit: 10, offset: 0 })),
    safeAudit: jest.fn(),
}))

const closureUC = require('../../../models/use-cases/accountClosureRequest')
const { applyApprovedClosure } = require('../../../services/accountClosure')
const { getCorporatesByIds } = require('../../../utils/sharedDirectory')
const { safeAudit } = require('../../../utils/cardHelpers')
const {
    listAccountClosureRequests,
    approveAccountClosure,
    rejectAccountClosure,
} = require('../accountClosure')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const payload = (res) => res.json.mock.calls[0][0].data
const adminReq = (over = {}) => ({
    user: { id: 7, name: 'Ops Reviewer' },
    params: { id: '9' },
    query: {},
    body: {},
    ...over,
})

const PENDING = { id: 9, corporateId: 42, status: 'PENDING', reason: 'NOT_USING', createdAt: 'x' }

beforeEach(() => {
    jest.clearAllMocks()
    closureUC.findAndCount.mockResolvedValue({ count: 0, rows: [] })
    closureUC.findById.mockResolvedValue(PENDING)
    closureUC.decideFromPendingCAS.mockResolvedValue(1)
    closureUC.updateById.mockResolvedValue(undefined)
    applyApprovedClosure.mockResolvedValue({ cards: { requested: 1, frozen: 1, failed: 0 }, kybReset: true })
    getCorporatesByIds.mockResolvedValue(new Map([['42', { companyName: 'Acme Ltd', email: 'ops@acme.test' }]]))
})

describe('listAccountClosureRequests', () => {
    it('returns every status when the client asks for no particular one', async () => {
        await listAccountClosureRequests(adminReq(), buildRes(), jest.fn())

        expect(closureUC.findAndCount).toHaveBeenCalledWith(
            expect.objectContaining({ status: undefined })
        )
    })

    it('treats an empty status the same as asking for all of them', async () => {
        await listAccountClosureRequests(adminReq({ query: { status: '  ' } }), buildRes(), jest.fn())

        expect(closureUC.findAndCount).toHaveBeenCalledWith(
            expect.objectContaining({ status: undefined })
        )
    })

    it('narrows to a single status when one is given', async () => {
        await listAccountClosureRequests(
            adminReq({ query: { status: 'approved' } }),
            buildRes(),
            jest.fn()
        )

        expect(closureUC.findAndCount).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'APPROVED' })
        )
    })

    it('refuses a status filter that is not a closure status', async () => {
        const next = jest.fn()
        await listAccountClosureRequests(adminReq({ query: { status: 'BANANA' } }), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        expect(closureUC.findAndCount).not.toHaveBeenCalled()
    })

    it('resolves the company name so the reviewer sees who is leaving', async () => {
        closureUC.findAndCount.mockResolvedValue({ count: 1, rows: [PENDING] })
        const res = buildRes()

        await listAccountClosureRequests(adminReq(), res, jest.fn())

        expect(payload(res).rows[0]).toMatchObject({
            id: '9',
            companyName: 'Acme Ltd',
            reasonLabel: 'We are no longer using Peko',
        })
    })

    it('still lists the request when the directory lookup returns nothing', async () => {
        closureUC.findAndCount.mockResolvedValue({ count: 1, rows: [PENDING] })
        getCorporatesByIds.mockResolvedValue(new Map())
        const res = buildRes()

        await listAccountClosureRequests(adminReq(), res, jest.fn())

        expect(payload(res).rows[0].companyName).toBeNull()
    })
})

describe('approveAccountClosure', () => {
    it('records the decision and applies the closure', async () => {
        const res = buildRes()
        await approveAccountClosure(adminReq({ body: { decisionNote: 'Confirmed by phone' } }), res, jest.fn())

        expect(closureUC.decideFromPendingCAS).toHaveBeenCalledWith('9', expect.objectContaining({
            status: 'APPROVED',
            decidedByCredentialId: 7,
            decisionNote: 'Confirmed by phone',
        }))
        expect(applyApprovedClosure).toHaveBeenCalledWith(expect.objectContaining({ corporateId: 42 }))
        expect(payload(res).status).toBe('APPROVED')
    })

    it('404s for a request that does not exist', async () => {
        closureUC.findById.mockResolvedValue(null)
        const next = jest.fn()

        await approveAccountClosure(adminReq(), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }))
        expect(applyApprovedClosure).not.toHaveBeenCalled()
    })

    it('409s for a request that was already decided', async () => {
        closureUC.findById.mockResolvedValue({ ...PENDING, status: 'APPROVED' })
        const next = jest.fn()

        await approveAccountClosure(adminReq(), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409 }))
        expect(applyApprovedClosure).not.toHaveBeenCalled()
    })

    // Two reviewers clicking at once must not both freeze the cards and reset the KYB.
    it('does not apply the closure when the compare-and-set loses the race', async () => {
        closureUC.decideFromPendingCAS.mockResolvedValue(0)
        const next = jest.fn()

        await approveAccountClosure(adminReq(), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409 }))
        expect(applyApprovedClosure).not.toHaveBeenCalled()
    })

    // The decision is already committed, so a failure to apply must be recorded, not swallowed.
    it('records what went wrong when the closure cannot be applied', async () => {
        applyApprovedClosure.mockRejectedValue(new Error('vendor down'))
        const res = buildRes()

        await approveAccountClosure(adminReq(), res, jest.fn())

        expect(closureUC.updateById).toHaveBeenCalledWith('9', expect.objectContaining({
            appliedResult: { error: 'vendor down' },
        }))
        expect(payload(res).applied).toEqual({ error: 'vendor down' })
    })

    it('stores what the closure actually did', async () => {
        await approveAccountClosure(adminReq(), buildRes(), jest.fn())

        expect(closureUC.updateById).toHaveBeenCalledWith('9', expect.objectContaining({
            appliedResult: expect.objectContaining({ kybReset: true }),
        }))
    })

    it('audits the approval against the corporate', async () => {
        await approveAccountClosure(adminReq(), buildRes(), jest.fn())

        expect(safeAudit).toHaveBeenCalledWith(undefined, expect.objectContaining({
            corporateId: 42,
            action: 'ACCOUNT_CLOSURE_APPROVED',
            actorCredentialId: 7,
        }))
    })

    it('rejects an over-long decision note', async () => {
        const next = jest.fn()
        await approveAccountClosure(adminReq({ body: { decisionNote: 'x'.repeat(1001) } }), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        expect(closureUC.decideFromPendingCAS).not.toHaveBeenCalled()
    })

    it('rejects a decision note shorter than the minimum', async () => {
        const next = jest.fn()
        await approveAccountClosure(adminReq({ body: { decisionNote: 'too short' } }), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        expect(closureUC.decideFromPendingCAS).not.toHaveBeenCalled()
    })

    it('measures the note after trimming, so padding cannot pad it out', async () => {
        const next = jest.fn()
        await approveAccountClosure(
            adminReq({ body: { decisionNote: `   ${'a'.repeat(9)}   ` } }),
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        expect(closureUC.decideFromPendingCAS).not.toHaveBeenCalled()
    })

    it('still allows a decision with no note at all', async () => {
        await approveAccountClosure(adminReq(), buildRes(), jest.fn())

        expect(closureUC.decideFromPendingCAS).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ decisionNote: null })
        )
    })
})

describe('rejectAccountClosure', () => {
    it('records the rejection and leaves the corporate untouched', async () => {
        const res = buildRes()
        await rejectAccountClosure(adminReq({ body: { decisionNote: 'Spoke to the CFO' } }), res, jest.fn())

        expect(closureUC.decideFromPendingCAS).toHaveBeenCalledWith('9', expect.objectContaining({
            status: 'REJECTED',
            decisionNote: 'Spoke to the CFO',
        }))
        expect(applyApprovedClosure).not.toHaveBeenCalled()
        expect(payload(res).status).toBe('REJECTED')
    })

    it('409s when the request was already decided', async () => {
        closureUC.decideFromPendingCAS.mockResolvedValue(0)
        const next = jest.fn()

        await rejectAccountClosure(adminReq(), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409 }))
    })
})
