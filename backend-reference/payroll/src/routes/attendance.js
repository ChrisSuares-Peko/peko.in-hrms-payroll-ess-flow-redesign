const express = require("express");
const { createAttendance,getAllAttendanceRecords } = require("../controller/attendance");
const router = express.Router();


router.get("/",getAllAttendanceRecords);
router.post('/',createAttendance);


module.exports = router;
