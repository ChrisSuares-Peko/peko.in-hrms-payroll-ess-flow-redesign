jest.mock('../../utils/esignClient', () => ({
    dispatchAgreement: jest.fn(),
    fetchAgreementStatus: jest.fn(),
}))
jest.mock('../../utils/s3', () => ({
    getDocumentDecrypted: jest.fn(),
    uploadFileEncryptedToS3: jest.fn(),
}))
jest.mock('../../models/use-cases/corporateCardAdminApplication', () => ({
    findByCorporate: jest.fn(),
    upsertByCorporate: jest.fn(),
}))
jest.mock('../../models/use-cases/corporateCardAgreement', () => ({
    upsertByCorporate: jest.fn(),
}))
jest.mock('../../models/use-cases/corporateDocuments', () => ({
    createCorporateDocument: jest.fn(),
}))
jest.mock('../../utils/cacheDataMethods', () => ({
    client: { set: jest.fn(), del: jest.fn() },
}))

const esignClient = require('../../utils/esignClient')
const s3 = require('../../utils/s3')
const applicationUC = require('../../models/use-cases/corporateCardAdminApplication')
const agreementUC = require('../../models/use-cases/corporateCardAgreement')
const documentsUC = require('../../models/use-cases/corporateDocuments')
const { client } = require('../../utils/cacheDataMethods')
const { dispatch, applyTerminalStatus, refreshEsignStatus } = require('../agreementEsign')

const AGREEMENT = {
    corporateId: 42,
    generatedPdfKey: 'staging/corporate/acme/KYB-Documents/uuid-pdf',
    generatedDocumentKey: 'staging/corporate/acme/KYB-Documents/uuid-docx',
    signatoryName: 'Aarav Sharma',
    signatoryEmail: 'aarav@acme.test',
    signatoryContact: '9876543210',
    officialContactName: 'Aarav Sharma',
    officialContactEmail: 'ops@acme.test',
    entityName: 'Acme Technologies Pvt Ltd',
}

const APPLICATION = { corporateId: 42, createdByCredentialId: 7 }

const fieldsOf = (mock, call = 0) => mock.mock.calls[call][1]

beforeEach(() => {
    jest.clearAllMocks()
    client.set.mockResolvedValue('OK')
    client.del.mockResolvedValue(1)
    s3.getDocumentDecrypted.mockResolvedValue({ buffer: Buffer.from('%PDF-1.4 fake'), type: 'pdf' })
    s3.uploadFileEncryptedToS3.mockResolvedValue('staging/corporate/42/KYB-Documents/signed-key')
    applicationUC.upsertByCorporate.mockResolvedValue({})
    agreementUC.upsertByCorporate.mockResolvedValue({})
    documentsUC.createCorporateDocument.mockResolvedValue({})
    esignClient.dispatchAgreement.mockResolvedValue({ epakId: 'EPAK-1', signingLink: 'https://sign.test/1' })
})

