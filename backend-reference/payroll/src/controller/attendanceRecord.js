const asyncHandler = require('../middleware/async');
const Employee = require('../models/entities/employee');
const OrganizationSettings = require('../models/entities/organizationSettings');
const LeaveApplication = require('../models/entities/leaveApplication');
const { findEmployeeByIdAndCorporateUser } = require('../models/use-cases/employee');
const { escapeSearch } = require('../utils/escapeRegex');
const {
    findMonthlySummary,
    findShiftSchedule,
    findDailyLog,
    markAttendanceManually,
    updateAttendanceById,
    getEmployeeAttendanceMetrics,
    getTodayAttendanceCounts,
} = require('../models/use-cases/attendanceRecord');

// Attendance dates are stored as the employee's local midnight expressed in UTC
// (see markAttendance below), so deriving a calendar-day key must use the server's
// local timezone getters, not toISOString() (which would read back the UTC day and
// land one day early/late relative to how the record was actually saved).
const toLocalDateKey = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// Shapes a raw Employee doc into the compact form exposed on daily-log rows.
const toDailyLogEmployeeShape = emp => ({
    _id: emp._id,
    employeeId: emp.employeeInformation?.employeeId ?? null,
    fullName: emp.personalInformation?.fullName ?? null,
    email: emp.personalInformation?.email ?? null,
    profileImage: emp.profileImage ?? null,
    designation: emp.employeeInformation?.designation ?? null,
    shift: emp.employeeInformation?.timeSchedule ?? null,
});

// GET /attendance-record/monthly-summary
// Returns paginated per-employee aggregated attendance stats for a given month.
// Query params: month (YYYY-MM), employee (id), search (name), page, limit
exports.getMonthlySummary = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id.toString();
    const { employee, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));

    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();

    if (req.query.month) {
        const m = /^(\d{4})-(\d{2})$/.exec(req.query.month);
        if (!m) {
            return res.status(400).json({ status: false, message: "Invalid 'month'. Expected format YYYY-MM" });
        }
        year = parseInt(m[1], 10);
        month = parseInt(m[2], 10) - 1;
        if (month < 0 || month > 11) {
            return res.status(400).json({ status: false, message: 'Invalid month value. Must be 01-12' });
        }
    }

    const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    let employeeIds;
    if (search) {
        const matches = await Employee.find(
            { corporateUser, 'personalInformation.fullName': { $regex: escapeSearch(search), $options: 'i' } },
            '_id'
        );
        employeeIds = matches.map(e => e._id);
        if (employeeIds.length === 0) {
            return res.status(200).json({
                status: true,
                responseCode: '000',
                message: 'Monthly summary retrieved successfully',
                data: [],
                pagination: { total: 0, page, limit, totalPages: 0 },
                period: { month: req.query.month || `${year}-${String(month + 1).padStart(2, '0')}`, from: monthStart, to: monthEnd },
            });
        }
    } else if (employee) {
        employeeIds = [employee];
    }

    const { records, total } = await findMonthlySummary(corporateUser, {
        monthStart,
        monthEnd,
        employeeIds,
        page,
        limit,
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Monthly summary retrieved successfully',
        data: records,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
        period: {
            month: req.query.month || `${year}-${String(month + 1).padStart(2, '0')}`,
            from: monthStart,
            to: monthEnd,
        },
    });
});

