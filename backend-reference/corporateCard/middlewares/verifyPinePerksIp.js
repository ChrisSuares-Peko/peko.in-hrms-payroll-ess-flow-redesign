const { customLog } = require('../utils/loggerHelper')

const PINE_PERKS_IPS = {
    production: ['13.200.122.175', '13.126.149.221', '18.61.118.3'],
    sandbox: ['43.205.75.55', '15.207.207.171'],
}

const allowedIps = () => (process.env.NODE_ENV === 'production' ? PINE_PERKS_IPS.production : PINE_PERKS_IPS.sandbox)

const callerIp = (req) => {
    const forwarded = req.headers['x-forwarded-for']
    const candidate = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress
    return (candidate || '').replace(/^::ffff:/, '')
}

const verifyPinePerksIp = (req, res, next) => {
    const ip = callerIp(req)
    const matched = allowedIps().includes(ip)

    customLog(req?.LogTraceId, matched ? 'info' : 'error', {
        message: matched
            ? '[Pinelabs] Caller IP allow-list check passed'
            : '[Pinelabs] Caller IP not in the Pine Perks allow-list',
        callerIp: ip,
        xForwardedFor: req.headers['x-forwarded-for'] || null,
        enforced: process.env.PINEPERKS_ENFORCE_IP_ALLOWLIST === 'true',
    }, 'VENDOR')

    if (matched) return next()

    if (process.env.PINEPERKS_ENFORCE_IP_ALLOWLIST === 'true') {
        return res.status(403).json({ status: false, message: 'Forbidden', data: {}, responseCode: '004' })
    }
    next()
}

module.exports = verifyPinePerksIp