describe('dispatch', () => {
    it('sends the generated PDF and records the envelope', async () => {
        const result = await dispatch({ corporateId: 42, application: APPLICATION, agreement: AGREEMENT, req: {} })

        expect(result).toEqual({ epakId: 'EPAK-1', signingLink: 'https://sign.test/1' })
        const body = esignClient.dispatchAgreement.mock.calls[0][0]
        expect(body.signer).toEqual({
            name: 'Aarav Sharma',
            email: 'aarav@acme.test',
            mobile: '9876543210',
        })
        expect(body.signingPolicy).toBe('AADHAAR')
        expect(body.documentBase64).toBe(Buffer.from('%PDF-1.4 fake').toString('base64'))
        expect(fieldsOf(applicationUC.upsertByCorporate)).toMatchObject({
            esignStatus: 'SENT',
            esignReference: 'EPAK-1',
            esignSigningLink: 'https://sign.test/1',
        })
    })

    /**
     * The caller stamps PENDING_DISPATCH before calling in, and the upload screen hides the agreement form
     * while esignStatus is set and not FAILED — so refusing without marking FAILED strands the corporate on
     * "Preparing Your Agreement" with nothing to correct and no way to retry.
     */
    it('refuses to send a Word file when the PDF conversion failed, and marks it FAILED', async () => {
        await expect(dispatch({
            corporateId: 42,
            application: APPLICATION,
            agreement: { ...AGREEMENT, generatedPdfKey: null },
            req: {},
        })).rejects.toMatchObject({ status_code: 503 })

        expect(esignClient.dispatchAgreement).not.toHaveBeenCalled()
        expect(fieldsOf(applicationUC.upsertByCorporate)).toMatchObject({
            esignStatus: 'FAILED',
        })
    })

    it('marks it FAILED when the signatory details are missing, rather than stranding the form', async () => {
        await expect(dispatch({
            corporateId: 42,
            application: APPLICATION,
            agreement: { ...AGREEMENT, signatoryEmail: '', signatoryName: '' },
            req: {},
        })).rejects.toMatchObject({ status_code: 400 })

        expect(esignClient.dispatchAgreement).not.toHaveBeenCalled()
        expect(fieldsOf(applicationUC.upsertByCorporate)).toMatchObject({
            esignStatus: 'FAILED',
        })
    })

    /**
     * The exception: another request holds the lock and is dispatching right now, so its PENDING_DISPATCH is
     * accurate. Marking FAILED here would report a failure that is not happening.
     */
    it('leaves the status alone when another dispatch already holds the lock', async () => {
        client.set.mockResolvedValue(null)

        await expect(dispatch({ corporateId: 42, application: APPLICATION, agreement: AGREEMENT, req: {} }))
            .rejects.toMatchObject({ status_code: 409 })

        expect(esignClient.dispatchAgreement).not.toHaveBeenCalled()
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('records a failure instead of leaving the status on SENT when the vendor leg fails', async () => {
        esignClient.dispatchAgreement.mockRejectedValue(new Error('gateway timeout'))

        await expect(dispatch({ corporateId: 42, application: APPLICATION, agreement: AGREEMENT, req: {} }))
            .rejects.toThrow('gateway timeout')

        expect(fieldsOf(applicationUC.upsertByCorporate)).toMatchObject({ esignStatus: 'FAILED' })
    })

    it('lets only one dispatch through when the same agreement is sent twice at once', async () => {
        client.set.mockResolvedValue(null)

        await expect(dispatch({ corporateId: 42, application: APPLICATION, agreement: AGREEMENT, req: {} }))
            .rejects.toMatchObject({ status_code: 409 })

        expect(esignClient.dispatchAgreement).not.toHaveBeenCalled()
    })

    it('releases the lock even when the dispatch fails', async () => {
        esignClient.dispatchAgreement.mockRejectedValue(new Error('boom'))

        await expect(dispatch({ corporateId: 42, application: APPLICATION, agreement: AGREEMENT, req: {} }))
            .rejects.toThrow()

        expect(client.del).toHaveBeenCalledWith('cc:esign:dispatch:42')
    })
})

describe('applyTerminalStatus', () => {
    it('ignores a status for an envelope that has been superseded', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ corporateId: 42, esignReference: 'EPAK-2', esignStatus: 'SENT' })

        const result = await applyTerminalStatus({ corporateId: 42, epakId: 'EPAK-1', status: 'SIGNED', req: {} })

        expect(result).toEqual({ applied: false, ignored: 'stale-envelope' })
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('stores the signed copy exactly once when the callback is replayed', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ corporateId: 42, esignReference: 'EPAK-1', esignStatus: 'SENT' })
        await applyTerminalStatus({ corporateId: 42, epakId: 'EPAK-1', status: 'SIGNED', signedPdfBase64: 'Zm9v', req: {} })

        applicationUC.findByCorporate.mockResolvedValue({ corporateId: 42, esignReference: 'EPAK-1', esignStatus: 'SIGNED' })
        const replay = await applyTerminalStatus({ corporateId: 42, epakId: 'EPAK-1', status: 'SIGNED', signedPdfBase64: 'Zm9v', req: {} })

        expect(replay).toEqual({ applied: false, ignored: 'already-signed' })
        expect(documentsUC.createCorporateDocument).toHaveBeenCalledTimes(1)
        expect(agreementUC.upsertByCorporate).toHaveBeenCalledWith(42, { signedPdfKey: 'staging/corporate/42/KYB-Documents/signed-key' })
    })

    it('never turns a signed agreement back into a failure', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ corporateId: 42, esignReference: 'EPAK-1', esignStatus: 'SIGNED' })

        const result = await applyTerminalStatus({ corporateId: 42, epakId: 'EPAK-1', status: 'FAILED', reason: 'DECLINED', req: {} })

        expect(result).toEqual({ applied: false, ignored: 'already-signed' })
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    // The push callback and the read-through can arrive together; only one may write the signed copy.
    it('drops a concurrent terminal write instead of storing the signed copy twice', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ corporateId: 42, esignReference: 'EPAK-1', esignStatus: 'SENT' })
        client.set.mockResolvedValue(null)

        const result = await applyTerminalStatus({ corporateId: 42, epakId: 'EPAK-1', status: 'SIGNED', signedPdfBase64: 'Zm9v', req: {} })

        expect(result).toEqual({ applied: false, ignored: 'in-flight' })
        expect(documentsUC.createCorporateDocument).not.toHaveBeenCalled()
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('releases the terminal lock so the next status can still be applied', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ corporateId: 42, esignReference: 'EPAK-1', esignStatus: 'SENT' })

        await applyTerminalStatus({ corporateId: 42, epakId: 'EPAK-1', status: 'SIGNED', signedPdfBase64: 'Zm9v', req: {} })

        expect(client.del).toHaveBeenCalledWith('cc:esign:terminal:42')
    })

    it('records a decline as a failure the corporate can retry', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ corporateId: 42, esignReference: 'EPAK-1', esignStatus: 'SENT' })

        await applyTerminalStatus({ corporateId: 42, epakId: 'EPAK-1', status: 'FAILED', reason: 'They declined.', req: {} })

        expect(fieldsOf(applicationUC.upsertByCorporate)).toMatchObject({
            esignStatus: 'FAILED',
            esignFailureReason: 'They declined.',
        })
    })

    it('still marks the agreement signed when the signed copy could not be stored', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ corporateId: 42, esignReference: 'EPAK-1', esignStatus: 'SENT' })
        s3.uploadFileEncryptedToS3.mockRejectedValue(new Error('s3 down'))

        const result = await applyTerminalStatus({ corporateId: 42, epakId: 'EPAK-1', status: 'SIGNED', signedPdfBase64: 'Zm9v', req: {} })

        expect(result).toMatchObject({ applied: true, status: 'SIGNED' })
        expect(fieldsOf(applicationUC.upsertByCorporate)).toMatchObject({ esignStatus: 'SIGNED' })
    })
})

