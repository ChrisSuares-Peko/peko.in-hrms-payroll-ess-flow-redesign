const ErrorResponse = require('../../../utils/error-response')
const asyncHandler = require('../../../middlewares/async');
const { createChequeLeaf, findSingleChequeLeaf, findAllChequeLeavesList, findAllChequeLeaves, updateChequeLeaf, deleteChequeLeaf, getFinancialInfo } = require('../../../models/use-cases/pekoCloud/cloud_chequeLeaves');

exports.createChequeLeaf = asyncHandler(async (req, res, next) => {
    let data = req.body;
    let credentialId = req.user.id;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
        data.subCorporateUserId = req.user?.subCorporateId
    }
    const result = await createChequeLeaf({ ...data, credentialId }, req.user);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    } else {
        return res.status(200).json({
            'status': true,
            'data': result,
            'message': 'Cheque leaf added successfully',
            'responseCode': '000'
        });
    }
});

//single chequeLeaf
exports.findSingleChequeLeaf = asyncHandler(async (req, res, next) => {
    let {chequeLeafId} = req.params;
    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };
    const result = await findSingleChequeLeaf(chequeLeafId, owner);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching cheque leaves`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result,
        'message': 'Fetched cheque leaf successfully',
        'responseCode': '000'
    });
});

//list all chequeLeafs
exports.findAllChequeLeavesList = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;

    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    } 

    const result = await findAllChequeLeavesList(credentialId,subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching cheque leaves`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched cheque leaves successfully',
        'responseCode': '000'
    });
});

//list all chequeLeafs
exports.findAllChequeLeaves = asyncHandler(async (req, res, next) => {
    let { page, itemsPerPage, sortField, sort, searchText,chequeBookId } = req.query;
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

    const result = await findAllChequeLeaves(page, itemsPerPage, sortField, sort, searchText,credentialId,chequeBookId,subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching cheque leaves`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched cheque leaves successfully',
        'responseCode': '000'
    });
});

exports.updateChequeLeaf = asyncHandler(async (req, res, next) => {
    const { chequeLeafId } = req.params;
    const updatatedData = req.body;
    const credentialId = req.user.id;
    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId };
    const result = await updateChequeLeaf(chequeLeafId, {...updatatedData, credentialId}, req.user, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Cheque leaf updated successfully',
        'responseCode': '000'
    });

})

//Delete chequeLeaf
exports.deleteChequeLeaf = asyncHandler(async (req, res, next) => {
    const { chequeLeafId } = req.params

    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };
    const result = await deleteChequeLeaf(chequeLeafId, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Cheque leaf deleted successfully',
        'responseCode': '000'
    });

})

exports.getFinancialInfo = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;


    const result = await getFinancialInfo(credentialId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching cheque books`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Fetched financial info successfully',
        'responseCode': '000'
    });
});