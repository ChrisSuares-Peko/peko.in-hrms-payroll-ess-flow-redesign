const { requireSystemUser } = require('../requireSystemUser')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const run = (user) => {
    const res = buildRes()
    const next = jest.fn()
    requireSystemUser({ user }, res, next)
    return { res, next }
}

// F-USR-11: the platform-default service permissions, the partner sidebar and the admin-alert WhatsApp numbers
// were writable by any authenticated corporate or employee.
describe('requireSystemUser', () => {
    it('admits an admin session', () => {
        const { next, res } = run({ role: 'SYSTEM_USER' })

        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    it.each([['CORPORATE'], ['CORPORATE_SUB_USER'], ['USER'], ['PARTNER'], [undefined]])(
        'rejects a %s session with 403',
        (role) => {
            const { next, res } = run({ role })

            expect(next).not.toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(403)
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ responseCode: '007' }))
        }
    )

    it('rejects a request with no session user', () => {
        const res = buildRes()
        const next = jest.fn()
        requireSystemUser({}, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
    })
})
