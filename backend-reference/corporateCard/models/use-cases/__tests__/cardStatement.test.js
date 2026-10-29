const { Op } = require('sequelize')
const ledger = require('../../entities/corporateCardLedgerEntry')
const cardTransaction = require('../../entities/cardTransaction')
const { buildStatement } = require('../cardStatement')

jest.mock('../../entities/corporateCardLedgerEntry', () => ({ findOne: jest.fn(), findAll: jest.fn() }))
jest.mock('../../entities/cardTransaction', () => ({ findOne: jest.fn(), findAll: jest.fn() }))

const monthStart = new Date('2026-07-01T00:00:00.000Z')
const monthEnd = new Date('2026-08-01T00:00:00.000Z')

const mockOpening = ({ inBefore, outBefore, spendBefore }) => {
    ledger.findOne
        .mockResolvedValueOnce({ total: inBefore })
        .mockResolvedValueOnce({ total: outBefore })
    cardTransaction.findOne.mockResolvedValueOnce({ total: spendBefore })
}

describe('buildStatement', () => {
    beforeEach(() => jest.clearAllMocks())

    it('derives opening balance as (ledgerIn - ledgerOut - cardSpend) before the month', async () => {
        mockOpening({ inBefore: '1000', outBefore: '100', spendBefore: '200' })
        ledger.findAll.mockResolvedValue([])
        cardTransaction.findAll.mockResolvedValue([])

        const result = await buildStatement({ corporateId: 42, monthStart, monthEnd })

        expect(result).toMatchObject({ openingBalance: 700, moneyIn: 0, moneyOut: 0, closingBalance: 700, rows: [], truncated: false })
    })

    it('scopes the opening sums to before the month, card spend to AUTHORIZED only', async () => {
        mockOpening({ inBefore: '0', outBefore: '0', spendBefore: '0' })
        ledger.findAll.mockResolvedValue([])
        cardTransaction.findAll.mockResolvedValue([])

        await buildStatement({ corporateId: 42, monthStart, monthEnd })

        const inCall = ledger.findOne.mock.calls[0][0]
        expect(inCall.where).toEqual(expect.objectContaining({ corporateId: 42, direction: 'IN' }))
        expect(inCall.where.occurredAt[Op.lt]).toEqual(monthStart)
        expect(inCall.raw).toBe(true)
        expect(ledger.findOne.mock.calls[1][0].where).toEqual(expect.objectContaining({ corporateId: 42, direction: 'OUT' }))
        const spendCall = cardTransaction.findOne.mock.calls[0][0]
        expect(spendCall.where).toEqual(expect.objectContaining({ corporateId: 42, decision: 'AUTHORIZED' }))
        expect(spendCall.where.createdAt[Op.lt]).toEqual(monthStart)
    })

    it('windows the in-month queries to [monthStart, monthEnd) and AUTHORIZED spend', async () => {
        mockOpening({ inBefore: '0', outBefore: '0', spendBefore: '0' })
        ledger.findAll.mockResolvedValue([])
        cardTransaction.findAll.mockResolvedValue([])

        await buildStatement({ corporateId: 42, monthStart, monthEnd })

        const ledgerCall = ledger.findAll.mock.calls[0][0]
        expect(ledgerCall.where.corporateId).toBe(42)
        expect(ledgerCall.where.occurredAt[Op.gte]).toEqual(monthStart)
        expect(ledgerCall.where.occurredAt[Op.lt]).toEqual(monthEnd)
        const spendCall = cardTransaction.findAll.mock.calls[0][0]
        expect(spendCall.where).toEqual(expect.objectContaining({ corporateId: 42, decision: 'AUTHORIZED' }))
        expect(spendCall.where.createdAt[Op.gte]).toEqual(monthStart)
        expect(spendCall.where.createdAt[Op.lt]).toEqual(monthEnd)
    })

    it('merges ledger + card-spend rows, sorts by time, and threads a running balance', async () => {
        mockOpening({ inBefore: '1000', outBefore: '100', spendBefore: '200' })
        ledger.findAll.mockResolvedValue([
            { occurredAt: '2026-07-05T10:00:00.000Z', direction: 'OUT', amount: '50', entryType: 'FEE', description: 'Monthly fee', reference: null },
            { occurredAt: '2026-07-02T10:00:00.000Z', direction: 'IN', amount: '500', entryType: 'TOPUP', description: null, reference: 'UTR1' },
        ])
        cardTransaction.findAll.mockResolvedValue([
            { createdAt: '2026-07-03T10:00:00.000Z', transactionAmount: '200', merchantName: 'Amazon', referenceNumber: 'REF9', displayId: 'CC000001' },
        ])

        const result = await buildStatement({ corporateId: 42, monthStart, monthEnd })

        expect(result.rows).toEqual([
            { date: '2026-07-02T10:00:00.000Z', description: 'Top-up', reference: 'UTR1', type: 'Top-up', direction: 'IN', moneyIn: 500, moneyOut: null, balance: 1200, kind: 'txn' },
            { date: '2026-07-03T10:00:00.000Z', description: 'Amazon', reference: 'REF9', type: 'Card spend', direction: 'OUT', moneyIn: null, moneyOut: 200, balance: 1000, kind: 'txn' },
            { date: '2026-07-05T10:00:00.000Z', description: 'Monthly fee', reference: '', type: 'Fee', direction: 'OUT', moneyIn: null, moneyOut: 50, balance: 950, kind: 'txn' },
        ])
        expect(result).toMatchObject({ openingBalance: 700, moneyIn: 500, moneyOut: 250, closingBalance: 950, truncated: false })
    })

    it('falls back to the entryType label / spend defaults for description + reference', async () => {
        mockOpening({ inBefore: '0', outBefore: '0', spendBefore: '0' })
        ledger.findAll.mockResolvedValue([
            { occurredAt: '2026-07-02T10:00:00.000Z', direction: 'IN', amount: '10', entryType: 'CASHBACK', description: null, reference: null },
        ])
        cardTransaction.findAll.mockResolvedValue([
            { createdAt: '2026-07-03T10:00:00.000Z', transactionAmount: '5', merchantName: null, referenceNumber: null, displayId: null },
        ])

        const result = await buildStatement({ corporateId: 42, monthStart, monthEnd })

        expect(result.rows[0]).toMatchObject({ description: 'Cashback', type: 'Cashback', reference: '' })
        expect(result.rows[1]).toMatchObject({ description: 'Card spend', type: 'Card spend', reference: '' })
    })

    describe('issuer balance corrections', () => {
        const syncEntry = (direction, amount) => ({
            occurredAt: '2026-07-05T10:00:00.000Z',
            direction,
            amount,
            entryType: direction === 'IN' ? 'CREDIT_ADJUSTMENT' : 'DEBIT_ADJUSTMENT',
            description: 'Balance corrected to match the card issuer',
            reference: 'ISSUER-SYNC-315946233470',
        })

        it('shows a correction that adds money as money in, and moves the balance up', async () => {
            mockOpening({ inBefore: '5000', outBefore: '0', spendBefore: '0' })
            ledger.findAll.mockResolvedValue([syncEntry('IN', '250')])
            cardTransaction.findAll.mockResolvedValue([])

            const result = await buildStatement({ corporateId: 42, monthStart, monthEnd })

            expect(result.rows[0]).toMatchObject({
                description: 'Balance corrected to match the card issuer',
                type: 'Adjustment',
                reference: 'ISSUER-SYNC-315946233470',
                moneyIn: 250,
                moneyOut: null,
                balance: 5250,
            })
            expect(result).toMatchObject({ moneyIn: 250, moneyOut: 0, closingBalance: 5250 })
        })

        it('shows a correction that removes money as money out, and moves the balance down', async () => {
            mockOpening({ inBefore: '5000', outBefore: '0', spendBefore: '0' })
            ledger.findAll.mockResolvedValue([syncEntry('OUT', '250')])
            cardTransaction.findAll.mockResolvedValue([])

            const result = await buildStatement({ corporateId: 42, monthStart, monthEnd })

            expect(result.rows[0]).toMatchObject({
                description: 'Balance corrected to match the card issuer',
                type: 'Adjustment',
                moneyIn: null,
                moneyOut: 250,
                balance: 4750,
            })
            expect(result).toMatchObject({ moneyIn: 0, moneyOut: 250, closingBalance: 4750 })
        })

        it('keeps the running balance right when a correction sits between two card spends', async () => {
            mockOpening({ inBefore: '5000', outBefore: '0', spendBefore: '0' })
            ledger.findAll.mockResolvedValue([syncEntry('OUT', '100')])
            cardTransaction.findAll.mockResolvedValue([
                { createdAt: '2026-07-04T10:00:00.000Z', transactionAmount: '500', merchantName: 'Before', referenceNumber: null, displayId: null },
                { createdAt: '2026-07-06T10:00:00.000Z', transactionAmount: '400', merchantName: 'After', referenceNumber: null, displayId: null },
            ])

            const result = await buildStatement({ corporateId: 42, monthStart, monthEnd })

            expect(result.rows.map((r) => r.balance)).toEqual([4500, 4400, 4000])
            expect(result.closingBalance).toBe(4000)
        })
    })

    // Confirmed against a real UAT statement (2026-09-14): a refund row (its own linked row, eventType
    // REFUND) showed up as an outgoing "Card spend" instead of an incoming credit, because this query
    // originally summed every AUTHORIZED cardTransaction row as spend with no eventType awareness.
    describe('refund rows', () => {
        it('shows a refund as money in, labelled Refund, not as an outgoing Card spend', async () => {
            mockOpening({ inBefore: '5000', outBefore: '0', spendBefore: '0' })
            ledger.findAll.mockResolvedValue([])
            cardTransaction.findAll.mockResolvedValue([
                {
                    createdAt: '2026-07-03T10:00:00.000Z',
                    transactionAmount: '1000',
                    merchantName: 'PinePerk_Test_MerchantT',
                    referenceNumber: 'REF9',
                    displayId: 'CC000080',
                    eventType: 'REFUND',
                },
            ])

            const result = await buildStatement({ corporateId: 42, monthStart, monthEnd })

            expect(result.rows[0]).toMatchObject({
                description: 'PinePerk_Test_MerchantT',
                type: 'Refund',
                direction: 'IN',
                moneyIn: 1000,
                moneyOut: null,
                balance: 6000,
            })
            expect(result).toMatchObject({ moneyIn: 1000, moneyOut: 0, closingBalance: 6000 })
        })

        it('nets a refund against a same-month debit for the in-month totals and running balance', async () => {
            mockOpening({ inBefore: '5000', outBefore: '0', spendBefore: '0' })
            ledger.findAll.mockResolvedValue([])
            cardTransaction.findAll.mockResolvedValue([
                { createdAt: '2026-07-03T10:00:00.000Z', transactionAmount: '1000', merchantName: 'Merchant', referenceNumber: null, displayId: 'CC000061', eventType: 'AUTH' },
                { createdAt: '2026-07-05T10:00:00.000Z', transactionAmount: '1000', merchantName: 'Merchant', referenceNumber: null, displayId: 'CC000080', eventType: 'REFUND' },
            ])

            const result = await buildStatement({ corporateId: 42, monthStart, monthEnd })

            expect(result.rows.map((r) => ({ type: r.type, moneyIn: r.moneyIn, moneyOut: r.moneyOut, balance: r.balance }))).toEqual([
                { type: 'Card spend', moneyIn: null, moneyOut: 1000, balance: 4000 },
                { type: 'Refund', moneyIn: 1000, moneyOut: null, balance: 5000 },
            ])
            expect(result).toMatchObject({ openingBalance: 5000, moneyIn: 1000, moneyOut: 1000, closingBalance: 5000 })
        })

        // sumNetCardSpend (the opening-balance query) must also subtract a refund from an earlier month,
        // not just the in-month row mapping — otherwise the opening balance stays wrong even after the
        // refund itself displays correctly.
        it('excludes a prior-month refund from net spend when computing the opening balance', async () => {
            cardTransaction.findOne.mockResolvedValueOnce({ total: '-1000' })
            ledger.findOne
                .mockResolvedValueOnce({ total: '5000' })
                .mockResolvedValueOnce({ total: '0' })
            ledger.findAll.mockResolvedValue([])
            cardTransaction.findAll.mockResolvedValue([])

            const result = await buildStatement({ corporateId: 42, monthStart, monthEnd })

            // spendBefore net = -1000 (a refund with no matching debit counted before this window) means
            // openingBalance = inBefore - outBefore - spendBefore = 5000 - 0 - (-1000) = 6000.
            expect(result.openingBalance).toBe(6000)
        })
    })

    it('flags truncation when a source hits the 5000-row cap', async () => {
        mockOpening({ inBefore: '0', outBefore: '0', spendBefore: '0' })
        ledger.findAll.mockResolvedValue(
            Array.from({ length: 5000 }, () => ({ occurredAt: '2026-07-02T10:00:00.000Z', direction: 'IN', amount: '1', entryType: 'TOPUP', description: null, reference: null }))
        )
        cardTransaction.findAll.mockResolvedValue([])

        const result = await buildStatement({ corporateId: 42, monthStart, monthEnd })

        expect(result.truncated).toBe(true)
    })
})
