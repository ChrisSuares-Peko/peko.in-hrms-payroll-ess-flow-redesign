const { pendingKycNoticeTemplate, weeklySpendDigestTemplate } = require('../notificationJobEmails')

const hoursAgo = (hours) => new Date(Date.now() - hours * 3600000).toISOString()

const person = (over = {}) => ({
    name: 'Aarav Sharma',
    mobileNumber: '9876543210',
    createdAt: hoursAgo(52),
    ...over,
})

const render = (over = {}) =>
    pendingKycNoticeTemplate({ companyName: 'Acme Ltd', hours: 48, people: [person()], ...over })

describe('pendingKycNoticeTemplate', () => {
    describe('branding', () => {
        it('shows the hosted Peko logo with a text alternative for blocked images', () => {
            const [{ logo }] = require('../../public/partnerLogos')

            const html = render()

            expect(html).toContain(`src="${logo}"`)
            expect(html).toContain('alt="Peko"')
        })

        it('states fixed pixel dimensions so the logo cannot render full-bleed', () => {
            const html = render()

            expect(html).toContain('height="35"')
            expect(html).toContain('max-width:110px')
        })

        it('credits the Indian entity, not the UAE one', () => {
            const html = render()

            expect(html).toContain('Peko Platforms Private Limited')
            expect(html).not.toContain('Peko Payment Services LLC')
        })

        it('carries the app store badges in the footer', () => {
            const html = render()

            expect(html).toContain('https://play.google.com/store/apps/details?id=com.pekopayment.app')
            expect(html).toContain('https://apps.apple.com/in/app/peko/id1669780986')
            expect(html).toContain('Download the app')
        })

        it('keeps the assistance address in the footer', () => {
            const html = render()

            expect(html).toContain('reach@peko.one')
        })

        it('sets hidden preview text for the inbox list', () => {
            const html = render({ people: [person(), person({ mobileNumber: '9000000000' })] })

            expect(html).toContain('2 cardholders cannot use their card until KYC is complete.')
        })
    })

    describe('cardholder table', () => {
        it('lists the name, mobile and how long KYC has been pending', () => {
            const html = render()

            expect(html).toContain('Aarav Sharma')
            expect(html).toContain('9876543210')
            expect(html).toContain('2 days')
        })

        it('reports a sub-48-hour wait in hours', () => {
            const html = render({ people: [person({ createdAt: hoursAgo(30) })] })

            expect(html).toContain('30 hours')
        })

        it('falls back to a placeholder when the name could not be resolved', () => {
            const html = render({ people: [person({ name: null })] })

            expect(html).toContain('Name not on file')
            expect(html).toContain('9876543210')
        })

        it('renders a dash rather than "Invalid Date" for an unusable timestamp', () => {
            const html = render({ people: [person({ createdAt: 'not-a-date' })] })

            expect(html).not.toContain('NaN')
            expect(html).not.toContain('Invalid Date')
        })

        it('accepts a bare mobile string without throwing', () => {
            const html = render({ people: ['9876543210'] })

            expect(html).toContain('9876543210')
            expect(html).toContain('Name not on file')
        })

        it('escapes a name that contains markup', () => {
            const html = render({ people: [person({ name: 'Priya <b>Menon</b> & Co' })] })

            expect(html).toContain('Priya &lt;b&gt;Menon&lt;/b&gt; &amp; Co')
            expect(html).not.toContain('<b>Menon</b>')
        })

        it('caps the table and points at the dashboard for the rest', () => {
            const people = Array.from({ length: 14 }, (_, index) =>
                person({ name: `Holder ${index}`, mobileNumber: `90000000${String(index).padStart(2, '0')}` })
            )

            const html = render({ people })

            expect(html).toContain('Holder 9')
            expect(html).not.toContain('Holder 10')
            expect(html).toContain('+ 4 more cardholders')
        })

        it('omits the overflow line when every cardholder is listed', () => {
            const html = render()

            expect(html).not.toContain('more cardholder')
        })
    })

    describe('headline and copy', () => {
        it('reads as singular for one cardholder', () => {
            const html = render()

            expect(html).toContain('KYC pending for 1 cardholder')
            expect(html).not.toContain('1 cardholders')
            expect(html).toContain('has not completed KYC')
        })

        it('reads as plural for several', () => {
            const html = render({ people: [person(), person({ mobileNumber: '9000000000' })] })

            expect(html).toContain('KYC pending for 2 cardholders')
            expect(html).toContain('have not completed KYC')
        })

        it('spells out that the cards are unusable until KYC completes', () => {
            const html = render()

            expect(html).toContain('cannot be issued or used until KYC is complete')
        })

        it('survives an empty roster without throwing', () => {
            expect(() => render({ people: [] })).not.toThrow()
        })

        it('survives a missing roster without throwing', () => {
            expect(() => render({ people: undefined })).not.toThrow()
        })
    })
})

describe('weeklySpendDigestTemplate', () => {
    it('carries the same branding and footer as the KYC notice', () => {
        const html = weeklySpendDigestTemplate({
            companyName: 'Acme Ltd',
            total: 125000,
            transactions: 12,
            from: '01 Aug 2026',
            to: '07 Aug 2026',
        })

        expect(html).toContain('alt="Peko"')
        expect(html).toContain('Peko Platforms Private Limited')
        expect(html).toContain('reach@peko.one')
        expect(html).toContain('INR 1,25,000.00')
    })
})
