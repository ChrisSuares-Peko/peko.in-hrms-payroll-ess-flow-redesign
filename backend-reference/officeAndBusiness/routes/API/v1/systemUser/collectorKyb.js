const express = require('express');
const { findAllCollectorKybAndCount, collectorKybExcelCSV, collectorKybPDF, updateKybStatus } = require('../../../../controllers/admin/collectorKyb');

const router = express.Router({ mergeParams: true })

router.get('/find-all', findAllCollectorKybAndCount)
router.get('/pdf', collectorKybPDF)
router.get('/:type', collectorKybExcelCSV)
router.put('/update-status/:corporateId', updateKybStatus)

module.exports = router