const Attendance=require("../entities/attendance")
const Employee=require("../entities/employee")



exports.createAttendanceRecord = async (params) => {
  const { employee, totalWorkDays, lossOfPay, totalPayDays, month, year,corporateUserId } = params;

  // Check if record already exists for the employee in the same month and year
  const existing = await Attendance.findOne({ employee, month, year });
  if (existing) {
    return {
      status: false,
      message: 'Attendance record already exists for this employee in the specified month and year.',
    };
  }

  const attendance = new Attendance({
    employee,
    totalWorkDays,
    lossOfPay,
    totalPayDays,
    month,
    year,
    corporateUser:corporateUserId
  });

  const data = await attendance.save();
  return { status: true, data };
};



exports.fetchAllAttendanceRecords = async ({ corporateUserId, month, year }) => {
  // 1. Get all active (non-deleted) employees
  const employees = await Employee.find(
    { corporateUser: corporateUserId, isEmployeeDeleted: { $ne: true } },
    '_id'
  );

  const employeeIds = employees.map(emp => emp._id);

  // 2. Build the query
  const query = {
    corporateUser: corporateUserId,
    employee: { $in: employeeIds }
  };

  if (month) query.month = parseInt(month);
  if (year) query.year = parseInt(year);

  // 3. Get attendance records
  const attendanceRecords = await Attendance.find(query)
    .populate('employee', 'name employeeId')
    .sort({ createdAt: -1 });

  return attendanceRecords;
};