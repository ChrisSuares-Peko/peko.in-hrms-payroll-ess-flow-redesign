const asyncHandler = require("../middleware/async");
const Employee = require("../models/entities/employee");
const AttendanceRecord = require("../models/entities/attendanceRecord");
const { findAllDisputesForCorporate, reviewAttendanceDispute } = require("../models/use-cases/attendanceDispute");
const { cancelLateArrivalLeaveForDate, cancelAbsentLeaveForDate } = require("../models/use-cases/leaveApplication");
const { escapeSearch } = require('../utils/escapeRegex');

// GET /disputes
// Query: employee, status, from, to, search, page, limit
exports.getDisputeRequests = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id.toString();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, from, to, search } = req.query;

    const validStatuses = ['requestedByEmployee', 'approved', 'rejected'];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ status: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    let employeeIds;
    if (req.query.employee) {
        employeeIds = [req.query.employee];
    } else if (search) {
        const matched = await Employee.find(
            {
                corporateUser,
                isEmployeeDeleted: false,
                $or: [
                    { 'personalInformation.fullName': { $regex: escapeSearch(search), $options: 'i' } },
                    { 'personalInformation.email': { $regex: escapeSearch(search), $options: 'i' } },
                    { 'employeeInformation.employeeId': { $regex: escapeSearch(search), $options: 'i' } },
                ],
            },
            '_id'
        ).lean();
        employeeIds = matched.map(e => e._id);
    }

    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(new Date(to).setHours(23, 59, 59, 999)) : undefined;

    const { records, total } = await findAllDisputesForCorporate(corporateUser, {
        employeeIds,
        status,
        from: fromDate,
        to: toDate,
        page,
        limit,
    });

    const recordEmployeeIds = [...new Set(records.map(r => r.employee?.toString()).filter(Boolean))];
    const employees = await Employee.find(
        { _id: { $in: recordEmployeeIds } },
        'personalInformation.fullName personalInformation.email profileImage employeeInformation'
    ).lean();
    const empMap = {};
    for (const emp of employees) empMap[emp._id.toString()] = emp;

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Disputes fetched successfully',
        data: {
            records: records.map(r => {
                const emp = empMap[r.employee?.toString()];
                return {
                    _id: r._id,
                    employee: {
                        _id: emp?._id ?? r.employee ?? null,
                        employeeId: emp?.employeeInformation?.employeeId ?? null,
                        fullName: emp?.personalInformation?.fullName ?? null,
                        email: emp?.personalInformation?.email ?? null,
                        profileImage: emp?.profileImage ?? null,
                        designation: emp?.employeeInformation?.designation ?? null,
                    },
                    attendance: r.attendance
                        ? {
                              _id: r.attendance._id,
                              date: r.attendance.date,
                              status: r.attendance.status,
                              checkIn: r.attendance.checkIn ?? null,
                              checkOut: r.attendance.checkOut ?? null,
                          }
                        : null,
                    disputeType: r.disputeType,
                    reason: r.reason,
                    supportingDocs: r.supportingDocs ?? null,
                    status: r.status,
                    remarks: r.remarks ?? null,
                    createdAt: r.createdAt,
                };
            }),
            total,
            page,
            limit,
        },
    });
});

// PUT /disputes/:id/review
// Approve or reject a pending dispute. On approval, corrects the attendance record to 'present'.
// Body: status (approved|rejected), remarks (optional)
exports.reviewDispute = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id.toString();
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
            status: false,
            message: "status is required and must be 'approved' or 'rejected'",
        });
    }

    const dispute = await reviewAttendanceDispute(corporateUser, id, {
        status,
        remarks,
        reviewedBy: corporateUser,
    });

    if (!dispute) {
        return res.status(404).json({
            status: false,
            responseCode: '001',
            message: 'Dispute not found, already reviewed, or unauthorized',
        });
    }

    if (status === 'approved' && dispute.attendance) {
        await AttendanceRecord.findByIdAndUpdate(dispute.attendance._id, {
            $set: { status: 'present' },
        });

        // A 'late' deduction also created a 0.5-day late-arrival leave cut, and an 'absent'
        // deduction a 1-day cut; reverse whichever applies so it no longer counts against
        // the employee's Annual Leave balance.
        if (dispute.disputeType === 'late') {
            await cancelLateArrivalLeaveForDate(corporateUser, dispute.employee, dispute.attendance.date);
        } else if (dispute.disputeType === 'absent') {
            await cancelAbsentLeaveForDate(corporateUser, dispute.employee, dispute.attendance.date);
        }
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: `Dispute ${status} successfully`,
        data: {
            _id: dispute._id,
            disputeType: dispute.disputeType,
            status: dispute.status,
            remarks: dispute.remarks ?? null,
            reviewedBy: dispute.reviewedBy,
            attendance: dispute.attendance
                ? { _id: dispute.attendance._id, date: dispute.attendance.date, updatedStatus: status === 'approved' ? 'present' : dispute.attendance.status }
                : null,
        },
    });
});
