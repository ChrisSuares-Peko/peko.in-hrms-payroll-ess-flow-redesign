const { validateCreateEssUser } = require('../apiValidation')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const body = (overrides = {}) => ({
    name: 'Rakshita',
    email: 'rakshita@example.com',
    baseUrl: 'https://app.example.com',
    ...overrides,
})

describe('validateCreateEssUser', () => {
    it('passes a well-formed invite through', () => {
        const req = { body: body() }
        const next = jest.fn()

        validateCreateEssUser(req, buildRes(), next)

        expect(next).toHaveBeenCalled()
        expect(req.body).toEqual(expect.objectContaining({ name: 'Rakshita', baseUrl: 'https://app.example.com' }))
    })

    it('strips a caller-named service grant before the controller sees it', () => {
        const req = {
            body: body({
                userAccessService: {
                    permission: [{ label: 'Corporate Cards', role: 'Admin', hasAccess: true }],
                },
            }),
        }
        const next = jest.fn()

        validateCreateEssUser(req, buildRes(), next)

        expect(next).toHaveBeenCalled()
        expect(req.body.userAccessService).toBeUndefined()
    })

    it('keeps the fields the invite legitimately carries', () => {
        const req = { body: body({ mobileNo: '9876543210', employeeId: 'a'.repeat(24) }) }

        validateCreateEssUser(req, buildRes(), jest.fn())

        expect(req.body.mobileNo).toBe('9876543210')
        expect(req.body.employeeId).toBe('a'.repeat(24))
    })

    it('refuses a malformed email', () => {
        const res = buildRes()
        const next = jest.fn()

        validateCreateEssUser({ body: body({ email: 'not-an-email' }) }, res, next)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(next).not.toHaveBeenCalled()
    })

    it('refuses an invite with no name', () => {
        const res = buildRes()
        const next = jest.fn()

        validateCreateEssUser({ body: { email: 'rakshita@example.com' } }, res, next)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(next).not.toHaveBeenCalled()
    })
})
