jest.mock('../../../models/use-cases/cardStatement', () => ({ buildStatement: jest.fn() }))
jest.mock('../../../utils/statementPdf', () => ({ renderStatementPdf: jest.fn() }))
// Without this the suite would make a real request to Firebase for the brand mark.
jest.mock('../../../utils/imageToDataUri', () => ({ fetchAsDataUri: jest.fn() }))

const { exportStatementPdf } = require('../cardAccount')
const { buildStatement } = require('../../../models/use-cases/cardStatement')
const { renderStatementPdf } = require('../../../utils/statementPdf')
const { fetchAsDataUri } = require('../../../utils/imageToDataUri')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    res.send = jest.fn().mockReturnValue(res)
    res.setHeader = jest.fn()
    return res
}

const adminReq = (overrides = {}) => ({
    user: {
        role: 'CORPORATE',
        corporateId: 42,
        id: 5,
        companyName: 'Peko Technologies Private Limited',
        city: 'Kochi',
        country: 'India',
    },
    query: { month: '2026-08' },
    ...overrides,
})

const statement = (overrides = {}) => ({
    openingBalance: 1000,
    moneyIn: 500,
    moneyOut: 200,
    closingBalance: 1300,
    rows: [
        { date: '2026-08-04T00:00:00.000Z', description: 'Zomato Ltd', reference: 'TXN9', type: 'Card spend', moneyIn: null, moneyOut: 200, balance: 800, kind: 'txn' },
    ],
    truncated: false,
    ...overrides,
})

const headers = (res) => Object.fromEntries(res.setHeader.mock.calls)

describe('exportStatementPdf', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        buildStatement.mockResolvedValue(statement())
        renderStatementPdf.mockResolvedValue(Buffer.from('%PDF-1.4 statement'))
        fetchAsDataUri.mockResolvedValue('data:image/png;base64,AAAA')
    })

    it('inlines the brand mark before rendering, never handing the page a URL', async () => {
        await exportStatementPdf(adminReq(), buildRes(), jest.fn())

        expect(fetchAsDataUri).toHaveBeenCalledWith(expect.stringMatching(/^https?:\/\//))
        const [{ logo, branding }] = renderStatementPdf.mock.calls[0]
        expect(logo).toBe('data:image/png;base64,AAAA')
        expect(branding).toBe('Peko')
    })

    // The brand mark is decoration; the figures are the document. A logo host being slow or blocked
    // must never cost the admin their statement.
    it('still produces the statement when the brand mark cannot be resolved', async () => {
        fetchAsDataUri.mockResolvedValue(undefined)
        const res = buildRes()

        await exportStatementPdf(adminReq(), res, jest.fn())

        expect(res.status).toHaveBeenCalledWith(200)
        expect(renderStatementPdf.mock.calls[0][0].logo).toBeUndefined()
    })

    it('400s without a corporate context', async () => {
        const next = jest.fn()

        await exportStatementPdf(adminReq({ user: {} }), buildRes(), next)

        expect(renderStatementPdf).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it.each([['2026-8'], ['August'], ['2026-13'], [''], ['2026-08-04']])(
        'rejects %p as a month rather than rendering something arbitrary',
        async (month) => {
            const next = jest.fn()

            await exportStatementPdf(adminReq({ query: { month } }), buildRes(), next)

            expect(buildStatement).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        }
    )

    it('answers with the pdf bytes and a download filename carrying the period', async () => {
        const res = buildRes()

        await exportStatementPdf(adminReq(), res, jest.fn())

        expect(headers(res)['Content-Type']).toBe('application/pdf')
        expect(headers(res)['Content-Disposition']).toBe('attachment; filename="account-statement-2026-08.pdf"')
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.send.mock.calls[0][0].toString()).toContain('%PDF-')
    })

    it('sets a content length matching the body, so the download reports progress', async () => {
        const pdf = Buffer.from('%PDF-1.4 statement')
        renderStatementPdf.mockResolvedValue(pdf)
        const res = buildRes()

        await exportStatementPdf(adminReq(), res, jest.fn())

        expect(headers(res)['Content-Length']).toBe(pdf.length)
    })

    // The document must cover the whole period, not the page the admin happens to be looking at.
    it('renders every row of the period plus both balance markers', async () => {
        buildStatement.mockResolvedValue(statement({
            rows: Array.from({ length: 120 }, (_, i) => ({
                date: '2026-08-04T00:00:00.000Z', description: `spend ${i}`, reference: `r${i}`, type: 'Card spend',
                moneyIn: null, moneyOut: 1, balance: 1, kind: 'txn',
            })),
        }))

        await exportStatementPdf(adminReq(), buildRes(), jest.fn())

        const [{ rows }] = renderStatementPdf.mock.calls[0]
        expect(rows).toHaveLength(122)
        expect(rows[0].kind).toBe('opening')
        expect(rows[121].kind).toBe('closing')
    })

    it('takes the letterhead identity from the session, never from the query', async () => {
        await exportStatementPdf(adminReq({ query: { month: '2026-08', companyName: 'Attacker Ltd' } }), buildRes(), jest.fn())

        const [{ corporate }] = renderStatementPdf.mock.calls[0]
        expect(corporate).toEqual({
            corporateId: 42,
            companyName: 'Peko Technologies Private Limited',
            city: 'Kochi',
            country: 'India',
        })
    })

    it('passes the truncation flag through so the document can admit it', async () => {
        buildStatement.mockResolvedValue(statement({ truncated: true }))

        await exportStatementPdf(adminReq(), buildRes(), jest.fn())

        expect(renderStatementPdf.mock.calls[0][0].truncated).toBe(true)
    })

    // A "downloaded" file that will not open is the corruption class this project has already been
    // bitten by: never answer with a non-PDF body under a PDF content type.
    it('fails the request outright when the render throws, sending no body', async () => {
        renderStatementPdf.mockRejectedValue(new Error('Navigation timeout'))
        const res = buildRes()
        const next = jest.fn()

        await exportStatementPdf(adminReq(), res, next)

        expect(res.send).not.toHaveBeenCalled()
        expect(res.setHeader).not.toHaveBeenCalledWith('Content-Type', 'application/pdf')
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 500 }))
    })

    it('answers 503 with a try-again message when the render queue is full', async () => {
        const err = new Error('PDF render queue full')
        err.code = 'PDF_QUEUE_FULL'
        err.status = 503
        renderStatementPdf.mockRejectedValue(err)
        const next = jest.fn()

        await exportStatementPdf(adminReq(), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 503 }))
        expect(next.mock.calls[0][0].message).toMatch(/busy/i)
    })

    it('never leaks the renderer error to the caller', async () => {
        renderStatementPdf.mockRejectedValue(new Error('spawn /root/.cache/chromium ENOENT'))
        const next = jest.fn()

        await exportStatementPdf(adminReq(), buildRes(), next)

        expect(next.mock.calls[0][0].message).not.toMatch(/chromium|ENOENT|spawn/i)
    })
})
