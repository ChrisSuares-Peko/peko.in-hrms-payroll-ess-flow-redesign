const express = require('express')
const router = express.Router()
const { payrollAuthentication } = require('../../../controllers/payroll');
router.get('/authenticate', payrollAuthentication);
module.exports = router