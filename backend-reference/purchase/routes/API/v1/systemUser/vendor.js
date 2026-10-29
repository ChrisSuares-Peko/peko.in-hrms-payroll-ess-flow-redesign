const express = require('express')
const router = express.Router()
const {
     createVendor,
     updateVendor,
     updateStatus,
     findAllVendorAndCount,
     fetchVendor,
     fetchVendors,
     vendorAndCountPDF,
     vendorAndCountExcelCSV,
     // getExcel
} = require('../../../../controllers/admin/vendor')

const { validateAddingVendor, validateUpdatingVendor, validateUpdateVendorStatus } = require('../../../../utils/apiValidation')
const { findAllVendorAndCountValidation } = require('../../../../utils/queryValidation')

router.post('/', validateAddingVendor, createVendor)
router.get('/', findAllVendorAndCountValidation, findAllVendorAndCount)
// router.get('/excel', getExcel)
router.get('/fetchAllVendors', fetchVendor)
router.get('/fetchVendorData', fetchVendors)
router.put('/:id', validateUpdatingVendor, updateVendor)
router.put('/updateStatus/:id', validateUpdateVendorStatus, updateStatus);
router.get('/pdf', findAllVendorAndCountValidation, vendorAndCountPDF)
router.get('/:type', findAllVendorAndCountValidation, vendorAndCountExcelCSV)

module.exports = router