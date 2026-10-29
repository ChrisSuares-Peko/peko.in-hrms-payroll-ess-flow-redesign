const applicationUC = require('../../../models/use-cases/corporateCardAdminApplication')
const documentsUC = require('../../../models/use-cases/corporateDocuments')
const { getKybStatus, getDocumentChecklist, saveBusinessType, submitKyb, completeKyb } = require('../kybStatus')

jest.mock('../../../models/use-cases/corporateCardAdminApplication', () => ({
    findByCorporate: jest.fn(),
    upsertByCorporate: jest.fn(),
}))
jest.mock('../../../models/use-cases/corporateDocuments', () => ({
    delectDocfiles: jest.fn(),
    findAllCorporateDocuments: jest.fn(),
    sumSizeBytes: jest.fn(),
}))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const SIGNED = { agreementSignMethod: 'E_SIGN', esignStatus: 'SIGNED' }

const baseRow = {
    corporateId: 42,
    kybStatus: 'PENDING',
    kybReference: null,
    metadata: null,
    cardSchemeId: null,
    svcCardNumber: null,
    virtualAccount: null,
    updatedAt: '2026-07-10T10:00:00.000Z',
}

describe('getKybStatus', () => {
    beforeEach(() => jest.clearAllMocks())

    it('400s when the caller has no corporate context', async () => {
        const next = jest.fn()
        await getKybStatus({ user: {} }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Corporate context is missing.' }))
        expect(applicationUC.findByCorporate).not.toHaveBeenCalled()
    })

    it('returns application: null when the corporate has no application row yet', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        const res = buildRes()

        await getKybStatus({ user: { corporateId: 42 } }, res, jest.fn())

        expect(applicationUC.findByCorporate).toHaveBeenCalledWith(42)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { application: null } }))
    })

    it('serializes the row — masks the SVC card, surfaces the rejection reason from metadata', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            ...baseRow,
            kybStatus: 'REJECTED',
            metadata: { rejectionReason: 'Document quality is too low.' },
            svcCardNumber: '1234567890123456',
        })
        const res = buildRes()

        await getKybStatus({ user: { corporateId: 42 } }, res, jest.fn())

        const { application } = res.json.mock.calls[0][0].data
        expect(application.kybStatus).toBe('REJECTED')
        expect(application.rejectionReason).toBe('Document quality is too low.')
        expect(application.svcCardNumberLast4).toBe('3456')
    })

    it('defaults kybStatus to PENDING when the row has none set', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: null })
        const res = buildRes()

        await getKybStatus({ user: { corporateId: 42 } }, res, jest.fn())

        expect(res.json.mock.calls[0][0].data.application.kybStatus).toBe('PENDING')
    })
})

