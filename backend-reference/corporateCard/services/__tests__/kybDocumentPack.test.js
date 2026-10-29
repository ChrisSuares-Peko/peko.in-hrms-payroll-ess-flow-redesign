jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../utils/s3', () => ({ getDocumentDecrypted: jest.fn() }))
jest.mock('../../models/use-cases/corporateDocuments', () => ({ findAllCorporateDocuments: jest.fn() }))

const PizZip = require('pizzip')
const { customLog } = require('../../utils/loggerHelper')
const { getDocumentDecrypted } = require('../../utils/s3')
const { findAllCorporateDocuments } = require('../../models/use-cases/corporateDocuments')
const { buildKybDocumentPack, ARCHIVE_NAME, MAX_RAW_BYTES } = require('../kybDocumentPack')

const row = (documentName, fileName) => ({
    documentName,
    fileName,
    documentType: 'pdf',
    document: `s3/${documentName}`,
})

// utils/s3 getDocumentDecrypted resolves { buffer, type } — never a bare Buffer.
const decrypted = (buffer, type = 'pdf') => ({ buffer, type })

const MB = 1024 * 1024

beforeEach(() => {
    jest.clearAllMocks()
    findAllCorporateDocuments.mockResolvedValue([
        row('Certificate_Of_Incorporation', 'coi.pdf'),
        row('Corporate_Agreement_Signed', 'signed.pdf'),
    ])
    getDocumentDecrypted.mockResolvedValue(decrypted(Buffer.from('pdf-bytes')))
})

const build = (maxTotalBytes = 20 * MB) =>
    buildKybDocumentPack({ corporateId: 42, logTraceId: 't', maxTotalBytes })

const entriesOf = (pack) => Object.keys(new PizZip(pack.attachments[0].content).files)

