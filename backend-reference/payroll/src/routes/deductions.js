const express = require("express");
const router = express.Router();
const { createDeduction, createDeductionDirect, findAllDeductions, findOneDeduction, updateOneDeduction, deleteOneDeduction } = require("../controller/deductions");
const { validateDeductionCreate, validateDeductionDirect, validateOneTimeDeductionUpdate } = require("../utils/apiValidation");
const { requireOwnedEmployee } = require("../utils/tenantScope");

router.get('/:employeeId', requireOwnedEmployee('employeeId'), findAllDeductions);

router.post('/:employeeId', requireOwnedEmployee('employeeId'), validateDeductionCreate, createDeduction);
router.post('/:employeeId/direct', requireOwnedEmployee('employeeId'), validateDeductionDirect, createDeductionDirect);

router.get('/:employeeId/:deductionId', requireOwnedEmployee('employeeId'), findOneDeduction);

router.put('/:employeeId/:deductionId', requireOwnedEmployee('employeeId'), validateOneTimeDeductionUpdate, updateOneDeduction);

router.delete('/:employeeId/:deductionId', requireOwnedEmployee('employeeId'), deleteOneDeduction);

module.exports = router;