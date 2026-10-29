const { kybApprovedTemplate } = require('../kybStatusEmailTemplate')

const FUNDING = {
    clientName: 'PEKO TECHNOLOGIES PRIVATE LIMITED',
    beneficiaryName: 'Pine Labs Limited',
    bankName: 'Axis Bank',
    accountNumber: 'PEKOCC0000123456',
    ifsc: 'UTIB0CCH274',
    bankAddress: '9th Floor, Solaris C Wing, Powai, Mumbai, Maharashtra',
    telephone: '022-4075 4983',
}

const render = (over = {}) =>
    kybApprovedTemplate({
        name: 'Jane Doe',
        kybReference: 'KYBDAF2D53EF',
        fundingAccount: FUNDING,
        ...over,
    })

describe('kybApprovedTemplate', () => {
    it('carries the approved headline from the design', () => {
        expect(render()).toContain('Your KYB Verification is Complete - Corporate Card Approved')
    })

    it('greets the contact by name', () => {
        expect(render()).toContain('Dear Jane Doe,')
    })

    it('shows the reference the corporate can quote back', () => {
        expect(render()).toContain('KYBDAF2D53EF')
    })

    it('omits the reference line when none has been generated', () => {
        expect(render({ kybReference: null })).not.toContain('Reference:')
    })

    describe('beneficiary and bank details', () => {
        it('renders every label from the design', () => {
            const html = render()

            ;[
                'Client name',
                'Beneficiary Name',
                'Bank Name',
                'Account Number',
                'IFSC Code',
                'Bank Address',
                'Telephone',
            ].forEach((label) => expect(html).toContain(`${label}:`))
        })

        it('renders the stored values rather than any hardcoded sample', () => {
            const html = render({
                fundingAccount: { ...FUNDING, accountNumber: 'PEKOCC0000999888', ifsc: 'HDFC0001234' },
            })

            expect(html).toContain('PEKOCC0000999888')
            expect(html).toContain('HDFC0001234')
            expect(html).not.toContain('PEKOCC0000123456')
        })

        it('leaves out a row the corporate has no value for', () => {
            const html = render({ fundingAccount: { ...FUNDING, bankAddress: null, telephone: '' } })

            expect(html).not.toContain('Bank Address:')
            expect(html).not.toContain('Telephone:')
            expect(html).toContain('IFSC Code:')
        })

        it('carries no row for a detail the admin screen cannot provide', () => {
            const html = render()

            expect(html).not.toContain('MICR Code')
            expect(html).not.toContain('SWIFT Code')
            expect(html).not.toContain('Branch Name')
            expect(html).not.toContain('Branch Code')
        })

        it('drops the whole section when no account has been provisioned', () => {
            const html = render({ fundingAccount: null })

            expect(html).not.toContain('Beneficiary &amp; Bank Details')
            expect(html).toContain('Your KYB Verification is Complete')
        })

        it('escapes values so a stored angle bracket cannot break the markup', () => {
            const html = render({ fundingAccount: { ...FUNDING, bankName: 'Axis <b>Bank</b>' } })

            expect(html).toContain('Axis &lt;b&gt;Bank&lt;/b&gt;')
            expect(html).not.toContain('Axis <b>Bank</b>')
        })
    })

    describe('footer', () => {
        it('links the four social accounts Peko India actually has', () => {
            const html = render()

            expect(html).toContain('facebook.com/pekoindia')
            expect(html).toContain('x.com/PekoIndia')
            expect(html).toContain('instagram.com/peko.india')
            expect(html).toContain('linkedin.com/company/pekoindia')
            expect(html).not.toContain('youtube.com')
        })

        it('offers the support mailbox and the legal entity', () => {
            const html = render()

            expect(html).toContain('reach@peko.one')
            expect(html).toContain('Peko Platforms Private Limited, All Rights Reserved')
        })

        it('carries both store links under the download prompt', () => {
            const html = render()

            expect(html).toContain('Download the app')
            expect(html).toContain('play.google.com/store/apps/details?id=com.pekopayment.app')
            expect(html).toContain('apps.apple.com/in/app/peko')
        })
    })

    it('closes with the Peko sign-off and the login call to action', () => {
        const html = render()

        expect(html).toContain('Best regards,<br>Team Peko')
        expect(html).toContain('Login Now')
    })
})
