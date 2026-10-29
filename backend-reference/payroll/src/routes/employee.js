const express = require("express");
const router = express.Router();
const { employeesFilesUpload, offBoardingFilesUpload } = require("../middleware/fileUpload");
const upload = require("../middleware/multer");
const { excelToJson, validateExcelData } = require("../services/employeeBulkUpload");
const { offBoardEmployees, getCancelOffBoarding, cancelOffBoarding, confirmEmployeeProbation, extendEmployeeProbation } = require("../controller/employee");
const { validateOffBoarding, validateEmployeeInformationUpdate, validateEmployeeWorkEmailUpdate, validateEmployeeSalaryUpdate, validateEmployeeBankUpdate, validateEmployeeCredentials } = require("../middleware/validation/employee");

const { getBulkExcelTemplate, getAllEmployees, getBasicSalary, getExcel, } = require("../controller/employee")
const { getCurrentEmployee, getEmployee, getEmployeeById, getReportingStaff,createEmployee } = require("../controller/employee")
const { updateAllEmployeeInfo, deleteEmployeeById, updateEmployeeWorkSchedule, getEmployeeWorkSchedule, createNewEmployee,getExistingEmployee } = require("../controller/employee")
const { updateEmployee, updateExistEmployee, updateEmployeeInformation, updateEmployeeWorkEmail, updateSalaryInformation } = require("../controller/employee")
const { validateInformation, updateBankDetails, updateMultipleDocuments, bulkCreate, sendResponse,getEmployeeCount,sendResponseLimitSubscription } = require("../controller/employee");
const validateSubscriptionLimit = require("../middleware/checkEmployeeLimit");
const { updateProgress } = require("../middleware/updateProgress");

//++++++++++++++++++++++++
const { validateDocumentInfo,validateBankInfo } = require("../middleware/validation/employee");
const { createPersonalInfo,updateEmployeeInfo,updateSalaryInfo,updateDocumentInfo,updateBankInfo,getAllEmployeesForCorporate,createEmpstatutory,getStatutoryEmployeeById,confirmJoining,createNewHireEmployee,getNewHireEmployees,getNewHireProfile,saveOfferLetterESignId } = require("../controller/employee")
const {verifyPan,verifyAadhaarOtp,generateAadhaarOtp}=require('../controller/panAdhar')
const { getEmployeeAttendanceMetrics } = require('../controller/attendanceRecord')
const { requireOwnedEmployee } = require('../utils/tenantScope');


// Get all employees 
router.get("/all-employees", getAllEmployees)
router.get("/existing-employees", getExistingEmployee)
//Get count of employees
router.get("/count",getEmployeeCount)
router.get("/validateSubscriptionLimit", validateSubscriptionLimit,  sendResponseLimitSubscription)

// Get basic salary 
router.get('/basic-salary/:employeeId', getBasicSalary)

// Get all employees for the current corporateUser
// router.get("/", getEmployeesForCorporate);

//Excel Sheet generation For All Employees
router.get("/excel", getExcel);
router.post("/off-boarding/:employeeId", validateOffBoarding, offBoardingFilesUpload, offBoardEmployees)
router.get("/off-boarding/:employeeId/cancel", getCancelOffBoarding)
router.post("/off-boarding/:employeeId/cancel", cancelOffBoarding)
router.put("/:id/probation/confirm", confirmEmployeeProbation)
router.put("/:id/probation/extend", extendEmployeeProbation)

router.get("/all-employeeids", getEmployee);

// Get a specific Employee by ID
// router.get("/:id", getEmployeeById)

router.get("/reporting-staff/:id", getReportingStaff)

//here is the route for add all employee information in single route
// router.post("/alldata", validateAddEmployee, employeesFilesUpload, createEmployee)
// The onboarding progress cache (getProgressForCorporateUser) only recalculates once, on
// first read — the "has an employee been added" 20% never updates again after that unless
// something explicitly triggers a recalc (see middleware/updateProgress.js), same as the
// company profile/payroll settings/salary & deduction component routes below already do.
// Without this, a corporate user's FIRST employee add never actually moves progress to
// 100%, leaving the "Complete Your Onboarding" banner stuck forever even once genuinely done.
router.post("/alldata",  validateSubscriptionLimit,  employeesFilesUpload, updateProgress, createEmployee)

