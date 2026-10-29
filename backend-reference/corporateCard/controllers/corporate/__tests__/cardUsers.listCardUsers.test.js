const { listCardUsers } = require('../cardUsers')
const {
    findAndCountCardUsers,
    findKycByUserIds,
    findKycByMobiles,
    findIssuanceByUserIds,
} = require('../../../models/use-cases/cardUser')

jest.mock('../../../models/use-cases/cardUser', () => ({
    findAndCountCardUsers: jest.fn(),
    findKycByUserIds: jest.fn().mockResolvedValue([]),
    findKycByMobiles: jest.fn(),
    findIssuanceByUserIds: jest.fn().mockResolvedValue([]),
}))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const adminReq = (overrides = {}) => ({
    user: { role: 'CORPORATE', corporateId: 42, id: 5 },
    query: {},
    ...overrides,
})

const subAdminReq = (overrides = {}) => ({
    user: {
        role: 'USER',
        corporateId: 42,
        id: 7,
        employeeProfileId: '77',
        serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }],
    },
    query: {},
    ...overrides,
})

const member = (id, name) => ({
    id,
    name,
    email: `${name}@example.com`,
    mobileNo: '9000000000',
    role: 'SUB_USER',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
})

const rowsOf = (res) => res.json.mock.calls[0][0].data.rows

describe('listCardUsers — cardCount', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findKycByUserIds.mockResolvedValue([])
        findKycByMobiles.mockResolvedValue([])
    })

    it('counts each member ISSUED cards and never contradicts cardStatus', async () => {
        findAndCountCardUsers.mockResolvedValue({
            count: 3,
            rows: [member(1, 'alice'), member(2, 'bob'), member(3, 'carol')],
        })
        findIssuanceByUserIds.mockResolvedValue([
            { userId: 1, status: 'ISSUED', cardState: 'ACTIVE' },
            { userId: 1, status: 'ISSUED', cardState: 'FROZEN' },
            { userId: 2, status: 'ISSUED', cardState: 'FROZEN' },
            { userId: 2, status: 'ISSUED', cardState: 'FROZEN' },
        ])

        const res = buildRes()
        await listCardUsers(adminReq(), res, jest.fn())

        expect(rowsOf(res).map((r) => [r.id, r.cardCount, r.cardStatus])).toEqual([
            [1, 2, 'ACTIVE'],
            [2, 2, 'INACTIVE'],
            [3, 0, 'NONE'],
        ])
    })

    it('excludes non-ISSUED issuances so a pending-only member reads 0 / No cards', async () => {
        findAndCountCardUsers.mockResolvedValue({ count: 1, rows: [member(9, 'dan')] })
        findIssuanceByUserIds.mockResolvedValue([
            { userId: 9, status: 'PENDING', cardState: 'ACTIVE' },
            { userId: 9, status: 'FAILED', cardState: 'ACTIVE' },
        ])

        const res = buildRes()
        await listCardUsers(adminReq(), res, jest.fn())

        expect(rowsOf(res)[0]).toMatchObject({ cardCount: 0, cardStatus: 'NONE' })
    })

    it('matches ids as strings so a BIGINT member id still counts', async () => {
        findAndCountCardUsers.mockResolvedValue({ count: 1, rows: [member('90071992547409', 'eve')] })
        findIssuanceByUserIds.mockResolvedValue([
            { userId: '90071992547409', status: 'ISSUED', cardState: 'ACTIVE' },
        ])

        const res = buildRes()
        await listCardUsers(adminReq(), res, jest.fn())

        expect(rowsOf(res)[0]).toMatchObject({ cardCount: 1, cardStatus: 'ACTIVE' })
    })

    it('scopes the issuance lookup to the session corporate, not the route', async () => {
        findAndCountCardUsers.mockResolvedValue({ count: 1, rows: [member(1, 'alice')] })
        findIssuanceByUserIds.mockResolvedValue([])

        await listCardUsers(adminReq({ params: { corporateId: '999' } }), buildRes(), jest.fn())

        expect(findIssuanceByUserIds).toHaveBeenCalledWith([1], 42)
    })

    it('does not query issuances for an empty page', async () => {
        findAndCountCardUsers.mockResolvedValue({ count: 0, rows: [] })
        findIssuanceByUserIds.mockResolvedValue([])

        const res = buildRes()
        await listCardUsers(adminReq(), res, jest.fn())

        expect(findIssuanceByUserIds).toHaveBeenCalledWith([], 42)
        expect(rowsOf(res)).toEqual([])
    })
})

