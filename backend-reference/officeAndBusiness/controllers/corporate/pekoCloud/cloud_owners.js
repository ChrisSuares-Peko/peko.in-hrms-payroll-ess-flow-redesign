const ErrorResponse = require('../../../utils/error-response')
const asyncHandler = require('../../../middlewares/async');
const { createOwner, findAllOwners, updateOwner, deleteOwner } = require('../../../models/use-cases/pekoCloud/cloud_owners');

exports.createOwner = asyncHandler(async (req, res, next) => {
    let data = req.body;
    let credentialId = req.user.id;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
        data.subCorporateUserId = req.user?.subCorporateId
    }
    const result = await createOwner({ ...data, credentialId }, req.user);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    } else {
        return res.status(200).json({
            'status': true,
            'data': result,
            'message': 'Owner created successfully',
            'responseCode': '000'
        });
    }
});

//list all owners
exports.findAllOwners = asyncHandler(async (req, res, next) => {
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

    const result = await findAllOwners(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching owners`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched owners successfully',
        'responseCode': '000'
    });
});

exports.updateOwner = asyncHandler(async (req, res, next) => {
    const { ownerId } = req.params;
    const data = req.body;
    const credentialId = req.user.id;
    // Owner scope matches the list (sub-user → subCorporateUserId, else credentialId).
    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId };
    // credentialId forced LAST so a client-supplied credentialId can't reassign ownership.
    const result = await updateOwner(ownerId, {...data, credentialId}, req.user, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Owner updated successfully',
        'responseCode': '000'
    });

})

//Delete owner
exports.deleteOwner = asyncHandler(async (req, res, next) => {
    const { ownerId } = req.params

    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };
    const result = await deleteOwner(ownerId, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Owner deleted successfully',
        'responseCode': '000'
    });

})
