const asyncHandler = require("../middleware/async");
const { createAttendanceRecord,fetchAllAttendanceRecords } = require('../models/use-cases/attendance');



exports.createAttendance = asyncHandler(async (req, res) => {

    const corporateUserId = req.user._id;
    const { month, year } = req.query;

    const { totalWorkDays, lossOfPay, totalPayDays, employee } = req.body;
    const params = {
        month,
        year,
        totalWorkDays,
        lossOfPay,
        totalPayDays,
        employee,
        corporateUserId
    }
    const result = await createAttendanceRecord(params);

    if (!result.status) {
        return res.status(400).json({
            status: false,
            message: result.message || 'Attendance creation failed',
        });
    }

    return res.status(201).json({
        status: true,
        message: 'Attendance record created successfully',
        data: result.data,
    });
});



exports.getAllAttendanceRecords = asyncHandler(async (req, res) => {
  const corporateUserId = req.user._id;
  const { month, year } = req.query;

  const attendanceRecords = await fetchAllAttendanceRecords({
    corporateUserId,
    month,
    year,
  });

  return res.status(200).json({
    status: true,
    message: 'Attendance records fetched successfully',
    data: attendanceRecords,
  });
});