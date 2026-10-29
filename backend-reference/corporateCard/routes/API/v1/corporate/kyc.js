const router = require('express').Router({ mergeParams: true })
const { initiateFullKyc, kycStatus } = require('../../../../controllers/corporate/pinelabsKyc')
const requireOwnCardholderIdentity = require('../../../../middlewares/requireOwnCardholderIdentity')

router.use(requireOwnCardholderIdentity)

router.post('/initiate', initiateFullKyc)
router.get('/status', kycStatus)

module.exports = router
