jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../models/use-cases/cardIssuance', () => ({
    findByIdScoped: jest.fn(),
    findByPurchasePaymentRef: jest.fn(),
}))
jest.mock('../../models/use-cases/corporateCardAdminApplication', () => ({ findByCorporate: jest.fn() }))
jest.mock('../../models/use-cases/cardholderKyc', () => ({ findByCardholderUserId: jest.fn() }))
jest.mock('../../models/use-cases/cardRequest', () => ({
    findByIdScoped: jest.fn(),
    decideFromPendingCAS: jest.fn(),
    finalizeFromProcessingCAS: jest.fn(),
}))
jest.mock('../../utils/cardOrderReconciler', () => ({ resolveReconcileCreds: jest.fn() }))
jest.mock('../../controllers/corporate/pinelabsCardIssuance', () => ({ issueCardCore: jest.fn() }))

const { customLog } = require('../../utils/loggerHelper')
const { findByIdScoped, findByPurchasePaymentRef } = require('../../models/use-cases/cardIssuance')
const { findByCorporate } = require('../../models/use-cases/corporateCardAdminApplication')
const { findByCardholderUserId: findKyc } = require('../../models/use-cases/cardholderKyc')
const {
    findByIdScoped: findRequestScoped,
    decideFromPendingCAS,
    finalizeFromProcessingCAS,
} = require('../../models/use-cases/cardRequest')
const { resolveReconcileCreds } = require('../../utils/cardOrderReconciler')
const { issueCardCore } = require('../../controllers/corporate/pinelabsCardIssuance')
const { applyPhysicalCardPurchase } = require('../physicalCardFulfilment')

const SOURCE = {
    id: 4, corporateId: 42, userId: 99, referenceNumber: 555, nameOnCard: 'Aarav Sharma',
    status: 'ISSUED', cardState: 'ACTIVE', cardLimit: 5000,
}

const REQUEST = {
    id: 31,
    corporateId: 42,
    requestType: 'CARD_ISSUANCE',
    status: 'PENDING',
    cardIssuanceId: 4,
    payload: { cardType: 'Physical', shipping: { addressLine1: 'Request Road' } },
}

const payload = (over = {}) => ({
    paymentRefId: '1700000000000',
    corporateId: 42,
    quantity: 1,
    unitPrice: 19,
    amount: 22.42,
    purchasedByCredentialId: 5,
    sourceCardIssuanceId: 4,
    shipping: { addressLine1: 'A1' },
    ...over,
})

const apply = (over) => applyPhysicalCardPurchase({ payload: payload(over), logTraceId: 't' })

beforeEach(() => {
    jest.clearAllMocks()
    findByPurchasePaymentRef.mockResolvedValue(null)
    findByIdScoped.mockResolvedValue(SOURCE)
    findByCorporate.mockResolvedValue({ cardSchemeId: 7 })
    findKyc.mockResolvedValue({ mobileNumber: '9876543210', kycStatus: 'COMPLETED', userId: 99 })
    findRequestScoped.mockResolvedValue(REQUEST)
    decideFromPendingCAS.mockResolvedValue(1)
    finalizeFromProcessingCAS.mockResolvedValue(1)
    resolveReconcileCreds.mockResolvedValue({ baseUrl: 'https://vendor', username: 'u', apiKey: 'k' })
    issueCardCore.mockResolvedValue({ ok: true, card: { id: 77 }, confirmed: true })
})

describe('allocating a paid physical card', () => {
    it('issues the card and reports it', async () => {
        const result = await apply()

        expect(result).toMatchObject({ recorded: true, cardIssuanceId: 77 })
    })

    /**
     * The card row IS the purchase record — the payment reference must land on it, because the unique
     * index on that column is what stops a replayed confirmation creating a second paid card.
     */
    it('stamps the payment reference onto the card row', async () => {
        await apply()

        expect(issueCardCore).toHaveBeenCalledWith(expect.objectContaining({
            params: expect.objectContaining({
                purchasePaymentRefId: '1700000000000',
                cardType: 'Physical',
                sourceCardIssuanceId: 4,
                sourceReferenceNumber: 555,
            }),
        }))
    })

    /**
     * Two confirmation paths race — the browser's /complete and Cashfree's webhook. Allocating twice for
     * one payment is the expensive failure.
     */
    it('ignores a replay of the same payment', async () => {
        findByPurchasePaymentRef.mockResolvedValue({ id: 77 })

        const result = await apply()

        expect(issueCardCore).not.toHaveBeenCalled()
        expect(result).toMatchObject({ duplicate: true, cardIssuanceId: 77 })
    })

    // A prepaid card must not be refused by the very allowance it was bought to get past.
    it('passes no allowance, so the reservation treats it as prepaid', async () => {
        await apply()

        const call = issueCardCore.mock.calls[0][0]
        expect(call.baseLimit).toBeUndefined()
    })

    it('reads the cardholder mobile from local KYC, scoped to the corporate', async () => {
        await apply()

        expect(findKyc).toHaveBeenCalledWith({ corporateId: 42, userId: 99 })
        expect(issueCardCore).toHaveBeenCalledWith(expect.objectContaining({
            cardholder: expect.objectContaining({ mobile: '9876543210', customerName: 'Aarav Sharma' }),
        }))
    })

    it('reports the last four digits of the issued card', async () => {
        issueCardCore.mockResolvedValue({
            ok: true,
            card: { id: 77, maskedCardNumber: '608363******1386' },
            confirmed: true,
        })

        await expect(apply()).resolves.toMatchObject({ cardLast4: '1386' })
    })

    it('reports no digits for a card the issuer has not confirmed yet', async () => {
        issueCardCore.mockResolvedValue({ ok: true, card: { id: 77 }, confirmed: false })

        await expect(apply()).resolves.toMatchObject({ confirmed: false, cardLast4: null })
    })

    it('refuses when there is no KYC record to take a mobile from', async () => {
        findKyc.mockResolvedValue(null)

        const result = await apply()

        expect(issueCardCore).not.toHaveBeenCalled()
        expect(result).toMatchObject({ recorded: false, reason: 'NO_CARDHOLDER_MOBILE' })
    })
})

