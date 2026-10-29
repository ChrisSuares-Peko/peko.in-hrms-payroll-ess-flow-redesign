const express = require('express');
const {
     findAllCorporateUsers,
     updateStatus,
     fetchPackages,
     updateCorporateUserAdmin,
     corporateUserPDF,
     corporateUserExcelCSV,
     getCorporateDetailsByEmailOrUsername,
     fetchCorporateListController,
} = require('../../../../controllers/admin/corporateUser')
const { fetchAllPartner } = require('../../../../controllers/admin/credential');
const { fetchAllSubPartner } = require('../../../../controllers/admin/partner');
const {
     findAllSystemUserAndCount,
     createSystemUser,
     deleteSystemUser,
     resendEmail,
     updateSystemUser,
     updateSystemUserStatus,
     systemUserPDF,
     systemUserExcelCSV,
     createSystemPartner,
     updateSystemPartner,
     findOnePartnerUser
} = require('../../../../controllers/admin/systemUser')
const {
     validateUpdateCorporate,
     validateIsActiveStatus,
     validateSystemUser,
} = require('../../../../utils/apiValidation');
const { findAllSubscriptions, subscriptionsGeneratePDF, subscriptionsGenerateExcelCSV } = require('../../../../controllers/admin/subscriptions');
const { validateCorporateUsersQuery, findAllSubscriptionsValidation, findAllSystemUsersValidation } = require('../../../../utils/queryValidation');
const { requireAdminSystemUser } = require('../../../../utils/jwtToken');

const router = express.Router({mergeParams:true})

//CORPORATE USERS
router.get('/corporate-users',validateCorporateUsersQuery, findAllCorporateUsers);//✅
router.get('/corporate-users/list', fetchCorporateListController);
router.get('/corporate-users/details', getCorporateDetailsByEmailOrUsername);
router.get('/corporate-users/pdf',validateCorporateUsersQuery, corporateUserPDF)//✅
router.get('/corporate-users/:type',validateCorporateUsersQuery, corporateUserExcelCSV)//✅
router.get('/fetch-partner', fetchAllPartner);//✅
router.get('/fetch-subpartner', fetchAllSubPartner);
router.get('/fetch-packages', fetchPackages);//✅
router.put('/status-update/:corporateId',validateIsActiveStatus, updateStatus)//✅
router.put('/:corporateId',validateUpdateCorporate, updateCorporateUserAdmin)//✅


router.get('/subscriptions',findAllSubscriptionsValidation, findAllSubscriptions);
router.get('/subscriptions/pdf',findAllSubscriptionsValidation, subscriptionsGeneratePDF);
router.get('/subscriptions/:type', findAllSubscriptionsValidation, subscriptionsGenerateExcelCSV);


//SYSTEM USERS
router.get('/system-users',findAllSystemUsersValidation, findAllSystemUserAndCount);//✅
router.get('/system-users/pdf',findAllSystemUsersValidation, systemUserPDF)//✅
router.get('/system-users/:type',findAllSystemUsersValidation, systemUserExcelCSV)//✅
router.post('/system-users', requireAdminSystemUser, validateSystemUser,createSystemUser)//✅
router.post('/system-partner',createSystemPartner);
router.delete('/system-users/:id', requireAdminSystemUser, deleteSystemUser)
router.get('/system-users/resend-mail/:id',resendEmail)//✅
router.put('/system-users/:id', requireAdminSystemUser, validateSystemUser,updateSystemUser)//✅
router.put('/system-users/update-status/:id', requireAdminSystemUser, validateIsActiveStatus,updateSystemUserStatus)//✅
router.put('/system-partner/:id', updateSystemPartner);
router.get('/system-partner/permission/:id',findOnePartnerUser);

module.exports = router