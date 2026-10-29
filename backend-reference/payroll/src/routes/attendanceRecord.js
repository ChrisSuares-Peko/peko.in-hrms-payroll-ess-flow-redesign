const express = require('express');
const router = express.Router();
const { getMonthlySummary, getShiftSchedule, getDailyLog, markAttendance, updateDailyLogRecord, getTodayAttendanceCounts } = require('../controller/attendanceRecord');

router.get('/monthly-summary', getMonthlySummary);
router.get('/shift-schedule', getShiftSchedule);
router.get('/daily-log', getDailyLog);
router.get('/today-summary', getTodayAttendanceCounts);
router.post('/mark', markAttendance);
router.put('/:id', updateDailyLogRecord);

module.exports = router;
