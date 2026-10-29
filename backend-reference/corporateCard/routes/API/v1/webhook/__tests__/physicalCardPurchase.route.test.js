jest.mock('../../../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../../../../controllers/webhook/physicalCardPurchase', () => ({
    recordPhysicalCardPurchase: jest.fn(),
}))

const { verifyCallbackSecret } = require('../physicalCardPurchase')

const SECRET = 'shhh'

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const NO_HEADER = Symbol('no header')

const call = ({ webhookUser = 'paymentgateway', header = SECRET } = {}) => {
    const req = {
        params: { webhookUser },
        headers: header === NO_HEADER ? {} : { 'x-card-purchase-secret': header },
        originalUrl: '/api/v1/webhook/paymentgateway/corporate-cards/physical-card-purchase',
        LogTraceId: 't',
    }
    const res = buildRes()
    const next = jest.fn()
    verifyCallbackSecret(req, res, next)
    return { res, next }
}

beforeEach(() => {
    jest.clearAllMocks()
    process.env.CARD_PURCHASE_CALLBACK_SECRET = SECRET
})

afterEach(() => {
    delete process.env.CARD_PURCHASE_CALLBACK_SECRET
})

describe('the purchase callback guard', () => {
    it('lets a correctly signed call through', () => {
        const { next, res } = call()

        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    /**
     * This endpoint grants a paid entitlement. An unset secret must refuse, never wave the call through —
     * a missing env var in a fresh environment would otherwise mint free cards to anyone who found the URL.
     */
    it('refuses with 503 when the secret is not configured', () => {
        delete process.env.CARD_PURCHASE_CALLBACK_SECRET

        const { next, res } = call()

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(503)
    })

    it.each([
        ['a wrong secret', { header: 'nope' }],
        ['no secret header at all', { header: NO_HEADER }],
        ['the wrong webhook user', { webhookUser: 'pinelabs' }],
    ])('rejects %s with 401', (_label, over) => {
        const { next, res } = call(over)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(401)
    })

    it('does not leak the expected secret in the response', () => {
        const { res } = call({ header: 'nope' })

        expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain(SECRET)
    })
})
