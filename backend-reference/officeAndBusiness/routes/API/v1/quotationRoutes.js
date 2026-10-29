const express = require('express');
const router = express.Router();

const { respondToQuotation } = require('../../../controllers/corporate/invoicingV2');

// No auth middleware — these routes are accessible without login

// Called when customer clicks Accept/Reject button in quotation email
router.get('/respond', respondToQuotation);

module.exports = router;
