const express = require('express')
const router = express.Router()
const { findAllWalletReports, generateExcelCSV, generatePDF, retryWalletTransferJournal } = require('../../../../controllers/admin/walletReport')
const { walletReportsValidation } = require('../../../../utils/queryValidation')

router.get('/all', walletReportsValidation, findAllWalletReports)//✅
router.get('/pdf',walletReportsValidation, generatePDF)
router.put('/:id/journal/retry', retryWalletTransferJournal)
router.get('/:type',walletReportsValidation, generateExcelCSV)
module.exports = router
