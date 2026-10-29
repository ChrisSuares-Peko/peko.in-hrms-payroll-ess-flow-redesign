const express = require('express')
const router = express.Router()
const { validateCreateSubCorporate, validateChangeStatusSubCorporate } = require('../../../utils/apiValidation')
const {
    listSubCorporates,
    createSubCorporate,
    updateSubCorporate,
    deleteSubCorporate,
    changeStatusSubCorporate,
    resendInvitation,
    subCorporateProfile, 
    validateSubCorporate,
    sendNotification,
    // checkNotification
} = require('../../../controllers/userManagement');
const { validateSubCorporateListQuery } = require('../../../utils/queryValidation');
const { verifyCorporateOwnerOrAdmin } = require('../../../middlewares/verifyCorporateOwnerOrAdmin');
const { sanitizeBodyBaseUrl } = require('../../../utils/trustedFrontendUrl');

router.get('/list', validateSubCorporateListQuery, listSubCorporates);

router.post('/validate', verifyCorporateOwnerOrAdmin, validateCreateSubCorporate, validateSubCorporate);

router.post('/', verifyCorporateOwnerOrAdmin, validateCreateSubCorporate, sanitizeBodyBaseUrl, createSubCorporate);

router.get('/resend/:subCorporateId', verifyCorporateOwnerOrAdmin, resendInvitation);

router.put('/:subCorporateId', verifyCorporateOwnerOrAdmin, updateSubCorporate);

router.patch('/:subCorporateId', verifyCorporateOwnerOrAdmin, validateChangeStatusSubCorporate, changeStatusSubCorporate);

router.delete('/:subCorporateId', verifyCorporateOwnerOrAdmin, deleteSubCorporate);

router.get('/profile', subCorporateProfile);

router.post('/send-notification',sendNotification)

// router.get('/check-notification',checkNotification)

module.exports = router
