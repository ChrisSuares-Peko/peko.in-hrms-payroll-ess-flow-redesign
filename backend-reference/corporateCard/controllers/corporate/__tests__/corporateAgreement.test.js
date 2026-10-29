const applicationUC = require('../../../models/use-cases/corporateCardAdminApplication')
const agreementUC = require('../../../models/use-cases/corporateCardAgreement')
const artifacts = require('../../../services/agreementArtifacts')
const esign = require('../../../services/agreementEsign')
const documentService = require('../../../services/corporateAgreementDocument')
const {
    getAgreement,
    saveAgreement,
    setSignMethod,
    sendAgreementForEsign,
    missingRequired,
} = require('../corporateAgreement')

jest.mock('../../../models/use-cases/corporateCardAdminApplication', () => ({
    findByCorporate: jest.fn(),
    upsertByCorporate: jest.fn(),
}))
jest.mock('../../../models/use-cases/corporateCardAgreement', () => ({
    findByCorporate: jest.fn(),
    upsertByCorporate: jest.fn(),
}))
jest.mock('../../../services/agreementArtifacts', () => ({ storeAgreementArtifacts: jest.fn() }))
jest.mock('../../../services/agreementEsign', () => ({
    dispatch: jest.fn(),
    refreshEsignStatus: jest.fn(({ application }) => application),
}))
jest.mock('../../../services/corporateAgreementDocument', () => ({
    templateExists: jest.fn(),
    TEMPLATE_PATH: '/tmp/corporate-agreement.docx',
    DOWNLOAD_FILENAME: 'Peko-Corporate-Card-Agreement.docx',
    DOCX_MIME: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    res.setHeader = jest.fn()
    res.sendFile = jest.fn()
    return res
}

const DRAFT = { corporateId: 42, entityName: 'Acme Technologies Pvt Ltd', isDraft: true }

const COMPLETE = {
    entityName: 'Acme Technologies Pvt Ltd',
    regAddress: '12 MG Road',
    regCity: 'Bengaluru',
    regState: 'Karnataka',
    regPinCode: '560001',
    regTelephone: '08012345678',
    regEmail: 'ops@acme.test',
    billSameAsRegistered: true,
    gstNumber: '29ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
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
    signatoryName: 'Aarav Sharma',
    signatoryContact: '9876543210',
    signatoryEmail: 'aarav@acme.test',
    signatoryIsPep: false,
}

describe('getAgreement', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        documentService.templateExists.mockReturnValue(true)
    })

    it('400s without a corporate context', async () => {
        const next = jest.fn()

        await getAgreement({ user: {} }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Corporate context is missing.' })
        )
    })

    it('returns the saved draft so a refresh can restore the form', async () => {
        agreementUC.findByCorporate.mockResolvedValue(DRAFT)
        applicationUC.findByCorporate.mockResolvedValue({
            agreementSignMethod: 'E_SIGN',
            esignStatus: 'PENDING_DISPATCH',
        })
        const res = buildRes()

        await getAgreement({ user: { corporateId: 42 } }, res, jest.fn())

        const { data } = res.json.mock.calls[0][0]
        expect(data.agreement.entityName).toBe('Acme Technologies Pvt Ltd')
        expect(data.agreement.isDraft).toBe(true)
        expect(data.signMethod).toBe('E_SIGN')
        expect(data.esignStatus).toBe('PENDING_DISPATCH')
        expect(data.templateAvailable).toBe(true)
    })

    it('reports every field, defaulting the untouched ones, so the client never sees undefined', async () => {
        agreementUC.findByCorporate.mockResolvedValue({ corporateId: 42, entityName: 'Acme' })
        applicationUC.findByCorporate.mockResolvedValue(null)
        const res = buildRes()

        await getAgreement({ user: { corporateId: 42 } }, res, jest.fn())

        const { agreement } = res.json.mock.calls[0][0].data
        expect(agreement.regCity).toBeNull()
        expect(agreement.signatoryIsPep).toBe(false)
    })

    it('returns a null agreement when nothing has been saved yet', async () => {
        agreementUC.findByCorporate.mockResolvedValue(null)
        applicationUC.findByCorporate.mockResolvedValue(null)
        const res = buildRes()

        await getAgreement({ user: { corporateId: 42 } }, res, jest.fn())

        expect(res.json.mock.calls[0][0].data.agreement).toBeNull()
    })

    it('reports the template as unavailable when the file is missing', async () => {
        agreementUC.findByCorporate.mockResolvedValue(null)
        applicationUC.findByCorporate.mockResolvedValue(null)
        documentService.templateExists.mockReturnValue(false)
        const res = buildRes()

        await getAgreement({ user: { corporateId: 42 } }, res, jest.fn())

        expect(res.json.mock.calls[0][0].data.templateAvailable).toBe(false)
    })
})

