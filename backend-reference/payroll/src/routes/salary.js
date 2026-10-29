const express = require('express');
const router = express.Router();

const { validateCheckSalaryDetails, validateApproveSalary, validateMarkAsPaid, validateMarkAsApproved, validateTdsOverride } = require('../utils/apiValidation');
const { getAllSalaryDetails, getProfile, allPayrollSlips, checkSalaryDetails, getExcel,getSalaryDetails,calculateSalaryForEmp,getAllSalaryDetailsByMonthExcelDownload } = require('../controller/salary');
const { payrollSlipsEmailed, payrollSlipsDownload, empApproveSalary,empProfileSalaryV2,payrollHistory,payrollHistoryExcel,empMonthlyApproveSalary, markAsPaid, markAsApproved, updateTdsOverride, getTdsOverride } = require('../controller/salary');
const { requireOwnedEmployee } = require('../utils/tenantScope');

//get all salary details for the corporate monthly wise
router.get('/statement', getAllSalaryDetails);

//get salary details month wise
// router.get('/statement/excel', getAllSalaryDetailsByMonth);
router.get('/profile/:id', getProfile);

//route to generate a particular employee salary all payroll
router.get('/all-payroll-slips/:employeeId', requireOwnedEmployee('employeeId'), allPayrollSlips);
router.get('/payroll-slips/email/:salaryId', payrollSlipsEmailed);
router.get('/payroll-slips/download/:salaryId', payrollSlipsDownload)
router.post('/check-salary-details', validateCheckSalaryDetails, checkSalaryDetails)
// router.put('/approve-salary', validateApproveSalary, approveSalary);
router.get('/excel', getExcel);
router.get('/salary-details', getSalaryDetails);

// calculate salary component
router.get('/calculateSalary', calculateSalaryForEmp);
router.get('/statement/excel', getAllSalaryDetailsByMonthExcelDownload);
router.put('/approve-salary', validateApproveSalary, empApproveSalary);
router.put('/mark-as-paid', validateMarkAsPaid, markAsPaid);
router.put('/mark-as-approved', validateMarkAsApproved, markAsApproved);
router.get('/empSalaryProfile/:id', requireOwnedEmployee('id'), empProfileSalaryV2);
// Old Tax Regime employees only — HR-entered monthly TDS, applied from the given month onward
router.get('/tds-override/:employeeId', requireOwnedEmployee('employeeId'), getTdsOverride);
router.put('/tds-override/:employeeId', requireOwnedEmployee('employeeId'), validateTdsOverride, updateTdsOverride);
// router.get('/empSalaryProfileV2/:id', empProfileSalaryV2);
router.get('/payrollHistory', payrollHistory);
router.get('/payrollHistory/excel', payrollHistoryExcel);
router.put('/empApproveSalary/:id', requireOwnedEmployee('id'), validateApproveSalary, empMonthlyApproveSalary);
 

module.exports = router;
