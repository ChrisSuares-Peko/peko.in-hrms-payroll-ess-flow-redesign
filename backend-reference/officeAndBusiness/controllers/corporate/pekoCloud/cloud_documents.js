const asyncHandler = require("../../../middlewares/async");
const ErrorResponse = require("../../../utils/error-response");
const { getDocumentDecrypted } = require("../../../utils/s3");
const cloud_documents = require("../../../models/entities/pekoCloud/cloud_documents");

exports.getDocument = asyncHandler(async (req, res, next) => {
    const { key } = req.query;

    if (!key) {
        return next(new ErrorResponse(`key is required`, 400));
    }

    // Only decrypt a key that belongs to one of the caller's own document rows — matches the
    // list scoping (sub-users by subCorporateUserId, else credentialId). Prevents decrypting
    // another tenant's encrypted KYC/financial documents via a raw ?key=.
    const where = { document: key };
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
        where.subCorporateUserId = req.user.subCorporateId;
    } else {
        where.credentialId = req.user.id;
    }
    const owned = await cloud_documents.findOne({ where });
    if (!owned) {
        return next(new ErrorResponse(`Document not found`, 404));
    }

    const result = await getDocumentDecrypted(key);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching document`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result,
        'message': 'Fetched Document successfully',
        'responseCode': '000'
    });
});