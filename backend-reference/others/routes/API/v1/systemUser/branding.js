const express = require('express');
const { updateBranding, findAllBranding, brandingExcelCSV, brandingPDF, updateBrandingStatus } = require('../../../../controllers/admin/branding');
const { updateWhitelabelShare } = require('../../../../controllers/admin/accountingCatalog');
const { validateBrandingQuery } = require('../../../../utils/queryValidation');
const { validatePartnerShare } = require('../../../../utils/apiValidation');
const router = express.Router()

router.get('/', validateBrandingQuery, findAllBranding)
router.get('/pdf',validateBrandingQuery, brandingPDF)
router.get('/:type',validateBrandingQuery, brandingExcelCSV)
router.put('/:id', updateBranding)
router.patch('/updateStatus/:id', updateBrandingStatus)
router.patch('/:id/share', validatePartnerShare, updateWhitelabelShare)

module.exports = router