const express = require('express');
const {
    adminListGlobalBusinessSetupApplications,
    adminListGlobalBusinessSetupRenewals,
    adminExportGlobalBusinessSetupApplicationsCSVExcel,
    adminExportGlobalBusinessSetupApplicationsPDF,
    adminExportGlobalBusinessSetupRenewalsCSVExcel,
    adminExportGlobalBusinessSetupRenewalsPDF,
} = require('../../../../controllers/admin/globalBusinessSetup');

const router = express.Router();

// Admin Reports — read-only views of the officeAndBusiness Mongo cache
// (GlobalBusinessSetupApplication / GlobalBusinessSetupRenewal). No vendor
// calls; data is reconciled by the Pub/Sub subscriber after corporate payments.
router.get('/applications', adminListGlobalBusinessSetupApplications);
router.get('/renewals', adminListGlobalBusinessSetupRenewals);

// PDF route declared BEFORE the generic /:type catcher so 'pdf' doesn't
// match the excel/csv handler.
router.get('/applications/download/pdf', adminExportGlobalBusinessSetupApplicationsPDF);
router.get('/applications/download/:type', adminExportGlobalBusinessSetupApplicationsCSVExcel);
router.get('/renewals/download/pdf', adminExportGlobalBusinessSetupRenewalsPDF);
router.get('/renewals/download/:type', adminExportGlobalBusinessSetupRenewalsCSVExcel);

module.exports = router;
