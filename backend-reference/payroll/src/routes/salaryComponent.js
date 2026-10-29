const express = require('express');
const router = express.Router();

const {createSalaryComponent,getAllSalaryComponents,getEmployeeSalaryComponents,getEmployeeSalaryComponentList,editSalaryComponent,deleteSalaryComponent,getEmployeeSalaryComponentwithCount,calculateSalaryComponent,getCurrentEmployeeComponent,getCurrentComponent,createEmpSalaryComponent,getEmployeeSalaryComponentListByEmail,redistributeBasicSalaryController,redistributeEarningComponentController,reviseSalaryController,getRevisionHistoryController,undoLatestRevisionController} = require('../controller/salaryComponent')
const { updateProgress } = require('../middleware/updateProgress')
const { verifyCtcAccess } = require('../middleware/verifyCtcAccess')
const { requireOwnedEmployee } = require('../utils/tenantScope')

// Salary/CTC data is sensitive personal data under India's DPDP Act — every route in this
// file is corporate-scoped (resolves corporateUserID from req.user._id), so gate the whole
// router rather than each route individually. Confirmed the ESS self-service frontend
// never calls any of these endpoints, so this is additive-only for corporate sessions.
router.use(verifyCtcAccess)

 router.get("/currentGlobalComponent", getCurrentComponent)
router.get('/', getAllSalaryComponents);
router.get('/:id', requireOwnedEmployee('id'), getEmployeeSalaryComponents);
router.get('/salary-component-list/:id', requireOwnedEmployee('id'), getEmployeeSalaryComponentList);
router.get('/salary-component-listByEmail/:emailId', getEmployeeSalaryComponentListByEmail);
router.get("/employeeComponents/:id", requireOwnedEmployee('id'), getEmployeeSalaryComponentwithCount);
router.get("/currentEmployeeComponent/:id", requireOwnedEmployee('id'), getCurrentEmployeeComponent)
router.post('/calculate/:id', requireOwnedEmployee('id'), calculateSalaryComponent);
// router.post('/',validateSalaryComponentCreate, createSalaryComponent)
router.post('/', updateProgress, createSalaryComponent)
// router.put('/:id',validateSalaryComponentUpdate, editSalaryComponent)
router.put('/:id', updateProgress, editSalaryComponent)
router.delete('/:id', updateProgress, deleteSalaryComponent)

// for employee based salary component
router.post('/employee', createEmpSalaryComponent)
router.post('/employee/:employeeId/redistribute-basic', requireOwnedEmployee('employeeId'), redistributeBasicSalaryController)
router.post('/employee/:employeeId/redistribute-component', requireOwnedEmployee('employeeId'), redistributeEarningComponentController)
router.post('/employee/:employeeId/revise-salary', requireOwnedEmployee('employeeId'), reviseSalaryController)
router.get('/employee/:employeeId/revision-history', requireOwnedEmployee('employeeId'), getRevisionHistoryController)
router.post('/employee/:employeeId/undo-revision', requireOwnedEmployee('employeeId'), undoLatestRevisionController)


module.exports = router;
