const { jit } = require('../pinelabs')
const { findByExternalCardIdentifier } = require('../../../models/use-cases/cardIssuance')
const { recordAuth, getAuthorizedSpendForCard, getAuthorizedSpendTotal } = require('../../../models/use-cases/cardTransaction')
const { sumByDirection } = require('../../../models/use-cases/corporateCardLedger')

jest.mock('../../../models/use-cases/cardIssuance', () => ({
    findByExternalCardIdentifier: jest.fn(),
}))

jest.mock('../../../models/use-cases/cardTransaction', () => ({
    recordAuth: jest.fn(),
    recordNotify: jest.fn(),
    getAuthorizedSpendForCard: jest.fn(),
    getAuthorizedSpendTotal: jest.fn(),
}))

jest.mock('../../../models/use-cases/corporateCardLedger', () => ({
    sumByDirection: jest.fn(),
}))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const authBody = (overrides = {}) => ({
    clientId: 'F*i*k*r*1*3',
    event: 'AUTH',
    data: {
        transactionUniqueId: 315946233470,
        cardDetail: { referenceNumber: '56782870', maskedCardNumber: '157095772492', externalCardIdentifier: 'ext-card-1' },
        merchantDetail: { mcc: '5411', city: 'Bengaluru', merchantName: 'Demo Supermart' },
        transactionDetail: { transactionType: 2, transactionAmount: 2000.0 },
        ...overrides,
    },
})

describe('exports.jit', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        recordAuth.mockResolvedValue({})
        sumByDirection.mockResolvedValue({ in: 1000000, out: 0 })
        getAuthorizedSpendTotal.mockResolvedValue(0)
        getAuthorizedSpendForCard.mockResolvedValue(0)
    })

    it('always responds with HTTP 200 regardless of the decision carried in the body', async () => {
        findByExternalCardIdentifier.mockResolvedValue(null)
        const req = { body: authBody() }
        const res = buildRes()

        await jit(req, res)

        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('approves an AUTH request whose externalCardIdentifier resolves to a known cardIssuance', async () => {
        findByExternalCardIdentifier.mockResolvedValue({ id: 7, corporateId: 42, userId: 99, status: 'ISSUED' })
        const req = { body: authBody() }
        const res = buildRes()

        await jit(req, res)

        expect(findByExternalCardIdentifier).toHaveBeenCalledWith('ext-card-1')
        expect(res.json).toHaveBeenCalledWith({
            authorizationStatus: 0,
            authorizationTransactionId: '315946233470',
            responseMessage: 'Approved',
        })
        expect(recordAuth).toHaveBeenCalledWith(expect.objectContaining({
            transactionUniqueId: 315946233470,
            cardIssuanceId: 7,
            corporateId: 42,
            userId: 99,
            merchantName: 'Demo Supermart',
            merchantCategoryCode: '5411',
            merchantCity: 'Bengaluru',
            decision: 'AUTHORIZED',
            declineReason: null,
        }))
    })

    it('resolves transactionUniqueId/cardDetail/merchantDetail/transactionDetail from a flat AUTH payload with no `data` wrapper', async () => {
        findByExternalCardIdentifier.mockResolvedValue({ id: 9, corporateId: 42, userId: 99, status: 'ISSUED' })
        const req = {
            body: {
                accountDetails: null,
                cardDetail: {
                    externalCardIdentifier: 'PKCARD5167461e2e8441bdbd50ff2072498fd1',
                    maskedCardNumber: '608363******1859',
                    referenceNumber: '1311626637',
                },
                merchantDetail: { city: 'Bengaluru', mcc: '5999', merchantName: 'PinePerk_Test_Merchant' },
                transactionDetail: { transactionAmount: 10, transactionMode: 3, transactionType: 2 },
                transactionUniqueId: 14913985470,
            },
        }
        const res = buildRes()

        await jit(req, res)

        expect(findByExternalCardIdentifier).toHaveBeenCalledWith('PKCARD5167461e2e8441bdbd50ff2072498fd1')
        expect(res.json).toHaveBeenCalledWith({
            authorizationStatus: 0,
            authorizationTransactionId: '14913985470',
            responseMessage: 'Approved',
        })
        expect(recordAuth).toHaveBeenCalledWith(expect.objectContaining({
            transactionUniqueId: 14913985470,
            cardIssuanceId: 9,
            merchantName: 'PinePerk_Test_Merchant',
            merchantCategoryCode: '5999',
            decision: 'AUTHORIZED',
            declineReason: null,
        }))
    })

    it('declines an AUTH request whose externalCardIdentifier does not match any known card', async () => {
        findByExternalCardIdentifier.mockResolvedValue(null)
        const req = { body: authBody() }
        const res = buildRes()

        await jit(req, res)

        expect(res.json).toHaveBeenCalledWith({
            authorizationStatus: 1,
            authorizationTransactionId: '315946233470',
            responseMessage: 'Card not recognized',
        })
        expect(recordAuth).toHaveBeenCalledWith(expect.objectContaining({
            cardIssuanceId: null,
            corporateId: null,
            userId: null,
            decision: 'DECLINED',
            declineReason: 'Card not recognized',
        }))
    })

    it('declines an AUTH request with no externalCardIdentifier at all, without querying the card', async () => {
        const req = { body: authBody({ cardDetail: { referenceNumber: '56782870', externalCardIdentifier: null } }) }
        const res = buildRes()

        await jit(req, res)

        expect(findByExternalCardIdentifier).not.toHaveBeenCalled()
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 1, responseMessage: 'Card not recognized' }))
    })

    it('declines an AUTH payload missing transactionUniqueId, without attempting card resolution or persistence', async () => {
        const req = { body: { clientId: 'F*i*k*r*1*3', event: 'AUTH', data: {} } }
        const res = buildRes()

        await jit(req, res)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 1 }))
        expect(findByExternalCardIdentifier).not.toHaveBeenCalled()
        expect(recordAuth).not.toHaveBeenCalled()
    })

    it('declines an empty body without throwing (treated as a malformed AUTH)', async () => {
        const req = { body: undefined }
        const res = buildRes()

        await jit(req, res)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 1 }))
        expect(recordAuth).not.toHaveBeenCalled()
    })
})

