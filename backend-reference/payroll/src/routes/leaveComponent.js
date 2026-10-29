const express = require('express');
const router = express.Router();

const { createLeaveComponent, 
    getLeaveComponent, 
    editLeaveComponent, 
    deleteLeaveComponent, 
    getLeavePoliciesForEmployeeProfile,
    createEmployeeLeavePolicy,
    getLeavePoliciesForEmployeeProfileWithoutPagination
 } = 
    require('../controller/leaveComponent')
const { validateLeaveComponentCreate, validateLeaveComponentUpdate } = require('../utils/apivalidation/orgSettings')
const { requireOwnedEmployee } = require('../utils/tenantScope')
//   *****for fetching global leave components and employee specific leave components respectively ***
router.get('/', getLeaveComponent);
router.get('/:employeeId', requireOwnedEmployee('employeeId'), getLeavePoliciesForEmployeeProfile)
router.get('/:employeeId/leave-policies', requireOwnedEmployee('employeeId'), getLeavePoliciesForEmployeeProfileWithoutPagination)
//   ****** for creating global leave components and employee specific leave components respectively ***
router.post('/', validateLeaveComponentCreate, createLeaveComponent)
router.post('/:employeeId',requireOwnedEmployee('employeeId'),validateLeaveComponentCreate,createEmployeeLeavePolicy)
//   ****** for updating and deleting leave components respectively ***
router.put('/:id/:employeeId', validateLeaveComponentUpdate, editLeaveComponent);
router.delete('/:id', deleteLeaveComponent);


module.exports = router;
