jest.mock('../../../models/use-cases/corporateCardAdminApplication', () => ({ findByCorporate: jest.fn() }))
jest.mock('../../../models/use-cases/cardIssuance', () => ({
    findCardsByScope: jest.fn(),
    findAndCountPhysicalTracking: jest.fn(),
    sumCardLimits: jest.fn(),
}))
jest.mock('../../../models/use-cases/cardRequest', () => ({
    findTerminationStatusByCardIds: jest.fn(),
    findAndCountForQueue: jest.fn(),
}))
jest.mock('../../../models/use-cases/cardAuditLog', () => ({
    findByCorporate: jest.fn(),
    findLatestByCardsAndAction: jest.fn(),
}))
jest.mock('../../../models/use-cases/cardholderKyc', () => ({ findForCorporateLookup: jest.fn() }))
jest.mock('../../../models/use-cases/corporateCardLedger', () => ({ findAndCountByCorporate: jest.fn() }))
jest.mock('../../../services/walletBalance', () => ({ walletBalanceParts: jest.fn() }))
jest.mock('../../../models/use-cases/cardTransaction', () => ({ listAllTransactions: jest.fn() }))
jest.mock('../../../utils/sharedDirectory', () => ({
    getCorporatesByIds: jest.fn(),
    findAndCountCorporateCardUsers: jest.fn(),
    getCorporateCardUsersByIds: jest.fn(),
}))
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))

const {
    getCorporateLookup,
    listLookupActivity,
    listLookupRequests,
    listLookupTopUps,
    listLookupDispatches,
} = require('../corporateCardLookup')
const { findByCorporate: findApplication } = require('../../../models/use-cases/corporateCardAdminApplication')
const { findCardsByScope, findAndCountPhysicalTracking, sumCardLimits } = require('../../../models/use-cases/cardIssuance')
const { findTerminationStatusByCardIds, findAndCountForQueue } = require('../../../models/use-cases/cardRequest')
const { findByCorporate: findAudit, findLatestByCardsAndAction } = require('../../../models/use-cases/cardAuditLog')
const { findForCorporateLookup } = require('../../../models/use-cases/cardholderKyc')
const { findAndCountByCorporate: findLedger } = require('../../../models/use-cases/corporateCardLedger')
const { walletBalanceParts } = require('../../../services/walletBalance')
const { listAllTransactions } = require('../../../models/use-cases/cardTransaction')
const {
    getCorporatesByIds,
    findAndCountCorporateCardUsers,
    getCorporateCardUsersByIds,
} = require('../../../utils/sharedDirectory')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}
const payload = (res) => res.json.mock.calls[0][0].data
const req = (params = {}, query = {}) => ({ params, query, LogTraceId: 't' })

const card = (overrides = {}) => ({
    id: 7,
    corporateId: 42,
    userId: 77,
    cardType: 'Virtual',
    status: 'ISSUED',
    cardState: 'ACTIVE',
    maskedCardNumber: '608363******3657',
    cardLimit: '5000.00',
    perTxnLimit: '1000.00',
    limitFrequency: 'monthly',
    createdAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
})

const OWNER = { id: 1, name: 'Owner', email: 'o@acme.in', mobileNo: '9000000001', role: 'Employee', status: 'ACTIVE', isAccountOwner: 1, createdAt: '2026-01-01' }
const EMPLOYEE = { id: 77, name: 'Aarav', email: 'a@acme.in', mobileNo: '9000000077', role: 'Employee', status: 'ACTIVE', isAccountOwner: 0, createdAt: '2026-02-01' }

const primeOverview = () => {
    findApplication.mockResolvedValue({
        corporateId: 42,
        kybStatus: 'REJECTED',
        kybReference: 'KYB1',
        metadata: { rejectionReason: 'GST certificate is illegible' },
        svcCardNumber: '1234567890123456',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-05',
    })
    getCorporatesByIds.mockResolvedValue(new Map([['42', { id: 42, companyName: 'Acme Pvt Ltd', credential: { username: 'PEKO42' } }]]))
    findAndCountCorporateCardUsers.mockResolvedValue({ count: 2, rows: [OWNER, EMPLOYEE] })
    findCardsByScope.mockResolvedValue([
        card(),
        card({ id: 8, cardType: 'Physical', status: 'ISSUED', dispatches: [{ awbNumber: 'AWB123', courierPartnerName: 'BlueDart' }] }),
        card({ id: 9, status: 'FAILED', reconcileLastError: null }),
        card({ id: 10, userId: 99 }),
    ])
    walletBalanceParts.mockResolvedValue({ ledger: { in: 10000, out: 0 }, spendTotal: 2500, balance: 7500 })
    sumCardLimits.mockResolvedValue({ total: 15000, count: 3 })
    findTerminationStatusByCardIds.mockResolvedValue(new Map())
    findLatestByCardsAndAction.mockResolvedValue(new Map([['9', { description: 'The card could not be issued by the vendor.', metadata: { responseCode: 91 } }]]))
    getCorporateCardUsersByIds.mockResolvedValue(new Map([['99', { id: 99, name: 'Departed', mobileNo: '9000000099' }]]))
    findAudit.mockResolvedValue({ count: 12, rows: [] })
    findAndCountForQueue.mockResolvedValue({ count: 3, rows: [] })
    findLedger.mockResolvedValue({ count: 4, rows: [] })
    listAllTransactions.mockResolvedValue({ count: 25, rows: [] })
    findForCorporateLookup.mockResolvedValue([
        { mobileNumber: '9000000077', kycStatus: 'REJECTED', reason: 'Face match failed', userId: 77, updatedAt: '2026-03-01' },
    ])
}

