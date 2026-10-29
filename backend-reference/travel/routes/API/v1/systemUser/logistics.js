const express = require('express');
const router = express.Router();
const { fetchLogisticsCorporateDetails, adminUploadBusinessPan } = require('../../../../controllers/admin/logistics');

router.get('/', fetchLogisticsCorporateDetails);
router.post('/:credentialId/upload-business-pan', adminUploadBusinessPan);

module.exports = router;