describe('saveBusinessType', () => {
    beforeEach(() => jest.clearAllMocks())

    it('400s when the caller has no corporate context', async () => {
        const next = jest.fn()

        await saveBusinessType({ user: {}, body: { businessType: 'PRIVATE_LIMITED' } }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Corporate context is missing.' }))
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it.each([['unknown'], [''], [undefined], [42]])('rejects %p as a business type', async (businessType) => {
        const next = jest.fn()
        applicationUC.findByCorporate.mockResolvedValue(null)

        await saveBusinessType({ user: { corporateId: 42 }, body: { businessType } }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid business type.' }))
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('creates a draft row without a kybReference, so the application is not treated as submitted', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, businessType: 'PRIVATE_LIMITED' })
        const res = buildRes()

        await saveBusinessType(
            { user: { corporateId: 42 }, body: { businessType: 'PRIVATE_LIMITED' } },
            res,
            jest.fn()
        )

        const [corporateId, fields] = applicationUC.upsertByCorporate.mock.calls[0]
        expect(corporateId).toBe(42)
        expect(fields).toEqual(expect.objectContaining({ businessType: 'PRIVATE_LIMITED', kybStatus: 'PENDING' }))
        expect(fields.kybReference).toBeUndefined()
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ data: { application: expect.objectContaining({ businessType: 'PRIVATE_LIMITED' }) } })
        )
    })

    it('trims the submitted value', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        applicationUC.upsertByCorporate.mockResolvedValue(baseRow)

        await saveBusinessType(
            { user: { corporateId: 42 }, body: { businessType: '  PRIVATE_LIMITED  ' } },
            buildRes(),
            jest.fn()
        )

        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(
            42,
            expect.objectContaining({ businessType: 'PRIVATE_LIMITED' })
        )
    })

    it('lets a corporate change its mind while the application is still a draft', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, businessType: 'LLP' })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, businessType: 'PRIVATE_LIMITED' })
        const next = jest.fn()

        await saveBusinessType(
            { user: { corporateId: 42 }, body: { businessType: 'PRIVATE_LIMITED' } },
            buildRes(),
            next
        )

        expect(next).not.toHaveBeenCalled()
        expect(applicationUC.upsertByCorporate).toHaveBeenCalled()
    })

    it('drops documents the newly chosen business type does not ask for', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, businessType: 'LLP' })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, businessType: 'PROPRIETORSHIP' })

        await saveBusinessType(
            { user: { corporateId: 42 }, body: { businessType: 'PROPRIETORSHIP' } },
            buildRes(),
            jest.fn()
        )

        const { docNamelist, corporateUserId } = documentsUC.delectDocfiles.mock.calls[0][0]
        expect(corporateUserId).toBe(42)
        expect(docNamelist).toContain('LLP_Agreement')
        // The rendered agreement was filled against the old constitution.
        expect(docNamelist).toContain('Corporate_Agreement_Generated')
        expect(docNamelist).not.toContain('GST_Certificate')
        expect(docNamelist).not.toContain('Cancelled_Cheque')
        expect(docNamelist).not.toContain('Corporate_Agreement')
    })

    it('retires the queued e-signature when the business type changes', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            ...baseRow,
            businessType: 'LLP',
            esignStatus: 'PENDING_DISPATCH',
        })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, businessType: 'PROPRIETORSHIP' })

        await saveBusinessType(
            { user: { corporateId: 42 }, body: { businessType: 'PROPRIETORSHIP' } },
            buildRes(),
            jest.fn()
        )

        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(
            42,
            expect.objectContaining({ esignStatus: null })
        )
    })

    it('leaves the queued e-signature alone when the type is re-confirmed unchanged', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            ...baseRow,
            businessType: 'LLP',
            esignStatus: 'PENDING_DISPATCH',
        })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, businessType: 'LLP' })

        await saveBusinessType({ user: { corporateId: 42 }, body: { businessType: 'LLP' } }, buildRes(), jest.fn())

        const [, fields] = applicationUC.upsertByCorporate.mock.calls[0]
        expect(fields).not.toHaveProperty('esignStatus')
    })

    it('keeps every document when the business type is re-confirmed unchanged', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, businessType: 'LLP' })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, businessType: 'LLP' })

        await saveBusinessType({ user: { corporateId: 42 }, body: { businessType: 'LLP' } }, buildRes(), jest.fn())

        expect(documentsUC.delectDocfiles).not.toHaveBeenCalled()
    })

    it('refuses to change the business type once the application has been submitted', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybReference: 'KYB123' })
        const next = jest.fn()

        await saveBusinessType(
            { user: { corporateId: 42 }, body: { businessType: 'PRIVATE_LIMITED' } },
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'KYB has already been submitted.' }))
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })
})

