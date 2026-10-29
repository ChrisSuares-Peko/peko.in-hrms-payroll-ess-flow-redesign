jest.mock('../../../models/use-cases/cardTransaction', () => ({
    listAllTransactions: jest.fn(),
    findByIdWithPayloads: jest.fn(),
    listTransactedCorporateIds: jest.fn(),
}))
jest.mock('../../../utils/sharedDirectory', () => ({
    getCorporatesByIds: jest.fn(),
    getCardholdersByIdentities: jest.fn(),
    getCorporateCardUsersByIds: jest.fn(),
    findOwnerCardholder: jest.fn(),
}))
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))

const { listTransactions, getTransaction, listTransactionCorporates } = require('../cardTransactions')
const {
    listAllTransactions,
    findByIdWithPayloads,
    listTransactedCorporateIds,
} = require('../../../models/use-cases/cardTransaction')
const {
    getCorporatesByIds,
    getCardholdersByIdentities,
    getCorporateCardUsersByIds,
} = require('../../../utils/sharedDirectory')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const payload = (res) => res.json.mock.calls[0][0].data

const AUTH_PAYLOAD = { transactionUniqueId: 16680223570, transactionDetail: { transactionAmount: 50 } }
const NOTIFY_PAYLOAD = { transactionUniqueId: 16680223570, transactionDetail: { transferCardBalance: 4750 } }

const row = (overrides = {}) => ({
    id: 5,
    displayId: 'CC000005',
    transactionUniqueId: 16680223570,
    notificationUniqueId: 70166802235,
    corporateId: 42,
    userId: 77,
    cardIssuanceId: 7,
    referenceNumber: 'REF-1',
    externalCardIdentifier: 'PKCARD77',
    eventType: 'NOTIFY',
    transactionType: 2,
    transactionMode: 1,
    transactionAmount: '50.00',
    issuerWalletBalance: '4750.00',
    merchantName: 'PinePerk_Test_Merchant',
    merchantCity: 'Chennai',
    merchantCategoryCode: '5999',
    category: 'Shopping',
    decision: 'AUTHORIZED',
    declineReason: null,
    status: 'NOTIFIED',
    adminApproval: 'PENDING',
    createdAt: '2026-09-10T10:00:00.000Z',
    notifiedAt: '2026-09-10T10:01:00.000Z',
    cardIssuance: { id: 7, maskedCardNumber: '608363******3657' },
    ...overrides,
})

const req = (query = {}, params = {}) => ({ query, params, LogTraceId: 't' })

beforeEach(() => {
    jest.clearAllMocks()
    listAllTransactions.mockResolvedValue({ count: 1, rows: [row()] })
    getCorporatesByIds.mockResolvedValue(new Map([['42', { id: 42, companyName: 'Acme Pvt Ltd' }]]))
    getCardholdersByIdentities.mockResolvedValue(new Map([['77', { id: 77, name: 'Aarav Sharma' }]]))
    getCorporateCardUsersByIds.mockResolvedValue(new Map([['77', { id: 77, name: 'Aarav Sharma' }]]))
})

