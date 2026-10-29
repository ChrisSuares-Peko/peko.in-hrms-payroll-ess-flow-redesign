jest.mock('../../models/use-cases/cardIssuance', () => ({ findCardsByScope: jest.fn() }))
jest.mock('../../models/use-cases/corporateCardAdminApplication', () => ({
    upsertByCorporate: jest.fn(),
}))
jest.mock('../../controllers/corporate/cardState', () => ({ applyCardStateChange: jest.fn() }))
jest.mock('../../utils/cardOrderReconciler', () => ({ resolveReconcileCreds: jest.fn() }))

const { findCardsByScope } = require('../../models/use-cases/cardIssuance')
const { upsertByCorporate } = require('../../models/use-cases/corporateCardAdminApplication')
const { applyCardStateChange } = require('../../controllers/corporate/cardState')
const { resolveReconcileCreds } = require('../../utils/cardOrderReconciler')
const { applyApprovedClosure, freezeCorporateCards, resetKybToFresh } = require('../accountClosure')

const card = (over = {}) => ({ id: 1, status: 'ISSUED', cardState: 'ACTIVE', ...over })
const req = {}

beforeEach(() => {
    jest.clearAllMocks()
    findCardsByScope.mockResolvedValue([])
    upsertByCorporate.mockResolvedValue({})
    resolveReconcileCreds.mockResolvedValue({ baseUrl: 'https://v', username: 'u', apiKey: 'k' })
    applyCardStateChange.mockResolvedValue({ ok: true })
})

describe('freezeCorporateCards', () => {
    it('freezes every active issued card in the corporate', async () => {
        findCardsByScope.mockResolvedValue([card({ id: 1 }), card({ id: 2 })])

        const result = await freezeCorporateCards({ corporateId: 42, actorCredentialId: 7, actorDisplay: 'Ops', req })

        expect(result).toEqual({ requested: 2, frozen: 2, failed: 0 })
        expect(applyCardStateChange).toHaveBeenCalledTimes(2)
        expect(applyCardStateChange.mock.calls[0][0]).toMatchObject({
            freeze: true,
            isAdmin: true,
            actorRole: 'SYSTEM',
            reasonNote: 'Account closure approved by Peko support',
        })
    })

    it('scopes the lookup to the whole corporate, not one member', async () => {
        await freezeCorporateCards({ corporateId: 42, req })

        expect(findCardsByScope).toHaveBeenCalledWith({ corporateId: 42 })
    })

    it('skips cards that are already frozen or not issued', async () => {
        findCardsByScope.mockResolvedValue([
            card({ id: 1, cardState: 'FROZEN' }),
            card({ id: 2, status: 'PENDING' }),
            card({ id: 3, status: 'FAILED' }),
        ])

        const result = await freezeCorporateCards({ corporateId: 42, req })

        expect(result).toEqual({ requested: 0, frozen: 0, failed: 0 })
        expect(applyCardStateChange).not.toHaveBeenCalled()
    })

    it('does not touch the vendor when there is nothing to freeze', async () => {
        await freezeCorporateCards({ corporateId: 42, req })

        expect(resolveReconcileCreds).not.toHaveBeenCalled()
    })

    // The closure must still be recorded when the vendor is unreachable; it must not claim cards froze.
    it('reports the cards as failed when vendor credentials cannot be resolved', async () => {
        findCardsByScope.mockResolvedValue([card()])
        resolveReconcileCreds.mockResolvedValue(null)

        const result = await freezeCorporateCards({ corporateId: 42, req })

        expect(result).toMatchObject({ requested: 1, frozen: 0, failed: 1, vendorUnavailable: true })
        expect(applyCardStateChange).not.toHaveBeenCalled()
    })

    // A system-user session has no corporateId, so the session-bound resolver can never return creds
    // for the target corporate. Only the session-free operator-cache resolver works from an admin request.
    it('resolves credentials without a session, not from the admin request', async () => {
        findCardsByScope.mockResolvedValue([card()])

        await freezeCorporateCards({ corporateId: 42, req: { LogTraceId: 'trace-1' } })

        expect(resolveReconcileCreds).toHaveBeenCalledWith('trace-1')
    })

    it('counts a card the vendor refused as failed, not frozen', async () => {
        findCardsByScope.mockResolvedValue([card({ id: 1 }), card({ id: 2 })])
        applyCardStateChange
            .mockResolvedValueOnce({ ok: true })
            .mockResolvedValueOnce({ ok: false, message: 'vendor said no' })

        const result = await freezeCorporateCards({ corporateId: 42, req })

        expect(result).toEqual({ requested: 2, frozen: 1, failed: 1 })
    })
})

describe('resetKybToFresh', () => {
    it('clears the KYB progress and soft deletes the application in one write', async () => {
        await resetKybToFresh({ corporateId: 42, req })

        const [corporateId, fields] = upsertByCorporate.mock.calls[0]
        expect(corporateId).toBe(42)
        expect(fields).toMatchObject({
            kybStatus: null,
            kybReference: null,
            metadata: null,
            agreementSignMethod: null,
            esignStatus: null,
            esignReference: null,
            isDeleted: true,
        })
    })

    // These are what make a restart prefilled rather than a blank form.
    it('leaves the prefill fields alone', async () => {
        await resetKybToFresh({ corporateId: 42, req })

        const [, fields] = upsertByCorporate.mock.calls[0]
        expect(fields).not.toHaveProperty('businessType')
        expect(fields).not.toHaveProperty('virtualAccount')
        expect(fields).not.toHaveProperty('svcCardNumber')
        expect(fields).not.toHaveProperty('createdByCredentialId')
    })
})

describe('applyApprovedClosure', () => {
    it('freezes the cards and then resets the KYB', async () => {
        findCardsByScope.mockResolvedValue([card()])

        const result = await applyApprovedClosure({ corporateId: 42, actorCredentialId: 7, actorDisplay: 'Ops', req })

        expect(result.cards).toEqual({ requested: 1, frozen: 1, failed: 0 })
        expect(result.kybReset).toBe(true)
        expect(applyCardStateChange).toHaveBeenCalled()
        expect(upsertByCorporate).toHaveBeenCalled()
    })

    // If the reset ran first, a vendor failure would leave a corporate reset but still spending.
    it('freezes before resetting, so a vendor failure cannot leave live cards on a closed account', async () => {
        findCardsByScope.mockResolvedValue([card()])
        const order = []
        applyCardStateChange.mockImplementation(async () => {
            order.push('freeze')
            return { ok: true }
        })
        upsertByCorporate.mockImplementation(async () => {
            order.push('reset')
            return {}
        })

        await applyApprovedClosure({ corporateId: 42, req })

        expect(order).toEqual(['freeze', 'reset'])
    })

    it('still resets the KYB when the vendor is unreachable, and says the cards did not freeze', async () => {
        findCardsByScope.mockResolvedValue([card()])
        resolveReconcileCreds.mockResolvedValue(null)

        const result = await applyApprovedClosure({ corporateId: 42, req })

        expect(result.cards.vendorUnavailable).toBe(true)
        expect(result.kybReset).toBe(true)
        expect(upsertByCorporate).toHaveBeenCalled()
    })
})
