const applicationUC = require('../../../models/use-cases/corporateCardAdminApplication')
const documentsUC = require('../../../models/use-cases/corporateDocuments')
const s3 = require('../../../utils/s3')
const { uploadOneKYBDocument, findAllUploadedOneKYBDocs, documentNames } = require('../corporateDocuments')

jest.mock('../../../models/use-cases/corporateDocuments', () => ({
    createCorporateDocument: jest.fn(),
    findAllCorporateDocuments: jest.fn(),
    delectDocfiles: jest.fn(),
}))
jest.mock('../../../models/use-cases/corporateCardAdminApplication', () => ({
    findByCorporate: jest.fn(),
}))
jest.mock('../../../utils/s3', () => ({ uploadFileEncryptedToS3: jest.fn(), deleteEncryptedFromS3: jest.fn() }))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const buildReq = (body) => ({ user: { corporateId: 42, username: 'abc' }, body })

describe('documentNames', () => {
    // Derived from the per-business-type catalogue, so this covers the union of every checklist plus the
    // corporate agreement. The catalogue's own test pins which checklist asks for what.
    it('accepts every document name the checklists can ask for', () => {
        expect(documentNames).toEqual([
            'Certificate_Of_Incorporation',
            'MOA',
            'AOA',
            'Company_Pan',
            'GST_Certificate',
            'Signing_Authority_Pan_Card',
            'Signing_Authority_Aadhaar_Card',
            'Cancelled_Cheque',
            'LLP_Agreement',
            'Partnership_Deed',
            'Business_Pan',
            'Darpan_Id',
            'Corporate_Agreement',
            'Address_Proof',
        ])
    })
})