beforeEach(() => {
    jest.clearAllMocks()
})

describe('getCorporateLookup', () => {
    it('rejects a malformed corporate id', async () => {
        const next = jest.fn()
        await getCorporateLookup(req({ corporateId: 'abc' }), buildRes(), next)
        expect(next.mock.calls[0][0].status_code).toBe(400)
    })

    it('404s a corporate that never applied for corporate cards', async () => {
        findApplication.mockResolvedValue(null)
        const next = jest.fn()
        await getCorporateLookup(req({ corporateId: '42' }), buildRes(), next)
        expect(next.mock.calls[0][0].status_code).toBe(404)
    })

    it('returns profile, KYB with its rejection reason, and wallet totals', async () => {
        primeOverview()
        const res = buildRes()
        await getCorporateLookup(req({ corporateId: '42' }), res, jest.fn())
        const data = payload(res)

        expect(data.profile).toMatchObject({ corporateId: 42, companyName: 'Acme Pvt Ltd', accountId: 'PEKO42' })
        expect(data.kyb).toMatchObject({ status: 'REJECTED', rejectionReason: 'GST certificate is illegible' })
        expect(data.wallet).toMatchObject({ balance: 7500, totalCredited: 10000, totalSpent: 2500, totalCardLimits: 15000, svcCardNumberLast4: '3456' })
    })

    it('treats the account holder as an Admin and attaches each member\'s KYC and cards', async () => {
        primeOverview()
        const res = buildRes()
        await getCorporateLookup(req({ corporateId: '42' }), res, jest.fn())
        const { members, stats } = payload(res)

        const owner = members.find((m) => m.id === '1')
        const employee = members.find((m) => m.id === '77')
        expect(owner.role).toBe('Admin')
        expect(owner.kyc).toBeNull()
        expect(employee.kyc).toEqual({ status: 'REJECTED', reason: 'Face match failed', updatedAt: '2026-03-01' })
        expect(employee.cards.map((c) => c.id)).toEqual([7, 8, 9])
        expect(stats).toMatchObject({
            admins: 1, employees: 1, cards: 3, pendingCards: 0, failedCards: 1, activityCount: 12, requestCount: 3, topUpCount: 4, transactionCount: 25,
        })
    })

    it('reports last four digits, limits, activation, and the AWB of a physical card', async () => {
        primeOverview()
        const res = buildRes()
        await getCorporateLookup(req({ corporateId: '42' }), res, jest.fn())
        const cards = payload(res).members.find((m) => m.id === '77').cards

        expect(cards[0]).toMatchObject({ last4: '3657', cardLimit: 5000, perTxnLimit: 1000, activationStatus: 'Activated', deliveryStatus: null })
        expect(cards[1]).toMatchObject({ type: 'Physical', awbNumber: 'AWB123', courierPartnerName: 'BlueDart', deliveryStatus: 'In transit' })
        expect(cards[2]).toMatchObject({ activationStatus: 'Failed', failureReason: 'The card could not be issued by the vendor. (issuer code 91)' })
    })

    it('keeps cards of removed employees, flagged as removed', async () => {
        primeOverview()
        const res = buildRes()
        await getCorporateLookup(req({ corporateId: '42' }), res, jest.fn())
        const removed = payload(res).members.find((m) => m.id === '99')

        expect(getCorporateCardUsersByIds).toHaveBeenCalledWith(['99'], 42, expect.anything())
        expect(removed).toMatchObject({ name: 'Departed', status: 'REMOVED' })
        expect(removed.cards.map((c) => c.id)).toEqual([10])
    })

    it('still answers when the member directory is down, and says so', async () => {
        primeOverview()
        findAndCountCorporateCardUsers.mockRejectedValue(new Error('gateway down'))
        getCorporateCardUsersByIds.mockRejectedValue(new Error('gateway down'))
        const res = buildRes()
        await getCorporateLookup(req({ corporateId: '42' }), res, jest.fn())
        const data = payload(res)

        expect(data.membersUnavailable).toBe(true)
        expect(data.members.every((m) => m.status === 'REMOVED')).toBe(true)
        expect(data.stats.cards).toBe(3)
    })

    it('marks the list as capped when the corporate has more members than one read returns', async () => {
        primeOverview()
        findAndCountCorporateCardUsers.mockResolvedValue({ count: 5000, rows: [OWNER, EMPLOYEE] })
        const res = buildRes()
        await getCorporateLookup(req({ corporateId: '42' }), res, jest.fn())
        expect(payload(res).membersCapped).toBe(true)
    })

    it('counts only activated cards, reporting pending and failed attempts separately', async () => {
        primeOverview()
        findCardsByScope.mockResolvedValue([
            card(),
            card({ id: 8, cardType: 'Physical', cardState: 'FROZEN' }),
            card({ id: 9, status: 'FAILED' }),
            card({ id: 11, cardType: 'Physical', status: 'FAILED' }),
            card({ id: 12, status: 'PENDING' }),
        ])
        const res = buildRes()
        await getCorporateLookup(req({ corporateId: '42' }), res, jest.fn())

        expect(payload(res).stats).toMatchObject({
            cards: 2,
            cardsByType: { Virtual: 1, Physical: 1 },
            frozenCards: 1,
            pendingCards: 1,
            failedCards: 2,
        })
    })
})

