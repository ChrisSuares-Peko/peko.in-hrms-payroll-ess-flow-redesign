const mongoose = require("mongoose");
const AttendanceRecord = require("../entities/attendanceRecord");
const Overtime = require("../entities/overTime");
const Employee = require("../entities/employee");
const OrganizationSettings = require("../entities/organizationSettings");
const LeaveApplication = require("../entities/leaveApplication");
const { getHolidaysInARange } = require("./holiyDay");
const { createAbsentLeave } = require("./leaveApplication");

// Upsert the check-in for an employee on a given day.
// Uses (corporateUser, employee, date) which is the unique index, so a pre-existing
// record for the day (e.g. status "absent") is updated rather than duplicated.
exports.upsertCheckIn = async (corporateUser, employee, date, checkIn, extra = {}) => {
    try {
        return await AttendanceRecord.findOneAndUpdate(
            { corporateUser, employee, date },
            {
                $set: {
                    checkIn,
                    status: "present",
                    createdBy: "ess",
                    ...extra,
                },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
    } catch (error) {
        throw new Error("Failed to record check-in: " + error.message);
    }
};

// Record the check-out on an existing attendance record for the day.
// No upsert: a check-out requires a record that has already checked in.
exports.recordCheckOut = async (corporateUser, employee, date, checkOut, extra = {}) => {
    try {
        return await AttendanceRecord.findOneAndUpdate(
            { corporateUser, employee, date },
            { $set: { checkOut, ...extra } },
            { new: true }
        );
    } catch (error) {
        throw new Error("Failed to record check-out: " + error.message);
    }
};

// Find the attendance record for a given employee on a specific (normalized) day.
exports.findAttendanceForDay = async (corporateUser, employee, date) => {
    try {
        return await AttendanceRecord.findOne({ corporateUser, employee, date });
    } catch (error) {
        throw new Error("Failed to fetch attendance: " + error.message);
    }
};

// The employee's own late/absent records within a date range (the "deduction log" —
// each one represents a day the employee can dispute). Newest first, paginated.
exports.findDeductionLog = async (corporateUser, employee, { from, to, page = 1, limit = 30 } = {}) => {
    try {
        const query = { corporateUser, employee, status: { $in: ['late', 'absent'] } };
        if (from || to) {
            query.date = {};
            if (from) query.date.$gte = from;
            if (to) query.date.$lte = to;
        }

        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            AttendanceRecord.find(query).sort({ date: -1 }).skip(skip).limit(limit),
            AttendanceRecord.countDocuments(query),
        ]);

        return { records, total };
    } catch (error) {
        throw new Error('Failed to fetch deduction log: ' + error.message);
    }
};

// Find a single attendance record that belongs to the given employee.
exports.findAttendanceById = async (corporateUser, employee, attendanceId) => {
    try {
        return await AttendanceRecord.findOne({ _id: attendanceId, corporateUser, employee });
    } catch (error) {
        throw new Error("Failed to fetch attendance record: " + error.message);
    }
};

// Turn a "virtual-YYYY-MM-DD" id (a day findAttendanceList synthesized as absent because no
// real AttendanceRecord exists) into a real, disputable document — but only if that day is
// still genuinely an unrecorded absence: not in the future, not before joining, not covered by
// an approved leave, and not a non-working day/holiday. Uses $setOnInsert so a record that
// already exists for the day (e.g. a check-in that landed since the list was fetched) is
// returned as-is rather than overwritten. Returns null if the id is malformed or the day turns
// out not to be a disputable absence.
exports.materializeAbsentRecord = async (corporateUser, employee, dateKey) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (Number.isNaN(date.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) return null;

    const employeeDoc = await Employee.findById(employee).select('employeeInformation.dateOfJoin');
    const dateOfJoin = employeeDoc?.employeeInformation?.dateOfJoin
        ? new Date(employeeDoc.employeeInformation.dateOfJoin)
        : null;
    if (dateOfJoin) {
        dateOfJoin.setHours(0, 0, 0, 0);
        if (date < dateOfJoin) return null;
    }

    const [approvedLeave, orgSettings, holidays] = await Promise.all([
        LeaveApplication.findOne({
            corporateUser,
            employee,
            status: 'approved',
            start: { $lte: date },
            end: { $gte: date },
        }),
        OrganizationSettings.findOne({ corporateUser }).select('payrollSettings.selectWorkingDays').lean(),
        getHolidaysInARange(corporateUser, date, date),
    ]);
    if (approvedLeave) return null; // an on-leave day, not a disputable absence

    const jsWorkingDays = buildJsWorkingDays(orgSettings);
    const isHoliday = (Array.isArray(holidays) ? holidays : []).some(
        h => date >= new Date(h.start) && date <= new Date(h.end)
    );
    if (!jsWorkingDays.has(date.getDay()) || isHoliday) return null; // non-working day, nothing to dispute

    try {
        const result = await AttendanceRecord.findOneAndUpdate(
            { corporateUser, employee, date },
            {
                $setOnInsert: {
                    corporateUser,
                    employee,
                    date,
                    checkIn: null,
                    checkOut: null,
                    lateMinutes: 0,
                    totalHours: 0,
                    status: 'absent',
                    createdBy: 'automation',
                },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true, rawResult: true }
        );

        // Only the first time this day is actually materialized (a fresh insert, not a
        // pre-existing record returned as-is) does the 1-day Annual Leave cut apply.
        if (result.lastErrorObject?.upserted) {
            await createAbsentLeave(corporateUser, employee, date);
        }

        return result.value;
    } catch (error) {
        throw new Error('Failed to materialize attendance record: ' + error.message);
    }
};