describe('exports.jit — vendor-blocked MCC', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        recordAuth.mockResolvedValue({})
        sumByDirection.mockResolvedValue({ in: 1000000, out: 0 })
        getAuthorizedSpendTotal.mockResolvedValue(0)
        getAuthorizedSpendForCard.mockResolvedValue(0)
    })

    it('declines a vendor-blocked mcc even when the card is unresolved, without querying the card', async () => {
        findByExternalCardIdentifier.mockResolvedValue(null)
        const res = buildRes()

        await jit({ body: authBody({ merchantDetail: { mcc: '7995', city: 'Bengaluru', merchantName: 'Race Track Wagers' } }) }, res)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 1, responseMessage: 'Merchant category blocked by card network' }))
        expect(recordAuth).toHaveBeenCalledWith(expect.objectContaining({ decision: 'DECLINED', declineReason: 'Merchant category blocked by card network' }))
    })

    it('declines a vendor-blocked mcc even for an active, unfrozen, unrestricted card, without checking any limit or the wallet balance', async () => {
        findByExternalCardIdentifier.mockResolvedValue({ id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE', restrictedCategories: [] })
        const res = buildRes()

        await jit({ body: authBody({ merchantDetail: { mcc: '4829', city: 'Bengaluru', merchantName: 'Money Transfer' } }) }, res)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 1, responseMessage: 'Merchant category blocked by card network' }))
        expect(getAuthorizedSpendForCard).not.toHaveBeenCalled()
        expect(sumByDirection).not.toHaveBeenCalled()
    })

    // 6010/6011 are no longer vendor-blocked: a cash withdrawal is now decided by the card's own ATM switch.
    it.each(['6010', '6011'])('does not vendor-block cash disbursement mcc %s', async (mcc) => {
        findByExternalCardIdentifier.mockResolvedValue({ id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE', restrictedCategories: [] })
        const res = buildRes()

        await jit({ body: authBody({ merchantDetail: { mcc, city: 'Bengaluru', merchantName: 'ATM Cash' } }) }, res)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 0, responseMessage: 'Approved' }))
    })

    it('approves a non-blocked mcc on the same active card', async () => {
        findByExternalCardIdentifier.mockResolvedValue({ id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE', restrictedCategories: [] })
        const res = buildRes()

        await jit({ body: authBody() }, res)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 0, responseMessage: 'Approved' }))
    })
})

