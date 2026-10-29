jest.mock('../cacheDataMethods', () => ({ getValue: jest.fn() }))

const { verifyToken } = require('../jwtToken')
const { getValue } = require('../cacheDataMethods')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

describe('verifyToken', () => {
    beforeEach(() => {
        getValue.mockReset()
    })

    it('resolves the session from Redis when the gateway sends x-user-key', async () => {
        const user = { id: 1, role: 'CORPORATE', corporateId: 42 }
        getValue.mockResolvedValue(JSON.stringify(user))
        const req = { headers: { 'x-user-key': '1_sess-uuid' } }
        const res = buildRes()
        const next = jest.fn()

        await verifyToken(req, res, next)

        expect(getValue).toHaveBeenCalledWith('userData_1_sess-uuid')
        expect(req.user).toEqual(user)
        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('rejects with 401 when x-user-key names a session that has expired', async () => {
        getValue.mockResolvedValue(null)
        const req = { headers: { 'x-user-key': '1_gone' } }
        const res = buildRes()
        const next = jest.fn()

        await verifyToken(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: false, responseCode: '002' }))
        expect(next).not.toHaveBeenCalled()
    })

    it('prefers x-user-key over a stale userdata header', async () => {
        const fromRedis = { id: 7, role: 'CORPORATE' }
        getValue.mockResolvedValue(JSON.stringify(fromRedis))
        const req = {
            headers: {
                'x-user-key': '7_sess',
                userdata: encodeURI(JSON.stringify({ id: 999, role: 'SYSTEM_USER' })),
            },
        }
        const res = buildRes()
        const next = jest.fn()

        await verifyToken(req, res, next)

        expect(req.user).toEqual(fromRedis)
        expect(next).toHaveBeenCalled()
    })

    it('rejects with 401 / responseCode 002 when the userdata header is absent', async () => {
        const req = { headers: {} }
        const res = buildRes()
        const next = jest.fn()

        await verifyToken(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: false, message: 'Unauthorized', responseCode: '002' }))
        expect(next).not.toHaveBeenCalled()
    })

    it('parses the userdata header onto req.user and calls next()', async () => {
        const user = { id: 1, role: 'CORPORATE', corporateId: 42 }
        const req = { headers: { userdata: encodeURI(JSON.stringify(user)) } }
        const res = buildRes()
        const next = jest.fn()

        await verifyToken(req, res, next)

        expect(req.user).toEqual(user)
        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('rejects with 401 / responseCode 001 when the userdata header is unparseable', async () => {
        const req = { headers: { userdata: '{not-json' } }
        const res = buildRes()
        const next = jest.fn()

        await verifyToken(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: false, responseCode: '001' }))
        expect(next).not.toHaveBeenCalled()
    })
})
