const ErrorResponse = require('../utils/error-response')
const { isCorporateOwner, isCardholderSession } = require('../utils/cardHelpers')
const { findOwnerCardholder } = require('../utils/sharedDirectory')
const { customLog } = require('../utils/loggerHelper')
const { CARDHOLDER_ONLY, OWNER_PROFILE_REQUIRED } = require('../constants/messages')
const CARD_SERVICE_LABEL = require('../constants/service')

module.exports = async (req, res, next) => {
    if (isCardholderSession(req)) return next()

    if (!isCorporateOwner(req)) {
        return next(new ErrorResponse(CARDHOLDER_ONLY, 403))
    }

    let owner
    try {
        owner = await findOwnerCardholder(req)
    } catch (err) {
        customLog(req?.LogTraceId, 'error', {
            message: '[OwnerCardholder] Could not resolve the owner cardholder profile for KYC',
            corporateId: req.user?.corporateId,
            error: err?.message,
        }, 'CONSOLE')
        return next(new ErrorResponse('Your cardholder profile is unavailable right now. Please try again.', 503))
    }

    if (!owner?.id) {
        return next(new ErrorResponse(OWNER_PROFILE_REQUIRED, 409))
    }

    req.user.employeeProfileId = String(owner.id)
    req.user.employeeName = owner.name
    req.user.employeeEmail = owner.email
    req.user.employeeMobile = owner.mobileNo
    req.user.serviceMemberships = [{
        label: CARD_SERVICE_LABEL,
        hasAccess: true,
        role: owner.role ?? null,
        status: owner.status || 'ACTIVE',
        ref: null,
    }]
    return next()
}
