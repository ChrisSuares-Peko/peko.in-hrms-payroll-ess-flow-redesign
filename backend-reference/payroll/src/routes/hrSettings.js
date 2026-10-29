const express = require('express');
const router = express.Router();

const { hrSettingsFilesUpload } = require('../middleware/fileUpload');
const { validateHrSettingsPayrollUpdate, validateHrSettingsLeaveUpdate, validateOnboardingDocumentsUpdate, validateGracePeriodUpdate, validateCheckInOutUpdate, validateWorkScheduleUpdate } = require('../utils/apiValidation');
const { getHrSettings, payrollSettings, leaveSettings, updateHrSettings, updatePayrollSettings, updateLeaveSettings, updateWpsSettings, getWpsSettings, getOnboardingDocuments, setOnboardingDocuments, getGracePeriod, setGracePeriod, getCheckInOutStatus, setCheckInOutStatus, getDefaultWorkSchedule, setDefaultWorkSchedule } = require('../controller/hrSettings')

router.get('/', getHrSettings);
router.get('/payroll-settings', payrollSettings);
router.get('/leave-settings', leaveSettings);

// Create or Update HR Settings for a Corporate User
router.post('/', hrSettingsFilesUpload, updateHrSettings)
router.post('/payroll-settings', validateHrSettingsPayrollUpdate, hrSettingsFilesUpload, updatePayrollSettings)
router.post('/leave-settings', validateHrSettingsLeaveUpdate, updateLeaveSettings);
router.post('/wps-settings', updateWpsSettings)
router.get('/wps-settings', getWpsSettings)

// ESS Settings tab
router.get('/onboarding-documents', getOnboardingDocuments);
router.post('/onboarding-documents', validateOnboardingDocumentsUpdate, setOnboardingDocuments);
router.get('/grace-period', getGracePeriod);
router.post('/grace-period', validateGracePeriodUpdate, setGracePeriod);
router.get('/check-in-out', getCheckInOutStatus);
router.post('/check-in-out', validateCheckInOutUpdate, setCheckInOutStatus);
router.get('/work-schedule', getDefaultWorkSchedule);
router.post('/work-schedule', validateWorkScheduleUpdate, setDefaultWorkSchedule);

module.exports = router;
