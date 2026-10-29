const fs = require('fs')
const path = require('path')
const PizZip = require('pizzip')

const { fillAgreementForm, hasTags, visibleText } = require('../agreementFormFiller')

const TEMPLATE_PATH = path.join(__dirname, '..', '..', 'public', 'templates', 'corporate-agreement.docx')

const VALUES = {
    agreementDate: '2026-08-14',
    kybReference: 'KYB22402C442C',
    entityName: 'Acme Technologies Pvt Ltd',
    businessType: 'LLP',
    regAddress: '12 MG Road',
    regCity: 'Bengaluru',
    regState: 'Karnataka',
    regPinCode: '560001',
    regTelephone: '08012345678',
    regEmail: 'ops@acme.test',
    billAddress: '9 Residency Road',
    billCity: 'Mysuru',
    billState: 'Karnataka',
    billPinCode: '570001',
    gstNumber: '29ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    cinLlpNumber: 'AAA-1234',
    tanNumber: 'BLRA12345B',
    bankName: 'HDFC Bank',
    bankBranch: 'MG Road',
    bankAccountNumber: '123456789012',
    bankIfsc: 'HDFC0001234',
    bankCity: 'Bengaluru',
    officialContactName: 'Aarav Sharma',
    officialContactMobile: '9876543210',
    officialContactEmail: 'aarav@acme.test',
    salespersonName: 'Riya Nair',
    salespersonMobile: '9876543211',
    salespersonEmail: 'riya@peko.test',
    signatoryName: 'Priya Menon',
    signatoryContact: '9876543212',
    signatoryEmail: 'priya@acme.test',
    signatoryIsPep: false,
}

const templateBuffer = () => fs.readFileSync(TEMPLATE_PATH)
const documentText = (buffer) => visibleText(new PizZip(buffer).file('word/document.xml').asText())

// Word stores &, < and > as entities; decode them so assertions read as the document displays.
const decode = (value) =>
    value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

const rowsOf = (buffer) => {
    const xml = new PizZip(buffer).file('word/document.xml').asText()
    const table = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/)[0]
    return (table.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) || []).map((row) =>
        (row.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || []).map((cell) =>
            decode(visibleText(cell)).replace(/\s+/g, ' ').trim()
        )
    )
}

describe('the committed template', () => {
    // It is Pine Labs' printable form, not a docxtemplater template. Rendering it through
    // docxtemplater alone returned it untouched, which is how a blank contract reached a reviewer.
    it('carries no {tags}, which is why the form has to be filled by position', () => {
        const xml = new PizZip(templateBuffer()).file('word/document.xml').asText()

        expect(hasTags(xml)).toBe(false)
    })
})

