const asyncHandler = require("../../middleware/async");
const LeaveApplication = require("../entities/leaveApplication");
const EmployeeLeaveBalance = require('../entities/leaveBalance')
const Employee = require("../entities/employee")
const LeaveComponent = require("../entities/leaveComponent")
const LeaveBalance = require("../entities/leaveBalance");

const { createOrUpdateEmployeeLeaveBalance } = require("./leaveBalance");
const defaultLeaveComponents = require("../../utils/defaultLeaveComponents");
const { escapeSearch } = require('../../utils/escapeRegex');
const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose

// Resolve the corporate's "Annual Leave" component — preferring an employee-specific
// override, falling back to the global default, lazily creating it if neither exists.
// Late-arrival deductions always come out of Annual Leave
const findOrCreateAnnualLeaveComponent = async (corporateUser, employeeId) => {
    let component = await LeaveComponent.findOne({ corporateUser, leaveType: 'Annual Leave', employee: employeeId });
    if (!component) {
        component = await LeaveComponent.findOne({ corporateUser, leaveType: 'Annual Leave', isGlobal: true, employee: null });
    }
    if (!component) {
        const annualDefault = defaultLeaveComponents(corporateUser).find(d => d.leaveType === 'Annual Leave');
        component = await LeaveComponent.create(annualDefault);
    }
    return component;
};


exports.fetchLeavesByEmployeeAndCorporateUser = async (employeeId, corporateUserId, cycleStart, cycleEnd) => {
    try {
        const MS_PER_DAY = 24 * 60 * 60 * 1000;

        // Normalize a date to midnight UTC to avoid time-component skew
        // (cycleEnd is stored as 23:59:59.999 — normalize so +1 inclusive logic works correctly)
        const toMidnight = (d) => {
            const date = new Date(d);
            date.setUTCHours(0, 0, 0, 0);
            return date;
        };

        const cycleStartDate = toMidnight(cycleStart);
        const cycleEndDate   = toMidnight(cycleEnd);

        // All leaves that overlap this salary cycle (start <= cycleEnd AND end >= cycleStart)
        const overlappingLeaves = await LeaveApplication.find({
            employee: new ObjectId(employeeId),
            corporateUser: corporateUserId,
            start: { $lte: cycleEndDate },
            end: { $gte: cycleStartDate }
        }, { leaveCount: 1, typeOfLeave: 1, start: 1, end: 1 })
        .populate('typeOfLeave', 'maximumNumberOfLeaves leaveType');

        // For each overlapping leave, count only the days that fall within this cycle
        const takenByType = {};
        for (const leave of overlappingLeaves) {
            const typeId = leave.typeOfLeave?._id?.toString() || 'unknown';
            const leaveStart = toMidnight(leave.start);
            const leaveEnd   = toMidnight(leave.end);
            const effectiveStart = leaveStart > cycleStartDate ? leaveStart : cycleStartDate;
            const effectiveEnd   = leaveEnd   < cycleEndDate   ? leaveEnd   : cycleEndDate;
            const daysInCycle    = Math.round((effectiveEnd - effectiveStart) / MS_PER_DAY) + 1;

            if (!takenByType[typeId]) {
                takenByType[typeId] = {
                    taken: 0,
                    maxAllowed: leave.typeOfLeave?.maximumNumberOfLeaves ?? Infinity
                };
            }
            takenByType[typeId].taken += daysInCycle;
        }

        // For each leave type, count days taken in cycles BEFORE this one
        // (only days that actually fall before cycleStart, even for spanning leaves)
        const previousTakenByType = {};
        for (const typeId of Object.keys(takenByType)) {
            if (typeId === 'unknown') continue;
            const priorLeaves = await LeaveApplication.find({
                employee: new ObjectId(employeeId),
                corporateUser: corporateUserId,
                typeOfLeave: new ObjectId(typeId),
                start: { $lt: cycleStartDate }
            }, { start: 1, end: 1 });

            let totalPriorDays = 0;
            for (const leave of priorLeaves) {
                const leaveEnd  = toMidnight(leave.end);
                // Clamp end to one day before cycleStart so spanning leaves aren't double-counted
                const countUpTo = leaveEnd < cycleStartDate
                    ? leaveEnd
                    : new Date(cycleStartDate.getTime() - MS_PER_DAY);
                const days = Math.round((countUpTo - toMidnight(leave.start)) / MS_PER_DAY) + 1;
                if (days > 0) totalPriorDays += days;
            }
            previousTakenByType[typeId] = totalPriorDays;
        }

        // Deduct only the days that exceed the allowance and weren't already deducted before
        let leaveCount = 0;
        for (const [typeId, { taken, maxAllowed }] of Object.entries(takenByType)) {
            const previouslyTaken = previousTakenByType[typeId] || 0;
            const alreadyExceeded = Math.max(0, previouslyTaken - maxAllowed);
            const totalExceeded   = Math.max(0, previouslyTaken + taken - maxAllowed);
            leaveCount += totalExceeded - alreadyExceeded;
        }

        return { leaveCount };
    } catch (error) {
        return { leaveCount: 0 };
    }
};
exports.fetchIndividualLeavesByEmployeeAndCorporateUser = async (employeeId, corporateUserId, cycleStart, cycleEnd) => {
    try {
        const leaves = await LeaveApplication.find({
            employee: new ObjectId(employeeId),
            corporateUser: corporateUserId,
            start: {
                $gte: cycleStart,
                $lte: cycleEnd
            },
            typeOfLeave: 'UNPAID'
        });

        return leaves;
    } catch (error) {
        return error
    }
};

