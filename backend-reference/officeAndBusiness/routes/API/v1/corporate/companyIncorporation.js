const express = require('express');
const router = express.Router({ mergeParams: true });
const {
    getLandingConfig,
    submitApplication,
    uploadDocument,
    getApplications,
    getApplicationDetail,
    getApplicationDocuments,
    downloadVendorDocument,
    getNIC,
} = require('../../../../controllers/corporate/companyIncorporation');
const { validateSubmitApplication } = require('../../../../middlewares/validateCompanyIncorporation');

router.get('/config', getLandingConfig);
router.post('/apply', validateSubmitApplication, submitApplication);
router.post('/upload-document', uploadDocument);
router.get('/applications', getApplications);
router.get('/applications/:applicationId', getApplicationDetail);
router.get('/applications/:applicationId/documents', getApplicationDocuments);
router.get('/applications/:applicationId/documents/download', downloadVendorDocument);
router.get("/nic", getNIC);

module.exports = router;
