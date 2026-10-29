const { Op } = require('sequelize')
const cardholderKyc = require('../../entities/cardholderKyc')
const cardIssuance = require('../../entities/cardIssuance')
const sharedDirectory = require('../../../utils/sharedDirectory')
const { findByMobiles } = require('../cardholderKyc')
const { customLog } = require('../../../utils/loggerHelper')
const {
    findAndCountCardUsers,
    findKycByUserIds,
    findIssuanceByUserIds,
    findCardUserScoped,
} = require('../cardUser')

jest.mock('../../../utils/sharedDirectory', () => ({
    findAndCountCardUsers: jest.fn(),
    findCardUserScoped: jest.fn(),
    listCardUserIds: jest.fn(),
    listCardUserIdentities: jest.fn(),
    findCardholderById: jest.fn(),
}))
jest.mock('../../entities/cardholderKyc', () => ({ findAll: jest.fn() }))
jest.mock('../cardholderKyc', () => ({ findByMobiles: jest.fn() }))
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../entities/cardIssuance', () => ({ findAll: jest.fn() }))

describe('findAndCountCardUsers', () => {
    beforeEach(() => jest.clearAllMocks())

    it('delegates the member page to the shared directory with the exact filters + request context', async () => {
        const page = { count: 1, rows: [{ id: '99', name: 'Aarav' }] }
        const req = { LogTraceId: 'trace-1' }
        sharedDirectory.findAndCountCardUsers.mockResolvedValue(page)

        const result = await findAndCountCardUsers({ status: 'ACTIVE', searchText: 'aarav', limit: 10, offset: 0, req })

        expect(sharedDirectory.findAndCountCardUsers).toHaveBeenCalledWith({
            status: 'ACTIVE', searchText: 'aarav', includeOwner: false, limit: 10, offset: 0, req,
        })
        expect(result).toBe(page)
    })

    it.each([
        ['no filter', undefined],
        ['a status filter', 'COMPLETED'],
        ['the derived NOT_STARTED filter', 'NOT_STARTED'],
    ])('carries includeOwner through the %s branch', async (_label, kycStatus) => {
        sharedDirectory.findAndCountCardUsers.mockResolvedValue({ count: 0, rows: [] })
        sharedDirectory.listCardUserIdentities.mockResolvedValue([{ id: '99', mobileNo: '9876543210' }])
        // The member has to actually match the filter under test, or the branch short-circuits before the
        // directory is reached and the assertion below measures nothing.
        const stored = kycStatus === 'NOT_STARTED' ? [] : [{ userId: '99', kycStatus }]
        cardholderKyc.findAll.mockResolvedValue(stored)
        findByMobiles.mockResolvedValue([])

        await findAndCountCardUsers({ corporateId: 42, kycStatus, includeOwner: true, limit: 10, offset: 0, req: {} })

        expect(sharedDirectory.findAndCountCardUsers).toHaveBeenCalledWith(
            expect.objectContaining({ includeOwner: true })
        )
    })

    // The member list the filter resolves KYC over has to be scoped the same way the page is, or an owner who
    // holds a card is filtered out of their own People screen.
    it('scopes the member list it resolves KYC over by includeOwner too', async () => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue([{ id: '99', mobileNo: '9876543210' }])
        cardholderKyc.findAll.mockResolvedValue([{ userId: '99', kycStatus: 'COMPLETED' }])
        findByMobiles.mockResolvedValue([])
        sharedDirectory.findAndCountCardUsers.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountCardUsers({ corporateId: 42, kycStatus: 'COMPLETED', includeOwner: true, limit: 10, offset: 0, req: {} })

        expect(sharedDirectory.listCardUserIdentities).toHaveBeenCalledWith(
            expect.objectContaining({ includeOwner: true })
        )
    })

    it('sends no id filter when kycStatus is not provided (plain delegation)', async () => {
        sharedDirectory.findAndCountCardUsers.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountCardUsers({ corporateId: 42, limit: 10, offset: 0, req: {} })

        const args = sharedDirectory.findAndCountCardUsers.mock.calls[0][0]
        expect(args.ids).toBeUndefined()
        expect(args.excludeIds).toBeUndefined()
        expect(sharedDirectory.listCardUserIdentities).not.toHaveBeenCalled()
        expect(cardholderKyc.findAll).not.toHaveBeenCalled()
    })

    it('filters by KYC resolved over the member list, id-keyed → directory ids filter', async () => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue([
            { id: '7', mobileNo: '9876543210' },
            { id: '8', mobileNo: '9876543211' },
        ])
        cardholderKyc.findAll.mockResolvedValue([
            { userId: '7', kycStatus: 'COMPLETED' },
            { userId: '8', kycStatus: 'PENDING' },
        ])
        findByMobiles.mockResolvedValue([])
        sharedDirectory.findAndCountCardUsers.mockResolvedValue({ count: 1, rows: [{ id: 7 }] })
        const req = { LogTraceId: 'trace-1' }

        const result = await findAndCountCardUsers({ corporateId: 42, kycStatus: 'COMPLETED', limit: 10, offset: 0, req })

        expect(sharedDirectory.findAndCountCardUsers).toHaveBeenCalledWith(
            expect.objectContaining({ ids: ['7'], limit: 10, offset: 0, req })
        )
        expect(result).toEqual({ count: 1, rows: [{ id: 7 }] })
    })

    /**
     * The vendor's KYC callback identifies a person by handset alone — it knows neither the corporate nor the
     * employee — so a row it creates before any session write carries userId NULL. Filtering on that column
     * returned nobody while the same screen's KYC column, which resolves by mobile, showed them Completed.
     */
    it('matches a member whose KYC row was filed by the vendor callback with no userId', async () => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue([{ id: '7', mobileNo: '9876543210' }])
        cardholderKyc.findAll.mockResolvedValue([])
        findByMobiles.mockResolvedValue([{ mobileNumber: '9876543210', kycStatus: 'COMPLETED', userId: null }])
        sharedDirectory.findAndCountCardUsers.mockResolvedValue({ count: 1, rows: [{ id: 7 }] })

        await findAndCountCardUsers({ corporateId: 42, kycStatus: 'COMPLETED', limit: 10, offset: 0, req: {} })

        expect(sharedDirectory.findAndCountCardUsers).toHaveBeenCalledWith(
            expect.objectContaining({ ids: ['7'] })
        )
    })

    // Mobile wins over the id-keyed row, exactly as the People table resolves it.
    it('prefers the handset row when the two disagree', async () => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue([{ id: '7', mobileNo: '9876543210' }])
        cardholderKyc.findAll.mockResolvedValue([{ userId: '7', kycStatus: 'PENDING' }])
        findByMobiles.mockResolvedValue([{ mobileNumber: '9876543210', kycStatus: 'COMPLETED', userId: null }])
        sharedDirectory.findAndCountCardUsers.mockResolvedValue({ count: 1, rows: [{ id: 7 }] })

        await findAndCountCardUsers({ corporateId: 42, kycStatus: 'COMPLETED', limit: 10, offset: 0, req: {} })

        expect(sharedDirectory.findAndCountCardUsers).toHaveBeenCalledWith(
            expect.objectContaining({ ids: ['7'] })
        )
    })

    it('returns an empty page without calling the directory when no member matches the kycStatus', async () => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue([{ id: '7', mobileNo: '9876543210' }])
        cardholderKyc.findAll.mockResolvedValue([{ userId: '7', kycStatus: 'PENDING' }])
        findByMobiles.mockResolvedValue([])

        const result = await findAndCountCardUsers({ corporateId: 42, kycStatus: 'COMPLETED', limit: 10, offset: 0, req: {} })

        expect(result).toEqual({ count: 0, rows: [] })
        expect(sharedDirectory.findAndCountCardUsers).not.toHaveBeenCalled()
    })

    it('treats NOT_STARTED as members the same resolution found no KYC for', async () => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue([
            { id: '7', mobileNo: '9876543210' },
            { id: '8', mobileNo: '9876543211' },
        ])
        cardholderKyc.findAll.mockResolvedValue([{ userId: '7', kycStatus: 'COMPLETED' }])
        findByMobiles.mockResolvedValue([])
        sharedDirectory.findAndCountCardUsers.mockResolvedValue({ count: 0, rows: [] })

        await findAndCountCardUsers({ corporateId: 42, kycStatus: 'NOT_STARTED', limit: 10, offset: 0, req: {} })

        expect(sharedDirectory.findAndCountCardUsers).toHaveBeenCalledWith(
            expect.objectContaining({ ids: ['8'] })
        )
    })
})

