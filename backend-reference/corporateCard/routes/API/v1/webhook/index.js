const router = require('express').Router({ mergeParams: true })
const { jit, callback, kyc, walletTopup, cardNotification } = require('../../../../controllers/webhook/pinelabs')
const { customLog } = require('../../../../utils/loggerHelper')

const PINELABS_WEBHOOK_USER = 'pinelabs'

// TEMP DIAGNOSTIC (ticket 30577): first-line tracer for every webhook arrival, before any guard.
// Logs which headers came (names + secret presence only, never values). REMOVE after staging debug.
router.use((req, res, next) => {
    customLog(req?.LogTraceId, 'info', {
        message: '[WebhookDebug] request reached corporateCard webhook router',
        method: req.method,
        path: req.originalUrl,
        webhookUser: req.params.webhookUser,
        headerNames: Object.keys(req.headers || {}),
        hasCronSecret: !!req.headers['x-cron-callback-secret'],
        hasCardPurchaseSecret: !!req.headers['x-card-purchase-secret'],
        hasEsignSecret: !!req.headers['x-esign-callback-secret'],
        hasPinePerksUser: !!req.headers['x-pineperks-username'],
    }, 'VENDOR')
    next()
})

const verifyWebhookUser = (req, res, next) => {
    if (req.params.webhookUser !== PINELABS_WEBHOOK_USER) {
        customLog(req?.LogTraceId, 'error', {
            message: '[Pinelabs] Unknown webhookUser on corporate-cards webhook route',
            webhookUser: req.params.webhookUser,
            path: req.originalUrl,
        }, 'VENDOR')
        return res.status(404).json({ status: false, message: 'Not found', data: {}, responseCode: '004' })
    }
    next()
}

router.use('/e-sign', require('./corporateCardESign'))
router.use('/cron', require('./cron'))
router.use('/physical-card-purchase', require('./physicalCardPurchase'))
router.use('/in-app', require('./inAppPayment'))

router.use(verifyWebhookUser)
router.post('/jit', jit)
router.post('/callback', callback)
router.post('/kyc', kyc)
router.post('/wallet-topup', walletTopup)
router.post('/card-notification', cardNotification)

module.exports = router
module.exports.verifyWebhookUser = verifyWebhookUser
