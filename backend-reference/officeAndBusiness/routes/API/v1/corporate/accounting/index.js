const express = require('express');
const router = express.Router({ mergeParams: true });

// Accounting domain — mount sub-resources here (transactions, and others later).
// Note: service-access/cashback gating (requireServiceCashback) was removed; accounting
// endpoints are available to any authenticated corporate user.
router.use('/transactions', require('./transactions'));
router.use('/financial-accounts', require('./financialAccounts'));
router.use('/reports', require('./reports'));

module.exports = router;
