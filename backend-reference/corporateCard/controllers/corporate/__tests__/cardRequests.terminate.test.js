const { terminateCard } = require('../cardRequests')
const { findByIdScoped, updateCardStateById } = require('../../../models/use-cases/cardIssuance')
const { findActiveByTarget, createRequest, hasBlockingTermination, resolveActiveByCards } = require('../../../models/use-cases/cardRequest')
const { resolvePinelabsCredsForRequest } = require('../../../utils/pinelabsGateway')
const { safeAudit } = require('../../../utils/cardHelpers')
const emailer = require('../../../utils/emailer')

jest.mock('../../../configs/database/index', () => ({
    transaction: jest.fn((cb) => cb({})),
}))
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
jest.mock('../pinelabsCardIssuance', () => ({ issueCardCore: jest.fn() }))
jest.mock('../../../utils/serializeCard', () => ({ serializeCard: jest.fn() }))
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
    cardholderColumnsOf: jest.fn((row) => ({ userId: row?.userId ?? null })),
    cardholderColumnsForSession: jest.fn((req) => ({ userId: req?.user?.employeeProfileId ?? null })),
    parsePaging: jest.fn(),
    toNum: jest.fn((v) => Number(v)),
    round2: jest.fn((v) => v),
    fmt: jest.fn((v) => String(v)),
    last4: jest.fn((masked) => (masked ? String(masked).slice(-4) : null)),
    adminActor: jest.fn(() => 'Admin'),
    cardholderActor: jest.fn(() => 'Cardholder'),
    safeAudit: jest.fn(),
    MOBILE_REGEX: /.*/,
    attachCardholders: jest.fn((rows) => rows),
    escapeHtml: jest.fn((v) =>
        v === null || v === undefined
            ? ''
            : String(v)
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;')
    ),
}))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const adminReq = (overrides = {}) => ({
    user: { role: 'CORPORATE', corporateId: 42, id: 5 },
    body: { cardIssuanceId: 1 },
    ...overrides,
})

const issuedCard = (overrides = {}) => ({
    id: 1,
    corporateId: 42,
    userId: '99',
    status: 'ISSUED',
    cardState: 'ACTIVE',
    maskedCardNumber: '1234 56** **** 7890',
    ...overrides,
})

describe('terminateCard', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findByIdScoped.mockResolvedValue(issuedCard())
        findActiveByTarget.mockResolvedValue(null)
        hasBlockingTermination.mockResolvedValue(false)
        createRequest.mockResolvedValue({ id: 7, result: {} })
        updateCardStateById.mockResolvedValue()
        resolvePinelabsCredsForRequest.mockResolvedValue({ error: 'unreachable' })
    })

    it('409s a duplicate in-flight request (existing behavior, unchanged)', async () => {
        findActiveByTarget.mockResolvedValue({ id: 3 })
        const next = jest.fn()

        await terminateCard(adminReq(), buildRes(), next)

        expect(createRequest).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409 }))
    })

    it('409s re-terminating a card that already has a completed termination', async () => {
        hasBlockingTermination.mockResolvedValue(true)
        const next = jest.fn()

        await terminateCard(adminReq(), buildRes(), next)

        expect(hasBlockingTermination).toHaveBeenCalledWith(1)
        expect(createRequest).not.toHaveBeenCalled()
        expect(updateCardStateById).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            status_code: 409,
            message: expect.stringContaining('already been terminated'),
        }))
    })

    it('freezes the card and records a PENDING TERMINATE request when neither guard trips', async () => {
        const res = buildRes()

        await terminateCard(adminReq(), res, jest.fn())

        expect(createRequest).toHaveBeenCalledWith(expect.objectContaining({ requestType: 'TERMINATE', status: 'PENDING' }), expect.anything())
        expect(updateCardStateById).toHaveBeenCalledWith(
            1,
            expect.objectContaining({ cardState: 'FROZEN', frozenByRole: 'SYSTEM' }),
            expect.anything()
        )
        expect(resolveActiveByCards).toHaveBeenCalledWith(
            expect.objectContaining({
                cardIssuanceIds: [1],
                requestType: 'UNFREEZE',
                fields: expect.objectContaining({ status: 'REJECTED', decisionNote: 'Card termination requested' }),
                statuses: ['PENDING'],
            }),
            expect.anything()
        )
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: true, data: expect.objectContaining({ requestId: 7 }) }))
    })

    describe('termination reason', () => {
        const withReason = (reason) => adminReq({ body: { cardIssuanceId: 1, reason } })

        it('persists the reason on the request row', async () => {
            await terminateCard(withReason('Employee exited: Left mid-cycle'), buildRes(), jest.fn())

            expect(createRequest).toHaveBeenCalledWith(
                expect.objectContaining({ reason: 'Employee exited: Left mid-cycle' }),
                expect.anything()
            )
        })

        it('writes the reason into the audit description, not only metadata', async () => {
            await terminateCard(withReason('Card stolen'), buildRes(), jest.fn())

            const audit = safeAudit.mock.calls[0][1]
            expect(audit.description).toContain('Card stolen')
            expect(audit.metadata).toEqual(expect.objectContaining({ reason: 'Card stolen' }))
        })

        it('omits the reason clause entirely when none is supplied', async () => {
            await terminateCard(adminReq(), buildRes(), jest.fn())

            const audit = safeAudit.mock.calls[0][1]
            expect(audit.description).not.toContain('reason:')
            expect(createRequest).toHaveBeenCalledWith(
                expect.objectContaining({ reason: null }),
                expect.anything()
            )
        })

        it('trims and caps the reason at 500 characters', async () => {
            await terminateCard(withReason(`  ${'x'.repeat(600)}  `), buildRes(), jest.fn())

            const { reason } = createRequest.mock.calls[0][0]
            expect(reason).toHaveLength(500)
            expect(reason.startsWith(' ')).toBe(false)
        })

        it('emails the reason to the vendor address, HTML-escaped', async () => {
            resolvePinelabsCredsForRequest.mockResolvedValue({
                serviceDetails: { vendor: { vendorEmail: ['ops@vendor.test'] } },
            })

            await terminateCard(withReason('Others: <b>fraud</b>'), buildRes(), jest.fn())

            expect(emailer.email).toHaveBeenCalledTimes(1)
            const [, to, subject, body] = emailer.email.mock.calls[0]
            expect(to).toEqual(['ops@vendor.test'])
            expect(subject).toBe('Card termination requested')
            expect(body).toContain('Others: &lt;b&gt;fraud&lt;/b&gt;')
            expect(body).not.toContain('<b>fraud</b>')
        })
    })
})
