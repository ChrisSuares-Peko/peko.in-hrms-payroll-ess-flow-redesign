const express = require('express');
const router = express.Router({ mergeParams: true });

const {
    listEmailTemplateServices,
    getEmailTemplateService,
    createEmailTemplateService,
    updateEmailTemplateServiceActiveStatus,
} = require('../../../../controllers/admin/emailTemplateService');
const {
    validateCreateEmailTemplateService,
    validateEmailTemplateServiceActiveStatus,
} = require('../../../../validations/emailTemplateService');

// Authentication comes from the parent /system_user router (verifyToken), same as
// every other route mounted there.
router.get('/', listEmailTemplateServices);
router.post('/', validateCreateEmailTemplateService, createEmailTemplateService);
router.get('/:id', getEmailTemplateService);
router.patch('/:id/active', validateEmailTemplateServiceActiveStatus, updateEmailTemplateServiceActiveStatus);

module.exports = router;
