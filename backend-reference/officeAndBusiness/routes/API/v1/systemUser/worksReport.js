const express = require('express')
const { validateWorkReportUpdateStatus } = require('../../../../utils/apiValidation')
const { findAllTransactionsAndCount, worksGeneratePDF, worksGenerateExcelCSV, updateWorks } = require('../../../../controllers/admin/worksReport')
const router = express.Router()

router.get('/', findAllTransactionsAndCount)
router.get('/pdf', worksGeneratePDF)
router.get('/:type', worksGenerateExcelCSV)
router.patch('/:id',validateWorkReportUpdateStatus, updateWorks)


module.exports = router