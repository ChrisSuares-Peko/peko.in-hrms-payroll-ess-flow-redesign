const applicationUC = require('../../../models/use-cases/corporateCardAdminApplication')
const {
    listApplications,
    getSummary,
    listCorporates,
    getApplication,
    updateApplication,
    retryVendorEmail,
} = require('../corporateCardApplication')

jest.mock('../../../models/use-cases/corporateCardAdminApplication', () => ({
    findByCorporate: jest.fn(),
    findOtherByCardSchemeId: jest.fn(),
    upsertByCorporate: jest.fn(),
    updateVendorEmailState: jest.fn(),
    findAndCount: jest.fn(),
    searchCorporatesWithoutApplication: jest.fn(),
    getApplicationsSummary: jest.fn(),
}))

const { getCorporatesByIds } = require('../../../utils/sharedDirectory')
jest.mock('../../../utils/sharedDirectory', () => ({ getCorporatesByIds: jest.fn() }))
beforeEach(() => { getCorporatesByIds.mockResolvedValue(new Map([['42', { id: 42, companyName: 'Steel & Co' }]])) })

const { email: sendEmail } = require('../../../utils/emailer')
jest.mock('../../../utils/emailer', () => ({ email: jest.fn(), sendMailResult: jest.fn() }))
const { sendMailResult } = require('../../../utils/emailer')
const { buildKybDocumentPack } = require('../../../services/kybDocumentPack')
jest.mock('../../../services/kybDocumentPack', () => ({ buildKybDocumentPack: jest.fn() }))
const { findServiceOperatorByAccessKey } = require('../../../utils/checkAndFetchServiceDetails')
jest.mock('../../../utils/checkAndFetchServiceDetails', () => ({ findServiceOperatorByAccessKey: jest.fn() }))
jest.mock('../../../utils/pinelabsGateway', () => ({ DEFAULT_ACCESS_KEY: 'corporate_cards' }))
const { createNotification } = require('../../../models/use-cases/notification')
jest.mock('../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }))
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

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

const provisionedRow = {
    ...baseRow,
    cardSchemeId: 175491,
    svcCardNumber: '1234567890123456',
    virtualAccount: { accountNumber: '1234567890', ifsc: 'HDFC0001234' },
}

describe('listApplications — serializeApplicationSummary', () => {
    beforeEach(() => jest.clearAllMocks())

    it("surfaces the corporate's email, contact name and Peko username alongside companyName", async () => {
        applicationUC.findAndCount.mockResolvedValue({
            count: 1,
            rows: [
                {
                    ...baseRow,
                    virtualAccount: null,
                    corporateUser: {
                        companyName: 'Steel & Co',
                        email: 'abc@yopmail.com',
                        contactPersonName: 'Jane Doe',
                        credential: { username: '100000726' },
                    },
                },
            ],
        })
        const res = buildRes()

        await listApplications({ query: {} }, res, jest.fn())

        expect(res.json.mock.calls[0][0].data.rows[0]).toMatchObject({
            companyName: 'Steel & Co',
            email: 'abc@yopmail.com',
            fullName: 'Jane Doe',
            pekoAccountNumber: '100000726',
        })
    })

    describe('entityName', () => {
        const listWith = async (row) => {
            applicationUC.findAndCount.mockResolvedValue({
                count: 1,
                rows: [{ ...baseRow, virtualAccount: null, corporateUser: null, ...row }],
            })
            const res = buildRes()
            await listApplications({ query: {} }, res, jest.fn())
            return res.json.mock.calls[0][0].data.rows[0]
        }

        it('is the name the corporate typed on its agreement form', async () => {
            const row = await listWith({ agreementEntityName: 'ajmal pm entity' })

            expect(row.entityName).toBe('ajmal pm entity')
        })

        it('is null for a corporate that has not filled the agreement form yet', async () => {
            const row = await listWith({ agreementEntityName: null })

            expect(row.entityName).toBeNull()
        })

        it('does not fall back to the Peko account name, which is a different thing', async () => {
            const row = await listWith({
                agreementEntityName: null,
                corporateUser: { companyName: 'Steel & Co', name: 'Steel Login' },
            })

            expect(row.entityName).toBeNull()
            expect(row.companyName).toBe('Steel & Co')
        })
    })

    it('returns the KYB reference so the admin table can show the id the corporate was given', async () => {
        applicationUC.findAndCount.mockResolvedValue({
            count: 1,
            rows: [{ ...baseRow, kybReference: 'KYB3F9A2B7C1D', virtualAccount: null, corporateUser: null }],
        })
        const res = buildRes()

        await listApplications({ query: {} }, res, jest.fn())

        expect(res.json.mock.calls[0][0].data.rows[0]).toMatchObject({ kybReference: 'KYB3F9A2B7C1D' })
    })

    it('returns a null reference for an application the corporate has not submitted yet', async () => {
        applicationUC.findAndCount.mockResolvedValue({
            count: 1,
            rows: [{ ...baseRow, virtualAccount: null, corporateUser: null }],
        })
        const res = buildRes()

        await listApplications({ query: {} }, res, jest.fn())

        expect(res.json.mock.calls[0][0].data.rows[0].kybReference).toBeNull()
    })

    it('falls back to null for fullName/pekoAccountNumber when the corporate or credential is missing', async () => {
        applicationUC.findAndCount.mockResolvedValue({
            count: 1,
            rows: [{ ...baseRow, virtualAccount: null, corporateUser: null }],
        })
        const res = buildRes()

        await listApplications({ query: {} }, res, jest.fn())

        expect(res.json.mock.calls[0][0].data.rows[0]).toMatchObject({
            fullName: null,
            pekoAccountNumber: null,
        })
    })

    it('rejects an unknown status filter, including the retired IN_PROGRESS', async () => {
        const next = jest.fn()

        await listApplications({ query: { status: 'IN_PROGRESS' } }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid status filter.' }))
        expect(applicationUC.findAndCount).not.toHaveBeenCalled()
    })
})

describe('getSummary', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns the summary object under data.summary', async () => {
        const summary = { totalCorporates: 10, totalApplications: 4, pending: 2, completed: 1, notProvisioned: 6 }
        applicationUC.getApplicationsSummary.mockResolvedValue(summary)
        const res = buildRes()

        await getSummary({ query: {} }, res)

        expect(applicationUC.getApplicationsSummary).toHaveBeenCalledWith({ query: {} })
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: true,
            data: { summary },
        }))
    })
})

