const express = require('express');
const router = express.Router({ mergeParams: true });

const {
    getAllComplianceAdmin,
    getComplianceDetailAdmin,
    updateComplianceStatus,
    getComplianceDocumentsAdmin,
    downloadComplianceDocument,
} = require('../../../../controllers/admin/compliance');

const {
    validateUpdateComplianceStatus,
} = require('../../../../utils/validationSchemas/compliance');

router.get('/find-all', getAllComplianceAdmin);
router.get('/document/download', downloadComplianceDocument);
router.get('/find', getComplianceDetailAdmin);
router.get('/:complianceId/documents', getComplianceDocumentsAdmin);
router.put('/update-status', validateUpdateComplianceStatus, updateComplianceStatus);
router.patch('/update-status', validateUpdateComplianceStatus, updateComplianceStatus);

module.exports = router;
