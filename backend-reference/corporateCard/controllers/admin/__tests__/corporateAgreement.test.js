const applicationUC = require('../../../models/use-cases/corporateCardAdminApplication')
const agreementUC = require('../../../models/use-cases/corporateCardAgreement')
const artifacts = require('../../../services/agreementArtifacts')
const esign = require('../../../services/agreementEsign')
const documentService = require('../../../services/corporateAgreementDocument')
const sharedDirectory = require('../../../utils/sharedDirectory')
const {
    getCorporateAgreementForAdmin,
    regenerateCorporateAgreement,
} = require('../corporateAgreement')

jest.mock('../../../models/use-cases/corporateCardAdminApplication', () => ({
    findByCorporate: jest.fn(),
    upsertByCorporate: jest.fn(),
}))
jest.mock('../../../models/use-cases/corporateCardAgreement', () => ({
    findByCorporate: jest.fn(),
    upsertByCorporate: jest.fn(),
}))
jest.mock('../../../utils/sharedDirectory', () => ({ getCorporatesByIds: jest.fn() }))
jest.mock('../../../services/agreementArtifacts', () => ({ storeAgreementArtifacts: jest.fn() }))
jest.mock('../../../services/agreementEsign', () => ({
    dispatch: jest.fn(),
    refreshEsignStatus: jest.fn(({ application }) => application),
}))
jest.mock('../../../services/corporateAgreementDocument', () => ({
    templateExists: jest.fn(),
    TEMPLATE_PATH: '/tmp/corporate-agreement.docx',
}))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const payload = (res) => res.json.mock.calls[0][0].data

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
    isDraft: false,
}

const req = (params = { corporateId: '42' }) => ({ params, user: { username: 'reviewer' } })

describe('getCorporateAgreementForAdmin', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        applicationUC.findByCorporate.mockResolvedValue({ agreementSignMethod: 'E_SIGN', esignStatus: 'PENDING_DISPATCH' })
        agreementUC.findByCorporate.mockResolvedValue(COMPLETE)
    })

    // Reviewers previously had to open the .docx and read it by eye to check the declared bank account.
    it('returns the declared details grouped as the corporate filled them in', async () => {
        const res = buildRes()

        await getCorporateAgreementForAdmin(req(), res, jest.fn())

        const groups = payload(res).groups
        expect(groups.map((group) => group.key)).toEqual([
            'entity',
            'registered',
            'billing',
            'registration',
            'bank',
            'official',
            'salesperson',
            'signatory',
        ])
        const bank = groups.find((group) => group.key === 'bank')
        expect(bank.fields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ key: 'bankAccountNumber', value: '123456789012' }),
                expect.objectContaining({ key: 'bankIfsc', value: 'HDFC0001234' }),
            ])
        )
    })

    it('renders the PEP declaration as a plain yes or no', async () => {
        const res = buildRes()

        await getCorporateAgreementForAdmin(req(), res, jest.fn())

        const signatory = payload(res).groups.find((group) => group.key === 'signatory')
        expect(signatory.fields).toEqual(
            expect.arrayContaining([expect.objectContaining({ key: 'signatoryIsPep', value: 'No' })])
        )
    })

    it('marks an unanswered field as absent rather than inventing a value', async () => {
        agreementUC.findByCorporate.mockResolvedValue({ ...COMPLETE, cinLlpNumber: '' })
        const res = buildRes()

        await getCorporateAgreementForAdmin(req(), res, jest.fn())

        const registration = payload(res).groups.find((group) => group.key === 'registration')
        const cin = registration.fields.find((field) => field.key === 'cinLlpNumber')
        expect(cin).toEqual(expect.objectContaining({ value: null, required: false }))
    })

    it('reports the e-sign state so the reviewer knows it has not gone out', async () => {
        const res = buildRes()

        await getCorporateAgreementForAdmin(req(), res, jest.fn())

        expect(payload(res)).toEqual(
            expect.objectContaining({
                signMethod: 'E_SIGN',
                esignStatus: 'PENDING_DISPATCH',
                canResend: true,
                missingFields: [],
            })
        )
    })

    it('says there is nothing to review when the corporate filled nothing in', async () => {
        agreementUC.findByCorporate.mockResolvedValue(null)
        const res = buildRes()

        await getCorporateAgreementForAdmin(req(), res, jest.fn())

        expect(payload(res)).toEqual(
            expect.objectContaining({ groups: null, canResend: false, missingFields: null })
        )
    })

    it('refuses to regenerate while required fields are empty', async () => {
        agreementUC.findByCorporate.mockResolvedValue({ entityName: 'Acme' })
        const res = buildRes()

        await getCorporateAgreementForAdmin(req(), res, jest.fn())

        expect(payload(res).canResend).toBe(false)
        expect(payload(res).missingFields.length).toBeGreaterThan(0)
    })

    it('400s without a corporate', async () => {
        const next = jest.fn()

        await getCorporateAgreementForAdmin(req({}), buildRes(), next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'A valid corporate is required.' })
        )
    })
})

