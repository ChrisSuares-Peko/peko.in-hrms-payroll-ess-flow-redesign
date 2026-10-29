jest.mock('../puppeteerPool', () => ({ renderPdf: jest.fn() }))

const { renderPdf } = require('../puppeteerPool')
const { buildStatementHtml, renderStatementPdf, money, periodLabel, monthLabel, stampLabel } = require('../statementPdf')

const MONTH_START = new Date('2026-08-01T00:00:00.000+05:30')
const MONTH_END = new Date('2026-09-01T00:00:00.000+05:30')

const statement = (overrides = {}) => ({
    corporate: { corporateId: 42, companyName: 'Peko Technologies Private Limited', city: 'Kochi', country: 'India' },
    month: '2026-08',
    monthStart: MONTH_START,
    monthEnd: MONTH_END,
    summary: { openingBalance: 125000, moneyIn: 400000, moneyOut: 250000, closingBalance: 275000 },
    rows: [
        { date: MONTH_START, description: 'Opening balance', reference: '', type: '', moneyOut: null, moneyIn: null, balance: 125000, kind: 'opening' },
        { date: MONTH_START, description: 'Zomato Ltd', reference: 'TXN99', type: 'Card spend', moneyOut: 1731.5, moneyIn: null, balance: 123268.5, kind: 'txn' },
        { date: MONTH_END, description: 'Closing balance', reference: '', type: '', moneyOut: 250000, moneyIn: 400000, balance: 275000, kind: 'closing' },
    ],
    truncated: false,
    generatedAt: new Date('2026-08-12T13:10:00.000Z'),
    ...overrides,
})

describe('statement PDF — escaping', () => {
    // The rendered HTML is handed to a Chromium started with --no-sandbox, and descriptions/references
    // carry merchant names and admin-typed text. An unescaped tag is an outbound request from inside
    // the render, so this is the property that matters most in this file.
    it('escapes a merchant name that contains markup', () => {
        const html = buildStatementHtml(statement({
            rows: [{ date: MONTH_START, description: '<img src=x onerror=alert(1)>', reference: '', type: 'Card spend', moneyOut: 10, moneyIn: null, balance: 1, kind: 'txn' }],
        }))

        expect(html).not.toContain('<img src=x')
        expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    })

    it('escapes a reference that tries to close the cell and open a tag', () => {
        const html = buildStatementHtml(statement({
            rows: [{ date: MONTH_START, description: 'Spend', reference: '</td></tr><script>fetch("//evil")</script>', type: '', moneyOut: 1, moneyIn: null, balance: 1, kind: 'txn' }],
        }))

        expect(html).not.toContain('<script>')
        expect(html).toContain('&lt;/td&gt;&lt;/tr&gt;')
    })

    it('escapes the company name from the session', () => {
        const html = buildStatementHtml(statement({
            corporate: { corporateId: 1, companyName: '<style>@import url(//evil)</style>Acme' },
        }))

        expect(html).not.toContain('<style>@import')
        expect(html).toContain('&lt;style&gt;')
    })
})

