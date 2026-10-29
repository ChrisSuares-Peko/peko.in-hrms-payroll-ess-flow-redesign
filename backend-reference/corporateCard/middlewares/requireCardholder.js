const ErrorResponse = require('../utils/error-response')
const { isCardholderSession } = require('../utils/cardHelpers')

module.exports = (req, res, next) => {
    if (!isCardholderSession(req)) {
        return next(new ErrorResponse('This action is available to cardholders only.', 403))
    }
    return next()
}
