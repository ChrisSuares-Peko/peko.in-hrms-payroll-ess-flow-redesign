const express = require('express');
const rateLimit = require('express-rate-limit');
const { findAllTemplates, findTemplateById } = require('../../../../controllers/admin/legalTemplates');
const { createDocument, getDocuments, getDocumentById, updateDocument, downloadDocument } = require('../../../../controllers/corporate/legalDocument');
const { savePersonalTemplate, getPersonalTemplates, getPersonalTemplateById } = require('../../../../controllers/corporate/userPersonalTemplate');
const { validateCreateLegalDocument, validateUpdateLegalDocument, validateGetLegalDocuments, validateSavePersonalTemplate } = require('../../../../utils/apiValidation');

const router = express.Router({ mergeParams: true });

const apiRateLimiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 10,
    message: { status: false, message: 'Too many requests. Please try again after 2 minutes.', responseCode: '429' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.get('/templates', findAllTemplates);
router.get('/templates/:id', findTemplateById);

router.post('/document', validateCreateLegalDocument, createDocument);
router.get('/documents', validateGetLegalDocuments, getDocuments);
router.get('/document/:id', getDocumentById);
router.put('/document/:id', validateUpdateLegalDocument, updateDocument);
router.get('/document/:id/download', apiRateLimiter, downloadDocument);

router.post('/personal-templates', validateSavePersonalTemplate, savePersonalTemplate);
router.get('/personal-templates', validateGetLegalDocuments, getPersonalTemplates);
router.get('/personal-templates/:id', getPersonalTemplateById);

module.exports = router;
