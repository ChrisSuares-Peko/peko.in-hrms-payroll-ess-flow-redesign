const asyncHandler = require("../middleware/async");
const leaveComponent = require('../models/entities/leaveComponent');
const ErrorResponse = require("../utils/error-response");

const { createLeaveComponent, getLeaveComponent, editLeaveComponent, deleteLeaveComponent, getLeavePoliciesForEmployeeProfile, createEmployeeLeavePolicy, getLeavePoliciesForEmployeeProfileForDropDown } = require("../models/use-cases/leaveComponent");
const {createOrUpdateEmployeeLeaveBalance}= require("../models/use-cases/leaveBalance");
const { sanitizeBody, isEmployeeOfCorporate } = require("../utils/tenantScope");

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

//get leave component
exports.getLeaveComponent = asyncHandler(async (req, res, next) => {
console.log("getLeaveComponent called");
    const corporateUserID = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchText = req.query.searchText || '';
    const skip = (page - 1) * limit;

    const params = {
        corporateUserID,
        page,
        limit,
        searchText,
        skip
    }

    const result = await getLeaveComponent(params);

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while fetching leave component', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Leave components fetched successfully',
        data: result
    });

})



exports.getLeavePoliciesForEmployeeProfile = asyncHandler(async (req, res, next) => {
    const employeeID = req.params.employeeId; // Get employee ID from URL params
    const corporateUserID = req.user._id; // Assuming this is coming from the authenticated user session

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchText = req.query.searchText || '';
    const skip = (page - 1) * limit;

    // Pass these parameters to the use case function
    const params = {
        employeeID,
        corporateUserID,
        page,
        limit,
        searchText,
        skip
    };

    try {
        const result = await getLeavePoliciesForEmployeeProfile(params);

        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'Leave policies fetched successfully',
            data: result
        });
    } catch (error) {
        return next(new ErrorResponse('Failed to fetch leave policies', 500));
    }
});


exports.getLeavePoliciesForEmployeeProfileWithoutPagination = asyncHandler(async (req, res, next) => {
    console.log("there")
    const employeeID = req.params.employeeId; // Get employee ID from URL params
    const corporateUserID = req.user._id; // Assuming this is coming from the authenticated user session
    const searchText = req.query.searchText || ''; // Search text for filtering leave types, etc.

    // Pass these parameters to the use case function without pagination
    const params = {
        employeeID,
        corporateUserID,
        searchText
    };

    try {
        const result = await getLeavePoliciesForEmployeeProfileForDropDown(params);
        // Step 1: Create or update EmployeeLeaveBalance record
        createOrUpdateEmployeeLeaveBalance(employeeID, result.leavePolicyData);
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'Leave policies fetched successfully',
            data: result
        });
    } catch (error) {
        return next(new ErrorResponse('Failed to fetch leave policies', 500));
    }
});




//creates global leave component
exports.createLeaveComponent = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const { leaveType } = req.body;
    if (req.body.employee && !(await isEmployeeOfCorporate(req.body.employee, corporateUserID))) {
        return next(new ErrorResponse('Employee not found', 404));
    }
    const existingLeaveComponent = await leaveComponent.findOne({
        corporateUser: corporateUserID,
        leaveType: { $regex: `^${escapeRegex(leaveType)}$`, $options: 'i' },
    });

    if (existingLeaveComponent) {
        return res.status(400).json({
            status: false,
            responseCode: '001',
            message: 'Leave policy with the same leave type already exists.',
        });
    }
    let data = {
        ...sanitizeBody(req.body),
        ...(req.body.employee ? { employee: req.body.employee } : {}),
        corporateUser: corporateUserID,
    }
    const result = await createLeaveComponent(data)
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Leave component created successfully",
        data: result,
    })

})


//creates employee leave components

exports.createEmployeeLeavePolicy = asyncHandler(async (req, res) => {
    const employeeID = req.params.employeeId;  // Get employee ID from the URL params

    const corporateUserID = req.user._id;

    const { leaveType, accrualType, accrualRate, maximumAccrual, leaveBalanceCarryover, maximumNumberOfLeaves } = req.body;

    try {

        const params = {
            employeeID,
            corporateUserID,
            leaveType,
            accrualType,
            accrualRate,
            maximumAccrual,
            leaveBalanceCarryover,
            maximumNumberOfLeaves
        };


        const newLeavePolicy = await createEmployeeLeavePolicy(params);

        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'Employee leave policy created successfully',
            data: newLeavePolicy
        });
    } catch (error) {
        return res.status(400).json({
            status: false,
            responseCode: '001',
            message: error.message || 'Failed to create employee leave policy',
            data: {}
        });
    }
});


//edit leave component


exports.editLeaveComponent = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id;  // Get the corporateUserID from the session
    const leaveId = req.params.id;  // Get the leave policy ID from the URL
    const employeeId = req.params.employeeId;
    const editData = sanitizeBody(req.body, ['isGlobal', 'globalComponentId']);  // Get the data to be updated from the request body

    if (employeeId && employeeId !== 'undefined' && !(await isEmployeeOfCorporate(employeeId, corporateUserID))) {
        return next(new ErrorResponse('Employee not found', 404));
    }

    try {
        // Prepare the parameters to pass to the use case
        const params = {
            corporateUserID,
            leaveId,
            editData,
            employeeId
        };

        // Call the use case to edit the leave policy
        const result = await editLeaveComponent(params);

        // Return the response based on the result from the use case
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'Leave policy updated',
            data: result
        });
    } catch (error) {
        return next(new ErrorResponse('Failed to update leave policy', 500));
    }
});


//delete leave component
exports.deleteLeaveComponent = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const leaveId = req.params.id;

    const foundLeaveComponent = await leaveComponent.findOne({
        _id: leaveId,
        corporateUser: corporateUserID
    });
    if (!foundLeaveComponent) {
        return next(new ErrorResponse('Leave component data not found or unauthorized to delete', 400));
    }
    const params = {
        corporateUserID,
        leaveId
    }

    const result = await deleteLeaveComponent(params);

    if (result?.status === false) {
        return next(new ErrorResponse(result.message, 400));
    }
    if (!result || result instanceof Error) {
        return next(new ErrorResponse('Failed to delete leave component', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Leave component deleted successfully',
        data: result
    });

})