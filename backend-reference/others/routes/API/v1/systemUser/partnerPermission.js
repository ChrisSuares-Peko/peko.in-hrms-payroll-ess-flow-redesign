const express = require('express');
const { createPartnerPermission, updatePartnerPermission, findAllPartnerPermission, findOnePartnerPermission, partnerPermissionPDF, partnerPermissionExcelCSV, copyPartnerPermissionIcons, clonePartnerPermission } = require('../../../../controllers/admin/partnerPermission');
const { validatePartnerPermission, validatePartnerPermisssionStatus, validatePartnerPermissionSourceTarget } = require('../../../../utils/apiValidation');
const { validateFindAllPartnerPermission } = require('../../../../utils/queryValidation');
const router = express.Router()


router.get("/", validateFindAllPartnerPermission, findAllPartnerPermission);
router.get('/pdf',validateFindAllPartnerPermission, partnerPermissionPDF)
// Numeric-constrained so it doesn't swallow /:type (excel/csv export) below — Express
// matches routes in registration order, and both are single unconstrained-looking segments.
router.get('/:id', findOnePartnerPermission)
router.get('/:type',validateFindAllPartnerPermission, partnerPermissionExcelCSV)
router.post('/clone', validatePartnerPermissionSourceTarget, clonePartnerPermission)
router.post('/copy-icons', validatePartnerPermissionSourceTarget, copyPartnerPermissionIcons)
router.post('/',validatePartnerPermission, createPartnerPermission)
router.put('/:id',validatePartnerPermission, updatePartnerPermission)
router.patch('/updateStatus/:id',validatePartnerPermisssionStatus, updatePartnerPermission)

module.exports = router