// Paginated list of an employee's attendance records, newest first,
// with optional date-range and status filtering.
// Lists an employee's own attendance, synthesizing "absent"/"on-leave" virtual
// rows for any day in range with no real AttendanceRecord — mirrors the
// corporate daily log's getDailyLog logic (controller/attendanceRecord.js),
// scoped to one employee. Never synthesized past today, before the employee's
// joining date, on a non-working weekday, or on a declared company holiday
// (those days simply don't appear, unless a real check-in or approved leave
// covers them).
exports.findAttendanceList = async (corporateUser, employee, { from, to, status, page = 1, limit = 30 }) => {
    try {
        const dateQuery = {};
        if (from) dateQuery.$gte = from;
        if (to) dateQuery.$lte = to;

        const [records, employeeDoc, approvedLeaves, orgSettings, holidays] = await Promise.all([
            AttendanceRecord.find({
                corporateUser,
                employee,
                ...(Object.keys(dateQuery).length ? { date: dateQuery } : {}),
            }),
            Employee.findById(employee).select('employeeInformation.dateOfJoin'),
            LeaveApplication.find({
                corporateUser,
                employee,
                status: 'approved',
                ...(to ? { start: { $lte: to } } : {}),
                ...(from ? { end: { $gte: from } } : {}),
            }).select('start end'),
            OrganizationSettings.findOne({ corporateUser }).select('payrollSettings.selectWorkingDays').lean(),
            getHolidaysInARange(corporateUser, from, to),
        ]);

        const recordedKeys = new Set(records.map(r => toLocalDateKey(new Date(r.date))));
        const jsWorkingDays = buildJsWorkingDays(orgSettings);
        const holidayDateKeys = new Set();
        for (const h of Array.isArray(holidays) ? holidays : []) {
            const cur = new Date(h.start);
            const end = new Date(h.end);
            while (cur <= end) {
                holidayDateKeys.add(toLocalDateKey(cur));
                cur.setDate(cur.getDate() + 1);
            }
        }

        const now = new Date();
        const fromDate = from ? new Date(from) : new Date(0);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = to ? new Date(to) : now;
        const rangeEnd = new Date(Math.min(toDate.getTime(), now.getTime()));
        const joinDateKey = employeeDoc?.employeeInformation?.dateOfJoin
            ? toLocalDateKey(new Date(employeeDoc.employeeInformation.dateOfJoin))
            : null;

        const virtualEntries = [];
        const cursor = new Date(fromDate);
        while (cursor <= rangeEnd) {
            const dateKey = toLocalDateKey(cursor);
            if ((!joinDateKey || dateKey >= joinDateKey) && !recordedKeys.has(dateKey)) {
                const isOnLeave = approvedLeaves.some(l => {
                    const leaveStart = toLocalDateKey(new Date(l.start));
                    const leaveEnd = toLocalDateKey(new Date(l.end));
                    return leaveStart <= dateKey && dateKey <= leaveEnd;
                });
                const isNonWorkingDay = !jsWorkingDays.has(cursor.getDay()) || holidayDateKeys.has(dateKey);
                if (isOnLeave || !isNonWorkingDay) {
                    virtualEntries.push({
                        _id: `virtual-${dateKey}`,
                        corporateUser,
                        employee,
                        date: new Date(cursor),
                        checkIn: null,
                        checkOut: null,
                        lateMinutes: 0,
                        totalHours: 0,
                        status: isOnLeave ? 'on-leave' : 'absent',
                        notes: null,
                    });
                }
            }
            cursor.setDate(cursor.getDate() + 1);
        }

        let merged = [...records, ...virtualEntries];
        merged.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (status) merged = merged.filter(r => r.status === status);

        const total = merged.length;
        const skip = (page - 1) * limit;
        const paginated = merged.slice(skip, skip + limit);

        return { records: paginated, total };
    } catch (error) {
        throw new Error("Failed to fetch attendance list: " + error.message);
    }
};

