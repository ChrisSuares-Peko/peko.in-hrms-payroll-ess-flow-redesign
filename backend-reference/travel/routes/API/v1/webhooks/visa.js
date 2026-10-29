const express = require('express');
const { updateVisaStatus, updateVisaDocumentStatus } = require('../../../../controllers/corporate/visaWebhook');
const router = express.Router({ mergeParams: true });

router.post('/update-status', updateVisaStatus);
router.post('/update-document-status', updateVisaDocumentStatus);

module.exports = router;
