const express = require('express')
const router = express.Router()
const { compatibleDeviceList, fetchPackages, fetchCountries, findAllRecordsAndCount, findOnePackageDetails, availableTopups, packageHistory, findAllRecordsOrderListAndCount, findAllRecordsTopUpListAndCount, getBulkPaymentStatus } = require('../../../../controllers/corporate/eSIM')
const { validatePackageDetailsQuery, validateFetchPackagesQuery, validateOrderPackageListQuery, validateTopupListQuery, validateCountriesQuery } = require('../../../../utils/apiValidation/queryValidation')
const operatorsData = require('../../../../utils/operatorsData.json')
const { checkServiceEnabled } = require('../../../../middlewares/disableServiceCheck')
const accessKey = operatorsData.eSIM.accessKey

router.use(checkServiceEnabled(accessKey))
router.get('/countries',validateCountriesQuery, fetchCountries)
router.get('/compatibleDevice', compatibleDeviceList)
router.get('/packages', validateFetchPackagesQuery, fetchPackages)
router.get('/orderPackageList', validateOrderPackageListQuery, findAllRecordsOrderListAndCount)
router.get('/topupList', validateTopupListQuery, findAllRecordsTopUpListAndCount)
router.get('/packageList', findAllRecordsAndCount)
router.get('/packages/details', validatePackageDetailsQuery, findOnePackageDetails)
router.get('/topup/plans/:iccid', availableTopups)
router.get('/package/history/:iccid', packageHistory)
router.get('/bulk-payment/status/:batchId', getBulkPaymentStatus)

// router.get('/supported-devices', supportedDevices)

module.exports = router