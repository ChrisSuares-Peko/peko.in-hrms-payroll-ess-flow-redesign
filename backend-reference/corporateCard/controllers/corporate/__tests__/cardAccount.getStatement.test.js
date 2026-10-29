const { getStatement } = require('../cardAccount')
const { buildStatement } = require('../../../models/use-cases/cardStatement')

jest.mock('../../../models/use-cases/cardStatement', () => ({ buildStatement: jest.fn() }))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const adminReq = (query = {}) => ({
    user: { role: 'CORPORATE', corporateId: 42, id: 5 },
    query: { month: '2026-07', ...query },
})

const dataOf = (res) => res.json.mock.calls[0][0].data
const kindsOf = (res) => dataOf(res).rows.map((r) => r.kind)

const movements = (n) =>
    Array.from({ length: n }, (_, i) => ({
        date: `2026-07-${String((i % 28) + 1).padStart(2, '0')}T00:00:00.000Z`,
        description: `movement ${i + 1}`,
        reference: `ref-${i + 1}`,
        type: 'Top-up',
        direction: 'IN',
        moneyIn: 100,
        moneyOut: null,
        balance: (i + 1) * 100,
        kind: 'txn',
    }))

const statement = (rowCount) => ({
    openingBalance: 0,
    moneyIn: rowCount * 100,
    moneyOut: 0,
    closingBalance: rowCount * 100,
    rows: movements(rowCount),
    truncated: false,
})

describe('getStatement — rows paginate, summary does not', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns the whole-month summary unchanged on every page', async () => {
        buildStatement.mockResolvedValue(statement(25))

        const pages = []
        for (const page of [1, 2, 3]) {
            const res = buildRes()
            // eslint-disable-next-line no-await-in-loop
            await getStatement(adminReq({ page: String(page), itemsPerPage: '10' }), res, jest.fn())
            pages.push(dataOf(res))
        }

        const expected = { openingBalance: 0, moneyIn: 2500, moneyOut: 0, closingBalance: 2500 }
        expect(pages.map((p) => p.summary)).toEqual([expected, expected, expected])
        expect(pages.map((p) => p.count)).toEqual([25, 25, 25])
    })

    it('windows the movements and keeps each page balance continuous with the previous one', async () => {
        buildStatement.mockResolvedValue(statement(25))

        const first = buildRes()
        await getStatement(adminReq({ page: '1', itemsPerPage: '10' }), first, jest.fn())
        const second = buildRes()
        await getStatement(adminReq({ page: '2', itemsPerPage: '10' }), second, jest.fn())

        const firstTxns = dataOf(first).rows.filter((r) => r.kind === 'txn')
        const secondTxns = dataOf(second).rows.filter((r) => r.kind === 'txn')
        expect(firstTxns).toHaveLength(10)
        expect(secondTxns).toHaveLength(10)
        expect(firstTxns[9].balance).toBe(1000)
        expect(secondTxns[0].balance).toBe(1100)
        expect(secondTxns[0].description).toBe('movement 11')
    })

    it('leads the first page with the opening marker only', async () => {
        buildStatement.mockResolvedValue(statement(25))

        const res = buildRes()
        await getStatement(adminReq({ page: '1', itemsPerPage: '10' }), res, jest.fn())

        expect(kindsOf(res)[0]).toBe('opening')
        expect(kindsOf(res)).not.toContain('closing')
    })

    it('tails the last page with the closing marker only', async () => {
        buildStatement.mockResolvedValue(statement(25))

        const res = buildRes()
        await getStatement(adminReq({ page: '3', itemsPerPage: '10' }), res, jest.fn())

        const kinds = kindsOf(res)
        expect(kinds).not.toContain('opening')
        expect(kinds[kinds.length - 1]).toBe('closing')
        expect(kinds.filter((k) => k === 'txn')).toHaveLength(5)
    })

    it('keeps both markers when a single page holds the whole month', async () => {
        buildStatement.mockResolvedValue(statement(3))

        const res = buildRes()
        await getStatement(adminReq({ itemsPerPage: '10' }), res, jest.fn())

        expect(kindsOf(res)).toEqual(['opening', 'txn', 'txn', 'txn', 'closing'])
    })

    it('still shows both markers for a month with no movements', async () => {
        buildStatement.mockResolvedValue(statement(0))

        const res = buildRes()
        await getStatement(adminReq(), res, jest.fn())

        expect(kindsOf(res)).toEqual(['opening', 'closing'])
        expect(dataOf(res).count).toBe(0)
    })

    it('manufactures no marker for a page past the end', async () => {
        buildStatement.mockResolvedValue(statement(25))

        const res = buildRes()
        await getStatement(adminReq({ page: '9', itemsPerPage: '10' }), res, jest.fn())

        expect(dataOf(res).rows).toEqual([])
    })

    it('rejects a malformed month before touching the statement builder', async () => {
        const next = jest.fn()
        await getStatement(adminReq({ month: '2026-13' }), buildRes(), next)

        expect(buildStatement).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('builds the statement for the session corporate, never a route-supplied one', async () => {
        buildStatement.mockResolvedValue(statement(1))

        await getStatement(
            { ...adminReq(), params: { corporateId: '999' } },
            buildRes(),
            jest.fn()
        )

        expect(buildStatement).toHaveBeenCalledWith(expect.objectContaining({ corporateId: 42 }))
    })
})
