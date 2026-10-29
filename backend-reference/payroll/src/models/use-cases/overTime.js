const asyncHandler = require("../../middleware/async");
const Overtime = require("../entities/overTime");
const { escapeSearch } = require('../../utils/escapeRegex');
const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose

// Create an overtime request raised by an employee (status: requestedByEmployee).
exports.createOvertimeRequest = async (data) => {
    try {
        return await Overtime.create(data);
    } catch (error) {
        throw new Error("Failed to create overtime request: " + error.message);
    }
};

// Check for an existing open (requestedByEmployee) overtime request for the same date.
exports.findOpenOvertimeRequestForDate = async (corporateUser, employee, dayStart, dayEnd) => {
    try {
        return await Overtime.findOne({
            corporateUser,
            employee,
            status: "requestedByEmployee",
            overTimeDate: { $gte: dayStart, $lte: dayEnd },
        });
    } catch (error) {
        throw new Error("Failed to check existing overtime request: " + error.message);
    }
};

// List an employee's overtime records, newest first, with optional status/date filters + pagination.
// Also returns a summary (total approved hours, approved count, pending count)
// computed across ALL records matching the date filter — independent of both
// pagination and the status filter, so the stat cards above the table always
// reflect the true totals rather than just whatever page/status is showing.
exports.findOvertimeByEmployee = async (corporateUser, employee, { status, from, to, page = 1, limit = 30 } = {}) => {
    try {
        const dateFilter = {};
        if (from) dateFilter.$gte = from;
        if (to) dateFilter.$lte = to;
        const hasDateFilter = from || to;

        const query = { corporateUser, employee };
        if (status) {
            query.status = status;
        }
        if (hasDateFilter) {
            query.overTimeDate = dateFilter;
        }

        // Aggregation $match does NOT auto-cast query values the way .find() does,
        // so employee must be cast to ObjectId explicitly or this matches nothing.
        const summaryMatch = { corporateUser, employee: new ObjectId(employee) };
        if (hasDateFilter) {
            summaryMatch.overTimeDate = dateFilter;
        }

        const skip = (page - 1) * limit;

        const [records, total, summaryResult] = await Promise.all([
            Overtime.find(query)
                .select("overTimeDate extraHours notes status paymentStatus")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Overtime.countDocuments(query),
            Overtime.aggregate([
                { $match: summaryMatch },
                {
                    $group: {
                        _id: null,
                        totalOtHours: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, "$extraHours", 0] } },
                        approvedCount: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
                        pendingCount: { $sum: { $cond: [{ $eq: ["$status", "requestedByEmployee"] }, 1, 0] } },
                    },
                },
            ]),
        ]);

        const summaryRow = summaryResult[0] || {};
        return {
            records,
            total,
            summary: {
                totalOtHours: summaryRow.totalOtHours || 0,
                approvedCount: summaryRow.approvedCount || 0,
                pendingCount: summaryRow.pendingCount || 0,
            },
        };
    } catch (error) {
        throw new Error("Failed to fetch overtime records: " + error.message);
    }
};

// Find a single overtime record that belongs to the given employee.
exports.findOvertimeByIdForEmployee = async (corporateUser, employee, overtimeId) => {
    try {
        return await Overtime.findOne({ _id: overtimeId, corporateUser, employee });
    } catch (error) {
        throw new Error("Failed to fetch overtime record: " + error.message);
    }
};

// Cancel the employee's own overtime request.
exports.cancelOvertimeRequest = async (corporateUser, employee, overtimeId) => {
    try {
        return await Overtime.findOneAndUpdate(
            { _id: overtimeId, corporateUser, employee },
            { $set: { status: "cancelledByEmployee" } },
            { new: true }
        );
    } catch (error) {
        throw new Error("Failed to cancel overtime request: " + error.message);
    }
};

exports.createOverTimeData = asyncHandler(async (params) => {
    try {
        const overTimeData = params.overtimeData;
        const newOverTime = new Overtime({
            ...overTimeData,
            corporateUser: params.corporateUserID,
            employee: params.employeeId
        });

        const savedOverTime = await newOverTime.save();
        return savedOverTime;

    } catch (error) {
        return error
    }
});


