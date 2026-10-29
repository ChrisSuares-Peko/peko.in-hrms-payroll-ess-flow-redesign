const express = require("express");
const router = express.Router();
const { createIncrement, calculateIncrement, fetchAllIncrement, updateIncrement, deleteIncrement, fetchSingleIncrement, calculateBasicSalaryForIncrement } = require("../controller/increment");
const { incrementFilesUpload } = require("../middleware/fileUpload");
const { validateIncrementCalculation } = require("../utils/apiValidation");
const { requireOwnedEmployee } = require("../utils/tenantScope");

// router.post('/:employeeId', validateIncrementCreate, incrementFilesUpload, createIncrement);
router.post('/:employeeId', requireOwnedEmployee('employeeId'), incrementFilesUpload, createIncrement);
router.get('/calculate-basic-salary/:employeeId', requireOwnedEmployee('employeeId'), calculateBasicSalaryForIncrement);
router.post('/calculate-increment/:employeeId', requireOwnedEmployee('employeeId'), validateIncrementCalculation, calculateIncrement);
router.get('/:id', requireOwnedEmployee('id'), fetchAllIncrement);
// router.put('/:incrementId', validateIncrementUpdate, incrementFilesUpload, updateIncrement);
router.put('/:incrementId', incrementFilesUpload, updateIncrement);
router.delete('/:incrementId', deleteIncrement);
router.get("/increment-data/:incrementId", fetchSingleIncrement);

module.exports = router;