describe('uploadOneKYBDocument', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        applicationUC.findByCorporate.mockResolvedValue({ kybStatus: 'PENDING', kybReference: null })
        s3.uploadFileEncryptedToS3.mockResolvedValue('https://cdn.example/some-key')
        s3.deleteEncryptedFromS3.mockResolvedValue(true)
        documentsUC.createCorporateDocument.mockResolvedValue({})
        documentsUC.delectDocfiles.mockResolvedValue(1)
        documentsUC.findAllCorporateDocuments.mockResolvedValue([])
    })

    it('rejects when neither documents nor a delete list were sent', async () => {
        const next = jest.fn()

        await uploadOneKYBDocument(buildReq({ documents: [] }), buildRes(), next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'No changes made. Please update at least one field to continue.' })
        )
        expect(s3.uploadFileEncryptedToS3).not.toHaveBeenCalled()
    })

    it('rejects a malformed body instead of collapsing into a generic 500', async () => {
        const next = jest.fn()

        await uploadOneKYBDocument(buildReq({}), buildRes(), next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'No changes made. Please update at least one field to continue.',
                status_code: 400,
            })
        )
    })

    it('rejects a document name outside the accepted checklist', async () => {
        const next = jest.fn()

        await uploadOneKYBDocument(
            buildReq({ documents: [{ documentName: 'Random_Doc', fileBase: 'YQ==', fileFormat: 'pdf' }] }),
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'That document is not accepted.' }))
        expect(s3.uploadFileEncryptedToS3).not.toHaveBeenCalled()
    })

    it('rejects a delete request for a name outside the accepted checklist', async () => {
        const next = jest.fn()

        await uploadOneKYBDocument(buildReq({ documents: [], deleteDoclist: ['Random_Doc'] }), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'That document is not accepted.' }))
        expect(documentsUC.delectDocfiles).not.toHaveBeenCalled()
    })

    const uploadOfSize = async (documentName, bytes, next) => {
        await uploadOneKYBDocument(
            buildReq({
                documents: [
                    {
                        documentName,
                        fileBase: Buffer.alloc(bytes).toString('base64'),
                        fileFormat: 'pdf',
                    },
                ],
            }),
            buildRes(),
            next
        )
    }

    it('rejects a document over its own limit, naming that limit', async () => {
        const next = jest.fn()

        await uploadOfSize('Corporate_Agreement', 3 * 1024 * 1024, next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Corporate Agreement is larger than the 2 MB limit.' })
        )
        expect(s3.uploadFileEncryptedToS3).not.toHaveBeenCalled()
    })

    it('states a sub-megabyte limit in KB rather than a fraction of a MB', async () => {
        const next = jest.fn()

        await uploadOfSize('Cancelled_Cheque', 600 * 1024, next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Cancelled Cheque is larger than the 500 KB limit.' })
        )
    })

    it('lets a document through when it is under its own, larger limit', async () => {
        const next = jest.fn()

        await uploadOfSize('MOA', 3 * 1024 * 1024, next)

        expect(next).not.toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('is larger than') })
        )
    })

    it('rejects the fileFormat "string" sentinel, which would store a client-supplied value as the document', async () => {
        const next = jest.fn()

        await uploadOneKYBDocument(
            buildReq({
                documents: [
                    { documentName: 'Corporate_Agreement', fileBase: 'A'.repeat(500000), fileFormat: 'string' },
                ],
            }),
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Corporate Agreement could not be read. Please upload it again.',
                status_code: 400,
            })
        )
        expect(documentsUC.createCorporateDocument).not.toHaveBeenCalled()
    })

    it('rejects a document with no file content', async () => {
        const next = jest.fn()

        await uploadOneKYBDocument(
            buildReq({ documents: [{ documentName: 'AOA', fileBase: '', fileFormat: 'pdf' }] }),
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'AoA (Articles of Association) could not be read. Please upload it again.',
            })
        )
        expect(s3.uploadFileEncryptedToS3).not.toHaveBeenCalled()
    })

    it("uploads a fresh document to S3, formats the expiry date, and saves it against the caller's corporate", async () => {
        const res = buildRes()

        await uploadOneKYBDocument(
            buildReq({
                documents: [
                    {
                        documentName: 'GST_Certificate',
                        fileBase: 'dGVzdA==',
                        fileFormat: 'pdf',
                        fileName: 'gst-certificate.pdf',
                        expiryDate: '2027-01-15',
                    },
                ],
            }),
            res,
            jest.fn()
        )

        expect(s3.uploadFileEncryptedToS3).toHaveBeenCalledWith(
            'dGVzdA==',
            expect.stringContaining('/corporate/abc/KYB-Documents'),
            'pdf'
        )
        expect(documentsUC.createCorporateDocument).toHaveBeenCalledWith({
            documentName: 'GST_Certificate',
            document: 'https://cdn.example/some-key',
            documentType: 'pdf',
            fileName: 'gst-certificate.pdf',
            corporateUserId: 42,
            expiryDate: '2027-01-15',
            sizeBytes: 4,
        })
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ status: true, data: { savedDocuments: ['GST_Certificate'], deletedDocuments: [] } })
        )
    })

    it('passes a null expiryDate and fileName through when neither was supplied', async () => {
        await uploadOneKYBDocument(
            buildReq({ documents: [{ documentName: 'AOA', fileBase: 'dGVzdA==', fileFormat: 'pdf' }] }),
            buildRes(),
            jest.fn()
        )

        expect(documentsUC.createCorporateDocument).toHaveBeenCalledWith(
            expect.objectContaining({ expiryDate: null, fileName: null })
        )
    })

    it('only answers success once every write has actually completed', async () => {
        const order = []
        s3.uploadFileEncryptedToS3.mockImplementation(async () => {
            order.push('s3')
            return 'https://cdn.example/some-key'
        })
        documentsUC.createCorporateDocument.mockImplementation(async () => {
            order.push('db')
        })
        const res = buildRes()
        res.json.mockImplementation(() => {
            order.push('respond')
            return res
        })

        await uploadOneKYBDocument(
            buildReq({ documents: [{ documentName: 'AOA', fileBase: 'dGVzdA==', fileFormat: 'pdf' }] }),
            res,
            jest.fn()
        )

        expect(order).toEqual(['s3', 'db', 'respond'])
    })

    it('reports a failed S3 upload instead of answering success', async () => {
        const next = jest.fn()
        s3.uploadFileEncryptedToS3.mockRejectedValue(new Error('S3 is down'))
        const res = buildRes()

        await uploadOneKYBDocument(
            buildReq({ documents: [{ documentName: 'AOA', fileBase: 'dGVzdA==', fileFormat: 'pdf' }] }),
            res,
            next
        )

        expect(res.json).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Something went wrong while uploading document', status_code: 500 })
        )
    })

    it('reports a failed database write instead of answering success', async () => {
        const next = jest.fn()
        documentsUC.createCorporateDocument.mockRejectedValue(new Error('deadlock'))
        const res = buildRes()

        await uploadOneKYBDocument(
            buildReq({ documents: [{ documentName: 'AOA', fileBase: 'dGVzdA==', fileFormat: 'pdf' }] }),
            res,
            next
        )

        expect(res.json).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Something went wrong while uploading document', status_code: 500 })
        )
    })

    it('deletes the requested documents and reports which were removed', async () => {
        const res = buildRes()
        documentsUC.findAllCorporateDocuments.mockResolvedValue([
            { documentName: 'MOA', document: 'staging/key-moa' },
            { documentName: 'AOA', document: 'staging/key-aoa' },
        ])

        await uploadOneKYBDocument(buildReq({ documents: [], deleteDoclist: ['MOA', 'AOA'] }), res, jest.fn())

        expect(documentsUC.delectDocfiles).toHaveBeenCalledWith({
            docNamelist: ['MOA', 'AOA'],
            corporateUserId: 42,
        })
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ data: { savedDocuments: [], deletedDocuments: ['MOA', 'AOA'] } })
        )
        expect(s3.deleteEncryptedFromS3).toHaveBeenCalledWith('staging/key-moa')
        expect(s3.deleteEncryptedFromS3).toHaveBeenCalledWith('staging/key-aoa')
    })

    it('still answers success when the stored file could not be deleted, since the row is already gone', async () => {
        documentsUC.findAllCorporateDocuments.mockResolvedValue([
            { documentName: 'MOA', document: 'staging/key-moa' },
        ])
        s3.deleteEncryptedFromS3.mockRejectedValue(new Error('S3 is down'))
        const res = buildRes()
        const next = jest.fn()

        await uploadOneKYBDocument(buildReq({ documents: [], deleteDoclist: ['MOA'] }), res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ data: { savedDocuments: [], deletedDocuments: ['MOA'] } })
        )
    })

    it('deletes the file a re-upload replaced, so the old bytes do not linger in the bucket', async () => {
        documentsUC.findAllCorporateDocuments.mockResolvedValue([
            { documentName: 'AOA', document: 'staging/old-key' },
        ])

        await uploadOneKYBDocument(
            buildReq({ documents: [{ documentName: 'AOA', fileBase: 'dGVzdA==', fileFormat: 'pdf' }] }),
            buildRes(),
            jest.fn()
        )

        expect(s3.deleteEncryptedFromS3).toHaveBeenCalledWith('staging/old-key')
    })

    it('reports a failed delete instead of answering success', async () => {
        const next = jest.fn()
        documentsUC.delectDocfiles.mockRejectedValue(new Error('deadlock'))
        const res = buildRes()

        await uploadOneKYBDocument(buildReq({ documents: [], deleteDoclist: ['MOA'] }), res, next)

        expect(res.json).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 500 }))
    })

    it('ignores a deleteDoclist that is not an array', async () => {
        const next = jest.fn()

        await uploadOneKYBDocument(buildReq({ documents: [], deleteDoclist: 'MOA' }), buildRes(), next)

        expect(documentsUC.delectDocfiles).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'No changes made. Please update at least one field to continue.' })
        )
    })

    describe('once the application has left the corporate\'s hands', () => {
        const document = { documentName: 'AOA', fileBase: 'dGVzdA==', fileFormat: 'pdf' }

        it.each([
            ['PENDING with a reference', { kybStatus: 'PENDING', kybReference: 'KYB123' }],
            ['SUBMITTED', { kybStatus: 'SUBMITTED', kybReference: 'KYB123' }],
            ['UNDER_REVIEW', { kybStatus: 'UNDER_REVIEW', kybReference: 'KYB123' }],
            ['VERIFIED', { kybStatus: 'VERIFIED', kybReference: 'KYB123' }],
            ['COMPLETED', { kybStatus: 'COMPLETED', kybReference: 'KYB123' }],
        ])('refuses an upload while it is %s', async (_label, application) => {
            const next = jest.fn()
            applicationUC.findByCorporate.mockResolvedValue(application)

            await uploadOneKYBDocument(buildReq({ documents: [document] }), buildRes(), next)

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message:
                        'Your KYB application has already been submitted, so its documents can no longer be changed.',
                    status_code: 400,
                })
            )
            expect(s3.uploadFileEncryptedToS3).not.toHaveBeenCalled()
            expect(documentsUC.delectDocfiles).not.toHaveBeenCalled()
        })

        it.each([
            ['no application row yet', null],
            ['a draft', { kybStatus: 'PENDING', kybReference: null }],
            ['a rejected application', { kybStatus: 'REJECTED', kybReference: 'KYB123' }],
        ])('still accepts an upload against %s', async (_label, application) => {
            const next = jest.fn()
            applicationUC.findByCorporate.mockResolvedValue(application)

            await uploadOneKYBDocument(buildReq({ documents: [document] }), buildRes(), next)

            expect(next).not.toHaveBeenCalled()
            expect(documentsUC.createCorporateDocument).toHaveBeenCalled()
        })
    })
})

