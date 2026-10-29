const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router({ mergeParams: true });

const downloadRateLimiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 10,
    message: { status: false, message: 'Too many download requests. Please try again after 2 minutes.', responseCode: '429' },
    standardHeaders: true,
    legacyHeaders: false,
});

const conditionalDownloadRateLimit = (req, res, next) => {
    if (req.query.type === 'download') {
        return downloadRateLimiter(req, res, next);
    }
    next();
};

const { createAgreement, getAllAgreements, editAgreement, getAgreementById, downloadAgreement, uploadAgreementDocument, deleteAgreement, getAgreementDocument } = require('../../../../controllers/corporate/agreement');
const { validateCreateAgreement, validateGetAllAgreements, validateUploadAgreementDocument } = require('../../../../utils/apiValidation');

router.get('/all', validateGetAllAgreements, getAllAgreements);
router.get('/downloadAgreement/:agreementId', conditionalDownloadRateLimit, downloadAgreement);
router.get('/:id/document', getAgreementDocument);
router.get('/:id', getAgreementById);
router.post('/', validateCreateAgreement, createAgreement);
router.put('/:id', validateCreateAgreement, editAgreement);
router.put('/:id/uploadDocument', validateUploadAgreementDocument, uploadAgreementDocument);
router.delete('/:id', deleteAgreement);

module.exports = router;