describe('regenerateCorporateAgreement', () => {
    const KEYS = {
        generatedDocumentKey: 'staging/corporate/100000560/KYB-Documents/uuid-docx',
        generatedPdfKey: 'staging/corporate/100000560/KYB-Documents/uuid-pdf',
    }

    beforeEach(() => {
        jest.clearAllMocks()
        applicationUC.findByCorporate.mockResolvedValue({ businessType: 'LLP', kybReference: 'KYB1' })
        applicationUC.upsertByCorporate.mockResolvedValue({})
        agreementUC.findByCorporate.mockResolvedValue(COMPLETE)
        agreementUC.upsertByCorporate.mockResolvedValue(COMPLETE)
        documentService.templateExists.mockReturnValue(true)
        artifacts.storeAgreementArtifacts.mockResolvedValue({ ...KEYS, discardSuperseded: jest.fn() })
        esign.dispatch.mockResolvedValue({ epakId: 'EPAK-9', signingLink: 'https://sign.test/9' })
        sharedDirectory.getCorporatesByIds.mockResolvedValue(
            new Map([['42', { credential: { username: '100000560' } }]])
        )
    })

    // controllers/admin/document.js authorises by this path segment, and the corporate's own uploads
    // live under its username — a corporateId folder would file the same document out of its reach.
    it("renders into the corporate's own document folder", async () => {
        await regenerateCorporateAgreement(req(), buildRes(), jest.fn())

        expect(artifacts.storeAgreementArtifacts).toHaveBeenCalledWith(
            expect.objectContaining({ corporateId: '42', folder: '100000560' })
        )
    })

    it('still regenerates when the corporate directory cannot be reached', async () => {
        sharedDirectory.getCorporatesByIds.mockRejectedValue(new Error('directory down'))
        const next = jest.fn()

        await regenerateCorporateAgreement(req(), buildRes(), next)

        expect(next).not.toHaveBeenCalled()
        expect(artifacts.storeAgreementArtifacts).toHaveBeenCalledWith(
            expect.objectContaining({ folder: '42' })
        )
    })

    it('records both keys and sends the regenerated agreement out again', async () => {
        const res = buildRes()

        await regenerateCorporateAgreement(req(), res, jest.fn())

        expect(agreementUC.upsertByCorporate).toHaveBeenCalledWith(
            '42',
            expect.objectContaining({ isDraft: false, ...KEYS })
        )
        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(
            '42',
            expect.objectContaining({ esignStatus: 'PENDING_DISPATCH' })
        )
        expect(esign.dispatch).toHaveBeenCalled()
        expect(payload(res).esignStatus).toBe('SENT')
    })

    // The old envelope must stop being able to complete the agreement the moment a new one is rendered.
    it('voids the previous envelope before dispatching a new one', async () => {
        await regenerateCorporateAgreement(req(), buildRes(), jest.fn())

        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(
            '42',
            expect.objectContaining({ esignReference: null, esignSigningLink: null, esignSignedAt: null })
        )
    })

    it('reports a failure rather than claiming the agreement went out', async () => {
        esign.dispatch.mockRejectedValue(Object.assign(new Error('vendor down'), { status_code: 502 }))
        const res = buildRes()
        const next = jest.fn()

        await regenerateCorporateAgreement(req(), res, next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 502 }))
        expect(res.json).not.toHaveBeenCalled()
    })

    it('refuses when the corporate never filled the details in', async () => {
        agreementUC.findByCorporate.mockResolvedValue(null)
        const next = jest.fn()

        await regenerateCorporateAgreement(req(), buildRes(), next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('has not filled in') })
        )
        expect(artifacts.storeAgreementArtifacts).not.toHaveBeenCalled()
    })

    it('names the empty fields rather than generating a half-filled contract', async () => {
        agreementUC.findByCorporate.mockResolvedValue({ entityName: 'Acme' })
        const next = jest.fn()

        await regenerateCorporateAgreement(req(), buildRes(), next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('incomplete') })
        )
    })

    it('503s when the template is missing instead of queueing nothing', async () => {
        documentService.templateExists.mockReturnValue(false)
        const next = jest.fn()

        await regenerateCorporateAgreement(req(), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 503 }))
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('does not requeue when the artifacts could not be produced', async () => {
        artifacts.storeAgreementArtifacts.mockRejectedValue(new Error('libreoffice missing'))
        const next = jest.fn()
        const res = buildRes()

        await regenerateCorporateAgreement(req(), res, next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 500 }))
        expect(res.json).not.toHaveBeenCalled()
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })
})
