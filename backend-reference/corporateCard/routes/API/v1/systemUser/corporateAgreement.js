const express = require('express');
const router = express.Router({ mergeParams: true });

const {
    getCorporateAgreementForAdmin,
    regenerateCorporateAgreement,
} = require('../../../../controllers/admin/corporateAgreement');

router.get('/:corporateId', getCorporateAgreementForAdmin);
router.post('/:corporateId/regenerate', regenerateCorporateAgreement);

module.exports = router;