describe('building the vendor KYB pack', () => {
    it('sends one zip rather than a separate attachment per document', async () => {
        const pack = await build()

        expect(pack.attachments).toHaveLength(1)
        expect(pack.attachments[0].filename).toBe(ARCHIVE_NAME)
    })

    it('puts every uploaded document inside the archive under its own file name', async () => {
        const pack = await build()

        expect(entriesOf(pack)).toEqual(['Certificate of Incorporation.pdf', 'Corporate Agreement (e-signed).pdf'])
    })

    it('produces a real zip the vendor can open', async () => {
        const pack = await build()

        expect(pack.attachments[0].content.subarray(0, 2).toString('latin1')).toBe('PK')
        expect(new PizZip(pack.attachments[0].content).file('Certificate of Incorporation.pdf').asNodeBuffer().toString()).toBe('pdf-bytes')
    })

    it('compresses, so the archive is smaller than the documents it holds', async () => {
        getDocumentDecrypted.mockResolvedValue(decrypted(Buffer.alloc(200_000, 'a')))

        const pack = await build()

        expect(pack.totalBytes).toBeLessThan(pack.rawBytes)
    })

    it('names each file for the document it is, not for whatever the corporate called the upload', async () => {
        findAllCorporateDocuments.mockResolvedValue([
            row('GST_Certificate', 'Screenshot 2026-08-17 at 11.57.42 AM.png'),
            row('Signing_Authority_Pan_Card', 'Screenshot 2026-08-17 at 11.57.42 AM (2).png'),
        ])

        const pack = await build()

        expect(entriesOf(pack)).toEqual(['GST Certificate.pdf', 'Signing Authority PAN Card.pdf'])
    })

    it('keeps two uploads apart even when they resolve to the same name', async () => {
        findAllCorporateDocuments.mockResolvedValue([
            row('GST_Certificate', 'a.pdf'),
            row('GST_Certificate', 'b.pdf'),
        ])

        const pack = await build()

        expect(entriesOf(pack)).toEqual(['GST Certificate.pdf', 'GST Certificate (2).pdf'])
    })

    it('never lets a label with a slash become a folder inside the archive', async () => {
        findAllCorporateDocuments.mockResolvedValue([row('LLP_Agreement', 'deed.pdf')])

        const pack = await build()

        expect(entriesOf(pack)).toEqual(['LLP Agreement - Deed.pdf'])
        expect(entriesOf(pack)[0]).not.toContain('/')
    })

    it('includes the e-signed agreement', async () => {
        const pack = await build()

        expect(pack.attached).toContain('Corporate Agreement (e-signed)')
    })

    it('puts the e-signed agreement PDF inside the archive, not just in the listing', async () => {
        findAllCorporateDocuments.mockResolvedValue([
            { documentName: 'Corporate_Agreement_Signed', fileName: 'Corporate-Agreement-Signed.pdf', documentType: 'pdf', document: 's3/signed' },
        ])
        getDocumentDecrypted.mockResolvedValue(decrypted(Buffer.from('signed-pdf-bytes')))

        const pack = await build()

        expect(entriesOf(pack)).toEqual(['Corporate Agreement (e-signed).pdf'])
        expect(new PizZip(pack.attachments[0].content).file('Corporate Agreement (e-signed).pdf').asNodeBuffer().toString())
            .toBe('signed-pdf-bytes')
    })

    it('reads the decrypted payload off .buffer, the shape utils/s3 actually returns', async () => {
        getDocumentDecrypted.mockResolvedValue(decrypted(Buffer.from('real-bytes')))

        const pack = await build()

        expect(pack.attachments).toHaveLength(1)
        expect(new PizZip(pack.attachments[0].content).file('Certificate of Incorporation.pdf').asNodeBuffer().toString()).toBe('real-bytes')
    })

    it('gives an extensionless upload one, so the vendor can open it out of the zip', async () => {
        findAllCorporateDocuments.mockResolvedValue([
            { documentName: 'Certificate_Of_Incorporation', fileName: null, documentType: 'pdf', document: 's3/coi' },
        ])

        const pack = await build()

        expect(entriesOf(pack)).toEqual(['Certificate of Incorporation.pdf'])
    })

    it('takes the extension from the stored document type', async () => {
        findAllCorporateDocuments.mockResolvedValue([
            { documentName: 'Certificate_Of_Incorporation', fileName: 'coi.png', documentType: 'png', document: 's3/coi' },
        ])

        const pack = await build()

        expect(entriesOf(pack)).toEqual(['Certificate of Incorporation.png'])
    })

    it('falls back to the uploaded file name for the extension when no type was stored', async () => {
        findAllCorporateDocuments.mockResolvedValue([
            { documentName: 'Certificate_Of_Incorporation', fileName: 'scan.jpg', documentType: null, document: 's3/coi' },
        ])
        getDocumentDecrypted.mockResolvedValue({ buffer: Buffer.from('bytes'), type: null })

        const pack = await build()

        expect(entriesOf(pack)).toEqual(['Certificate of Incorporation.jpg'])
    })

    it('asks for every reviewable document, not just one business type checklist', async () => {
        await build()

        const { documentNames } = findAllCorporateDocuments.mock.calls[0][0]
        expect(documentNames).toContain('Certificate_Of_Incorporation')
        expect(documentNames).toContain('Corporate_Agreement_Signed')
    })

    it('never asks for the form-filled agreement, which is internal only', async () => {
        await build()

        const { documentNames } = findAllCorporateDocuments.mock.calls[0][0]
        expect(documentNames).not.toContain('Corporate_Agreement_Generated')
    })

    it('leaves the form-filled agreement out of the listing too, so the vendor is not told to chase it', async () => {
        findAllCorporateDocuments.mockResolvedValue([
            { documentName: 'Corporate_Agreement_Generated', fileName: 'draft.pdf', documentType: 'pdf', document: 's3/draft' },
            { documentName: 'Corporate_Agreement_Signed', fileName: 'signed.pdf', documentType: 'pdf', document: 's3/signed' },
        ])

        const pack = await build()

        expect(pack.attached).not.toContain('Corporate Agreement (filled from the form)')
        expect(pack.omitted).not.toContain('Corporate Agreement (filled from the form)')
    })

    it('keeps going when one document cannot be read', async () => {
        getDocumentDecrypted
            .mockRejectedValueOnce(new Error('kms denied'))
            .mockResolvedValueOnce(decrypted(Buffer.from('pdf-bytes')))

        const pack = await build()

        expect(entriesOf(pack)).toEqual(['Corporate Agreement (e-signed).pdf'])
        expect(pack.omitted).toEqual(['Certificate of Incorporation'])
    })

    it('reports an incomplete pack at error level, because the vendor cannot see what is missing', async () => {
        getDocumentDecrypted.mockRejectedValue(new Error('kms denied'))

        await build()

        expect(customLog).toHaveBeenCalledWith('t', 'error', expect.objectContaining({
            message: expect.stringContaining('incomplete'),
        }), 'CONSOLE')
    })

    it.each([
        ['an empty buffer', decrypted(Buffer.alloc(0))],
        ['a non-buffer payload', decrypted('not-a-buffer')],
        ['a bare Buffer, which is not the contract', Buffer.from('pdf-bytes')],
        ['nothing at all', null],
    ])('never attaches %s', async (_label, content) => {
        getDocumentDecrypted.mockResolvedValue(content)

        const pack = await build()

        expect(pack.attachments).toHaveLength(0)
    })

    it('returns an empty pack when the corporate uploaded nothing', async () => {
        findAllCorporateDocuments.mockResolvedValue([])

        const pack = await build()

        expect(pack).toMatchObject({ attachments: [], attached: [], omitted: [], exceeded: false })
        expect(getDocumentDecrypted).not.toHaveBeenCalled()
    })
})