describe('submitKyb', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        documentsUC.sumSizeBytes.mockResolvedValue({ totalBytes: 0, unknown: [] })
    })

    describe('total document size', () => {
        const MB = 1024 * 1024

        beforeEach(() => {
            applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, ...SIGNED })
            applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'PENDING' })
        })

        it('blocks a submission whose documents exceed the total limit', async () => {
            documentsUC.sumSizeBytes.mockResolvedValue({ totalBytes: 26 * MB, unknown: [] })
            const next = jest.fn()

            await submitKyb({ user: { corporateId: 42, id: 7 } }, buildRes(), next)

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('over the 25.0 MB total limit'),
                })
            )
            expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
        })

        it('names the total so the corporate knows how much to remove', async () => {
            documentsUC.sumSizeBytes.mockResolvedValue({ totalBytes: 26 * MB, unknown: [] })
            const next = jest.fn()

            await submitKyb({ user: { corporateId: 42, id: 7 } }, buildRes(), next)

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.stringContaining('26.0 MB') })
            )
        })

        it('allows a submission exactly on the limit', async () => {
            documentsUC.sumSizeBytes.mockResolvedValue({ totalBytes: 25 * MB, unknown: [] })

            await submitKyb({ user: { corporateId: 42, id: 7 } }, buildRes(), jest.fn())

            expect(applicationUC.upsertByCorporate).toHaveBeenCalled()
        })

        it('allows a submission under the limit', async () => {
            documentsUC.sumSizeBytes.mockResolvedValue({ totalBytes: 10 * MB, unknown: [] })

            await submitKyb({ user: { corporateId: 42, id: 7 } }, buildRes(), jest.fn())

            expect(applicationUC.upsertByCorporate).toHaveBeenCalled()
        })

        it('does not strand a corporate when the documents cannot be measured', async () => {
            documentsUC.sumSizeBytes.mockRejectedValue(new Error('db down'))

            await submitKyb({ user: { corporateId: 42, id: 7 } }, buildRes(), jest.fn())

            expect(applicationUC.upsertByCorporate).toHaveBeenCalled()
        })

        it('submits on the known total when some documents predate size recording', async () => {
            documentsUC.sumSizeBytes.mockResolvedValue({ totalBytes: 5 * MB, unknown: ['MOA'] })

            await submitKyb({ user: { corporateId: 42, id: 7 } }, buildRes(), jest.fn())

            expect(applicationUC.upsertByCorporate).toHaveBeenCalled()
        })
    })

    it('400s when the caller has no corporate context', async () => {
        const next = jest.fn()
        await submitKyb({ user: {} }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Corporate context is missing.' }))
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('generates a kybReference on the first submission of a signed agreement', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, ...SIGNED, kybReference: null })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'SUBMITTED', kybReference: 'KYBabc123' })
        const res = buildRes()

        await submitKyb({ user: { corporateId: 42, id: 7 } }, res, jest.fn())

        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(42, {
            kybStatus: 'SUBMITTED',
            kybReference: expect.stringMatching(/^KYB[0-9A-F]{10}$/),
        })
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'KYB submitted.' }))
    })

    it('allows resubmission from an admin-created PENDING placeholder (no kybReference yet) without stamping createdByCredentialId again', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, ...SIGNED, kybStatus: 'PENDING', kybReference: null })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'SUBMITTED', kybReference: 'KYBabc123' })

        await submitKyb({ user: { corporateId: 42, id: 7 } }, buildRes(), jest.fn())

        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(42, {
            kybStatus: 'SUBMITTED',
            kybReference: expect.stringMatching(/^KYB[0-9A-F]{10}$/),
        })
    })

    describe('the agreement gate', () => {
        it('refuses to submit before the e-signature is completed', async () => {
            applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, agreementSignMethod: 'E_SIGN', esignStatus: 'SENT' })
            const next = jest.fn()

            await submitKyb({ user: { corporateId: 42 }, body: {} }, buildRes(), next)

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Complete the e-signature on your corporate agreement before submitting your KYB.',
            }))
            expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
        })

        it('refuses to submit when no agreement has been started at all', async () => {
            applicationUC.findByCorporate.mockResolvedValue(null)
            const next = jest.fn()

            await submitKyb({ user: { corporateId: 42 }, body: {} }, buildRes(), next)

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
            expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
        })

        it('refuses the upload route until the signed copy is actually on file', async () => {
            applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, agreementSignMethod: 'UPLOAD' })
            documentsUC.findAllCorporateDocuments.mockResolvedValue([])
            const next = jest.fn()

            await submitKyb({ user: { corporateId: 42 }, body: {} }, buildRes(), next)

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Upload the signed corporate agreement before submitting your KYB.',
            }))
            expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
        })

        it('lets the upload route through once the signed copy exists, without needing an e-signature', async () => {
            applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, agreementSignMethod: 'UPLOAD', esignStatus: null })
            documentsUC.findAllCorporateDocuments.mockResolvedValue([{ documentName: 'Corporate_Agreement' }])
            applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'PENDING' })
            const next = jest.fn()

            await submitKyb({ user: { corporateId: 42 }, body: {} }, buildRes(), next)

            expect(next).not.toHaveBeenCalled()
            expect(applicationUC.upsertByCorporate).toHaveBeenCalled()
        })
    })

    it('refuses to resubmit a PENDING application that already has a kybReference (already submitted, awaiting review)', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'PENDING', kybReference: 'KYBoriginal' })
        const next = jest.fn()

        await submitKyb({ user: { corporateId: 42 } }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'KYB has already been submitted.' }))
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('allows resubmission from REJECTED, keeping the existing kybReference rather than regenerating it', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, ...SIGNED, kybStatus: 'REJECTED', kybReference: 'KYBoriginal' })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'SUBMITTED', kybReference: 'KYBoriginal' })

        await submitKyb({ user: { corporateId: 42 } }, buildRes(), jest.fn())

        const [, fields] = applicationUC.upsertByCorporate.mock.calls[0]
        expect(fields.kybStatus).toBe('SUBMITTED')
        expect(fields.kybReference).toBeUndefined()
    })

    // A resubmission is a fresh review. Leaving the previous reason on the row kept it being served by both
    // serializers, and a later reject with no reason re-sent the stale one.
    it('clears the previous rejection reason when resubmitting from REJECTED', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            ...baseRow,
            ...SIGNED,
            kybStatus: 'REJECTED',
            kybReference: 'KYBoriginal',
            metadata: { rejectionReason: 'Company PAN did not match', somethingElse: 'kept' },
        })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'PENDING' })

        await submitKyb({ user: { corporateId: 42 } }, buildRes(), jest.fn())

        const [, fields] = applicationUC.upsertByCorporate.mock.calls[0]
        expect(fields.metadata).toEqual({
            rejectionReason: null,
            somethingElse: 'kept',
            verifiedAcknowledgedAt: null,
            rejectionAcknowledgedAt: null,
        })
    })

    it('does not touch metadata on a first submission', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, ...SIGNED })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'PENDING' })

        await submitKyb({ user: { corporateId: 42 }, body: {} }, buildRes(), jest.fn())

        const [, fields] = applicationUC.upsertByCorporate.mock.calls[0]
        expect(fields.metadata).toBeUndefined()
    })

    describe('businessType', () => {
        it('stores a valid business type', async () => {
            applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, ...SIGNED })
            applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'PENDING' })

            await submitKyb(
                { user: { corporateId: 42 }, body: { businessType: 'LLP' } },
                buildRes(),
                jest.fn()
            )

            const [, fields] = applicationUC.upsertByCorporate.mock.calls[0]
            expect(fields.businessType).toBe('LLP')
        })

        // The value reaches a column, so an unknown one is refused rather than persisted.
        it.each([['SOMETHING_NEW'], ["LLP' OR 1=1"], ['llp']])('refuses %p', async (businessType) => {
            applicationUC.findByCorporate.mockResolvedValue(null)
            const next = jest.fn()

            await submitKyb({ user: { corporateId: 42 }, body: { businessType } }, buildRes(), next)

            expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        })

        it('still submits when no business type is supplied', async () => {
            applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, ...SIGNED })
            applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'PENDING' })

            await submitKyb({ user: { corporateId: 42 }, body: {} }, buildRes(), jest.fn())

            const [, fields] = applicationUC.upsertByCorporate.mock.calls[0]
            expect(fields.businessType).toBeUndefined()
        })

        it('accepts every business type the checklist catalogue offers', async () => {
            const { BUSINESS_TYPES } = require('../../../constants/kybDocuments')

            for (const businessType of BUSINESS_TYPES) {
                applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, ...SIGNED })
                applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'PENDING' })
                const next = jest.fn()

                await submitKyb({ user: { corporateId: 42 }, body: { businessType } }, buildRes(), next)

                expect(next).not.toHaveBeenCalled()
            }
        })

        it('reports the stored business type back to the corporate', async () => {
            applicationUC.findByCorporate.mockResolvedValue({
                ...baseRow,
                kybStatus: 'PENDING',
                businessType: 'PROPRIETORSHIP',
            })
            const res = buildRes()

            await getKybStatus({ user: { corporateId: 42 } }, res, jest.fn())

            expect(res.json.mock.calls[0][0].data.application.businessType).toBe('PROPRIETORSHIP')
        })
    })

    it.each(['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'COMPLETED'])(
        'refuses to resubmit when the current status is %s',
        async (kybStatus) => {
            applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus })
            const next = jest.fn()

            await submitKyb({ user: { corporateId: 42 } }, buildRes(), next)

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'KYB has already been submitted.' }))
            expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
        }
    )
})

