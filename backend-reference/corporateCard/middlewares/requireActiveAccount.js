const ErrorResponse = require('../utils/error-response')
const { customLog } = require('../utils/loggerHelper')
const { findByCorporate } = require('../models/use-cases/corporateCardAdminApplication')

const CLOSED_MESSAGE = 'This Corporate Cards account is closed. Complete KYB again to start using cards.'

const requireActiveAccount = async (req, res, next) => {
    try {
        const corporateId = req.user?.corporateId
        if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

        const application = await findByCorporate(corporateId)
        if (!application) {
            customLog(req?.LogTraceId, 'info', {
                message: '[AccountClosure] Refused a card operation for a corporate with no live application',
                corporateId,
                path: req.originalUrl,
            }, 'CONSOLE')
            return next(new ErrorResponse(CLOSED_MESSAGE, 403))
        }

        return next()
    } catch (error) {
        return next(error)
    }
}

module.exports = { requireActiveAccount, CLOSED_MESSAGE }
