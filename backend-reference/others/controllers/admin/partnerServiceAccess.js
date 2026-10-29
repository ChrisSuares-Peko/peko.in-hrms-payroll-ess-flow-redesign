const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const {
    fetchAllPartnerServiceAccess,
    replacePartnerServiceAccess,
    updatePartnerServiceAccessById,
    deletePartnerServiceAccessById,
    isPartnerCredential,
} = require('../../models/use-cases/partnerServiceAccess');

exports.findAllPartnerServiceAccess = asyncHandler(async (req, res) => {
    let { partnerId, searchText, status, page, itemsPerPage } = req.query;

    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;

    const params = {
        partnerId,
        searchText,
        status,
        limit: itemsPerPage,
        offset: page && itemsPerPage ? (page - 1) * itemsPerPage : undefined,
    };

    const data = await fetchAllPartnerServiceAccess(params);

    return res.status(200).json({
        status: true,
        message: 'Partner service access fetched successfully',
        data,
        responseCode: '000',
    });
});

exports.replacePartnerServiceAccess = asyncHandler(async (req, res, next) => {
    const { partnerId, permissions } = req.body;

    const isPartner = await isPartnerCredential(partnerId);
    if (!isPartner) {
        return next(new ErrorResponse('No partner found for the provided partnerId', 400));
    }

    const result = await replacePartnerServiceAccess(partnerId, permissions);

    if (!result) {
        return next(
            new ErrorResponse('Something went wrong while saving partner service access', 500)
        );
    }

    return res.status(200).json({
        status: true,
        message: 'Partner service access saved successfully',
        data: result,
        responseCode: '000',
    });
});

exports.updatePartnerServiceAccess = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await updatePartnerServiceAccessById(id, req.body);

    if (!result) {
        return next(new ErrorResponse('Partner service access does not exist', 404));
    }

    return res.status(200).json({
        status: true,
        message: 'Partner service access updated successfully',
        data: {},
        responseCode: '000',
    });
});

exports.deletePartnerServiceAccess = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await deletePartnerServiceAccessById(id);

    if (!result) {
        return next(new ErrorResponse('Partner service access does not exist', 404));
    }

    return res.status(200).json({
        status: true,
        message: 'Partner service access deleted successfully',
        data: {},
        responseCode: '000',
    });
});
