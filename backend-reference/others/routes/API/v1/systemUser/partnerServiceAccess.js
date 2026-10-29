const express = require('express');
const {
    findAllPartnerServiceAccess,
    replacePartnerServiceAccess,
    updatePartnerServiceAccess,
    deletePartnerServiceAccess,
} = require('../../../../controllers/admin/partnerServiceAccess');
const {
    validatePartnerServiceAccess,
    validatePartnerServiceAccessUpdate,
} = require('../../../../utils/apiValidation');
const { validatePartnerServiceAccessQuery } = require('../../../../utils/queryValidation');

const router = express.Router();

router.get('/', validatePartnerServiceAccessQuery, findAllPartnerServiceAccess);
router.post('/', validatePartnerServiceAccess, replacePartnerServiceAccess);
router.patch('/:id', validatePartnerServiceAccessUpdate, updatePartnerServiceAccess);
router.delete('/:id', deletePartnerServiceAccess);

module.exports = router;
