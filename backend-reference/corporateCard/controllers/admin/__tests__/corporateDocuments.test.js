const agreementUC = require('../../../models/use-cases/corporateCardAgreement')
const applicationUC = require('../../../models/use-cases/corporateCardAdminApplication')
const documentsUC = require('../../../models/use-cases/corporateDocuments')
const { findCorporateDocumentsForAdmin, downloadAllCorporateDocumentsForAdmin } = require('../corporateDocuments')
const { buildKybDocumentPack } = require('../../../services/kybDocumentPack')

jest.mock('../../../models/use-cases/corporateDocuments', () => ({ findAllCorporateDocuments: jest.fn() }))
jest.mock('../../../models/use-cases/corporateCardAdminApplication', () => ({ findByCorporate: jest.fn() }))
jest.mock('../../../models/use-cases/corporateCardAgreement', () => ({ findByCorporate: jest.fn() }))
jest.mock('../../../services/kybDocumentPack', () => ({ buildKybDocumentPack: jest.fn() }))
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const payload = (res) => res.json.mock.calls[0][0].data

describe('findCorporateDocumentsForAdmin', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        documentsUC.findAllCorporateDocuments.mockResolvedValue([])
        applicationUC.findByCorporate.mockResolvedValue({ businessType: 'LLP' })
        agreementUC.findByCorporate.mockResolvedValue(null)
    })

    it('looks up documents by the :corporateId route param against the shared checklist', async () => {
        const res = buildRes()

        await findCorporateDocumentsForAdmin({ params: { corporateId: '729' } }, res)

        const { corporateUserId, documentNames } = documentsUC.findAllCorporateDocuments.mock.calls[0][0]
        expect(corporateUserId).toBe('729')
        // Reviewers must be able to open the system-generated agreement, which the corporate can never upload.
        expect(documentNames).toContain('Corporate_Agreement_Generated')
        expect(documentNames).toContain('Cancelled_Cheque')
    })

    it('keys the uploaded documents by documentName, with what the reviewer needs to identify the file', async () => {
        documentsUC.findAllCorporateDocuments.mockResolvedValue([
            {
                documentName: 'Corporate_Agreement',
                document: 'url-1',
                documentType: 'docx',
                fileName: 'Corporate-Agreement-Filled.docx',
                expiryDate: null,
                status: 'UPLOADED',
                updatedAt: '2026-08-14T06:00:00.000Z',
            },
        ])
        const res = buildRes()

        await findCorporateDocumentsForAdmin({ params: { corporateId: '729' } }, res)

        expect(payload(res).corporateDocuments).toEqual({
            Corporate_Agreement: {
                document: 'url-1',
                documentType: 'docx',
                fileName: 'Corporate-Agreement-Filled.docx',
                expiryDate: null,
                status: 'UPLOADED',
                uploadedAt: '2026-08-14T06:00:00.000Z',
            },
        })
    })

    // The reviewer's rows used to be a hardcoded eight, so an LLP's LLP_Agreement was invisible.
    it("lists every document the corporate's own constitution asks for, plus the agreement ones", async () => {
        const res = buildRes()

        await findCorporateDocumentsForAdmin({ params: { corporateId: '729' } }, res)

        const names = payload(res).documents.map((entry) => entry.documentName)
        expect(names).toEqual([
            'Certificate_Of_Incorporation',
            'LLP_Agreement',
            'Company_Pan',
            'GST_Certificate',
            'Signing_Authority_Pan_Card',
            'Signing_Authority_Aadhaar_Card',
            'Cancelled_Cheque',
            'Address_Proof',
            'Corporate_Agreement_Generated',
            'Corporate_Agreement_Signed',
        ])
        expect(payload(res).businessType).toBe('LLP')
    })

    it('carries a human label and whether each document is required', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ businessType: 'SOCIETY_TRUST' })
        const res = buildRes()

        await findCorporateDocumentsForAdmin({ params: { corporateId: '729' } }, res)

        const darpan = payload(res).documents.find((entry) => entry.documentName === 'Darpan_Id')
        expect(darpan).toEqual({ documentName: 'Darpan_Id', label: 'Darpan ID', required: false })
    })

    // Listing all fifteen would paint a dozen meaningless red "Missing" rows.
    it('lists only the agreement documents when no business type has been chosen', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        const res = buildRes()

        await findCorporateDocumentsForAdmin({ params: { corporateId: '729' } }, res)

        expect(payload(res).documents.map((entry) => entry.documentName)).toEqual([
            'Address_Proof',
            'Corporate_Agreement_Generated',
            'Corporate_Agreement_Signed',
        ])
        expect(payload(res).businessType).toBeNull()
    })

    it('lists the signed agreement as required only when the corporate chose to upload it', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            businessType: 'LLP',
            agreementSignMethod: 'UPLOAD',
        })
        const res = buildRes()

        await findCorporateDocumentsForAdmin({ params: { corporateId: '729' } }, res)

        const row = payload(res).documents.find(
            (entry) => entry.documentName === 'Corporate_Agreement'
        )
        expect(row).toEqual(expect.objectContaining({ required: true }))
    })

    it('omits the signed-agreement row for a corporate on the e-Sign route', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            businessType: 'LLP',
            agreementSignMethod: 'E_SIGN',
        })
        const res = buildRes()

        await findCorporateDocumentsForAdmin({ params: { corporateId: '729' } }, res)

        const names = payload(res).documents.map((entry) => entry.documentName)
        expect(names).not.toContain('Corporate_Agreement')
        expect(names).toContain('Corporate_Agreement_Signed')
    })

    it('adds whatever was uploaded without a business type, as evidence rather than an obligation', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        documentsUC.findAllCorporateDocuments.mockResolvedValue([
            { documentName: 'GST_Certificate', document: 'a', status: 'UPLOADED' },
        ])
        const res = buildRes()

        await findCorporateDocumentsForAdmin({ params: { corporateId: '729' } }, res)

        const gst = payload(res).documents.find((entry) => entry.documentName === 'GST_Certificate')
        expect(gst).toEqual({ documentName: 'GST_Certificate', label: 'GST Certificate', required: false })
        expect(payload(res).documents.find((e) => e.documentName === 'Address_Proof').required).toBe(true)
    })

    it('still surfaces a document that is uploaded but outside the expected list', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ businessType: 'PROPRIETORSHIP' })
        documentsUC.findAllCorporateDocuments.mockResolvedValue([
            { documentName: 'MOA', document: 'url-moa', status: 'UPLOADED' },
        ])
        const res = buildRes()

        await findCorporateDocumentsForAdmin({ params: { corporateId: '729' } }, res)

        const moa = payload(res).documents.find((entry) => entry.documentName === 'MOA')
        expect(moa).toEqual({ documentName: 'MOA', label: 'MOA', required: false })
    })

    describe('progress', () => {
        it('reports the six journey steps so the reviewer can see how far the corporate got', async () => {
            const res = buildRes()

            await findCorporateDocumentsForAdmin({ params: { corporateId: '729' } }, res)

            expect(payload(res).progress.map((entry) => entry.key)).toEqual([
                'business_type',
                'documents',
                'sign_method',
                'agreement_details',
                'agreement_signed',
                'submitted',
            ])
        })

        it('derives the steps from the real rows, not from kybStatus alone', async () => {
            applicationUC.findByCorporate.mockResolvedValue({
                businessType: 'PROPRIETORSHIP',
                kybStatus: 'PENDING',
                kybReference: 'KYB123',
                agreementSignMethod: 'UPLOAD',
            })
            documentsUC.findAllCorporateDocuments.mockResolvedValue([
                { documentName: 'GST_Certificate', document: 'a', status: 'UPLOADED' },
                { documentName: 'Corporate_Agreement', document: 'b', status: 'UPLOADED' },
            ])
            const res = buildRes()

            await findCorporateDocumentsForAdmin({ params: { corporateId: '729' } }, res)

            const byKey = Object.fromEntries(payload(res).progress.map((s) => [s.key, s]))
            expect(byKey.business_type.state).toBe('done')
            // 4 checklist documents plus the address proof; the agreement has its own step.
            expect(byKey.documents.detail).toBe('1 of 5 required documents uploaded')
            expect(byKey.sign_method.detail).toBe('Upload signed copy')
            expect(byKey.agreement_details.state).toBe('not_applicable')
            expect(byKey.agreement_signed.state).toBe('done')
            expect(byKey.submitted.state).toBe('done')
        })

        it('never attaches a timestamp to a step, since none is stored', async () => {
            const res = buildRes()

            await findCorporateDocumentsForAdmin({ params: { corporateId: '729' } }, res)

            payload(res).progress.forEach((entry) => expect(entry).not.toHaveProperty('at'))
        })
    })
})

