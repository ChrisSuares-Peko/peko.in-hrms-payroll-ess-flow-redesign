const { PERMISSION_DENIED } = require('../constants/messages')
const RESPONSE_CODE = require('../constants/responseCodes')
const { isCorporateAdmin } = require('../utils/cardHelpers')

const verifyCorporateAdmin = (req, res, next) => {
    if (isCorporateAdmin(req)) {
        return next()
    }
    return res.status(403).json({
        status: false,
        message: PERMISSION_DENIED,
        data: {},
        responseCode: RESPONSE_CODE.FORBIDDEN,
    })
}

module.exports = { verifyCorporateAdmin }