//here is the route for update all employee information in single route
router.put("/alldata/:id", employeesFilesUpload, updateAllEmployeeInfo)

// Delete an Employee by ID
router.delete("/:id", deleteEmployeeById)

// Update employee's work schedule by ID
router.put("/:id/work-schedule", updateEmployeeWorkSchedule)

// get employee's work schedule by ID
router.get("/work-schedule/excel", getEmployeeWorkSchedule);

/**
 * bellow routes are for section wise employee creation and updating
 */

// Create a new Employee
router.post("/", createNewEmployee)
//verify pan and aadhar numbers of employee
router.post("/:employeeId/pan",verifyPan)
router.post("/:employeeId/aadhaar-otp",generateAadhaarOtp)
router.post("/:employeeId/aadhaar-verify", verifyAadhaarOtp)
router.get("/:employeeId/attendance/metrics", requireOwnedEmployee('employeeId'), getEmployeeAttendanceMetrics)



// Update an existing Employee
// router.put("/:id", validateEmployeePersonalDetailsUpdate, employeesFilesUpload, updateEmployee)
router.put("/:id", employeesFilesUpload,updateEmployee)
router.put("/exit-information/:id", updateExistEmployee)
router.put("/:id/employeeInformation", validateEmployeeInformationUpdate, employeesFilesUpload, updateEmployeeInformation)
router.put("/:id/work-email", validateEmployeeWorkEmailUpdate, updateEmployeeWorkEmail)
// Update salaryInformation for a specific employee by ID
router.put("/:id/salaryInformation", validateEmployeeSalaryUpdate, updateSalaryInformation)

//validate email, mobile and employeeId
router.post("/validate", validateEmployeeCredentials, validateInformation)
// validate and update personal info

// Update bank details for a specific employee by ID
router.put("/:id/bankDetails", validateEmployeeBankUpdate, updateBankDetails);

// Add/Update multiple documents to an employee's documents array
router.put("/:id/documents", employeesFilesUpload, updateMultipleDocuments)

//new employee routes

router.post("/bulk-excel-upload", upload.single('file'), excelToJson,  validateSubscriptionLimit,  validateExcelData, sendResponse)
router.get("/bulk-excel-template", getBulkExcelTemplate);
router.post("/bulk-validate", validateExcelData, sendResponse)
router.post("/bulk-create", validateSubscriptionLimit, validateExcelData, bulkCreate)

router.get("/", getAllEmployeesForCorporate);
router.get("/current-employees", getCurrentEmployee)
router.post("/new-hire", createNewHireEmployee)
router.get("/new-hire", getNewHireEmployees)
router.get("/new-hire/:employeeId", getNewHireProfile)
router.put("/new-hire/:id/offer-letter-esign-id", saveOfferLetterESignId)
router.get("/:id", getEmployeeById)
// router.post("/personal-info", validatePersonalInfo,employeesFilesUpload, createPersonalInfo)
router.post("/personal-info", employeesFilesUpload, createPersonalInfo)
// router.put("/employee-info/:id", validateEmployeeInfo,employeesFilesUpload, updateEmployeeInfo)
router.put("/employee-info/:id", employeesFilesUpload,updateEmployeeInfo)
//  router.put("/salary-info/:id", validateSalaryInfo,employeesFilesUpload, updateSalaryInfo)
 router.put("/salary-info/:id",employeesFilesUpload, updateSalaryInfo)
 router.put("/document-info/:id", validateDocumentInfo,employeesFilesUpload, updateDocumentInfo)
 router.put("/bank-info/:id", validateBankInfo,employeesFilesUpload, updateBankInfo)

 router.post("/statutory/:employeeId", createEmpstatutory)
 router.get("/statutory/:employeeId", getStatutoryEmployeeById)

 router.put("/:id/confirm-joining", confirmJoining)


module.exports = router;