describe('listCorporates', () => {
    beforeEach(() => jest.clearAllMocks())

    it('maps corporate rows to the picker shape, preferring credential fields over the row-level ones', async () => {
        applicationUC.searchCorporatesWithoutApplication.mockResolvedValue([
            {
                id: 11,
                companyName: 'Row Company',
                email: 'row@example.com',
                credential: { name: 'Credential Name', username: '100000111', email: 'cred@example.com' },
            },
        ])
        const res = buildRes()

        await listCorporates({ query: { searchText: 'steel' } }, res)

        expect(applicationUC.searchCorporatesWithoutApplication).toHaveBeenCalledWith({
            searchText: 'steel',
            req: { query: { searchText: 'steel' } },
        })
        expect(res.json.mock.calls[0][0].data.corporates).toEqual([
            {
                corporateId: 11,
                name: 'Credential Name',
                username: '100000111',
                companyName: 'Row Company',
                email: 'cred@example.com',
            },
        ])
    })

    it('falls back to companyName and the row-level email when the credential is missing', async () => {
        applicationUC.searchCorporatesWithoutApplication.mockResolvedValue([
            { id: 12, companyName: 'Fallback Co', email: 'fallback@example.com', credential: null },
        ])
        const res = buildRes()

        await listCorporates({ query: {} }, res)

        expect(res.json.mock.calls[0][0].data.corporates[0]).toMatchObject({
            name: 'Fallback Co',
            username: null,
            email: 'fallback@example.com',
        })
    })

    it('passes searchText: undefined when the query param is blank', async () => {
        applicationUC.searchCorporatesWithoutApplication.mockResolvedValue([])
        const res = buildRes()

        await listCorporates({ query: { searchText: '   ' } }, res)

        expect(applicationUC.searchCorporatesWithoutApplication).toHaveBeenCalledWith(
            expect.objectContaining({ searchText: undefined })
        )
    })
})

describe('getApplication — serializeApplication', () => {
    beforeEach(() => jest.clearAllMocks())

    it('400s on a non-numeric corporateId', async () => {
        const next = jest.fn()
        await getApplication({ params: { corporateId: 'abc' } }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'A valid corporate is required.' }))
    })

    it('returns application: null when no row exists yet', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        const res = buildRes()

        await getApplication({ params: { corporateId: '42' } }, res, jest.fn())

        expect(res.json.mock.calls[0][0].data.application).toBeNull()
    })

    it('surfaces the rejection reason stored in metadata', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            ...baseRow,
            kybStatus: 'REJECTED',
            metadata: { rejectionReason: 'Document quality is too low.' },
        })
        const res = buildRes()

        await getApplication({ params: { corporateId: '42' } }, res, jest.fn())

        expect(res.json.mock.calls[0][0].data.application.rejectionReason).toBe('Document quality is too low.')
    })

    it('reports rejectionReason: null when metadata has no such key', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, metadata: { somethingElse: true } })
        const res = buildRes()

        await getApplication({ params: { corporateId: '42' } }, res, jest.fn())

        expect(res.json.mock.calls[0][0].data.application.rejectionReason).toBeNull()
    })
})