describe('exports.jit — ATM transactions (transactionMode 5)', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        recordAuth.mockResolvedValue({})
        sumByDirection.mockResolvedValue({ in: 1000000, out: 0 })
        getAuthorizedSpendTotal.mockResolvedValue(0)
        getAuthorizedSpendForCard.mockResolvedValue(0)
    })

    it('declines an ATM transaction when the card has atmEnabled: false, without checking any limit or the wallet balance', async () => {
        findByExternalCardIdentifier.mockResolvedValue({ id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE', atmEnabled: false, restrictedCategories: [] })
        const res = buildRes()

        await jit({ body: authBody({ transactionDetail: { transactionType: 2, transactionMode: 5, transactionAmount: 2000.0 } }) }, res)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 1, responseMessage: 'ATM withdrawals are disabled for this card' }))
        expect(recordAuth).toHaveBeenCalledWith(expect.objectContaining({ decision: 'DECLINED', declineReason: 'ATM withdrawals are disabled for this card' }))
        expect(getAuthorizedSpendForCard).not.toHaveBeenCalled()
        expect(sumByDirection).not.toHaveBeenCalled()
    })

    it('declines an ATM transaction when the card has no atmEnabled field at all (defaults to disabled)', async () => {
        findByExternalCardIdentifier.mockResolvedValue({ id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE', restrictedCategories: [] })
        const res = buildRes()

        await jit({ body: authBody({ transactionDetail: { transactionType: 2, transactionMode: 5, transactionAmount: 2000.0 } }) }, res)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 1, responseMessage: 'ATM withdrawals are disabled for this card' }))
    })

    it('approves an ATM transaction when the card has atmEnabled: true', async () => {
        findByExternalCardIdentifier.mockResolvedValue({ id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE', atmEnabled: true, restrictedCategories: [] })
        const res = buildRes()

        await jit({ body: authBody({ transactionDetail: { transactionType: 2, transactionMode: 5, transactionAmount: 2000.0 } }) }, res)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 0, responseMessage: 'Approved' }))
    })

    it('approves a non-ATM transaction (transactionMode !== 5) even when atmEnabled is false', async () => {
        findByExternalCardIdentifier.mockResolvedValue({ id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE', atmEnabled: false, restrictedCategories: [] })
        const res = buildRes()

        await jit({ body: authBody({ transactionDetail: { transactionType: 2, transactionMode: 1, transactionAmount: 2000.0 } }) }, res)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 0, responseMessage: 'Approved' }))
    })
})

