const { createCorporateDocument } = require('../../models/use-cases/corporateDocuments')
const { deleteEncryptedFromS3, uploadFileEncryptedToS3 } = require('../../utils/s3')
const { renderAgreementDocx } = require('../corporateAgreementDocument')
const { docxToPdf } = require('../documentPdf')
const { storeAgreementArtifacts } = require('../agreementArtifacts')

jest.mock('../../models/use-cases/corporateDocuments', () => ({ createCorporateDocument: jest.fn() }))
jest.mock('../../utils/s3', () => ({
    uploadFileEncryptedToS3: jest.fn(),
    deleteEncryptedFromS3: jest.fn(),
}))
jest.mock('../corporateAgreementDocument', () => ({ renderAgreementDocx: jest.fn() }))
jest.mock('../documentPdf', () => ({ docxToPdf: jest.fn() }))

const AGREEMENT = { entityName: 'Acme Technologies Pvt Ltd' }

const store = (overrides = {}) =>
    storeAgreementArtifacts({
        corporateId: 42,
        folder: '100000560',
        agreement: AGREEMENT,
        extra: { businessType: 'LLP' },
        req: { LogTraceId: 'trace' },
        ...overrides,
    })

describe('storeAgreementArtifacts', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        renderAgreementDocx.mockReturnValue(Buffer.from('docx-bytes'))
        docxToPdf.mockResolvedValue(Buffer.from('%PDF-1.7 pdf-bytes'))
        // Keyed on the format rather than call order: clearAllMocks does not drain a once-queue, so
        // queued values would leak between tests and assertions would pass for the wrong reason.
        uploadFileEncryptedToS3.mockImplementation((body, path, format) =>
            Promise.resolve(`${path}/${format}-key`)
        )
        createCorporateDocument.mockResolvedValue({})
        deleteEncryptedFromS3.mockResolvedValue(true)
    })

    it('stores the .docx and the .pdf in the corporate folder and returns both keys', async () => {
        const keys = await store()

        expect(uploadFileEncryptedToS3).toHaveBeenNthCalledWith(
            1,
            Buffer.from('docx-bytes').toString('base64'),
            expect.stringContaining('/corporate/100000560/KYB-Documents'),
            'docx'
        )
        expect(uploadFileEncryptedToS3).toHaveBeenNthCalledWith(
            2,
            expect.any(String),
            expect.stringContaining('/corporate/100000560/KYB-Documents'),
            'pdf'
        )
        expect(keys).toEqual(
            expect.objectContaining({
                generatedDocumentKey: 'test/corporate/100000560/KYB-Documents/docx-key',
                generatedPdfKey: 'test/corporate/100000560/KYB-Documents/pdf-key',
            })
        )
    })

    // The PDF is what goes for signature, so that is what the reviewer's row points at.
    it('registers the PDF as the reviewable generated agreement', async () => {
        await store()

        expect(createCorporateDocument).toHaveBeenCalledWith({
            documentName: 'Corporate_Agreement_Generated',
            document: 'test/corporate/100000560/KYB-Documents/pdf-key',
            documentType: 'pdf',
            fileName: 'Corporate-Agreement-Filled.pdf',
            corporateUserId: 42,
            expiryDate: null,
            sizeBytes: 18,
        })
    })

    // One missing binary must not brick KYB for every corporate — but the absence has to be visible.
    it('still stores the .docx when the PDF conversion is unavailable, and reports no PDF', async () => {
        docxToPdf.mockRejectedValue(new Error('Could not find soffice binary'))

        const keys = await store()

        expect(keys.generatedDocumentKey).toBe('test/corporate/100000560/KYB-Documents/docx-key')
        expect(keys.generatedPdfKey).toBeNull()
        expect(uploadFileEncryptedToS3).toHaveBeenCalledTimes(1)
    })

    it('points the reviewable row at the .docx when there is no PDF, rather than at nothing', async () => {
        docxToPdf.mockRejectedValue(new Error('Could not find soffice binary'))

        await store()

        expect(createCorporateDocument).toHaveBeenCalledWith(
            expect.objectContaining({
                document: 'test/corporate/100000560/KYB-Documents/docx-key',
                documentType: 'docx',
                fileName: 'Corporate-Agreement-Filled.docx',
            })
        )
    })

    it('does not register a document when the render itself fails', async () => {
        renderAgreementDocx.mockImplementation(() => {
            throw new Error('template layout changed')
        })

        await expect(store()).rejects.toThrow(/template layout changed/)
        expect(docxToPdf).not.toHaveBeenCalled()
    })

    // Deleting before the row is committed would leave the agreement pointing at objects already gone.
    it('does not delete the superseded copies until the caller asks', async () => {
        const keys = await store({
            previous: { generatedDocumentKey: 'old-docx', generatedPdfKey: 'old-pdf' },
        })

        expect(deleteEncryptedFromS3).not.toHaveBeenCalled()

        await keys.discardSuperseded()

        expect(deleteEncryptedFromS3).toHaveBeenCalledWith('old-docx')
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith('old-pdf')
    })

    it('keeps the fresh copies even when deleting an old one fails', async () => {
        deleteEncryptedFromS3.mockRejectedValue(new Error('S3 is down'))

        const keys = await store({ previous: { generatedDocumentKey: 'old-docx' } })
        await expect(keys.discardSuperseded()).resolves.toBeDefined()

        expect(keys.generatedPdfKey).toBe('test/corporate/100000560/KYB-Documents/pdf-key')
    })

    it('has nothing to delete on a first generation', async () => {
        const keys = await store()
        await keys.discardSuperseded()

        expect(deleteEncryptedFromS3).not.toHaveBeenCalled()
    })
})