describe('downloadAllCorporateDocumentsForAdmin', () => {
    const buildDownloadRes = () => {
        const res = buildRes()
        res.setHeader = jest.fn()
        res.send = jest.fn().mockReturnValue(res)
        return res
    }

    beforeEach(() => {
        jest.clearAllMocks()
        buildKybDocumentPack.mockResolvedValue({
            archive: Buffer.from('zip-bytes'),
            attached: ['Certificate of Incorporation', 'GST Certificate'],
            omitted: [],
            totalBytes: 9,
        })
    })

    it('400s a non-numeric corporate without building anything', async () => {
        const next = jest.fn()

        await downloadAllCorporateDocumentsForAdmin({ params: { corporateId: 'abc' } }, buildDownloadRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        expect(buildKybDocumentPack).not.toHaveBeenCalled()
    })

    it('packs every reviewable document, not just the vendor subset', async () => {
        await downloadAllCorporateDocumentsForAdmin({ params: { corporateId: '42' } }, buildDownloadRes(), jest.fn())

        const { corporateId, documentNames } = buildKybDocumentPack.mock.calls[0][0]
        expect(corporateId).toBe(42)
        expect(documentNames).toContain('Corporate_Agreement_Generated')
    })

    it('sends the archive as a zip attachment', async () => {
        const res = buildDownloadRes()

        await downloadAllCorporateDocumentsForAdmin({ params: { corporateId: '42' } }, res, jest.fn())

        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/zip')
        expect(res.setHeader).toHaveBeenCalledWith(
            'Content-Disposition',
            'attachment; filename="corporate-42_KYB-Documents.zip"'
        )
        expect(res.send).toHaveBeenCalledWith(Buffer.from('zip-bytes'))
    })

    it('404s rather than sending an empty archive when nothing is uploaded', async () => {
        buildKybDocumentPack.mockResolvedValue({ archive: null, attached: [], omitted: [], totalBytes: 0 })
        const res = buildDownloadRes()
        const next = jest.fn()

        await downloadAllCorporateDocumentsForAdmin({ params: { corporateId: '42' } }, res, next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }))
        expect(res.send).not.toHaveBeenCalled()
    })
})
