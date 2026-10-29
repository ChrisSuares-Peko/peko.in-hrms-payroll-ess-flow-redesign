const express = require('express')
const { getCountries, getPlans, getPlanDetails, getPlansTop, getEsimQRCode, getEsimQDetails, getRegions, getPlansByRegion } = require('../../../../controllers/corporate/eSIM')
const { getEsimQDetailsValidation } = require('../../../../utils/queryValidation')
const { checkServiceEnabled } = require('../../../../middlewares/disableServiceCheck')
const operatorsData = require('../../../../utils/operatorsData.json')
const router = express.Router()
const accessKey = operatorsData.eSIM.accessKey

router.use(checkServiceEnabled(accessKey))
router.get('/countries', getCountries)
router.get('/regions', getRegions)
router.get('/plans/region/:regionCode', getPlansByRegion)
router.get('/plans/:country', getPlans)
router.post('/planDetails', getPlanDetails)
router.get('/planTopUp/:planId', getPlansTop)
router.get('/getQrCode/:esimId', getEsimQRCode)
router.get('/getEsimDetails', getEsimQDetailsValidation, getEsimQDetails)

module.exports = router