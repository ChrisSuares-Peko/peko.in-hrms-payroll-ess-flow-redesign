const express = require('express');
const router = express.Router();
const { getAllLeaves, getLeavesTaken, getAvailableLeaves, createLeaveApplication, deleteLeave, getLeaveDetails, getAllLeavesForEmployee,updateLeaveApplication,getLeavesExcel, getLeaveRequests, updateLeaveStatus } = require('../controller/leaveApplication');
const { validateLeaveCreate } = require('../utils/apiValidation');
const { requireOwnedEmployee } = require('../utils/tenantScope');

//get full leaves
router.get('/all-leaves', getAllLeaves);

//give the user about how many paid holidays are available
router.get('/available-leaves/:id', requireOwnedEmployee('id'), getAvailableLeaves)
router.get('/leaves-taken/:employeeId', requireOwnedEmployee('employeeId'), getLeavesTaken)
router.get("/leaves/export",getLeavesExcel)

// Corporate side: review queue for employee-submitted leave requests.
// Query: employee, status (applied|approved|rejected|cancelledByEmployee), from, to, search, page, limit
router.get('/leave-requests', getLeaveRequests);

// PATCH /leave-application/:leaveId/status
// Body: status (approved | rejected), notes (optional)
router.patch('/:leaveId/status', updateLeaveStatus);

// Create leave
router.post('/:id', validateLeaveCreate,createLeaveApplication);
router.put('/:id',  updateLeaveApplication)

//delete leave for specific corporate
router.delete('/:id', deleteLeave)
router.get('/leave-details/:leaveId', getLeaveDetails)

// Route to get all leaves applied by an employee
router.get('/:id', requireOwnedEmployee('id'), getAllLeavesForEmployee)


module.exports = router;