describe('a purchase that also approves a card request', () => {
    it('claims the request before placing the order', async () => {
        await apply({ cardRequestId: 31 })

        expect(decideFromPendingCAS).toHaveBeenCalledWith(31, expect.objectContaining({
            status: 'PROCESSING',
            decidedByCredentialId: 5,
        }))
    })

    it('links the card to the request so reconciliation can close it later', async () => {
        await apply({ cardRequestId: 31 })

        expect(issueCardCore).toHaveBeenCalledWith(expect.objectContaining({
            params: expect.objectContaining({ cardRequestId: 31 }),
        }))
    })

    it('approves the request once the card is confirmed', async () => {
        await apply({ cardRequestId: 31 })

        expect(finalizeFromProcessingCAS).toHaveBeenCalledWith(31, expect.objectContaining({
            status: 'APPROVED',
            result: expect.objectContaining({ issuedCardIssuanceId: 77 }),
        }))
    })

    it('leaves an unconfirmed order processing for the reconciler to finish', async () => {
        issueCardCore.mockResolvedValue({ ok: true, card: { id: 77 }, confirmed: false })

        await apply({ cardRequestId: 31 })

        expect(finalizeFromProcessingCAS).not.toHaveBeenCalled()
    })

    it('releases the request when the issuer refuses, so the admin can try again', async () => {
        issueCardCore.mockResolvedValue({ ok: false, reason: 'VENDOR_FAIL' })

        await apply({ cardRequestId: 31 })

        expect(finalizeFromProcessingCAS).toHaveBeenCalledWith(31, expect.objectContaining({
            status: 'PENDING',
            decidedAt: null,
            result: null,
        }))
    })

    it('delivers to the address held on the request, not one sent with the payment', async () => {
        await apply({ cardRequestId: 31, shipping: { addressLine1: 'Client Lane' } })

        expect(issueCardCore).toHaveBeenCalledWith(expect.objectContaining({
            params: expect.objectContaining({ shipping: { addressLine1: 'Request Road' } }),
        }))
    })

    it.each([
        ['is not this corporate\'s', null],
        ['is not a card issuance', { ...REQUEST, requestType: 'LIMIT_INCREASE' }],
        ['is not for a physical card', { ...REQUEST, payload: { cardType: 'Virtual' } }],
        ['names a different source card', { ...REQUEST, cardIssuanceId: 9 }],
    ])('refuses a request that %s', async (_label, row) => {
        findRequestScoped.mockResolvedValue(row)

        const result = await apply({ cardRequestId: 31 })

        expect(issueCardCore).not.toHaveBeenCalled()
        expect(result).toMatchObject({ recorded: false, reason: 'REQUEST_UNUSABLE' })
    })

    it('still issues the paid card when the request was decided during payment', async () => {
        decideFromPendingCAS.mockResolvedValue(0)

        const result = await apply({ cardRequestId: 31 })

        expect(result).toMatchObject({ recorded: true, cardIssuanceId: 77 })
    })

    it('touches no request at all for a standalone purchase', async () => {
        await apply()

        expect(findRequestScoped).not.toHaveBeenCalled()
        expect(decideFromPendingCAS).not.toHaveBeenCalled()
        expect(finalizeFromProcessingCAS).not.toHaveBeenCalled()
    })
})

/**
 * Nothing is allocated, so nothing is recorded — and the caller is told whether trying again could help.
 */
describe('when the card cannot be allocated', () => {
    it.each([
        ['the vendor credentials are cold', () => resolveReconcileCreds.mockResolvedValue(null), 'NO_CREDS'],
        ['the source card is no longer active', () => findByIdScoped.mockResolvedValue({ ...SOURCE, status: 'FAILED' }), 'SOURCE_NOT_ACTIVE'],
        ['the source card is frozen', () => findByIdScoped.mockResolvedValue({ ...SOURCE, cardState: 'FROZEN' }), 'SOURCE_FROZEN'],
        ['the source card is missing', () => findByIdScoped.mockResolvedValue(null), 'SOURCE_UNUSABLE'],
        ['the corporate has no card scheme', () => findByCorporate.mockResolvedValue({}), 'NO_CARD_SCHEME'],
    ])('reports %s', async (_label, arrange, reason) => {
        arrange()

        const result = await apply()

        expect(result).toMatchObject({ recorded: false, reason })
    })

    it('reports the issuer refusing', async () => {
        issueCardCore.mockResolvedValue({ ok: false, reason: 'VENDOR_FAIL' })

        const result = await apply()

        expect(result).toMatchObject({ recorded: false, reason: 'VENDOR_FAIL' })
    })

    it('never places an order without a source card', async () => {
        const result = await apply({ sourceCardIssuanceId: null })

        expect(issueCardCore).not.toHaveBeenCalled()
        expect(result).toMatchObject({ recorded: false, reason: 'NO_SOURCE_CARD' })
    })

    it('logs at error level, because the customer has been charged', async () => {
        resolveReconcileCreds.mockResolvedValue(null)

        await apply()

        expect(customLog).toHaveBeenCalledWith('t', 'error', expect.objectContaining({
            message: expect.stringContaining('the payment stands'),
            paymentRefId: '1700000000000',
        }), 'CONSOLE')
    })
})
