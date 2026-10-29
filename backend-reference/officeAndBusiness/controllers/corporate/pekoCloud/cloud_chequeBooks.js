const ErrorResponse = require('../../../utils/error-response')
const asyncHandler = require('../../../middlewares/async');
const { createChequeBook, findSingleChequeBook, findAllChequeBooksList, findAllChequeBooks, updateChequeBook, deleteChequeBook } = require('../../../models/use-cases/pekoCloud/cloud_chequeBooks');

exports.createChequeBook = asyncHandler(async (req, res, next) => {
    let data = req.body;
    let credentialId = req.user.id;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
        data.subCorporateUserId = req.user?.subCorporateId
    }
    const result = await createChequeBook({ ...data, credentialId }, req.user);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    } else {
        return res.status(200).json({
            'status': true,
            'data': result,
            'message': 'Cheque Book created successfully',
            'responseCode': '000'
        });
    }
});

//single chequeBook
exports.findSingleChequeBook = asyncHandler(async (req, res, next) => {
    let {chequeBookId} = req.params;
    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };
    const result = await findSingleChequeBook(chequeBookId, owner);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching cheque books`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result,
        'message': 'Fetched cheque book successfully',
        'responseCode': '000'
    });
});

//list all chequeBooks
exports.findAllChequeBooksList = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;
    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    } 

    const result = await findAllChequeBooksList(credentialId, subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching cheque books`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched cheque books successfully',
        'responseCode': '000'
    });
});

//list all chequeBooks
exports.findAllChequeBooks = asyncHandler(async (req, res, next) => {
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

    const result = await findAllChequeBooks(page, itemsPerPage, sortField, sort, searchText,credentialId, subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching cheque books`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched cheque books successfully',
        'responseCode': '000'
    });
});

exports.updateChequeBook = asyncHandler(async (req, res, next) => {
    const { chequeBookId } = req.params;
    const updatatedData = req.body;
    const credentialId = req.user.id;
    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId };
    const result = await updateChequeBook(chequeBookId, {...updatatedData, credentialId}, req.user, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Cheque book updated successfully',
        'responseCode': '000'
    });

})

//Delete chequeBook
exports.deleteChequeBook = asyncHandler(async (req, res, next) => {
    const { chequeBookId } = req.params

    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };
    const result = await deleteChequeBook(chequeBookId, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Cheque book deleted successfully',
        'responseCode': '000'
    });

})
