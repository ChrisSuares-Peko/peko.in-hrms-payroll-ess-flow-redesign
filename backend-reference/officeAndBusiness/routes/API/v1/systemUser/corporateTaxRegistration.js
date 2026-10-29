const express = require('express');
const { findAllCorporateTaxRegistrationAndCount, updateTaxRegistrationStatus, corporateTaxRegistrationExcelCSV, corporateTaxRegistrationPDF } = require('../../../../controllers/admin/corporateTaxRegistration');
const { taxDocFileUpload } = require('../../../../middlewares/fileUpload');
const { validateCorporateTaxAdminUpdate } = require('../../../../utils/apiValidation');
const router = express.Router({ mergeParams: true })

router.get('/find-all', findAllCorporateTaxRegistrationAndCount)
router.get('/pdf', corporateTaxRegistrationPDF)
router.get('/:type', corporateTaxRegistrationExcelCSV)
router.put('/update-status/:registrationId', validateCorporateTaxAdminUpdate, taxDocFileUpload, updateTaxRegistrationStatus)

module.exports = router