const toLocalDateKey = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// Aggregated attendance counts for an employee within a date range:
// total check-ins, late arrivals, and leaves.
exports.getMonthlyMetrics = async (corporateUser, employee, monthStart, monthEnd) => {
    try {
        const result = await AttendanceRecord.aggregate([
            {
                $match: {
                    corporateUser,
                    employee: new mongoose.Types.ObjectId(employee),
                    date: { $gte: monthStart, $lte: monthEnd },
                },
            },
            {
                $group: {
                    _id: null,
                    totalCheckIns: {
                        $sum: { $cond: [{ $ifNull: ["$checkIn.time", false] }, 1, 0] },
                    },
                    totalLateArrivals: {
                        $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
                    },
                    // Dashboard stat donut buckets — present/late/absent counts.
                    onTime: {
                        $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
                    },
                    notPresent: {
                        $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
                    },
                },
            },
        ]);

        // "Leave Days" combines two sources so neither an HR manual on-leave
        // correction nor an ESS-approved leave request is missed, deduped by
        // calendar date so a day covered by both isn't double-counted:
        //   1. AttendanceRecord entries HR manually marked "on-leave".
        //   2. Approved LeaveApplication ranges overlapping this month, clipped
        //      to the range (a leave request is never synced into AttendanceRecord).
        const [allRecordDates, onLeaveRecords, approvedLeaves, employeeDoc, orgSettings, holidays] = await Promise.all([
            AttendanceRecord.find({
                corporateUser,
                employee: new mongoose.Types.ObjectId(employee),
                date: { $gte: monthStart, $lte: monthEnd },
            }).select("date"),
            AttendanceRecord.find({
                corporateUser,
                employee: new mongoose.Types.ObjectId(employee),
                date: { $gte: monthStart, $lte: monthEnd },
                status: "on-leave",
            }).select("date"),
            LeaveApplication.find({
                corporateUser,
                employee,
                status: "approved",
                start: { $lte: monthEnd },
                end: { $gte: monthStart },
            }).select("start end leaveCount"),
            Employee.findById(employee).select("employeeInformation.dateOfJoin"),
            OrganizationSettings.findOne({ corporateUser }).select('payrollSettings.selectWorkingDays').lean(),
            getHolidaysInARange(corporateUser, monthStart, monthEnd),
        ]);

        const leaveDateKeys = new Set(onLeaveRecords.map(r => toLocalDateKey(new Date(r.date))));
        const approvedLeaveRanges = [];
        for (const leave of approvedLeaves) {
            const cursor = new Date(Math.max(new Date(leave.start).getTime(), monthStart.getTime()));
            const overlapEnd = new Date(Math.min(new Date(leave.end).getTime(), monthEnd.getTime()));
            approvedLeaveRanges.push({ start: cursor, end: overlapEnd });
            while (cursor <= overlapEnd) {
                leaveDateKeys.add(toLocalDateKey(cursor));
                cursor.setDate(cursor.getDate() + 1);
            }
        }

        // The displayed "Leave Days" total trusts each application's own leaveCount
        // (which can be smaller than its start-end span, e.g. weekends inside the
        // range, or an admin-entered count that doesn't match the dates) rather than
        // expanding every calendar day in the range. An HR-marked "on-leave"
        // AttendanceRecord only adds to the total if it isn't already inside one of
        // those approved ranges, so the two sources don't double-count the same day.
        const isCoveredByApprovedLeave = date =>
            approvedLeaveRanges.some(r => date >= r.start && date <= r.end);
        const extraOnLeaveRecordDays = onLeaveRecords.filter(
            r => !isCoveredByApprovedLeave(new Date(r.date))
        ).length;
        const totalLeaves = approvedLeaves.reduce((sum, l) => sum + (Number(l.leaveCount) || 0), 0)
            + extraOnLeaveRecordDays;

        const jsWorkingDays = buildJsWorkingDays(orgSettings);
        const holidayDateKeys = new Set();
        for (const h of Array.isArray(holidays) ? holidays : []) {
            const cur = new Date(h.start);
            const end = new Date(h.end);
            while (cur <= end) {
                holidayDateKeys.add(toLocalDateKey(cur));
                cur.setDate(cur.getDate() + 1);
            }
        }

        // "Absent Days" — same virtual-row definition findAttendanceList uses: any
        // elapsed working day (not in the future, not before joining, not a
        // non-working weekday or company holiday) with no real AttendanceRecord
        // and no covering approved leave.
        const recordedDateKeys = new Set(allRecordDates.map(r => toLocalDateKey(new Date(r.date))));
        const joinDateKey = employeeDoc?.employeeInformation?.dateOfJoin
            ? toLocalDateKey(new Date(employeeDoc.employeeInformation.dateOfJoin))
            : null;
        const rangeEnd = new Date(Math.min(monthEnd.getTime(), Date.now()));
        let absentDays = 0;
        const dayCursor = new Date(monthStart);
        while (dayCursor <= rangeEnd) {
            const dateKey = toLocalDateKey(dayCursor);
            const isNonWorkingDay = !jsWorkingDays.has(dayCursor.getDay()) || holidayDateKeys.has(dateKey);
            if ((!joinDateKey || dateKey >= joinDateKey) && !recordedDateKeys.has(dateKey) && !leaveDateKeys.has(dateKey) && !isNonWorkingDay) {
                absentDays++;
            }
            dayCursor.setDate(dayCursor.getDate() + 1);
        }

        const metrics = result[0] || {};
        const onTime = metrics.onTime || 0;
        const late = metrics.totalLateArrivals || 0;
        const notPresent = absentDays;
        return {
            totalCheckIns: metrics.totalCheckIns || 0,
            totalLateArrivals: metrics.totalLateArrivals || 0,
            totalLeaves,
            onTime,
            late,
            notPresent,
            total: onTime + late + notPresent,
        };
    } catch (error) {
        throw new Error("Failed to compute attendance metrics: " + error.message);
    }
};

