const {
    CARD_SERVICE_LABEL,
    cardMembership,
    holdsCardMembership,
    membershipRole,
    cardholderIdentity,
    cardholderProfile,
    rowCardholderIdentity,
    cardholderWhere,
    rowBelongsToCardholder,
    cardholderColumnsOf,
    cardholderColumnsForSession,
    cardholderColumnsOfDirectoryRow,
} = require('../cardholderIdentity')

const membership = (overrides = {}) => ({
    label: CARD_SERVICE_LABEL,
    hasAccess: true,
    role: 'Employee',
    status: 'ACTIVE',
    ref: null,
    ...overrides,
})

const session = (user = {}) => ({
    user: {
        role: 'USER',
        id: 55,
        corporateId: 42,
        employeeProfileId: 900,
        employeeName: 'Aarav Sharma',
        employeeEmail: 'aarav@peko.in',
        employeeMobile: '9876543210',
        serviceMemberships: [membership()],
        ...user,
    },
})

describe('cardMembership', () => {
    it('finds this service entry regardless of casing or padding', () => {
        const req = session({ serviceMemberships: [membership({ label: '  corporate cards ' })] })

        expect(cardMembership(req)?.role).toBe('Employee')
    })

    // An employee may hold several services. This one must read its own entry and never a neighbour's.
    it('reads its own entry, not another service one', () => {
        const req = session({
            serviceMemberships: [
                { label: 'Payroll', hasAccess: true, role: 'Manager', status: 'ACTIVE' },
                membership({ role: 'Admin' }),
            ],
        })

        expect(membershipRole(req)).toBe('Admin')
    })

    it('is null for an employee granted only other services', () => {
        const req = session({ serviceMemberships: [{ label: 'Payroll', hasAccess: true }] })

        expect(cardMembership(req)).toBeNull()
        expect(membershipRole(req)).toBeNull()
    })

    it('treats a missing or malformed membership list as no membership', () => {
        expect(cardMembership(session({ serviceMemberships: undefined }))).toBeNull()
        expect(cardMembership(session({ serviceMemberships: 'nonsense' }))).toBeNull()
        expect(cardMembership({})).toBeNull()
    })
})

describe('holdsCardMembership', () => {
    it('admits a live membership', () => {
        expect(holdsCardMembership(session())).toBe(true)
    })

    it('refuses a revoked one', () => {
        expect(holdsCardMembership(session({ serviceMemberships: [membership({ hasAccess: false })] }))).toBe(false)
    })

    it('refuses an INACTIVE one even while hasAccess is still true', () => {
        expect(holdsCardMembership(session({ serviceMemberships: [membership({ status: 'INACTIVE' })] }))).toBe(false)
    })

    it('admits a PENDING one, which is granted but not yet acted on', () => {
        expect(holdsCardMembership(session({ serviceMemberships: [membership({ status: 'PENDING' })] }))).toBe(true)
    })
})

describe('cardholderIdentity', () => {
    it('is the employee own profile id', () => {
        expect(cardholderIdentity(session())).toEqual({ userId: 900 })
    })

    // Without this an employee invited by another service would be treated as a member of the card
    // programme on the strength of holding an employee row at all.
    it('is null for an employee who does not hold this service', () => {
        expect(cardholderIdentity(session({ serviceMemberships: [{ label: 'Payroll', hasAccess: true }] }))).toBeNull()
    })

    it('is null for a session with no employee profile', () => {
        expect(cardholderIdentity(session({ employeeProfileId: null }))).toBeNull()
        expect(cardholderIdentity({ user: { role: 'CORPORATE', corporateId: 42 } })).toBeNull()
    })
})

describe('cardholderProfile', () => {
    // The KYC submission is built from these and every audit row is signed with them, so a blank name here
    // reaches Pine Labs as a blank name.
    it('carries the name, email and mobile the vendor and the audit trail need', () => {
        expect(cardholderProfile(session())).toEqual({
            id: 900,
            name: 'Aarav Sharma',
            email: 'aarav@peko.in',
            mobileNo: '9876543210',
        })
    })

    it('reports a null id rather than a stale one when the session holds no membership', () => {
        expect(cardholderProfile(session({ serviceMemberships: [] })).id).toBeNull()
    })
})

describe('row helpers', () => {
    it('reads a row under its userId', () => {
        expect(rowCardholderIdentity({ userId: 900 })).toEqual({ userId: 900 })
    })

    it('yields no identity for a row with no cardholder at all', () => {
        expect(rowCardholderIdentity({ userId: null })).toBeNull()
        expect(rowCardholderIdentity(undefined)).toBeNull()
    })

    it('matches a row belonging to the cardholder, comparing as strings', () => {
        expect(rowBelongsToCardholder({ userId: '900' }, { userId: 900 })).toBe(true)
        expect(rowBelongsToCardholder({ userId: 901 }, { userId: 900 })).toBe(false)
    })

    it('refuses a row when there is no identity to compare against', () => {
        expect(rowBelongsToCardholder({ userId: 900 }, null)).toBe(false)
        expect(rowBelongsToCardholder({ userId: null }, { userId: 900 })).toBe(false)
    })
})

// Every caller must treat null as "refuse" and never as "no filter": dropping the predicate is what returned
// an entire corporate's cards.
describe('cardholderWhere', () => {
    it('filters on the cardholder', () => {
        expect(cardholderWhere({ userId: 900 })).toEqual({ userId: 900 })
    })

    it('returns null rather than an empty filter when there is no identity', () => {
        expect(cardholderWhere(null)).toBeNull()
        expect(cardholderWhere({ userId: null })).toBeNull()
    })
})

describe('write columns', () => {
    it('stamps a row with the resolved cardholder', () => {
        expect(cardholderColumnsOf({ userId: 900 })).toEqual({ userId: 900 })
        expect(cardholderColumnsOf(null)).toEqual({ userId: null })
    })

    it('stamps a row written on behalf of the session', () => {
        expect(cardholderColumnsForSession(session())).toEqual({ userId: 900 })
    })

    it('writes a null cardholder rather than a wrong one when the session holds no membership', () => {
        expect(cardholderColumnsForSession(session({ serviceMemberships: [] }))).toEqual({ userId: null })
    })

    it('stamps a row from a directory lookup', () => {
        expect(cardholderColumnsOfDirectoryRow({ id: 900 })).toEqual({ userId: 900 })
        expect(cardholderColumnsOfDirectoryRow(undefined)).toEqual({ userId: null })
    })
})
