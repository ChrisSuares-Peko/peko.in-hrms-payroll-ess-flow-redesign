jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../../models/use-cases/cardIssuance', () => ({
    findByExternalCardIdentifier: jest.fn(),
    findPhysicalByReferenceNumber: jest.fn(),
    appendDispatches: jest.fn(),
}))
jest.mock('../../../utils/cardHelpers', () => ({
    ...jest.requireActual('../../../utils/cardHelpers'),
    safeAudit: jest.fn(),
}))

const { cardNotification } = require('../pinelabs')
const { customLog } = require('../../../utils/loggerHelper')
const { findPhysicalByReferenceNumber, appendDispatches } = require('../../../models/use-cases/cardIssuance')
const { safeAudit } = require('../../../utils/cardHelpers')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

// The payload exactly as Pine Labs documented it: a root-level array, two cards, one shared AWB.
const SAMPLE = [
    {
        referenceNumber: 31157821,
        awbNumber: '35870400000',
        courierPartnerID: 1,
        courierPartnerName: 'Bluedart',
        customerName: 'customer_name',
        mobileNumber: 9876543210,
        addressLine1: 'address_1',
        addressLine2: 'address_2',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: 560001,
        dispatchedOn: '2026-08-08T18:11:10',
    },
    {
        referenceNumber: 613989121,
        awbNumber: '35870400000',
        courierPartnerID: 1,
        courierPartnerName: 'Bluedart',
        customerName: 'customer_name',
        mobileNumber: 9876543210,
        addressLine1: 'address_1',
        addressLine2: 'address_2',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pinCode: 600096,
        dispatchedOn: '2026-08-08T18:11:10',
    },
]

const buildReq = (body = SAMPLE, overrides = {}) => ({
    originalUrl: '/api/v1/webhook/pinelabs/corporate-cards/card-notification',
    LogTraceId: 't',
    headers: { 'content-type': 'application/json' },
    body,
    ...overrides,
})

const card = (id, referenceNumber) => ({ id, referenceNumber, corporateId: 42, userId: 99 })
const appended = (added = 1, extra = {}) => ({ added, duplicates: 0, capped: 0, total: added, ...extra })
const dataOf = (res) => res.json.mock.calls[0][0].data

