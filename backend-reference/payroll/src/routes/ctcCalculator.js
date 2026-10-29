const express = require('express');
const router = express.Router();
const { getEmployeeCtc } = require('../controller/ctcCalculator');
const { verifyCtcAccess } = require('../middleware/verifyCtcAccess');
const { requireOwnedEmployee } = require('../utils/tenantScope');

router.get('/employee/:employeeId', requireOwnedEmployee('employeeId'), verifyCtcAccess, getEmployeeCtc);

module.exports = router;
