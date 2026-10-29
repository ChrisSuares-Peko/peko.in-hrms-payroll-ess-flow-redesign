const cardTxnUC = require('../../../models/use-cases/cardTransaction')
const cardIssuanceUC = require('../../../models/use-cases/cardIssuance')
const cardRequestUC = require('../../../models/use-cases/cardRequest')
const cardUserUC = require('../../../models/use-cases/cardUser')
const { getDashboardSummary } = require('../cardDashboard')

jest.mock('../../../models/use-cases/cardTransaction', () => ({
    getMonthlySummary: jest.fn(),
    getSpendByCard: jest.fn(),
    getSpendByCategory: jest.fn(),
    getDailySpend: jest.fn(),
    listTransactions: jest.fn(),
    findById: jest.fn(),
    setAdminApproval: jest.fn(),
}))
jest.mock('../../../models/use-cases/cardIssuance', () => ({ findCardsByScope: jest.fn() }))
jest.mock('../../../models/use-cases/cardRequest', () => ({
    countPending: jest.fn(),
    findTerminationStatusByCardIds: jest.fn(),
}))
jest.mock('../../../models/use-cases/cardUser', () => ({ getKycSummary: jest.fn(), findCardholderById: jest.fn() }))

const { getCardholdersByIdentities } = require('../../../utils/sharedDirectory')
jest.mock('../../../utils/sharedDirectory', () => ({ getCardholdersByIdentities: jest.fn() }))
beforeEach(() => {
    getCardholdersByIdentities.mockResolvedValue(new Map([['11', { id: '11', name: 'Aarav Sharma' }]]))
})

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const RECENT_KEYS = ['amount', 'date', 'id', 'member', 'merchant', 'status']

const recentRows = () => ([
    { id: 6, merchantName: 'Amazon', userId: '11', createdAt: '2026-07-06T10:00:00.000Z', transactionAmount: '2000.50', decision: 'AUTHORIZED', status: 'NOTIFIED' },
    { id: 5, merchantName: null, createdAt: '2026-07-05T10:00:00.000Z', transactionAmount: '10', decision: 'DECLINED', status: 'AUTH_RECEIVED' },
])

const primeHappyPath = () => {
    cardIssuanceUC.findCardsByScope.mockResolvedValue([])
    cardTxnUC.getMonthlySummary.mockResolvedValue({ amountSpent: 0, transactionCount: 0 })
    cardTxnUC.getSpendByCard.mockResolvedValue(new Map())
    cardTxnUC.getSpendByCategory.mockResolvedValue([])
    cardTxnUC.getDailySpend.mockResolvedValue([])
    cardRequestUC.countPending.mockResolvedValue(0)
    cardRequestUC.findTerminationStatusByCardIds.mockResolvedValue(new Map())
    cardUserUC.getKycSummary.mockResolvedValue({ verified: 0, total: 0, pending: 0 })
    cardTxnUC.listTransactions.mockResolvedValue({ count: 8, rows: recentRows() })
}