describe('the vendor size limit', () => {
    const incompressible = (bytes) => require('crypto').randomBytes(bytes)

    it('measures the compressed archive against the limit, not the raw documents', async () => {
        findAllCorporateDocuments.mockResolvedValue([row('Certificate_Of_Incorporation', 'coi.pdf')])
        getDocumentDecrypted.mockResolvedValue(decrypted(Buffer.alloc(4 * MB, 'a')))

        const pack = await build(1 * MB)

        expect(pack.rawBytes).toBeGreaterThan(1 * MB)
        expect(pack.exceeded).toBe(false)
    })

    it('refuses the whole pack when the archive is over the limit', async () => {
        findAllCorporateDocuments.mockResolvedValue([row('Certificate_Of_Incorporation', 'coi.pdf')])
        getDocumentDecrypted.mockResolvedValue(decrypted(incompressible(2 * MB)))

        const pack = await build(1 * MB)

        expect(pack.exceeded).toBe(true)
        expect(pack.attachments).toEqual([])
    })

    it('reports the limit it was measured against, so the admin can be told the number', async () => {
        findAllCorporateDocuments.mockResolvedValue([row('Certificate_Of_Incorporation', 'coi.pdf')])
        getDocumentDecrypted.mockResolvedValue(decrypted(incompressible(2 * MB)))

        const pack = await build(1 * MB)

        expect(pack.limitBytes).toBe(1 * MB)
        expect(pack.totalBytes).toBeGreaterThan(1 * MB)
    })

    it('names every document even on a refused pack, so the admin knows what was too big', async () => {
        getDocumentDecrypted.mockResolvedValue(decrypted(incompressible(2 * MB)))

        const pack = await build(1 * MB)

        expect(pack.attached).toEqual(['Certificate of Incorporation', 'Corporate Agreement (e-signed)'])
    })

    it('logs an over-limit pack at error level', async () => {
        findAllCorporateDocuments.mockResolvedValue([row('Certificate_Of_Incorporation', 'coi.pdf')])
        getDocumentDecrypted.mockResolvedValue(decrypted(incompressible(2 * MB)))

        await build(1 * MB)

        expect(customLog).toHaveBeenCalledWith('t', 'error', expect.objectContaining({
            action: 'corporateCard:kybPack:overLimit',
        }), 'CONSOLE')
    })

    it('falls back to the memory ceiling when no limit is supplied', async () => {
        const pack = await buildKybDocumentPack({ corporateId: 42, logTraceId: 't' })

        expect(pack.limitBytes).toBe(MAX_RAW_BYTES)
        expect(pack.exceeded).toBe(false)
    })
})
