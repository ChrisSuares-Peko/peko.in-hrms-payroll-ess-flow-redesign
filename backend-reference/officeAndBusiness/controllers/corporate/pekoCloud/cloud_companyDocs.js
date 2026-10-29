const ErrorResponse = require('../../../utils/error-response')
const asyncHandler = require('../../../middlewares/async');
const { createCompanyDoc, findAllCompanyDocs, updateCompanyDoc, deleteCompanyDoc, findAllCompanyDocsList } = require('../../../models/use-cases/pekoCloud/cloud_companyDocs');

const initialDocs = [
    'Trade Licenses',
    'MOA & AOA',
    'Immigration Establishment Cards',
    'Ministry of Labour Establishment Cards',
];

exports.createCompanyDoc = asyncHandler(async (req, res, next) => {
    let data = req.body;
    let credentialId = req.user.id;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
        data.subCorporateUserId = req.user?.subCorporateId
    }
    const result = await createCompanyDoc({ ...data, credentialId },req.user);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    } else {
        return res.status(200).json({
            'status': true,
            'data': result,
            'message': 'Document added successfully',
            'responseCode': '000'
        });
    }
});

//list all Company Docs List
exports.findAllCompanyDocsList = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;

    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    } 

    const result = await findAllCompanyDocsList( credentialId, subCorporateUserId);
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

//Get info details for the section
exports.getCompanyInfoDetails = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;

    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    } 

    const details = {
        totalDocuments: 0,
        activeDocuments: 0,
        expiredDocuments: 0,
        completionLevel: 0
    };

    const result = await findAllCompanyDocsList(credentialId, subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching documents info`, 500));
    }
    
    const data = result.data;
    
    details.totalDocuments = data.count;
    
    const processedDocs = new Set();
    
    data?.rows?.forEach(item => {
        const isExpired = item.expireDate ? new Date() > new Date(item.expireDate) : false;
        const status = isExpired ? 'EXPIRED' : 'ACTIVE';
        
        if (status === 'ACTIVE') details.activeDocuments+=1;
        else details.expiredDocuments+=1;
        
        processedDocs.add(item.documentName);
    });
    
    // Calculate completion level based on missing documents
    const missingDocsCount = initialDocs.filter(docName => !processedDocs.has(docName)).length;
    details.completionLevel = (((initialDocs.length - missingDocsCount) / initialDocs.length) * 100).toFixed(2);
    
    return res.status(200).json({
        'status': true,
        'data': details,
        'message': 'Fetched Documents Info successfully',
        'responseCode': '000'
    });
});

//list all Company Docs
exports.findAllCompanyDocs = asyncHandler(async (req, res, next) => {
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

    const result = await findAllCompanyDocs(page, itemsPerPage, sortField, sort, searchText, credentialId,subCorporateUserId);
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

exports.updateCompanyDoc = asyncHandler(async (req, res, next) => {
    const { docId } = req.params;
    const data = req.body;
    const credentialId = req.user.id;
    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId };
    const result = await updateCompanyDoc(docId, {...data, credentialId}, req.user, owner);
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

//Delete Company Doc
exports.deleteCompanyDoc = asyncHandler(async (req, res, next) => {
    const { docId } = req.params

    const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
        ? { subCorporateUserId: req.user.subCorporateId }
        : { credentialId: req.user.id };
    const result = await deleteCompanyDoc(docId, owner);
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
