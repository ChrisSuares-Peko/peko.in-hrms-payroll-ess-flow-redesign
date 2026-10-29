const express = require('express');
const router = express.Router({ mergeParams: true });
const { listEmployees, updateEmployee, getSalaryBreakup, verifyBankAccount, addBeneficiary, bulkVerifyBankAccounts, listPendingVerification, listPendingBeneficiary, bulkAddBeneficiaries, exportEmployees, listVerifiedEmployees } = require('../controller/salaryRolloutEmployees');
const verifyPaymentLinkOnboarding = require('../middleware/verifyPaymentLinkOnboarding');
const { requireOwnedEmployee } = require('../utils/tenantScope');

router.use(verifyPaymentLinkOnboarding);
router.get('/employees', listEmployees);
router.get('/employees/export', exportEmployees);
router.get('/employees/pending-verification', listPendingVerification);
router.get('/employees/pending-beneficiary', listPendingBeneficiary);
router.get('/employees/eligible', listVerifiedEmployees);
router.post('/employees/verify-bank-accounts', bulkVerifyBankAccounts);
router.post('/employees/add-beneficiaries', bulkAddBeneficiaries);
router.put('/employees/:employeeId', requireOwnedEmployee('employeeId'), updateEmployee);
router.get('/employees/:employeeId/salary-breakup', requireOwnedEmployee('employeeId'), getSalaryBreakup);
router.post('/employees/:employeeId/verify-bank-account', requireOwnedEmployee('employeeId'), verifyBankAccount);
router.post('/employees/:employeeId/add-beneficiary', requireOwnedEmployee('employeeId'), addBeneficiary);

module.exports = router;