describe('updateApplication', () => {
    beforeEach(() => jest.clearAllMocks())

    it('rejects the retired IN_PROGRESS status', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        const next = jest.fn()

        await updateApplication(
            { params: { corporateId: '42' }, body: { kybStatus: 'IN_PROGRESS' } },
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid status.' }))
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('merges a new rejectionReason into existing metadata without dropping other keys', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, metadata: { someOtherKey: 'keep-me' } })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow })

        await updateApplication(
            { params: { corporateId: '42' }, body: { rejectionReason: 'Blurry PAN card.' } },
            buildRes(),
            jest.fn()
        )

        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(
            42,
            expect.objectContaining({ metadata: { someOtherKey: 'keep-me', rejectionReason: 'Blurry PAN card.' } })
        )
    })

    it('clears rejectionReason when explicitly set to null', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, metadata: { rejectionReason: 'old reason' } })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow })

        await updateApplication(
            { params: { corporateId: '42' }, body: { rejectionReason: null } },
            buildRes(),
            jest.fn()
        )

        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(
            42,
            expect.objectContaining({ metadata: { rejectionReason: null } })
        )
    })

    /**
     * The corporate's stage is resolved from metadata.rejectionAcknowledgedAt: while it is set they are sent
     * to the uploads instead of the rejection screen. Carried over from a previous cycle, a NEW rejection
     * would never be shown to them.
     */
    describe('a second rejection', () => {
        const reopened = (over = {}) => ({
            ...baseRow,
            kybStatus: 'REJECTED',
            metadata: {
                rejectionReason: 'Blurred MoA',
                rejectionAcknowledgedAt: '2026-08-02T09:00:00.000Z',
                someOtherKey: 'keep-me',
            },
            ...over,
        })

        const savedMetadata = () => applicationUC.upsertByCorporate.mock.calls[0][1].metadata

        it('clears the previous acknowledgement when the reviewer rejects again', async () => {
            applicationUC.findByCorporate.mockResolvedValue(reopened())
            applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow })

            await updateApplication(
                { params: { corporateId: '42' }, body: { kybStatus: 'REJECTED', rejectionReason: 'PAN still mismatched.' } },
                buildRes(),
                jest.fn()
            )

            expect(savedMetadata()).toEqual(
                expect.objectContaining({
                    rejectionReason: 'PAN still mismatched.',
                    rejectionAcknowledgedAt: null,
                    someOtherKey: 'keep-me',
                })
            )
        })

        it('clears it when only the reason is edited on an already-rejected application', async () => {
            applicationUC.findByCorporate.mockResolvedValue(reopened())
            applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow })

            await updateApplication(
                { params: { corporateId: '42' }, body: { rejectionReason: 'Also fix the cheque.' } },
                buildRes(),
                jest.fn()
            )

            expect(savedMetadata().rejectionAcknowledgedAt).toBeNull()
        })

        // Otherwise an unrelated admin edit would yank a corporate mid-resubmission back to the rejection.
        it('leaves it alone on an unrelated write to a rejection already being fixed', async () => {
            applicationUC.findByCorporate.mockResolvedValue(reopened())
            applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow })

            await updateApplication(
                { params: { corporateId: '42' }, body: { kybReference: 'KYBFEEDF00D01' } },
                buildRes(),
                jest.fn()
            )

            const fields = applicationUC.upsertByCorporate.mock.calls[0][1]
            expect(fields.metadata).toBeUndefined()
        })

        it('does not invent the key when rejecting an application that never had one', async () => {
            applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, metadata: null })
            applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow })

            await updateApplication(
                { params: { corporateId: '42' }, body: { kybStatus: 'REJECTED' } },
                buildRes(),
                jest.fn()
            )

            expect(savedMetadata()).toEqual({ rejectionAcknowledgedAt: null })
        })
    })

    it('400s a rejectionReason over 500 characters', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        const next = jest.fn()

        await updateApplication(
            { params: { corporateId: '42' }, body: { rejectionReason: 'x'.repeat(501) } },
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Rejection reason cannot exceed 500 characters' })
        )
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('400s a rejectionReason under 10 characters, which tells the corporate nothing', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        const next = jest.fn()

        await updateApplication(
            { params: { corporateId: '42' }, body: { rejectionReason: 'bad docs' } },
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Rejection reason must be at least 10 characters' })
        )
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('counts the trimmed length, so padding cannot buy the minimum', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        const next = jest.fn()

        await updateApplication(
            { params: { corporateId: '42' }, body: { rejectionReason: '   short     ' } },
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Rejection reason must be at least 10 characters' })
        )
    })

    it.each([10, 500])('accepts a reason exactly on the %i-character boundary', async (length) => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow })

        await updateApplication(
            { params: { corporateId: '42' }, body: { rejectionReason: 'x'.repeat(length) } },
            buildRes(),
            jest.fn()
        )

        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(42, {
            metadata: { rejectionReason: 'x'.repeat(length) },
        })
    })

    it('still allows clearing a stale reason, which is not a 10-character value', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            ...baseRow,
            metadata: { rejectionReason: 'The GST certificate was unreadable.' },
        })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow })
        const next = jest.fn()

        await updateApplication(
            { params: { corporateId: '42' }, body: { rejectionReason: '' } },
            buildRes(),
            next
        )

        expect(next).not.toHaveBeenCalled()
        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(42, {
            metadata: { rejectionReason: null },
        })
    })

    it.each([
        ['a bare completion', { kybStatus: 'COMPLETED' }],
        ['a completion alongside full provisioning', {
            kybStatus: 'COMPLETED',
            cardSchemeId: 175491,
            svcCardNumber: '1234567890123456',
            virtualAccount: { accountNumber: '1234567890', ifsc: 'HDFC0001234' },
        }],
    ])('refuses %s from the admin, because the corporate sets it from their dashboard', async (_label, body) => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow })
        const next = jest.fn()

        await updateApplication({ params: { corporateId: '42' }, body }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('set by the corporate') })
        )
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('blocks marking VERIFIED until card scheme, SVC, and virtual account are all set', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow })
        const next = jest.fn()

        await updateApplication(
            { params: { corporateId: '42' }, body: { kybStatus: 'VERIFIED' } },
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining('Cannot mark the application verified until these are set'),
            })
        )
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('allows VERIFIED once all provisioning fields are present (merging existing + incoming)', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...provisionedRow })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...provisionedRow, kybStatus: 'VERIFIED' })
        const res = buildRes()

        await updateApplication(
            { params: { corporateId: '42' }, body: { kybStatus: 'VERIFIED' } },
            res,
            jest.fn()
        )

        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(42, { kybStatus: 'VERIFIED' })
        expect(res.json.mock.calls[0][0].message).toBe('Application updated.')
    })

    it.each([
        ['digits only', '1234567890', '1234567890'],
        ['letters and digits', 'peko12345678', 'PEKO12345678'],
        ['already upper case', 'VAN000123456', 'VAN000123456'],
    ])('accepts an account number with %s, stored upper case', async (_label, incoming, stored) => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow })

        await updateApplication(
            {
                params: { corporateId: '42' },
                body: { virtualAccount: { accountNumber: incoming } },
            },
            buildRes(),
            jest.fn()
        )

        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(
            42,
            expect.objectContaining({
                virtualAccount: expect.objectContaining({ accountNumber: stored }),
            })
        )
    })

    it.each([
        ['too short', 'PEKO1234'],
        ['too long', 'PEKO1234567890123456'],
        ['punctuation', 'PEKO-1234567'],
        ['spaces', 'PEKO 1234 567'],
    ])('rejects an account number with %s', async (_label, accountNumber) => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow })
        const next = jest.fn()

        await updateApplication(
            { params: { corporateId: '42' }, body: { virtualAccount: { accountNumber } } },
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'A valid account number is required.' })
        )
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it.each([
        ['at the 9-digit maximum', 999999999],
        ['well inside it', 175491],
    ])('accepts a card scheme id %s', async (_label, cardSchemeId) => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow })

        await updateApplication(
            { params: { corporateId: '42' }, body: { cardSchemeId } },
            buildRes(),
            jest.fn()
        )

        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(
            42,
            expect.objectContaining({ cardSchemeId })
        )
    })

    it('rejects a card scheme id longer than 9 digits', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow })
        const next = jest.fn()

        await updateApplication(
            { params: { corporateId: '42' }, body: { cardSchemeId: 1234567890 } },
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Card scheme id must be 4 to 9 digits.' })
        )
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('400s when the body has nothing to update', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow })
        const next = jest.fn()

        await updateApplication({ params: { corporateId: '42' }, body: {} }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Nothing to update.' }))
    })

    it('stamps createdByCredentialId only when creating a brand-new row (after the corporate existence pre-check)', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow })
        const req = { params: { corporateId: '42' }, body: { kybReference: 'KYB0000000A12' }, user: { id: 7 } }

        await updateApplication(req, buildRes(), jest.fn())

        expect(getCorporatesByIds).toHaveBeenCalledWith([42], req, { bypassCache: true })
        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(42, {
            kybReference: 'KYB0000000A12',
            createdByCredentialId: 7,
        })
    })

    it('404s a brand-new row for a corporate that does not exist, without writing', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        getCorporatesByIds.mockResolvedValue(new Map())
        const next = jest.fn()

        await updateApplication(
            { params: { corporateId: '42' }, body: { kybReference: 'KYB0000000A12' }, user: { id: 7 } },
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }))
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })
})

