const router = require('express').Router({ mergeParams: true })
const { recordPhysicalCardPurchase } = require('../../../../controllers/webhook/physicalCardPurchase')
const { customLog } = require('../../../../utils/loggerHelper')
const { timingSafeEqual } = require('../../../../utils/timingSafeEqual')
const { PURCHASE_WEBHOOK_USER } = require('../../../../constants/physicalCardPurchase')

const verifyCallbackSecret = (req, res, next) => {
    const expected = process.env.CARD_PURCHASE_CALLBACK_SECRET
    if (!expected) {
        customLog(req?.LogTraceId, 'error', {
            message: '[PhysicalCardPurchase] CARD_PURCHASE_CALLBACK_SECRET is not configured — refusing the call',
            path: req.originalUrl,
        }, 'CONSOLE')
        return res.status(503).json({
            status: false,
            message: 'Service unavailable',
            data: {},
            responseCode: '001',
        })
    }

    if (req.params.webhookUser !== PURCHASE_WEBHOOK_USER
        || !timingSafeEqual(req.headers['x-card-purchase-secret'], expected)) {
        customLog(req?.LogTraceId, 'error', {
            message: '[PhysicalCardPurchase] Rejected an unauthenticated purchase callback',
            webhookUser: req.params.webhookUser,
            path: req.originalUrl,
        }, 'CONSOLE')
        return res.status(401).json({
            status: false,
            message: 'Unauthorized',
            data: {},
            responseCode: '002',
        })
    }

    return next()
}

router.use(verifyCallbackSecret)
router.post('/', recordPhysicalCardPurchase)

module.exports = router
module.exports.verifyCallbackSecret = verifyCallbackSecret
