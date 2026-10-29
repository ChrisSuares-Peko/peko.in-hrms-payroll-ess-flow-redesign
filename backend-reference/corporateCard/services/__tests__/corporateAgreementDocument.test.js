const PizZip = require('pizzip')

jest.mock('fs', () => {
    const actual = jest.requireActual('fs')
    const actualPath = jest.requireActual('path')
    const templatePath = actualPath.join(__dirname, '..', '..', 'public', 'templates', 'corporate-agreement.docx')
    const staged = new Map()

    const guard = (target) => {
        if (target !== templatePath) {
            throw new Error(`This suite may only stage the agreement template, not ${target}`)
        }
    }

    return {
        ...actual,
        __staged: staged,
        __templatePath: templatePath,
        existsSync: (target) => (target === templatePath ? staged.has(target) : actual.existsSync(target)),
        readFileSync: (target, ...rest) =>
            target === templatePath && staged.has(target) ? staged.get(target) : actual.readFileSync(target, ...rest),
        mkdirSync: (target, ...rest) => (target.startsWith(actualPath.dirname(templatePath)) ? undefined : actual.mkdirSync(target, ...rest)),
        writeFileSync: (target, data) => {
            guard(target)
            staged.set(target, data)
        },
        unlinkSync: (target) => {
            guard(target)
            staged.delete(target)
        },
    }
})

const fs = require('fs')
const svc = require('../corporateAgreementDocument')

const CONTENT_TYPES =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '</Types>'

const RELS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '</Relationships>'

const body = (text) =>
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
    `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>` +
    '</w:body></w:document>'

const writeTemplate = (text) => {
    const zip = new PizZip()
    zip.file('[Content_Types].xml', CONTENT_TYPES)
    zip.folder('_rels').file('.rels', RELS)
    zip.folder('word').file('document.xml', body(text))
    fs.mkdirSync(svc.TEMPLATE_DIR, { recursive: true })
    fs.writeFileSync(svc.TEMPLATE_PATH, zip.generate({ type: 'nodebuffer' }))
    svc.clearTemplateCache()
}

const removeTemplate = () => {
    if (fs.existsSync(svc.TEMPLATE_PATH)) fs.unlinkSync(svc.TEMPLATE_PATH)
    svc.clearTemplateCache()
}

const renderedText = (buffer) => new PizZip(buffer).file('word/document.xml').asText()

const AGREEMENT = {
    entityName: 'Acme Technologies Pvt Ltd',
    regAddress: '12 MG Road',
    regCity: 'Bengaluru',
    regState: 'Karnataka',
    regPinCode: '560001',
    gstNumber: '29ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    bankIfsc: 'HDFC0001234',
    signatoryName: 'Aarav Sharma',
    signatoryIsPep: false,
}

afterEach(removeTemplate)

describe('corporate agreement template', () => {
    it('lives under public/ as a .docx, so the file ships with the service', () => {
        expect(svc.TEMPLATE_PATH).toMatch(/public\/templates\/corporate-agreement\.docx$/)
    })

    it('never lets this suite touch the real file on disk', () => {
        expect(svc.TEMPLATE_PATH).toBe(fs.__templatePath)
        expect(() => fs.writeFileSync('/etc/passwd', 'nope')).toThrow(/may only stage/i)
    })

    it('reports the template as missing until it is added', () => {
        expect(svc.templateExists()).toBe(false)
    })

    // A corporate agreement that silently rendered blank would be signed and filed as if it were real.
    it('throws rather than returning an empty document when the template is absent', () => {
        expect(() => svc.renderAgreementDocx(AGREEMENT)).toThrow(/template is missing/i)
    })
})

describe('renderAgreementDocx', () => {
    it('fills single-brace placeholders with the agreement values', () => {
        writeTemplate('Entity: {entityName} GST: {gstNumber} PAN: {panNumber}')

        const out = renderedText(svc.renderAgreementDocx(AGREEMENT))

        expect(out).toContain('Acme Technologies Pvt Ltd')
        expect(out).toContain('29ABCDE1234F1Z5')
        expect(out).toContain('ABCDE1234F')
    })

    it('leaves no unreplaced tag behind', () => {
        writeTemplate('{entityName} {regCity} {tanNumber} {cinLlpNumber}')

        const out = renderedText(svc.renderAgreementDocx(AGREEMENT))

        expect(out).not.toContain('{entityName}')
        expect(out).not.toContain('{tanNumber}')
    })

    // An absent optional value must render as nothing, never as the literal tag text.
    it('renders an absent value as empty rather than the tag', () => {
        writeTemplate('[{tanNumber}]')

        const out = renderedText(svc.renderAgreementDocx(AGREEMENT))

        expect(out).toContain('[]')
    })

    it('renders the PEP answer as Yes or No, not true or false', () => {
        writeTemplate('PEP: {signatoryIsPep}')

        expect(renderedText(svc.renderAgreementDocx({ signatoryIsPep: true }))).toContain('PEP: Yes')
        expect(renderedText(svc.renderAgreementDocx({ signatoryIsPep: false }))).toContain('PEP: No')
    })

    // "Same as registered address" is a UI shortcut; the contract must still name the address in full.
    it('copies the registered address into the billing tags when they are the same', () => {
        writeTemplate('Bill: {billAddress} {billCity} {billState} {billPinCode}')

        const out = renderedText(
            svc.renderAgreementDocx({ ...AGREEMENT, billSameAsRegistered: true })
        )

        expect(out).toContain('12 MG Road')
        expect(out).toContain('Bengaluru')
        expect(out).toContain('560001')
    })

    it('keeps a distinct billing address when it differs', () => {
        writeTemplate('Bill: {billCity}')

        const out = renderedText(
            svc.renderAgreementDocx({
                ...AGREEMENT,
                billSameAsRegistered: false,
                billCity: 'Mumbai',
            })
        )

        expect(out).toContain('Mumbai')
        expect(out).not.toContain('Bengaluru')
    })

    it('carries the application context the contract needs', () => {
        writeTemplate('{businessType} {kybReference} {agreementDate}')

        const out = renderedText(
            svc.renderAgreementDocx(AGREEMENT, {
                businessType: 'PRIVATE_PUBLIC_LIMITED',
                kybReference: 'KYBABC1234567',
                agreementDate: '2026-08-14',
            })
        )

        expect(out).toContain('PRIVATE_PUBLIC_LIMITED')
        expect(out).toContain('KYBABC1234567')
        expect(out).toContain('2026-08-14')
    })

    it('returns a real docx buffer', () => {
        writeTemplate('{entityName}')

        const buffer = svc.renderAgreementDocx(AGREEMENT)

        expect(Buffer.isBuffer(buffer)).toBe(true)
        expect(new PizZip(buffer).file('word/document.xml')).toBeTruthy()
    })

    // Added after the process started, the template must be picked up without a restart.
    it('picks up a template added after the first miss', () => {
        expect(svc.templateExists()).toBe(false)

        writeTemplate('{entityName}')

        expect(svc.templateExists()).toBe(true)
        expect(renderedText(svc.renderAgreementDocx(AGREEMENT))).toContain('Acme')
    })
})

describe('placeholders', () => {
    it('always supplies every key, so no tag can survive into a signed contract', () => {
        const filled = svc.buildPlaceholders({}, {})

        expect(Object.keys(filled)).toEqual(svc.PLACEHOLDER_KEYS)
        Object.values(filled).forEach((value) => expect(typeof value).toBe('string'))
    })

    it('trims whitespace the corporate typed', () => {
        expect(svc.buildPlaceholders({ entityName: '  Acme  ' }).entityName).toBe('Acme')
    })
})