describe('saveAgreement', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        applicationUC.findByCorporate.mockResolvedValue({ kybStatus: 'PENDING', kybReference: null })
        agreementUC.upsertByCorporate.mockResolvedValue(DRAFT)
    })

    it('saves a partially filled form as a draft, so refreshing does not lose it', async () => {
        const res = buildRes()

        await saveAgreement(
            { user: { corporateId: 42 }, body: { entityName: 'Acme Technologies Pvt Ltd' } },
            res,
            jest.fn()
        )

        expect(agreementUC.upsertByCorporate).toHaveBeenCalledWith(42, {
            entityName: 'Acme Technologies Pvt Ltd',
            isDraft: true,
        })
        expect(res.status).toHaveBeenCalledWith(200)
    })

    /**
     * String() turns null into 'null' and an object into '[object Object]' — both truthy, so they satisfied
     * the required check and were rendered verbatim into the agreement a signatory then signed.
     */
    it('does not stringify junk into the agreement', async () => {
        await saveAgreement(
            {
                user: { corporateId: 42 },
                body: { entityName: null, bankName: { a: 1 }, regEmail: ['x', 'y'], regCity: 42 },
            },
            buildRes(),
            jest.fn()
        )

        expect(agreementUC.upsertByCorporate).toHaveBeenCalledWith(42, {
            entityName: '',
            bankName: '',
            regEmail: '',
            regCity: '42',
            isDraft: true,
        })
    })

    it('ignores fields the client is not allowed to set', async () => {
        await saveAgreement(
            {
                user: { corporateId: 42 },
                body: { entityName: 'Acme', isDraft: false, corporateId: 99, generatedDocumentKey: 'x' },
            },
            buildRes(),
            jest.fn()
        )

        expect(agreementUC.upsertByCorporate).toHaveBeenCalledWith(42, {
            entityName: 'Acme',
            isDraft: true,
        })
    })

    it('refuses to change the agreement once the application has been submitted', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            kybStatus: 'UNDER_REVIEW',
            kybReference: 'KYB123',
        })
        const next = jest.fn()

        await saveAgreement(
            { user: { corporateId: 42 }, body: { entityName: 'Acme' } },
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message:
                    'Your KYB application has already been submitted, so the agreement can no longer be changed.',
                status_code: 400,
            })
        )
        expect(agreementUC.upsertByCorporate).not.toHaveBeenCalled()
    })
})

describe('setSignMethod', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        applicationUC.findByCorporate.mockResolvedValue({ kybStatus: 'PENDING', kybReference: null })
        applicationUC.upsertByCorporate.mockResolvedValue({})
    })

    it('records the chosen signing route', async () => {
        const res = buildRes()

        await setSignMethod({ user: { corporateId: 42 }, body: { signMethod: 'UPLOAD' } }, res, jest.fn())

        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(
            42,
            expect.objectContaining({ agreementSignMethod: 'UPLOAD' })
        )
    })

    it('rejects an unknown signing route', async () => {
        const next = jest.fn()

        await setSignMethod({ user: { corporateId: 42 }, body: { signMethod: 'CARRIER_PIGEON' } }, buildRes(), next)

        expect(next).toHaveBeenCalled()
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })
})

