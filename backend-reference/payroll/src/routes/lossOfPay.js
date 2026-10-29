const express = require('express');
const router = express.Router({ mergeParams: true });
const { getLossOfPaySheet, saveLossOfPaySheet } = require('../controller/lossOfPay');

router.get('/', getLossOfPaySheet);
router.put('/', saveLossOfPaySheet);

module.exports = router;