// GET /attendance-record/shift-schedule
// Weekly shift view: per-employee per-day scheduled vs actual times.
// Query: from, to, employee, search, page, limit
exports.getShiftSchedule = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id.toString();
    const { employee, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));

    // Default to current Mon–Sun if no range provided
    const datesProvided = !!(req.query.from || req.query.to);
    let from, to;
    if (req.query.from) {
        from = new Date(req.query.from);
    } else {
        from = new Date();
        const day = from.getDay();
        from.setDate(from.getDate() - (day === 0 ? 6 : day - 1));
    }
    if (req.query.to) {
        to = new Date(req.query.to);
    } else {
        to = new Date(from);
        to.setDate(to.getDate() + 6);
    }
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    let employeeIds;
    if (search) {
        const matches = await Employee.find(
            { corporateUser, 'personalInformation.fullName': { $regex: escapeSearch(search), $options: 'i' } },
            '_id'
        );
        employeeIds = matches.map(e => e._id);
        if (employeeIds.length === 0) {
            return res.status(200).json({
                status: true, responseCode: '000',
                message: 'Shift schedule retrieved successfully',
                data: [],
                pagination: { total: 0, page, limit, totalPages: 0 },
                period: { from, to },
            });
        }
    } else if (employee) {
        employeeIds = [employee];
    }

    const { employees, total, attMap } = await findShiftSchedule(corporateUser, {
        from, to, employeeIds, page, limit, datesProvided,
    });

    // Build array of all dates in the range, then filter to only working days from payroll settings
    const allDates = [];
    const cur = new Date(from);
    while (cur <= to) {
        allDates.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
    }

    // OrganizationSettings.selectWorkingDays is the field the Payroll Cycle
    // "Working Days" setting actually writes (day-name strings, e.g. "MON").
    const WEEKDAY_NAME_TO_JS_DAY = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
    const orgSettings = await OrganizationSettings.findOne({ corporateUser }).select('payrollSettings.selectWorkingDays').lean();
    const selectWorkingDays = orgSettings?.payrollSettings?.selectWorkingDays;
    let dates = allDates;
    if (Array.isArray(selectWorkingDays) && selectWorkingDays.length > 0) {
        const jsWorkingDays = new Set(selectWorkingDays.map(day => WEEKDAY_NAME_TO_JS_DAY[String(day).toUpperCase()]).filter(d => d !== undefined));
        // Use UTC day so it matches the UTC-based dateKey (toISOString slice)
        dates = allDates.filter(d => jsWorkingDays.has(new Date(d.toISOString().slice(0, 10)).getUTCDay()));
    }

    const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    const data = employees.map(emp => {
        const ws = emp.workSchedule || {};
        const empAtt = attMap[emp._id.toString()] || {};

        const scheduleParts = emp.employeeInformation?.timeSchedule
            ? emp.employeeInformation.timeSchedule.split(' - ')
            : [];
        const scheduleStart = scheduleParts[0]?.trim() ?? null;
        const scheduleEnd = scheduleParts[1]?.trim() ?? null;

        const days = dates.map(date => {
            const dateKey = date.toISOString().slice(0, 10);
            // Derive dayName from the UTC date so it matches dateKey on UTC+ servers
            const dayName = DAY_NAMES[new Date(dateKey).getUTCDay()];
            const rec = empAtt[dateKey];
            const isOff = ws.days ? ws.days[dayName] === false : false;

            return {
                date: dateKey,
                dayName,
                isOff,
                scheduledStart: scheduleStart,
                scheduledEnd: scheduleEnd,
                checkIn: rec?.checkIn?.time ?? null,
                checkOut: rec?.checkOut?.time ?? null,
                totalHours: rec?.totalHours ?? 0,
                lateMinutes: rec?.lateMinutes ?? 0,
                status: rec?.status ?? (isOff ? 'off' : null),
            };
        });

        const totalHours = parseFloat(days.reduce((sum, d) => sum + d.totalHours, 0).toFixed(2));

        return {
            employee: {
                _id: emp._id,
                employeeId: emp.employeeInformation?.employeeId ?? null,
                fullName: emp.personalInformation?.fullName ?? null,
                email: emp.personalInformation?.email ?? null,
                profileImage: emp.profileImage ?? null,
                department: emp.employeeInformation?.department?.departmentName ?? null,
            },
            scheduledStart: scheduleStart,
            scheduledEnd: scheduleEnd,
            breakTimeHrs: ws.breakTimeHrs ?? null,
            days,
            totalHours,
        };
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Shift schedule retrieved successfully',
        data,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        period: { from, to },
    });
});