describe('updateApplication — Pending is not a status an admin can go back to', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow })
    })

    it.each(['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'])(
        'refuses to move an application back to Pending from %s',
        async (from) => {
            applicationUC.findByCorporate.mockResolvedValue({ ...provisionedRow, kybStatus: from })
            const next = jest.fn()

            await updateApplication(
                { params: { corporateId: '42' }, body: { kybStatus: 'PENDING' } },
                buildRes(),
                next
            )

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Pending is where a new application starts'),
                })
            )
            expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
        }
    )

    it('points the admin at rejection, which the corporate actually sees', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'SUBMITTED' })
        const next = jest.fn()

        await updateApplication(
            { params: { corporateId: '42' }, body: { kybStatus: 'PENDING' } },
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('Reject the application instead') })
        )
    })

    it('still accepts Pending on a brand-new application', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        getCorporatesByIds.mockResolvedValue(new Map([['42', { id: 42, companyName: 'Steel & Co' }]]))

        await updateApplication(
            { params: { corporateId: '42' }, body: { kybStatus: 'PENDING' } },
            buildRes(),
            jest.fn()
        )

        expect(applicationUC.upsertByCorporate).toHaveBeenCalled()
    })

    it('still accepts an unchanged Pending, so editing other fields is not blocked', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'PENDING' })

        await updateApplication(
            { params: { corporateId: '42' }, body: { kybStatus: 'PENDING', cardSchemeId: 175491 } },
            buildRes(),
            jest.fn()
        )

        expect(applicationUC.upsertByCorporate).toHaveBeenCalled()
    })
})

describe('updateApplication — card scheme uniqueness', () => {
    const ORIGINAL_ENV = process.env.NODE_ENV

    beforeEach(() => {
        jest.clearAllMocks()
        applicationUC.upsertByCorporate.mockResolvedValue({ ...provisionedRow })
    })

    afterEach(() => { process.env.NODE_ENV = ORIGINAL_ENV })

    it('rejects a card scheme id already assigned to another corporate in production', async () => {
        process.env.NODE_ENV = 'production'
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow })
        applicationUC.findOtherByCardSchemeId.mockResolvedValue({ corporateId: 77, cardSchemeId: 175491 })
        const next = jest.fn()

        await updateApplication(
            { params: { corporateId: '42' }, body: { cardSchemeId: 175491 } },
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'This card scheme id is already assigned to another corporate.',
                status_code: 400,
            })
        )
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('scopes the clash lookup to other corporates, so a corporate never collides with itself', async () => {
        process.env.NODE_ENV = 'production'
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow })
        applicationUC.findOtherByCardSchemeId.mockResolvedValue(null)

        await updateApplication(
            { params: { corporateId: '42' }, body: { cardSchemeId: 175491 } },
            buildRes(),
            jest.fn()
        )

        expect(applicationUC.findOtherByCardSchemeId).toHaveBeenCalledWith(175491, 42)
    })

    it('accepts a card scheme id no other corporate holds in production', async () => {
        process.env.NODE_ENV = 'production'
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow })
        applicationUC.findOtherByCardSchemeId.mockResolvedValue(null)
        const next = jest.fn()

        await updateApplication(
            { params: { corporateId: '42' }, body: { cardSchemeId: 175491 } },
            buildRes(),
            next
        )

        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(42, { cardSchemeId: 175491 })
        expect(next).not.toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'This card scheme id is already assigned to another corporate.',
            })
        )
    })

    it('does not look for a clash when the scheme id is unchanged', async () => {
        process.env.NODE_ENV = 'production'
        applicationUC.findByCorporate.mockResolvedValue({ ...provisionedRow })

        await updateApplication(
            { params: { corporateId: '42' }, body: { cardSchemeId: 175491, kybReference: 'KYB0123456789' } },
            buildRes(),
            jest.fn()
        )

        expect(applicationUC.findOtherByCardSchemeId).not.toHaveBeenCalled()
        expect(applicationUC.upsertByCorporate).toHaveBeenCalled()
    })

    it('allows a duplicate card scheme id outside production', async () => {
        process.env.NODE_ENV = 'staging'
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow })
        applicationUC.findOtherByCardSchemeId.mockResolvedValue({ corporateId: 77, cardSchemeId: 175491 })
        const next = jest.fn()

        await updateApplication(
            { params: { corporateId: '42' }, body: { cardSchemeId: 175491 } },
            buildRes(),
            next
        )

        expect(applicationUC.findOtherByCardSchemeId).not.toHaveBeenCalled()
        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(42, { cardSchemeId: 175491 })
        expect(next).not.toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'This card scheme id is already assigned to another corporate.',
            })
        )
    })
})

