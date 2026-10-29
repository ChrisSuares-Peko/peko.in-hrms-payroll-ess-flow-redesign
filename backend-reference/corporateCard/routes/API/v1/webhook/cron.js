const router = require('express').Router({ mergeParams: true })
const { runDailyBalanceReminderSweep, runWalletTopupGuideSweep } = require('../../../../controllers/systemUser/notificationJobs')
const { runInAppPaymentSweep } = require('../../../../controllers/systemUser/inAppPaymentJobs')
const { customLog } = require('../../../../utils/loggerHelper')
const { timingSafeEqual } = require('../../../../utils/timingSafeEqual')

const CRON_WEBHOOK_USER = 'scheduler'

const verifyCronSecret = (req, res, next) => {
    const expected = process.env.CRON_CALLBACK_SECRET
    if (!expected) {
        customLog(req?.LogTraceId, 'error', {
            message: '[Cron Callback] CRON_CALLBACK_SECRET is not configured — refusing the call',
            path: req.originalUrl,
        }, 'CONSOLE')
        return res.status(503).json({
            status: false,
            message: 'Service unavailable',
            data: {},
            responseCode: '001',
        })
    }

    if (req.params.webhookUser !== CRON_WEBHOOK_USER
        || !timingSafeEqual(req.headers['x-cron-callback-secret'], expected)) {
        customLog(req?.LogTraceId, 'error', {
            message: '[Cron Callback] Rejected an unauthenticated cron trigger',
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

router.use(verifyCronSecret)
router.post('/daily-balance-reminder-sweep', runDailyBalanceReminderSweep)
router.post('/wallet-topup-guide-sweep', runWalletTopupGuideSweep)
router.post('/in-app-payment-sweep', runInAppPaymentSweep)

module.exports = router
module.exports.verifyCronSecret = verifyCronSecret
