const asyncHandler = require('../../middlewares/async')
const { sweepStaleInAppPayments } = require('../../services/inAppPaymentSweep')

exports.runInAppPaymentSweep = asyncHandler(async (req, res) => {
    const counters = await sweepStaleInAppPayments({ logTraceId: req?.LogTraceId })
    return res.status(200).json({
        status: true,
        message: 'In-app payment sweep completed.',
        data: counters,
        responseCode: '000',
    })
})