const WEEKDAY_NAME_TO_JS_DAY = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

// Build the JS Date#getDay() weekday set considered "working days" from
// OrganizationSettings.payrollSettings.selectWorkingDays — the field the
// Payroll Cycle "Working Days" setting actually writes (an array of day-name
// strings, e.g. ["MON",...,"SAT"]) — defaulting to Mon-Fri if unconfigured.
const buildJsWorkingDays = orgSettings => {
    const selectWorkingDays = orgSettings?.payrollSettings?.selectWorkingDays;
    return Array.isArray(selectWorkingDays) && selectWorkingDays.length > 0
        ? new Set(selectWorkingDays.map(day => WEEKDAY_NAME_TO_JS_DAY[String(day).toUpperCase()]).filter(d => d !== undefined))
        : new Set([1, 2, 3, 4, 5]); // default Mon-Fri
};

// Count working days between `from` and `to`, inclusive, excluding any date
// present in `holidayDateKeys` (a Set of "YYYY-MM-DD" strings).
const countWorkingDays = (jsWorkingDays, from, to, holidayDateKeys = new Set()) => {
    let count = 0;
    const cur = new Date(from);
    while (cur <= to) {
        if (jsWorkingDays.has(cur.getDay()) && !holidayDateKeys.has(toLocalDateKey(cur))) count++;
        cur.setDate(cur.getDate() + 1);
    }
    return count;
};

// Expands an array of {start, end} holiday documents into a Set of every
// covered "YYYY-MM-DD" date key.
const buildHolidayDateKeys = holidays => {
    const keys = new Set();
    for (const h of Array.isArray(holidays) ? holidays : []) {
        const cur = new Date(h.start);
        const end = new Date(h.end);
        while (cur <= end) {
            keys.add(toLocalDateKey(cur));
            cur.setDate(cur.getDate() + 1);
        }
    }
    return keys;
};