describe('findKycByUserIds', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns [] without querying when given no ids', async () => {
        const result = await findKycByUserIds([])

        expect(result).toEqual([])
        expect(cardholderKyc.findAll).not.toHaveBeenCalled()
    })

    it('fetches kycStatus for the ids in ascending id order (so newest wins keep-last)', async () => {
        const rows = [{ userId: 1, kycStatus: 'COMPLETED' }]
        cardholderKyc.findAll.mockResolvedValue(rows)

        const result = await findKycByUserIds([1, 2])

        expect(cardholderKyc.findAll).toHaveBeenCalledWith({
            where: { userId: { [Op.in]: [1, 2] } },
            attributes: ['userId', 'kycStatus'],
            order: [['id', 'ASC']],
            raw: true,
        })
        expect(result).toBe(rows)
    })
})

describe('findIssuanceByUserIds', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns [] without querying when given no ids', async () => {
        const result = await findIssuanceByUserIds([])

        expect(result).toEqual([])
        expect(cardIssuance.findAll).not.toHaveBeenCalled()
    })

    it('fetches status / cardState for the ids', async () => {
        const rows = [{ userId: 1, status: 'ISSUED', cardState: 'ACTIVE' }]
        cardIssuance.findAll.mockResolvedValue(rows)

        const result = await findIssuanceByUserIds([1, 2])

        expect(cardIssuance.findAll).toHaveBeenCalledWith({
            where: { userId: { [Op.in]: [1, 2] } },
            attributes: ['userId', 'status', 'cardState'],
            raw: true,
        })
        expect(result).toBe(rows)
    })

    it('pins the query to the corporate when a corporateId is given', async () => {
        cardIssuance.findAll.mockResolvedValue([])

        await findIssuanceByUserIds([1, 2], 77)

        expect(cardIssuance.findAll).toHaveBeenCalledWith({
            where: { userId: { [Op.in]: [1, 2] }, corporateId: 77 },
            attributes: ['userId', 'status', 'cardState'],
            raw: true,
        })
    })
})

