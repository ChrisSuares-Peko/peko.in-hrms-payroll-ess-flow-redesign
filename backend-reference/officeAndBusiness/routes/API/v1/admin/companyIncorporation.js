const express = require('express');
const router = express.Router({ mergeParams: true });
const {
    getAllApplications,
    getApplicationDetail,
} = require('../../../../controllers/admin/companyIncorporation');

router.get('/applications', getAllApplications);
router.get('/applications/*', (req, res, next) => {
    req.params.applicationId = req.params[0];
    next();
}, getApplicationDetail);

module.exports = router;
