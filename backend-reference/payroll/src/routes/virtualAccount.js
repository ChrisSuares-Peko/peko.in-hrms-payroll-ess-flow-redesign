const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  onboardVirtualAccount,
  syncVirtualAccount,
  getVirtualAccountStatus,
  getVirtualAccountBalance,
} = require('../controller/virtualAccount');
const {
  verifyBankAccount,
  getBankAccountStatus,
} = require('../controller/bankAccount');
const {
  getPayrollAccountStatus,
} = require('../controller/payrollAccount');
const {
  createRemoveFundsRequest,
  getRemoveFundsRequests,
  getRemoveFundsRequestStatus,
} = require('../controller/virtualAccountWithdrawal');

// Virtual account (Decentro V2)
router.post('/virtual/onboard', onboardVirtualAccount);
router.post('/virtual/sync', syncVirtualAccount);
router.get('/virtual/status', getVirtualAccountStatus);
router.get('/virtual/balance', getVirtualAccountBalance);
router.post('/virtual/remove-funds', createRemoveFundsRequest);
router.get('/virtual/remove-funds', getRemoveFundsRequests);
router.get('/virtual/remove-funds/:referenceId/status', getRemoveFundsRequestStatus);

// Bank account (CashFree verification)
router.post('/bank/verify', verifyBankAccount);
router.get('/bank/status', getBankAccountStatus);

// Combined status — returns whichever account (virtual OR bank) the merchant has
router.get('/status', getPayrollAccountStatus);

module.exports = router;