// Corporate-facing per-employee attendance stat cards (Employee Details ->
// Attendance tab): present, late, absent, onLeave, otHours for one month.
// Absent is derived (workingDaysElapsed - present - late - onLeave) rather
// than counted, since no AttendanceRecord is ever written for a day the
// employee simply never checked into. Only approved LeaveApplication
// records count toward onLeave — pending/rejected/cancelled ones don't.
exports.getEmployeeAttendanceMetrics = async (corporateUser, employeeId, monthStart, monthEnd) => {
    try {
        const employeeOid = new mongoose.Types.ObjectId(employeeId);

        const [attResult, otResult, orgSettings, leaves, employee, holidays] = await Promise.all([
            AttendanceRecord.aggregate([
                {
                    $match: {
                        corporateUser,
                        employee: employeeOid,
                        date: { $gte: monthStart, $lte: monthEnd },
                    },
                },
                {
                    $group: {
                        _id: null,
                        present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
                        late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
                    },
                },
            ]),
            Overtime.aggregate([
                {
                    $match: {
                        corporateUser,
                        employee: employeeOid,
                        status: "approved",
                        overTimeDate: { $gte: monthStart, $lte: monthEnd },
                    },
                },
                { $group: { _id: null, totalOtHours: { $sum: "$extraHours" } } },
            ]),
            OrganizationSettings.findOne({ corporateUser }).select('payrollSettings.selectWorkingDays').lean(),
            LeaveApplication.find({
                corporateUser,
                employee: employeeOid,
                status: 'approved',
                start: { $lte: monthEnd },
                end: { $gte: monthStart },
            }).select('start end').lean(),
            Employee.findById(employeeOid).select('employeeInformation.dateOfJoin').lean(),
            getHolidaysInARange(corporateUser, monthStart, monthEnd),
        ]);

        // Count working days from monthStart (or the employee's joining date, if later)
        // up to today (or monthEnd if the month is in the past).
        const jsWorkingDays = buildJsWorkingDays(orgSettings);
        const holidayDateKeys = buildHolidayDateKeys(holidays);
        const dateOfJoin = employee?.employeeInformation?.dateOfJoin
            ? new Date(employee.employeeInformation.dateOfJoin)
            : null;
        const rangeStart = dateOfJoin && dateOfJoin > monthStart ? dateOfJoin : monthStart;
        const rangeEnd = new Date(Math.min(Date.now(), monthEnd.getTime()));
        const workingDaysElapsed = rangeStart > rangeEnd
            ? 0
            : countWorkingDays(jsWorkingDays, rangeStart, rangeEnd, holidayDateKeys);

        // Count leave days that fall on working days within the elapsed range,
        // excluding declared company holidays.
        let onLeave = 0;
        for (const leave of leaves) {
            const ls = new Date(Math.max(new Date(leave.start).getTime(), rangeStart.getTime()));
            const le = new Date(Math.min(new Date(leave.end).getTime(), rangeEnd.getTime()));
            const ld = new Date(ls);
            while (ld <= le) {
                if (jsWorkingDays.has(ld.getDay()) && !holidayDateKeys.has(toLocalDateKey(ld))) onLeave++;
                ld.setDate(ld.getDate() + 1);
            }
        }

        const att = attResult[0] || {};
        const ot = otResult[0] || {};
        const present = att.present || 0;
        const late = att.late || 0;
        const absent = Math.max(0, workingDaysElapsed - present - late - onLeave);

        return { present, late, absent, onLeave, otHours: ot.totalOtHours || 0 };
    } catch (error) {
        throw new Error("Failed to compute employee attendance metrics: " + error.message);
    }
};

