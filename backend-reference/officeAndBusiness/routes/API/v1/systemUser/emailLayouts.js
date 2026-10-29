const express = require('express');
const router = express.Router({ mergeParams: true });

const {
    listEmailLayouts,
    getEmailLayout,
    createEmailLayout,
    updateEmailLayoutDraft,
    publishEmailLayout,
    updateEmailLayoutActiveStatus,
} = require('../../../../controllers/admin/emailLayout');
const {
    validateCreateEmailLayout,
    validateUpdateEmailLayout,
    validateEmailLayoutActiveStatus,
} = require('../../../../validations/emailLayout');

// Auth comes from the parent /system_user router. draftHtml is plain HTML in the body, no Base64 step.
router.get('/', listEmailLayouts);
router.post('/', validateCreateEmailLayout, createEmailLayout);

router.get('/:id', getEmailLayout);
router.put('/:id', validateUpdateEmailLayout, updateEmailLayoutDraft);
router.post('/:id/publish', publishEmailLayout);
router.patch('/:id/active', validateEmailLayoutActiveStatus, updateEmailLayoutActiveStatus);

module.exports = router;
