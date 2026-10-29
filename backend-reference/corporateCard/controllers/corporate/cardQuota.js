const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { resolvePinelabsCredsForRequest } = require('../../utils/pinelabsGateway')
const {
    resolveCardBaseLimit,
    resolveCardUnitPrice,
    resolvePhysicalCardQuota,
} = require('../../utils/cardQuota')

exports.getCardQuota = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const { error, statusCode, serviceDetails } = await resolvePinelabsCredsForRequest(req)
    if (error) return next(new ErrorResponse(error, statusCode))

    const quota = await resolvePhysicalCardQuota({
        corporateId,
        baseLimit: resolveCardBaseLimit(serviceDetails),
        unitPrice: resolveCardUnitPrice(serviceDetails),
    })

    return res.status(200).json({
        status: true,
        message: 'Physical card allowance fetched.',
        data: quota,
        responseCode: '000',
    })
})