// Monthly summary for all employees: per-employee aggregated attendance counts,
// total hours, late minutes, and approved OT hours for the given month.
// Absent/on-leave are derived the same way as the per-employee Attendance tab
// (see getEmployeeAttendanceMetrics above) rather than counted from
// AttendanceRecord.status, since no AttendanceRecord is ever written for a day
// the employee simply never checked into.
exports.findMonthlySummary = async (corporateUser, { monthStart, monthEnd, employeeIds, page = 1, limit = 30 }) => {
    try {
        const toOid = id => new mongoose.Types.ObjectId(id.toString());

        const now = new Date();
        const employeeQuery = {
            corporateUser,
            isEmployeeDeleted: false,
            ...(employeeIds ? { _id: { $in: employeeIds.map(toOid) } } : {}),
            $or: [
                { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'INPROBATION', 'CONFIRMED'] } },
                { 'employeeInformation.employeeStatus': 'RESIGNED', 'offBoardingInformation.lastWorkingDay': { $gte: now } },
            ],
        };

        const skip = (page - 1) * limit;
        const [pageEmployees, total, orgSettings, holidays] = await Promise.all([
            Employee.find(
                employeeQuery,
                'personalInformation.fullName personalInformation.email profileImage employeeInformation'
            ).sort({ 'personalInformation.fullName': 1 }).skip(skip).limit(limit).lean(),
            Employee.countDocuments(employeeQuery),
            OrganizationSettings.findOne({ corporateUser }).select('payrollSettings.selectWorkingDays').lean(),
            getHolidaysInARange(corporateUser, monthStart, monthEnd),
        ]);

        if (pageEmployees.length === 0) {
            return { records: [], total };
        }

        const pageEmployeeIds = pageEmployees.map(e => e._id);

        const [aggResult, otResults, leaves] = await Promise.all([
            AttendanceRecord.aggregate([
                {
                    $match: {
                        corporateUser,
                        date: { $gte: monthStart, $lte: monthEnd },
                        employee: { $in: pageEmployeeIds },
                    },
                },
                {
                    $group: {
                        _id: '$employee',
                        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
                        halfDay: { $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] } },
                        totalHours: { $sum: '$totalHours' },
                        totalLateMinutes: { $sum: '$lateMinutes' },
                    },
                },
            ]),
            Overtime.aggregate([
                {
                    $match: {
                        corporateUser,
                        status: 'approved',
                        overTimeDate: { $gte: monthStart, $lte: monthEnd },
                        employee: { $in: pageEmployeeIds },
                    },
                },
                { $group: { _id: '$employee', otHours: { $sum: '$extraHours' } } },
            ]),
            LeaveApplication.find({
                corporateUser,
                employee: { $in: pageEmployeeIds },
                status: 'approved',
                start: { $lte: monthEnd },
                end: { $gte: monthStart },
            }).select('employee start end').lean(),
        ]);

        const attByEmployee = {};
        for (const r of aggResult) attByEmployee[r._id.toString()] = r;

        const otMap = {};
        for (const ot of otResults) otMap[ot._id.toString()] = ot.otHours || 0;

        const jsWorkingDays = buildJsWorkingDays(orgSettings);
        const holidayDateKeys = buildHolidayDateKeys(holidays);
        const rangeEnd = new Date(Math.min(Date.now(), monthEnd.getTime()));

        const empMap = {};
        for (const emp of pageEmployees) empMap[emp._id.toString()] = emp;

        // Working days elapsed per employee, starting from monthStart or their joining
        // date (whichever is later), so employees who joined mid-month aren't marked
        // absent for days before they were even hired.
        const rangeStartMap = {};
        const workingDaysElapsedMap = {};
        for (const eid of Object.keys(empMap)) {
            const dateOfJoin = empMap[eid].employeeInformation?.dateOfJoin
                ? new Date(empMap[eid].employeeInformation.dateOfJoin)
                : null;
            const rangeStart = dateOfJoin && dateOfJoin > monthStart ? dateOfJoin : monthStart;
            rangeStartMap[eid] = rangeStart;
            workingDaysElapsedMap[eid] = rangeStart > rangeEnd
                ? 0
                : countWorkingDays(jsWorkingDays, rangeStart, rangeEnd, holidayDateKeys);
        }

        // Count leave days per employee that fall on working days, excluding declared
        // company holidays. Tracked two ways: the full month (for the "On Leave" column,
        // same scope as Leave Management) and the elapsed-only range (for Absent /
        // Attendance %, which can't factor in leave days that haven't happened yet).
        const onLeaveFullMap = {};
        const onLeaveElapsedMap = {};
        for (const leave of leaves) {
            const eid = leave.employee.toString();
            const rangeStart = rangeStartMap[eid] ?? monthStart;
            const ls = new Date(Math.max(new Date(leave.start).getTime(), rangeStart.getTime()));
            const le = new Date(Math.min(new Date(leave.end).getTime(), monthEnd.getTime()));
            const ld = new Date(ls);
            while (ld <= le) {
                if (jsWorkingDays.has(ld.getDay()) && !holidayDateKeys.has(toLocalDateKey(ld))) {
                    onLeaveFullMap[eid] = (onLeaveFullMap[eid] || 0) + 1;
                    if (ld <= rangeEnd) onLeaveElapsedMap[eid] = (onLeaveElapsedMap[eid] || 0) + 1;
                }
                ld.setDate(ld.getDate() + 1);
            }
        }

        return {
            records: pageEmployees.map(emp => {
                const eid = emp._id.toString();
                const r = attByEmployee[eid] || { present: 0, late: 0, halfDay: 0, totalHours: 0, totalLateMinutes: 0 };
                const onLeave = onLeaveFullMap[eid] || 0;
                const onLeaveElapsed = onLeaveElapsedMap[eid] || 0;
                const workingDaysElapsed = workingDaysElapsedMap[eid] ?? 0;
                const absent = Math.max(0, workingDaysElapsed - r.present - r.late - onLeaveElapsed);
                const totalRecorded = r.present + r.late + absent + onLeaveElapsed + r.halfDay;
                const attendancePercentage = totalRecorded > 0
                    ? Math.round(((r.present + r.late + r.halfDay) / totalRecorded) * 100)
                    : 0;
                return {
                    employee: {
                        _id: emp._id,
                        employeeId: emp.employeeInformation?.employeeId ?? null,
                        fullName: emp.personalInformation?.fullName ?? null,
                        email: emp.personalInformation?.email ?? null,
                        profileImage: emp.profileImage ?? null,
                        designation: emp.employeeInformation?.designation ?? null,
                    },
                    present: r.present,
                    late: r.late,
                    absent,
                    onLeave,
                    halfDay: r.halfDay,
                    totalHours: r.totalHours,
                    totalLateMinutes: r.totalLateMinutes,
                    otHours: otMap[eid] || 0,
                    attendancePercentage,
                };
            }),
            total,
        };
    } catch (error) {
        throw new Error('Failed to fetch monthly summary: ' + error.message);
    }
};