describe('exports.jit — limit checks', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        recordAuth.mockResolvedValue({})
        sumByDirection.mockResolvedValue({ in: 1000000, out: 0 })
        getAuthorizedSpendTotal.mockResolvedValue(0)
        getAuthorizedSpendForCard.mockResolvedValue(0)
    })

    describe.each([
        ['PENDING', 'an order still awaiting confirmation'],
        ['FAILED', 'an order the issuer rejected'],
        ['REPLACED', 'a virtual retired by its physical companion'],
    ])('a card whose status is %s', (status, why) => {
        it(`is declined — ${why} must not spend`, async () => {
            findByExternalCardIdentifier.mockResolvedValue({ id: 7, corporateId: 42, userId: 99, status, cardState: 'ACTIVE' })
            const res = buildRes()

            await jit({ body: authBody() }, res)

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 1, responseMessage: 'Card is not live' }))
            expect(recordAuth).toHaveBeenCalledWith(expect.objectContaining({ decision: 'DECLINED', declineReason: 'Card is not live' }))
            expect(getAuthorizedSpendForCard).not.toHaveBeenCalled()
            expect(sumByDirection).not.toHaveBeenCalled()
        })
    })

    it('declines a frozen card without checking any limit or the wallet balance', async () => {
        findByExternalCardIdentifier.mockResolvedValue({ id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'FROZEN' })
        const res = buildRes()

        await jit({ body: authBody() }, res)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 1, responseMessage: 'Card frozen' }))
        expect(recordAuth).toHaveBeenCalledWith(expect.objectContaining({ decision: 'DECLINED', declineReason: 'Card frozen', cardIssuanceId: 7 }))
        expect(getAuthorizedSpendForCard).not.toHaveBeenCalled()
        expect(sumByDirection).not.toHaveBeenCalled()
    })

    it('declines when the amount exceeds the per-transaction limit, without checking the period limit', async () => {
        findByExternalCardIdentifier.mockResolvedValue({
            id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE', perTxnLimit: 1000, cardLimit: 100000,
        })
        const res = buildRes()

        await jit({ body: authBody() }, res)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 1, responseMessage: 'Exceeds per-transaction limit' }))
        expect(getAuthorizedSpendForCard).not.toHaveBeenCalled()
    })

    it('approves when the amount exactly equals the per-transaction limit (boundary)', async () => {
        findByExternalCardIdentifier.mockResolvedValue({ id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE', perTxnLimit: 2000 })
        const res = buildRes()

        await jit({ body: authBody() }, res)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 0, responseMessage: 'Approved' }))
    })

    it('declines when prior spend plus this transaction would exceed the card limit for its period', async () => {
        findByExternalCardIdentifier.mockResolvedValue({
            id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE', cardLimit: 5000, limitFrequency: 'monthly',
        })
        getAuthorizedSpendForCard.mockResolvedValue(4000)
        const res = buildRes()

        await jit({ body: authBody() }, res)

        expect(getAuthorizedSpendForCard).toHaveBeenCalledWith(expect.objectContaining({ cardIssuanceId: 7 }))
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 1, responseMessage: 'Exceeds card limit' }))
    })

    it('approves when prior spend plus this transaction stays within the card limit', async () => {
        findByExternalCardIdentifier.mockResolvedValue({
            id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE', cardLimit: 5000, limitFrequency: 'monthly',
        })
        getAuthorizedSpendForCard.mockResolvedValue(1000)
        const res = buildRes()

        await jit({ body: authBody() }, res)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 0, responseMessage: 'Approved' }))
    })

    it('declines when the transaction mcc is restricted for this card, without checking any limit or the wallet balance', async () => {
        findByExternalCardIdentifier.mockResolvedValue({
            id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE',
            restrictedCategories: [{ category: 'Groceries', mccs: ['5411'] }],
        })
        const res = buildRes()

        await jit({ body: authBody() }, res)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            authorizationStatus: 1, responseMessage: 'Merchant category restricted for this card',
        }))
        expect(recordAuth).toHaveBeenCalledWith(expect.objectContaining({ decision: 'DECLINED', declineReason: 'Merchant category restricted for this card' }))
        expect(getAuthorizedSpendForCard).not.toHaveBeenCalled()
        expect(sumByDirection).not.toHaveBeenCalled()
    })

    it('approves when restrictedCategories is set but the transaction mcc does not match any entry', async () => {
        findByExternalCardIdentifier.mockResolvedValue({
            id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE',
            restrictedCategories: [{ category: 'Travel', mccs: ['4511'] }],
        })
        const res = buildRes()

        await jit({ body: authBody() }, res)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 0, responseMessage: 'Approved' }))
    })

    it('approves when restrictedCategories still holds the legacy bare-string shape (no mccs to match)', async () => {
        findByExternalCardIdentifier.mockResolvedValue({
            id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE',
            restrictedCategories: ['Groceries'],
        })
        const res = buildRes()

        await jit({ body: authBody() }, res)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 0, responseMessage: 'Approved' }))
    })

    it('declines when the corporate wallet balance cannot cover the transaction, even with no card-level breach', async () => {
        findByExternalCardIdentifier.mockResolvedValue({ id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE' })
        sumByDirection.mockResolvedValue({ in: 1000, out: 0 })
        getAuthorizedSpendTotal.mockResolvedValue(900)
        const res = buildRes()

        await jit({ body: authBody() }, res)

        expect(sumByDirection).toHaveBeenCalledWith({ corporateId: 42 })
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 1, responseMessage: 'Insufficient corporate wallet balance' }))
    })

    it('approves when the wallet balance exactly equals the transaction amount (boundary)', async () => {
        findByExternalCardIdentifier.mockResolvedValue({ id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE' })
        sumByDirection.mockResolvedValue({ in: 2000, out: 0 })
        getAuthorizedSpendTotal.mockResolvedValue(0)
        const res = buildRes()

        await jit({ body: authBody() }, res)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authorizationStatus: 0, responseMessage: 'Approved' }))
    })
})
