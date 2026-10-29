

const express = require('express')
const router = express.Router()

const { updateWeelySettings,getEmails,updateMonthlySettings,updateDailySettings, updateDailyStatus, updateMonthlyStatus, updateWeeklyStatus } = require('../../../../controllers/corporate/reportSettings');



router.patch('/monthlyReport',updateMonthlySettings);//✅
router.patch('/dailyReport',updateDailySettings);//✅
router.patch('/weeklyReport',updateWeelySettings);//✅

router.patch('/dailyReport/switchStatus',updateDailyStatus);
router.patch('/monthlyReport/switchStatus',updateMonthlyStatus);
router.patch('/weeklyReport/switchStatus',updateWeeklyStatus);


//Get Emails
router.get('/getEmails',getEmails);//✅



module.exports = router