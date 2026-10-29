const ErrorResponse = require('../../../utils/error-response')
const asyncHandler = require('../../../middlewares/async');
const { createAsset, findAllAssets, updateAsset, deleteAsset, findSingleAsset, findAllAssetsList, assignAsset, findAllAssetsUsageHistories } = require('../../../models/use-cases/pekoCloud/cloud_assets');
const {  createEmployee } = require('../../../models/use-cases/pekoCloud/cloud_employees');

exports.createAsset = asyncHandler(async (req, res, next) => {
    let data = req.body;
    let credentialId = req.user.id;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
        data.subCorporateUserId = req.user?.subCorporateId
    }
    const result = await createAsset({ ...data, credentialId });
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    } else {
        return res.status(200).json({
            'status': true,
            'data': result,
            'message': 'Asset added successfully',
            'responseCode': '000'
        });
    }
});

//single asset
exports.findSingleAsset = asyncHandler(async (req, res, next) => {
    let { assetId } = req.params;
    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };
    const result = await findSingleAsset(assetId, owner);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching assets`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result,
        'message': 'Fetched asset successfully',
        'responseCode': '000'
    });
});

//list all assets
exports.findAllAssetsList = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;

    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    } 
    const result = await findAllAssetsList(credentialId,subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching assets`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched assets successfully',
        'responseCode': '000'
    });
});

//get assets info details
exports.getAssetsInfoDetails = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;

    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    } 

    const details = {
        totalAssets: 0,
        totalAssigned: 0,
        availableAssets: 0,
        totalSpent: 0,
    }
    const result = await findAllAssetsList(credentialId,subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching assets info`, 500));
    }

    const data = result.data
    details.totalAssets = data?.count ?? 0
    
    data.rows.forEach(asset => {
        if (asset?.cloudEmployeeId) {
            details.totalAssigned += 1;
        }
        details.totalSpent += Number(asset?.amount ?? 0);
    });
    details.availableAssets = details.totalAssets - details.totalAssigned

    return res.status(200).json({
        'status': true,
        'data': details,
        'message': 'Fetched assets info successfully',
        'responseCode': '000'
    });
});

//list all assets
exports.findAllAssets = asyncHandler(async (req, res, next) => {
    let { page, itemsPerPage, sortField, sort, searchText } = req.query;
    let credentialId = req.user.id;
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;

    if (!sortField || !sort) {
        sortField = sortField || 'createdAt'
        sort = sort == 'ASC' ? 'ASC' : 'DESC'
    }

    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    } 
   
    const result = await findAllAssets(page, itemsPerPage, sortField, sort, searchText, credentialId,subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching assets`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched assets successfully',
        'responseCode': '000'
    });
});

//list all assets usage histories
exports.findAllAssetsUsageHistories = asyncHandler(async (req, res, next) => {
    let { page, itemsPerPage, sortField, sort, searchText } = req.query;
    let credentialId = req.user.id;
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;

    if (!sortField || !sort) {
        sortField = sortField || 'createdAt'
        sort = sort == 'ASC' ? 'ASC' : 'DESC'
    }

    const result = await findAllAssetsUsageHistories(page, itemsPerPage, sortField, sort, searchText, credentialId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching assets usage histories`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched assets usage histories successfully',
        'responseCode': '000'
    });
});

exports.updateAsset = asyncHandler(async (req, res, next) => {
    const { assetId } = req.params;
    const updatatedData = req.body;
    const credentialId = req.user.id;
    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId };
    const result = await updateAsset(assetId, {...updatatedData, credentialId}, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Asset updated successfully',
        'responseCode': '000'
    });

})

exports.assignAsset = asyncHandler(async (req, res, next) => {
    const updatatedData = req.body;
    let credentialId = req.user.id;
    const user = req.user

    if (updatatedData.payrollEmployees) {
        const employeeDetails = updatatedData.employeeDetails;

        delete updatatedData.newEmployeeId;
        const transformedEmployeeDetails = {
            employeeName: employeeDetails.employee,
            employeeID: employeeDetails.employeeId,
            employeeEmail: employeeDetails.employeeEmail,
            department: employeeDetails.department || '',
            joiningDate: employeeDetails.joiningDate || null,
            profilePicture: employeeDetails.profilePicture || '',
            credentialId
        };
        const createdEmployee = await createEmployee(transformedEmployeeDetails, user);
        const employeeId = createdEmployee.data.id;

        updatatedData.newEmployeeId = employeeId;

        delete updatatedData.employeeDetails;
    }

    const result = await assignAsset(updatatedData, credentialId);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Asset assigned successfully',
        'responseCode': '000'
    });

})

//Delete asset
exports.deleteAsset = asyncHandler(async (req, res, next) => {
    const { assetId } = req.params

    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };
    const result = await deleteAsset(assetId, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Asset deleted successfully',
        'responseCode': '000'
    });

})
