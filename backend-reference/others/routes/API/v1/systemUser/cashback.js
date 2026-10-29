const express = require('express')
const {
     findAllPackageCashbackAndCount,
     getSubscriptionAddOns,
     createCashback,
     updateCashback,
     deleteCashback,
     updateStatus,
     packageCashbackAndCountPDF,
     packageCashbackAndCountExcelCSV,
     getCopyCashbackCompare,
     clonePackageToTargetPartner,
     addCashbacksToPackage,
     // bulkCreateCashback
} = require('../../../../controllers/admin/cashback')
const { fetchServiceOperator, checkCashbackServiceOperator } = require('../../../../controllers/admin/serviceOperator')
const { findAllPackage, findAllServicePackage } = require('../../../../controllers/admin/package')
const router = express.Router()

const { validateCashback, validateServiceStatus, validateClonePackageToPartner, validateAddCashbacksToPackage } = require('../../../../utils/apiValidation')
const { validatePackageCashbackQuery, validateServicePackagesQuery, validateCheckCashbackServiceOperator, validateCopyCashbackCompareQuery } = require('../../../../utils/queryValidation')

router.post('/', validateCashback, createCashback)//✅
router.get('/copy/compare', validateCopyCashbackCompareQuery, getCopyCashbackCompare)
router.post('/copy/clone-package', validateClonePackageToPartner, clonePackageToTargetPartner)
router.post('/copy/add-to-package', validateAddCashbacksToPackage, addCashbacksToPackage)
router.get('/transactions', validatePackageCashbackQuery, findAllPackageCashbackAndCount)//✅
router.get('/subscription-add-ons', getSubscriptionAddOns)
router.get('/transactions/pdf', validatePackageCashbackQuery, packageCashbackAndCountPDF)//✅
router.get('/transactions/:type', validatePackageCashbackQuery, packageCashbackAndCountExcelCSV)//✅
router.put('/:id', validateCashback, updateCashback)//✅
router.put('/updateStatus/:id', validateServiceStatus, updateStatus)//✅
router.get('/packages', findAllPackage)//✅
router.get('/fetchServiceOperator', fetchServiceOperator)//✅
router.delete('/:id', deleteCashback)//✅
router.get('/servicePackages', validateServicePackagesQuery, findAllServicePackage)
router.get('/checkCashbackServiceOperator',validateCheckCashbackServiceOperator, checkCashbackServiceOperator)
// router.post('/bulk-create', bulkCreateCashback)

module.exports = router