describe('updateApplication — KYB status email', () => {
    beforeEach(() => jest.clearAllMocks())

    it('emails the corporate when the status transitions to VERIFIED', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...provisionedRow, kybStatus: 'UNDER_REVIEW' })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...provisionedRow, kybStatus: 'VERIFIED', kybReference: 'KYB-99' })
        getCorporatesByIds.mockResolvedValue(new Map([['42', { id: 42, email: 'corp@example.com', contactPersonName: 'Asha' }]]))

        await updateApplication(
            { params: { corporateId: '42' }, body: { kybStatus: 'VERIFIED' } },
            buildRes(),
            jest.fn()
        )

        expect(sendEmail).toHaveBeenCalledWith(
            undefined,
            'corp@example.com',
            expect.stringContaining('approved'),
            expect.stringContaining('Asha')
        )
        expect(sendEmail.mock.calls[0][3]).toContain('KYB-99')
    })

    it('emails the corporate with the rejection reason when the status transitions to REJECTED', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'UNDER_REVIEW' })
        applicationUC.upsertByCorporate.mockResolvedValue({
            ...baseRow,
            kybStatus: 'REJECTED',
            metadata: { rejectionReason: 'Blurry PAN card.' },
        })
        getCorporatesByIds.mockResolvedValue(new Map([['42', { id: 42, email: 'corp@example.com', companyName: 'Steel & Co' }]]))

        await updateApplication(
            { params: { corporateId: '42' }, body: { kybStatus: 'REJECTED' } },
            buildRes(),
            jest.fn()
        )

        expect(sendEmail).toHaveBeenCalledWith(
            undefined,
            'corp@example.com',
            expect.stringContaining('needs attention'),
            expect.stringContaining('Blurry PAN card.')
        )
    })

    it('does not email when the status is set but unchanged from before', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...provisionedRow, kybStatus: 'VERIFIED' })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...provisionedRow, kybStatus: 'VERIFIED', svcCardNumber: '1234567890123456' })

        await updateApplication(
            { params: { corporateId: '42' }, body: { kybStatus: 'VERIFIED', svcCardNumber: '1234567890123456' } },
            buildRes(),
            jest.fn()
        )

        expect(sendEmail).not.toHaveBeenCalled()
    })

    it('does not email for transitions other than VERIFIED/REJECTED (e.g. SUBMITTED)', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'PENDING' })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'SUBMITTED' })

        await updateApplication(
            { params: { corporateId: '42' }, body: { kybStatus: 'SUBMITTED' } },
            buildRes(),
            jest.fn()
        )

        expect(sendEmail).not.toHaveBeenCalled()
    })

    it('logs and skips sending when the corporate has no email on file', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...provisionedRow, kybStatus: 'UNDER_REVIEW' })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...provisionedRow, kybStatus: 'VERIFIED' })
        getCorporatesByIds.mockResolvedValue(new Map([['42', { id: 42, companyName: 'Steel & Co' }]]))
        const { customLog } = require('../../../utils/loggerHelper')

        await updateApplication(
            { params: { corporateId: '42' }, body: { kybStatus: 'VERIFIED' } },
            buildRes(),
            jest.fn()
        )

        expect(sendEmail).not.toHaveBeenCalled()
        expect(customLog).toHaveBeenCalledWith(
            undefined,
            'error',
            expect.objectContaining({ message: expect.stringContaining('email not found') }),
            'CONSOLE'
        )
    })

    it('does not fail the status update when the email send throws', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...provisionedRow, kybStatus: 'UNDER_REVIEW' })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...provisionedRow, kybStatus: 'VERIFIED' })
        getCorporatesByIds.mockRejectedValue(new Error('others outage'))
        const res = buildRes()

        await updateApplication(
            { params: { corporateId: '42' }, body: { kybStatus: 'VERIFIED' } },
            res,
            jest.fn()
        )

        expect(res.json.mock.calls[0][0].status).toBe(true)
    })
})