describe('getDashboardSummary — recentTransactions', () => {
    beforeEach(() => jest.clearAllMocks())

    it('requests only the latest 6 transactions, scoped to the caller (month-independent)', async () => {
        primeHappyPath()
        const req = { user: { role: 'USER', corporateId: 42, employeeProfileId: '99' , serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }]}, query: {} }

        await getDashboardSummary(req, buildRes(), jest.fn())

        expect(cardTxnUC.listTransactions).toHaveBeenCalledWith({ corporateId: 42, cardholder: { userId: '99' }, limit: 6, offset: 0 })
        const arg = cardTxnUC.listTransactions.mock.calls[0][0]
        expect(arg).not.toHaveProperty('monthStart')
        expect(arg).not.toHaveProperty('decision')
    })

    it('returns each recent transaction trimmed to exactly the panel fields', async () => {
        primeHappyPath()
        const req = { user: { role: 'USER', corporateId: 42, employeeProfileId: '99' , serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }]}, query: {} }
        const res = buildRes()

        await getDashboardSummary(req, res, jest.fn())

        const { recentTransactions } = res.json.mock.calls[0][0].data
        expect(recentTransactions).toHaveLength(2)
        expect(Object.keys(recentTransactions[0]).sort()).toEqual(RECENT_KEYS)
        expect(recentTransactions[0]).toEqual({
            id: 6,
            merchant: 'Amazon',
            member: 'Aarav Sharma',
            date: '2026-07-06T10:00:00.000Z',
            amount: 2000.5,
            status: 'Completed',
        })
    })

    it('degrades a missing merchant to "" and a missing cardholder to null (FE-safe)', async () => {
        primeHappyPath()
        const req = { user: { role: 'USER', corporateId: 42, employeeProfileId: '99' , serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }]}, query: {} }
        const res = buildRes()

        await getDashboardSummary(req, res, jest.fn())

        const { recentTransactions } = res.json.mock.calls[0][0].data
        expect(recentTransactions[1]).toMatchObject({ id: 5, merchant: '', member: null, amount: 10, status: 'Declined' })
    })

    it('includes recentTransactions for an admin scope too', async () => {
        primeHappyPath()
        const req = { user: { role: 'CORPORATE', corporateId: 42 }, query: {} }
        const res = buildRes()

        await getDashboardSummary(req, res, jest.fn())

        expect(cardTxnUC.listTransactions).toHaveBeenCalledWith({ corporateId: 42, cardholder: undefined, limit: 6, offset: 0 })
        expect(res.json.mock.calls[0][0].data.recentTransactions).toHaveLength(2)
    })
})

// Deciding whether the account holder counts as a member moved here from getKycSummary, which used to
// derive it from req via actsAsOwner — an import that closed a require cycle and made the whole KPI throw.
describe('getDashboardSummary — the verified-members KPI', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        primeHappyPath()
    })

    const kycArgs = () => cardUserUC.getKycSummary.mock.calls[0][0]

    it('counts the account holder for the account holder, matching the People table', async () => {
        const req = { user: { role: 'CORPORATE', corporateId: 42 }, query: {} }

        await getDashboardSummary(req, buildRes(), jest.fn())

        expect(kycArgs()).toEqual(expect.objectContaining({ corporateId: 42, includeOwner: true }))
    })

    it('does not count the account holder for a sub-corporate Admin', async () => {
        const req = {
            user: { role: 'USER', corporateId: 42, employeeProfileId: '77', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }] },
            query: {},
        }

        await getDashboardSummary(req, buildRes(), jest.fn())

        expect(kycArgs()).toEqual(expect.objectContaining({ includeOwner: false }))
    })

    // The KPI belongs to the admin view. An employee — including the account holder on their Employee
    // account — sees their own cards, not a corporate-wide count.
    it('does not compute the KPI for an employee session', async () => {
        const req = {
            user: {
                role: 'USER',
                corporateId: 42,
                employeeProfileId: '99',
                serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }],
            },
            query: {},
        }

        await getDashboardSummary(req, buildRes(), jest.fn())

        expect(cardUserUC.getKycSummary).not.toHaveBeenCalled()
    })

    it('reports the summary as the verifiedMembers KPI', async () => {
        cardUserUC.getKycSummary.mockResolvedValue({ verified: 2, total: 3, pending: 1 })
        const res = buildRes()

        await getDashboardSummary({ user: { role: 'CORPORATE', corporateId: 42 }, query: {} }, res, jest.fn())

        const { kpis } = res.json.mock.calls[0][0].data
        expect(kpis.verifiedMembers).toEqual({ verified: 2, total: 3 })
        expect(kpis.pendingKyc).toBe(1)
    })

    // A failed KPI must be ABSENT, not zero: the client renders absence as unknown, and 0/0 was
    // indistinguishable from a corporate with no members.
    it('omits the KPI entirely when the summary fails, rather than reporting zeros', async () => {
        cardUserUC.getKycSummary.mockRejectedValue(new Error('actsAsOwner is not a function'))
        const res = buildRes()

        await getDashboardSummary({ user: { role: 'CORPORATE', corporateId: 42 }, query: {} }, res, jest.fn())

        const { kpis } = res.json.mock.calls[0][0].data
        expect(kpis).not.toHaveProperty('verifiedMembers')
        expect(kpis).not.toHaveProperty('pendingKyc')
        expect(res.status).toHaveBeenCalledWith(200)
    })
})

