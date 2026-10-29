const express = require('express')
const router = express.Router()
const { leadGenerator, callbackApiOnMidCreation, callbackApiOnDeviceActivation, getLead } = require('../../../../controllers/corporate/leadGenerator')
const { verifyToken } = require('../../../../middlewares/verifyLeadToken')

router.post('/generation', leadGenerator)
router.post('/details', getLead)
router.post('/mid-creation/callback', verifyToken, callbackApiOnMidCreation)
router.post('/device-activation/callback', verifyToken, callbackApiOnDeviceActivation)

module.exports = router