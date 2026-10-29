const { PERMISSION_DENIED } = require('../constants/messages')
const RESPONSE_CODE = require('../constants/responseCodes')
const { activeRoleName, actsAsOwner } = require('../utils/cardHelpers')
const { hasPermission, ALL_KEYS } = require('../utils/cardRoles')

const requirePermission = (key) => {
    if (!ALL_KEYS.has(key)) {
        throw new Error(`requirePermission: unknown permission key '${key}'`)
    }

    return (req, res, next) => {
        if (actsAsOwner(req)) return next()

        if (hasPermission(activeRoleName(req), key)) return next()

        return res.status(403).json({
            status: false,
            message: PERMISSION_DENIED,
            data: {},
            responseCode: RESPONSE_CODE.FORBIDDEN,
        })
    }
}

module.exports = { requirePermission }
