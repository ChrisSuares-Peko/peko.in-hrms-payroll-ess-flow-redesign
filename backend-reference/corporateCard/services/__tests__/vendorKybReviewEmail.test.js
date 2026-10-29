jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../utils/corporateCardEmailer', () => ({ sendCorporateCardMailResult: jest.fn() }))
jest.mock('../../utils/sharedDirectory', () => ({ getCorporatesByIds: jest.fn() }))
jest.mock('../../utils/checkAndFetchServiceDetails', () => ({ findServiceOperatorByAccessKey: jest.fn() }))
jest.mock('../../utils/pinelabsGateway', () => ({ DEFAULT_ACCESS_KEY: 'corporate_cards' }))
jest.mock('../kybDocumentPack', () => ({ buildKybDocumentPack: jest.fn() }))
jest.mock('../../models/use-cases/corporateCardAdminApplication', () => ({ updateVendorEmailState: jest.fn() }))

const { customLog } = require('../../utils/loggerHelper')
const { sendCorporateCardMailResult: sendMailResult } = require('../../utils/corporateCardEmailer')
const { getCorporatesByIds } = require('../../utils/sharedDirectory')
const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails')
const { buildKybDocumentPack } = require('../kybDocumentPack')
const { updateVendorEmailState } = require('../../models/use-cases/corporateCardAdminApplication')
const { dispatchVendorKybReviewEmail, SEND_TIMEOUT_MS } = require('../vendorKybReviewEmail')

const application = {
    corporateId: 42,
    kybReference: 'KYB3F9A2B7C1D',
    businessType: 'PRIVATE_LIMITED',
    updatedAt: '2026-07-10T10:00:00.000Z',
}

const dispatch = () => dispatchVendorKybReviewEmail({ application, req: { LogTraceId: 't' } })

beforeEach(() => {
    jest.clearAllMocks()
    getCorporatesByIds.mockResolvedValue(new Map([['42', { companyName: 'Steel & Co' }]]))
    findServiceOperatorByAccessKey.mockResolvedValue({ vendor: { vendorEmail: ['kyb@pinelabs.example'] } })
    buildKybDocumentPack.mockResolvedValue({
        attachments: [], attached: [], omitted: [], rawBytes: 0, totalBytes: 0, limitBytes: 20 * 1024 * 1024, exceeded: false,
    })
    sendMailResult.mockResolvedValue({ ok: true, response: '250 OK' })
})