describe('updateApplication — KYB status notification', () => {
    beforeEach(() => jest.clearAllMocks())

    const withCorporate = (over = {}) =>
        getCorporatesByIds.mockResolvedValue(new Map([['42', {
            id: 42,
            email: 'corp@example.com',
            companyName: 'Steel & Co',
            credential: { username: 'steelco' },
            ...over,
        }]]))

    const decide = (body) =>
        updateApplication({ params: { corporateId: '42' }, body }, buildRes(), jest.fn())

    it('notifies the corporate when the status transitions to VERIFIED', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...provisionedRow, kybStatus: 'UNDER_REVIEW' })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...provisionedRow, kybStatus: 'VERIFIED', kybReference: 'KYB-99' })
        withCorporate()

        await decide({ kybStatus: 'VERIFIED' })

        expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
            notificationTitle: 'KYB Verification Approved',
            notificationCategory: 'KYB_VERIFIED',
            notificationTo: 'steelco',
            notificationBy: 'ADMIN',
        }), expect.anything())
    })

    it('carries the rejection reason into the notification', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'UNDER_REVIEW' })
        applicationUC.upsertByCorporate.mockResolvedValue({
            ...baseRow,
            kybStatus: 'REJECTED',
            metadata: { rejectionReason: 'Blurry PAN card.' },
        })
        withCorporate()

        await decide({ kybStatus: 'REJECTED' })

        const sent = createNotification.mock.calls[0][0]
        expect(sent.notificationTitle).toBe('KYB Verification Rejected')
        expect(sent.notificationCategory).toBe('KYB_REJECTED')
        expect(sent.notificationBrief).toContain('Blurry PAN card.')
    })

    /**
     * The shared notifications table declares no charset and staging defaults to armscii8, where a
     * non-ASCII character fails to INSERT and the row is silently lost.
     */
    it('keeps the notification copy pure ASCII', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'UNDER_REVIEW' })
        applicationUC.upsertByCorporate.mockResolvedValue({
            ...baseRow,
            kybStatus: 'REJECTED',
            metadata: { rejectionReason: 'Line one\nLine two' },
        })
        withCorporate()

        await decide({ kybStatus: 'REJECTED' })

        const sent = createNotification.mock.calls[0][0]
        // eslint-disable-next-line no-control-regex
        expect(sent.notificationBrief).toMatch(/^[\x20-\x7E]*$/)
        expect(sent.notificationTitle).toMatch(/^[\x20-\x7E]*$/)
    })

    it('points the corporate at the email when no reason was recorded', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'UNDER_REVIEW' })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'REJECTED' })
        withCorporate()

        await decide({ kybStatus: 'REJECTED' })

        expect(createNotification.mock.calls[0][0].notificationBrief).toContain('email')
    })

    it('does not notify when the status is set but unchanged', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...provisionedRow, kybStatus: 'VERIFIED' })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...provisionedRow, kybStatus: 'VERIFIED', svcCardNumber: '1234567890123456' })
        withCorporate()

        await decide({ kybStatus: 'VERIFIED', svcCardNumber: '1234567890123456' })

        expect(createNotification).not.toHaveBeenCalled()
    })

    // The decision is already saved; a missing username must not cost the corporate their email too.
    it('still emails when the corporate has no username to notify', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'UNDER_REVIEW' })
        applicationUC.upsertByCorporate.mockResolvedValue({
            ...baseRow,
            kybStatus: 'REJECTED',
            metadata: { rejectionReason: 'Blurry PAN card.' },
        })
        withCorporate({ credential: null })

        await decide({ kybStatus: 'REJECTED' })

        expect(createNotification).not.toHaveBeenCalled()
        expect(sendEmail).toHaveBeenCalled()
    })

    it('still responds 200 when the directory lookup fails outright', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'UNDER_REVIEW' })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'REJECTED' })
        getCorporatesByIds.mockRejectedValue(new Error('others down'))
        const res = buildRes()

        await updateApplication({ params: { corporateId: '42' }, body: { kybStatus: 'REJECTED' } }, res, jest.fn())

        expect(res.status).toHaveBeenCalledWith(200)
        expect(createNotification).not.toHaveBeenCalled()
    })
})

describe('updateApplication — vendor email on UNDER_REVIEW', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        getCorporatesByIds.mockResolvedValue(new Map([['42', { id: 42, companyName: 'Steel & Co' }]]))
        findServiceOperatorByAccessKey.mockResolvedValue({
            vendor: { vendorEmail: ['kyb@pinelabs.example', 'ops@pinelabs.example'] },
        })
        sendMailResult.mockResolvedValue({ ok: true, response: '250 OK' })
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'SUBMITTED' })
        applicationUC.upsertByCorporate.mockResolvedValue({
            ...baseRow, kybStatus: 'UNDER_REVIEW', kybReference: 'KYB-99', businessType: 'PRIVATE_LIMITED', reload: jest.fn(),
        })
        buildKybDocumentPack.mockResolvedValue({
            attachments: [{ filename: 'COI.pdf', content: Buffer.from('pdf') }],
            attached: ['Certificate of Incorporation'],
            omitted: [],
            totalBytes: 3,
        })
    })

    const review = () =>
        updateApplication({ params: { corporateId: '42' }, body: { kybStatus: 'UNDER_REVIEW' } }, buildRes(), jest.fn())

    it('emails every configured vendor address', async () => {
        await review()

        expect(sendMailResult).toHaveBeenCalledWith(
            undefined,
            ['kyb@pinelabs.example', 'ops@pinelabs.example'],
            expect.stringContaining('KYB review requested'),
            expect.stringContaining('Steel &amp; Co'),
            [expect.objectContaining({ filename: 'COI.pdf' })]
        )
    })

    it('lists the attached documents in the email body', async () => {
        await review()

        expect(sendMailResult.mock.calls[0][3]).toContain('Certificate of Incorporation')
        expect(sendMailResult.mock.calls[0][3]).toContain('Documents attached to this email')
    })

    /**
     * A pack that overruns the mail server bounces, so anything left out has to be named rather than
     * quietly dropped.
     */
    it('does not tell the vendor about documents that could not be attached', async () => {
        buildKybDocumentPack.mockResolvedValue({
            attachments: [],
            attached: [],
            omitted: ['Signing Authority Aadhaar'],
            totalBytes: 0,
        })

        await review()

        const html = sendMailResult.mock.calls[0][3]
        expect(html).not.toContain('please request these separately')
        expect(html).not.toContain('Signing Authority Aadhaar')
    })

    it('names the corporate and the reference in the subject', async () => {
        await review()

        expect(sendMailResult.mock.calls[0][2]).toContain('Steel & Co')
        expect(sendMailResult.mock.calls[0][2]).toContain('KYB-99')
    })

    it.each([
        ['a JSON-encoded array', '["kyb@pinelabs.example"]'],
        ['a comma separated string', 'kyb@pinelabs.example, ops@pinelabs.example'],
    ])('normalises vendorEmail stored as %s', async (_label, vendorEmail) => {
        findServiceOperatorByAccessKey.mockResolvedValue({ vendor: { vendorEmail } })

        await review()

        expect(sendMailResult.mock.calls[0][1][0]).toBe('kyb@pinelabs.example')
    })

    it.each([
        ['nothing configured', { vendor: { vendorEmail: [] } }],
        ['no vendor at all', { error: 'Service not available' }],
    ])('logs and skips when there is %s', async (_label, operator) => {
        findServiceOperatorByAccessKey.mockResolvedValue(operator)

        await review()

        expect(sendMailResult).not.toHaveBeenCalled()
    })

    it('does not re-notify the vendor when the status did not change', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'UNDER_REVIEW' })

        await review()

        expect(sendMailResult).not.toHaveBeenCalled()
    })

    it('still returns 200 when the vendor lookup throws', async () => {
        findServiceOperatorByAccessKey.mockRejectedValue(new Error('others unreachable'))
        const res = buildRes()

        await updateApplication({ params: { corporateId: '42' }, body: { kybStatus: 'UNDER_REVIEW' } }, res, jest.fn())

        expect(res.status).toHaveBeenCalledWith(200)
    })

    /**
     * A third party gets the entity and the reference, never the funding or card credentials.
     */
    it('never sends card or account details to the vendor', async () => {
        applicationUC.upsertByCorporate.mockResolvedValue({
            ...baseRow,
            kybStatus: 'UNDER_REVIEW',
            kybReference: 'KYB-99',
            svcCardNumber: '1234567890123456',
            virtualAccount: { accountNumber: '9988776655', ifsc: 'HDFC0001234' },
        })

        await review()

        const html = sendMailResult.mock.calls[0][3]
        expect(html).not.toContain('1234567890123456')
        expect(html).not.toContain('9988776655')
        expect(html).not.toContain('HDFC0001234')
    })

    it('does not notify the corporate on UNDER_REVIEW', async () => {
        await review()

        expect(createNotification).not.toHaveBeenCalled()
        expect(sendMailResult).toHaveBeenCalledTimes(1)
    })
})

