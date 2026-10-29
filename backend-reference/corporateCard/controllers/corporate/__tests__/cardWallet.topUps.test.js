jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../../models/use-cases/corporateCardLedger', () => ({ findAndCountByCorporate: jest.fn() }))
jest.mock('../../../models/use-cases/cardIssuance', () => ({ sumCardLimits: jest.fn() }))
jest.mock('../../../models/use-cases/corporateCardAdminApplication', () => ({ findByCorporate: jest.fn() }))
jest.mock('../../../services/walletBalance', () => ({ walletBalance: jest.fn() }))

const { listWalletTopUps } = require('../cardWallet')
const { findAndCountByCorporate } = require('../../../models/use-cases/corporateCardLedger')
const { TOPUP_HISTORY_TYPES } = require('../../../constants/ledger')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const req = (query = {}) => ({ user: { corporateId: 42 }, query })
const payload = (res) => res.json.mock.calls[0][0].data
const queryUsed = () => findAndCountByCorporate.mock.calls[0][0]

beforeEach(() => {
    jest.clearAllMocks()
    findAndCountByCorporate.mockResolvedValue({ count: 0, rows: [] })
})

describe('listWalletTopUps — what Top-up history may contain', () => {
    it('asks only for the money-in types a corporate actually topped up', async () => {
        await listWalletTopUps(req(), buildRes(), jest.fn())

        expect(queryUsed()).toMatchObject({
            corporateId: 42,
            direction: 'IN',
            entryTypes: TOPUP_HISTORY_TYPES,
        })
    })

    it('never asks for issuer balance corrections', async () => {
        await listWalletTopUps(req(), buildRes(), jest.fn())

        expect(queryUsed().entryTypes).not.toContain('CREDIT_ADJUSTMENT')
        expect(queryUsed().entryTypes).not.toContain('DEBIT_ADJUSTMENT')
    })

    describe('the type filter', () => {
        it('narrows to a single listable type', async () => {
            await listWalletTopUps(req({ type: 'CASHBACK' }), buildRes(), jest.fn())

            expect(queryUsed().entryTypes).toEqual(['CASHBACK'])
        })

        it('accepts a lowercase type', async () => {
            await listWalletTopUps(req({ type: 'topup' }), buildRes(), jest.fn())

            expect(queryUsed().entryTypes).toEqual(['TOPUP'])
        })

        it('refuses an adjustment type rather than returning an empty list', async () => {
            const next = jest.fn()

            await listWalletTopUps(req({ type: 'CREDIT_ADJUSTMENT' }), buildRes(), next)

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
            expect(findAndCountByCorporate).not.toHaveBeenCalled()
        })

        it('refuses an unknown type, so a typo is not read as "no top-ups"', async () => {
            const next = jest.fn()

            await listWalletTopUps(req({ type: 'BANANA' }), buildRes(), next)

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
            expect(findAndCountByCorporate).not.toHaveBeenCalled()
        })

        it('ignores an empty type', async () => {
            await listWalletTopUps(req({ type: '  ' }), buildRes(), jest.fn())

            expect(queryUsed().entryTypes).toEqual(TOPUP_HISTORY_TYPES)
        })
    })

    it('serialises a row with its source label and amount', async () => {
        findAndCountByCorporate.mockResolvedValue({
            count: 1,
            rows: [{ id: 5, occurredAt: '2026-08-01T10:00:00.000Z', reference: 'UTR123', entryType: 'TOPUP', amount: '25000.00' }],
        })
        const res = buildRes()

        await listWalletTopUps(req(), res, jest.fn())

        expect(payload(res)).toMatchObject({
            count: 1,
            rows: [{ id: 5, reference: 'UTR123', method: 'Top-up', status: 'Completed', amount: 25000 }],
        })
    })

    it('400s without a corporate context', async () => {
        const next = jest.fn()

        await listWalletTopUps({ user: {}, query: {} }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })
})
