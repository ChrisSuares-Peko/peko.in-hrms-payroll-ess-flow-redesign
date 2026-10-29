const applicationUC = require('../../../models/use-cases/corporateCardAdminApplication')
const documentsUC = require('../../../models/use-cases/corporateDocuments')
const { getKybStatus, reopenKyb, submitKyb } = require('../kybStatus')

jest.mock('../../../models/use-cases/corporateCardAdminApplication', () => ({
    findByCorporate: jest.fn(),
    upsertByCorporate: jest.fn(),
}))
jest.mock('../../../models/use-cases/corporateDocuments', () => ({
    delectDocfiles: jest.fn(),
    findAllCorporateDocuments: jest.fn(),
}))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const req = () => ({ user: { corporateId: 42, id: 5 } })

const rejectedRow = (over = {}) => ({
    corporateId: 42,
    kybStatus: 'REJECTED',
    kybReference: 'KYBAAA111',
    businessType: 'PRIVATE_LIMITED',
    agreementSignMethod: 'E_SIGN',
    esignStatus: 'SIGNED',
    metadata: { rejectionReason: 'Blurred MoA' },
    updatedAt: '2026-08-01T10:00:00.000Z',
    ...over,
})

const savedFields = () => applicationUC.upsertByCorporate.mock.calls[0][1]

describe('reopenKyb', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        applicationUC.upsertByCorporate.mockImplementation(async (corporateId, fields) => ({
            ...rejectedRow(),
            ...fields,
        }))
    })

    it('400s when the caller has no corporate context', async () => {
        const next = jest.fn()
        await reopenKyb({ user: {} }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Corporate context is missing.' }))
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('refuses to reopen an application that was never rejected', async () => {
        applicationUC.findByCorporate.mockResolvedValue(rejectedRow({ kybStatus: 'UNDER_REVIEW' }))
        const next = jest.fn()

        await reopenKyb(req(), buildRes(), next)

        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('refuses when there is no application at all', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        const next = jest.fn()

        await reopenKyb(req(), buildRes(), next)

        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('records that the rejection was acted on', async () => {
        applicationUC.findByCorporate.mockResolvedValue(rejectedRow())
        const res = buildRes()

        await reopenKyb(req(), res, jest.fn())

        expect(savedFields().metadata.rejectionAcknowledgedAt).toEqual(expect.any(String))
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { application: expect.objectContaining({ rejectionAcknowledged: true }) },
            })
        )
    })

    /**
     * kybStatus is the last decision a reviewer made. Two predicates let a REJECTED application be
     * edited and resubmitted, and the admin progress view reports "resubmission in progress" from it —
     * flipping it here would quietly take all three away.
     */
    it('leaves the status, reference and business type alone', async () => {
        applicationUC.findByCorporate.mockResolvedValue(rejectedRow())

        await reopenKyb(req(), buildRes(), jest.fn())

        const fields = savedFields()
        expect(fields.kybStatus).toBeUndefined()
        expect(fields.kybReference).toBeUndefined()
        expect(fields.businessType).toBeUndefined()
    })

    it('keeps the rejection reason so the corporate can still read what to fix', async () => {
        applicationUC.findByCorporate.mockResolvedValue(rejectedRow())

        await reopenKyb(req(), buildRes(), jest.fn())

        expect(savedFields().metadata.rejectionReason).toBe('Blurred MoA')
    })

    /**
     * The agreement form is hidden for as long as esignStatus is set, so a corporate rejected FOR something
     * on its agreement would never reach the fields and would resubmit the identical document forever.
     */
    it('retires the e-signature so the agreement becomes editable again', async () => {
        applicationUC.findByCorporate.mockResolvedValue(rejectedRow())

        await reopenKyb(req(), buildRes(), jest.fn())

        expect(savedFields()).toEqual(expect.objectContaining({ esignStatus: null }))
    })

    // Clearing the status alone leaves the envelope addressable, so a late vendor callback can re-stamp
    // SIGNED onto an agreement that was already retired.
    it('clears the whole envelope, not just its status', async () => {
        applicationUC.findByCorporate.mockResolvedValue(
            rejectedRow({
                esignReference: 'EPAK-123',
                esignSigningLink: 'https://sign.example/abc',
                esignSentAt: '2026-08-01T09:00:00.000Z',
                esignSignedAt: '2026-08-01T09:30:00.000Z',
                esignFailureReason: null,
            })
        )

        await reopenKyb(req(), buildRes(), jest.fn())

        const fields = savedFields()
        expect(fields.esignReference).toBeNull()
        expect(fields.esignSigningLink).toBeNull()
        expect(fields.esignSentAt).toBeNull()
        expect(fields.esignSignedAt).toBeNull()
        expect(fields.esignFailureReason).toBeNull()
    })

    it('is idempotent — a second click does not restamp the time', async () => {
        applicationUC.findByCorporate.mockResolvedValue(
            rejectedRow({
                metadata: {
                    rejectionReason: 'Blurred MoA',
                    rejectionAcknowledgedAt: '2026-08-02T09:00:00.000Z',
                },
            })
        )
        const res = buildRes()

        await reopenKyb(req(), res, jest.fn())

        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { application: expect.objectContaining({ rejectionAcknowledged: true }) },
            })
        )
    })
})

describe('the reopened application, as the corporate sees it', () => {
    beforeEach(() => jest.clearAllMocks())

    it('reports rejectionAcknowledged false until it is reopened', async () => {
        applicationUC.findByCorporate.mockResolvedValue(rejectedRow())
        const res = buildRes()

        await getKybStatus(req(), res, jest.fn())

        expect(res.json.mock.calls[0][0].data.application.rejectionAcknowledged).toBe(false)
    })

    it('reports it true afterwards, with the status still REJECTED', async () => {
        applicationUC.findByCorporate.mockResolvedValue(
            rejectedRow({
                metadata: { rejectionReason: 'Blurred MoA', rejectionAcknowledgedAt: '2026-08-02T09:00:00.000Z' },
            })
        )
        const res = buildRes()

        await getKybStatus(req(), res, jest.fn())

        const application = res.json.mock.calls[0][0].data.application
        expect(application.rejectionAcknowledged).toBe(true)
        expect(application.kybStatus).toBe('REJECTED')
    })
})

describe('submitKyb, after a reopen', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        documentsUC.findAllCorporateDocuments.mockResolvedValue([{ id: 1 }])
        applicationUC.upsertByCorporate.mockImplementation(async (corporateId, fields) => ({
            ...rejectedRow(),
            ...fields,
        }))
    })

    // Left set, the next page load would send a freshly submitted application back to the uploads.
    it('clears the acknowledgement so the corporate lands on the submitted screen', async () => {
        applicationUC.findByCorporate.mockResolvedValue(
            rejectedRow({
                metadata: { rejectionReason: 'Blurred MoA', rejectionAcknowledgedAt: '2026-08-02T09:00:00.000Z' },
            })
        )

        await submitKyb(req(), buildRes(), jest.fn())

        const fields = savedFields()
        expect(fields.kybStatus).toBe('PENDING')
        expect(fields.metadata.rejectionAcknowledgedAt).toBeNull()
        expect(fields.metadata.rejectionReason).toBeNull()
    })
})
