const ErrorResponse = require('../../../utils/error-response')
const asyncHandler = require('../../../middlewares/async');
const { createFleet, findAllFleets, updateFleet, deleteFleet, findAllFleetsList, findSingleFleet, assignFleet, findAllFleetsUsageHistories } = require('../../../models/use-cases/pekoCloud/cloud_fleets');

exports.createFleet = asyncHandler(async (req, res, next) => {
    let data = req.body;
    let credentialId = req.user.id;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
        data.subCorporateUserId = req.user?.subCorporateId
    }
    const result = await createFleet({ ...data, credentialId });
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    } else {
        return res.status(200).json({
            'status': true,
            'data': result,
            'message': 'Fleet added successfully',
            'responseCode': '000'
        });
    }
});

//single fleet
exports.findSingleFleet = asyncHandler(async (req, res, next) => {
    let {fleetId} = req.params;
    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };
    const result = await findSingleFleet(fleetId, owner);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching fleets`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result,
        'message': 'Fetched fleet successfully',
        'responseCode': '000'
    });
});

//list all fleets
exports.findAllFleetsList = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;
    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    } 
    const result = await findAllFleetsList(credentialId,subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching fleets`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched fleets successfully',
        'responseCode': '000'
    });
});

//get fleet section info details
exports.getFleetInfoDetails = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;
    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    } 

    const details = {
        totalFleet: 0,
        totalAssigned: 0,
        totalUnused: 0,
        onMaintenance: 0,
    }

    const result = await findAllFleetsList(credentialId,subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching fleets info`, 500));
    }

    const data = result.data
    details.totalFleet = data?.count ?? 0
    data?.rows?.forEach(veh => {
        if(veh?.cloudEmployeeId){
            details.totalAssigned += 1
        }
        if(veh?.status == "Maintenance"){
            details.onMaintenance += 1
        }
    });
    details.totalUnused = details.totalFleet - details.totalAssigned;

    return res.status(200).json({
        'status': true,
        'data': details,
        'message': 'Fetched fleets info successfully',
        'responseCode': '000'
    });
});

//list all fleets
exports.findAllFleets = asyncHandler(async (req, res, next) => {
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

    const result = await findAllFleets(page, itemsPerPage, sortField, sort, searchText, credentialId,subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching fleets`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched fleets successfully',
        'responseCode': '000'
    });
});

//list all fleets usage histories
exports.findAllFleetsUsageHistories = asyncHandler(async (req, res, next) => {
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

    const result = await findAllFleetsUsageHistories(page, itemsPerPage, sortField, sort, searchText, credentialId,subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching fleets usage histories`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched fleets usage histories successfully',
        'responseCode': '000'
    });
});

exports.assignFleet = asyncHandler(async (req, res, next) => {
    const updatatedData = req.body;
    let credentialId = req.user.id;

    const result = await assignFleet(updatatedData,credentialId);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Fleet assigned successfully',
        'responseCode': '000'
    });

})

exports.updateFleet = asyncHandler(async (req, res, next) => {
    const { fleetId } = req.params;
    const updatatedData = req.body;
    const credentialId = req.user.id;
    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId };
    const result = await updateFleet(fleetId, {...updatatedData, credentialId}, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Fleet updated successfully',
        'responseCode': '000'
    });

})

//Delete fleet
exports.deleteFleet = asyncHandler(async (req, res, next) => {
    const { fleetId } = req.params

    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };
    const result = await deleteFleet(fleetId, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Fleet deleted successfully',
        'responseCode': '000'
    });

})