describe('vendor email delivery state', () => {
    const underReviewRow = () => ({
        ...baseRow,
        kybStatus: 'UNDER_REVIEW',
        kybReference: 'KYB3F9A2B7C1D',
        businessType: 'PRIVATE_LIMITED',
        reload: jest.fn(),
    })

    beforeEach(() => {
        jest.clearAllMocks()
        getCorporatesByIds.mockResolvedValue(new Map([['42', { id: 42, companyName: 'Steel & Co' }]]))
        findServiceOperatorByAccessKey.mockResolvedValue({ vendor: { vendorEmail: ['kyb@pinelabs.example'] } })
        buildKybDocumentPack.mockResolvedValue({ attachments: [], attached: [], omitted: [], totalBytes: 0 })
        sendMailResult.mockResolvedValue({ ok: true, response: '250 OK' })
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybStatus: 'SUBMITTED' })
        applicationUC.upsertByCorporate.mockResolvedValue(underReviewRow())
    })

    const review = (res = buildRes()) =>
        updateApplication({ params: { corporateId: '42' }, body: { kybStatus: 'UNDER_REVIEW' } }, res, jest.fn())

    it('records the send against the application with the date it went out', async () => {
        await review()

        expect(applicationUC.updateVendorEmailState).toHaveBeenCalledWith(42, expect.objectContaining({
            vendorEmailStatus: true,
            vendorEmailSentAt: expect.any(Date),
        }))
    })

    it('records a false status and no date when the relay rejects the message', async () => {
        sendMailResult.mockResolvedValue({ ok: false, error: 'Mailbox unavailable' })

        await review()

        expect(applicationUC.updateVendorEmailState).toHaveBeenCalledWith(42, { vendorEmailStatus: false })
    })

    it('hands the failure reason back on the same response so the admin sees it immediately', async () => {
        sendMailResult.mockResolvedValue({ ok: false, error: 'Mailbox unavailable' })
        const res = buildRes()

        await review(res)

        expect(res.json.mock.calls[0][0].data.vendorEmailError).toBe('Mailbox unavailable')
    })

    it('tells the admin the vendor size limit when the compressed pack is over it', async () => {
        findServiceOperatorByAccessKey.mockResolvedValue({
            vendor: { vendorEmail: ['kyb@pinelabs.example'], optionals: { maxEmailSizeMb: 8 } },
        })
        buildKybDocumentPack.mockResolvedValue({
            attachments: [],
            attached: ['Certificate of Incorporation'],
            omitted: [],
            rawBytes: 30 * 1024 * 1024,
            totalBytes: 11 * 1024 * 1024,
            limitBytes: 8 * 1024 * 1024,
            exceeded: true,
        })
        const res = buildRes()

        await review(res)

        expect(sendMailResult).not.toHaveBeenCalled()
        expect(res.json.mock.calls[0][0].data.vendorEmailError).toContain('8 MB limit')
        expect(res.json.mock.calls[0][0].data.vendorEmailError).toContain('11.0 MB')
        expect(applicationUC.updateVendorEmailState).toHaveBeenCalledWith(42, { vendorEmailStatus: false })
    })

    it('says why nothing was sent when no vendor address is configured', async () => {
        findServiceOperatorByAccessKey.mockResolvedValue({ vendor: { vendorEmail: [] } })
        const res = buildRes()

        await review(res)

        expect(sendMailResult).not.toHaveBeenCalled()
        expect(applicationUC.updateVendorEmailState).toHaveBeenCalledWith(42, { vendorEmailStatus: false })
        expect(res.json.mock.calls[0][0].data.vendorEmailError).toContain('No vendor email address is configured')
    })

    it('carries no error field on the response when the send worked', async () => {
        const res = buildRes()

        await review(res)

        expect(res.json.mock.calls[0][0].data).not.toHaveProperty('vendorEmailError')
        expect(res.json.mock.calls[0][0].message).toContain('sent to the vendor')
    })

    it('reports the stored delivery state on the application detail', async () => {
        const sentAt = new Date('2026-08-01T09:00:00.000Z')
        applicationUC.findByCorporate.mockResolvedValue({
            ...baseRow,
            vendorEmailStatus: true,
            vendorEmailSentAt: sentAt,
        })
        const res = buildRes()

        await getApplication({ params: { corporateId: '42' } }, res, jest.fn())

        expect(res.json.mock.calls[0][0].data.application.vendorEmail).toEqual({ status: true, sentAt })
    })

    it('reports a null delivery state for an application never sent to the vendor', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow })
        const res = buildRes()

        await getApplication({ params: { corporateId: '42' } }, res, jest.fn())

        expect(res.json.mock.calls[0][0].data.application.vendorEmail).toEqual({ status: null, sentAt: null })
    })
})

