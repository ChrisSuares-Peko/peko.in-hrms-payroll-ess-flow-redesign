const { freezeCard, unfreezeCard, bulkChangeCardState, freezeCardholderCards } = require('../cardState')
const { findByIdScoped, findCardsByScope, updateCardStateById } = require('../../../models/use-cases/cardIssuance')
const { hasBlockingTermination } = require('../../../models/use-cases/cardRequest')
const { pinelabsRequest, isPinelabsSuccess, resolvePinelabsCredsForRequest } = require('../../../utils/pinelabsGateway')
const { safeAudit } = require('../../../utils/cardHelpers')

jest.mock('../../../models/use-cases/cardIssuance', () => ({
    findByIdScoped: jest.fn(),
    findCardsByScope: jest.fn(),
    updateCardStateById: jest.fn(),
}))
jest.mock('../../../models/use-cases/cardRequest', () => ({
    hasBlockingTermination: jest.fn(),
    resolveActiveByCards: jest.fn(),
}))
jest.mock('../../../utils/pinelabsGateway', () => ({
    pinelabsRequest: jest.fn(),
    isPinelabsSuccess: jest.fn(),
    resolvePinelabsCredsForRequest: jest.fn(),
}))
jest.mock('../../../utils/cardHelpers', () => ({
    ...jest.requireActual('../../../utils/cardHelpers'),
    safeAudit: jest.fn(),
}))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const adminReq = (body = {}) => ({
    user: { role: 'CORPORATE', corporateId: 42, id: 5 },
    params: { cardIssuanceId: '1' },
    body,
})

const card = (overrides = {}) => ({
    id: 1,
    userId: '99',
    status: 'ISSUED',
    cardState: 'ACTIVE',
    referenceNumber: 'REF-1',
    maskedCardNumber: '1234 56** **** 7890',
    ...overrides,
})

const OTHERS = 4
const LOST = 1

