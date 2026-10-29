const express = require('express');
const router = express.Router({ mergeParams: true });
const { payment } = require('../../../../controllers/corporate/companyIncorporation');

router.post('/payment', payment);

module.exports = router;
