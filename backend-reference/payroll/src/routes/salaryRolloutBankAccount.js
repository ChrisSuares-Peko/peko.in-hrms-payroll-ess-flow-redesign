const express = require('express');
const router = express.Router({ mergeParams: true });
const {
    listAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    setPrimary,
} = require('../controller/salaryRolloutBankAccount');

router.get('/', listAccounts);
router.post('/', addAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);
router.patch('/:id/set-primary', setPrimary);

module.exports = router;
