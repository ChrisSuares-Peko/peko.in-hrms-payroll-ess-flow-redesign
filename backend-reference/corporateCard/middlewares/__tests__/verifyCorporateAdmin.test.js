const { verifyCorporateAdmin } = require('../verifyCorporateAdmin')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

describe('verifyCorporateAdmin', () => {
    it('lets a CORPORATE admin through', () => {
        const req = { user: { role: 'CORPORATE' } }
        const res = buildRes()
        const next = jest.fn()

        verifyCorporateAdmin(req, res, next)

        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('rejects a non-admin role with 403 / responseCode 007 (not 004, which would redirect to /404)', () => {
        const req = { user: { role: 'USER' } }
        const res = buildRes()
        const next = jest.fn()

        verifyCorporateAdmin(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: false,
            message: "You don't have permission to perform this action.",
            responseCode: '007',
        }))
    })

    it('rejects when there is no user', () => {
        const res = buildRes()
        const next = jest.fn()

        verifyCorporateAdmin({}, res, next)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(next).not.toHaveBeenCalled()
    })
})