// The "Spent this period ... of X limit" tile. A card pending termination is still ISSUED — the terminate
// flow only freezes it — so an unfiltered sum counted headroom the corporate can no longer spend, and
// disagreed with the wallet's "Card Limit – Shared Across All Cards", which excludes them.
describe('getDashboardSummary — totalCardLimits', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        primeHappyPath()
    })

    const adminReq = () => ({ user: { role: 'CORPORATE', corporateId: 42 }, query: {} })
    const issuedCard = (id, cardLimit, over = {}) => ({
        id, status: 'ISSUED', cardState: 'ACTIVE', cardLimit, maskedCardNumber: `6083******${id}`, ...over,
    })
    const limitOf = (res) => res.json.mock.calls[0][0].data.kpis.totalCardLimits

    it('sums the limits of cards with no termination in flight', async () => {
        cardIssuanceUC.findCardsByScope.mockResolvedValue([issuedCard(1, '20000'), issuedCard(2, '31000')])
        const res = buildRes()

        await getDashboardSummary(adminReq(), res, jest.fn())

        expect(limitOf(res)).toBe(51000)
    })

    it('leaves a termination-requested card out of the total', async () => {
        cardIssuanceUC.findCardsByScope.mockResolvedValue([issuedCard(1, '20000'), issuedCard(2, '31000')])
        cardRequestUC.findTerminationStatusByCardIds.mockResolvedValue(new Map([['2', 'REQUESTED']]))
        const res = buildRes()

        await getDashboardSummary(adminReq(), res, jest.fn())

        expect(limitOf(res)).toBe(20000)
    })

    // An APPROVED terminate request is the case the obvious helper (findActiveTerminateCardIds, which only
    // covers PENDING/PROCESSING) would have missed, leaving this figure still disagreeing with the wallet.
    it('leaves an approved-but-not-yet-completed termination out too', async () => {
        cardIssuanceUC.findCardsByScope.mockResolvedValue([issuedCard(1, '20000'), issuedCard(2, '31000')])
        cardRequestUC.findTerminationStatusByCardIds.mockResolvedValue(new Map([['2', 'COMPLETED']]))
        const res = buildRes()

        await getDashboardSummary(adminReq(), res, jest.fn())

        expect(limitOf(res)).toBe(20000)
    })

    it('reports zero when every card is on its way out', async () => {
        cardIssuanceUC.findCardsByScope.mockResolvedValue([issuedCard(1, '20000')])
        cardRequestUC.findTerminationStatusByCardIds.mockResolvedValue(new Map([['1', 'REQUESTED']]))
        const res = buildRes()

        await getDashboardSummary(adminReq(), res, jest.fn())

        expect(limitOf(res)).toBe(0)
    })

    // Frozen-but-not-terminating still counts: the limit is suspended, not withdrawn, and unfreezing
    // restores it. This mirrors sumCardLimits, which also excludes only terminations.
    it('still counts a plain frozen card', async () => {
        cardIssuanceUC.findCardsByScope.mockResolvedValue([issuedCard(1, '20000', { cardState: 'FROZEN' })])
        const res = buildRes()

        await getDashboardSummary(adminReq(), res, jest.fn())

        expect(limitOf(res)).toBe(20000)
    })

    it('asks only about the cards in scope, so a cardholder total cannot include the corporate', async () => {
        cardIssuanceUC.findCardsByScope.mockResolvedValue([issuedCard(1, '20000')])

        await getDashboardSummary(
            {
                user: {
                    role: 'USER',
                    corporateId: 42,
                    employeeProfileId: '99',
                    serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }],
                },
                query: {},
            },
            buildRes(),
            jest.fn()
        )

        expect(cardRequestUC.findTerminationStatusByCardIds).toHaveBeenCalledWith(['1'])
    })

    it('ignores non-issued cards entirely, as before', async () => {
        cardIssuanceUC.findCardsByScope.mockResolvedValue([
            issuedCard(1, '20000'),
            { id: 3, status: 'PENDING', cardLimit: '99000' },
            { id: 4, status: 'FAILED', cardLimit: '99000' },
        ])
        const res = buildRes()

        await getDashboardSummary(adminReq(), res, jest.fn())

        expect(limitOf(res)).toBe(20000)
        expect(cardRequestUC.findTerminationStatusByCardIds).toHaveBeenCalledWith(['1'])
    })
})
