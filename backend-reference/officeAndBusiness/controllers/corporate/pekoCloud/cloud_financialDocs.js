const ErrorResponse = require('../../../utils/error-response')
const asyncHandler = require('../../../middlewares/async');
const { createFinancialDoc, findAllFinancialDocs, updateFinancialDoc, deleteFinancialDoc, findAllFinancialDocsList, countAllFinancialDocs } = require('../../../models/use-cases/pekoCloud/cloud_financialDocs');
const { findAllChequeLeavesList } = require('../../../models/use-cases/pekoCloud/cloud_chequeLeaves');

exports.createFinancialDoc = asyncHandler(async (req, res, next) => {
    let data = req.body;
    let credentialId = req.user.id;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
        data.subCorporateUserId = req.user?.subCorporateId
    }
    const result = await createFinancialDoc({ ...data, credentialId },req.user);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    } else {
        return res.status(200).json({
            'status': true,
            'data': result,
            'message': 'Document created successfully',
            'responseCode': '000'
        });
    }
});

//list all Financial Docs List
exports.findAllFinancialDocsList = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;
    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    }

    const result = await findAllFinancialDocsList( credentialId, subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching documents`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched Documents successfully',
        'responseCode': '000'
    });
});

//get Financial Docs Info
exports.getFinancialsInfoDetails = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;

    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    }

    const details = {
        totalDocuments: 0,
        totalCheques: 0,
        chequesPending: 0,
        chequesCleared: 0,
    }
    const financialsResult = await countAllFinancialDocs(credentialId, subCorporateUserId);
    if (!financialsResult.success) {
        return next(new ErrorResponse(`Something went wrong while fetching financial info`, 500));
    }
    details.totalDocuments = financialsResult.data
    
    const chequesResult = await findAllChequeLeavesList(credentialId, subCorporateUserId);
    if (!chequesResult.success) {
        return next(new ErrorResponse(`Something went wrong while fetching financial info`, 500));
    }
    const chequeLeaves = chequesResult.data
    details.totalCheques = chequeLeaves?.count ?? 0
    details.chequesCleared = chequeLeaves.rows.filter(cheque => cheque.status === 'Cleared').length
    details.chequesPending = chequeLeaves.rows.filter(cheque => cheque.status === 'Pending').length

    return res.status(200).json({
        'status': true,
        'data': details,
        'message': 'Fetched financial info successfully',
        'responseCode': '000'
    });
});

//list all Financial Docs
exports.findAllFinancialDocs = asyncHandler(async (req, res, next) => {
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

    const result = await findAllFinancialDocs(page, itemsPerPage, sortField, sort, searchText, credentialId,subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching documents`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched Documents successfully',
        'responseCode': '000'
    });
});

exports.updateFinancialDoc = asyncHandler(async (req, res, next) => {
    const { docId } = req.params;
    const data = req.body;
    const credentialId = req.user.id;
    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId };
    const result = await updateFinancialDoc(docId, {...data, credentialId}, req.user, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Document updated successfully',
        'responseCode': '000'
    });

})

//Delete Financial Doc
exports.deleteFinancialDoc = asyncHandler(async (req, res, next) => {
    const { docId } = req.params

    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };
    const result = await deleteFinancialDoc(docId, owner);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Document deleted successfully',
        'responseCode': '000'
    });

})