describe('dispatching the vendor KYB review email', () => {
    it('records the send and reports it back', async () => {
        const result = await dispatch()

        expect(result.sent).toBe(true)
        expect(updateVendorEmailState).toHaveBeenCalledWith(42, expect.objectContaining({ vendorEmailStatus: true }))
    })

    it('stamps the date the mail went out', async () => {
        await dispatch()

        expect(updateVendorEmailState.mock.calls[0][1].vendorEmailSentAt).toBeInstanceOf(Date)
    })

    it('leaves no date behind on a failed send, so a false status is never read as sent', async () => {
        sendMailResult.mockResolvedValue({ ok: false, error: 'Mailbox unavailable' })

        await dispatch()

        expect(updateVendorEmailState).toHaveBeenCalledWith(42, { vendorEmailStatus: false })
    })

    it('sends on the KYB reference alone when the corporate directory is unreachable', async () => {
        getCorporatesByIds.mockRejectedValue(new Error('others unreachable'))

        const result = await dispatch()

        expect(result.sent).toBe(true)
        expect(sendMailResult.mock.calls[0][2]).toContain('KYB3F9A2B7C1D')
    })

    it('gives up when neither a company name nor a reference identifies the corporate', async () => {
        getCorporatesByIds.mockResolvedValue(new Map())

        const result = await dispatchVendorKybReviewEmail({
            application: { ...application, kybReference: null },
            req: {},
        })

        expect(result).toEqual({ sent: false, error: expect.stringContaining('Neither a company name nor a KYB reference') })
        expect(sendMailResult).not.toHaveBeenCalled()
    })

    it('names the missing vendor configuration rather than failing silently', async () => {
        findServiceOperatorByAccessKey.mockResolvedValue({ error: 'Service not available' })

        const result = await dispatch()

        expect(result.error).toContain('No vendor email address is configured')
        expect(updateVendorEmailState).toHaveBeenCalledWith(42, { vendorEmailStatus: false })
    })

    it('reports a failure when the documents cannot be gathered', async () => {
        buildKybDocumentPack.mockRejectedValue(new Error('kms denied'))

        const result = await dispatch()

        expect(result.sent).toBe(false)
        expect(sendMailResult).not.toHaveBeenCalled()
    })

    it('keeps an unexpected internal error out of the message and in the log', async () => {
        buildKybDocumentPack.mockRejectedValue(new Error('kms denied'))

        const result = await dispatch()

        expect(result.error).not.toContain('kms denied')
        expect(result.error).toContain('reach@peko.one')
        expect(customLog).toHaveBeenCalledWith('t', 'error', expect.objectContaining({
            action: 'corporateCard:vendorKybEmail:unexpected',
            error: 'kms denied',
        }), 'CONSOLE')
    })

    it('stops waiting on an unresponsive mail server and reports it as not sent', async () => {
        jest.useFakeTimers()
        sendMailResult.mockReturnValue(new Promise(() => {}))

        const pending = dispatch()
        await jest.advanceTimersByTimeAsync(SEND_TIMEOUT_MS)
        const result = await pending

        expect(result).toEqual({ sent: false, error: 'The mail server did not respond in time.' })
        expect(updateVendorEmailState).toHaveBeenCalledWith(42, { vendorEmailStatus: false })
        jest.useRealTimers()
    })

    it('caps the pack at the size configured on the vendor record', async () => {
        findServiceOperatorByAccessKey.mockResolvedValue({
            vendor: { vendorEmail: ['kyb@pinelabs.example'], optionals: { maxEmailSizeMb: 8 } },
        })

        await dispatch()

        expect(buildKybDocumentPack).toHaveBeenCalledWith(
            expect.objectContaining({ maxTotalBytes: 8 * 1024 * 1024 })
        )
    })

    it.each([
        ['no optionals at all', undefined],
        ['an unset key', {}],
        ['a non-numeric value', { maxEmailSizeMb: 'twenty' }],
        ['zero', { maxEmailSizeMb: 0 }],
        ['a negative number', { maxEmailSizeMb: -5 }],
    ])('falls back to 20 MB on %s rather than blocking the send', async (_label, optionals) => {
        findServiceOperatorByAccessKey.mockResolvedValue({
            vendor: { vendorEmail: ['kyb@pinelabs.example'], optionals },
        })

        const result = await dispatch()

        expect(buildKybDocumentPack).toHaveBeenCalledWith(
            expect.objectContaining({ maxTotalBytes: 20 * 1024 * 1024 })
        )
        expect(result.sent).toBe(true)
    })

    it('reads the limit from a string, because optionals is free-form JSON', async () => {
        findServiceOperatorByAccessKey.mockResolvedValue({
            vendor: { vendorEmail: ['kyb@pinelabs.example'], optionals: { maxEmailSizeMb: '12' } },
        })

        await dispatch()

        expect(buildKybDocumentPack).toHaveBeenCalledWith(
            expect.objectContaining({ maxTotalBytes: 12 * 1024 * 1024 })
        )
    })

    it('caps the pack at the configured vendor-pack limit when the vendor allows more', async () => {
        findServiceOperatorByAccessKey.mockResolvedValue({
            vendor: { vendorEmail: ['kyb@pinelabs.example'], optionals: { maxEmailSizeMb: 50 } },
        })

        await dispatch()

        expect(buildKybDocumentPack).toHaveBeenCalledWith(
            expect.objectContaining({ maxTotalBytes: 26 * 1024 * 1024 })
        )
    })

    it('sends nothing and names the limit when the pack is too big', async () => {
        findServiceOperatorByAccessKey.mockResolvedValue({
            vendor: { vendorEmail: ['kyb@pinelabs.example'], optionals: { maxEmailSizeMb: 8 } },
        })
        buildKybDocumentPack.mockResolvedValue({
            attachments: [], attached: ['Certificate of Incorporation'], omitted: [],
            rawBytes: 30 * 1024 * 1024, totalBytes: 11 * 1024 * 1024, limitBytes: 8 * 1024 * 1024, exceeded: true,
        })

        const result = await dispatch()

        expect(sendMailResult).not.toHaveBeenCalled()
        expect(result.sent).toBe(false)
        expect(result.error).toContain('11.0 MB')
        expect(result.error).toContain('8.0 MB limit')
    })

    it('records the over-limit pack as not sent, so the admin gets a retry', async () => {
        buildKybDocumentPack.mockResolvedValue({
            attachments: [], attached: [], omitted: [], rawBytes: 0, totalBytes: 99, limitBytes: 1, exceeded: true,
        })

        await dispatch()

        expect(updateVendorEmailState).toHaveBeenCalledWith(42, { vendorEmailStatus: false })
    })

    it('tells the vendor the documents arrive as one zip', async () => {
        buildKybDocumentPack.mockResolvedValue({
            attachments: [{ filename: 'KYB-Documents.zip', content: Buffer.from('PK') }],
            attached: ['Certificate of Incorporation'], omitted: [],
            rawBytes: 10, totalBytes: 2, limitBytes: 20 * 1024 * 1024, exceeded: false,
        })

        await dispatch()

        expect(sendMailResult.mock.calls[0][4]).toEqual([expect.objectContaining({ filename: 'KYB-Documents.zip' })])
        expect(sendMailResult.mock.calls[0][3]).not.toContain('KYB-Documents.zip')
    })

    it('still reports the send when the outcome cannot be written to the row', async () => {
        updateVendorEmailState.mockRejectedValue(new Error('deadlock'))

        const result = await dispatch()

        expect(result.sent).toBe(true)
    })
})