// GET /attendance-record/daily-log
// Returns paginated attendance records for all employees with optional filters,
// synthesizing "absent"/"on-leave" rows for employees with no real record for the day.
// Query params: date, from, to, employee (id), status, search (name), page, limit
exports.getDailyLog = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id.toString();
    const { date, from, to, employee, status, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));

    const validStatuses = ['present', 'late', 'absent', 'on-leave', 'half-day'];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
            status: false,
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
    }

    // Attendance dates are stored as local midnight expressed in UTC (see markAttendance
    // and checkIn/checkOut), so the query range must snap to LOCAL day boundaries via
    // setHours(), not setUTCHours() — otherwise a record for "today" (stored at, e.g.,
    // 18:30 UTC the previous day on an IST server) falls before a UTC-midnight `fromDate`
    // and gets silently excluded, making a checked-in employee show as absent.
    let fromDate, toDate;
    if (from || to) {
        fromDate = from ? new Date(from) : new Date(0);
        toDate = to ? new Date(to) : new Date();
    } else if (date) {
        fromDate = new Date(date);
        toDate = new Date(date);
    } else {
        fromDate = new Date();
        toDate = new Date();
    }
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    let employeeIds;
    if (search) {
        const matches = await Employee.find(
            { corporateUser, 'personalInformation.fullName': { $regex: escapeSearch(search), $options: 'i' } },
            '_id'
        );
        employeeIds = matches.map(e => e._id);
        if (employeeIds.length === 0) {
            return res.status(200).json({
                status: true,
                responseCode: '000',
                message: 'Daily attendance log retrieved successfully',
                data: [],
                pagination: { total: 0, page, limit, totalPages: 0 }
            });
        }
    } else if (employee) {
        employeeIds = [employee];
    }

    const { records } = await findDailyLog(corporateUser, {
        from: fromDate,
        to: toDate,
        employeeIds,
        status: status && status !== 'absent' && status !== 'on-leave' ? status : undefined,
        page: 1,
        limit: 10000,
    });

    const employeeIdsOnRecords = [...new Set(records.map(r => r.employee?.toString()).filter(Boolean))];
    const recordEmployees = await Employee.find(
        { _id: { $in: employeeIdsOnRecords } },
        'personalInformation.fullName personalInformation.email profileImage employeeInformation'
    );
    const empMap = {};
    for (const emp of recordEmployees) empMap[emp._id.toString()] = emp;

    const formatRecord = r => ({
        _id: r._id,
        employee: (() => {
            const emp = empMap[r.employee?.toString()];
            return emp ? { ...toDailyLogEmployeeShape(emp), _id: emp._id } : { _id: r.employee };
        })(),
        date: r.date,
        checkIn: r.checkIn?.time ?? null,
        checkOut: r.checkOut?.time ?? null,
        lateMinutes: r.lateMinutes,
        totalHours: r.totalHours,
        status: r.status,
        notes: r.notes ?? null,
    });

    // Derive on-leave and absent virtual entries (no AttendanceRecord exists for these).
    const currentDate = new Date();
    const rangeEnd = new Date(Math.min(currentDate.getTime(), toDate.getTime()));

    const activeEmployees = await Employee.find({
        corporateUser,
        ...(employeeIds ? { _id: { $in: employeeIds } } : {}),
        $or: [
            { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'INPROBATION', 'CONFIRMED'] } },
            { 'employeeInformation.employeeStatus': 'RESIGNED', 'offBoardingInformation.lastWorkingDay': { $gte: currentDate } }
        ],
        isEmployeeDeleted: false
    }).select('_id personalInformation.fullName personalInformation.email profileImage employeeInformation');

    // Only approved LeaveApplication records are treated as on-leave —
    // pending/rejected/cancelled ones don't count.
    const leaves = await LeaveApplication.find({
        corporateUser,
        employee: { $in: activeEmployees.map(e => e._id) },
        status: 'approved',
        start: { $lte: toDate },
        end: { $gte: fromDate },
    }).select('employee start end');

    // Build a set of "employeeId_YYYY-MM-DD" keys that already have a real record.
    const recordedKeys = new Set(
        records.map(r => `${String(r.employee)}_${toLocalDateKey(r.date)}`)
    );

    // Build per-employee leave date sets.
    const leavesByEmployee = {};
    for (const l of leaves) {
        const eid = String(l.employee);
        if (!leavesByEmployee[eid]) leavesByEmployee[eid] = [];
        leavesByEmployee[eid].push(l);
    }

    const virtualEntries = [];
    for (const emp of activeEmployees) {
        const eid = String(emp._id);
        const empShape = toDailyLogEmployeeShape(emp);
        const joinDateKey = emp.employeeInformation?.dateOfJoin
            ? toLocalDateKey(new Date(emp.employeeInformation.dateOfJoin))
            : null;

        const cur = new Date(fromDate);
        while (cur <= rangeEnd) {
            const dateKey = toLocalDateKey(cur);
            const recordKey = `${eid}_${dateKey}`;

            if (joinDateKey && dateKey < joinDateKey) {
                cur.setUTCDate(cur.getUTCDate() + 1);
                continue;
            }

            if (!recordedKeys.has(recordKey)) {
                const isOnLeave = (leavesByEmployee[eid] || []).some(l => {
                    const leaveStart = toLocalDateKey(l.start);
                    const leaveEnd = toLocalDateKey(l.end);
                    return leaveStart <= dateKey && dateKey <= leaveEnd;
                });
                virtualEntries.push({
                    _id: null,
                    employee: empShape,
                    date: new Date(cur),
                    checkIn: null, checkOut: null,
                    lateMinutes: 0, totalHours: 0,
                    status: isOnLeave ? 'on-leave' : 'absent',
                    notes: null,
                });
            }
            cur.setUTCDate(cur.getUTCDate() + 1);
        }
    }

    let merged = [...records.map(formatRecord), ...virtualEntries];
    merged.sort((a, b) => a.date - b.date);
    if (status) merged = merged.filter(r => r.status === status);
    if (search) {
        const q = search.toLowerCase();
        merged = merged.filter(r => r.employee?.fullName?.toLowerCase().includes(q));
    }

    const total = merged.length;
    const paginated = merged.slice((page - 1) * limit, page * limit);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Daily attendance log retrieved successfully',
        data: paginated,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    });
});

