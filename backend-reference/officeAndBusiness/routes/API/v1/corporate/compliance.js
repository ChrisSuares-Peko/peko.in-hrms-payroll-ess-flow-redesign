const express = require('express');
const router = express.Router({ mergeParams: true });

const {
    getAllCompliance,
    getComplianceDetail,
    createCompliance,
    submitDocuments,
    getDashboardSummary,
    downloadComplianceDocument,
} = require('../../../../controllers/corporate/compliance');

const {
    validateCreateCompliance,
    validateSubmitDocuments,
} = require('../../../../utils/validationSchemas/compliance');

router.get('/find-all', getAllCompliance);
router.get('/dashboard/summary', getDashboardSummary);
router.get('/find', getComplianceDetail);
router.get('/document/download', downloadComplianceDocument);
router.post('/', validateCreateCompliance, createCompliance);
router.put('/:complianceId/submit-documents', validateSubmitDocuments, submitDocuments);

module.exports = router;
