const express = require('express');
const router = express.Router();
const {
    getBeneficiaries,
    addBeneficiary,
    verifyBeneficiary,
    modifyBeneficiary,
} = require('../controller/beneficiary');
const { verifyAccount, bulkVerifyAccounts } = require('../controller/verifyAccount');

router.post('/verify-account', verifyAccount);
router.post('/bulk-verify-accounts', bulkVerifyAccounts);
router.get('/', getBeneficiaries);
router.post('/add', addBeneficiary);
router.post('/verify', verifyBeneficiary);
router.post('/modify', modifyBeneficiary);
router.post('/update', modifyBeneficiary);

module.exports = router;