// POST /attendance-record/mark
// Corporate side: manually create or overwrite an employee's attendance record for a day.
// Body: employee (id), date, checkIn (HH:MM or ISO), checkOut (HH:MM or ISO), status, notes (optional)
exports.markAttendance = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id.toString();
    const { employee: employeeId, date, checkIn, checkOut, status, notes } = req.body;

    if (!employeeId || !date || !status) {
        return res.status(400).json({ status: false, message: 'employee, date, and status are required' });
    }

    const validStatuses = ['present', 'late', 'absent', 'on-leave', 'half-day'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ status: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const requiresCheckIn = ['present', 'late', 'half-day'].includes(status);
    if (requiresCheckIn && !checkIn) {
        return res.status(400).json({ status: false, message: `checkIn is required for status: ${status}` });
    }
    if (status === 'half-day' && !checkOut) {
        return res.status(400).json({ status: false, message: 'checkIn and checkOut are required for status: half-day' });
    }

    const employee = await findEmployeeByIdAndCorporateUser(employeeId, corporateUser);
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee not found' });
    }

    // Use the client-provided instant as-is: it's already the timezone-correct start of the
    // attendance day (the user's local midnight expressed in UTC). Re-normalizing with
    // setUTCHours() would snap it back to UTC midnight and store attendance on the wrong day.
    const normalizedDate = new Date(date);

    let checkInTime = null;
    let checkOutTime = null;

    // An "HH:MM" time is treated as an offset from the day's start instant, so it lands on the
    // same (client-local) day as `date`. A full ISO string (with T/Z) is used verbatim.
    const combineDateTime = (base, timeStr) => {
        if (timeStr.includes('T') || timeStr.includes('Z')) return new Date(timeStr);
        const [h, m, s = 0] = timeStr.split(':').map(Number);
        return new Date(base.getTime() + (((h * 3600) + (m * 60) + s) * 1000));
    };

    if (requiresCheckIn && checkIn) {
        checkInTime = combineDateTime(normalizedDate, checkIn);
    }

    if (checkOut) {
        checkOutTime = combineDateTime(normalizedDate, checkOut);
        if (checkInTime && checkOutTime <= checkInTime) {
            return res.status(400).json({ status: false, message: 'Check-out time must be after check-in time' });
        }
    }

    const record = await markAttendanceManually(corporateUser, {
        employee: employeeId,
        date: normalizedDate,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status,
        notes,
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Attendance marked successfully',
        data: {
            _id: record._id,
            employee: employeeId,
            date: record.date,
            checkIn: record.checkIn?.time ?? null,
            checkOut: record.checkOut?.time ?? null,
            status: record.status,
            totalHours: record.totalHours,
            notes: record.notes ?? null,
        },
    });
});