// Shift schedule view: paginated employees with their attendance records for a date range.
// Returns employees (with workSchedule) + a map of attendance keyed by employeeId → dateKey.
exports.findShiftSchedule = async (corporateUser, { from, to, employeeIds, page = 1, limit = 30, datesProvided = false }) => {
    try {
        const now = new Date();
        const empQuery = {
            corporateUser,
            isEmployeeDeleted: false,
            $or: [
                { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'INPROBATION', 'CONFIRMED'] } },
                { 'employeeInformation.employeeStatus': 'RESIGNED', 'offBoardingInformation.lastWorkingDay': { $gte: now } },
            ],
        };
        if (employeeIds) empQuery._id = { $in: employeeIds };
        if (datesProvided) {
            empQuery['employeeInformation.dateOfJoin'] = { $lte: to };
        }

        const skip = (page - 1) * limit;

        const [employees, total] = await Promise.all([
            Employee.find(empQuery, 'personalInformation.fullName personalInformation.email profileImage employeeInformation workSchedule')
                .populate('employeeInformation.department', 'departmentName')
                .sort({ 'personalInformation.fullName': 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Employee.countDocuments(empQuery),
        ]);

        if (employees.length === 0) return { employees: [], total, attMap: {} };

        const pageEmployeeIds = employees.map(e => e._id);

        const attendanceRecords = await AttendanceRecord.find(
            { corporateUser, employee: { $in: pageEmployeeIds }, date: { $gte: from, $lte: to } },
            'employee date checkIn checkOut totalHours status lateMinutes'
        ).lean();

        const attMap = {};
        for (const rec of attendanceRecords) {
            const empKey = rec.employee.toString();
            const dateKey = rec.date.toISOString().slice(0, 10);
            if (!attMap[empKey]) attMap[empKey] = {};
            attMap[empKey][dateKey] = rec;
        }

        return { employees, total, attMap };
    } catch (error) {
        throw new Error('Failed to fetch shift schedule: ' + error.message);
    }
};

// Paginated list of all employees' attendance records for the admin daily log view.
// No employee enrichment here — the controller does a manual Employee lookup + map,
// since AttendanceRecord.employee's ref string ('Employee') has no matching registered
// model in IN, so .populate('employee') would throw.
exports.findDailyLog = async (corporateUser, { from, to, employeeIds, status, page = 1, limit = 30 }) => {
    try {
        const now = new Date();
        const activeEmployees = await Employee.find({
            corporateUser,
            isEmployeeDeleted: false,
            ...(employeeIds ? { _id: { $in: employeeIds } } : {}),
            $or: [
                { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'INPROBATION', 'CONFIRMED'] } },
                { 'employeeInformation.employeeStatus': 'RESIGNED', 'offBoardingInformation.lastWorkingDay': { $gte: now } },
            ],
        }).select('_id');

        const query = { corporateUser, employee: { $in: activeEmployees.map(e => e._id) } };
        if (from || to) {
            query.date = {};
            if (from) query.date.$gte = from;
            if (to) query.date.$lte = to;
        }
        if (status) query.status = status;

        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            AttendanceRecord.find(query).sort({ date: -1 }).skip(skip).limit(limit),
            AttendanceRecord.countDocuments(query),
        ]);

        return { records, total };
    } catch (error) {
        throw new Error('Failed to fetch daily log: ' + error.message);
    }
};

