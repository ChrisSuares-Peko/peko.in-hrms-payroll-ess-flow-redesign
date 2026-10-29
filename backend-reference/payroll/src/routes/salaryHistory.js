const express = require('express');
const router = express.Router({ mergeParams: true });
const { salaryHistoryList, salaryHistoryDetail, salaryHistoryReport, salaryStatsList, salaryStatsExcel,salaryHistorySimpleReport } = require('../controller/salary');

router.get('/', salaryHistoryList);
router.get('/stats', salaryStatsList);
router.get('/stats/export', salaryStatsExcel);
router.get('/detail', salaryHistoryDetail);
router.get('/report', salaryHistoryReport);
router.get('/report/simple', salaryHistorySimpleReport);

module.exports = router;
