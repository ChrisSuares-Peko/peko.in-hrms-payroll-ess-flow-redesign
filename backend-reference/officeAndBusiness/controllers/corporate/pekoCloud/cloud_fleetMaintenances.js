const ErrorResponse = require('../../../utils/error-response')
const asyncHandler = require('../../../middlewares/async');
const { createFleetMaintenance, findAllFleetMaintenances, updateFleetMaintenance, deleteFleetMaintenance } = require('../../../models/use-cases/pekoCloud/cloud_fleetMaintenances');

exports.createFleetMaintenance = asyncHandler(async (req, res, next) => {
    let data = req.body;
    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };
    const result = await createFleetMaintenance(data, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    } else {
        return res.status(200).json({
            'status': true,
            'data': result,
            'message': 'Maintenance created successfully',
            'responseCode': '000'
        });
    }
});

//list all Fleet Maintenances
exports.findAllFleetMaintenances = asyncHandler(async (req, res, next) => {
    let { page, itemsPerPage, sortField, sort, searchText,fleetId } = req.query;
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;

    if (!sortField || !sort) {
        sortField = sortField || 'createdAt'
        sort = sort == 'ASC' ? 'ASC' : 'DESC'
    }

    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };
    const result = await findAllFleetMaintenances(page, itemsPerPage, sortField, sort, searchText, fleetId, owner);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching maintenances`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched Maintenances successfully',
        'responseCode': '000'
    });
});

exports.updateFleetMaintenance = asyncHandler(async (req, res, next) => {
    const { maintenanceId } = req.params;
    const data = req.body;
    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };

    const result = await updateFleetMaintenance(maintenanceId, data, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Maintenance updated successfully',
        'responseCode': '000'
    });

})

//Delete Fleet Maintenance
exports.deleteFleetMaintenance = asyncHandler(async (req, res, next) => {
    const { maintenanceId } = req.params
    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };


    const result = await deleteFleetMaintenance(maintenanceId, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Maintenance deleted successfully',
        'responseCode': '000'
    });

})
