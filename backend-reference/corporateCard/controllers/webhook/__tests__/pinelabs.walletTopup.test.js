const { walletTopup } = require('../pinelabs')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

describe('walletTopup', () => {
    it('always 200-acknowledges the wallet top-up notification (log-only for now)', async () => {
        const req = { originalUrl: '/webhook/pinelabs/wallet-topup', body: { amount: 5000, utr: 'UTR123' }, LogTraceId: 't' }
        const res = buildRes()

        await walletTopup(req, res)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({ status: true, message: 'Acknowledged', data: {}, responseCode: '000' })
    })

    it('still acknowledges even with an unexpected/empty payload', async () => {
        const req = { originalUrl: '/webhook/pinelabs/wallet-topup' }
        const res = buildRes()

        await walletTopup(req, res)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: true, responseCode: '000' }))
    })
})