describe('fillAgreementForm', () => {
    it('writes every supplied value into the document', () => {
        const text = documentText(fillAgreementForm(templateBuffer(), VALUES))

        Object.entries(VALUES)
            .filter(([key]) => key !== 'signatoryIsPep' && key !== 'businessType')
            .forEach(([, value]) => expect(text).toContain(value));
    })

    it('puts each value in its own cell, beside the right label', () => {
        const rows = rowsOf(fillAgreementForm(templateBuffer(), VALUES))

        expect(rows[1]).toEqual(['Name of the Entity', 'Acme Technologies Pvt Ltd'])
        expect(rows[4]).toEqual(['City', 'Bengaluru', 'State', 'Karnataka'])
        expect(rows[5]).toEqual(['Pin Code', '560001', 'Telephone', '08012345678'])
        expect(rows[17]).toEqual(['Account Number: 123456789012', 'Bank: HDFC Bank'])
        expect(rows[18]).toEqual(['IFSC Code: HDFC0001234', 'City: Bengaluru'])
    })

    // City/State/Pin Code appear once for the registered address and again for the billing address.
    it('keeps the billing address out of the registered address rows', () => {
        const rows = rowsOf(fillAgreementForm(templateBuffer(), VALUES))

        expect(rows[4]).toEqual(['City', 'Bengaluru', 'State', 'Karnataka'])
        expect(rows[8]).toEqual(['City', 'Mysuru', 'State', 'Karnataka'])
        expect(rows[9][1]).toBe('570001')
    })

    // Both columns of these rows carry the same label.
    it('keeps the salesperson contact out of the official contact column', () => {
        const rows = rowsOf(fillAgreementForm(templateBuffer(), VALUES))

        expect(rows[20]).toEqual(['Name Aarav Sharma', 'Name Riya Nair'])
        expect(rows[22]).toEqual(['Email aarav@acme.test', 'Email riya@peko.test'])
    })

    it('fills the authorised signatory, not the official contact, into the signatory block', () => {
        const rows = rowsOf(fillAgreementForm(templateBuffer(), VALUES))

        expect(rows[24][0]).toBe('Name Priya Menon')
        expect(rows[25][0]).toBe('Contact Number 9876543212')
        expect(rows[26][0]).toBe('Email id priya@acme.test')
    })

    it('marks the PEP answer against the option the corporate chose', () => {
        const asNo = rowsOf(fillAgreementForm(templateBuffer(), VALUES))
        expect(asNo[26][1]).toBe('No ☑')
        expect(asNo[25][1]).toBe('Yes')

        const asYes = rowsOf(fillAgreementForm(templateBuffer(), { ...VALUES, signatoryIsPep: true }))
        expect(asYes[25][1]).toBe('Yes ☑')
        expect(asYes[26][1]).toBe('No')
    })

    // Ticks the form's own box rather than appending a note beside the row.
    it.each([
        ['PROPRIETORSHIP', 'Sole Proprietorship☑'],
        ['PARTNERSHIP', 'Partnership☑'],
        ['SOCIETY_TRUST', 'Trust☑'],
        ['PRIVATE_LIMITED', 'Pvt Ltd☑'],
        ['PUBLIC_LIMITED', 'Public Ltd☑'],
        ['LLP', 'LLP☑'],
    ])('ticks the %s box and no other', (businessType, ticked) => {
        const rows = rowsOf(fillAgreementForm(templateBuffer(), { ...VALUES, businessType }))
        const row = rows[2][1].replace(/\s+/g, ' ')

        expect(row).toContain(ticked)
        expect(row.match(/☑/g)).toHaveLength(1)
    })

    it('ticks Pvt Ltd for an application saved before the type was split', () => {
        const rows = rowsOf(
            fillAgreementForm(templateBuffer(), { ...VALUES, businessType: 'PRIVATE_PUBLIC_LIMITED' })
        )

        expect(rows[2][1]).toContain('Pvt Ltd☑')
    })

    it('refuses rather than leaving the constitution blank for an unknown type', () => {
        expect(() =>
            fillAgreementForm(templateBuffer(), { ...VALUES, businessType: 'COOPERATIVE' })
        ).toThrow(/no matching option on the form/i)
    })

    it('leaves a field the corporate did not answer blank rather than writing "undefined"', () => {
        const rows = rowsOf(fillAgreementForm(templateBuffer(), { ...VALUES, tanNumber: '' }))

        expect(rows[15][1]).toBe('TAN Number (If applicable):')
        expect(documentText(fillAgreementForm(templateBuffer(), { ...VALUES, tanNumber: '' }))).not.toContain('undefined')
    })

    it('escapes characters that would otherwise corrupt the document', () => {
        const rows = rowsOf(fillAgreementForm(templateBuffer(), { ...VALUES, entityName: 'Smith & Sons <Holdings>' }))

        expect(rows[1][1]).toBe('Smith & Sons <Holdings>')
    })

    it('still produces a valid .docx that can be reopened', () => {
        const filled = fillAgreementForm(templateBuffer(), VALUES)
        const zip = new PizZip(filled)

        expect(zip.file('word/document.xml')).toBeTruthy()
        expect(zip.file('[Content_Types].xml')).toBeTruthy()
        expect(filled.length).toBeGreaterThan(1000)
    })

    it('refuses to write anything when nothing was supplied', () => {
        expect(() => fillAgreementForm(templateBuffer(), {})).toThrow(/No agreement values were written/i)
    })

    // Better a loud failure than a contract with the bank account in the telephone cell.
    it('throws instead of guessing when the template layout has changed', () => {
        const zip = new PizZip(templateBuffer())
        const xml = zip.file('word/document.xml').asText()
        zip.file('word/document.xml', xml.replace('Name of the Entity', 'Entity Title'))

        expect(() =>
            fillAgreementForm(zip.generate({ type: 'nodebuffer' }), VALUES)
        ).toThrow(/no longer matches the expected form layout/i)
    })

    // XML 1.0 forbids these; one would produce a .docx Word refuses to open, reported as ready.
    it('strips control characters rather than producing a document Word cannot open', () => {
        const filled = fillAgreementForm(templateBuffer(), {
            ...VALUES,
            entityName: 'Acme\u0000 Technologies\u0007',
        })
        const xml = new PizZip(filled).file('word/document.xml').asText()

        // eslint-disable-next-line no-control-regex
        const forbidden = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/
        expect(forbidden.test(xml)).toBe(false)
        expect(rowsOf(filled)[1][1]).toBe('Acme Technologies')
    })

    it('flattens a multi-line address into the single form cell', () => {
        const rows = rowsOf(
            fillAgreementForm(templateBuffer(), { ...VALUES, regAddress: '12 MG Road\nBengaluru' })
        )

        expect(rows[3][0]).toBe('Registered Address 12 MG Road Bengaluru')
    })
})
