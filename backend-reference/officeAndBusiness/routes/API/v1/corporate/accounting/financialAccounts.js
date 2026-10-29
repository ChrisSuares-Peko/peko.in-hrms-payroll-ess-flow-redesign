const express = require('express');

const router = express.Router({ mergeParams: true });

const {
    getFinancialAccounts,
    createFinancialAccount,
} = require('../../../../../controllers/corporate/financialAccount');
const { validateCreateFinancialAccount } = require('../../../../../utils/apiValidation');

router.get('/', getFinancialAccounts);
router.post('/', validateCreateFinancialAccount, createFinancialAccount);

module.exports = router;
