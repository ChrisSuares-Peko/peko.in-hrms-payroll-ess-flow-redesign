const express = require('express')
const router = express.Router()
const {
     findAllPackagesAndCount,
     createPackage,
     updatePackageData,
     deletePackage,
     updatePackageStatus,
     getExcel,
     packagesAndCountPDF,
     packagesAndCountExcelCSV
} = require('../../../../controllers/admin/package')
const { updateSubscriptionPricing, updateSubscriptionPricingBulk, listSubscriptionPackages } = require('../../../../controllers/admin/accountingCatalog')
const { listProviders, preview, apply } = require('../../../../controllers/admin/packageSync')
const { validatePackage, validateActiveStatus, validatePackagePricing, validatePackagePricingBulk, validatePackageSyncPreview, validatePackageSyncApply } = require('../../../../utils/apiValidation');
const { validateFindAllPackagesQuery } = require('../../../../utils/queryValidation');

router.post('/',validatePackage, createPackage);//✅
router.put('/:id',validatePackage, updatePackageData);//✅
router.put('/updateStatus/:id',validateActiveStatus, updatePackageStatus);//✅
router.get('/all', validateFindAllPackagesQuery, findAllPackagesAndCount);
router.get('/getExcel', getExcel)
router.get('/pdf',validateFindAllPackagesQuery, packagesAndCountPDF)//✅
router.get('/sync/providers', listProviders)
router.post('/sync/preview', validatePackageSyncPreview, preview)
router.post('/sync/apply', validatePackageSyncApply, apply)
router.get('/:type',validateFindAllPackagesQuery, packagesAndCountExcelCSV)//✅
router.delete('/:id', deletePackage);//✅

router.get('/accounting/subscriptions', validateFindAllPackagesQuery, listSubscriptionPackages)
router.patch('/accounting/bulk', validatePackagePricingBulk, updateSubscriptionPricingBulk)
router.patch('/:id/accounting', validatePackagePricing, updateSubscriptionPricing)
module.exports = router