const express = require('express');
const router = express.Router({ mergeParams: true });
const {
    getAllQuoteRequestsList,
    updateQuoteRequestStatus,
    exportQuoteRequests,
} = require('../../../../controllers/admin/garageQuoteRequest');
const { validateQuoteRequestStatus } = require('../../../../utils/apiValidation');

router.get('/', getAllQuoteRequestsList);
router.get('/export/:type', exportQuoteRequests);
router.put('/status/:id', validateQuoteRequestStatus, updateQuoteRequestStatus);

module.exports = router;
