// Platform-wide settings (default service permissions, partner sidebar, admin alert WhatsApp numbers) are
// admin-only. The role comes from the Redis session (req.user), never from the request.
const { FORBIDDEN, PERMISSION_DENIED } = require('../utils/responseCodes')

const requireSystemUser = (req, res, next) => {
    if (req.user?.role === 'SYSTEM_USER') return next()
    return res.status(403).json({
        status: false,
        message: PERMISSION_DENIED,
        data: {},
        responseCode: FORBIDDEN,
    })
}

module.exports = { requireSystemUser }