exports.getAllOverTimeData = asyncHandler(async (params) => {
    try {
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const searchText = params.searchText || '';
        const skip = (page - 1) * limit;

        const queryConditions = {
            corporateUser: params.corporateUserID,
            employee: params.employeeId,
            $or: [
                { paymentStatus: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } }
            ]
        };

        if (params.month && params.year) {
            const firstDayOfMonth = new Date(params.year, params.month - 1, 1);
            const firstDayOfNextMonth = new Date(params.year, params.month, 1);
            const lastMillisecondOfLastDay = new Date(firstDayOfNextMonth - 1);

            queryConditions.overTimeDate = {
                $gte: firstDayOfMonth,
                $lte: lastMillisecondOfLastDay
            };
        }

        const overTimeData = await Overtime.find(queryConditions)
            .skip(skip)
            .limit(limit)
            .exec();

        const totalCount = await Overtime.countDocuments(queryConditions);
        return {
            totalCount,
            overTimeData

        }
    } catch (error) {
        return (error);
    }
});

exports.fetchAllOverTimeData = asyncHandler(async (params) => {
    try {
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const searchText = params.searchText || '';
        const skip = (page - 1) * limit;

        const queryConditions = {
            corporateUser: params.corporateUserID,
        };

        if (searchText) {
            queryConditions.$or = [
                { paymentStatus: { $regex: escapeSearch(searchText), $options: 'i' } }
            ];
        }

        if (params.status) queryConditions.status = params.status;

        const [overTimeData, totalCount] = await Promise.all([
            Overtime.find(queryConditions)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            Overtime.countDocuments(queryConditions),
        ]);

        const Employee = require('../entities/employee');
        const employeeIds = [...new Set(overTimeData.map(r => r.employee?.toString()).filter(Boolean))];
        const employees = await Employee.find(
            { _id: { $in: employeeIds } },
            'personalInformation.fullName personalInformation.email profileImage employeeInformation'
        ).lean();
        const empMap = {};
        for (const emp of employees) empMap[emp._id.toString()] = emp;

        const enriched = overTimeData.map(r => {
            const emp = empMap[r.employee?.toString()];
            return {
                ...r.toJSON(),
                status: r.status ?? null,
                employeeDetails: emp ? {
                    fullName: emp.personalInformation?.fullName ?? null,
                    email: emp.personalInformation?.email ?? null,
                    profileImage: emp.profileImage ?? null,
                    designation: emp.employeeInformation?.designation ?? null,
                } : null,
            };
        });

        return {
            totalCount,
            overTimeData: enriched
        }
    } catch (error) {
        return (error);
    }
});

exports.deleteOverTime = asyncHandler(async (params) => {
    try {
        const corporateUserID = params.corporateUserID;
        const overTimeId = params.overTimeId;

        const deleteOverTimeData = await Overtime.findOneAndDelete({
            _id: overTimeId,
            corporateUser: corporateUserID
        });

        return deleteOverTimeData;

    } catch (error) {
        return error
    }
});

exports.editOverTime = asyncHandler(async (params) => {
    try {
        const corporateUserID = params.corporateUserID;
        const overTimeId = params.overTimeId;
        const editData = params.editData

        const query = {
            _id: overTimeId,
            corporateUser: corporateUserID
        }
        const editOverTimeData = await Overtime.updateOne(query, editData);

        return editOverTimeData;

    } catch (error) {
        return error
    }
});

exports.fetchOvertimeByEmployeeAndCorporateUser = async (employeeId, corporateUserId, cycleStart, cycleEnd) => {
    try {
        const overtime = await Overtime.find({
            employee: new ObjectId(employeeId),
            corporateUser: corporateUserId,
            overTimeDate: {
                $gte: cycleStart,
                $lte: cycleEnd
            },
            paymentStatus: 'UNPAID',
            // Employee-submitted-but-unreviewed requests must not be paid before HR review.
            // HR-created records have no `status` field at all, so they're unaffected.
            status: { $ne: 'requestedByEmployee' }
        }, { overTimeAmount: 1, _id: 1 });

        const totalOvertimePay = overtime.reduce((total, item) => total + item.overTimeAmount, 0);
        const overtimeIds = overtime.map(item => item._id);
        return { totalOvertimePay, overtimeIds };

    } catch (error) {
        return error
    }
};
exports.fetchOvertimeByEmployeeAndCorporateUserProfileSalary = async (employeeId, corporateUserId, cycleStart, cycleEnd) => {
    try {
        const overtime = await Overtime.find({
            employee: new ObjectId(employeeId),
            corporateUser: corporateUserId,
            overTimeDate: {
                $gte: cycleStart,
                $lte: cycleEnd
            },
        }, { overTimeAmount: 1, _id: 1 });

        const totalOvertimePay = overtime.reduce((total, item) => total + item.overTimeAmount, 0);
        return { totalOvertimePay };

    } catch (error) {
        return error
    }
};