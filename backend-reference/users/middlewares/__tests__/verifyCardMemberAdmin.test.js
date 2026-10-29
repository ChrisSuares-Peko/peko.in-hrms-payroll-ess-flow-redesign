const { verifyCardMemberAdmin, actsAsCardAdmin } = require('../verifyCardMemberAdmin')

const CARDS = 'Corporate Cards'

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const employee = (over = {}) => ({
    role: 'USER',
    corporateId: 42,
    employeeProfileId: 900,
    serviceMemberships: [{ label: CARDS, hasAccess: true, role: 'Admin', status: 'ACTIVE' }],
    ...over,
})

// The People screen's endpoints used to sit behind verifyCorporateOwnerOrAdmin, which admits a session by its
// sub-corporate role. A card member has no sub-corporate row, so every employee Admin was refused the very
// endpoints the dashboard they were standing on calls.
describe('actsAsCardAdmin', () => {
    it('admits the account holder', () => {
        expect(actsAsCardAdmin({ role: 'CORPORATE', corporateId: 42 })).toBe(true)
    })

    it('admits an employee whose assigned card role is Admin', () => {
        expect(actsAsCardAdmin(employee())).toBe(true)
    })

    it('refuses an employee assigned the Employee role', () => {
        expect(actsAsCardAdmin(employee({
            serviceMemberships: [{ label: CARDS, hasAccess: true, role: 'Employee', status: 'ACTIVE' }],
        }))).toBe(false)
    })

    // An Admin who switched down to work with their own card is acting as an Employee everywhere.
    it('refuses an Admin acting in Employee mode', () => {
        expect(actsAsCardAdmin(employee({ activeSubRole: 'Employee' }))).toBe(false)
    })

    it('admits an Admin whose session carries no mode yet', () => {
        expect(actsAsCardAdmin(employee({ activeSubRole: null }))).toBe(true)
    })

    // A tampered blob must not promote anyone: the mode may only ever reduce authority.
    it('refuses an Employee carrying an Admin mode', () => {
        expect(actsAsCardAdmin(employee({
            serviceMemberships: [{ label: CARDS, hasAccess: true, role: 'Employee', status: 'ACTIVE' }],
            activeSubRole: 'Admin',
        }))).toBe(false)
    })

    it('refuses someone holding another service with an Admin role on it', () => {
        expect(actsAsCardAdmin(employee({
            serviceMemberships: [{ label: 'Payroll', hasAccess: true, role: 'Admin', status: 'ACTIVE' }],
        }))).toBe(false)
    })

    it('refuses a revoked card membership', () => {
        expect(actsAsCardAdmin(employee({
            serviceMemberships: [{ label: CARDS, hasAccess: false, role: 'Admin', status: 'INACTIVE' }],
        }))).toBe(false)
    })

    it('refuses an employee with no identity to exercise the role as', () => {
        expect(actsAsCardAdmin(employee({ employeeProfileId: null }))).toBe(false)
    })

    it('refuses a sub-corporate session, which holds no card identity at all', () => {
        expect(actsAsCardAdmin({ role: 'CORPORATE_SUB_USER', corporateId: 42, subCorporateRole: 'Admin' })).toBe(false)
    })

    it('refuses an absent user', () => {
        expect(actsAsCardAdmin(undefined)).toBe(false)
    })
})

describe('verifyCardMemberAdmin', () => {
    it('passes an admitted session through', () => {
        const next = jest.fn()

        verifyCardMemberAdmin({ user: employee() }, buildRes(), next)

        expect(next).toHaveBeenCalled()
    })

    it('answers 403 with the permission code, never the generic error', () => {
        const res = buildRes()
        const next = jest.fn()

        verifyCardMemberAdmin({ user: employee({ activeSubRole: 'Employee' }) }, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: false, responseCode: '007' }))
    })
})
