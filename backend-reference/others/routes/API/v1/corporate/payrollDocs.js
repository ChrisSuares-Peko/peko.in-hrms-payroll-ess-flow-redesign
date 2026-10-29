const express = require('express');
const { listPayrollTemplatesByCategory /*, vendorDetails */ } = require('../../../../controllers/corporate/payrollDocs');
const router = express.Router({ mergeParams: true })

router.get('/templates', listPayrollTemplatesByCategory);
// F-OTH-21: disabled — leaked vendor API credentials (vendor.apiUrl/optional1-5) to any
// corporate session via an arbitrary accessKey in the request body. No legitimate caller
// was found (checked corporateCard and the frontend). The proper channel already exists:
// /corporate/:corporateId/others/internal/service-operators/by-access-key/:accessKey,
// which is allowlisted to the corporate_cards service specifically.
// router.post('/vendorDetails', vendorDetails)

module.exports = router
