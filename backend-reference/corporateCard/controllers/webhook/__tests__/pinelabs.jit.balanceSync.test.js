jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
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
    createEntry: jest.fn(),
}))
jest.mock('../../../models/use-cases/cardholderKyc', () => ({ upsertByMobileIfNewer: jest.fn() }))
jest.mock('../../../models/use-cases/corporateCardAdminApplication', () => ({
    findBySvcCardNumber: jest.fn(),
    lockByCorporate: jest.fn(),
}))
jest.mock('../../../services/walletBalanceSync', () => ({
    syncIssuerBalanceSafely: jest.fn().mockResolvedValue({ synced: false }),
    toBalance: jest.requireActual('../../../services/walletBalanceSync').toBalance,
}))

const { jit } = require('../pinelabs')
const { findByExternalCardIdentifier } = require('../../../models/use-cases/cardIssuance')
const { recordAuth, getAuthorizedSpendForCard, getAuthorizedSpendTotal } = require('../../../models/use-cases/cardTransaction')
const { sumByDirection } = require('../../../models/use-cases/corporateCardLedger')
const { syncIssuerBalanceSafely } = require('../../../services/walletBalanceSync')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const CARD = { id: 7, corporateId: 42, userId: 99, status: 'ISSUED', cardState: 'ACTIVE', atmEnabled: false, cardLimit: null, perTxnLimit: null }

const authBody = (transactionDetail = {}) => ({
    clientId: 'F*i*k*r*1*3',
    event: 'AUTH',
    data: {
        transactionUniqueId: 315946233470,
        cardDetail: { externalCardIdentifier: 'ext-card-1', maskedCardNumber: '157095772492' },
        merchantDetail: { mcc: '5411', city: 'Bengaluru', merchantName: 'Demo Supermart' },
        transactionDetail: { transactionType: 2, transactionAmount: 2000, ...transactionDetail },
    },
})

// Our derived balance is ledger IN - OUT - authorised spend; these mocks put it at 5000.
const ourBalanceIs = (amount) => {
    sumByDirection.mockResolvedValue({ in: amount, out: 0 })
    getAuthorizedSpendTotal.mockResolvedValue(0)
}

const run = async (transactionDetail = {}) => {
    const res = buildRes()
    await jit({ body: authBody(transactionDetail), LogTraceId: 't', headers: {} }, res)
    return res
}

const decision = (res) => res.json.mock.calls[0][0]

beforeEach(() => {
    jest.clearAllMocks()
    findByExternalCardIdentifier.mockResolvedValue(CARD)
    recordAuth.mockResolvedValue({})
    syncIssuerBalanceSafely.mockResolvedValue({ synced: false })
    getAuthorizedSpendForCard.mockResolvedValue(0)
    ourBalanceIs(5000)
})

describe('jit — issuer wallet balance', () => {
    describe('the decision', () => {
        it('authorises when both our balance and the issuer cover the amount', async () => {
            const res = await run({ transferCardBalance: 5000 })

            expect(decision(res)).toMatchObject({ authorizationStatus: 0, responseMessage: 'Approved' })
        })

        it('declines when the issuer says there is less than the amount, even though we think there is enough', async () => {
            const res = await run({ transferCardBalance: 100 })

            expect(decision(res)).toMatchObject({
                authorizationStatus: 1,
                responseMessage: 'Insufficient corporate wallet balance',
            })
        })

        it('declines when our own balance is short, even though the issuer says there is enough', async () => {
            ourBalanceIs(100)

            const res = await run({ transferCardBalance: 999999 })

            expect(decision(res)).toMatchObject({ authorizationStatus: 1 })
        })

        it('falls back to our own balance when the issuer sends no balance', async () => {
            const res = await run()

            expect(decision(res)).toMatchObject({ authorizationStatus: 0 })
        })
    })

    describe('capture', () => {
        it('stores the issuer balance on the transaction', async () => {
            await run({ transferCardBalance: 4800.5 })

            expect(recordAuth).toHaveBeenCalledWith(
                expect.objectContaining({ issuerWalletBalance: 4800.5 })
            )
        })

        it('stores null when the issuer sends nothing usable', async () => {
            await run({ transferCardBalance: 'abc' })

            expect(recordAuth).toHaveBeenCalledWith(
                expect.objectContaining({ issuerWalletBalance: null })
            )
        })
    })

    describe('sync', () => {
        it('hands the issuer balance to the sync, which re-measures under its own lock', async () => {
            await run({ transferCardBalance: 4800 })

            expect(syncIssuerBalanceSafely).toHaveBeenCalledWith({
                corporateId: 42,
                issuerBalance: 4800,
                transactionUniqueId: 315946233470,
                logTraceId: 't',
            })
        })

        it('does not pass a pre-measured balance, which a concurrent auth could have staled', async () => {
            await run({ transferCardBalance: 4800 })

            expect(syncIssuerBalanceSafely.mock.calls[0][0]).not.toHaveProperty('ourBalance')
        })

        it('syncs even when the transaction was declined for want of balance', async () => {
            await run({ transferCardBalance: 100 })

            expect(syncIssuerBalanceSafely).toHaveBeenCalledWith(
                expect.objectContaining({ issuerBalance: 100 })
            )
        })

        it('passes a null issuer balance through, and the sync ignores it', async () => {
            await run()

            expect(syncIssuerBalanceSafely).toHaveBeenCalledWith(
                expect.objectContaining({ issuerBalance: null })
            )
        })

        it('still answers the issuer when the sync fails', async () => {
            syncIssuerBalanceSafely.mockRejectedValue(new Error('lock timeout'))

            const res = await run({ transferCardBalance: 4800 })

            expect(decision(res)).toMatchObject({ authorizationStatus: 0, responseMessage: 'Approved' })
        })

        it('does no wallet work at all for a card declined before the balance check', async () => {
            findByExternalCardIdentifier.mockResolvedValue({ ...CARD, cardState: 'FROZEN' })

            await run({ transferCardBalance: 4800 })

            expect(sumByDirection).not.toHaveBeenCalled()
        })
    })
})
