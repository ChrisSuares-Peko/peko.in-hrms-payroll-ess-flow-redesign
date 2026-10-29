const AttendanceDispute = require("../entities/attendanceDispute");
const { escapeSearch } = require('../../utils/escapeRegex');

// Raise a new attendance dispute.
exports.createAttendanceDispute = async (data) => {
    try {
        return await AttendanceDispute.create(data);
    } catch (error) {
        throw new Error("Failed to create attendance dispute: " + error.message);
    }
};

// Open (requestedByEmployee) dispute for a given attendance record, to prevent duplicates.
exports.findOpenDisputeForAttendance = async (corporateUser, employee, attendanceId) => {
    try {
        return await AttendanceDispute.findOne({
            corporateUser,
            employee,
            attendance: attendanceId,
            status: "requestedByEmployee",
        });
    } catch (error) {
        throw new Error("Failed to check existing dispute: " + error.message);
    }
};

// Disputes for a set of attendance records (used to flag deduction-log entries).
exports.findDisputesByAttendanceIds = async (corporateUser, employee, attendanceIds) => {
    try {
        if (!attendanceIds || attendanceIds.length === 0) return [];
        return await AttendanceDispute.find({
            corporateUser,
            employee,
            attendance: { $in: attendanceIds },
        })
            .select("attendance status")
            .sort({ createdAt: -1 });
    } catch (error) {
        throw new Error("Failed to fetch disputes: " + error.message);
    }
};

// Corporate-side: list all disputes across all employees, newest first.
// Supports filtering by employee IDs, status, date range, and text search on reason.
// No .populate('employee') here — AttendanceRecord/AttendanceDispute's `employee` ref
// string ('Employee') has no matching registered model in IN, so the controller does
// a manual Employee lookup + map instead. `.populate('attendance')` is safe: IN's
// AttendanceRecord model IS registered under that exact name.
exports.findAllDisputesForCorporate = async (corporateUser, { employeeIds, status, from, to, search, page = 1, limit = 10 } = {}) => {
    try {
        const query = { corporateUser };
        if (employeeIds) query.employee = { $in: employeeIds };
        if (status) query.status = status;
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = from;
            if (to) query.createdAt.$lte = to;
        }
        if (search) query.reason = { $regex: escapeSearch(search), $options: 'i' };

        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            AttendanceDispute.find(query)
                .populate('attendance', 'date status checkIn checkOut')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            AttendanceDispute.countDocuments(query),
        ]);

        return { records, total };
    } catch (error) {
        throw new Error("Failed to fetch disputes: " + error.message);
    }
};

// Corporate-side: approve or reject a dispute. Only acts on disputes still pending (requestedByEmployee).
// Returns null if the dispute is not found, not owned by this corporate, or already reviewed.
exports.reviewAttendanceDispute = async (corporateUser, disputeId, { status, remarks, reviewedBy }) => {
    try {
        return await AttendanceDispute.findOneAndUpdate(
            { _id: disputeId, corporateUser, status: 'requestedByEmployee' },
            { $set: { status, remarks, reviewedBy } },
            { new: true }
        ).populate('attendance', 'date status');
    } catch (error) {
        throw new Error('Failed to review dispute: ' + error.message);
    }
};

// List an employee's disputes, newest first, with optional status/date filters + pagination.
exports.findDisputesByEmployee = async (corporateUser, employee, { status, from, to, page = 1, limit = 30 } = {}) => {
    try {
        const query = { corporateUser, employee };
        if (status) {
            query.status = status;
        }
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = from;
            if (to) query.createdAt.$lte = to;
        }

        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            AttendanceDispute.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            AttendanceDispute.countDocuments(query),
        ]);

        return { records, total };
    } catch (error) {
        throw new Error("Failed to fetch attendance disputes: " + error.message);
    }
};