describe('freeze reason note (Others)', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findByIdScoped.mockResolvedValue(card())
        updateCardStateById.mockResolvedValue()
        resolvePinelabsCredsForRequest.mockResolvedValue({ creds: { token: 't' } })
        pinelabsRequest.mockResolvedValue({ ok: true, data: { responseCode: 0 } })
        isPinelabsSuccess.mockReturnValue(true)
        hasBlockingTermination.mockResolvedValue(false)
        safeAudit.mockResolvedValue()
    })

    describe('validation', () => {
        it('400s when reason is Others and no note is supplied, without touching the vendor', async () => {
            const next = jest.fn()
            await freezeCard(adminReq({ reason: OTHERS }), buildRes(), next)

            expect(pinelabsRequest).not.toHaveBeenCalled()
            expect(updateCardStateById).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        })

        it('400s on a whitespace-only note', async () => {
            const next = jest.fn()
            await freezeCard(adminReq({ reason: OTHERS, reasonNote: '   ' }), buildRes(), next)

            expect(pinelabsRequest).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        })

        it('400s on a note longer than the 255-char column', async () => {
            const next = jest.fn()
            await freezeCard(adminReq({ reason: OTHERS, reasonNote: 'x'.repeat(256) }), buildRes(), next)

            expect(pinelabsRequest).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        })

        it('accepts a note exactly at the 255-char boundary', async () => {
            const next = jest.fn()
            await freezeCard(adminReq({ reason: OTHERS, reasonNote: 'x'.repeat(255) }), buildRes(), next)

            expect(next).not.toHaveBeenCalled()
            expect(updateCardStateById).toHaveBeenCalledWith(1, expect.objectContaining({
                freezeReasonNote: 'x'.repeat(255),
            }))
        })
    })

    describe('persistence', () => {
        it('stores the trimmed note alongside the Others code', async () => {
            await freezeCard(
                adminReq({ reason: OTHERS, reasonNote: '  Cardholder on extended leave  ' }),
                buildRes(),
                jest.fn()
            )

            expect(updateCardStateById).toHaveBeenCalledWith(1, expect.objectContaining({
                cardState: 'FROZEN',
                freezeReason: OTHERS,
                freezeReasonNote: 'Cardholder on extended leave',
                frozenByRole: 'ADMIN',
            }))
        })

        it('keeps an optional note sent with a self-describing reason code', async () => {
            await freezeCard(adminReq({ reason: LOST, reasonNote: 'Lost at the Bengaluru office' }), buildRes(), jest.fn())

            expect(updateCardStateById).toHaveBeenCalledWith(1, expect.objectContaining({
                freezeReason: LOST,
                freezeReasonNote: 'Lost at the Bengaluru office',
            }))
        })

        it('stores null rather than an empty string when the optional note is left blank', async () => {
            await freezeCard(adminReq({ reason: LOST, reasonNote: '   ' }), buildRes(), jest.fn())

            expect(updateCardStateById).toHaveBeenCalledWith(1, expect.objectContaining({
                freezeReason: LOST,
                freezeReasonNote: null,
            }))
        })

        it('clears the note on unfreeze', async () => {
            findByIdScoped.mockResolvedValue(card({ cardState: 'FROZEN' }))

            await unfreezeCard(adminReq(), buildRes(), jest.fn())

            expect(updateCardStateById).toHaveBeenCalledWith(1, expect.objectContaining({
                cardState: 'ACTIVE',
                freezeReason: null,
                freezeReasonNote: null,
                frozenByRole: null,
            }))
        })

    })

    describe('cardholder self-freeze', () => {
        const cardholderReq = (body = {}) => ({
            user: { role: 'USER', corporateId: 42, employeeProfileId: '99', id: 7, serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] },
            params: { cardIssuanceId: '1' },
            body,
        })

        it('400s when no reason is supplied, without touching the vendor', async () => {
            const next = jest.fn()
            await freezeCard(cardholderReq(), buildRes(), next)

            expect(pinelabsRequest).not.toHaveBeenCalled()
            expect(updateCardStateById).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        })

        it('400s when reason is Others and no note is supplied', async () => {
            const next = jest.fn()
            await freezeCard(cardholderReq({ reason: OTHERS }), buildRes(), next)

            expect(pinelabsRequest).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        })

        it('stores the reason and trimmed note against the cardholder role', async () => {
            await freezeCard(
                cardholderReq({ reason: OTHERS, reasonNote: '  Left it in a cab  ' }),
                buildRes(),
                jest.fn()
            )

            expect(updateCardStateById).toHaveBeenCalledWith(1, expect.objectContaining({
                cardState: 'FROZEN',
                freezeReason: OTHERS,
                freezeReasonNote: 'Left it in a cab',
                frozenByRole: 'CARDHOLDER',
            }))
        })

        it('stores a self-describing reason with no note', async () => {
            await freezeCard(cardholderReq({ reason: LOST }), buildRes(), jest.fn())

            expect(updateCardStateById).toHaveBeenCalledWith(1, expect.objectContaining({
                freezeReason: LOST,
                freezeReasonNote: null,
                frozenByRole: 'CARDHOLDER',
            }))
        })

        it('names the reason in the audit trail the admin reads', async () => {
            await freezeCard(cardholderReq({ reason: OTHERS, reasonNote: 'Left it in a cab' }), buildRes(), jest.fn())

            expect(safeAudit).toHaveBeenCalledWith(undefined, expect.objectContaining({
                description: 'Card ending 7890 was frozen (Others: Left it in a cab)',
                metadata: { reason: OTHERS, reasonLabel: 'Others', reasonNote: 'Left it in a cab' },
            }))
        })

        it('keeps the reason off the cardholder vendor payload', async () => {
            findByIdScoped.mockResolvedValue(card({ referenceNumber: '7001' }))

            await freezeCard(cardholderReq({ reason: LOST }), buildRes(), jest.fn())

            const [{ path, body }] = pinelabsRequest.mock.calls[0]
            expect(path).toBe('/v1/cards/attributes/states/update')
            expect(body).toEqual({ referenceNumber: 7001, cardState: 3 })
        })
    })

    describe('audit trail', () => {
        it('names the note in the audit description and metadata', async () => {
            await freezeCard(
                adminReq({ reason: OTHERS, reasonNote: 'Cardholder on extended leave' }),
                buildRes(),
                jest.fn()
            )

            expect(safeAudit).toHaveBeenCalledWith(undefined, expect.objectContaining({
                description: 'Card ending 7890 was frozen (Others: Cardholder on extended leave)',
                metadata: { reason: OTHERS, reasonLabel: 'Others', reasonNote: 'Cardholder on extended leave' },
            }))
        })

        it('leaves the description unchanged for a self-describing reason', async () => {
            await freezeCard(adminReq({ reason: LOST }), buildRes(), jest.fn())

            expect(safeAudit).toHaveBeenCalledWith(undefined, expect.objectContaining({
                description: 'Card ending 7890 was frozen (Lost)',
            }))
        })
    })

    describe('bulk freeze', () => {
        const bulkReq = (body) => ({ user: { role: 'CORPORATE', corporateId: 42, id: 5 }, body })

        it('400s for the whole batch when Others carries no note', async () => {
            const next = jest.fn()
            await bulkChangeCardState(
                bulkReq({ action: 'freeze', cardIds: ['1', '2'], reason: OTHERS }),
                buildRes(),
                next
            )

            expect(pinelabsRequest).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        })

        it('applies the same trimmed note to every card in the batch', async () => {
            await bulkChangeCardState(
                bulkReq({ action: 'freeze', cardIds: ['1', '2'], reason: OTHERS, reasonNote: '  Vendor audit  ' }),
                buildRes(),
                jest.fn()
            )

            expect(updateCardStateById).toHaveBeenCalledTimes(2)
            updateCardStateById.mock.calls.forEach(([, fields]) => {
                expect(fields).toEqual(expect.objectContaining({
                    freezeReason: OTHERS,
                    freezeReasonNote: 'Vendor audit',
                }))
            })
        })
    })

    describe('system freezes', () => {
        it('records why member offboarding froze the cards', async () => {
            findCardsByScope.mockResolvedValue([card({ id: 1 })])
            const req = { user: { role: 'CORPORATE', corporateId: 42, id: 5 }, params: { userId: '99' }, body: {} }

            await freezeCardholderCards(req, buildRes(), jest.fn())

            expect(updateCardStateById).toHaveBeenCalledWith(1, expect.objectContaining({
                freezeReason: OTHERS,
                freezeReasonNote: 'Member removed from the corporate',
                frozenByRole: 'SYSTEM',
            }))
        })
    })
})