// Upsert a full attendance record manually from the corporate side.
// Overwrites any existing record for that day (unique index: corporateUser + employee + date).
exports.markAttendanceManually = async (corporateUser, { employee, date, checkIn, checkOut, status, notes }) => {
    try {
        const totalHours = checkIn && checkOut
            ? parseFloat(((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60)).toFixed(2))
            : 0;

        // Match ANY existing record for the same day (whatever exact time-of-day it was
        // stored with — ESS check-ins, and earlier marks may differ), so we UPDATE it
        // instead of inserting a duplicate. Window = [dayStart, dayStart+24h).
        const dayStart = new Date(date);
        const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000));

        const update = {
            $set: {
                status,
                totalHours,
                createdBy: 'manual',
            },
            $setOnInsert: { date: dayStart },
            $unset: {},
        };

        if (checkIn) {
            update.$set.checkIn = { time: checkIn, method: 'manual' };
        } else {
            update.$unset.checkIn = '';
        }

        if (checkOut) {
            update.$set.checkOut = { time: checkOut };
        } else {
            update.$unset.checkOut = '';
        }

        if (notes !== undefined) update.$set.notes = notes;

        return await AttendanceRecord.findOneAndUpdate(
            { corporateUser, employee, date: { $gte: dayStart, $lt: dayEnd } },
            update,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
    } catch (error) {
        throw new Error('Failed to mark attendance: ' + error.message);
    }
};

// Update an existing attendance record by its _id, scoped to the corporateUser.
exports.updateAttendanceById = async (corporateUser, attendanceId, { checkIn, checkOut, status, notes, lateMinutes }) => {
    try {
        const totalHours = checkIn && checkOut
            ? parseFloat(((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60)).toFixed(2))
            : 0;

        const $set = { status, totalHours };
        const $unset = {};

        if (checkIn) {
            $set.checkIn = { time: checkIn, method: 'manual' };
        } else {
            $unset.checkIn = '';
        }

        if (checkOut) {
            $set.checkOut = { time: checkOut };
        } else {
            $unset.checkOut = '';
        }

        if (lateMinutes !== undefined) $set.lateMinutes = lateMinutes;
        if (notes !== undefined) $set.notes = notes;

        const record = await AttendanceRecord.findOneAndUpdate(
            { _id: attendanceId, corporateUser },
            { $set, $unset },
            { new: true }
        );

        return record;
    } catch (error) {
        throw new Error('Failed to update attendance record: ' + error.message);
    }
};

// Company-wide "Today's Attendance" counts for the corporate Dashboard sidebar:
// present/late/absent/onLeave across every active employee, for today only.
exports.getTodayAttendanceCounts = async (corporateUser) => {
    try {
        const now = new Date();
        const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(now); dayEnd.setHours(23, 59, 59, 999);

        const activeEmployees = await Employee.find({
            corporateUser,
            $or: [
                { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'INPROBATION', 'CONFIRMED'] } },
                { 'employeeInformation.employeeStatus': 'RESIGNED', 'offBoardingInformation.lastWorkingDay': { $gte: now } },
            ],
            isEmployeeDeleted: false,
        }).select('_id');

        const employeeIds = activeEmployees.map(e => e._id);

        const [records, leaves, orgSettings, holidays] = await Promise.all([
            AttendanceRecord.find({
                corporateUser,
                employee: { $in: employeeIds },
                date: { $gte: dayStart, $lte: dayEnd },
            }).select('employee status checkIn.time'),
            LeaveApplication.find({
                corporateUser,
                employee: { $in: employeeIds },
                status: 'approved',
                start: { $lte: dayEnd },
                end: { $gte: dayStart },
            }).select('employee'),
            OrganizationSettings.findOne({ corporateUser }).select('payrollSettings.selectWorkingDays').lean(),
            getHolidaysInARange(corporateUser, dayStart, dayEnd),
        ]);

        // If today isn't a working day company-wide (weekend or declared holiday),
        // nobody who simply didn't check in should be counted as absent.
        const jsWorkingDays = buildJsWorkingDays(orgSettings);
        const holidayDateKeys = buildHolidayDateKeys(holidays);
        const isNonWorkingDay = !jsWorkingDays.has(now.getDay()) || holidayDateKeys.has(toLocalDateKey(now));

        const recordByEmployee = {};
        for (const r of records) recordByEmployee[String(r.employee)] = r;
        const onLeaveSet = new Set(leaves.map(l => String(l.employee)));

        let present = 0, late = 0, absent = 0, onLeave = 0;
        for (const emp of activeEmployees) {
            const eid = String(emp._id);
            const record = recordByEmployee[eid];
            if (record?.checkIn?.time) {
                if (record.status === 'late') late++;
                else present++;
            } else if (onLeaveSet.has(eid)) {
                onLeave++;
            } else if (!isNonWorkingDay) {
                absent++;
            }
        }

        return { present, late, absent, onLeave };
    } catch (error) {
        throw new Error('Failed to compute today attendance counts: ' + error.message);
    }
};
