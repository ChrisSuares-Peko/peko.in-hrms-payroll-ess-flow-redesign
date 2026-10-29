const { vendorKybUnderReviewTemplate, VENDOR_OPS_MAILBOX, FOOTER_MAILBOX } = require('../vendorKybEmailTemplate')

const FULL = {
    companyName: 'Steel & Co Manufacturing Private Limited',
    kybReference: 'KYB3F9A2B7C1D',
    businessTypeLabel: 'Private Limited',
    applicationId: '100000726',
    applicationDate: '2026-09-01T06:30:00.000Z',
    registrationNumber: 'U72900MH2015PTC123456',
    jurisdiction: 'Mumbai, Maharashtra, India',
    recipientName: 'Pine Labs',
    attached: ['Certificate of Incorporation', 'GST Certificate'],
}

const render = (overrides = {}) => vendorKybUnderReviewTemplate({ ...FULL, ...overrides })

const between = (html, start, end) => {
    const from = html.indexOf(start)
    const to = end ? html.indexOf(end, from) : html.length
    return html.slice(from, to === -1 ? html.length : to)
}

describe('the vendor KYB email', () => {
    it('carries the designed title and greets the vendor by name', () => {
        const html = render()

        expect(html).toContain('KYB Verification Request')
        expect(html).toContain('Dear Pine Labs,')
    })

    it('falls back to a neutral greeting when the vendor record has no name', () => {
        expect(render({ recipientName: null })).toContain('Dear Partner,')
    })

    it('renders every application detail the design asks for', () => {
        const html = render()

        for (const label of [
            'Company name:', 'Application ID:', 'Date of application:', 'Entity Type:',
            'Registration number:', 'Registered country/Jurisdiction:', 'KYB reference:',
        ]) {
            expect(html).toContain(label)
        }
        expect(html).toContain('100000726')
        expect(html).toContain('U72900MH2015PTC123456')
        expect(html).toContain('Mumbai, Maharashtra, India')
        expect(html).toContain('KYB3F9A2B7C1D')
    })

    it('formats the application date for a human, not as an ISO string', () => {
        const html = render()

        expect(html).toContain('01 Sept 2026')
        expect(html).not.toContain('2026-09-01T06:30:00.000Z')
    })

    it.each([
        ['Application ID', 'applicationId', 'Application ID:'],
        ['Registration number', 'registrationNumber', 'Registration number:'],
        ['Jurisdiction', 'jurisdiction', 'Registered country/Jurisdiction:'],
        ['Entity Type', 'businessTypeLabel', 'Entity Type:'],
    ])('drops the %s row rather than printing an empty value', (_label, key, rowLabel) => {
        const html = render({ [key]: null })

        expect(html).not.toContain(rowLabel)
        expect(html).toContain('Company name:')
    })

    it('escapes the company name so an ampersand cannot break the markup', () => {
        const html = render()

        expect(html).toContain('Steel &amp; Co Manufacturing Private Limited')
        expect(html).not.toMatch(/Steel & Co/)
    })

    it('never renders markup a corporate could have typed into its own name', () => {
        const html = render({ companyName: '<script>alert(1)</script>' })

        expect(html).not.toContain('<script>')
        expect(html).toContain('&lt;script&gt;')
    })
})

describe('the documents list', () => {
    it('lists what is actually inside the zip', () => {
        const html = render()
        const section = between(html, 'Documents attached to this email')

        expect(section).toContain('Certificate of Incorporation')
        expect(section).toContain('GST Certificate')
    })

    it('does not narrate the attachment file name in the body', () => {
        const html = render()

        expect(html).not.toContain('KYB-Documents.zip')
        expect(html).not.toContain('Attached as a single zip file')
    })

    it('never carries a gap or chase-up section the design does not have', () => {
        const html = render()

        expect(html).not.toContain('Not attached')
        expect(html).not.toContain('please request these separately')
    })

    // The form-filled draft is internal review material, never evidence for the vendor.
    it('never names the internal form-filled agreement', () => {
        const html = render({ attached: ['Corporate Agreement (e-signed)'] })

        expect(html).not.toContain('filled from the form')
        expect(html).toContain('Corporate Agreement (e-signed)')
    })

    it('changes with the entity type, because the zip contents do', () => {
        const privateLimited = render({
            businessTypeLabel: 'Private Limited',
            attached: ['Certificate of Incorporation', 'MoA (Memorandum of Association)'],
        })
        const proprietorship = render({
            businessTypeLabel: 'Proprietorship',
            attached: ['GST Certificate', 'Cancelled Cheque'],
        })

        expect(privateLimited).toContain('MoA (Memorandum of Association)')
        expect(privateLimited).not.toContain('Cancelled Cheque')
        expect(proprietorship).toContain('Cancelled Cheque')
        expect(proprietorship).not.toContain('MoA (Memorandum of Association)')
    })

    it('omits the attached section when nothing could be attached', () => {
        const html = render({ attached: [] })

        expect(html).not.toContain('Documents attached to this email')
    })
})

