const requireCardholder = require('../requireCardholder')

describe('requireCardholder', () => {
    it('passes a cardholder through with a bare next()', () => {
        const req = { user: { role: 'USER', employeeProfileId: '99', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] } }
        const next = jest.fn()

        requireCardholder(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)
        expect(next).toHaveBeenCalledWith()
    })

    it('blocks a session holding no cardholder identity with a 403 ErrorResponse', () => {
        const req = { user: { role: 'CORPORATE' } }
        const next = jest.fn()

        requireCardholder(req, {}, next)

        const err = next.mock.calls[0][0]
        expect(err).toBeInstanceOf(Error)
        expect(err.status_code).toBe(403)
        expect(err.message).toMatch(/cardholders only/i)
    })

    it('blocks when there is no user at all', () => {
        const next = jest.fn()

        requireCardholder({}, {}, next)

        expect(next.mock.calls[0][0].status_code).toBe(403)
    })
})
