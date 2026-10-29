jest.mock('../../../models/use-cases/corporateCardAdminApplication', () => ({
    findByCorporate: jest.fn(),
    upsertByCorporate: jest.fn(),
}))
jest.mock('../../../models/use-cases/corporateDocuments', () => ({
    delectDocfiles: jest.fn(),
    findAllCorporateDocuments: jest.fn(),
    sumSizeBytes: jest.fn(),
}))
jest.mock('../../../services/documentSizeLimits', () => ({
    getMaxSizeKbMap: jest.fn(),
    getTotalLimitsKb: jest.fn(),
}))
jest.mock('../../../utils/sharedDirectory', () => ({ getSelfCorporate: jest.fn() }))
jest.mock('../../../utils/emailer', () => ({ email: jest.fn() }))
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))

const applicationUC = require('../../../models/use-cases/corporateCardAdminApplication')
const documentsUC = require('../../../models/use-cases/corporateDocuments')
const { getTotalLimitsKb } = require('../../../services/documentSizeLimits')
const { getSelfCorporate } = require('../../../utils/sharedDirectory')
const { email: sendEmail } = require('../../../utils/emailer')
const { KYB_SUBMISSION_ALERT_EMAILS } = require('../../../constants/corporateCardApplication')
const { submitKyb } = require('../kybStatus')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const req = () => ({ user: { corporateId: 42, id: 5 }, body: {}, LogTraceId: 't' })

const corporate = () => ({
    id: 42,
    companyName: 'Acme Pvt Ltd',
    contactPersonName: 'Aarav Sharma',
    email: 'aarav@acme.in',
    mobileNo: '9876543210',
})

const sentTo = () => sendEmail.mock.calls[0][1]
const sentSubject = () => sendEmail.mock.calls[0][2]
const sentBody = () => sendEmail.mock.calls[0][3]

beforeEach(() => {
    jest.clearAllMocks()
    applicationUC.findByCorporate.mockResolvedValue({
        corporateId: 42,
        kybStatus: 'PENDING',
        businessType: 'PRIVATE_LIMITED',
        agreementSignMethod: 'E_SIGN',
        esignStatus: 'SIGNED',
    })
    applicationUC.upsertByCorporate.mockImplementation(async (corporateId, fields) => ({
        corporateId,
        businessType: 'PRIVATE_LIMITED',
        kybReference: 'KYBAAA111',
        updatedAt: '2026-10-17T06:30:00.000Z',
        ...fields,
    }))
    documentsUC.findAllCorporateDocuments.mockResolvedValue([])
    documentsUC.sumSizeBytes.mockResolvedValue(0)
    getTotalLimitsKb.mockResolvedValue({ totalUploadKb: 100000, vendorPackKb: 100000 })
    getSelfCorporate.mockResolvedValue(corporate())
})

describe('submitKyb — the alert to the review team', () => {
    it('emails every address on the configured list in one send', async () => {
        await submitKyb(req(), buildRes(), jest.fn())

        expect(sendEmail).toHaveBeenCalledTimes(1)
        expect(sentTo()).toEqual(KYB_SUBMISSION_ALERT_EMAILS)
    })

    it('is configured with at least one real address, or it silently does nothing', () => {
        expect(KYB_SUBMISSION_ALERT_EMAILS.length).toBeGreaterThan(0)
        for (const address of KYB_SUBMISSION_ALERT_EMAILS) {
            expect(address).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)
        }
    })

    it('names the company in the subject so the queue is scannable', async () => {
        await submitKyb(req(), buildRes(), jest.fn())

        expect(sentSubject()).toContain('Acme Pvt Ltd')
    })

    it('carries the details a reviewer needs to pick the application up', async () => {
        await submitKyb(req(), buildRes(), jest.fn())

        const { kybReference } = applicationUC.upsertByCorporate.mock.calls[0][1]
        const body = sentBody()
        expect(body).toContain('Acme Pvt Ltd')
        expect(body).toContain('Aarav Sharma')
        expect(body).toContain('aarav@acme.in')
        expect(body).toContain(kybReference)
        expect(body).toContain('Private Limited')
    })

    it('still submits when the corporate cannot be resolved, naming it generically', async () => {
        getSelfCorporate.mockRejectedValue(new Error('others down'))
        const res = buildRes()

        await submitKyb(req(), res, jest.fn())

        expect(sendEmail).toHaveBeenCalledTimes(1)
        expect(sentSubject()).toContain('Corporate #42')
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'KYB submitted.' }))
    })

    it('never fails the submission because the alert failed', async () => {
        sendEmail.mockImplementation(() => { throw new Error('smtp down') })
        const res = buildRes()
        const next = jest.fn()

        await submitKyb(req(), res, next)

        expect(next).not.toHaveBeenCalled()
        expect(applicationUC.upsertByCorporate).toHaveBeenCalled()
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'KYB submitted.' }))
    })

    it('does not alert when the submission was refused', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            corporateId: 42,
            kybStatus: 'SUBMITTED',
            kybReference: 'KYBAAA111',
        })
        const next = jest.fn()

        await submitKyb(req(), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        expect(sendEmail).not.toHaveBeenCalled()
    })
})
