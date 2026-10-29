jest.mock('../../../models/use-cases/cardIssuance', () => ({ findAndCountPhysicalTracking: jest.fn() }))
jest.mock('../../../utils/cardHelpers', () => ({
    ...jest.requireActual('../../../utils/cardHelpers'),
    attachCardholders: jest.fn(async (rows) => rows),
}))

const { listPhysicalTracking } = require('../cardTracking')
const { findAndCountPhysicalTracking } = require('../../../models/use-cases/cardIssuance')
const { attachCardholders } = require('../../../utils/cardHelpers')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const adminReq = (query = {}) => ({
    user: { role: 'CORPORATE', corporateId: 42, id: 5 },
    query,
})

// A member acting as Employee: same corporate, but authority comes from the assigned role, not the session role.
const cardholderReq = (query = {}, user = {}) => ({
    user: {
        role: 'USER',
        corporateId: 42,
        id: 6,
        employeeProfileId: '99',
        serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }],
        activeSubRole: 'Employee',
        ...user,
    },
    query,
})

const row = (overrides = {}) => ({
    id: 77,
    createdAt: '2026-08-01T04:30:00.000Z',
    userId: '99',
    maskedCardNumber: '608363******9870',
    referenceNumber: 31157821,
    status: 'ISSUED',
    shipping: { addressLine1: 'B-22', city: 'Mumbai', pinCode: '400050' },
    dispatches: [],
    ...overrides,
})

const dataOf = (res) => res.json.mock.calls[0][0].data

describe('listPhysicalTracking', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findAndCountPhysicalTracking.mockResolvedValue({ count: 1, rows: [row()] })
    })

    it('400s without a corporate context', async () => {
        const next = jest.fn()

        await listPhysicalTracking({ user: {}, query: {} }, buildRes(), next)

        expect(findAndCountPhysicalTracking).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('scopes the query to the session corporate, never a query parameter', async () => {
        await listPhysicalTracking(adminReq({ corporateId: '999' }), buildRes(), jest.fn())

        expect(findAndCountPhysicalTracking).toHaveBeenCalledWith(expect.objectContaining({ corporateId: 42 }))
    })

    it('returns serialized tracking rows with the count', async () => {
        const res = buildRes()

        await listPhysicalTracking(adminReq(), res, jest.fn())

        expect(res.status).toHaveBeenCalledWith(200)
        expect(dataOf(res).count).toBe(1)
        expect(dataOf(res).rows[0]).toEqual(expect.objectContaining({
            key: '77', status: 'Issued', referenceNumber: '31157821', last4: '9870',
        }))
    })

    it('hydrates cardholder identity, which lives in the shared directory', async () => {
        await listPhysicalTracking(adminReq(), buildRes(), jest.fn())

        expect(attachCardholders).toHaveBeenCalledWith([expect.objectContaining({ id: 77 })], expect.anything())
    })

    it.each([
        ['Ordered', 'PENDING'],
        ['Issued', 'ISSUED'],
        ['Failed', 'FAILED'],
    ])('translates the %s filter to issuance status %s', async (label, expected) => {
        await listPhysicalTracking(adminReq({ status: label }), buildRes(), jest.fn())

        expect(findAndCountPhysicalTracking).toHaveBeenCalledWith(expect.objectContaining({ status: expected }))
    })

    it('asks for no status filter when none was given', async () => {
        await listPhysicalTracking(adminReq(), buildRes(), jest.fn())

        expect(findAndCountPhysicalTracking.mock.calls[0][0].status).toBeUndefined()
    })

    // The value reaches a where-clause, so an unknown one is refused rather than passed through.
    it.each([['PENDING'], ['nonsense'], ["Issued' OR 1=1"]])('rejects %p as a status', async (status) => {
        const next = jest.fn()

        await listPhysicalTracking(adminReq({ status }), buildRes(), next)

        expect(findAndCountPhysicalTracking).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    // Express/qs turns ?status[a]=b into an object, which would reach the where-builder as one.
    it('ignores a bracket-notation status instead of crashing on it', async () => {
        await listPhysicalTracking(adminReq({ status: { a: 'b' } }), buildRes(), jest.fn())

        expect(findAndCountPhysicalTracking.mock.calls[0][0].status).toBeUndefined()
    })

    it('pages the query and echoes the window back', async () => {
        findAndCountPhysicalTracking.mockResolvedValue({ count: 24, rows: [row()] })
        const res = buildRes()

        await listPhysicalTracking(adminReq({ page: '3', itemsPerPage: '10' }), res, jest.fn())

        expect(findAndCountPhysicalTracking).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, offset: 20 }))
        expect(dataOf(res)).toEqual(expect.objectContaining({ page: 3, itemsPerPage: 10, count: 24 }))
    })

    it('answers an empty page rather than an error when there are no orders', async () => {
        findAndCountPhysicalTracking.mockResolvedValue({ count: 0, rows: [] })
        const res = buildRes()

        await listPhysicalTracking(adminReq(), res, jest.fn())

        expect(res.status).toHaveBeenCalledWith(200)
        expect(dataOf(res)).toEqual(expect.objectContaining({ count: 0, rows: [] }))
    })

    // The route carries no verifyCorporateAdmin, so every one of these is the ONLY thing standing between a
    // cardholder and another member's home address and consignment numbers.
    describe('cardholder scope', () => {
        it('pins a cardholder to their own orders', async () => {
            await listPhysicalTracking(cardholderReq(), buildRes(), jest.fn())

            expect(findAndCountPhysicalTracking).toHaveBeenCalledWith(
                expect.objectContaining({ corporateId: 42, cardholder: { userId: '99' } })
            )
        })

        it('refuses to widen a cardholder scope through the userId parameter', async () => {
            await listPhysicalTracking(cardholderReq({ userId: '1234' }), buildRes(), jest.fn())

            expect(findAndCountPhysicalTracking).toHaveBeenCalledWith(
                expect.objectContaining({ cardholder: { userId: '99' } })
            )
        })

        // The failure mode this guards is silent and total: drop the predicate and the query returns every
        // physical card in the corporate.
        it('400s a non-admin session carrying no cardholder identity rather than listing the whole corporate', async () => {
            const next = jest.fn()

            await listPhysicalTracking(cardholderReq({}, { employeeProfileId: undefined }), buildRes(), next)

            expect(findAndCountPhysicalTracking).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        })

        it('leaves an admin unscoped so the whole corporate still lists', async () => {
            await listPhysicalTracking(adminReq(), buildRes(), jest.fn())

            expect(findAndCountPhysicalTracking.mock.calls[0][0].cardholder).toBeUndefined()
        })

        it('lets an admin narrow to one member', async () => {
            await listPhysicalTracking(adminReq({ userId: '99' }), buildRes(), jest.fn())

            expect(findAndCountPhysicalTracking).toHaveBeenCalledWith(
                expect.objectContaining({ cardholder: { userId: '99' } })
            )
        })

        // A cardholder already knows their own name; the directory call exists for the admin table's columns.
        it('skips the cross-service cardholder hydration for a cardholder', async () => {
            await listPhysicalTracking(cardholderReq(), buildRes(), jest.fn())

            expect(attachCardholders).not.toHaveBeenCalled()
        })

        it('still serializes rows without hydrated cardholder identity', async () => {
            const res = buildRes()

            await listPhysicalTracking(cardholderReq(), res, jest.fn())

            expect(res.status).toHaveBeenCalledWith(200)
            expect(dataOf(res).rows[0]).toEqual(
                expect.objectContaining({ key: '77', holder: null, department: null })
            )
        })
    })
})
