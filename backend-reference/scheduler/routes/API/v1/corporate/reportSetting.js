const express = require('express')
const router = express.Router()

const { updateWeelySettings,getEmails,updateMonthlySettings,updateDailySettings, updateDailyStatus, updateMonthlyStatus, updateWeeklyStatus } = require('../../../../controllers/corporate/reportSettings');
const { validateApiResponse, validateStatus } = require('../../../../utils/apiValidation');



router.patch('/monthlyReport',validateApiResponse,updateMonthlySettings);
router.patch('/dailyReport',validateApiResponse,updateDailySettings);
router.patch('/weeklyReport',validateApiResponse,updateWeelySettings);

router.patch('/dailyReport/switchStatus',validateStatus,updateDailyStatus);
router.patch('/monthlyReport/switchStatus',validateStatus,updateMonthlyStatus);
router.patch('/weeklyReport/switchStatus',validateStatus,updateWeeklyStatus);

//Get Emails
router.get('/getEmails',getEmails);


module.exports = router