const router = require('express').Router({ mergeParams: true })
const { updateAgreementEsignStatus } = require('../../../../controllers/webhook/esignStatus')
const { customLog } = require('../../../../utils/loggerHelper')
const { timingSafeEqual } = require('../../../../utils/timingSafeEqual')

const ESIGN_WEBHOOK_USER = 'officeandbusiness'

const verifyCallbackSecret = (req, res, next) => {
    const expected = process.env.ESIGN_CALLBACK_SECRET
    if (!expected) {
        customLog(req?.LogTraceId, 'error', {
            message: '[eSign Callback] ESIGN_CALLBACK_SECRET is not configured — refusing the call',
            path: req.originalUrl,
        }, 'CONSOLE')
        return res.status(503).json({
            status: false,
            message: 'Service unavailable',
            data: {},
            responseCode: '001',
        })
    }

    if (req.params.webhookUser !== ESIGN_WEBHOOK_USER
        || !timingSafeEqual(req.headers['x-esign-callback-secret'], expected)) {
        customLog(req?.LogTraceId, 'error', {
            message: '[eSign Callback] Rejected an unauthenticated status callback',
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
router.put('/status', updateAgreementEsignStatus)

module.exports = router
module.exports.verifyCallbackSecret = verifyCallbackSecret