describe('listTransactions', () => {
    it('returns the vendor id alongside our own display id', async () => {
        const res = buildRes()

        await listTransactions(req(), res, jest.fn())

        expect(payload(res).rows[0]).toEqual(
            expect.objectContaining({ displayId: 'CC000005', transactionUniqueId: '16680223570' })
        )
    })

    // BIGINT ids lose precision once JSON.parse sees them as numbers.
    it('sends every id as a string', async () => {
        const res = buildRes()

        await listTransactions(req(), res, jest.fn())

        const listed = payload(res).rows[0]
        expect(typeof listed.transactionUniqueId).toBe('string')
        expect(typeof listed.notificationUniqueId).toBe('string')
        expect(typeof listed.userId).toBe('string')
        expect(typeof listed.cardIssuanceId).toBe('string')
    })

    it('names the corporate and the cardholder the transaction belongs to', async () => {
        const res = buildRes()

        await listTransactions(req(), res, jest.fn())

        expect(payload(res).rows[0]).toEqual(
            expect.objectContaining({ corporateName: 'Acme Pvt Ltd', cardholderName: 'Aarav Sharma' })
        )
    })

    it('looks the cardholder up against the row\'s corporate, not the admin session that has none', async () => {
        await listTransactions(req(), buildRes(), jest.fn())

        expect(getCorporateCardUsersByIds).toHaveBeenCalledWith([77], '42', expect.anything())
        expect(getCardholdersByIdentities).not.toHaveBeenCalled()
    })

    it('names a corporate that has no companyName from its credential', async () => {
        getCorporatesByIds.mockResolvedValue(
            new Map([['42', { id: 42, companyName: null, credential: { name: 'Pine Labs SIT' } }]])
        )
        const res = buildRes()

        await listTransactions(req(), res, jest.fn())

        expect(payload(res).rows[0].corporateName).toBe('Pine Labs SIT')
    })

    it('falls back to the contact person when neither companyName nor credential name is set', async () => {
        getCorporatesByIds.mockResolvedValue(
            new Map([
                ['42', { id: 42, companyName: null, contactPersonName: 'nannu', credential: { name: '' } }],
            ])
        )
        const res = buildRes()

        await listTransactions(req(), res, jest.fn())

        expect(payload(res).rows[0].corporateName).toBe('nannu')
    })

    it('reads the cardholder off the card when the transaction carries no identity of its own', async () => {
        listAllTransactions.mockResolvedValue({
            count: 1,
            rows: [row({ userId: null, cardIssuance: { id: 7, maskedCardNumber: '608363******3657', userId: 77 } })],
        })
        const res = buildRes()

        await listTransactions(req(), res, jest.fn())

        expect(getCardholdersByIdentities).toHaveBeenCalledWith([{ userId: 77 }], expect.anything())
        expect(payload(res).rows[0].cardholderName).toBe('Aarav Sharma')
    })

    it('names the cardholder from the card when no identity survives to look up', async () => {
        listAllTransactions.mockResolvedValue({
            count: 1,
            rows: [
                row({
                    userId: null,
                    cardIssuance: {
                        id: 7,
                        maskedCardNumber: '608363******3657',
                        userId: null,
                        nameOnCard: 'Rakshita',
                    },
                }),
            ],
        })
        const res = buildRes()

        await listTransactions(req(), res, jest.fn())

        expect(payload(res).rows[0].cardholderName).toBe('Rakshita')
    })

    it('prefers the directory name over the one printed on the card', async () => {
        listAllTransactions.mockResolvedValue({
            count: 1,
            rows: [
                row({
                    cardIssuance: {
                        id: 7,
                        maskedCardNumber: '608363******3657',
                        nameOnCard: 'A SHARMA',
                    },
                }),
            ],
        })
        const res = buildRes()

        await listTransactions(req(), res, jest.fn())

        expect(payload(res).rows[0].cardholderName).toBe('Aarav Sharma')
    })

    it('leaves the cardholder unnamed when neither the transaction, its card nor the print name has one', async () => {
        listAllTransactions.mockResolvedValue({
            count: 1,
            rows: [
                row({
                    userId: null,
                    cardIssuance: {
                        id: 7,
                        maskedCardNumber: '608363******3657',
                        userId: null,
                        nameOnCard: null,
                    },
                }),
            ],
        })
        const res = buildRes()

        await listTransactions(req(), res, jest.fn())

        expect(payload(res).rows[0].cardholderName).toBeNull()
    })

    it('never includes the raw payloads in the list', async () => {
        const res = buildRes()

        await listTransactions(req(), res, jest.fn())

        expect(payload(res).rows[0].rawAuthPayload).toBeUndefined()
        expect(payload(res).rows[0].rawNotifyPayload).toBeUndefined()
    })

    it('passes every filter through to the query', async () => {
        await listTransactions(
            req({
                corporateId: '42',
                cardLast4: '3657',
                decision: 'declined',
                internalStatus: 'reversed',
                eventType: 'notify',
                transactionType: '23',
                category: 'Travel',
                dateFrom: '2026-09-01',
                dateTo: '2026-09-30',
                searchText: 'CC000005',
            }),
            buildRes(),
            jest.fn()
        )

        expect(listAllTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                corporateId: 42,
                cardLast4: '3657',
                decision: 'DECLINED',
                internalStatus: 'REVERSED',
                eventType: 'NOTIFY',
                transactionType: 23,
                category: 'Travel',
                dateFrom: '2026-09-01',
                dateTo: '2026-09-30',
                searchText: 'CC000005',
            })
        )
    })

    it('lists every corporate when none is named', async () => {
        await listTransactions(req(), buildRes(), jest.fn())

        expect(listAllTransactions).toHaveBeenCalledWith(
            expect.objectContaining({ corporateId: undefined })
        )
    })

    it.each([['decision', 'MAYBE'], ['internalStatus', 'GONE'], ['eventType', 'SETTLE']])(
        'refuses an unknown %s filter rather than returning everything',
        async (key, value) => {
            const next = jest.fn()

            await listTransactions(req({ [key]: value }), buildRes(), next)

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
            expect(listAllTransactions).not.toHaveBeenCalled()
        }
    )

    it('still renders the rows when the corporate directory is unreachable', async () => {
        getCorporatesByIds.mockRejectedValue(new Error('gateway down'))
        const res = buildRes()

        await listTransactions(req(), res, jest.fn())

        expect(payload(res).rows[0].corporateName).toBeNull()
        expect(payload(res).rows[0].displayId).toBe('CC000005')
    })
})

