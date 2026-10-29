const express = require('express');
const router = express.Router({ mergeParams: true });
const { resolveEmailTemplateForService } = require('../../../../controllers/corporate/emailTemplates');
const { resolvePartnerDetailsForService } = require('../../../../controllers/corporate/partnerDetails');

router.post('/resolve', resolveEmailTemplateForService);
router.post('/partner-details', resolvePartnerDetailsForService);

module.exports = router;