describe('email client compatibility', () => {
    const html = render()

    it('lays out in tables, never in flex or grid', () => {
        expect(html).not.toMatch(/display\s*:\s*(flex|grid)/)
        expect(html).not.toContain('position:absolute')
    })

    it('marks every layout table as presentational', () => {
        const tables = html.match(/<table[^>]*>/g) || []
        expect(tables.length).toBeGreaterThan(5)
        expect(tables.every((tag) => tag.includes('role="presentation"'))).toBe(true)
    })

    it('suppresses the phantom gutters Word adds between tables', () => {
        const tables = html.match(/<table[^>]*>/g) || []
        expect(tables.every((tag) => tag.includes('mso-table-lspace:0pt'))).toBe(true)
    })

    it('guards against Word scaling the layout at high DPI', () => {
        expect(html).toContain('<o:PixelsPerInch>96</o:PixelsPerInch>')
    })

    it('holds 600px in Outlook through a ghost table', () => {
        expect(html).toContain('[if mso]><table')
        expect(html).toContain('width="600"')
    })

    it('stays fluid for every other client', () => {
        expect(html).toContain('max-width:600px')
    })

    it('repeats the page background as an attribute, since Gmail rewrites the body', () => {
        expect(html).toMatch(/<table[^>]*bgcolor="#F9FAFB"/)
    })

    it('uses only web-safe fonts', () => {
        expect(html).not.toContain('fonts.googleapis.com');
        expect(html).not.toContain('@font-face')
        expect(html).toContain('arial')
    })

    it('uses no CSS custom properties, which no email client resolves', () => {
        expect(html).not.toContain('var(--')
    })

    it('gives the logo alt text and matching width and height attributes', () => {
        expect(html).toMatch(/<img[^>]*alt="Peko"[^>]*>/)
        expect(html).toMatch(/<img[^>]*width="90"[^>]*height="30"/)
    })

    it('escapes the ampersand in the logo URL so a strict parser cannot truncate it', () => {
        const img = html.match(/<img[^>]*alt="Peko"[^>]*>/)[0]
        expect(img).toContain('&amp;token=')
        expect(img).not.toMatch(/[^p;]&token=/)
    })

    it('pads the preheader so the inbox preview does not scrape the greeting', () => {
        expect(html).toContain('mso-hide:all')
        expect(html).toContain('&zwnj;&nbsp;')
        expect(html).toContain('awaiting KYB verification')
    })

    it('stops Apple Mail auto-linking the date and the addresses', () => {
        expect(html).toContain('telephone=no,date=no,address=no,email=no')
    })

    it('carries a mobile stacking rule for the two-column detail rows', () => {
        expect(html).toContain('@media only screen and (max-width:620px)')
        expect(html).toContain('.pk-stack{display:block !important')
    })

    it('is well under the size at which Gmail clips a message', () => {
        expect(Buffer.byteLength(html, 'utf8')).toBeLessThan(102 * 1024)
    })

    it('reaches the vendor ops mailbox and the footer mailbox', () => {
        expect(html).toContain(`mailto:${VENDOR_OPS_MAILBOX}`)
        expect(html).toContain(`mailto:${FOOTER_MAILBOX}`)
    })

    it('keeps the footer the design specifies', () => {
        expect(html).toContain('Download the app')
        expect(html).toContain('Google Play')
        expect(html).toContain('App Store')
        expect(html).toContain('All Rights Reserved')
    })
})
