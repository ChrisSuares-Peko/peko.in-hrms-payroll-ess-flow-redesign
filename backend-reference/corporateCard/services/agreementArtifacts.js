const { DOC } = require('../constants/kybDocuments')
const { createCorporateDocument } = require('../models/use-cases/corporateDocuments')
const { deleteEncryptedFromS3, uploadFileEncryptedToS3 } = require('../utils/s3')
const { customLog } = require('../utils/loggerHelper')
const { renderAgreementDocx } = require('./corporateAgreementDocument')
const { docxToPdf } = require('./documentPdf')

const { NODE_ENV } = process.env

const DOCX_NAME = 'Corporate-Agreement-Filled.docx'
const PDF_NAME = 'Corporate-Agreement-Filled.pdf'

const folderFor = (folder) => `${NODE_ENV || 'staging'}/corporate/${folder}/KYB-Documents`

const discard = (key, req) => {
    if (!key) return Promise.resolve()
    return deleteEncryptedFromS3(key).catch((error) => {
        customLog(req?.LogTraceId, 'error', {
            message: '[CorporateAgreement] Could not delete a superseded agreement artifact',
            error: error?.message,
        })
    })
}

/**
 * Renders the agreement, converts it to PDF and stores both.
 *
 * The PDF is the copy that goes for signature. When the conversion itself is unavailable — LibreOffice
 * missing from the host, typically — the .docx is still stored and generatedPdfKey is left null, so a
 * missing binary does not brick KYB for every corporate. The absence is visible on the reviewer's screen
 * and in the log, and dispatch must refuse to send without a PDF.
 */
const storeAgreementArtifacts = async ({ corporateId, folder, agreement, extra = {}, previous = {}, req }) => {
    const docx = renderAgreementDocx(agreement, extra)

    let pdf = null
    try {
        pdf = await docxToPdf(docx, req)
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CorporateAgreement] Stored the agreement without a PDF — the conversion failed',
            corporateId,
            error: error?.message,
        })
    }

    const path = folderFor(folder)
    const generatedDocumentKey = await uploadFileEncryptedToS3(docx.toString('base64'), path, 'docx')
    const generatedPdfKey = pdf
        ? await uploadFileEncryptedToS3(pdf.toString('base64'), path, 'pdf')
        : null

    await createCorporateDocument({
        documentName: DOC.CORPORATE_AGREEMENT_GENERATED.documentName,
        document: generatedPdfKey || generatedDocumentKey,
        documentType: generatedPdfKey ? 'pdf' : 'docx',
        fileName: generatedPdfKey ? PDF_NAME : DOCX_NAME,
        corporateUserId: corporateId,
        expiryDate: null,
        sizeBytes: generatedPdfKey ? pdf.length : docx.length,
    })

    customLog(req?.LogTraceId, 'info', {
        message: '[CorporateAgreement] Agreement rendered and stored',
        corporateId,
        docxBytes: docx.length,
        pdfBytes: pdf ? pdf.length : null,
    })

    return {
        generatedDocumentKey,
        generatedPdfKey,
        // Handed back rather than deleted here: the caller commits the new keys first, so a failed write
        // can never leave the agreement pointing at objects that have already gone.
        discardSuperseded: () =>
            Promise.all(
                [previous.generatedDocumentKey, previous.generatedPdfKey]
                    .filter((key) => key && key !== generatedDocumentKey && key !== generatedPdfKey)
                    .map((key) => discard(key, req))
            ),
    }
}

module.exports = { storeAgreementArtifacts, DOCX_NAME, PDF_NAME }
