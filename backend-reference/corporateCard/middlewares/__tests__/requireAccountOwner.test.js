const { requireAccountOwner } = require('../requireAccountOwner')
const { ACCOUNT_OWNER_ONLY } = require('../../constants/messages')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const outcome = (user) => {
    const res = buildRes()
    const next = jest.fn()
    requireAccountOwner({ user }, res, next)
    return {
        admitted: next.mock.calls.length === 1,
        status: res.status.mock.calls[0]?.[0] ?? null,
        body: res.json.mock.calls[0]?.[0] ?? null,
    }
}

const ADMITTED = { admitted: true, status: null, body: null }

const REFUSED = {
    admitted: false,
    status: 403,
    body: { status: false, message: ACCOUNT_OWNER_ONLY, data: {}, responseCode: '007' },
}

describe('requireAccountOwner', () => {
    it('admits the account owner acting as admin', () => {
        expect(outcome({ role: 'CORPORATE', corporateId: 42, id: 5 })).toEqual(ADMITTED)
    })

    // The whole point of this middleware: verifyCorporateAdmin admits an assigned Admin, this does not.
    it('refuses an assigned sub-corporate Admin', () => {
        expect(outcome({
            role: 'USER', corporateId: 42, userId: '99', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }],
        })).toEqual(REFUSED)
    })

    it('refuses an assigned Admin who is also actively in Admin mode', () => {
        expect(outcome({
            role: 'USER',
            corporateId: 42,
            userId: '99',
            serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }],
            activeSubRole: 'Admin',
        })).toEqual(REFUSED)
    })

    it('refuses an employee', () => {
        expect(outcome({
            role: 'USER', corporateId: 42, userId: '99', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }],
        })).toEqual(REFUSED)
    })

    it('refuses a plain cardholder session', () => {
        expect(outcome({ role: 'USER', corporateId: 42, employeeProfileId: '99' })).toEqual(REFUSED)
    })

    // The account holder reaches their cardholder view by switching IDENTITY, which mints a USER session —
    // so a role claimed on a CORPORATE session is not a way to shed owner authority.
    it('admits the owner whatever mode the client claims', () => {
        expect(outcome({
            role: 'CORPORATE', corporateId: 42, id: 5, serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }], activeSubRole: 'Employee',
        })).toEqual(ADMITTED)
    })

    it('refuses an employee holding the Employee account, whatever their card role', () => {
        expect(outcome({
            role: 'USER', corporateId: 42, id: 5, employeeProfileId: 900,
            serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }],
        })).toEqual(REFUSED)
    })

    // The owner keeps role CORPORATE even after requireOwnCardholderIdentity stamps a cardholder id onto
    // the session, so a stamped id must not make them read as an assigned admin.
    it('still admits the owner once a cardholder identity is stamped on the session', () => {
        expect(outcome({ role: 'CORPORATE', corporateId: 42, id: 5, userId: '77' }))
            .toEqual(ADMITTED)
    })

    it('refuses a session with no user at all', () => {
        expect(outcome(undefined)).toEqual(REFUSED)
    })
})
