const TX = { LOCK: { UPDATE: 'UPDATE' }, id: 'tx-1' }

jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../models/use-cases/corporateCardLedger', () => ({ createEntry: jest.fn() }))
jest.mock('../../models/use-cases/corporateCardAdminApplication', () => ({ lockByCorporate: jest.fn() }))
jest.mock('../walletBalance', () => ({ walletBalance: jest.fn() }))

const sequelize = require('../../configs/database/index')
const { syncIssuerBalance, syncIssuerBalanceSafely, toBalance } = require('../walletBalanceSync')
const { createEntry } = require('../../models/use-cases/corporateCardLedger')
const { lockByCorporate } = require('../../models/use-cases/corporateCardAdminApplication')
const { walletBalance } = require('../walletBalance')
const { customLog } = require('../../utils/loggerHelper')
const { BALANCE_SYNC, LEDGER_ENTRY_TYPE, LEDGER_DIRECTION } = require('../../constants/ledger')

const params = (over = {}) => ({
    corporateId: 42,
    issuerBalance: 5000,
    transactionUniqueId: 315946233470,
    logTraceId: 't',
    ...over,
})

beforeEach(() => {
    jest.clearAllMocks()
    sequelize.transaction.mockImplementation((cb) => cb(TX))
    createEntry.mockResolvedValue({ id: 11 })
    lockByCorporate.mockResolvedValue({ corporateId: 42 })
    walletBalance.mockResolvedValue(5000)
})

describe('toBalance', () => {
    it.each([
        [undefined, null],
        [null, null],
        ['', null],
        ['abc', null],
        [-1, null],
        [0, 0],
        ['5000.456', 5000.46],
    ])('maps %p to %p', (input, expected) => {
        expect(toBalance(input)).toBe(expected)
    })
})

describe('syncIssuerBalance', () => {
    describe('serialising against a concurrent authorisation', () => {
        it('takes a row lock on the corporate before measuring anything', async () => {
            walletBalance.mockResolvedValue(4800)

            await syncIssuerBalance(params())

            expect(lockByCorporate).toHaveBeenCalledWith(42, TX)
            expect(lockByCorporate.mock.invocationCallOrder[0]).toBeLessThan(
                walletBalance.mock.invocationCallOrder[0]
            )
        })

        it('measures our balance inside the lock, not before it', async () => {
            walletBalance.mockResolvedValue(4800)

            await syncIssuerBalance(params())

            expect(walletBalance).toHaveBeenCalledWith({ corporateId: 42, transaction: TX })
        })

        it('writes the adjustment in the same transaction as the measurement', async () => {
            walletBalance.mockResolvedValue(4800)

            await syncIssuerBalance(params())

            expect(createEntry).toHaveBeenCalledWith(expect.any(Object), { transaction: TX })
        })

        // The second authorisation re-measures after the first has committed, so it sees no gap left.
        it('writes nothing once an earlier correction has already closed the gap', async () => {
            walletBalance.mockResolvedValue(5000)

            const result = await syncIssuerBalance(params())

            expect(createEntry).not.toHaveBeenCalled()
            expect(result).toMatchObject({ synced: false, reason: 'in-step' })
        })
    })

    describe('the correction', () => {
        it('credits when the issuer holds more, for a top-up we never saw', async () => {
            walletBalance.mockResolvedValue(5000)

            const result = await syncIssuerBalance(params({ issuerBalance: 25000 }))

            expect(createEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    entryType: 'CREDIT_ADJUSTMENT',
                    direction: 'IN',
                    amount: 20000,
                    refType: BALANCE_SYNC.REF_TYPE,
                    refId: '315946233470',
                    reference: 'ISSUER-SYNC-315946233470',
                }),
                { transaction: TX }
            )
            expect(result).toMatchObject({ synced: true, delta: 20000 })
        })

        it('debits when the issuer holds less, for a transaction we never saw', async () => {
            walletBalance.mockResolvedValue(5000)

            await syncIssuerBalance(params({ issuerBalance: 4750 }))

            expect(createEntry).toHaveBeenCalledWith(
                expect.objectContaining({ entryType: 'DEBIT_ADJUSTMENT', direction: 'OUT', amount: 250 }),
                { transaction: TX }
            )
        })

        it('records both figures so the entry can be explained later', async () => {
            walletBalance.mockResolvedValue(5000)

            await syncIssuerBalance(params({ issuerBalance: 4750 }))

            expect(createEntry.mock.calls[0][0].metadata).toMatchObject({
                issuerBalance: 4750,
                ourBalance: 5000,
                delta: -250,
                transactionUniqueId: '315946233470',
            })
        })

        it('ignores sub-paisa float noise', async () => {
            walletBalance.mockResolvedValue(4999.999)

            await syncIssuerBalance(params())

            expect(createEntry).not.toHaveBeenCalled()
        })
    })

    describe('a large correction', () => {
        it('is still applied, and flagged for review at error level', async () => {
            walletBalance.mockResolvedValue(0)

            const result = await syncIssuerBalance(
                params({ issuerBalance: BALANCE_SYNC.REVIEW_THRESHOLD + 5000 })
            )

            expect(result).toMatchObject({ synced: true, needsReview: true })
            expect(createEntry.mock.calls[0][0].metadata).toMatchObject({ needsReview: true })
            expect(customLog).toHaveBeenCalledWith('t', 'error', expect.anything(), 'VENDOR')
        })
    })

    describe('guards', () => {
        it.each([
            ['no issuer balance', { issuerBalance: null }],
            ['an unparseable issuer balance', { issuerBalance: 'abc' }],
            ['a negative issuer balance', { issuerBalance: -100 }],
            ['no corporate', { corporateId: null }],
            ['no transaction to key the entry on', { transactionUniqueId: undefined }],
        ])('does nothing, and takes no lock, with %s', async (_label, over) => {
            const result = await syncIssuerBalance(params(over))

            expect(lockByCorporate).not.toHaveBeenCalled()
            expect(createEntry).not.toHaveBeenCalled()
            expect(result).toMatchObject({ synced: false, reason: 'not-comparable' })
        })
    })
})

