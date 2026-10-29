const express = require('express')
const router = express.Router()
const { findAllWalletReports, generateExcelCSV, generatePDF } = require('../../../../controllers/corporate/walletReport')
const { getWalletDenominations } = require('../../../../controllers/admin/peko_wallet')
const { validateWalletReportsQuery } = require('../../../../utils/queryValidation')

router.get('/denominations', getWalletDenominations)
router.get("/all",validateWalletReportsQuery,findAllWalletReports);
router.get('/pdf', generatePDF)
router.get('/:type', generateExcelCSV)
module.exports = router
