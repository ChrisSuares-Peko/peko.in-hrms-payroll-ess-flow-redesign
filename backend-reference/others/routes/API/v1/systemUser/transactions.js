const express = require('express')
const router = express.Router()

const { generateExcelCSV, findAllTransactionsAndCountCorporateSide, getTransactionReport, getTransactionReportExcelCSV, getTransactionReportPDF } = require('../../../../controllers/corporate/transactionReport')
const { findAllTransactionsCorporateValidation, getTransactionReportValidation } = require('../../../../utils/queryValidation')


router.get('/', findAllTransactionsCorporateValidation, findAllTransactionsAndCountCorporateSide)//✅
router.get('/reports',getTransactionReportValidation, getTransactionReport)
router.get('/reports/pdf',getTransactionReportValidation, getTransactionReportPDF)
router.get('/reports/:type',getTransactionReportValidation, getTransactionReportExcelCSV)
// router.get('/excel', generateExcelCSV)
router.get('/:type', generateExcelCSV)


module.exports = router