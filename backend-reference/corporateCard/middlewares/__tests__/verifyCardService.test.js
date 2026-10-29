const { verifyUser } = require('../verifyCardService')

const SERVICE = 'Corporate Cards'

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

describe('verifyUser', () => {
    it('lets an employee holding the service through', () => {
        const req = { user: { role: 'USER', serviceMemberships: [{ label: SERVICE, hasAccess: true, status: 'ACTIVE' }] } }
        const res = buildRes()
        const next = jest.fn()

        verifyUser(SERVICE)(req, res, next)

        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('rejects an employee lacking the service with 403 / 004', () => {
        const req = { user: { role: 'USER', serviceMemberships: [{ label: SERVICE, hasAccess: false, status: 'ACTIVE' }] } }
        const res = buildRes()
        const next = jest.fn()

        verifyUser(SERVICE)(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ responseCode: '004' }))
    })

    it('lets a partner-registered CORPORATE admin through when partnerServices grant the service', () => {
        const req = { user: { role: 'CORPORATE', registeredBy: 5, partnerServices: [{ label: SERVICE, hasAccess: true }] } }
        const res = buildRes()
        const next = jest.fn()

        verifyUser(SERVICE)(req, res, next)

        expect(next).toHaveBeenCalled()
    })

    it('rejects a partner-registered CORPORATE admin whose partnerServices deny the service', () => {
        const req = { user: { role: 'CORPORATE', registeredBy: 5, partnerServices: [{ label: SERVICE, hasAccess: false }] } }
        const res = buildRes()
        const next = jest.fn()

        verifyUser(SERVICE)(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
    })

    it('rejects with a "Partner permission not provided" message when partnerServices is absent', () => {
        const req = { user: { role: 'CORPORATE', registeredBy: 5 } }
        const res = buildRes()
        const next = jest.fn()

        verifyUser(SERVICE)(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Partner permission not provided' }))
    })

    it('lets a directly-registered CORPORATE admin (no registeredBy) through', () => {
        const req = { user: { role: 'CORPORATE' } }
        const res = buildRes()
        const next = jest.fn()

        verifyUser(SERVICE)(req, res, next)

        expect(next).toHaveBeenCalled()
    })

    it('rejects an ESS employee session (role USER) instead of falling through', () => {
        const req = { user: { role: 'USER', corporateId: 42, employeeId: 'abc' } }
        const res = buildRes()
        const next = jest.fn()

        verifyUser(SERVICE)(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ responseCode: '004' }))
    })

    it('lets a card member through when their membership covers the service', () => {
        const req = {
            user: {
                role: 'USER',
                corporateId: 42,
                employeeProfileId: 900,
                serviceMemberships: [{ label: SERVICE, hasAccess: true, status: 'ACTIVE' }],
            },
        }
        const res = buildRes()
        const next = jest.fn()

        verifyUser(SERVICE)(req, res, next)

        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('rejects an ESS-keyed card member whose grant does not cover the service', () => {
        const req = {
            user: {
                role: 'USER',
                corporateId: 42,
                employeeProfileId: 900,
                serviceMemberships: [{ label: SERVICE, hasAccess: false, status: 'ACTIVE' }],
            },
        }
        const res = buildRes()
        const next = jest.fn()

        verifyUser(SERVICE)(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
    })

    // An employee may hold several services. Holding one must never open another one's routes.
    it('rejects an employee whose only membership is in a different service', () => {
        const req = {
            user: {
                role: 'USER',
                corporateId: 42,
                employeeProfileId: 900,
                serviceMemberships: [{ label: 'Payroll', hasAccess: true, status: 'ACTIVE' }],
            },
        }
        const res = buildRes()
        const next = jest.fn()

        verifyUser(SERVICE)(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
    })

    it('rejects an employee whose membership has been suspended', () => {
        const req = {
            user: {
                role: 'USER',
                corporateId: 42,
                employeeProfileId: 900,
                serviceMemberships: [{ label: SERVICE, hasAccess: true, status: 'INACTIVE' }],
            },
        }
        const res = buildRes()
        const next = jest.fn()

        verifyUser(SERVICE)(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
    })

    it('rejects a SYSTEM_USER session', () => {
        const req = { user: { role: 'SYSTEM_USER' } }
        const res = buildRes()
        const next = jest.fn()

        verifyUser(SERVICE)(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
    })

    it('rejects a request with no user at all', () => {
        const req = {}
        const res = buildRes()
        const next = jest.fn()

        verifyUser(SERVICE)(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
    })

    it('rejects a sub-user whose session carries no services array', () => {
        const req = { user: { role: 'USER' } }
        const res = buildRes()
        const next = jest.fn()

        verifyUser(SERVICE)(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
    })
})

/**
 * A sub-corporate reaches this service on the parent corporate's credential, so it presents as CORPORATE.
 * The partner tree answers for the COMPANY; what User Management granted this member is its own list, and
 * until it was read here the grant gated the sidebar and nothing else.
 */
describe('verifyUser — a sub-corporate session', () => {
    const partnerTree = [{ label: SERVICE, hasAccess: true, subServices: [] }]

    const subCorporate = (granted) => ({
        user: {
            role: 'CORPORATE_SUB_USER',
            registeredBy: 7,
            subCorporateId: 164,
            partnerServices: partnerTree,
            subCorporateServices: granted,
        },
    })

    const run = (req) => {
        const res = buildRes()
        const next = jest.fn()
        verifyUser(SERVICE)(req, res, next)
        return { res, next }
    }

    it('lets one through when the service was granted to them', () => {
        const { res, next } = run(subCorporate([{ label: SERVICE, hasAccess: true, subServices: [] }]))

        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('refuses one holding the service with access turned off', () => {
        const { res, next } = run(subCorporate([{ label: SERVICE, hasAccess: false, subServices: [] }]))

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
    })

    it('refuses one never granted the service, though the company licenses it', () => {
        const { res, next } = run(subCorporate([{ label: 'Payroll', hasAccess: true, subServices: [] }]))

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
    })

    it('refuses one carrying no service list at all rather than defaulting open', () => {
        const { res, next } = run(subCorporate(undefined))

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
    })

    // The account holder has no subCorporateId, so the grant check must not touch them.
    it('leaves the account holder gated by the partner tree alone', () => {
        const res = buildRes()
        const next = jest.fn()
        verifyUser(SERVICE)(
            { user: { role: 'CORPORATE', registeredBy: 7, partnerServices: partnerTree } },
            res,
            next
        )

        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })
})

describe('verifyUser — the role gate', () => {
    const tree = [{ label: SERVICE, hasAccess: true, subServices: [] }]

    it('admits a sub-corporate session rather than refusing it on the role alone', () => {
        const res = buildRes()
        const next = jest.fn()
        verifyUser(SERVICE)(
            {
                user: {
                    role: 'CORPORATE_SUB_USER',
                    registeredBy: 7,
                    subCorporateId: 201,
                    partnerServices: tree,
                    subCorporateServices: tree,
                },
            },
            res,
            next
        )

        expect(next).toHaveBeenCalled()
    })

    // The company's licence still has to cover it — the member's grant is the narrower of the two, not a
    // way around the partner tree.
    it('refuses a sub-corporate whose company is not licensed for the service', () => {
        const res = buildRes()
        const next = jest.fn()
        verifyUser(SERVICE)(
            {
                user: {
                    role: 'CORPORATE_SUB_USER',
                    registeredBy: 7,
                    subCorporateId: 201,
                    partnerServices: [{ label: SERVICE, hasAccess: false, subServices: [] }],
                    subCorporateServices: tree,
                },
            },
            res,
            next
        )

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
    })

    it('still refuses a role that is none of the three', () => {
        const res = buildRes()
        const next = jest.fn()
        verifyUser(SERVICE)({ user: { role: 'SYSTEM_USER' } }, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
    })
})