describe('cardNotification (physical card dispatch)', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findPhysicalByReferenceNumber.mockImplementation(async (reference) =>
            card(reference === '31157821' ? 11 : 22, reference))
        appendDispatches.mockResolvedValue(appended())
    })

    // The requirement: two objects naming two cards store one object each, not both on both.
    it('files each record against the card its referenceNumber names', async () => {
        const res = buildRes()

        await cardNotification(buildReq(), res)

        expect(findPhysicalByReferenceNumber).toHaveBeenCalledTimes(2)
        expect(findPhysicalByReferenceNumber).toHaveBeenCalledWith('31157821')
        expect(findPhysicalByReferenceNumber).toHaveBeenCalledWith('613989121')

        expect(appendDispatches).toHaveBeenCalledTimes(2)
        const [firstCardId, firstRecords] = appendDispatches.mock.calls[0]
        const [secondCardId, secondRecords] = appendDispatches.mock.calls[1]
        expect(firstCardId).toBe(11)
        expect(firstRecords).toHaveLength(1)
        expect(firstRecords[0].city).toBe('Bengaluru')
        expect(secondCardId).toBe(22)
        expect(secondRecords).toHaveLength(1)
        expect(secondRecords[0].city).toBe('Chennai')

        expect(res.status).toHaveBeenCalledWith(200)
        expect(dataOf(res)).toEqual({ received: 2, stored: 2, duplicates: 0, capped: 0, unmatched: 0, unusable: 0 })
    })

    it('stores the vendor record with the resolved instant alongside it', async () => {
        await cardNotification(buildReq(), buildRes())

        const [, records] = appendDispatches.mock.calls[0]
        expect(records[0]).toEqual(expect.objectContaining({
            referenceNumber: 31157821,
            awbNumber: '35870400000',
            courierPartnerName: 'Bluedart',
            dispatchedOn: '2026-08-08T18:11:10',
            dispatchedAtUtc: '2026-08-08T12:41:10.000Z',
            receivedAt: expect.any(String),
        }))
    })

    it('groups several records for one card into a single write', async () => {
        const second = { ...SAMPLE[0], awbNumber: '35870400099' }
        appendDispatches.mockResolvedValue(appended(2))

        await cardNotification(buildReq([SAMPLE[0], second]), buildRes())

        expect(appendDispatches).toHaveBeenCalledTimes(1)
        expect(appendDispatches.mock.calls[0][1]).toHaveLength(2)
    })

    it('accepts a single unwrapped object', async () => {
        await cardNotification(buildReq(SAMPLE[0]), buildRes())

        expect(appendDispatches).toHaveBeenCalledTimes(1)
        expect(appendDispatches.mock.calls[0][0]).toBe(11)
    })

    it('passes the card-scoped dedupe key and the cap to the writer', async () => {
        await cardNotification(buildReq(), buildRes())

        const [, , options] = appendDispatches.mock.calls[0]
        expect(typeof options.keyOf).toBe('function')
        expect(options.max).toBe(25)
    })

    // Redelivery is normal for a webhook and must be a no-op, reported honestly.
    it('reports a redelivered record as a duplicate, not as stored', async () => {
        appendDispatches.mockResolvedValue({ added: 0, duplicates: 1, capped: 0, total: 1 })
        const res = buildRes()

        await cardNotification(buildReq([SAMPLE[0]]), res)

        expect(dataOf(res)).toEqual({ received: 1, stored: 0, duplicates: 1, capped: 0, unmatched: 0, unusable: 0 })
        expect(safeAudit).not.toHaveBeenCalled()
    })

    it('audits the card once when something was actually stored', async () => {
        await cardNotification(buildReq([SAMPLE[0]]), buildRes())

        expect(safeAudit).toHaveBeenCalledTimes(1)
        const [, entry] = safeAudit.mock.calls[0]
        expect(entry).toEqual(expect.objectContaining({
            cardIssuanceId: 11,
            corporateId: 42,
            userId: 99,
            action: 'CARD_DISPATCHED',
            actorCredentialId: null,
            actorDisplay: 'Pine Labs',
        }))
        expect(entry.description).toContain('Bluedart')
        expect(entry.description).toContain('35870400000')
    })

    // A card that is not ours will never become ours, so retrying is pointless: acknowledge it.
    it('acknowledges a record whose card cannot be found, and counts it unmatched', async () => {
        findPhysicalByReferenceNumber.mockResolvedValue(null)
        const res = buildRes()

        await cardNotification(buildReq(), res)

        expect(appendDispatches).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200)
        expect(dataOf(res)).toEqual({ received: 2, stored: 0, duplicates: 0, capped: 0, unmatched: 2, unusable: 0 })
    })

    it('still stores the records it can place when one card is unknown', async () => {
        findPhysicalByReferenceNumber.mockImplementation(async (reference) =>
            (reference === '31157821' ? card(11, reference) : null))
        const res = buildRes()

        await cardNotification(buildReq(), res)

        expect(appendDispatches).toHaveBeenCalledTimes(1)
        expect(dataOf(res)).toEqual({ received: 2, stored: 1, duplicates: 0, capped: 0, unmatched: 1, unusable: 0 })
    })

    it('counts a record that names no card as unusable and never queries for it', async () => {
        const res = buildRes()

        await cardNotification(buildReq([{ awbNumber: 'x' }, SAMPLE[0]]), res)

        expect(findPhysicalByReferenceNumber).toHaveBeenCalledTimes(1)
        expect(dataOf(res)).toEqual({ received: 2, stored: 1, duplicates: 0, capped: 0, unmatched: 0, unusable: 1 })
    })

    // The one case worth a retry: the write failed, so the vendor must send it again.
    it('answers 500 when a write throws, so the delivery is retried', async () => {
        appendDispatches.mockRejectedValue(new Error('Deadlock found when trying to get lock'))
        const res = buildRes()

        await cardNotification(buildReq(), res)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json.mock.calls[0][0].responseCode).toBe('001')
        expect(dataOf(res).failed).toBe(2)
    })

    it('answers 500 if only one of several cards failed, and reports the ones that landed', async () => {
        appendDispatches
            .mockResolvedValueOnce(appended())
            .mockRejectedValueOnce(new Error('lock wait timeout'))
        const res = buildRes()

        await cardNotification(buildReq(), res)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(dataOf(res)).toEqual(expect.objectContaining({ stored: 1, failed: 1 }))
    })

    // Every record must land in exactly one bucket, or the acknowledgement stops adding up.
    it('accounts for cap-dropped records in the summary, so the parts total the receipt', async () => {
        appendDispatches.mockResolvedValue({ added: 0, duplicates: 0, capped: 1, total: 25 })
        const res = buildRes()

        await cardNotification(buildReq([SAMPLE[0]]), res)

        const summary = dataOf(res)
        expect(summary.capped).toBe(1)
        expect(summary.stored + summary.duplicates + summary.capped + summary.unmatched + summary.unusable)
            .toBe(summary.received)
    })

    it('raises the delivery log to error when nothing usable arrived at all', async () => {
        await cardNotification(buildReq([{ awbNumber: 'x', courierPartnerName: 'Bluedart' }]), buildRes())

        const [, level, data] = customLog.mock.calls[0]
        expect(level).toBe('error')
        expect(data.received).toBe(1)
        expect(data.cards).toBe(0)
        expect(data.unusable).toBe(1)
    })

    it('logs when the history cap dropped records', async () => {
        appendDispatches.mockResolvedValue({ added: 0, duplicates: 0, capped: 1, total: 25 })

        await cardNotification(buildReq([SAMPLE[0]]), buildRes())

        const capLog = customLog.mock.calls.find(([, , data]) => /at its cap/.test(data?.message || ''))
        expect(capLog).toBeDefined()
        expect(capLog[2].dropped).toBe(1)
    })

    it('threads the request trace id into the write, so both sides of it correlate', async () => {
        await cardNotification(buildReq([SAMPLE[0]]), buildRes())

        expect(appendDispatches.mock.calls[0][2].logTraceId).toBe('t')
    })

    it('logs each card the dispatch was recorded against, with the counts', async () => {
        await cardNotification(buildReq([SAMPLE[0]]), buildRes())

        const entry = customLog.mock.calls.find(([, , data]) => /recorded against card/.test(data?.message || ''))
        expect(entry).toBeDefined()
        expect(entry[2]).toEqual(expect.objectContaining({
            cardIssuanceId: 11,
            corporateId: 42,
            referenceNumber: '31157821',
            offered: 1,
            added: 1,
        }))
        // The whole vendor record, not a hand-picked subset of its fields.
        expect(entry[2].records).toEqual([SAMPLE[0]])
        expect(entry[4]).toEqual(expect.arrayContaining(['customerName', 'mobileNumber']))
    })

    it.each([
        ['unmatched', () => findPhysicalByReferenceNumber.mockResolvedValue(null), /names no physical card/],
        ['failed', () => appendDispatches.mockRejectedValue(new Error('deadlock')), /could not be stored/],
    ])('logs the full record on the %s path too, masked', async (_label, arrange, pattern) => {
        arrange()

        await cardNotification(buildReq([SAMPLE[0]]), buildRes())

        const entry = customLog.mock.calls.find(([, , data]) => pattern.test(data?.message || ''))
        expect(entry).toBeDefined()
        expect(entry[2].records).toEqual([SAMPLE[0]])
        expect(entry[4]).toEqual(expect.arrayContaining(['customerName', 'mobileNumber', 'addressLine1']))
    })

    it('closes with a delivery summary naming the status it answered', async () => {
        await cardNotification(buildReq(), buildRes())

        const entry = customLog.mock.calls.find(([, , data]) => /notification processed/.test(data?.message || ''))
        expect(entry).toBeDefined()
        expect(entry[1]).toBe('info')
        expect(entry[2]).toEqual(expect.objectContaining({
            cards: 2, failedCards: 0, received: 2, stored: 2, responseStatus: 200,
        }))
    })

    it('logs the refusal at error level when it answers 500', async () => {
        appendDispatches.mockRejectedValue(new Error('deadlock'))

        await cardNotification(buildReq(), buildRes())

        const entry = customLog.mock.calls.find(([, , data]) => /notification refused/.test(data?.message || ''))
        expect(entry).toBeDefined()
        expect(entry[1]).toBe('error')
        expect(entry[2]).toEqual(expect.objectContaining({ failedCards: 2, responseStatus: 500 }))
    })

    it('masks the cardholder PII the payload carries', async () => {
        await cardNotification(buildReq(), buildRes())

        const [, , , type, maskFields] = customLog.mock.calls[0]
        expect(type).toBe('VENDOR')
        expect(maskFields).toEqual(expect.arrayContaining([
            'customerName', 'mobileNumber', 'addressLine1', 'addressLine2', 'pinCode',
        ]))
    })

    it('never logs a header value', async () => {
        const req = buildReq(SAMPLE, {
            headers: { 'content-type': 'application/json', authorization: 'Bearer super-secret' },
        })

        await cardNotification(req, buildRes())

        expect(JSON.stringify(customLog.mock.calls)).not.toContain('super-secret')
    })

    it('flags an empty body at error level and still acknowledges it', async () => {
        const res = buildRes()

        await cardNotification(buildReq({}), res)

        const [, level] = customLog.mock.calls[0]
        expect(level).toBe('error')
        expect(res.status).toHaveBeenCalledWith(200)
        expect(dataOf(res)).toEqual({ received: 0, stored: 0, duplicates: 0, capped: 0, unmatched: 0, unusable: 0 })
    })

    it('does not throw when body and headers are absent entirely', async () => {
        const res = buildRes()

        await cardNotification({ originalUrl: '/x' }, res)

        expect(res.status).toHaveBeenCalledWith(200)
    })
})
