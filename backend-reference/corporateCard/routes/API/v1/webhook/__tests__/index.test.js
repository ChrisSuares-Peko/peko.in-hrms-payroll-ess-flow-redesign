jest.mock('../../../../../controllers/webhook/pinelabs', () => ({
    jit: jest.fn(),
    callback: jest.fn(),
    kyc: jest.fn(),
    walletTopup: jest.fn(),
    cardNotification: jest.fn(),
}))

const { verifyWebhookUser } = require('../index')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

describe('verifyWebhookUser', () => {
    it('calls next() when webhookUser is "pinelabs"', () => {
        const req = { params: { webhookUser: 'pinelabs' } }
        const res = buildRes()
        const next = jest.fn()

        verifyWebhookUser(req, res, next)

        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('rejects with 404 for any other webhookUser value', () => {
        const req = { params: { webhookUser: 'someone-else' } }
        const res = buildRes()
        const next = jest.fn()

        verifyWebhookUser(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(404)
    })

    it('rejects with 404 when webhookUser is missing', () => {
        const req = { params: {} }
        const res = buildRes()
        const next = jest.fn()

        verifyWebhookUser(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(404)
    })
})