describe('statement PDF — document content', () => {
    it('states the period inclusively, not to the exclusive range end', () => {
        expect(periodLabel(MONTH_START, MONTH_END)).toBe('01 Aug 2026 to 31 Aug 2026')
    })

    it('titles the document with the selected month and year', () => {
        expect(monthLabel(MONTH_START)).toBe('August 2026')
    })

    it('stamps the generation time in IST with an upper-case meridiem', () => {
        expect(stampLabel(new Date('2026-08-12T13:10:00.000Z'))).toBe('12 Aug 2026, 6:40 PM IST')
    })

    it('groups amounts the Indian way and always to two decimals', () => {
        expect(money(125000)).toBe('1,25,000.00')
        expect(money(1731.5)).toBe('1,731.50')
        expect(money(0)).toBe('0.00')
    })

    it('renders an empty cell rather than a zero for an absent amount', () => {
        expect(money(null)).toBe('')
        expect(money(undefined)).toBe('')
        expect(money('')).toBe('')
    })

    it('carries the four summary figures and the account it belongs to', () => {
        const html = buildStatementHtml(statement())

        expect(html).toContain('1,25,000.00')
        expect(html).toContain('4,00,000.00')
        expect(html).toContain('2,50,000.00')
        expect(html).toContain('2,75,000.00')
        expect(html).toContain('Peko Technologies Private Limited')
    })

    it('marks the opening and closing rows so they read as balances, not movements', () => {
        const html = buildStatementHtml(statement())

        expect(html).toContain('class="marker opening"')
        expect(html).toContain('class="marker closing"')
        expect(html).toContain('End of period')
    })

    it('says so plainly when the period holds no movements', () => {
        const html = buildStatementHtml(statement({ rows: [] }))

        expect(html).toContain('No transactions were recorded in this period')
    })

    it('warns on the document itself when the row cap truncated the period', () => {
        const html = buildStatementHtml(statement({ truncated: true }))

        expect(html).toContain('incomplete')
        expect(html).toContain('CSV export')
    })

    it('omits the truncation warning otherwise', () => {
        expect(buildStatementHtml(statement())).not.toContain('class="warn"')
    })

    it('falls back to a neutral heading when the session carries no company name', () => {
        const html = buildStatementHtml(statement({ corporate: { corporateId: 7, companyName: '  ' } }))

        expect(html).toContain('Corporate account')
    })

    // A web font or a remote logo would be fetched at render time: the pool aborts font requests, and
    // an image URL is what hung the airline ticket for 180s in production. Nothing here may reference
    // a host — fonts are system fonts and the logo arrives pre-inlined as a data: URI.
    it('references no remote host', () => {
        const html = buildStatementHtml(statement({ logo: 'data:image/png;base64,AAAA' }))

        expect(html).not.toMatch(/(src|href)\s*=\s*"https?:/i)
        expect(html).not.toContain('@import')
        expect(html).not.toContain('<link')
    })

    it('drops a logo that is a URL rather than letting the render fetch it', () => {
        const html = buildStatementHtml(statement({ logo: 'https://firebasestorage.googleapis.com/peko.png' }))

        expect(html).not.toContain('firebasestorage')
        expect(html).not.toContain('<img class="brand-logo"')
    })

    it('inlines the brand mark when it arrives as a data URI', () => {
        const html = buildStatementHtml(statement({ logo: 'data:image/png;base64,AAAA', branding: 'Peko' }))

        expect(html).toContain('class="brand-logo" src="data:image/png;base64,AAAA"')
        expect(html).toContain('alt="Peko"')
    })

    it('still renders a complete statement when no logo could be resolved', () => {
        const html = buildStatementHtml(statement({ logo: null }))

        expect(html).not.toContain('<img class="brand-logo"')
        expect(html).toContain('Peko Technologies Private Limited')
        expect(html).toContain('Balance (INR)')
    })

    // Colour marks structure (masthead rule, document label, table head, closing balance) and nothing
    // else, so the figures stay the loudest thing on the page.
    it('uses the Peko brand red for structure only', () => {
        const html = buildStatementHtml(statement())

        expect(html).toContain('--brand: #FF3A3A')
        expect(html).toContain('border-bottom: 2px solid var(--brand)')
        expect(html).toContain('border-bottom: 1.5px solid var(--brand)')
        expect(html).toContain('.summary .closing { background: var(--brand-tint); }')
    })

    // The ₹ glyph is not guaranteed in a headless container's font set; the columns say INR instead.
    it('labels amounts INR rather than relying on a rupee glyph', () => {
        const html = buildStatementHtml(statement())

        expect(html).not.toContain('₹')
        expect(html).toContain('Money out (INR)')
        expect(html).toContain('Balance (INR)')
    })

    it('repeats the table head across pages and keeps rows whole', () => {
        const html = buildStatementHtml(statement())

        expect(html).toContain('thead { display: table-header-group; }')
        expect(html).toContain('break-inside: avoid')
    })
})

describe('renderStatementPdf', () => {
    beforeEach(() => jest.clearAllMocks())

    it('leaves the page size and margins to the stylesheet, which the pool prefers', async () => {
        renderPdf.mockResolvedValue(Buffer.from('%PDF-'))

        await renderStatementPdf(statement())

        const [, options] = renderPdf.mock.calls[0]
        expect(options).not.toHaveProperty('margin')
        expect(options).not.toHaveProperty('format')
        expect(options.displayHeaderFooter).toBe(true)
        expect(options.footerTemplate).toContain('pageNumber')
    })

    it('returns whatever the pool produced, untouched', async () => {
        const buf = Buffer.from('%PDF-1.4 body')
        renderPdf.mockResolvedValue(buf)

        await expect(renderStatementPdf(statement())).resolves.toBe(buf)
    })
})
