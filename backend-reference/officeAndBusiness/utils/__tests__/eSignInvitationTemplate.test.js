const { eSignInvitationTemplate } = require('../eSignInvitationTemplate');
const [{ logo: PEKO_LOGO_URL }] = require('../../public/partnerLogos');

const render = (over = {}) => {
    const args = {
        signerName: 'Aarav Sharma',
        initiatorEmail: 'ops@acme.test',
        documentName: 'Corporate Card Agreement',
        signingLink: 'https://sign.example/abc123',
        expiryDate: '25/08/2026',
        ...over,
    };
    return eSignInvitationTemplate(
        args.signerName,
        args.initiatorEmail,
        args.documentName,
        args.signingLink,
        args.expiryDate
    );
};

describe('eSignInvitationTemplate — house email pattern', () => {
    describe('branding', () => {
        it('shows the Peko logo from the service logo constant', () => {
            const html = render();

            expect(html).toContain(`src="${PEKO_LOGO_URL}"`);
            expect(html).toContain('alt="Peko"');
        });

        it('does not reference the retired Stripo CDN, whose logo returns 404', () => {
            expect(render()).not.toContain('stripocdn');
        });

        it('carries the full footer: policy links, entity and site link', () => {
            const html = render();

            expect(html).toContain('https://peko.one/in/privacy-policy/');
            expect(html).toContain('https://peko.one/in/cookie-policy/');
            expect(html).toContain('https://peko.one/in/platform-agreement');
            expect(html).toContain('https://peko.one/in/refund-policy');
            expect(html).toContain('Peko Platforms Private Limited');
            expect(html).toContain('www.peko.one');
        });

        it('carries the three footer social icons', () => {
            const html = render();

            expect(html).toContain('title="Twitter"');
            expect(html).toContain('title="Instagram"');
            expect(html).toContain('title="Linkedin"');
        });

        it('uses the Peko red call to action, with no blue or teal accent', () => {
            const html = render();

            expect(html).toContain('#ff4f4f');
            expect(html).not.toMatch(/#2ca5a5/i);
            expect(html).not.toMatch(/#e07b00/i);
        });

        it('sets hidden preview text for the inbox list', () => {
            expect(render()).toContain('Your signature is requested on Corporate Card Agreement.');
        });
    });

    describe('content', () => {
        it('names the signer, the requester and the document', () => {
            const html = render();

            expect(html).toContain('Dear Aarav Sharma,');
            expect(html).toContain('ops@acme.test');
            expect(html).toContain('Corporate Card Agreement');
        });

        it('links the review button to the signing link', () => {
            expect(render()).toContain('href="https://sign.example/abc123"');
        });

        it('shows the expiry when one is supplied', () => {
            expect(render()).toContain('25/08/2026');
        });

        it('omits the expiry row entirely when none is supplied', () => {
            const html = render({ expiryDate: undefined });

            expect(html).not.toContain('Document Expires On');
            expect(html).not.toContain('undefined');
        });

        it('warns the signer not to forward the link', () => {
            expect(render()).toContain('Please do not share this email.');
        });

        it('falls back to a neutral greeting when the signer name is missing', () => {
            const html = render({ signerName: null });

            expect(html).toContain('Dear Signer,');
            expect(html).not.toContain('Dear null,');
        });
    });

    describe('escaping', () => {
        it('escapes markup in the document title', () => {
            const html = render({ documentName: 'Agreement <b>Acme</b> & Co' });

            expect(html).toContain('Agreement &lt;b&gt;Acme&lt;/b&gt; &amp; Co');
            expect(html).not.toContain('<b>Acme</b>');
        });

        it('escapes markup in the signer name', () => {
            const html = render({ signerName: '<script>alert(1)</script>' });

            expect(html).not.toContain('<script>');
            expect(html).toContain('&lt;script&gt;');
        });
    });
});
