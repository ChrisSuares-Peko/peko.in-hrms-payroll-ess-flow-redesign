const express = require('express');
const { getCountryFlags } = require('../../../../controllers/corporate/visa');
const router = express.Router({ mergeParams: true });

router.get('/', getCountryFlags);

module.exports = router;