describe('findAllUploadedOneKYBDocs', () => {
    beforeEach(() => jest.clearAllMocks())

    it('keys the response by documentName and never returns the stored S3 key', async () => {
        documentsUC.findAllCorporateDocuments.mockResolvedValue([
            {
                documentName: 'Corporate_Agreement',
                document: 'staging/corporate/abc/KYB-Documents/uuid-1',
                documentType: 'pdf',
                fileName: 'agreement.pdf',
                expiryDate: null,
                status: 'UPLOADED',
                updatedAt: '2026-08-14T06:00:00.000Z',
            },
        ])
        const res = buildRes()

        await findAllUploadedOneKYBDocs({ user: { corporateId: 42 } }, res)

        expect(documentsUC.findAllCorporateDocuments).toHaveBeenCalledWith({
            corporateUserId: 42,
            documentNames,
        })
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    corporateDocuments: {
                        Corporate_Agreement: {
                            fileName: 'agreement.pdf',
                            documentType: 'pdf',
                            expiryDate: null,
                            status: 'UPLOADED',
                            uploadedAt: '2026-08-14T06:00:00.000Z',
                            sizeBytes: null,
                        },
                    },
                }),
            })
        )
        expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('KYB-Documents/uuid-1')
    })

    it('returns an empty object when nothing has been uploaded yet', async () => {
        documentsUC.findAllCorporateDocuments.mockResolvedValue([])
        const res = buildRes()

        await findAllUploadedOneKYBDocs({ user: { corporateId: 42 } }, res)

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ corporateDocuments: {} }),
            })
        )
    })

    it('reports how much of the total budget the corporate has used', async () => {
        documentsUC.findAllCorporateDocuments.mockResolvedValue([
            { documentName: 'MOA', sizeBytes: 3 * 1024 * 1024 },
            { documentName: 'AOA', sizeBytes: 2 * 1024 * 1024 },
        ])
        const res = buildRes()

        await findAllUploadedOneKYBDocs({ user: { corporateId: 42 } }, res)

        const { totalUsedBytes, totalLimitBytes } = res.json.mock.calls[0][0].data
        expect(totalUsedBytes).toBe(5 * 1024 * 1024)
        expect(totalLimitBytes).toBe(25 * 1024 * 1024)
    })

    it('counts a document with no recorded size as zero rather than breaking the total', async () => {
        documentsUC.findAllCorporateDocuments.mockResolvedValue([
            { documentName: 'MOA', sizeBytes: 1024 },
            { documentName: 'AOA', sizeBytes: null },
        ])
        const res = buildRes()

        await findAllUploadedOneKYBDocs({ user: { corporateId: 42 } }, res)

        expect(res.json.mock.calls[0][0].data.totalUsedBytes).toBe(1024)
    })
})