describe('completeKyb', () => {
    beforeEach(() => jest.clearAllMocks())

    it('400s when the caller has no corporate context', async () => {
        const next = jest.fn()
        await completeKyb({ user: {} }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Corporate context is missing.' }))
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('moves VERIFIED to COMPLETED', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'VERIFIED' })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'COMPLETED' })
        const res = buildRes()

        await completeKyb({ user: { corporateId: 42 } }, res, jest.fn())

        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(
            42,
            expect.objectContaining({ kybStatus: 'COMPLETED' })
        )
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'KYB marked complete.' }))
    })

    // COMPLETED is deliberately absent: a reviewer can set it directly and the corporate still has to be
    // able to acknowledge its verified screen.
    it.each(['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'REJECTED'])(
        'refuses to complete when the current status is %s',
        async (kybStatus) => {
            applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus })
            const next = jest.fn()

            await completeKyb({ user: { corporateId: 42 } }, buildRes(), next)

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'KYB must be verified before it can be marked complete.' }))
            expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
        }
    )

    it('refuses to complete when there is no application row yet', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        const next = jest.fn()

        await completeKyb({ user: { corporateId: 42 } }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'KYB must be verified before it can be marked complete.' }))
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })
})

describe('acknowledging the verified screen', () => {
    beforeEach(() => jest.clearAllMocks())

    it('marks the application complete and records that the screen was seen', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'VERIFIED' })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'COMPLETED' })

        await completeKyb({ user: { corporateId: 42 } }, buildRes(), jest.fn())

        const [, fields] = applicationUC.upsertByCorporate.mock.calls[0]
        expect(fields.kybStatus).toBe('COMPLETED')
        expect(fields.metadata.verifiedAcknowledgedAt).toEqual(expect.any(String))
    })

    // A reviewer can set COMPLETED directly; refusing here would strand the corporate on the screen.
    it('still accepts the acknowledgement when the reviewer already marked it complete', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'COMPLETED' })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'COMPLETED' })
        const next = jest.fn()

        await completeKyb({ user: { corporateId: 42 } }, buildRes(), next)

        expect(next).not.toHaveBeenCalled()
        expect(applicationUC.upsertByCorporate).toHaveBeenCalled()
    })

    it('keeps the rest of metadata when stamping the acknowledgement', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            ...baseRow,
            kybStatus: 'VERIFIED',
            metadata: { rejectionReason: null, somethingElse: 'keep me' },
        })
        applicationUC.upsertByCorporate.mockResolvedValue(baseRow)

        await completeKyb({ user: { corporateId: 42 } }, buildRes(), jest.fn())

        const [, fields] = applicationUC.upsertByCorporate.mock.calls[0]
        expect(fields.metadata.somethingElse).toBe('keep me')
    })

    it('reports whether the screen has been acknowledged', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            ...baseRow,
            kybStatus: 'COMPLETED',
            metadata: { verifiedAcknowledgedAt: '2026-08-14T06:00:00.000Z' },
        })
        const res = buildRes()

        await getKybStatus({ user: { corporateId: 42 } }, res, jest.fn())

        expect(res.json.mock.calls[0][0].data.application.verifiedAcknowledged).toBe(true)
    })

    it('reports it as unacknowledged when nothing was stamped', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'COMPLETED' })
        const res = buildRes()

        await getKybStatus({ user: { corporateId: 42 } }, res, jest.fn())

        expect(res.json.mock.calls[0][0].data.application.verifiedAcknowledged).toBe(false)
    })

    // A rejected-then-reverified application is a fresh approval and is owed the screen again.
    it('clears the acknowledgement when a rejected application is resubmitted', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            ...baseRow,
            ...SIGNED,
            kybStatus: 'REJECTED',
            kybReference: 'KYB123',
            metadata: { rejectionReason: 'blurry', verifiedAcknowledgedAt: '2026-08-01T00:00:00.000Z' },
        })
        applicationUC.upsertByCorporate.mockResolvedValue(baseRow)

        await submitKyb({ user: { corporateId: 42 }, body: {} }, buildRes(), jest.fn())

        const [, fields] = applicationUC.upsertByCorporate.mock.calls[0]
        expect(fields.metadata).toEqual(
            expect.objectContaining({ rejectionReason: null, verifiedAcknowledgedAt: null })
        )
    })
})

