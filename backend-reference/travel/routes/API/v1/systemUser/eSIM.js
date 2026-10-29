const express = require('express')
const router = express.Router()
const { findAllTransactionsAndCount, esimOrderGenerateExcelCSV, esimOrderGeneratePDF } = require('../../../../controllers/admin/eSIM')
const { validateReportsQuery } = require('../../../../utils/apiValidation/queryValidation')



router.get('/reports', validateReportsQuery, findAllTransactionsAndCount)
router.get('/reports/pdf', validateReportsQuery, esimOrderGeneratePDF)
router.get('/reports/:type', validateReportsQuery, esimOrderGenerateExcelCSV)

module.exports = router