const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  listEligibleEmployees,
  initiateOneTimePayment,
  listOneTimePayments,
} = require('../controller/oneTimePayment');

router.get('/employees', listEligibleEmployees);
router.post('/', initiateOneTimePayment);
router.get('/', listOneTimePayments);

module.exports = router;
