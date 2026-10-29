const { Op } = require('sequelize')
const corporateDocuments = require('../../entities/corporateDocuments')
const { createCorporateDocument, delectDocfiles, findAllCorporateDocuments } = require('../corporateDocuments')

jest.mock('../../entities/corporateDocuments', () => ({
    upsert: jest.fn(),
    destroy: jest.fn(),
    findAll: jest.fn(),
}))

describe('createCorporateDocument', () => {
    it('stores the recorded size so the total can be measured without reading S3', async () => {
        await createCorporateDocument({
            documentName: 'MOA',
            corporateUserId: 42,
            document: 'url',
            documentType: 'pdf',
            sizeBytes: 4096,
        })

        expect(corporateDocuments.upsert).toHaveBeenCalledWith(
            expect.objectContaining({ sizeBytes: 4096 })
        )
    })

    beforeEach(() => jest.clearAllMocks())

    it('upserts the document, always marking it UPLOADED', async () => {
        corporateDocuments.upsert.mockResolvedValue([{}, true])

        await createCorporateDocument({
            documentName: 'GST_Certificate',
            corporateUserId: 42,
            document: 'https://cdn.example/some-key',
            documentType: 'pdf',
            fileName: 'gst-certificate.pdf',
            expiryDate: '2027-01-15',
        })

        expect(corporateDocuments.upsert).toHaveBeenCalledWith({
            documentName: 'GST_Certificate',
            corporateUserId: 42,
            document: 'https://cdn.example/some-key',
            documentType: 'pdf',
            fileName: 'gst-certificate.pdf',
            expiryDate: '2027-01-15',
            sizeBytes: null,
            status: 'UPLOADED',
        })
    })

    it('defaults expiryDate and fileName to null when not supplied', async () => {
        corporateDocuments.upsert.mockResolvedValue([{}, true])

        await createCorporateDocument({ documentName: 'MOA', corporateUserId: 42, document: 'url', documentType: 'pdf' })

        expect(corporateDocuments.upsert).toHaveBeenCalledWith(
            expect.objectContaining({ expiryDate: null, fileName: null })
        )
    })
})

describe('delectDocfiles', () => {
    beforeEach(() => jest.clearAllMocks())

    it('deletes by documentName list + corporateUserId, returning how many rows went', async () => {
        corporateDocuments.destroy.mockResolvedValue(2)

        const result = await delectDocfiles({ docNamelist: ['MOA', 'AOA'], corporateUserId: 42 })

        expect(corporateDocuments.destroy).toHaveBeenCalledWith({
            where: { documentName: ['MOA', 'AOA'], corporateUserId: 42 },
        })
        expect(result).toBe(2)
    })

    it('reports a DB error to the caller rather than swallowing it', async () => {
        corporateDocuments.destroy.mockRejectedValue(new Error('DB is down'))

        await expect(delectDocfiles({ docNamelist: ['MOA'], corporateUserId: 42 })).rejects.toThrow('DB is down')
    })

    it('defaults docNamelist to an empty array when omitted', async () => {
        corporateDocuments.destroy.mockResolvedValue(0)

        await delectDocfiles({ corporateUserId: 42 })

        expect(corporateDocuments.destroy).toHaveBeenCalledWith({ where: { documentName: [], corporateUserId: 42 } })
    })
})

describe('findAllCorporateDocuments', () => {
    beforeEach(() => jest.clearAllMocks())

    it('filters by corporateUserId + documentName IN the given checklist, flattened/raw', async () => {
        corporateDocuments.findAll.mockResolvedValue([])

        await findAllCorporateDocuments({ corporateUserId: 42, documentNames: ['MOA', 'AOA'] })

        expect(corporateDocuments.findAll).toHaveBeenCalledWith({
            where: { corporateUserId: 42, documentName: { [Op.in]: ['MOA', 'AOA'] } },
            attributes: [
                'id',
                'documentName',
                'document',
                'documentType',
                'fileName',
                'corporateUserId',
                'status',
                'expiryDate',
                'updatedAt',
            ],
            raw: true,
            nest: true,
        })
    })

    it('returns whatever rows the model resolves', async () => {
        const rows = [{ documentName: 'MOA', document: 'url' }]
        corporateDocuments.findAll.mockResolvedValue(rows)

        const result = await findAllCorporateDocuments({ corporateUserId: 42, documentNames: ['MOA'] })

        expect(result).toBe(rows)
    })
})