describe('listLookupActivity', () => {
    it('pages the audit log and flags failed actions with their issuer code', async () => {
        findAudit.mockResolvedValue({
            count: 2,
            rows: [
                { id: 2, userId: 77, action: 'CARD_FREEZE_FAILED', title: 'Card freeze failed', description: 'Card ending 3657 could not be frozen: Card not found', metadata: { responseCode: 12 }, createdAt: 'x' },
                { id: 1, userId: null, action: 'CARD_FROZEN', title: 'Card frozen', createdAt: 'y' },
            ],
        })
        getCorporateCardUsersByIds.mockResolvedValue(new Map([['77', { id: 77, name: 'Aarav' }]]))
        const res = buildRes()
        await listLookupActivity(req({ corporateId: '42' }, { page: '2', itemsPerPage: '10' }), res, jest.fn())

        expect(findAudit).toHaveBeenCalledWith({ corporateId: 42, category: undefined, limit: 10, offset: 10 })
        const { count, rows } = payload(res)
        expect(count).toBe(2)
        expect(rows[0]).toMatchObject({ isFailure: true, responseCode: 12, cardholderName: 'Aarav' })
        expect(rows[1]).toMatchObject({ isFailure: false, cardholderName: null })
    })
})

describe('listLookupRequests', () => {
    it('rejects an unknown request type', async () => {
        const next = jest.fn()
        await listLookupRequests(req({ corporateId: '42' }, { requestType: 'NOPE' }), buildRes(), next)
        expect(next.mock.calls[0][0].status_code).toBe(400)
    })

    it('returns each request with its outcome and decision note', async () => {
        findAndCountForQueue.mockResolvedValue({
            count: 1,
            rows: [{ id: 3, userId: 77, requestType: 'UNFREEZE', status: 'REJECTED', decisionNote: 'Card reported stolen', card: { maskedCardNumber: '****3657' }, createdAt: 'x' }],
        })
        getCorporateCardUsersByIds.mockResolvedValue(new Map([['77', { id: 77, name: 'Aarav' }]]))
        const res = buildRes()
        await listLookupRequests(req({ corporateId: '42' }, { requestType: 'unfreeze' }), res, jest.fn())

        expect(findAndCountForQueue).toHaveBeenCalledWith(expect.objectContaining({ corporateId: 42, requestType: 'UNFREEZE' }))
        expect(payload(res).rows[0]).toMatchObject({ status: 'REJECTED', decisionNote: 'Card reported stolen', cardLast4: '3657', cardholderName: 'Aarav' })
    })
})

describe('listLookupTopUps', () => {
    it('lists only money that came into the wallet', async () => {
        findLedger.mockResolvedValue({ count: 1, rows: [{ id: 4, occurredAt: 'x', entryType: 'TOPUP', reference: 'UTR1', amount: '2500.00' }] })
        const res = buildRes()
        await listLookupTopUps(req({ corporateId: '42' }), res, jest.fn())

        expect(findLedger).toHaveBeenCalledWith(expect.objectContaining({ corporateId: 42, direction: 'IN', entryTypes: ['TOPUP', 'REFUND', 'CASHBACK'] }))
        expect(payload(res).rows[0]).toMatchObject({ method: 'Top-up', reference: 'UTR1', amount: 2500 })
    })
})

describe('listLookupDispatches', () => {
    it('returns physical orders with their AWB numbers and holder names', async () => {
        findAndCountPhysicalTracking.mockResolvedValue({
            count: 1,
            rows: [card({ id: 8, cardType: 'Physical', dispatches: [{ awbNumber: 'AWB123', courierPartnerName: 'BlueDart' }] })],
        })
        getCorporateCardUsersByIds.mockResolvedValue(new Map([['77', { id: 77, name: 'Aarav' }]]))
        const res = buildRes()
        await listLookupDispatches(req({ corporateId: '42' }), res, jest.fn())
        const row = payload(res).rows[0]

        expect(row).toMatchObject({ holder: 'Aarav', last4: '3657', status: 'Issued' })
        expect(row.dispatches[0]).toMatchObject({ awbNumber: 'AWB123', courierPartnerName: 'BlueDart' })
    })
})
