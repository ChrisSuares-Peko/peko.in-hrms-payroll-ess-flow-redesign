const express = require('express');
const router = express.Router({ mergeParams: true });
const { verifyToken } = require('../../middleware/verifyToken');
const { validateProfileUpdateRequest, validateBankUpdateRequest, validateReimbursementRequest, validateCheckIn, validateCheckOut, validateOvertimeRequest, validateAttendanceDispute, validateLeaveApply, validateListLeaveApplications, validateUserDocumentRequest, validateUserDocumentCreate } = require('../../middleware/validation/onboarding');
const { requestProfileUpdate, requestBankUpdate, listAnnouncements, requestReimbursement, listReimbursement, cancelReimbursement, getCheckInOutStatus, getCheckInAvailability, checkIn, checkOut, getAttendanceMetrics, getAttendanceList, requestOvertime, listOvertime, cancelOvertime, raiseAttendanceDispute, listAttendanceDisputes, getDeductionLog, getLeaveBalance, applyLeave, listLeaveApplications, cancelLeave, listHolidays, requestDocument, listActiveDocumentRequests, uploadUserDocument, listMyPayslips, downloadMyPayslip, downloadEmployeeDocument } = require('../../controller/userProfile');
const { reimbursementFilesUpload, essDocumentFilesUpload } = require('../../middleware/fileUpload');
const { syncSalaryForEmployeeWrites } = require('../../middleware/salarySync');

router.use(verifyToken);
// verifyUser('Payroll') is a corporate-tree check — F-PRL-05 makes it reject USER, and this
// ESS router only serves USER sessions, so it would lock every employee out.
// Marks the employee's pre-calculated Salary rows stale on ESS leave/overtime/reimbursement/attendance writes.
router.use(syncSalaryForEmployeeWrites);

router.use('/user-profile', require('../userProfile'));
router.use('/onboarding', require('../onboarding'));

router.post('/profile-update-requests/profile', validateProfileUpdateRequest, requestProfileUpdate);
router.post('/profile-update-requests/bank', validateBankUpdateRequest, requestBankUpdate);
router.get('/announcements', listAnnouncements);
router.post('/reimbursement-requests', validateReimbursementRequest, reimbursementFilesUpload, requestReimbursement);
router.get('/reimbursement-requests', listReimbursement);
router.patch('/reimbursement-requests/:reimbursementId/cancel', cancelReimbursement);

router.get('/attendance/check-in-status', getCheckInOutStatus);
router.get('/attendance/check-in-available', getCheckInAvailability);
router.post('/attendance/check-in', validateCheckIn, checkIn);
router.post('/attendance/check-out', validateCheckOut, checkOut);
router.get('/attendance/metrics', getAttendanceMetrics);
router.get('/attendance', getAttendanceList);

router.post('/overtime-requests', validateOvertimeRequest, requestOvertime);
router.get('/overtime-requests', listOvertime);
router.patch('/overtime-requests/:overtimeId/cancel', cancelOvertime);

router.post('/leave/disputes', validateAttendanceDispute, reimbursementFilesUpload, raiseAttendanceDispute);
router.get('/leave/disputes', listAttendanceDisputes);
router.get('/deduction-log', getDeductionLog);

router.get('/leave-balance', getLeaveBalance);
router.post('/leave-applications', validateLeaveApply, applyLeave);
router.get('/leave-applications', validateListLeaveApplications, listLeaveApplications);
router.patch('/leave-applications/:leaveId/cancel', cancelLeave);

router.get('/holidays', listHolidays);

router.post('/document-requests', validateUserDocumentRequest, requestDocument);
router.get('/document-requests/active', listActiveDocumentRequests);
router.post('/documents', validateUserDocumentCreate, essDocumentFilesUpload, uploadUserDocument);
router.get('/documents/:documentId/download', downloadEmployeeDocument);

router.get('/payslips', listMyPayslips);
router.get('/payslips/:salaryId/download', downloadMyPayslip);

module.exports = router;