/**
 * The issuer reports a balance twice per transaction — before it on AUTH, after it on NOTIFY — and
 * `ccLedger_ref_unique (refType, refId)` allows one sync row per refId. Sharing a refId between the two
 * phases makes the second insert throw, which `syncIssuerBalanceSafely` then swallows: the sync would look
 * wired up and do nothing.
 */
describe('phase separation', () => {
    const refOf = () => createEntry.mock.calls[0][0]

    it('keeps the bare transaction id for AUTH, so existing rows and their idempotency are untouched', async () => {
        walletBalance.mockResolvedValue(4000)

        await syncIssuerBalance(params({ issuerBalance: 5000 }))

        expect(refOf().refId).toBe('315946233470')
        expect(refOf().reference).toBe(`${BALANCE_SYNC.REFERENCE_PREFIX}-315946233470`)
    })

    it('gives NOTIFY its own refId so it cannot collide with the AUTH row', async () => {
        walletBalance.mockResolvedValue(4000)

        await syncIssuerBalance(params({ issuerBalance: 5000, phase: BALANCE_SYNC.PHASE.NOTIFY }))

        expect(refOf().refId).toBe('315946233470:notify')
        expect(refOf().metadata).toMatchObject({ phase: 'notify' })
    })
})

/**
 * The issuer's balance is the authority: a large gap is normally drift we cannot otherwise see — a missed
 * top-up, a spend we never got the AUTH for — so it is applied and flagged, never refused. There is
 * deliberately no ceiling.
 */
describe('large corrections', () => {
    const entry = () => createEntry.mock.calls[0][0]

    it('applies a missed top-up as a credit, however large', async () => {
        walletBalance.mockResolvedValue(2000)

        const result = await syncIssuerBalance(params({ issuerBalance: 10460295 }))

        expect(result).toMatchObject({ synced: true, needsReview: true })
        expect(entry()).toMatchObject({
            entryType: LEDGER_ENTRY_TYPE.CREDIT_ADJUSTMENT,
            direction: LEDGER_DIRECTION.IN,
            amount: 10458295,
        })
    })

    it('applies a shortfall as a debit, however large', async () => {
        walletBalance.mockResolvedValue(10460295)

        const result = await syncIssuerBalance(params({ issuerBalance: 2000 }))

        expect(result).toMatchObject({ synced: true, needsReview: true })
        expect(entry()).toMatchObject({
            entryType: LEDGER_ENTRY_TYPE.DEBIT_ADJUSTMENT,
            direction: LEDGER_DIRECTION.OUT,
            amount: 10458295,
        })
    })

    it('flags a correction past the review threshold without blocking it', async () => {
        walletBalance.mockResolvedValue(0)

        const result = await syncIssuerBalance(
            params({ issuerBalance: BALANCE_SYNC.REVIEW_THRESHOLD + 1 })
        )

        expect(result).toMatchObject({ synced: true, needsReview: true })
        expect(entry().metadata).toMatchObject({ needsReview: true })
        expect(customLog).toHaveBeenCalledWith(
            't',
            'error',
            expect.objectContaining({ message: expect.stringContaining('unusually large') }),
            'VENDOR'
        )
    })

    it('leaves an ordinary correction unflagged', async () => {
        walletBalance.mockResolvedValue(4000)

        const result = await syncIssuerBalance(params({ issuerBalance: 5000 }))

        expect(result).toMatchObject({ synced: true, needsReview: false })
        expect(entry().metadata.needsReview).toBeUndefined()
    })
})

describe('syncIssuerBalanceSafely', () => {
    it('swallows a lock timeout so an authorisation is never lost to it', async () => {
        lockByCorporate.mockRejectedValue(new Error('lock wait timeout'))

        const result = await syncIssuerBalanceSafely(params({ issuerBalance: 4750 }))

        expect(result).toMatchObject({ synced: false, reason: 'error' })
        expect(customLog).toHaveBeenCalledWith(
            't',
            'error',
            expect.objectContaining({ message: expect.stringContaining('decision is unaffected') }),
            'VENDOR'
        )
    })
})
