jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../../models/use-cases/cardIssuance', () => ({
    findByExternalCardIdentifier: jest.fn(),
}))
jest.mock('../../../models/use-cases/cardTransaction', () => ({
    recordAuth: jest.fn(),
    recordNotify: jest.fn(),
    recordRefund: jest.fn(),
    findByTransactionUniqueId: jest.fn(),
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
    syncIssuerBalanceSafely: jest.fn().mockResolvedValue({ synced: true }),
    toBalance: jest.requireActual('../../../services/walletBalanceSync').toBalance,
}))

const { callback } = require('../pinelabs')
const { findByExternalCardIdentifier } = require('../../../models/use-cases/cardIssuance')
const { recordNotify, recordRefund, findByTransactionUniqueId } = require('../../../models/use-cases/cardTransaction')
const { findBySvcCardNumber } = require('../../../models/use-cases/corporateCardAdminApplication')
const { syncIssuerBalanceSafely } = require('../../../services/walletBalanceSync')
const { customLog } = require('../../../utils/loggerHelper')
const { BALANCE_SYNC } = require('../../../constants/ledger')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const SVC = '6312900020000003'

/** The payload shape Pine Labs actually posts to /callback. */
const notifyBody = (transactionDetail = {}) => ({
    transactionUniqueId: 16680223570,
    notificationUniqueId: 70166802235,
    cardDetail: {
        externalCardIdentifier: 'PKCARD77ccfbd473564903921ec4fe0baab19f',
        maskedCardNumber: '608363******3657',
    },
    merchantDetail: { mcc: '5999', merchantName: 'PinePerk_Test_MerchantT' },
    transactionDetail: {
        transactionAmount: 50,
        transactionType: 2,
        transferCardNumber: SVC,
        transferCardBalance: 4750,
        ...transactionDetail,
    },
})

const post = (body) => callback({ body, LogTraceId: 't', originalUrl: '/callback' }, buildRes())

beforeEach(() => {
    jest.clearAllMocks()
    recordNotify.mockResolvedValue({ id: 5, corporateId: 42 })
    findByTransactionUniqueId.mockResolvedValue({ id: 5, corporateId: 42 })
    recordRefund.mockResolvedValue({ id: 6 })
    findByExternalCardIdentifier.mockResolvedValue({ id: 7, corporateId: 42 })
    findBySvcCardNumber.mockResolvedValue({ corporateId: 42, svcCardNumber: SVC })
    syncIssuerBalanceSafely.mockResolvedValue({ synced: true })
})

/**
 * The bug this file exists for: the callback recorded `issuerWalletBalance` onto the transaction row and
 * stopped. The wallet is derived from the ledger, so nothing the corporate can see ever changed.
 */