describe('getDocumentChecklist', () => {
    const dataOf = (res) => res.json.mock.calls[0][0].data

    it('returns every business type with its own document list', async () => {
        const res = buildRes()

        await getDocumentChecklist({ user: { corporateId: 42 } }, res, jest.fn())

        expect(res.status).toHaveBeenCalledWith(200)
        expect(dataOf(res).businessTypes.map((entry) => entry.value)).toEqual([
            'PRIVATE_LIMITED',
            'PUBLIC_LIMITED',
            'LLP',
            'PARTNERSHIP',
            'PROPRIETORSHIP',
            'SOCIETY_TRUST',
        ])
    })

    // The whole catalogue in one call, so changing the dropdown does not wait on the network.
    it('carries the documents inline rather than needing a call per type', async () => {
        const res = buildRes()

        await getDocumentChecklist({ user: { corporateId: 42 } }, res, jest.fn())

        const counts = dataOf(res).businessTypes.map((entry) => entry.documents.length)
        expect(counts).toEqual([8, 8, 7, 6, 4, 6])
    })

    it('gives each document what the checklist row renders', async () => {
        const res = buildRes()

        await getDocumentChecklist({ user: { corporateId: 42 } }, res, jest.fn())

        const [first] = dataOf(res).businessTypes[0].documents
        expect(first).toEqual({
            key: 'coi',
            documentName: 'Certificate_Of_Incorporation',
            label: 'Certificate of Incorporation',
            uploadLabel: 'Upload Certificate of Incorporation',
            hint: 'Company seal + authorised signatory signature required',
            required: true,
            maxSizeKb: 500,
        })
    })

    it('tells the corporate how large each document may be, so the cap is not a surprise', async () => {
        const res = buildRes()

        await getDocumentChecklist({}, res)

        const byName = Object.fromEntries(
            dataOf(res)
                .businessTypes.flatMap((entry) => entry.documents)
                .map((doc) => [doc.documentName, doc.maxSizeKb])
        )
        expect(byName.MOA).toBe(10240)
        expect(byName.Signing_Authority_Pan_Card).toBe(500)
        expect(byName.Cancelled_Cheque).toBe(500)
    })

    it('marks the optional Darpan ID as not required', async () => {
        const res = buildRes()

        await getDocumentChecklist({ user: { corporateId: 42 } }, res, jest.fn())

        const society = dataOf(res).businessTypes.find((entry) => entry.value === 'SOCIETY_TRUST')
        expect(society.documents.find((doc) => doc.key === 'darpan-id').required).toBe(false)
    })
})