describe('retryVendorEmail', () => {
    const underReviewRow = (overrides = {}) => ({
        ...baseRow,
        kybStatus: 'UNDER_REVIEW',
        kybReference: 'KYB3F9A2B7C1D',
        vendorEmailStatus: false,
        reload: jest.fn(),
        ...overrides,
    })

    beforeEach(() => {
        jest.clearAllMocks()
        getCorporatesByIds.mockResolvedValue(new Map([['42', { id: 42, companyName: 'Steel & Co' }]]))
        findServiceOperatorByAccessKey.mockResolvedValue({ vendor: { vendorEmail: ['kyb@pinelabs.example'] } })
        buildKybDocumentPack.mockResolvedValue({ attachments: [], attached: [], omitted: [], totalBytes: 0 })
        sendMailResult.mockResolvedValue({ ok: true, response: '250 OK' })
        applicationUC.findByCorporate.mockResolvedValue(underReviewRow())
    })

    const retry = (res = buildRes(), next = jest.fn()) =>
        retryVendorEmail({ params: { corporateId: '42' }, user: { id: 7 } }, res, next).then(() => ({ res, next }))

    it('sends the review email again and records that it went out', async () => {
        const { res } = await retry()

        expect(sendMailResult).toHaveBeenCalledTimes(1)
        expect(applicationUC.updateVendorEmailState).toHaveBeenCalledWith(42, expect.objectContaining({ vendorEmailStatus: true }))
        expect(res.json.mock.calls[0][0].message).toBe('Sent to the vendor.')
    })

    it('reattaches the documents rather than replaying a stored copy', async () => {
        buildKybDocumentPack.mockResolvedValue({
            attachments: [{ filename: 'COI.pdf', content: Buffer.from('pdf') }],
            attached: ['Certificate of Incorporation'],
            omitted: [],
            totalBytes: 3,
        })

        await retry()

        expect(buildKybDocumentPack).toHaveBeenCalledWith(expect.objectContaining({ corporateId: 42 }))
        expect(sendMailResult.mock.calls[0][4]).toEqual([expect.objectContaining({ filename: 'COI.pdf' })])
    })

    it('returns the reason on the response when the retry also fails', async () => {
        sendMailResult.mockResolvedValue({ ok: false, error: 'Mailbox unavailable' })

        const { res } = await retry()

        expect(res.json.mock.calls[0][0].data.vendorEmailError).toBe('Mailbox unavailable')
        expect(applicationUC.updateVendorEmailState).toHaveBeenCalledWith(42, { vendorEmailStatus: false })
    })

    it('404s when the corporate has no application', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)

        const { next } = await retry()

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }))
        expect(sendMailResult).not.toHaveBeenCalled()
    })

    it.each(['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED', 'COMPLETED'])(
        'refuses to email the vendor about a %s application',
        async (kybStatus) => {
            applicationUC.findByCorporate.mockResolvedValue(underReviewRow({ kybStatus }))

            const { next } = await retry()

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
            expect(sendMailResult).not.toHaveBeenCalled()
        }
    )

    it('rejects a corporate id that is not a positive integer', async () => {
        const next = jest.fn()

        await retryVendorEmail({ params: { corporateId: 'abc' }, user: { id: 7 } }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        expect(applicationUC.findByCorporate).not.toHaveBeenCalled()
    })
})

describe('updateApplication — KYB reference format', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        getCorporatesByIds.mockResolvedValue(new Map([['42', { id: 42, companyName: 'Steel & Co' }]]))
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow })
        applicationUC.upsertByCorporate.mockResolvedValue({ ...baseRow })
    })

    const save = (kybReference, next = jest.fn()) =>
        updateApplication({ params: { corporateId: '42' }, body: { kybReference } }, buildRes(), next).then(() => next)

    it.each(['done', 'DONE', 'KYB-99', 'kyb3f9a2b7c1d', 'KYB3F9A2B7C1', 'KYB3F9A2B7C1DE'])(
        'refuses %s, which is not a reference the system ever generates',
        async (value) => {
            const next = await save(value)

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
            expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
        }
    )

    it('accepts a reference in the generated shape', async () => {
        const next = await save('KYB3F9A2B7C1D')

        expect(next).not.toHaveBeenCalled()
        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(42, expect.objectContaining({ kybReference: 'KYB3F9A2B7C1D' }))
    })

    it('lets an unchanged bad reference through so the rest of the application can still be saved', async () => {
        applicationUC.findByCorporate.mockResolvedValue({ ...baseRow, kybReference: 'done' })

        const next = await save('done')

        expect(next).not.toHaveBeenCalled()
        expect(applicationUC.upsertByCorporate).toHaveBeenCalled()
    })

    it('clears the reference when it is sent empty', async () => {
        const next = await save('')

        expect(next).not.toHaveBeenCalled()
        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(42, expect.objectContaining({ kybReference: null }))
    })
})
