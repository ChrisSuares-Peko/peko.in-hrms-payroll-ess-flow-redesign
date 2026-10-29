jest.mock('../../../utils/pinelabsGateway', () => ({
    ...jest.requireActual('../../../utils/pinelabsGateway'),
    pinelabsRequest: jest.fn(),
}))
jest.mock('../../../utils/cardHelpers', () => ({
    ...jest.requireActual('../../../utils/cardHelpers'),
    safeAudit: jest.fn(),
}))
jest.mock('../../../utils/cardOrderReconciler', () => ({
    reconcileConfig: () => ({ delayMinutes: 15, issueTimeoutMs: 5000 }),
    rememberReconcileCreds: jest.fn(),
}))
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../../models/use-cases/cardholderKyc', () => ({ findByMobile: jest.fn() }))
jest.mock('../../../models/use-cases/cardIssuance', () => ({
    findAndCountCardsWithHolder: jest.fn(),
    findBlockingIssuance: jest.fn(),
    createCard: jest.fn(),
    countPhysicalCardsUsed: jest.fn(),
    updateCardById: jest.fn(),
    scheduleReconcile: jest.fn(),
    replaceVirtualCardById: jest.fn(),
}))
jest.mock('../../../services/cardSlotReservation', () => {
    class CardSlotError extends Error {
        constructor(statusCode, message, quota = null) {
            super(message)
            this.statusCode = statusCode
            this.quota = quota
        }
    }
    return { CardSlotError, reservePhysicalCardSlot: jest.fn() }
})

const { pinelabsRequest } = require('../../../utils/pinelabsGateway')
const { safeAudit } = require('../../../utils/cardHelpers')
const { customLog } = require('../../../utils/loggerHelper')
const { findByMobile } = require('../../../models/use-cases/cardholderKyc')
const { findBlockingIssuance, createCard, updateCardById } = require('../../../models/use-cases/cardIssuance')
const { reservePhysicalCardSlot, CardSlotError } = require('../../../services/cardSlotReservation')
const { issueCardCore } = require('../pinelabsCardIssuance')
const { CARD_TYPE } = require('../../../constants/cardRequest')
const { GENERIC_ERROR } = require('../../../constants/messages')

const CREDS = { baseUrl: 'https://vendor', username: 'u', apiKey: 'k' }
const NEW_CARD = { id: 7, corporateId: 42, userId: 99 }
const PHYSICAL = { cardType: CARD_TYPE.PHYSICAL, sourceCardIssuanceId: 4, sourceReferenceNumber: 555 }

const issue = ({ params = {}, ...rest } = {}) => issueCardCore({
    cardholder: { customerName: 'Aarav Sharma', mobile: '9876543210', email: 'a@peko.in', userId: 99, corporateId: 42, credentialId: null },
    params,
    creds: CREDS,
    cardSchemeId: 7,
    baseLimit: 1,
    unitPrice: 19,
    actor: { credentialId: 5, display: 'Admin' },
    logTraceId: 't',
    ...rest,
})

beforeEach(() => {
    jest.clearAllMocks()
    findByMobile.mockResolvedValue({ kycStatus: 'COMPLETED' })
    findBlockingIssuance.mockResolvedValue(null)
    createCard.mockResolvedValue(NEW_CARD)
    updateCardById.mockImplementation(async (id, fields) => ({ ...NEW_CARD, ...fields }))
    reservePhysicalCardSlot.mockImplementation(({ fields }) => createCard(fields))
    pinelabsRequest.mockResolvedValue({ ok: true, data: { responseCode: 0, referenceNumber: 555 } })
})

/**
 * Virtual cards are unlimited. Every plan tier advertises it, so a virtual issuance must never reach the
 * allowance at all — not even to be allowed by it.
 */
describe('a virtual card', () => {
    it('never consults the allowance', async () => {
        await issue({ params: { cardType: CARD_TYPE.VIRTUAL } })

        expect(reservePhysicalCardSlot).not.toHaveBeenCalled()
        expect(createCard).toHaveBeenCalledTimes(1)
    })

    it('is issued even when the corporate has no physical cards left', async () => {
        reservePhysicalCardSlot.mockRejectedValue(new CardSlotError(402, 'pay up', {}))

        const result = await issue({ baseLimit: 0, params: { cardType: CARD_TYPE.VIRTUAL } })

        expect(result.ok).toBe(true)
        expect(pinelabsRequest).toHaveBeenCalled()
    })

    it('is issued with no allowance passed at all', async () => {
        const result = await issue({ baseLimit: undefined, unitPrice: undefined, params: { cardType: CARD_TYPE.VIRTUAL } })

        expect(result.ok).toBe(true)
    })
})

