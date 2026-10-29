const router = require('express').Router({ mergeParams: true })
const { verifyCallbackSecret } = require('./physicalCardPurchase')
const { eligibility, redeem, cancel } = require('../../../../controllers/webhook/inAppPayment')

// paymentGateway → corporateCard, same shared secret and webhookUser as the physical card purchase callback.
router.use(verifyCallbackSecret)
router.post('/eligibility', eligibility)
router.post('/redeem', redeem)
router.post('/cancel', cancel)

module.exports = router