exports.getExcelLeaveDetails = asyncHandler(async (params) => {
    try {
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const searchText = params.searchText || '';
        const year = params.year;
        const month = params.month;
        const skip = (page - 1) * limit;

        const matchConditions = {
            corporateUser: params.corporateUserID,
            isLateArrivalDeduction: { $ne: true },
            // Match getAllLeaves (the "Leaves" tab this export is generated from):
            // only approved ESS requests and HR-added leaves. Pending/rejected/cancelled
            // requests belong to Leave Requests, not this export.
            status: { $nin: ['applied', 'rejected', 'cancelledByEmployee'] }
        };

        // Date filter
        if (year && month) {
            const firstDayOfMonth = new Date(year, month - 1, 1);
            const firstDayOfNextMonth = new Date(year, month, 1);
            const lastMillisecondOfLastDay = new Date(firstDayOfNextMonth - 1);

            matchConditions.start = {
                $gte: firstDayOfMonth,
                $lte: lastMillisecondOfLastDay
            };
        }

        const leaveData = await LeaveApplication.aggregate([

            // Match stage
            {
                $match: matchConditions
            },

            // Lookup employee (populate employee)
            {
                $lookup: {
                    from: "employee", // collection name
                    localField: "employee",
                    foreignField: "_id",
                    as: "employee"
                }
            },

            {
                $unwind: {
                    path: "$employee",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Lookup leave type
            {
                $lookup: {
                    from: "leavecomponents", // collection name
                    localField: "typeOfLeave",
                    foreignField: "_id",
                    as: "typeOfLeave"
                }
            },

            {
                $unwind: {
                    path: "$typeOfLeave",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Project only required fields
              {
        $project: {

            start: 1,
            end: 1,
            corporateUser: 1,

            "employee._id": 1,
            "employee.personalInformation.fullName": 1,
            "employee.employeeInformation.employeeId": 1,
            "employee.isEmployeeDeleted": 1,

            "typeOfLeave.leaveType": 1,
            "typeOfLeave._id": 1,
            "typeOfLeave.id": 1,
            leaveCount: 1,
            halfDaySelection:1
        }
    },
            
            {
                $skip: skip
            },

            {
                $limit: limit
            },
            {

        $match: {
            $or: [

                {
                    "employee.personalInformation.fullName": {
                        $regex: escapeSearch(searchText),
                        $options: "i"
                    }
                },

                {
                    "employee.employeeInformation.employeeId": {
                        $regex: escapeSearch(searchText),
                        $options: "i"
                    }
                },
                {
                    "typeOfLeave.leaveType": {
                        $regex: escapeSearch(searchText),
                        $options: "i"
                    }
                }

            ]
        }

    }

        ])
        const filtered = leaveData.filter(leave => leave.employee && leave.employee.isEmployeeDeleted !== true);


        const leaveDataWithBalance = await Promise.all(
            filtered.map(async (leave) => {
                if (!leave.employee) return leave;

                if (!leave.typeOfLeave?._id) {
                    return { ...leave, leaveBalance: null };
                }

                const leaveComponent = await LeaveComponent.findOne({ _id: leave.typeOfLeave._id, corporateUser: params.corporateUserID });

                let leaveBalance = null;
                if (leaveComponent) {
                    const totalAllowance = leaveComponent.maximumNumberOfLeaves;
                    const usedLeaves = await LeaveApplication.aggregate([
                        {
                            $match: {
                                employee: leave.employee._id,
                                typeOfLeave: leave.typeOfLeave._id,
                                status: { $nin: ['applied', 'rejected', 'cancelledByEmployee'] }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalUsed: { $sum: '$leaveCount' }
                            }
                        }
                    ]);

                    const used = usedLeaves?.[0]?.totalUsed || 0;
                    leaveBalance = totalAllowance - used;
                }

                return {
                    ...leave,
                    leaveBalance,
                };
            })
        );




        // const totalCount = filteredLeaveData.length;

        // const paginatedLeaveData = filteredLeaveData.slice(skip, skip + limit);

        return leaveDataWithBalance
    } catch (error) {
        console.log("errrror ", error)
        return error;
    }
})

exports.getAllLeaves = asyncHandler(async (params) => {
    try {
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const searchText = params.searchText || '';
        const year = params.year;
        const month = params.month;
        const skip = (page - 1) * limit;

        const matchConditions = {
            corporateUser: params.corporateUserID,
            // Auto-created late-arrival cuts aren't a real leave request — they belong
            // in the Deduction Log, not this list.
            isLateArrivalDeduction: { $ne: true },
            // Only show approved ESS requests and HR-added leaves (status left undefined).
            // Pending/rejected/cancelled requests stay in Leave Requests until resolved.
            status: { $nin: ['applied', 'rejected', 'cancelledByEmployee'] }
        };

        // Date filter
        if (year && month) {
            const firstDayOfMonth = new Date(year, month - 1, 1);
            const firstDayOfNextMonth = new Date(year, month, 1);
            const lastMillisecondOfLastDay = new Date(firstDayOfNextMonth - 1);

            matchConditions.start = {
                $gte: firstDayOfMonth,
                $lte: lastMillisecondOfLastDay
            };
        }

        const leaveData = await LeaveApplication.aggregate([

            // Match stage
            {
                $match: matchConditions
            },

            // Lookup employee (populate employee)
            {
                $lookup: {
                    from: "employee", // collection name
                    localField: "employee",
                    foreignField: "_id",
                    as: "employee"
                }
            },

            {
                $unwind: {
                    path: "$employee",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Lookup leave type
            {
                $lookup: {
                    from: "leavecomponents", // collection name
                    localField: "typeOfLeave",
                    foreignField: "_id",
                    as: "typeOfLeave"
                }
            },

            {
                $unwind: {
                    path: "$typeOfLeave",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Project only required fields
              {
        $project: {

            start: 1,
            end: 1,
            corporateUser: 1,

            "employee._id": 1,
            "employee.personalInformation.fullName": 1,
            "employee.employeeInformation.employeeId": 1,
            "employee.isEmployeeDeleted": 1,

            "typeOfLeave.leaveType": 1,
            "typeOfLeave._id": 1,
            "typeOfLeave.id": 1,
            leaveCount: 1,
            halfDaySelection:1
        }
    },
            
            {
                $skip: skip
            },

            {
                $limit: limit
            },
            {

        $match: {
            $or: [

                {
                    "employee.personalInformation.fullName": {
                        $regex: escapeSearch(searchText),
                        $options: "i"
                    }
                },

                {
                    "employee.employeeInformation.employeeId": {
                        $regex: escapeSearch(searchText),
                        $options: "i"
                    }
                },
                {
                    "typeOfLeave.leaveType": {
                        $regex: escapeSearch(searchText),
                        $options: "i"
                    }
                }

            ]
        }

    }

        ])

//         const leaveSummary = await LeaveApplication.aggregate([

//   // 1️⃣ Match specific employee (and other filters if needed)
//   {
//     $match: {
//       corporateUser: params.corporateUserID
//       // corporateUser: corporateUserId,  // if required
//       // start: { $gte: fromDate },
//       // end: { $lte: toDate }
//     }
//   },

//   // 2️⃣ Group by typeOfLeave
//   {
//     $group: {
//       _id: "$typeOfLeave",
//       totalLeaves: { $sum: "$leaveCount" }
//     }
//   },

//   // 3️⃣ Lookup leave type details
//   {
//     $lookup: {
//       from: "leavecomponents",
//       localField: "_id",
//       foreignField: "_id",
//       as: "leaveType"
//     }
//   },

//   {
//     $unwind: {
//       path: "$leaveType",
//       preserveNullAndEmptyArrays: true
//     }
//   },

//   // 4️⃣ Final projection
//   {
//     $project: {
//       _id: 0,
//       leaveTypeId: "$leaveType._id",
//       leaveType: "$leaveType.leaveType",
//       totalLeaves: 1
//     }
//   }

// ]);
        // console.log("leaveData", leaveData)
        const filtered = leaveData.filter(leave => leave.employee && leave.employee.isEmployeeDeleted !== true);


        const leaveDataWithBalance = await Promise.all(
            filtered.map(async (leave) => {
                if (!leave.employee) return leave;

                const leaveBalanceDoc = await LeaveComponent.findOne({ _id:leave.typeOfLeave._id,corporateUser:params.corporateUserID});
              
                let leaveBalance = null;
                if (leaveBalanceDoc) {

                    // leaveBalanceDoc.leavePolicies.forEach((p, index) => {
                    //     console.log(`Policy[${index}] leaveComponent ID:`, p.leaveComponent?.toString());
                    // });
                    // const policy = leaveBalanceDoc.leavePolicies.find(
                    //     (p) => p.leaveComponent.toString() === leave.typeOfLeave?._id?.toString()
                    // );
                    if (leaveBalanceDoc) {
                        const totalAllowance =leaveBalanceDoc?.maximumNumberOfLeaves ;
                        const previousLeaves = await LeaveApplication.aggregate([
                            {
                                $match: {
                                    employee: leave.employee._id,
                                    typeOfLeave: leave.typeOfLeave._id,
                                    status: { $nin: ['applied', 'rejected', 'cancelledByEmployee'] }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    totalUsedBefore: { $sum: '$leaveCount' }
                                }
                            }
                        ]);

                        const usedBefore = previousLeaves?.[0]?.totalUsedBefore || 0;
                        leaveBalance = totalAllowance - usedBefore;

                        // leaveBalance = policy.availableLeave;
                    }
                }
                // console.log("leavee alace", leaveBalance)
                return {
                    ...leave,
                    leaveBalance,
                };
            })
        );

        const totalCount = leaveDataWithBalance.length;
        const paginatedLeaveData = leaveDataWithBalance.slice(skip, skip + limit);


        // const totalCount = filteredLeaveData.length;

        // const paginatedLeaveData = filteredLeaveData.slice(skip, skip + limit);

        return {
            totalCount,
            leaveData: paginatedLeaveData
        };
    } catch (error) {
        console.log("errrror ", error)
        return error;
    }
});

exports.findExistingLeave = async (corporateUserID, employeeId, start, end) => {
    try {
        return await LeaveApplication.findOne({
            corporateUser: corporateUserID,
            employee: employeeId,
            start: { $lte: end },
            end: { $gte: start },
            status: { $nin: ['rejected', 'cancelledByEmployee'] }
        });
    } catch (error) {
        console.log(error);
        return error;
    }
};


//for creating leave application

exports.createLeaveApplication = async (params) => {
    try {

        const { start, end, leaveCount, typeOfLeave, corporateUser, employee, halfDaySelection } = params

        const existingLeave = await LeaveApplication.findOne({
            employee: employee,
            $or: [
                { start: { $lte: new Date(end) }, end: { $gte: new Date(start) } }, // Checks for overlap with existing leaves
            ]
        });



        if (existingLeave) {
            return {
                status: false,
                message: `Leave cannot be granted for this period as it overlaps with an existing leave from ${existingLeave.start.toDateString()} to ${existingLeave.end.toDateString()}.`,
                data: {}
            };
        }

        // 2. Check for conflicting leave under different policies
        const conflictingLeave = await LeaveApplication.findOne({
            employee: employee,
            startDate: { $lte: new Date(end) }, // Check if any leave starts before or on the requested end date
            endDate: { $gte: new Date(start) }, // Check if any leave ends after or on the requested start date
        });

        if (conflictingLeave) {

            return {
                status: false,
                message: `You already have a leave applied from ${conflictingLeave.startDate} to ${conflictingLeave.endDate} and cannot apply for another leave in this period.`,
                data: {}
            };
        }

        // 3. Fetch leave component data (either global or employee-specific)
        const leaveComponent = await LeaveComponent.findOne({
            corporateUser: corporateUser,
            _id: typeOfLeave,  // Match the leave type for either global or employee-specific policies
        });

        if (!leaveComponent) {
            return {
                status: false,
                message: `Leave component not found for this employee or global policy.`,
                data: {}
            };


        }

        // 4. Calculate available leave by adding carryover if allowed
        let availableLeave = leaveComponent.maximumNumberOfLeaves;
        if (leaveComponent.leaveBalanceCarryover === 'ALLOWED') {
            availableLeave += leaveComponent.carryOverBalance || 0;  // Add carryover from previous year
        }

        // 5. Check if employee has enough leave balance
        if (availableLeave < leaveCount) {
            return {
                status: false,
                message: `You only have ${availableLeave} days of ${typeOfLeave} available.`,
                data: {}
            };

        }

        const newLeaveApplication = new LeaveApplication({
            corporateUser,
            employee,
            start,
            end,
            leaveCount,
            typeOfLeave,
            halfDaySelection,
            status: 'approved'
        });

        const data = await newLeaveApplication.save();
        return {
            status: true,
            data
        };
    } catch (error) {

        return error;
    }
};

exports.findExistingLeaveSpecified = async (leaveId, corporateUserID, employeeId, start, end) => {
    try {
        const result = await LeaveApplication.findOne({
            _id: { $ne: leaveId },
            corporateUser: corporateUserID,
            employee: employeeId,
            start: { $gt: end },
            end: { $lt: start }
        });
        return result;
    } catch (error) {
        console.log(error);
        return error;
    }
};



exports.getLeavesForEmployee = async (employeeId, corporateUserID, page, limit, searchText) => {
    try {
        const skip = (page - 1) * limit;

        // Step 1: Base query
        const queryConditions = {
            employee: employeeId,
            corporateUser: corporateUserID,
            // Auto-created late-arrival cuts aren't a real leave request — they belong
            // in the Deduction Log, not this list.
            isLateArrivalDeduction: { $ne: true }
        };

        // Step 2: Get employee details
        const employee = await Employee.findById(employeeId)
            .select('personalInformation.fullName employeeInformation.designation profileImage');
        const employeeDetails = {
            fullName: employee?.personalInformation?.fullName || '',
            designation: employee?.employeeInformation?.designation || '',
            profileImage: employee?.profileImage || null
        };

        // Step 3: Get all leaves for the employee
        const leaves = await LeaveApplication.find(queryConditions).exec();

        // Step 4: Get leave policies and build leave type map
        const leavePolicies = await LeaveComponent.find({ corporateUser: corporateUserID });
        const leaveTypeMap = {};
        leavePolicies.forEach(policy => {
            leaveTypeMap[policy._id.toString()] = policy.leaveType;
        });

        // Step 5: Update leave balances
        await createOrUpdateEmployeeLeaveBalance(employeeId, leavePolicies);

        // Step 6: Get updated leave balances
        const leaveBalanceDoc = await LeaveBalance.findOne({ employee: employeeId });
        const balanceMap = {};
        if (leaveBalanceDoc) {
            for (const item of leaveBalanceDoc.leavePolicies) {
                balanceMap[item.leaveComponent.toString()] = {
                    availableLeave: item.availableLeave,
                    carryOverBalance: item.carryOverBalance
                };
            }
        }

        // Step 7: Enrich leaves
        let enrichedLeaves = leaves.map((leave) => {
            const leaveComponentId = leave.typeOfLeave?.toString();
            const balance = balanceMap[leaveComponentId] || {};
            return {
                ...leave.toObject(),
                typeOfLeave: {
                    _id: leaveComponentId,
                    typeOfLeave: leaveTypeMap[leaveComponentId] || ''
                },
                leaveBalance: {
                    availableLeave: balance.availableLeave || 0,
                    carryOverBalance: balance.carryOverBalance || 0
                },
            };
        });

        // Step 8: Filter leaves by search text
        if (searchText && searchText.trim() !== '') {
            console.log("inside search text",searchText)
            const searchLower = searchText.toLowerCase();
            enrichedLeaves = enrichedLeaves.filter(leave =>{
                return leave.typeOfLeave.typeOfLeave.toLowerCase().includes(searchLower)
            }
            );
        }

        // Step 9: Pagination
        const totalCount = enrichedLeaves.length;
        const paginatedLeaves = enrichedLeaves.slice(skip, skip + limit);



        return {
            count: totalCount,
            employeeDetails,
            rows: paginatedLeaves
        };
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.updateLeaveApplication = async ({
    corporateUser,
    leaveId,
    start,
    end,
    leaveCount,
    typeOfLeave,
    halfDaySelection
}) => {
    try {
        const existingLeave = await LeaveApplication.findOne({ _id: leaveId, corporateUser });
        if (!existingLeave) {
            return { status: false, message: 'Leave application not found.', data: {} };
        }

        // Check for overlapping with other leave applications
        const overlappingLeave = await LeaveApplication.findOne({
            _id: { $ne: leaveId },
            employee: existingLeave.employee,
            $or: [
                { start: { $lte: new Date(end) }, end: { $gte: new Date(start) } },
            ],
        });

        if (overlappingLeave) {
            return {
                status: false,
                message: `This leave overlaps with existing leave from ${overlappingLeave.start.toDateString()} to ${overlappingLeave.end.toDateString()}.`,
                data: {},
            };
        }

        // Fetch leave component
        const leaveComponent = await LeaveComponent.findOne({
            corporateUser,
            _id: typeOfLeave,
        });

        if (!leaveComponent) {
            return {
                status: false,
                message: 'Leave component not found.',
                data: {},
            };
        }

        // Recalculate available leave
        let availableLeave = leaveComponent.maximumNumberOfLeaves;
        if (leaveComponent.leaveBalanceCarryover === 'ALLOWED') {
            availableLeave += leaveComponent.carryOverBalance || 0;
        }

        // Optional: Adjust for previously used leaveCount if needed
        if (leaveCount > availableLeave) {
            return {
                status: false,
                message: `Only ${availableLeave} days of leave are available.`,
                data: {},
            };
        }

        // Update leave record
        existingLeave.start = start;
        existingLeave.end = end;
        existingLeave.leaveCount = leaveCount;
        existingLeave.typeOfLeave = typeOfLeave;
        existingLeave.halfDaySelection = halfDaySelection;

        const data = await existingLeave.save();

        return { status: true, data };

    } catch (err) {
        return {
            status: false,
            message: err.message || 'Failed to update leave application',
            data: {},
        };
    }
};

// Auto-created 0.5-day cut applied when an employee checks in late (Late Arrival Policy).
// Mirrors the same EmployeeLeaveBalance decrement the corporate "add leave" flow uses
// (controller/leaveApplication.js's createLeaveApplication), so it shows up wherever
// that balance is already read
exports.createLateArrivalLeave = async (corporateUser, employeeId, date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const DEDUCTION = 0.5;
    const leaveComponent = await findOrCreateAnnualLeaveComponent(corporateUser, employeeId);

    let employeeLeaveBalance = await EmployeeLeaveBalance.findOne({ employee: employeeId });
    if (!employeeLeaveBalance) {
        employeeLeaveBalance = new EmployeeLeaveBalance({
            employee: employeeId,
            leavePolicies: [{
                leaveComponent: leaveComponent._id,
                availableLeave: Math.max((leaveComponent.maximumNumberOfLeaves || 0) - DEDUCTION, 0),
                carryOverBalance: leaveComponent.carryOverBalance || 0,
            }],
        });
    } else {
        const idx = employeeLeaveBalance.leavePolicies.findIndex(
            (p) => p.leaveComponent.toString() === leaveComponent._id.toString()
        );
        if (idx === -1) {
            employeeLeaveBalance.leavePolicies.push({
                leaveComponent: leaveComponent._id,
                availableLeave: Math.max((leaveComponent.maximumNumberOfLeaves || 0) - DEDUCTION, 0),
                carryOverBalance: leaveComponent.carryOverBalance || 0,
            });
        } else {
            employeeLeaveBalance.leavePolicies[idx].availableLeave = Math.max(
                (employeeLeaveBalance.leavePolicies[idx].availableLeave || 0) - DEDUCTION,
                0
            );
        }
    }
    await employeeLeaveBalance.save();

    return await LeaveApplication.create({
        corporateUser,
        employee: employeeId,
        start: dayStart,
        end: dayStart,
        leaveCount: DEDUCTION,
        typeOfLeave: leaveComponent._id,
        halfDaySelection: 'FIRST_HALF',
        isLateArrivalDeduction: true,
    });
};

// Reverse the late-arrival deduction for an employee on a given date (e.g. when an
// attendance dispute is approved) — deletes the auto-created leave record and restores
// the 0.5 day back onto the employee's Annual Leave balance.
exports.cancelLateArrivalLeaveForDate = async (corporateUser, employeeId, date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const deduction = await LeaveApplication.findOneAndDelete({
        corporateUser,
        employee: employeeId,
        isLateArrivalDeduction: true,
        start: { $gte: dayStart, $lte: dayEnd },
    });
    if (!deduction) return null;

    await EmployeeLeaveBalance.findOneAndUpdate(
        { employee: employeeId, 'leavePolicies.leaveComponent': deduction.typeOfLeave },
        { $inc: { 'leavePolicies.$.availableLeave': deduction.leaveCount } }
    );

    return deduction;
};

// Auto-created 1-day cut applied the first time an absence is treated as a concrete fact
// (currently: when the employee disputes it, materializing the "virtual" absent day into a
// real AttendanceRecord). Mirrors createLateArrivalLeave's EmployeeLeaveBalance decrement.
exports.createAbsentLeave = async (corporateUser, employeeId, date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const DEDUCTION = 1;
    const leaveComponent = await findOrCreateAnnualLeaveComponent(corporateUser, employeeId);

    let employeeLeaveBalance = await EmployeeLeaveBalance.findOne({ employee: employeeId });
    if (!employeeLeaveBalance) {
        employeeLeaveBalance = new EmployeeLeaveBalance({
            employee: employeeId,
            leavePolicies: [{
                leaveComponent: leaveComponent._id,
                availableLeave: Math.max((leaveComponent.maximumNumberOfLeaves || 0) - DEDUCTION, 0),
                carryOverBalance: leaveComponent.carryOverBalance || 0,
            }],
        });
    } else {
        const idx = employeeLeaveBalance.leavePolicies.findIndex(
            (p) => p.leaveComponent.toString() === leaveComponent._id.toString()
        );
        if (idx === -1) {
            employeeLeaveBalance.leavePolicies.push({
                leaveComponent: leaveComponent._id,
                availableLeave: Math.max((leaveComponent.maximumNumberOfLeaves || 0) - DEDUCTION, 0),
                carryOverBalance: leaveComponent.carryOverBalance || 0,
            });
        } else {
            employeeLeaveBalance.leavePolicies[idx].availableLeave = Math.max(
                (employeeLeaveBalance.leavePolicies[idx].availableLeave || 0) - DEDUCTION,
                0
            );
        }
    }
    await employeeLeaveBalance.save();

    return await LeaveApplication.create({
        corporateUser,
        employee: employeeId,
        start: dayStart,
        end: dayStart,
        leaveCount: DEDUCTION,
        typeOfLeave: leaveComponent._id,
        isAbsentDeduction: true,
    });
};

// Reverse the absence deduction for an employee on a given date (e.g. when an attendance
// dispute is approved) — deletes the auto-created leave record and restores the 1 day back
// onto the employee's Annual Leave balance.
exports.cancelAbsentLeaveForDate = async (corporateUser, employeeId, date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const deduction = await LeaveApplication.findOneAndDelete({
        corporateUser,
        employee: employeeId,
        isAbsentDeduction: true,
        start: { $gte: dayStart, $lte: dayEnd },
    });
    if (!deduction) return null;

    await EmployeeLeaveBalance.findOneAndUpdate(
        { employee: employeeId, 'leavePolicies.leaveComponent': deduction.typeOfLeave },
        { $inc: { 'leavePolicies.$.availableLeave': deduction.leaveCount } }
    );

    return deduction;
};

// ESS-facing available-leave balance: computed live by summing effective usage
// against each applicable LeaveComponent's quota. Mirrors AE's
// getAvailableLeavesForUser — no persistent ledger, always computed fresh.
// Only requests that are actually "in force" reduce it: approved ESS requests,
// HR-created leave (no status field at all), and late-arrival cuts. Pending
// ('applied') and rejected/cancelled requests never reduce balance.
exports.getAvailableLeavesForEmployee = async (corporateUser, employeeId, employeeGender) => {
    try {
        // Resolve applicable components: an employee-specific override takes
        // precedence over its matching global component.
        const globalComponentIdsToExclude = await LeaveComponent.find({
            corporateUser,
            employee: employeeId,
            isGlobal: false,
            globalComponentId: { $ne: null }
        }).distinct('globalComponentId');

        const eligibleComponents = await LeaveComponent.find({
            corporateUser,
            $or: [
                { isGlobal: false, globalComponentId: null, employee: employeeId },
                { isGlobal: false, globalComponentId: { $in: globalComponentIdsToExclude }, employee: employeeId },
                { isGlobal: true, _id: { $nin: globalComponentIdsToExclude }, globalComponentId: null }
            ]
        }).lean();

        // Maternity/Paternity-style components only apply to the matching gender.
        const components = eligibleComponents.filter(
            c => !c.applicableGender || c.applicableGender === 'ALL' || c.applicableGender === employeeGender
        );

        const componentIds = components.map(c => c._id);

        const usedByComponent = await LeaveApplication.aggregate([
            {
                $match: {
                    corporateUser,
                    employee: new ObjectId(employeeId),
                    typeOfLeave: { $in: componentIds },
                    status: { $nin: ['applied', 'rejected', 'cancelledByEmployee'] }
                }
            },
            { $group: { _id: '$typeOfLeave', leaveCount: { $sum: '$leaveCount' } } }
        ]);
        const usedMap = {};
        for (const u of usedByComponent) usedMap[u._id.toString()] = u.leaveCount;

        const availableLeaves = components.map(component => {
            let total = component.maximumNumberOfLeaves || 0;
            if (component.leaveBalanceCarryover === 'ALLOWED') {
                total += component.carryOverBalance || 0;
            }
            const used = usedMap[component._id.toString()] || 0;
            const remaining = total - used;
            return {
                value: component._id.toString(),
                label: component.leaveType,
                count: remaining >= 0 ? remaining : 0,
            };
        });

        // Unpaid leave is always available, not backed by a configured component.
        availableLeaves.push({ value: 'UNPAID', label: 'Unpaid Leave', count: 'Available' });

        return availableLeaves;
    } catch (error) {
        throw new Error('Failed to fetch available leaves: ' + error.message);
    }
};

// Leave application raised by the employee (Employee Self-Service): always status "applied".
exports.createUserLeaveApplication = async (corporateUser, employeeId, leaveData) => {
    try {
        const { start, end, leaveCount, typeOfLeave, isUnpaidLeave, halfDaySelection, notes } = leaveData;
        return await LeaveApplication.create({
            corporateUser,
            employee: employeeId,
            start,
            end,
            leaveCount,
            typeOfLeave: isUnpaidLeave ? undefined : typeOfLeave,
            isUnpaidLeave: !!isUnpaidLeave,
            halfDaySelection,
            notes,
            status: 'applied',
        });
    } catch (error) {
        throw new Error('Failed to submit leave application: ' + error.message);
    }
};

// The employee's own leave applications, newest first (ESS "my leaves" list), paginated.
exports.findLeavesByEmployee = async (corporateUser, employeeId, { from, to, status, page = 1, limit = 10 } = {}) => {
    try {
        const query = {
            corporateUser,
            employee: employeeId,
            isLateArrivalDeduction: { $ne: true },
            isAbsentDeduction: { $ne: true },
        };
        if (from || to) {
            query.start = {};
            if (from) query.start.$gte = from;
            if (to) query.start.$lte = to;
        }
        if (status) query.status = status;

        const skip = (page - 1) * limit;
        const [records, total] = await Promise.all([
            LeaveApplication.find(query)
                .populate('typeOfLeave', 'leaveType')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            LeaveApplication.countDocuments(query),
        ]);

        return { records, total };
    } catch (error) {
        throw new Error('Failed to fetch leave applications: ' + error.message);
    }
};

// Find a single leave application that belongs to the given employee.
exports.findLeaveByIdForEmployee = async (corporateUser, employeeId, leaveId) => {
    try {
        return await LeaveApplication.findOne({ _id: leaveId, corporateUser, employee: employeeId });
    } catch (error) {
        throw new Error('Failed to fetch leave application: ' + error.message);
    }
};

// Cancel the employee's own leave application. The "only applied/approved can be
// cancelled" rule is enforced by the caller, matching AE's own separation of concerns.
exports.cancelUserLeave = async (corporateUser, employeeId, leaveId) => {
    try {
        return await LeaveApplication.findOneAndUpdate(
            { _id: leaveId, corporateUser, employee: employeeId },
            { $set: { status: 'cancelledByEmployee' } },
            { new: true }
        );
    } catch (error) {
        throw new Error('Failed to cancel leave application: ' + error.message);
    }
};

// Corporate-side: paginated list of employees' leave requests. Only ESS-submitted
// records ever have a status, so this naturally excludes HR-created leave.
exports.findLeaveRequests = async (corporateUser, { employeeIds, searchOrConditions, status, from, to, page = 1, limit = 30 } = {}) => {
    try {
        const query = {
            corporateUser,
            status: status || { $in: ['applied', 'approved', 'rejected', 'cancelledByEmployee'] }
        };
        if (employeeIds) query.employee = { $in: employeeIds };
        if (searchOrConditions) query.$or = searchOrConditions;
        if (from || to) {
            query.start = {};
            if (from) query.start.$gte = from;
            if (to) query.start.$lte = to;
        }

        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            LeaveApplication.find(query)
                .populate('typeOfLeave', 'leaveType')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            LeaveApplication.countDocuments(query),
        ]);

        return { records, total };
    } catch (error) {
        throw new Error('Failed to fetch leave requests: ' + error.message);
    }
};