describe('findCardUserScoped', () => {
    beforeEach(() => jest.clearAllMocks())

    it('delegates the session-scoped (authorization-sensitive) lookup to the shared directory', async () => {
        const row = { id: '99', name: 'Aarav', mobileNo: '9999999999' }
        const req = { LogTraceId: 'trace-1' }
        sharedDirectory.findCardUserScoped.mockResolvedValue(row)

        const result = await findCardUserScoped({ userId: 99, req })

        expect(sharedDirectory.findCardUserScoped).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 99, req })
        )
        expect(result).toBe(row)
    })

    /**
     * Callers holding a ROW pass its identity, not a bare id — both approval paths and the physical-card
     * issue do. Dropping it here resolved nothing for all three, and each reported "Cardholder not found",
     * which reads as a missing member rather than a lost argument.
     */
    it('forwards a row identity, not just a bare id', async () => {
        const row = { id: '900', name: 'Aarav' }
        sharedDirectory.findCardUserScoped.mockResolvedValue(row)

        const result = await findCardUserScoped({ cardholder: { userId: 900 }, req: {} })

        expect(sharedDirectory.findCardUserScoped).toHaveBeenCalledWith(
            expect.objectContaining({ cardholder: { userId: 900 } })
        )
        expect(result).toBe(row)
    })

    it('returns null when the member is outside the corporate or lacks the service', async () => {
        sharedDirectory.findCardUserScoped.mockResolvedValue(null)

        const result = await findCardUserScoped({ userId: 99, req: {} })

        expect(result).toBeNull()
    })
})

// getKycSummary now takes { corporateId, includeOwner } from its caller rather than deriving the owner
// rule from req — see cardUser.kycSummary.test.js for its behaviour, and cardDashboard.test.js for the
// controller passing actsAsOwner(req).

// NOT_STARTED used to be sent to the directory as an exclusion, so it was never subject to the id cap.
// Sending it positively would newly truncate a corporate with more than 500 unverified members.
describe('findAndCountCardUsers — the filter id cap', () => {
    const members = (n) => Array.from({ length: n }, (_, i) => ({ id: String(i + 1), mobileNo: null }))

    beforeEach(() => {
        jest.clearAllMocks()
        findByMobiles.mockResolvedValue([])
        sharedDirectory.findAndCountCardUsers.mockResolvedValue({ count: 0, rows: [] })
    })

    it('names the majority set by its complement rather than truncating it', async () => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue(members(600))
        // Two of the 600 are verified; the other 598 are NOT_STARTED.
        cardholderKyc.findAll.mockResolvedValue([
            { userId: '1', kycStatus: 'COMPLETED' },
            { userId: '2', kycStatus: 'COMPLETED' },
        ])

        await findAndCountCardUsers({ corporateId: 42, kycStatus: 'NOT_STARTED', limit: 10, offset: 0, req: {} })

        const args = sharedDirectory.findAndCountCardUsers.mock.calls[0][0]
        expect(args.ids).toBeUndefined()
        expect(args.excludeIds).toEqual(['1', '2'])
    })

    it('still truncates, and says so, when neither side fits', async () => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue(members(1200))
        cardholderKyc.findAll.mockResolvedValue(
            members(600).map((m) => ({ userId: m.id, kycStatus: 'COMPLETED' }))
        )

        await findAndCountCardUsers({ corporateId: 42, kycStatus: 'COMPLETED', limit: 10, offset: 0, req: {} })

        const args = sharedDirectory.findAndCountCardUsers.mock.calls[0][0]
        expect(args.ids).toHaveLength(500)
        expect(customLog).toHaveBeenCalledWith(
            undefined,
            'error',
            expect.objectContaining({ kycStatus: 'COMPLETED', total: 600 }),
            'CONSOLE'
        )
    })
})
