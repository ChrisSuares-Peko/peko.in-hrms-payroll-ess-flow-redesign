const ErrorResponse = require('../../../utils/error-response')
const asyncHandler = require('../../../middlewares/async');
const { createEmployee, findAllEmployees, updateEmployee, deleteEmployee, findAllEmployeesList, GetAllEmployees } = require('../../../models/use-cases/pekoCloud/cloud_employees');

exports.createEmployee = asyncHandler(async (req, res, next) => {
    let data = req.body;
    let credentialId = req.user.id;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
        data.subCorporateUserId = req.user?.subCorporateId
    }
    const result = await createEmployee({ ...data, credentialId }, req.user);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    } else {
        return res.status(200).json({
            'status': true,
            'data': result,
            'message': 'Employee added successfully',
            'responseCode': '000'
        });
    }
});

//list all employees
exports.findAllEmployees = asyncHandler(async (req, res, next) => {
    let { page, itemsPerPage, sortField, sort, searchText } = req.query;
    let credentialId = req.user.id;
    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    }
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;

    if (!sortField || !sort) {
        sortField = sortField || 'createdAt'
        sort = sort == 'ASC' ? 'ASC' : 'DESC'
    }

    const result = await findAllEmployees(page, itemsPerPage, sortField, sort, searchText, credentialId,subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching employees`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Fetched employees successfully',
        'responseCode': '000'
    });
});

exports.findAllEmployeesList = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;

    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    } 


    const result = await findAllEmployeesList(credentialId, subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching employees`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Fetched employees successfully',
        'responseCode': '000'
    });
});

exports.getEmployeesInfoDetails = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;

    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    } 

    const details = {
        totalEmployees: 0,
        assetsUsers: 0,
        subscriptionUsers: 0,
        totalAmountSpent: 0
    }
    

    const result = await findAllEmployeesList(credentialId, subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching employees info`, 500));
    }
    const data = result.data
    details.totalEmployees = data?.totalData ?? 0

    data?.result.forEach(employee => {
        if (employee.assetsAndFleet.length > 0) {
            details.assetsUsers += 1;
        }
        if (employee.subscriptions.length > 0) {
            details.subscriptionUsers += 1;
        }
        details.totalAmountSpent += employee.totalSpent;
    });
    details.totalAmountSpent = details.totalAmountSpent.toFixed(2)

    return res.status(200).json({
        'status': true,
        'data': details,
        'message': 'Fetched employees info successfully',
        'responseCode': '000'
    });
});

exports.GetEmployeesList = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;
    let { searchText } = req.query;

    const result = await GetAllEmployees(searchText, credentialId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching employees`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Fetched employees list successfully',
        'responseCode': '000'
    });
});

exports.updateEmployee = asyncHandler(async (req, res, next) => {
    const { employeeId } = req.params;
    const credentialId = req.user.id;
    const updatatedData = req.body;

    // Owner scope matches the list (sub-user → subCorporateUserId, else credentialId).
    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId };
    // credentialId forced LAST so a client-supplied credentialId can't reassign ownership.
    const result = await updateEmployee(employeeId, {...updatatedData, credentialId}, req.user, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Employee updated successfully',
        'responseCode': '000'
    });

})

//Delete employee
exports.deleteEmployee = asyncHandler(async (req, res, next) => {
    const { employeeId } = req.params

    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };
    const result = await deleteEmployee(employeeId, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Employee deleted successfully',
        'responseCode': '000'
    });

})
