const mockFindOwnerCardholder = jest.fn()

jest.mock('../../utils/sharedDirectory', () => ({
    findOwnerCardholder: (...a) => mockFindOwnerCardholder(...a),
}))

const requireOwnCardholderIdentity = require('../requireOwnCardholderIdentity')

const OWNER_ROW = { id: '500', name: 'Asha Owner', email: 'asha@peko.in', mobileNo: '9812345678' }

const run = async (user) => {
    const req = { user: { ...user }, LogTraceId: 't1' }
    const next = jest.fn()
    await requireOwnCardholderIdentity(req, {}, next)
    return { req, next, error: next.mock.calls[0]?.[0] }
}

const statusOf = (error) => error?.statusCode ?? error?.status_code

beforeEach(() => {
    jest.clearAllMocks()
    mockFindOwnerCardholder.mockResolvedValue(OWNER_ROW)
})

describe('requireOwnCardholderIdentity', () => {
    it('passes a member straight through without a lookup', async () => {
        const { next, error } = await run({ role: 'USER', employeeProfileId: '99', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] })

        expect(error).toBeUndefined()
        expect(next).toHaveBeenCalledTimes(1)
        expect(mockFindOwnerCardholder).not.toHaveBeenCalled()
    })

    it('leaves an owner already acting as Employee alone', async () => {
        const { req, error } = await run({ role: 'CORPORATE', employeeProfileId: '500', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] })

        expect(error).toBeUndefined()
        expect(req.user.employeeProfileId).toBe('500')
        expect(mockFindOwnerCardholder).not.toHaveBeenCalled()
    })

    it('resolves the account owner acting as Admin, for this request only', async () => {
        const { req, error } = await run({ role: 'CORPORATE', id: 7, username: 'PEKO7', corporateId: 42 })

        expect(error).toBeUndefined()
        expect(req.user.employeeProfileId).toBe('500')
        expect(req.user.employeeMobile).toBe('9812345678')
        expect(req.user.serviceMemberships).toEqual([
            expect.objectContaining({ label: 'Corporate Cards', hasAccess: true, status: 'ACTIVE' }),
        ])
    })

    it('refuses an admin who is not the account owner', async () => {
        const { req, error } = await run({ role: 'USER', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }] })

        expect(statusOf(error)).toBe(403)
        expect(req.user.employeeProfileId).toBeUndefined()
        expect(mockFindOwnerCardholder).not.toHaveBeenCalled()
    })

    it('refuses a system user', async () => {
        const { error } = await run({ role: 'SYSTEM_USER', id: 3 })

        expect(statusOf(error)).toBe(403)
        expect(mockFindOwnerCardholder).not.toHaveBeenCalled()
    })

    it('answers 409 when the owner has no cardholder row yet', async () => {
        mockFindOwnerCardholder.mockResolvedValue(null)

        const { req, error } = await run({ role: 'CORPORATE', id: 7, corporateId: 42 })

        expect(statusOf(error)).toBe(409)
        expect(req.user.employeeProfileId).toBeUndefined()
    })

    it('fails closed with a 503 when the lookup itself breaks', async () => {
        mockFindOwnerCardholder.mockRejectedValue(new Error('gateway down'))

        const { req, error } = await run({ role: 'CORPORATE', id: 7, corporateId: 42 })

        expect(statusOf(error)).toBe(503)
        expect(req.user.employeeProfileId).toBeUndefined()
    })
})
