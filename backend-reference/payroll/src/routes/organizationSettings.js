const express = require('express');
const router = express.Router();

const {companyProfileFilesUpload  } = require('../middleware/fileUpload');
const{validatePayrollSettings,validateBankDetails, validateOrganizationSettings}= require('../middleware/organizationSettings')
const {updateCompanyProfile,updatePayrollSettings,updateBankDetails,getOrganizationSettings,findCorporateDetails,getCompanyProfile,getPayrollCycle,getPayrollActiveYears} = require('../controller/organizationSettings')
const { updateProgress } = require('../middleware/updateProgress')

router.get('/', getOrganizationSettings);
router.get('/companyProfile', getCompanyProfile);
router.get('/payrollCycle', getPayrollCycle);
router.get("/corporate-details", findCorporateDetails);
// router.post('/company-profile',validateCompanyProfile, companyProfileFilesUpload, updateCompanyProfile)
router.post('/company-profile',validateOrganizationSettings,companyProfileFilesUpload, updateProgress, updateCompanyProfile)
// router.post('/payroll-settings',validatePayrollSettings, updatePayrollSettings)
router.post('/payroll-settings',validatePayrollSettings, updateProgress, updatePayrollSettings)
router.post('/bank-details',validateBankDetails, updateBankDetails)
router.get('/active-years',getPayrollActiveYears)





module.exports = router;
