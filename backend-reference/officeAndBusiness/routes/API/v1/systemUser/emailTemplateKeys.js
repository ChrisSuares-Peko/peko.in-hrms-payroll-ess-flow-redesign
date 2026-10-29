const express = require('express');
const router = express.Router({ mergeParams: true });

const {
    listEmailTemplateKeys,
    getEmailTemplateKey,
    createEmailTemplateKey,
    updateEmailTemplateKeyActiveStatus,
    updateEmailTemplateKeyVariables,
} = require('../../../../controllers/admin/emailTemplateKey');
const {
    validateCreateEmailTemplateKey,
    validateEmailTemplateKeyActiveStatus,
    validateSetEmailTemplateKeyVariables,
} = require('../../../../validations/emailTemplateKey');

// Authentication comes from the parent /system_user router (verifyToken), same as
// every other route mounted there. /variables is registered before /:id so it isn't
// swallowed as an id param.
router.put('/variables', validateSetEmailTemplateKeyVariables, updateEmailTemplateKeyVariables);
router.get('/', listEmailTemplateKeys);
router.post('/', validateCreateEmailTemplateKey, createEmailTemplateKey);
router.get('/:id', getEmailTemplateKey);
router.patch('/:id/active', validateEmailTemplateKeyActiveStatus, updateEmailTemplateKeyActiveStatus);

module.exports = router;
