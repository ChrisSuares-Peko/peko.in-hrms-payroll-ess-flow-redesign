const fs = require('fs')
const path = require('path')
const PizZip = require('pizzip')
const Docxtemplater = require('docxtemplater')
const { fillAgreementForm, hasTags } = require('./agreementFormFiller')

const TEMPLATE_DIR = path.join(__dirname, '..', 'public', 'templates')
const TEMPLATE_FILE = 'corporate-agreement.docx'
const TEMPLATE_PATH = path.join(TEMPLATE_DIR, TEMPLATE_FILE)

const DOWNLOAD_FILENAME = 'Peko-Corporate-Card-Agreement.docx'
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const text = (value) => (value === null || value === undefined ? '' : String(value).trim())
const yesNo = (value) => (value === true ? 'Yes' : 'No')

/**
 * The placeholder set the .docx template may reference, as {name} tags.
 *
 * Every key is always present — docxtemplater renders a missing tag as the literal tag text, which would
 * ship a contract reading "{regCity}" to a customer. An empty string is the safe absence.
 */
const buildPlaceholders = (agreement = {}, extra = {}) => ({
    entityName: text(agreement.entityName),

    regAddress: text(agreement.regAddress),
    regCity: text(agreement.regCity),
    regState: text(agreement.regState),
    regPinCode: text(agreement.regPinCode),
    regTelephone: text(agreement.regTelephone),
    regEmail: text(agreement.regEmail),

    billAddress: text(agreement.billSameAsRegistered ? agreement.regAddress : agreement.billAddress),
    billCity: text(agreement.billSameAsRegistered ? agreement.regCity : agreement.billCity),
    billState: text(agreement.billSameAsRegistered ? agreement.regState : agreement.billState),
    billPinCode: text(agreement.billSameAsRegistered ? agreement.regPinCode : agreement.billPinCode),

    gstNumber: text(agreement.gstNumber),
    panNumber: text(agreement.panNumber),
    cinLlpNumber: text(agreement.cinLlpNumber),
    tanNumber: text(agreement.tanNumber),

    bankName: text(agreement.bankName),
    bankBranch: text(agreement.bankBranch),
    bankAccountNumber: text(agreement.bankAccountNumber),
    bankIfsc: text(agreement.bankIfsc),
    bankCity: text(agreement.bankCity),

    officialContactName: text(agreement.officialContactName),
    officialContactMobile: text(agreement.officialContactMobile),
    officialContactEmail: text(agreement.officialContactEmail),

    salespersonName: text(agreement.salespersonName),
    salespersonMobile: text(agreement.salespersonMobile),
    salespersonEmail: text(agreement.salespersonEmail),

    signatoryName: text(agreement.signatoryName),
    signatoryContact: text(agreement.signatoryContact),
    signatoryEmail: text(agreement.signatoryEmail),
    signatoryIsPep: yesNo(agreement.signatoryIsPep),

    businessType: text(extra.businessType),
    kybReference: text(extra.kybReference),
    agreementDate: text(extra.agreementDate),
})

const PLACEHOLDER_KEYS = Object.keys(buildPlaceholders({}))

const templateExists = () => fs.existsSync(TEMPLATE_PATH)

/**
 * Only a successful read is cached. Memoising the absence would mean the template stayed "missing" for
 * the life of the process after it was added.
 */
let cachedTemplate = null
const readTemplate = () => {
    if (!cachedTemplate) cachedTemplate = fs.readFileSync(TEMPLATE_PATH)
    return cachedTemplate
}
const clearTemplateCache = () => {
    cachedTemplate = null
}

/**
 * Fills the committed .docx template and returns it as a buffer. Throws rather than returning an empty
 * buffer: an agreement that silently generated blank would be signed and filed as if it were real.
 *
 * The committed template is Pine Labs' printable form, which carries no {tags} — rendering it through
 * docxtemplater alone returned it untouched, so a reviewer downloaded a blank contract. A tagged
 * template is still honoured if one is ever supplied; otherwise the values are written into the form's
 * own cells.
 */
const renderAgreementDocx = (agreement, extra = {}) => {
    if (!templateExists()) {
        throw new Error(`Corporate agreement template is missing at ${TEMPLATE_PATH}`)
    }

    const template = readTemplate()
    const placeholders = buildPlaceholders(agreement, extra)
    const documentXml = new PizZip(template).file('word/document.xml').asText()

    if (hasTags(documentXml)) {
        const doc = new Docxtemplater(new PizZip(template), { paragraphLoop: true, linebreaks: true })
        doc.render(placeholders)
        return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })
    }

    return fillAgreementForm(template, {
        ...placeholders,
        businessType: extra.businessType ?? agreement?.businessType ?? null,
        signatoryIsPep: agreement?.signatoryIsPep ?? null,
    })
}

module.exports = {
    TEMPLATE_DIR,
    TEMPLATE_FILE,
    TEMPLATE_PATH,
    DOWNLOAD_FILENAME,
    DOCX_MIME,
    PLACEHOLDER_KEYS,
    buildPlaceholders,
    templateExists,
    clearTemplateCache,
    renderAgreementDocx,
}
