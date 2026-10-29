const { createCardRequest, approveRequest, rejectRequest } = require('../cardRequests')
const {
    createRequest, findActiveByTarget, findByIdScoped: findRequestScoped,
    decideFromPendingCAS, finalizeFromProcessingCAS, hasBlockingTermination,
} = require('../../../models/use-cases/cardRequest')
const { findByIdScoped: findCardScoped } = require('../../../models/use-cases/cardIssuance')
const { findCardUserScoped } = require('../../../models/use-cases/cardUser')
const { applyCardStateChange } = require('../cardState')
const { resolvePinelabsCredsForRequest } = require('../../../utils/pinelabsGateway')
const { safeAudit, cardholderActor, actorDisplay } = require('../../../utils/cardHelpers')
const { getSelfCorporate } = require('../../../utils/sharedDirectory')
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
jest.mock('../pinelabsCardIssuance', () => ({ issueCardCore: jest.fn() }))
jest.mock('../cardState', () => ({ applyCardStateChange: jest.fn() }))
jest.mock('../../../utils/serializeCard', () => ({ serializeCard: jest.fn() }))
jest.mock('../../../utils/pinelabsGateway', () => ({ resolvePinelabsCredsForRequest: jest.fn() }))
jest.mock('../../../utils/sharedDirectory', () => ({ searchCardUserIds: jest.fn(), getSelfCorporate: jest.fn() }))
jest.mock('../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }))
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
    attachCardholders: jest.fn(),
    isSubAdminSelfTarget: jest.fn(() => false),
    isProtectedOwnerTarget: jest.fn(async () => false),
    actorCredentialId: jest.fn((req) => req.user?.id ?? null),
    actorUsername: jest.fn((req) => req.user?.username ?? null),
    actorDisplay: jest.fn(() => 'Admin (Admin)'),
    escapeHtml: jest.fn((v) => v),
    isAdminFreeze: (card) => card?.cardState === 'FROZEN' && card?.frozenByRole !== 'CARDHOLDER',
    MOBILE_REGEX: /^\d{10}$/,
}))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const holderReq = (body = {}) => ({
    user: { role: 'USER', corporateId: 42, id: 7, username: 'PEKO7', employeeProfileId: '99', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] },
    body: { requestType: 'UNFREEZE', cardIssuanceId: '1', ...body },
})

const adminReq = (body = {}) => ({
    user: { role: 'CORPORATE', corporateId: 42, id: 5 },
    params: { id: '11' },
    body,
})

const frozenCard = (overrides = {}) => ({
    id: 1,
    userId: '99',
    status: 'ISSUED',
    cardState: 'FROZEN',
    frozenByRole: 'ADMIN',
    freezeReason: 2,
    freezeReasonNote: null,
    stateUpdatedAt: new Date('2026-07-01T00:00:00Z'),
    cardType: 'Virtual',
    referenceNumber: 'REF-1',
    maskedCardNumber: '1234 56** **** 7890',
    ...overrides,
})

const pendingRequest = (overrides = {}) => ({
    id: 11,
    corporateId: 42,
    userId: '99',
    cardIssuanceId: 1,
    requestType: 'UNFREEZE',
    status: 'PENDING',
    ...overrides,
})

