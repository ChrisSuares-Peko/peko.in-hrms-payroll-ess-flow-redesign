const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  getProcessSalaryDetails,
  getProcessSalaryEmployees,
  processSalary,
  getProcessSalaryStatus,
} = require('../controller/processSalary');
const verifyPaymentLinkOnboarding = require('../middleware/verifyPaymentLinkOnboarding');

router.use(verifyPaymentLinkOnboarding);

router.get('/details', getProcessSalaryDetails);
router.get('/employees', getProcessSalaryEmployees);
router.post('/', processSalary);
router.get('/:batchReferenceId/status', getProcessSalaryStatus);

module.exports = router;
