const express = require("express");
const router = express.Router();
const {
  createDeductionComponent,
  getAllDeductionComponents,
  getEmployeeDeductionComponents,
  updateDeductionComponent,
  deleteDeductionComponent,
  getEmployeeDeductionComponentList,
  createEmployeeDeductionComponent
} = require("../controller/deductionComponent");
const { updateProgress } = require('../middleware/updateProgress');
const { verifyCtcAccess } = require('../middleware/verifyCtcAccess');
const { requireOwnedEmployee } = require('../utils/tenantScope');

// Deduction data is part of an employee's CTC and just as sensitive under the DPDP Act as
// the Salary Component routes this mirrors — gate the whole router the same way (see
// routes/salaryComponent.js's identical router.use(verifyCtcAccess) for the rationale).
router.use(verifyCtcAccess);

router.get("/", getAllDeductionComponents);
router.get("/:id", requireOwnedEmployee('id'), getEmployeeDeductionComponents);
router.get("/allDeductions/:id", requireOwnedEmployee('id'), getEmployeeDeductionComponentList);
// router.post("/", validateDeductionComponentCreate, createDeductionComponent);
router.post("/", updateProgress, createDeductionComponent);
router.post("/:employeeId", requireOwnedEmployee('employeeId'), createEmployeeDeductionComponent);
router.put('/:id', updateProgress, updateDeductionComponent);
// router.put("/:id", validateDeductionComponentUpdate, editDeductionComponent);
router.delete("/:id", updateProgress, deleteDeductionComponent);

module.exports = router;
