const ErrorResponse = require('../../../utils/error-response')
const asyncHandler = require('../../../middlewares/async');
const { findAllUsageHistories, updateUsageHistory, deleteUsageHistory, findLatestUsageHistory } = require('../../../models/use-cases/pekoCloud/cloud_assetUsageHistories');


//latest asset usage
exports.findLatestUsageHistory = asyncHandler(async (req, res, next) => {
    let {assetId} = req.query;
    const result = await findLatestUsageHistory(assetId);
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
exports.findAllUsageHistories = asyncHandler(async (req, res, next) => {
    let { page, itemsPerPage, sortField, sort, searchText,assetId } = req.query;
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;

    if (!sortField || !sort) {
        sortField = sortField || 'createdAt'
        sort = sort == 'ASC' ? 'ASC' : 'DESC'
    }

    const result = await findAllUsageHistories(page, itemsPerPage, sortField, sort, searchText,assetId);
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

exports.updateUsageHistory = asyncHandler(async (req, res, next) => {
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
exports.deleteUsageHistory = asyncHandler(async (req, res, next) => {
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
