const express = require('express');
const router = express.Router({ mergeParams: true });
const {
    getAllApplications,
    getApplicationDetail,
    getApplicationDocuments,
    getIncorporationConfig,
    updateIncorporationConfig,
} = require('../../../../controllers/admin/companyIncorporation');

router.get('/config', getIncorporationConfig);
router.put('/config', updateIncorporationConfig);
router.get('/applications', getAllApplications);
router.get('/applications/*/documents', (req, res, next) => {
    req.params.applicationId = req.params[0];
    next();
}, getApplicationDocuments);
router.get('/applications/*', (req, res, next) => {
    req.params.applicationId = req.params[0];
    next();
}, getApplicationDetail);

module.exports = router;