describe('getTransaction', () => {
    it('returns both raw payloads for the view screen', async () => {
        findByIdWithPayloads.mockResolvedValue(
            row({ rawAuthPayload: AUTH_PAYLOAD, rawNotifyPayload: NOTIFY_PAYLOAD })
        )
        const res = buildRes()

        await getTransaction(req({}, { id: '5' }), res, jest.fn())

        expect(payload(res).transaction.rawAuthPayload).toEqual(AUTH_PAYLOAD)
        expect(payload(res).transaction.rawNotifyPayload).toEqual(NOTIFY_PAYLOAD)
    })

    it('reports a transaction that never received a NOTIFY as having no notify payload', async () => {
        findByIdWithPayloads.mockResolvedValue(row({ rawAuthPayload: AUTH_PAYLOAD, rawNotifyPayload: null }))
        const res = buildRes()

        await getTransaction(req({}, { id: '5' }), res, jest.fn())

        expect(payload(res).transaction.rawNotifyPayload).toBeNull()
    })

    it('404s for a transaction that does not exist', async () => {
        findByIdWithPayloads.mockResolvedValue(null)
        const next = jest.fn()

        await getTransaction(req({}, { id: '999' }), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }))
    })

    it.each([['abc'], ['0'], ['-1']])('refuses %p as a transaction id', async (id) => {
        const next = jest.fn()

        await getTransaction(req({}, { id }), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        expect(findByIdWithPayloads).not.toHaveBeenCalled()
    })
})

describe('listTransactionCorporates', () => {
    it('offers only corporates that have actually transacted', async () => {
        listTransactedCorporateIds.mockResolvedValue([42])
        const res = buildRes()

        await listTransactionCorporates(req(), res)

        expect(payload(res).corporates).toEqual([{ corporateId: 42, name: 'Acme Pvt Ltd' }])
    })

    it('returns an empty list rather than calling the directory when nothing has transacted', async () => {
        listTransactedCorporateIds.mockResolvedValue([])
        const res = buildRes()

        await listTransactionCorporates(req(), res)

        expect(payload(res).corporates).toEqual([])
        expect(getCorporatesByIds).not.toHaveBeenCalled()
    })

    it('falls back to the id so a corporate is never missing from the filter', async () => {
        listTransactedCorporateIds.mockResolvedValue([42])
        getCorporatesByIds.mockRejectedValue(new Error('gateway down'))
        const res = buildRes()

        await listTransactionCorporates(req(), res)

        expect(payload(res).corporates).toEqual([{ corporateId: 42, name: 'Corporate #42' }])
    })
})
