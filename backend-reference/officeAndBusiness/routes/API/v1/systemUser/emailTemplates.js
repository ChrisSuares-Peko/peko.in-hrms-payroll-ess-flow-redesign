const express = require('express');
const router = express.Router({ mergeParams: true });

const {
    listEmailTemplates,
    getEmailTemplate,
    createEmailTemplate,
    importEmailTemplates,
    updateEmailTemplateDraft,
    publishEmailTemplate,
    updateEmailTemplateActiveStatus,
    listEmailTemplateServices,
    listEmailTemplateKeysForService,
    listEmailTemplateKeyVariables,
} = require('../../../../controllers/admin/emailTemplate');
const {
    validateCreateEmailTemplate,
    validateUpdateEmailTemplate,
    validateEmailTemplateActiveStatus,
} = require('../../../../validations/emailTemplate');

// Authentication comes from the parent /system_user router (verifyToken),
// same as every other route mounted there (e.g. invoice-templete).
// Registered before /:id so "services" isn't swallowed as an id param.
router.get('/services', listEmailTemplateServices);
router.get('/services/:service/keys', listEmailTemplateKeysForService);
router.get('/services/:service/keys/:key/variables', listEmailTemplateKeyVariables);
router.get('/', listEmailTemplates);
router.post('/', validateCreateEmailTemplate, createEmailTemplate);
router.post('/import', importEmailTemplates);
router.get('/:id', getEmailTemplate);
router.put('/:id', validateUpdateEmailTemplate, updateEmailTemplateDraft);
router.post('/:id/publish', publishEmailTemplate);
router.patch('/:id/active', validateEmailTemplateActiveStatus, updateEmailTemplateActiveStatus);

module.exports = router;
