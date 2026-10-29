const express = require("express");
const { getPayrollTemplates } = require("../controller/payrollDocs");

const router = express.Router();

router.get("/templates", getPayrollTemplates);

module.exports = router;
