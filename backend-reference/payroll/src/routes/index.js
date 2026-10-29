const express = require('express')
const router = express.Router({ mergeParams: true });
const {verifyToken} = require("../middleware/verifyToken");
const { verifyUser } = require('../middleware/verifySubCorporate');
const { payrollSlipsEmailed, payrollSlipsDownload } = require('../controller/salary');
const { listHolidays } = require('../controller/holiday');
const { syncSalaryForCorporateWrites } = require('../middleware/salarySync');


// /corporateUser CRUD is intentionally not mounted: it had no auth and let any user
// list, edit or delete other corporates. CorporateUser rows are upserted by verifyToken.
router.use("/webhook/payout", require("./webhook/payout"));
router.use(verifyToken);
// router.use(checkCorporateUserExists);
router.use(verifyUser('Payroll'));
// Marks affected pre-calculated Salary rows stale on every payroll input write.
router.use(syncSalaryForCorporateWrites);

router.get("/holidays/list", listHolidays);
router.use("/holiDay", require("./holiDay"));
router.use("/document-requests", require("./documentRequest"));
router.use("/attendance-record", require("./attendanceRecord"));
router.use("/disputes", require("./disputes"));
router.use("/calendarActivities", require("./calendarActivities"));
router.use("/employee", require("./employee"));
router.use("/user-profile", require("./userProfile"));
router.use("/onboarding", require("./onboarding"));
router.use("/dashBoard", require("./dashBoard"));
router.use("/announcement", require("./announcement"));
router.use("/hr-settings", require("./hrSettings"));
router.use("/reimbursement", require("./reimbursement"));
router.use("/leave-application", require("./leaveApplication"));
router.use("/salary", require("./salary"));
router.use("/process-salary", require("./processSalary"));
router.use('/overtime',require("./overTime"))
router.use("/incentives", require("./incentives"));
router.use("/department", require("./department"));
router.use("/bonus",require("./bonus"))
router.use("/gratuity", require("./gratuity"));
router.use("/deductions", require("./deductions"));
router.use("/loss-of-pay", require("./lossOfPay"));
router.use("/increment", require("./increment"))
router.use("/wps", require("./wps"));
router.use("/documents", require("./documents"));
router.use("/payrollDocs", require("./payrollDocs"));
router.use("/assets", require("./assets"))

//routes new payroll
router.use("/organization-settings", require("./organizationSettings"));
router.use("/salary-component", require("./salaryComponent"));
router.use("/deduction-component", require("./deductionComponent"));
router.use("/bank-details",require("./bankDetails"))
router.use("/beneficiary", require("./beneficiary"))
router.use("/salary-rollout", require("./salaryRolloutEmployees"))
router.use("/leave-component", require("./leaveComponent"));
router.use("/compliance-settings",require("./complianceSettings"));
router.use("/attendance",require("./attendance"))
router.use("/reports", require("./reportsAndForms"));
router.use("/account", require("./virtualAccount"));
router.use("/salary-rollout-banks", require("./salaryRolloutBankAccount"));
router.use("/salary-history", require("./salaryHistory"));
router.use("/ctc-calculator", require("./ctcCalculator"));
router.use("/one-time-payment", require("./oneTimePayment"));
router.use("/profile-update-requests", require("./profileUpdateRequest"));
router.get('/payroll-slips/email/:salaryId', payrollSlipsEmailed);
router.get('/payroll-slips/download/:salaryId', payrollSlipsDownload)



module.exports = router