describe('UNFREEZE request', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findCardScoped.mockResolvedValue(frozenCard())
        findActiveByTarget.mockResolvedValue(null)
        createRequest.mockResolvedValue({ id: 11 })
        hasBlockingTermination.mockResolvedValue(false)
        findCardUserScoped.mockResolvedValue({ id: 99, name: 'Alice' })
        resolvePinelabsCredsForRequest.mockResolvedValue({ creds: { token: 't' } })
        decideFromPendingCAS.mockResolvedValue(1)
        finalizeFromProcessingCAS.mockResolvedValue(1)
        applyCardStateChange.mockResolvedValue({ ok: true })
        safeAudit.mockResolvedValue()
        getSelfCorporate.mockResolvedValue({ credential: { username: 'corp-admin' } })
        createNotification.mockResolvedValue({})
    })

    describe('create', () => {
        it('400s without a card', async () => {
            const next = jest.fn()
            await createCardRequest({ ...holderReq(), body: { requestType: 'UNFREEZE' } }, buildRes(), next)
            expect(createRequest).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        })

        it("404s on another cardholder's card", async () => {
            findCardScoped.mockResolvedValue(frozenCard({ userId: '1000' }))
            const next = jest.fn()
            await createCardRequest(holderReq(), buildRes(), next)
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404, message: 'Card not found.' }))
        })

        it('400s when the card is not frozen', async () => {
            findCardScoped.mockResolvedValue(frozenCard({ cardState: 'ACTIVE', frozenByRole: null }))
            const next = jest.fn()
            await createCardRequest(holderReq(), buildRes(), next)
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400, message: 'This card is not frozen.' }))
        })

        it('400s when the cardholder froze the card themselves', async () => {
            findCardScoped.mockResolvedValue(frozenCard({ frozenByRole: 'CARDHOLDER' }))
            const next = jest.fn()
            await createCardRequest(holderReq(), buildRes(), next)
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                status_code: 400,
                message: expect.stringContaining('froze this card yourself'),
            }))
        })

        it('409s when a termination is in progress', async () => {
            hasBlockingTermination.mockResolvedValue(true)
            const next = jest.fn()
            await createCardRequest(holderReq(), buildRes(), next)
            expect(createRequest).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409 }))
        })

        it('409s on the soft duplicate pre-check', async () => {
            findActiveByTarget.mockResolvedValue({ id: 9 })
            const next = jest.fn()
            await createCardRequest(holderReq(), buildRes(), next)
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                status_code: 409,
                message: 'You already have a pending unfreeze request for this card.',
            }))
        })

        it('409s with the same message when the unique index rejects the insert', async () => {
            createRequest.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' })
            const next = jest.fn()
            await createCardRequest(holderReq(), buildRes(), next)
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                status_code: 409,
                message: 'You already have a pending unfreeze request for this card.',
            }))
        })

        it('creates the request with a snapshot of why the card was frozen', async () => {
            findCardScoped.mockResolvedValue(frozenCard({ freezeReason: 4, freezeReasonNote: 'Under review' }))
            const res = buildRes()

            await createCardRequest(holderReq({ reason: 'I need it for travel' }), res, jest.fn())

            expect(createRequest).toHaveBeenCalledWith(expect.objectContaining({
                requestType: 'UNFREEZE',
                status: 'PENDING',
                cardIssuanceId: '1',
                requestedByCredentialId: 7,
                reason: 'I need it for travel',
                payload: expect.objectContaining({
                    freezeReason: 4,
                    freezeReasonLabel: 'Others',
                    freezeReasonNote: 'Under review',
                    frozenByRole: 'ADMIN',
                }),
            }))
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: true }))
        })

        it('audits the request against the real card, so it shows on that card audit trail', async () => {
            await createCardRequest(holderReq(), buildRes(), jest.fn())
            expect(safeAudit).toHaveBeenCalledWith(undefined, expect.objectContaining({
                action: 'CARD_UNFREEZE_REQUESTED',
                category: 'Security',
                cardIssuanceId: '1',
            }))
        })

        it('notifies the corporate admin, not the requesting cardholder', async () => {
            const req = holderReq()
            await createCardRequest(req, buildRes(), jest.fn())

            expect(getSelfCorporate).toHaveBeenCalledWith(req)
            expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
                notificationCategory: 'UNFREEZE_REQUEST',
                notificationTo: 'corp-admin',
                notificationBy: 'CARDHOLDER',
            }), req)
        })

        /**
         * An admin with twenty cardholders cannot act on "a cardholder has submitted an unfreeze request" —
         * the notification has to say which card and who asked. The name itself is cardholderActor's job
         * and is tested there; what matters here is that the brief carries it.
         */
        it('names the card and the cardholder who asked', async () => {
            cardholderActor.mockReturnValue('Alice Smith (Cardholder)')

            await createCardRequest(holderReq(), buildRes(), jest.fn())

            expect(createNotification.mock.calls[0][0].notificationBrief).toBe(
                'Alice Smith (Cardholder) has requested an unfreeze for the card ending 7890.'
            )
        })

        it('stays readable when the card number is unknown', async () => {
            findCardScoped.mockResolvedValue(frozenCard({ maskedCardNumber: null }))

            await createCardRequest(holderReq(), buildRes(), jest.fn())

            const brief = createNotification.mock.calls[0][0].notificationBrief
            expect(brief).not.toContain('null')
            expect(brief).toContain('the card')
        })

        it('logs rather than throws when the corporate admin username cannot be resolved', async () => {
            getSelfCorporate.mockResolvedValue(null)
            const next = jest.fn()

            await createCardRequest(holderReq(), buildRes(), next)

            expect(next).not.toHaveBeenCalled()
            expect(createNotification).not.toHaveBeenCalled()
        })
    })

    describe('approve', () => {
        beforeEach(() => findRequestScoped.mockResolvedValue(pendingRequest()))

        it('validates BEFORE claiming, so a bad state never strands the row in PROCESSING', async () => {
            hasBlockingTermination.mockResolvedValue(true)
            const next = jest.fn()

            await approveRequest(adminReq(), buildRes(), next)

            expect(decideFromPendingCAS).not.toHaveBeenCalled()
            expect(applyCardStateChange).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409 }))
        })

        it('404s when the cardholder no longer exists in the corporate', async () => {
            findCardUserScoped.mockResolvedValue(null)
            const next = jest.fn()

            await approveRequest(adminReq(), buildRes(), next)

            expect(decideFromPendingCAS).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                status_code: 404,
                message: expect.stringContaining('may have been removed'),
            }))
        })

        it('409s when another admin already decided the request', async () => {
            decideFromPendingCAS.mockResolvedValue(0)
            const next = jest.fn()

            await approveRequest(adminReq(), buildRes(), next)

            expect(applyCardStateChange).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409 }))
        })

        it('unfreezes through the shared core as an admin, then finalises APPROVED', async () => {
            const res = buildRes()

            await approveRequest(adminReq({ note: 'ok' }), res, jest.fn())

            expect(decideFromPendingCAS).toHaveBeenCalledWith('11', expect.objectContaining({ status: 'PROCESSING' }))
            expect(applyCardStateChange).toHaveBeenCalledWith(expect.objectContaining({ freeze: false, isAdmin: true }))
            expect(finalizeFromProcessingCAS).toHaveBeenCalledWith('11', expect.objectContaining({
                status: 'APPROVED',
                result: { unfrozen: true, alreadyActive: false },
            }))
            expect(safeAudit).toHaveBeenCalledWith(undefined, expect.objectContaining({
                action: 'CARD_UNFREEZE_APPROVED',
                category: 'Security',
            }))
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: true }))
        })

        it('skips the vendor call when the card is already active', async () => {
            findCardScoped.mockResolvedValue(frozenCard({ cardState: 'ACTIVE', frozenByRole: null }))

            await approveRequest(adminReq(), buildRes(), jest.fn())

            expect(applyCardStateChange).not.toHaveBeenCalled()
            expect(finalizeFromProcessingCAS).toHaveBeenCalledWith('11', expect.objectContaining({
                status: 'APPROVED',
                result: { unfrozen: true, alreadyActive: true },
            }))
        })

        it('reverts to PENDING on a vendor failure so it stays actionable', async () => {
            applyCardStateChange.mockResolvedValue({ ok: false, statusCode: 502, message: 'Something went wrong' })
            const next = jest.fn()

            await approveRequest(adminReq(), buildRes(), next)

            expect(finalizeFromProcessingCAS).toHaveBeenCalledWith('11', expect.objectContaining({
                status: 'PENDING',
                decidedByCredentialId: null,
                decidedAt: null,
                decisionNote: null,
            }))
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 502 }))
        })

        it('closes the row REJECTED when a termination lands mid-unfreeze', async () => {
            applyCardStateChange.mockResolvedValue({
                ok: false, statusCode: 409, terminationLocked: true, message: 'termination request',
            })
            const next = jest.fn()

            await approveRequest(adminReq(), buildRes(), next)

            expect(finalizeFromProcessingCAS).toHaveBeenCalledWith('11', expect.objectContaining({
                status: 'REJECTED',
                decisionNote: 'Card termination requested',
            }))
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409 }))
        })
    })

    describe('reject', () => {
        it('audits a rejection as CARD_UNFREEZE_REJECTED under Security', async () => {
            findRequestScoped.mockResolvedValue(pendingRequest())
            decideFromPendingCAS.mockResolvedValue(1)

            await rejectRequest(adminReq({ note: 'not now' }), buildRes(), jest.fn())

            expect(safeAudit).toHaveBeenCalledWith(undefined, expect.objectContaining({
                action: 'CARD_UNFREEZE_REJECTED',
                category: 'Security',
            }))
        })

        /**
         * A cardholder with two cards cannot tell which one was refused, and "has been rejected" with no
         * decider reads as if the system did it. The request payload carries no card number, so the card is
         * read back from the issuance.
         */
        describe('the notification', () => {
            beforeEach(() => {
                findRequestScoped.mockResolvedValue(
                    pendingRequest({ payload: { cardholderUsername: 'alice' } })
                )
                actorDisplay.mockReturnValue('Priya Nair (Admin)')
            })

            it('names the card, the decider and the reason', async () => {
                await rejectRequest(adminReq({ note: 'Report it lost first' }), buildRes(), jest.fn())

                expect(createNotification).toHaveBeenCalledWith(
                    expect.objectContaining({
                        notificationCategory: 'UNFREEZE_REJECTED',
                        notificationTo: 'alice',
                        notificationBrief:
                            'Your unfreeze request for the card ending 7890 was rejected by Priya Nair (Admin): Report it lost first',
                    }),
                    expect.anything()
                )
            })

            it('still names the card and the decider with no reason given', async () => {
                await rejectRequest(adminReq(), buildRes(), jest.fn())

                expect(createNotification.mock.calls[0][0].notificationBrief).toBe(
                    'Your unfreeze request for the card ending 7890 was rejected by Priya Nair (Admin).'
                )
            })

            // Best-effort: losing the card row must not cost the cardholder the notice entirely.
            it('still notifies when the card cannot be read back', async () => {
                findCardScoped.mockResolvedValue(null)

                await rejectRequest(adminReq(), buildRes(), jest.fn())

                const brief = createNotification.mock.calls[0][0].notificationBrief
                expect(brief).not.toContain('null')
                expect(brief).toContain('Priya Nair (Admin)')
            })
        })
    })

    describe('approve notification', () => {
        beforeEach(() => {
            findRequestScoped.mockResolvedValue(
                pendingRequest({ status: 'PENDING', payload: { cardholderUsername: 'alice' } })
            )
            actorDisplay.mockReturnValue('Priya Nair (Admin)')
        })

        // It already named the card; who released it was missing.
        it('names the card and the admin who approved it', async () => {
            await approveRequest(adminReq(), buildRes(), jest.fn())

            expect(createNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    notificationCategory: 'UNFREEZE_APPROVED',
                    notificationTo: 'alice',
                    notificationBrief:
                        'Your unfreeze request for the card ending 7890 was approved by Priya Nair (Admin).',
                }),
                expect.anything()
            )
        })
    })
})