describe('sendAgreementForEsign', () => {
    const KEYS = {
        generatedDocumentKey: 'staging/corporate/abc/KYB-Documents/uuid-docx',
        generatedPdfKey: 'staging/corporate/abc/KYB-Documents/uuid-pdf',
    }

    beforeEach(() => {
        jest.clearAllMocks()
        applicationUC.findByCorporate.mockResolvedValue({ kybStatus: 'PENDING', kybReference: null })
        applicationUC.upsertByCorporate.mockResolvedValue({})
        agreementUC.findByCorporate.mockResolvedValue(null)
        agreementUC.upsertByCorporate.mockResolvedValue({ ...COMPLETE, corporateId: 42, isDraft: false })
        documentService.templateExists.mockReturnValue(true)
        artifacts.storeAgreementArtifacts.mockResolvedValue({ ...KEYS, discardSuperseded: jest.fn() })
        esign.dispatch.mockResolvedValue({ epakId: 'EPAK-1', signingLink: 'https://sign.test/EPAK-1' })
    })

    const send = (body = COMPLETE, res = buildRes(), next = jest.fn()) =>
        sendAgreementForEsign({ user: { corporateId: 42, username: 'abc' }, body }, res, next).then(() => ({ res, next }))

    it('produces the artifacts from the merged agreement, in the corporate own folder', async () => {
        await send()

        expect(artifacts.storeAgreementArtifacts).toHaveBeenCalledWith(
            expect.objectContaining({
                corporateId: 42,
                folder: 'abc',
                agreement: expect.objectContaining({ entityName: COMPLETE.entityName }),
                extra: expect.objectContaining({ businessType: undefined }),
            })
        )
    })

    it('records both stored keys and sends the agreement for signature', async () => {
        const { res } = await send()

        expect(agreementUC.upsertByCorporate).toHaveBeenCalledWith(
            42,
            expect.objectContaining({ isDraft: false, ...KEYS })
        )
        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(
            42,
            expect.objectContaining({ agreementSignMethod: 'E_SIGN', esignStatus: 'PENDING_DISPATCH' })
        )
        expect(esign.dispatch).toHaveBeenCalledWith(
            expect.objectContaining({ corporateId: 42, agreement: expect.objectContaining({ corporateId: 42 }) })
        )
        expect(res.json.mock.calls[0][0].data.esignStatus).toBe('SENT')
    })

    it('reports a failure rather than claiming the agreement was sent', async () => {
        esign.dispatch.mockRejectedValue(Object.assign(new Error('vendor down'), { status_code: 502 }))

        const { res, next } = await send()

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 502 }))
        expect(res.json).not.toHaveBeenCalled()
    })

    it('lists what is still missing rather than rendering a half-empty contract', async () => {
        const incomplete = { ...COMPLETE }
        delete incomplete.entityName
        delete incomplete.gstNumber

        const { next } = await send(incomplete)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('Name of the Entity') })
        )
        expect(artifacts.storeAgreementArtifacts).not.toHaveBeenCalled()
    })

    it('completes the form from what was already saved as a draft', async () => {
        agreementUC.findByCorporate.mockResolvedValue({ ...COMPLETE, corporateId: 42 })

        const { next } = await send({ entityName: 'Acme Technologies Pvt Ltd' })

        expect(next).not.toHaveBeenCalled()
        expect(artifacts.storeAgreementArtifacts).toHaveBeenCalled()
    })

    it('503s rather than sending nothing when the template is missing', async () => {
        documentService.templateExists.mockReturnValue(false)

        const { next } = await send()

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 503 }))
        expect(artifacts.storeAgreementArtifacts).not.toHaveBeenCalled()
    })

    // A Word file must never go for signature, so a failed PDF conversion fails the whole send.
    it('does not queue anything when the artifacts could not be produced', async () => {
        artifacts.storeAgreementArtifacts.mockRejectedValue(new Error('libreoffice missing'))
        const res = buildRes()

        const { next } = await send(COMPLETE, res)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 500 }))
        expect(res.json).not.toHaveBeenCalled()
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('refuses once the application has been submitted', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ kybStatus: 'VERIFIED', kybReference: 'KYB123' })

        const { next } = await send()

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        expect(artifacts.storeAgreementArtifacts).not.toHaveBeenCalled()
    })
})

describe('missingRequired', () => {
    it('does not ask for the billing address when it mirrors the registered one', () => {
        expect(missingRequired({ ...COMPLETE, billSameAsRegistered: true })).toEqual([])
    })

    it('asks for the billing address when it does not', () => {
        expect(missingRequired({ ...COMPLETE, billSameAsRegistered: false })).toEqual([
            'billAddress',
            'billCity',
            'billState',
            'billPinCode',
        ])
    })
})