describe('listCardUsers — the account owner', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findKycByUserIds.mockResolvedValue([])
        findKycByMobiles.mockResolvedValue([])
        findIssuanceByUserIds.mockResolvedValue([])
    })

    it('asks for the owner row, so the account holder is listed first', async () => {
        findAndCountCardUsers.mockResolvedValue({ count: 0, rows: [] })

        await listCardUsers(adminReq(), buildRes(), jest.fn())

        expect(findAndCountCardUsers).toHaveBeenCalledWith(expect.objectContaining({ includeOwner: true }))
    })

    it('withholds the owner row from a sub-corporate Admin', async () => {
        findAndCountCardUsers.mockResolvedValue({ count: 0, rows: [] })

        await listCardUsers(subAdminReq(), buildRes(), jest.fn())

        expect(findAndCountCardUsers).toHaveBeenCalledWith(
            expect.objectContaining({ includeOwner: false })
        )
    })

    it('leaves the reported count to the scoped query rather than adjusting it here', async () => {
        findAndCountCardUsers.mockResolvedValue({ count: 3, rows: [] })
        const res = buildRes()

        await listCardUsers(subAdminReq(), res, jest.fn())

        expect(res.json.mock.calls[0][0].data.count).toBe(3)
    })

    it('still lists the sub-corporate Admin own row', async () => {
        findAndCountCardUsers.mockResolvedValue({
            count: 1,
            rows: [{ ...member('77', 'priya'), isAccountOwner: 0 }],
        })
        const res = buildRes()

        await listCardUsers(subAdminReq(), res, jest.fn())

        expect(rowsOf(res).map((r) => r.id)).toEqual(['77'])
    })

    it('reports the owner as Admin whatever the row happens to store', async () => {
        findAndCountCardUsers.mockResolvedValue({
            count: 2,
            rows: [
                { ...member('500', 'asha'), role: 'Employee', isAccountOwner: 1 },
                { ...member('99', 'ravi'), role: 'Employee', isAccountOwner: 0 },
            ],
        })
        const res = buildRes()

        await listCardUsers(adminReq(), res, jest.fn())

        const [owner, plain] = rowsOf(res)
        expect(owner).toMatchObject({ id: '500', role: 'Admin', isAccountOwner: true })
        expect(plain).toMatchObject({ id: '99', role: 'Employee', isAccountOwner: false })
    })

    it('normalises the flag to a boolean, defaulting to false when absent', async () => {
        findAndCountCardUsers.mockResolvedValue({ count: 1, rows: [member('99', 'ravi')] })
        const res = buildRes()

        await listCardUsers(adminReq(), res, jest.fn())

        expect(rowsOf(res)[0].isAccountOwner).toBe(false)
    })
})

describe('listCardUsers — KYC resolved by mobile', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findKycByUserIds.mockResolvedValue([])
        findKycByMobiles.mockResolvedValue([])
        findIssuanceByUserIds.mockResolvedValue([])
    })

    it('asks for KYC by the page mobiles, scoped to the session corporate', async () => {
        findAndCountCardUsers.mockResolvedValue({
            count: 2,
            rows: [member('500', 'asha'), { ...member('99', 'ravi'), mobileNo: '9811111111' }],
        })

        await listCardUsers(adminReq(), buildRes(), jest.fn())

        expect(findKycByMobiles).toHaveBeenCalledWith(42, ['9000000000', '9811111111'])
    })

    it('reports the status held against the mobile even when the id carries none', async () => {
        findAndCountCardUsers.mockResolvedValue({ count: 1, rows: [member('500', 'asha')] })
        findKycByMobiles.mockResolvedValue([
            { mobileNumber: '9000000000', kycStatus: 'COMPLETED', userId: '99' },
        ])
        const res = buildRes()

        await listCardUsers(adminReq(), res, jest.fn())

        expect(rowsOf(res)[0].kycStatus).toBe('COMPLETED')
    })

    it('prefers the mobile answer over a staler one keyed by id', async () => {
        findAndCountCardUsers.mockResolvedValue({ count: 1, rows: [member('500', 'asha')] })
        findKycByUserIds.mockResolvedValue([{ userId: '500', kycStatus: 'PENDING' }])
        findKycByMobiles.mockResolvedValue([
            { mobileNumber: '9000000000', kycStatus: 'COMPLETED', userId: '500' },
        ])
        const res = buildRes()

        await listCardUsers(adminReq(), res, jest.fn())

        expect(rowsOf(res)[0].kycStatus).toBe('COMPLETED')
    })

    it('gives two rows sharing a mobile the same status', async () => {
        findAndCountCardUsers.mockResolvedValue({
            count: 2,
            rows: [member('500', 'asha'), member('99', 'asha-member')],
        })
        findKycByMobiles.mockResolvedValue([
            { mobileNumber: '9000000000', kycStatus: 'COMPLETED', userId: '99' },
        ])
        const res = buildRes()

        await listCardUsers(adminReq(), res, jest.fn())

        expect(rowsOf(res).map(r => r.kycStatus)).toEqual(['COMPLETED', 'COMPLETED'])
    })

    it('falls back to the id map when the row has no mobile', async () => {
        findAndCountCardUsers.mockResolvedValue({
            count: 1,
            rows: [{ ...member('500', 'asha'), mobileNo: null }],
        })
        findKycByUserIds.mockResolvedValue([{ userId: '500', kycStatus: 'PENDING' }])
        const res = buildRes()

        await listCardUsers(adminReq(), res, jest.fn())

        expect(rowsOf(res)[0].kycStatus).toBe('PENDING')
    })

    it('still reports NOT_STARTED when neither key resolves', async () => {
        findAndCountCardUsers.mockResolvedValue({ count: 1, rows: [member('500', 'asha')] })
        const res = buildRes()

        await listCardUsers(adminReq(), res, jest.fn())

        expect(rowsOf(res)[0].kycStatus).toBe('NOT_STARTED')
    })
})