// PUT /attendance-record/:id
// Update a specific attendance record from the daily log by its _id.
// Body: status, checkIn (HH:MM or ISO), checkOut (HH:MM or ISO), notes, lateMinutes (all optional except status)
exports.updateDailyLogRecord = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id.toString();
    const { id } = req.params;
    const { checkIn, checkOut, status, notes, lateMinutes } = req.body;

    if (!status) {
        return res.status(400).json({ status: false, message: 'status is required' });
    }

    const validStatuses = ['present', 'late', 'absent', 'on-leave', 'half-day'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ status: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const requiresCheckIn = ['present', 'late', 'half-day'].includes(status);
    if (requiresCheckIn && !checkIn) {
        return res.status(400).json({ status: false, message: `checkIn is required for status: ${status}` });
    }
    if (status === 'half-day' && !checkOut) {
        return res.status(400).json({ status: false, message: 'checkIn and checkOut are required for status: half-day' });
    }

    let checkInTime = null;
    let checkOutTime = null;

    const combineDateTime = (timeStr) => {
        if (timeStr.includes('T') || timeStr.includes('Z')) return new Date(timeStr);
        const d = new Date();
        const [h, m, s = 0] = timeStr.split(':').map(Number);
        d.setHours(h, m, s, 0);
        return d;
    };

    if (requiresCheckIn && checkIn) {
        checkInTime = combineDateTime(checkIn);
    }

    if (checkOut) {
        checkOutTime = combineDateTime(checkOut);
        if (checkInTime && checkOutTime <= checkInTime) {
            return res.status(400).json({ status: false, message: 'Check-out time must be after check-in time' });
        }
    }

    const record = await updateAttendanceById(corporateUser, id, {
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status,
        notes,
        lateMinutes: lateMinutes !== undefined ? Number(lateMinutes) : undefined,
    });

    if (!record) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Attendance record not found' });
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Attendance record updated successfully',
        data: {
            _id: record._id,
            employee: record.employee,
            date: record.date,
            checkIn: record.checkIn?.time ?? null,
            checkOut: record.checkOut?.time ?? null,
            status: record.status,
            totalHours: record.totalHours,
            lateMinutes: record.lateMinutes,
            notes: record.notes ?? null,
        },
    });
});

// GET /employee/:employeeId/attendance/metrics
// Corporate side: one employee's Present/Late/Absent/On Leave/OT Hours stat
// cards for a given month (Employee Details -> Attendance tab).
// Query params: month (YYYY-MM), defaults to the current month.
exports.getEmployeeAttendanceMetrics = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id.toString();
    const { employeeId } = req.params;

    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();

    if (req.query.month) {
        const m = /^(\d{4})-(\d{2})$/.exec(req.query.month);
        if (!m) {
            return res.status(400).json({ status: false, message: "Invalid 'month'. Expected format YYYY-MM" });
        }
        year = parseInt(m[1], 10);
        month = parseInt(m[2], 10) - 1;
        if (month < 0 || month > 11) {
            return res.status(400).json({ status: false, message: 'Invalid month value. Must be 01-12' });
        }
    }

    const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const metrics = await getEmployeeAttendanceMetrics(corporateUser, employeeId, monthStart, monthEnd);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Employee attendance metrics retrieved successfully',
        data: { ...metrics, month: { from: monthStart, to: monthEnd } },
    });
});

// GET /attendance-record/today-summary
// Company-wide Present/Late/Absent/On Leave counts for today (corporate Dashboard sidebar).
exports.getTodayAttendanceCounts = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id.toString();
    const counts = await getTodayAttendanceCounts(corporateUser);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Today's attendance counts retrieved successfully",
        data: counts,
    });
});
