const express = require('express');
const router = express.Router({ mergeParams: true });
const {
    getAllApplications,
    getApplicationDetail,
    retryVendorChain,
} = require('../../../../controllers/admin/businessRegistration');

router.get('/applications', getAllApplications);
// Wildcards because applicationId contains slashes (BR/2026/xxxxx).
router.post('/applications/*/send-to-vendor', (req, res, next) => {
    req.params.applicationId = req.params[0];
    next();
}, retryVendorChain);
router.get('/applications/*', (req, res, next) => {
    req.params.applicationId = req.params[0];
    next();
}, getApplicationDetail);

module.exports = router;