describe('a physical card', () => {
    it('claims against the allowance and the price the caller resolved', async () => {
        await issue({ params: PHYSICAL })

        expect(reservePhysicalCardSlot).toHaveBeenCalledWith(
            expect.objectContaining({ corporateId: 42, baseLimit: 1, unitPrice: 19, prepaid: false })
        )
    })

    /**
     * A card that was paid for must skip the allowance: the row proving the payment is the one about to
     * be inserted, so the allowance cannot see it yet and would refuse the card the corporate just bought.
     */
    it('skips the allowance when the card was already paid for', async () => {
        await issue({ baseLimit: undefined, params: { ...PHYSICAL, purchasePaymentRefId: '1700000000000' } })

        expect(reservePhysicalCardSlot).toHaveBeenCalledWith(
            expect.objectContaining({ prepaid: true })
        )
    })

    it('does not refuse a prepaid card for a missing allowance', async () => {
        const result = await issue({
            baseLimit: undefined,
            params: { ...PHYSICAL, purchasePaymentRefId: '1700000000000' },
        })

        expect(result.ok).toBe(true)
    })

    it('is inserted through the reservation, never straight through createCard', async () => {
        await issue({ params: PHYSICAL })

        expect(reservePhysicalCardSlot).toHaveBeenCalledTimes(1)
    })
})

/**
 * The one thing that must never happen: a refused order that still placed a real order at Pine Labs.
 */
describe('when payment is required', () => {
    const quota = { used: 1, included: 1, purchased: 0, allowed: 1, remaining: 0, requiresPayment: true, unitPrice: 19, purchasable: true }

    beforeEach(() => {
        reservePhysicalCardSlot.mockRejectedValue(new CardSlotError(402, 'order another for INR 19.00', quota))
    })

    it('places no order with the vendor', async () => {
        await issue({ params: PHYSICAL })

        expect(pinelabsRequest).not.toHaveBeenCalled()
    })

    it('writes no card row', async () => {
        await issue({ params: PHYSICAL })

        expect(createCard).not.toHaveBeenCalled()
        expect(updateCardById).not.toHaveBeenCalled()
    })

    it('answers PAYMENT_REQUIRED with a 402 so the caller can offer to sell', async () => {
        const result = await issue({ params: PHYSICAL })

        expect(result).toMatchObject({ ok: false, reason: 'PAYMENT_REQUIRED', statusCode: 402 })
        expect(result.message).not.toBe(GENERIC_ERROR)
    })

    it('carries the numbers and the price back for the pay screen', async () => {
        const result = await issue({ params: PHYSICAL })

        expect(result.quota).toEqual(quota)
    })

    it('records the refusal in the audit trail', async () => {
        await issue({ params: PHYSICAL })

        expect(safeAudit).toHaveBeenCalledWith('t', expect.objectContaining({
            corporateId: 42,
            action: 'CARD_ISSUE_BLOCKED',
        }))
    })

    // A plan with no price cannot sell one, so it is a plain refusal rather than a pay prompt.
    it('is a 400, not a 402, when the plan carries no price', async () => {
        reservePhysicalCardSlot.mockRejectedValue(new CardSlotError(400, 'upgrade', { ...quota, purchasable: false }))

        const result = await issue({ params: PHYSICAL })

        expect(result).toMatchObject({ reason: 'QUOTA', statusCode: 400 })
    })
})

/**
 * An omitted allowance on a physical order means a call site was missed. Defaulting it would hand out a
 * free card in silence, so it has to be a loud refusal.
 */
describe('a physical order with no allowance passed', () => {
    it.each([['undefined', undefined], ['null', null]])('refuses when baseLimit is %s', async (_label, baseLimit) => {
        const result = await issue({ baseLimit, params: PHYSICAL })

        expect(result).toMatchObject({ ok: false, reason: 'NO_ALLOWANCE', statusCode: 500, message: GENERIC_ERROR })
        expect(pinelabsRequest).not.toHaveBeenCalled()
        expect(createCard).not.toHaveBeenCalled()
    })

    it('logs it, because nothing else will show a missed call site', async () => {
        await issue({ baseLimit: undefined, params: PHYSICAL })

        expect(customLog).toHaveBeenCalledWith('t', 'error', expect.objectContaining({
            message: expect.stringContaining('no plan allowance'),
        }), 'CONSOLE')
    })
})
