const express = require('express')
const router = express.Router()
const {
     createReferralCode,
     findAllReferralCodesAndCount,
     updateReferralCode,
     deleteReferralCode,
     updateStatus,
     referralCodesAndCountPDF,
     referralCodesAndCountExcelCSV,
    referralCountReports,
    referralCountReportsExcel,
    generalReferralReportsExcel,
    fetchReferralReward,
    updateReferralReward,
    findAllReferralCodes
} = require('../../../../controllers/admin/referral_codes')
const { validateReferralCode, validateActiveStatus, validateReferralReward } = require('../../../../utils/apiValidation')

//referral code 
router.get('/referral-reward', fetchReferralReward);
router.patch('/referral-reward', validateReferralReward, updateReferralReward)
const { findAllReferralCodesAndCountValidation, generalReferralReportsExcelValidation } = require('../../../../utils/queryValidation')

router.post('/',validateReferralCode, createReferralCode)
router.get('/all',findAllReferralCodesAndCountValidation, findAllReferralCodesAndCount)
router.get('/getCodes', findAllReferralCodes)
router.get('/pdf',findAllReferralCodesAndCountValidation, referralCodesAndCountPDF)
router.get('/referralReports', referralCountReports);
router.get('/referralReportsExcel', referralCountReportsExcel);
router.get('/referralReport/downloadExcel',generalReferralReportsExcelValidation, generalReferralReportsExcel);
router.get('/:type',findAllReferralCodesAndCountValidation, referralCodesAndCountExcelCSV)
router.put('/:id',validateReferralCode, updateReferralCode)
router.delete('/:id', deleteReferralCode);
router.put('/updateStatus/:id',validateActiveStatus, updateStatus);
module.exports = router