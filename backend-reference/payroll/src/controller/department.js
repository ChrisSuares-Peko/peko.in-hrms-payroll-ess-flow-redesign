const Department = require("../models/entities/department");
const { createDepartment, getAllDepartmentData, deleteDepartment, editDepartment, getDepartmentUsingCorporateId } = require("../models/use-cases/department");
const { fetchEmployeeWithDepartment } = require("../models/use-cases/employee");
const ErrorResponse = require("../utils/error-response");
const { findDepartment, findExistingDepartment, findDepartmentByIdAndCorporateUser } = require("../models/use-cases/department");
const asyncHandler = require("../middleware/async");
const { sanitizeBody } = require("../utils/tenantScope");

exports.createDepartment = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const departmentName = req.body.departmentName;
    const departmentCode=req.body.departmentCode;

    const existingDepartment = await findDepartment(corporateUserID, departmentName,departmentCode);

    if (existingDepartment) {
        return next(new ErrorResponse('Department is already existing with this name or code', 400));
    }

    let data = {
        ...req.body,
        corporateUser: corporateUserID,
    }
    const result = await createDepartment(data)

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while creating department data', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Department data created successfully',
        data: result
    });

})

exports.getAllDepartment = asyncHandler(async (req, res, next) => {

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

    const result = await getAllDepartmentData(params);

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while generating department data', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Department data fetched successfully',
        data: result
    });

})

exports.deleteDepartment = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const departmentId = req.params.id;

    const foundDepartment = await findDepartmentByIdAndCorporateUser(departmentId, corporateUserID);
    if (!foundDepartment) {
        return next(new ErrorResponse('Department data not found or unauthorized to delete', 400));
    }

    const employeeWithDepartment = await fetchEmployeeWithDepartment(corporateUserID, departmentId)

    if (employeeWithDepartment) {
        return next(new ErrorResponse('Cannot delete department. Employee(s) are associated with it.', 400));
    }

    const params = {
        corporateUserID,
        departmentId
    }

    const result = await deleteDepartment(params);

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Department data deleted successfully',
        data: result
    });

})

exports.editDepartment = asyncHandler(async (req, res, next) => {
    
    const corporateUserID = req.user._id;
    const departmentId = req.params.id;
    const editData = sanitizeBody(req.body);
    
   if (editData?.departmentName || editData?.departmentCode) {
        const existingDepartment = await findExistingDepartment(
            corporateUserID,
            editData,
            departmentId
        );

        if (existingDepartment) {
            return next(
                new ErrorResponse(
                    'Department name or department code already exists',
                    400
                )
            );
        }
    }
   
    const foundDepartment = await Department.findOne({
        _id: departmentId,
        corporateUser: corporateUserID
    });

    if (!foundDepartment) {
        return next(new ErrorResponse('Department data not found or unauthorized to edit', 400));
    }

    const params = {
        corporateUserID,
        departmentId,
        editData
    }

    if (foundDepartment) {
        const result = await editDepartment(params);

        if (result.ErrorResponse) {
            return next(new ErrorResponse(result.ErrorResponse, 400));
        }

        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'Department data updated successfully',
            data: result
        });
    }

})

exports.getDepartment = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;

    const result = await getDepartmentUsingCorporateId(corporateUserID);

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while generating department data', 400));
    }

    const modifiedResult = result.map(({ _id, departmentName }) => ({ _id, departmentName }));

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Department data fetched successfully',
        data: modifiedResult
    });

})