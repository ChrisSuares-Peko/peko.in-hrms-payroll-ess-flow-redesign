const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const { pinelabsRequest, isPinelabsSuccess, resolvePinelabsCredsForRequest } = require('../../utils/pinelabsGateway')
const { PINELABS_CARD_SCHEMES_PATH } = require('../../constants/pinelabs')
const { GENERIC_ERROR } = require('../../constants/messages')

exports.getCardSchemes = asyncHandler(async (req, res, next) => {
    const { error, statusCode, creds } = await resolvePinelabsCredsForRequest(req)
    if (error) return next(new ErrorResponse(error, statusCode))

    const result = await pinelabsRequest({
        method: 'get',
        path: PINELABS_CARD_SCHEMES_PATH,
        creds,
        logTraceId: req?.LogTraceId,
        label: 'Get card schemes',
    })

    if (!isPinelabsSuccess(result)) {
        customLog(req?.LogTraceId, 'error', {
            message: '[Pinelabs] Get card schemes failed',
            responseCode: result.data?.responseCode,
            responseMessage: result.data?.responseMessage,
            error: result.error,
        }, 'VENDOR')
        return next(new ErrorResponse(GENERIC_ERROR, 502))
    }

    return res.status(200).json({
        status: true,
        message: 'Card schemes fetched.',
        data: { cardSchemes: result.data.cardSchemeList || [] },
        responseCode: '000',
    })
})