describe('JIT NOTIFY wallet balance sync', () => {
    it('syncs the wallet to the balance the issuer reported', async () => {
        await post(notifyBody())

        expect(syncIssuerBalanceSafely).toHaveBeenCalledWith({
            corporateId: 42,
            issuerBalance: 4750,
            transactionUniqueId: 16680223570,
            phase: BALANCE_SYNC.PHASE.NOTIFY,
            logTraceId: 't',
        })
    })

    // AUTH already wrote a sync row keyed on the bare transaction id, and ccLedger_ref_unique allows one
    // per refId — sharing it would make this insert throw and be swallowed as "sync failed".
    it('asks for the NOTIFY phase, never the AUTH one', async () => {
        await post(notifyBody())

        expect(syncIssuerBalanceSafely.mock.calls[0][0].phase).toBe(BALANCE_SYNC.PHASE.NOTIFY)
        expect(syncIssuerBalanceSafely.mock.calls[0][0].phase).not.toBe(BALANCE_SYNC.PHASE.AUTH)
    })

    /**
     * A stand-in authorisation never reaches our JIT endpoint, so there is no transaction row — and that is
     * the largest drift there is. Skipping the sync here would leave it uncorrected forever.
     */
    it('still syncs when the transaction is unknown to us', async () => {
        recordNotify.mockResolvedValue(null)

        await post(notifyBody())

        expect(syncIssuerBalanceSafely).toHaveBeenCalledWith(
            expect.objectContaining({ corporateId: 42, issuerBalance: 4750 })
        )
    })

    // A corporate has one wallet, so identifying the corporate is the whole job.
    it('uses the corporate already stamped on the transaction row', async () => {
        await post(notifyBody())

        expect(findByExternalCardIdentifier).not.toHaveBeenCalled()
        expect(syncIssuerBalanceSafely).toHaveBeenCalledWith(
            expect.objectContaining({ corporateId: 42 })
        )
    })

    it('falls back to the transacting card when the row has no corporate', async () => {
        recordNotify.mockResolvedValue({ id: 5, corporateId: null })

        await post(notifyBody())

        expect(findByExternalCardIdentifier).toHaveBeenCalledWith('PKCARD77ccfbd473564903921ec4fe0baab19f')
        expect(syncIssuerBalanceSafely).toHaveBeenCalledWith(
            expect.objectContaining({ corporateId: 42 })
        )
    })

    /**
     * The pool card is shared funding infrastructure, not a per-corporate key. Requiring it to match a
     * stored svcCardNumber is what made this sync silently do nothing.
     */
    it('does not depend on recognising the funding pool card', async () => {
        findBySvcCardNumber.mockResolvedValue(null)

        await post(notifyBody())

        expect(syncIssuerBalanceSafely).toHaveBeenCalledWith(
            expect.objectContaining({ corporateId: 42, issuerBalance: 4750 })
        )
    })

    it('syncs an unrecognised transaction type when reasonCode is 0, since that is not a failure', async () => {
        await post(notifyBody({ reasonCode: 0, transactionType: 3, transferCardBalance: 5000 }))

        expect(syncIssuerBalanceSafely).toHaveBeenCalledWith(
            expect.objectContaining({ issuerBalance: 5000 })
        )
    })

    it('syncs a refund (transactionType 23), whose balance is the real post-refund figure', async () => {
        await post(notifyBody({ transactionType: 23, transferCardBalance: 4800 }))

        expect(syncIssuerBalanceSafely).toHaveBeenCalledWith(
            expect.objectContaining({ issuerBalance: 4800 })
        )
    })

    it('syncs a reversal that reports a real non-zero balance, so the refunded balance is reflected', async () => {
        await post(notifyBody({ reasonCode: 1, transferCardBalance: 4750 }))

        expect(syncIssuerBalanceSafely).toHaveBeenCalledWith(
            expect.objectContaining({ issuerBalance: 4750 })
        )
    })

    /**
     * The issuer reports transferCardBalance as 0 on a failed transaction. Taken at face value that reads as
     * "the wallet is empty" and would write a debit adjustment draining the ledger to zero.
     */
    describe('never uses a zero balance to update the wallet', () => {
        it.each([[1], [2], [3], [4], [5]])('skips the sync for reasonCode %p with a zero balance', async (reasonCode) => {
            await post(notifyBody({ reasonCode, transferCardBalance: 0 }))

            expect(syncIssuerBalanceSafely).not.toHaveBeenCalled()
            expect(findByExternalCardIdentifier).not.toHaveBeenCalled()
        })

        it('skips the sync for a transactionType 18 reversal with a zero balance', async () => {
            await post(notifyBody({ transactionType: 18, reasonCode: 2, transferCardBalance: 0 }))

            expect(syncIssuerBalanceSafely).not.toHaveBeenCalled()
        })

        it('skips a zero even on a successful debit', async () => {
            await post(notifyBody({ transactionType: 2, reasonCode: 0, transferCardBalance: 0 }))

            expect(syncIssuerBalanceSafely).not.toHaveBeenCalled()
        })

        it('skips a zero sent as a string', async () => {
            await post(notifyBody({ reasonCode: 1, transferCardBalance: '0' }))

            expect(syncIssuerBalanceSafely).not.toHaveBeenCalled()
        })

        it('logs the skip with the failure context', async () => {
            await post(notifyBody({ reasonCode: 1, transferCardBalance: 0 }))

            expect(customLog).toHaveBeenCalledWith(
                't',
                'info',
                expect.objectContaining({
                    action: 'corporateCard:walletSync:skippedZeroBalance',
                    reasonCode: 1,
                    transactionUniqueId: 16680223570,
                }),
                'VENDOR'
            )
        })

        it('still marks the transaction reversed', async () => {
            await post(notifyBody({ reasonCode: 1, transferCardBalance: 0 }))

            expect(recordNotify).toHaveBeenCalledWith(
                16680223570,
                expect.objectContaining({ status: 'REVERSED' })
            )
        })

        it('still acknowledges the webhook', async () => {
            const res = buildRes()

            await callback(
                { body: notifyBody({ reasonCode: 1, transferCardBalance: 0 }), LogTraceId: 't', originalUrl: '/callback' },
                res
            )

            expect(res.status).toHaveBeenCalledWith(200)
        })
    })

    describe('refuses to move money it cannot attribute', () => {
        it('does not sync when the corporate cannot be identified at all', async () => {
            recordNotify.mockResolvedValue(null)
            findByExternalCardIdentifier.mockResolvedValue(null)

            await post(notifyBody())

            expect(syncIssuerBalanceSafely).not.toHaveBeenCalled()
            expect(customLog).toHaveBeenCalledWith(
                't',
                'error',
                expect.objectContaining({ message: expect.stringContaining('could not be attributed') }),
                'VENDOR'
            )
        })

        it('does not sync when the payload carries no card identifier', async () => {
            recordNotify.mockResolvedValue({ id: 5, corporateId: null })
            const body = notifyBody()
            delete body.cardDetail.externalCardIdentifier

            await post(body)

            expect(findByExternalCardIdentifier).not.toHaveBeenCalled()
            expect(syncIssuerBalanceSafely).not.toHaveBeenCalled()
        })

        // Nothing to compare against, so it must not even try to work out whose wallet it is.
        it('does not sync when the issuer reported no balance', async () => {
            recordNotify.mockResolvedValue({ id: 5, corporateId: null })

            await post(notifyBody({ transferCardBalance: null }))

            expect(findByExternalCardIdentifier).not.toHaveBeenCalled()
            expect(syncIssuerBalanceSafely).not.toHaveBeenCalled()
        })

        it('still syncs when the payload carries no transfer card number', async () => {
            await post(notifyBody({ transferCardNumber: undefined }))

            expect(syncIssuerBalanceSafely).toHaveBeenCalledWith(
                expect.objectContaining({ corporateId: 42, issuerBalance: 4750 })
            )
        })
    })

    // Pine Labs retries a callback it does not get a 200 for; a failed sync must not cause that.
    it('acknowledges the webhook even when the sync fails', async () => {
        syncIssuerBalanceSafely.mockResolvedValue({ synced: false, reason: 'error' })
        const res = buildRes()

        await callback({ body: notifyBody(), LogTraceId: 't', originalUrl: '/callback' }, res)

        expect(res.status).toHaveBeenCalledWith(200)
    })
})
