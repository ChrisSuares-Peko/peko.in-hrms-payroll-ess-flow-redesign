const verifyPinePerksIp = require('../verifyPinePerksIp')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

describe('verifyPinePerksIp', () => {
    const OLD_ENV = process.env

    beforeEach(() => {
        process.env = { ...OLD_ENV }
        delete process.env.NODE_ENV
        delete process.env.PINEPERKS_ENFORCE_IP_ALLOWLIST
    })

    afterAll(() => {
        process.env = OLD_ENV
    })

    it('allows a request from a sandbox Pine Perks IP through X-Forwarded-For', () => {
        const req = { headers: { 'x-forwarded-for': '43.205.75.55' }, socket: {} }
        const res = buildRes()
        const next = jest.fn()

        verifyPinePerksIp(req, res, next)

        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('takes the leftmost IP when X-Forwarded-For has multiple hops', () => {
        const req = { headers: { 'x-forwarded-for': '15.207.207.171, 10.0.0.5, 10.0.0.6' }, socket: {} }
        const res = buildRes()
        const next = jest.fn()

        verifyPinePerksIp(req, res, next)

        expect(next).toHaveBeenCalled()
    })

    it('checks production IPs when NODE_ENV is production', () => {
        process.env.NODE_ENV = 'production'
        const req = { headers: { 'x-forwarded-for': '13.126.149.221' }, socket: {} }
        const res = buildRes()
        const next = jest.fn()

        verifyPinePerksIp(req, res, next)

        expect(next).toHaveBeenCalled()
    })

    it('logs but still calls next() for an unrecognized IP when enforcement is off', () => {
        const req = { headers: { 'x-forwarded-for': '1.2.3.4' }, socket: {} }
        const res = buildRes()
        const next = jest.fn()

        verifyPinePerksIp(req, res, next)

        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('rejects with 403 for an unrecognized IP when enforcement is on', () => {
        process.env.PINEPERKS_ENFORCE_IP_ALLOWLIST = 'true'
        const req = { headers: { 'x-forwarded-for': '1.2.3.4' }, socket: {} }
        const res = buildRes()
        const next = jest.fn()

        verifyPinePerksIp(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
    })

    it('falls back to the socket remote address when X-Forwarded-For is absent', () => {
        const req = { headers: {}, socket: { remoteAddress: '::ffff:43.205.75.55' } }
        const res = buildRes()
        const next = jest.fn()

        verifyPinePerksIp(req, res, next)

        expect(next).toHaveBeenCalled()
    })
})
