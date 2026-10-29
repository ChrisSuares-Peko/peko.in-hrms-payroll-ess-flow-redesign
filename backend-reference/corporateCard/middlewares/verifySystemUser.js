const { PERMISSION_DENIED } = require('../constants/messages')
const RESPONSE_CODE = require('../constants/responseCodes')

const verifySystemUser = (req, res, next) => {
    if (!req.user || req.user.role !== 'SYSTEM_USER') {
        return res.status(403).json({
            status: false,
            message: PERMISSION_DENIED,
            data: {},
            responseCode: RESPONSE_CODE.FORBIDDEN,
        })
    }
    if (req.params.userId != null && String(req.params.userId) !== String(req.user.id)) {
        return res.status(403).json({
            status: false,
            message: PERMISSION_DENIED,
            data: {},
            responseCode: RESPONSE_CODE.FORBIDDEN,
        })
    }
    return next()
}

module.exports = { verifySystemUser }
