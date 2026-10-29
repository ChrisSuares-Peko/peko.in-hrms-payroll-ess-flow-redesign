const { requirePermission } = require('../requirePermission')
const { PERMISSIONS } = require('../../utils/cardRoles')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const run = (key, user) => {
    const res = buildRes()
    const next = jest.fn()
    requirePermission(key)({ user }, res, next)
    return { res, next }
}

const subAdmin = (over = {}) => ({
    role: 'USER', corporateId: 42, userId: '99', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }], ...over,
})
const employee = (over = {}) => ({
    role: 'USER', corporateId: 42, userId: '99', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }], ...over,
})

describe('requirePermission — wiring safety', () => {
    it('throws at construction for a key the catalogue does not define', () => {
        expect(() => requirePermission('corporate_cards.not-a-real-key')).toThrow(/unknown permission key/)
        expect(() => requirePermission('issue-cards')).toThrow(/unknown permission key/)
    })

    it('accepts every key exposed in PERMISSIONS', () => {
        Object.values(PERMISSIONS).forEach((key) => expect(() => requirePermission(key)).not.toThrow())
    })
})

describe('requirePermission — decisions', () => {
    it('exempts the corporate owner, who holds no preset', () => {
        expect(run(PERMISSIONS.RECORD_ENTRIES, { role: 'CORPORATE', corporateId: 42 }).next).toHaveBeenCalled()
    })

    it('admits an Admin for an admin-scoped key', () => {
        expect(run(PERMISSIONS.ISSUE_CARDS, subAdmin()).next).toHaveBeenCalled()
    })

    it('refuses an Employee for an admin-scoped key', () => {
        const { next, res } = run(PERMISSIONS.ISSUE_CARDS, employee())

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            responseCode: '007',
            message: "You don't have permission to perform this action.",
        }))
    })

    // The mode is clamped to the assigned role: an Admin may reduce their own authority, an Employee may not
    // claim more.
    it('refuses an Admin who has switched down to Employee', () => {
        expect(run(PERMISSIONS.RECORD_ENTRIES, subAdmin({ activeSubRole: 'Employee' })).next).not.toHaveBeenCalled()
    })

    it('admits an Admin acting as Admin', () => {
        expect(run(PERMISSIONS.RECORD_ENTRIES, subAdmin({ activeSubRole: 'Admin' })).next).toHaveBeenCalled()
    })

    it('does not let an Employee claim an Admin mode', () => {
        expect(run(PERMISSIONS.ISSUE_CARDS, employee({ activeSubRole: 'Admin' })).next).not.toHaveBeenCalled()
    })

    it('refuses a session with no role information rather than defaulting open', () => {
        expect(run(PERMISSIONS.ISSUE_CARDS, { role: 'USER', userId: '99' }).next)
            .not.toHaveBeenCalled()
        expect(run(PERMISSIONS.ISSUE_CARDS, {}).next).not.toHaveBeenCalled()
    })
})