describe('refreshEsignStatus', () => {
    const SENT = { corporateId: 42, esignStatus: 'SENT', esignReference: 'EPAK-1' }

    it('does not call upstream for an agreement that is not out for signature', async () => {
        await refreshEsignStatus({ application: { corporateId: 42, esignStatus: 'SIGNED' }, req: {} })

        expect(esignClient.fetchAgreementStatus).not.toHaveBeenCalled()
    })

    it('does not call upstream while the throttle window is open', async () => {
        client.set.mockResolvedValue(null)

        await refreshEsignStatus({ application: SENT, req: {} })

        expect(esignClient.fetchAgreementStatus).not.toHaveBeenCalled()
    })

    it('heals a lost callback by pulling the completion and the signed copy', async () => {
        esignClient.fetchAgreementStatus.mockResolvedValue({
            found: true,
            status: 'COMPLETED',
            signedPdfBase64: 'Zm9v',
            updatedAt: '2026-08-17T10:00:00.000Z',
        })
        applicationUC.findByCorporate.mockResolvedValue(SENT)

        await refreshEsignStatus({ application: SENT, req: {} })

        expect(esignClient.fetchAgreementStatus).toHaveBeenCalledWith('EPAK-1', expect.objectContaining({ includeDocument: true }))
        expect(fieldsOf(applicationUC.upsertByCorporate)).toMatchObject({ esignStatus: 'SIGNED' })
        expect(documentsUC.createCorporateDocument).toHaveBeenCalledTimes(1)
    })

    it('records an expiry upstream as a failure', async () => {
        esignClient.fetchAgreementStatus.mockResolvedValue({ found: true, status: 'EXPIRED' })
        applicationUC.findByCorporate.mockResolvedValue(SENT)

        await refreshEsignStatus({ application: SENT, req: {} })

        expect(fieldsOf(applicationUC.upsertByCorporate)).toMatchObject({ esignStatus: 'FAILED' })
    })

    it('degrades to the stored status when the upstream read fails', async () => {
        esignClient.fetchAgreementStatus.mockRejectedValue(new Error('unreachable'))

        const result = await refreshEsignStatus({ application: SENT, req: {} })

        expect(result).toBe(SENT)
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })
})
