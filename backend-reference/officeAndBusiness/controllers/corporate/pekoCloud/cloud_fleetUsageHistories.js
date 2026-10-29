const ErrorResponse = require('../../../utils/error-response')
const asyncHandler = require('../../../middlewares/async');
const { findAllUsageHistories, updateUsageHistory, deleteUsageHistory, findLatestUsageHistory } = require('../../../models/use-cases/pekoCloud/cloud_fleetUsageHistories');


//latest fleet usage
exports.findLatestFleetUsageHistory = asyncHandler(async (req, res, next) => {
    let {fleetId} = req.query;
    const result = await findLatestUsageHistory(fleetId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching usage`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result,
        'message': 'Fetched usage successfully',
        'responseCode': '000'
    });
});

//list all Usage Histories
exports.findAllFleetUsageHistories = asyncHandler(async (req, res, next) => {
    let { page, itemsPerPage, sortField, sort, searchText,fleetId } = req.query;
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;

    if (!sortField || !sort) {
        sortField = sortField || 'createdAt'
        sort = sort == 'ASC' ? 'ASC' : 'DESC'
    }

    const result = await findAllUsageHistories(page, itemsPerPage, sortField, sort, searchText,fleetId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching usage histories`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched Usage Histories successfully',
        'responseCode': '000'
    });
});

exports.updateFleetUsageHistory = asyncHandler(async (req, res, next) => {
    const { usageId } = req.params;
    const data = req.body;
    const credentialId = req.user.id;
    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId };
    const result = await updateUsageHistory(usageId, {...data, credentialId}, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Usage History updated successfully',
        'responseCode': '000'
    });

})

//Delete Company Doc
exports.deleteFleetUsageHistory = asyncHandler(async (req, res, next) => {
    const { usageId } = req.params

    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };
    const result = await deleteUsageHistory(usageId, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Usage History deleted successfully',
        'responseCode': '000'
    });

})
