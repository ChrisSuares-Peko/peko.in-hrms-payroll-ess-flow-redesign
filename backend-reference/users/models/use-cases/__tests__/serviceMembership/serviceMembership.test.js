const {
    listMemberships,
    membershipFor,
    holdsService,
    holdsAnyService,
    roleInService,
    refInService,
    activeServiceLabels,
    grantService,
    revokeService,
    setServiceStatus,
} = require('../../serviceMembership')
const { EMPLOYEE_SERVICE, MEMBERSHIP_STATUS } = require('../../../../constants/employeeServices')

const payrollOnly = {
    permission: [
        { label: 'Payroll', hasAccess: true, role: null, status: 'ACTIVE', ref: '65f0c1a2b3' },
    ],
}

const both = {
    permission: [
        { label: 'Payroll', hasAccess: true, role: null, status: 'ACTIVE', ref: '65f0c1a2b3' },
        { label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE', ref: null },
    ],
}

const legacy = { permission: [{ label: 'Payroll', hasAccess: true }] }

describe('reading memberships', () => {
    it('finds a membership by label regardless of casing or padding', () => {
        expect(membershipFor(both, '  corporate cards ')?.role).toBe('Admin')
    })

    it('returns null for a service the employee was never granted', () => {
        expect(membershipFor(payrollOnly, EMPLOYEE_SERVICE.CORPORATE_CARDS)).toBeNull()
    })

    it('reads the per-service role', () => {
        expect(roleInService(both, EMPLOYEE_SERVICE.CORPORATE_CARDS)).toBe('Admin')
        expect(roleInService(both, EMPLOYEE_SERVICE.PAYROLL)).toBeNull()
    })

    it('reads the per-service reference the owning service stored', () => {
        expect(refInService(both, EMPLOYEE_SERVICE.PAYROLL)).toBe('65f0c1a2b3')
    })

    it('lists only the services the employee may currently use', () => {
        expect(activeServiceLabels(both)).toEqual(['Payroll', 'Corporate Cards'])
    })

    it('treats a missing or malformed userAccessService as no memberships', () => {
        expect(listMemberships(undefined)).toEqual([])
        expect(listMemberships({ permission: 'nonsense' })).toEqual([])
        expect(holdsAnyService(null)).toBe(false)
    })
})

// Employees invited before role/status/ref existed carry only label and hasAccess. They must keep resolving
// to exactly the access they had, or an ESS employee loses payroll the day this ships.
describe('entries written before this shape existed', () => {
    it('defaults to an active membership with no role', () => {
        expect(membershipFor(legacy, EMPLOYEE_SERVICE.PAYROLL)).toEqual(expect.objectContaining({
            hasAccess: true,
            role: null,
            status: MEMBERSHIP_STATUS.ACTIVE,
            ref: null,
        }))
    })

    it('still grants access', () => {
        expect(holdsService(legacy, EMPLOYEE_SERVICE.PAYROLL)).toBe(true)
    })
})

describe('holdsService', () => {
    it('refuses a revoked membership', () => {
        expect(holdsService(revokeService(both, EMPLOYEE_SERVICE.CORPORATE_CARDS), EMPLOYEE_SERVICE.CORPORATE_CARDS)).toBe(false)
    })

    it('refuses an INACTIVE membership even while hasAccess is still true', () => {
        const suspended = { permission: [{ label: 'Corporate Cards', hasAccess: true, status: 'INACTIVE' }] }
        expect(holdsService(suspended, EMPLOYEE_SERVICE.CORPORATE_CARDS)).toBe(false)
    })

    it('allows a PENDING membership, which is granted but not yet acted on', () => {
        const pending = { permission: [{ label: 'Corporate Cards', hasAccess: true, status: 'PENDING' }] }
        expect(holdsService(pending, EMPLOYEE_SERVICE.CORPORATE_CARDS)).toBe(true)
    })
})

describe('grantService', () => {
    it('adds a service without disturbing one the employee already holds', () => {
        const next = grantService(payrollOnly, {
            label: EMPLOYEE_SERVICE.CORPORATE_CARDS,
            role: 'Employee',
            status: MEMBERSHIP_STATUS.PENDING,
        })

        expect(activeServiceLabels(next)).toEqual(['Payroll', 'Corporate Cards'])
        expect(refInService(next, EMPLOYEE_SERVICE.PAYROLL)).toBe('65f0c1a2b3')
        expect(roleInService(next, EMPLOYEE_SERVICE.CORPORATE_CARDS)).toBe('Employee')
    })

    it('does not mutate the value it was given', () => {
        const before = JSON.stringify(payrollOnly)
        grantService(payrollOnly, { label: EMPLOYEE_SERVICE.CORPORATE_CARDS, role: 'Admin' })
        expect(JSON.stringify(payrollOnly)).toBe(before)
    })

    it('updates a role in place rather than adding a second entry for the same service', () => {
        const next = grantService(both, { label: EMPLOYEE_SERVICE.CORPORATE_CARDS, role: 'Employee' })

        expect(listMemberships(next)).toHaveLength(2)
        expect(roleInService(next, EMPLOYEE_SERVICE.CORPORATE_CARDS)).toBe('Employee')
    })

    it('keeps what the existing entry already held when the grant does not mention it', () => {
        const next = grantService(both, { label: EMPLOYEE_SERVICE.PAYROLL, status: MEMBERSHIP_STATUS.ACTIVE })
        expect(refInService(next, EMPLOYEE_SERVICE.PAYROLL)).toBe('65f0c1a2b3')
    })

    it('re-grants a revoked service instead of leaving it inaccessible', () => {
        const revoked = revokeService(both, EMPLOYEE_SERVICE.CORPORATE_CARDS)
        const regranted = grantService(revoked, { label: EMPLOYEE_SERVICE.CORPORATE_CARDS, status: MEMBERSHIP_STATUS.ACTIVE })

        expect(holdsService(regranted, EMPLOYEE_SERVICE.CORPORATE_CARDS)).toBe(true)
    })

    it('starts a permission list for an employee who had none', () => {
        const next = grantService(null, { label: EMPLOYEE_SERVICE.CORPORATE_CARDS, role: 'Admin' })
        expect(activeServiceLabels(next)).toEqual(['Corporate Cards'])
    })

    it('carries service-specific keys the caller passes through', () => {
        const next = grantService(null, {
            label: EMPLOYEE_SERVICE.PAYROLL,
            subServices: [{ label: 'Payslips', hasAccess: true }],
        })
        expect(membershipFor(next, EMPLOYEE_SERVICE.PAYROLL).subServices).toEqual([{ label: 'Payslips', hasAccess: true }])
    })
})

describe('revokeService', () => {
    it('keeps the entry so records keyed on the membership still resolve', () => {
        const next = revokeService(both, EMPLOYEE_SERVICE.CORPORATE_CARDS)

        expect(listMemberships(next)).toHaveLength(2)
        expect(membershipFor(next, EMPLOYEE_SERVICE.CORPORATE_CARDS).status).toBe(MEMBERSHIP_STATUS.INACTIVE)
        expect(activeServiceLabels(next)).toEqual(['Payroll'])
    })

    it('leaves an employee who never held the service untouched', () => {
        expect(revokeService(payrollOnly, EMPLOYEE_SERVICE.CORPORATE_CARDS)).toEqual(payrollOnly)
    })
})

describe('setServiceStatus', () => {
    it('suspends and restores access alongside the status', () => {
        const suspended = setServiceStatus(both, EMPLOYEE_SERVICE.CORPORATE_CARDS, MEMBERSHIP_STATUS.INACTIVE)
        expect(holdsService(suspended, EMPLOYEE_SERVICE.CORPORATE_CARDS)).toBe(false)

        const restored = setServiceStatus(suspended, EMPLOYEE_SERVICE.CORPORATE_CARDS, MEMBERSHIP_STATUS.ACTIVE)
        expect(holdsService(restored, EMPLOYEE_SERVICE.CORPORATE_CARDS)).toBe(true)
    })
})
