const { ACCOUNT_OWNER_ONLY } = require('../constants/messages')
const RESPONSE_CODE = require('../constants/responseCodes')
const { actsAsOwner } = require('../utils/cardHelpers')

const requireAccountOwner = (req, res, next) => {
    if (actsAsOwner(req)) {
        return next()
    }
    return res.status(403).json({
        status: false,
        message: ACCOUNT_OWNER_ONLY,
        data: {},
        responseCode: RESPONSE_CODE.FORBIDDEN,
    })
}

module.exports = { requireAccountOwner }
