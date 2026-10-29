const { getValue } = require('./cacheDataMethods')

exports.resolveSessionUser = async (req) => {
    const sessionKey = req.headers['x-user-key']
    if (sessionKey) {
        const cached = await getValue(`userData_${sessionKey}`)
        if (!cached) return null
        return typeof cached === 'string' ? JSON.parse(cached) : cached
    }
    const { userdata } = req.headers
    if (!userdata) return null
    return JSON.parse(decodeURI(userdata))
}

exports.verifyToken = async (req, res, next) => {
    try {
        req.user = await exports.resolveSessionUser(req)

        if (!req.user) {
            return res.status(401).json({
                status: false,
                message: 'Unauthorized',
                data: {},
                responseCode: '002',
            })
        }

        return next()
    } catch (err) {
        return res.status(401).json({
            status: false,
            message: err.message,
            data: {},
            responseCode: err.message === 'jwt expired' ? '002' : '001',
        })
    }
}
