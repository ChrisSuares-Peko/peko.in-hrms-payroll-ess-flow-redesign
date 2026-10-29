const LeaveComponent = require("../entities/leaveComponent");
const LeaveApplication = require("../entities/leaveApplication");
const EmployeeLeaveBalance = require("../entities/leaveBalance");
const Employee = require("../entities/employee");
const CorporateUserProgress = require("../entities/corporateUserProgress");
const { recalculateAndUpsertProgress } = require("../../services/progressCalculator");

const asyncHandler = require("../../middleware/async");
const defaultLeaveComponents = require("../../utils/defaultLeaveComponents");
const { Types } = require("mongoose");
const { escapeSearch } = require('../../utils/escapeRegex');
const { markSalaryStale } = require("../../services/salaryStaleMarker");


exports.createLeaveComponent = async (data) => {
    try {
        const newLeaveComponent = new LeaveComponent(data);
        const savedLeaveComponent = await newLeaveComponent.save();
        return savedLeaveComponent;
    } catch (error) {
        console.log(error);
        return error;
    }
};


//creating employee-specific leave components


exports.createEmployeeLeavePolicy = async (params) => {
        const { employeeID, leaveType, accrualType, accrualRate, maximumAccrual, leaveBalanceCarryover, maximumNumberOfLeaves, corporateUserID } = params;
        // Check if the employee already has a leave policy with the same leaveType
        const existingPolicy = await LeaveComponent.findOne({
            corporateUser: corporateUserID,
            employee: employeeID,
            leaveType: leaveType,
            isGlobal: false  // Ensure it's an employee-specific leave policy
        });

        if (existingPolicy) {
            throw new Error('Leave policy with this leave type already exists for this employee.');
        }

        // Create the employee-specific leave policy
        const newLeavePolicy = new LeaveComponent({
            corporateUser: corporateUserID,  // Assuming corporateUserID is available in the session
            employee: employeeID,  // Link to specific employee
            leaveType,
            accrualType,
            accrualRate,
            maximumAccrual,
            leaveBalanceCarryover,
            maximumNumberOfLeaves,
            isGlobal: false,  // Mark as employee-specific
            globalComponentId: null  // Not linked to any global component
        });

        // Save the new leave policy in the database
        await newLeavePolicy.save();

        // Return the newly created leave policy
        return newLeavePolicy;
};

// Seed default leave components exactly once per corporate. The "seeded" marker lives on
// CorporateUserProgress, so HR deleting every policy doesn't bring the defaults back.
// Corporates that already have global components (seeded before this flag existed) are
// just marked as seeded.
const seedDefaultLeaveComponentsOnce = async (corporateUserID) => {
    const progress = await CorporateUserProgress.findOne({ corporateUser: corporateUserID })
        .select('hasSeededDefaultLeaves')
        .lean();
    if (progress?.hasSeededDefaultLeaves) return;

    // Create the progress doc via the calculator (not a bare upsert) so dashboard progress stays correct
    if (!progress) {
        await recalculateAndUpsertProgress(corporateUserID);
    }

    // Atomic claim: only one concurrent request gets to seed
    const claimed = await CorporateUserProgress.findOneAndUpdate(
        { corporateUser: corporateUserID, hasSeededDefaultLeaves: { $ne: true } },
        { $set: { hasSeededDefaultLeaves: true } }
    );
    if (!claimed) return;

    const existingCount = await LeaveComponent.countDocuments({
        corporateUser: corporateUserID,
        employee: null,
        globalComponentId: null,
    });
    if (existingCount > 0) return;

    try {
        await LeaveComponent.insertMany(defaultLeaveComponents(corporateUserID));
    } catch (error) {
        // Release the claim so the next fetch retries seeding
        await CorporateUserProgress.updateOne(
            { corporateUser: corporateUserID },
            { $set: { hasSeededDefaultLeaves: false } }
        );
        throw error;
    }

    // New leave limits change LOP for everyone (services/salarySync.js).
    await markSalaryStale({
        corporateUserID,
        reason: 'Default leave components seeded',
    });
};

//fetching global leave components

exports.getLeaveComponent = async (params) => {
    try {
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const searchText = params.searchText || '';
        const skip = (page - 1) * limit;
        await seedDefaultLeaveComponentsOnce(params.corporateUserID);
        const queryConditions = {
            corporateUser: params.corporateUserID,
            $or: [
                { isGlobal: true },  // Fetch global leave components only
                { globalComponentId: null, employee: null }  // Fetch only leave components where globalComponentId is null and employee is null
            ],
            $and: [
                {
                    $or: [
                        { leaveType: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } },
                        { accrualType: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } },
                        { status: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } },
                        { leaveBalanceCarryover: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } }
                    ]
                }
            ]
        };

        const leaveComponentData = await LeaveComponent.find(queryConditions)
            .skip(skip)
            .limit(limit)
            .exec();



        const totalCount = await LeaveComponent.countDocuments(queryConditions);
        return {
            totalCount,
            leaveComponentData,

        };
    } catch (error) {
        return (error);
    }
};




exports.getLeavePoliciesForEmployeeProfile = async (params) => {
    try {
        const { employeeID, corporateUserID, limit, searchText, skip } = params;

        const employee = await Employee.findById(employeeID).select('personalInformation.gender').lean();
        const employeeGender = employee?.personalInformation?.gender;

        // Step 1: Fetch Employee-Specific Policies to extract globalComponentIds (linked to global policies)
        const employeeSpecificPolicies = await LeaveComponent.find({
            corporateUser: corporateUserID,
            employee: employeeID,  // Only employee-specific policies
            isGlobal: false,       // Ensure it's employee-specific
            globalComponentId: { $ne: null }  // Ensure globalComponentId is set (linked to a global policy)
        }).exec();

        // Step 2: Extract globalComponentIds from employee-specific policies (global policies linked to employee-specific policies)
        const globalComponentIdsToExclude = employeeSpecificPolicies
            .map(policy => policy.globalComponentId)
            .filter(id => id !== null);  // Filter out any null values

        const baseOrConditions = [
            {
                isGlobal: false,
                globalComponentId: null,
                employee: employeeID
            },
            {
                isGlobal: false,
                globalComponentId: { $in: globalComponentIdsToExclude },
                employee: employeeID
            },
            {
                isGlobal: true,
                _id: { $nin: globalComponentIdsToExclude },
                globalComponentId: null
            }
        ];

        const queryConditions = {
            corporateUser: corporateUserID,
            $and: [
                { $or: baseOrConditions },
                { $or: [
                    { applicableGender: { $exists: false } },
                    { applicableGender: 'ALL' },
                    { applicableGender: employeeGender }
                ] }
            ]
        };

        if (searchText) {
            queryConditions.$and.push({
                $or: [
                    { leaveType: { $regex: escapeSearch(searchText), $options: 'i' } },
                    { accrualType: { $regex: escapeSearch(searchText), $options: 'i' } },
                    { leaveBalanceCarryover: { $regex: escapeSearch(searchText), $options: 'i' } }
                ]
            });
        }

        // Step 5: Fetch the leave policy data based on the query conditions
        const leavePolicyData = await LeaveComponent.find(queryConditions)
            .skip(skip)
            .limit(limit)
            .exec();

        // Step 6: Fetch the total count for pagination
        const totalCount = await LeaveComponent.countDocuments(queryConditions);


        return {
            totalCount,
            leavePolicyData
        };
    } catch (error) {
        console.error(error);
        return { status: false, message: 'Error fetching leave policies' };
    }
};


exports.getLeavePoliciesForEmployeeProfileForDropDown = async (params) => {
    try {
        const { employeeID, corporateUserID, searchText } = params;

        const employee = await Employee.findById(employeeID).select('personalInformation.gender').lean();
        const employeeGender = employee?.personalInformation?.gender;

        // Step 1: Extract globalComponentIds from employee-specific policies (single query for ids only)
        const globalComponentIdsToExclude = await LeaveComponent.find({
            corporateUser: corporateUserID,
            employee: employeeID,
            isGlobal: false,
            globalComponentId: { $ne: null }
        }).distinct('globalComponentId');

        // Step 2: Construct query conditions using array directly (lean approach for faster find)
        const baseOr = [
            {
                isGlobal: false,
                globalComponentId: null,
                employee: employeeID
            },
            {
                isGlobal: false,
                globalComponentId: { $in: globalComponentIdsToExclude },
                employee: employeeID
            },
            {
                isGlobal: true,
                _id: { $nin: globalComponentIdsToExclude },
                globalComponentId: null
            }
        ];

        const mainQuery = {
            corporateUser: corporateUserID,
            $and: [
                { $or: baseOr },
                { $or: [
                    { applicableGender: { $exists: false } },
                    { applicableGender: 'ALL' },
                    { applicableGender: employeeGender }
                ] }
            ]
        };
        if (searchText) {
            const searchRegex = { $regex: escapeSearch(searchText), $options: 'i' };
            mainQuery.$and.push({
                $or: [
                    { leaveType: searchRegex },
                    { accrualType: searchRegex },
                    { status: searchRegex },
                    { leaveBalanceCarryover: searchRegex }
                ]
            });
        }

        // Step 4: Find policies with lean for memory efficiency
        let leavePolicyData = await LeaveComponent.find(mainQuery).lean();

        // Step 5: Pre-aggregate leave counts for all leaveComponent-employee pairs (single aggregation for speed)
        const leaveComponentIds = leavePolicyData.map(x => x._id);
        const leaveCounts = await LeaveApplication.aggregate([
            { $match: {
                typeOfLeave: { $in: leaveComponentIds },
                employee: new Types.ObjectId(employeeID)
            }},
            { $group: {
                _id: "$typeOfLeave",
                totalLeaveCount: { $sum: "$leaveCount" }
            }}
        ]);

        // Map results for O(1) access
        const leaveCountMap = {};
        for (const rec of leaveCounts) {
            leaveCountMap[rec._id.toString()] = rec.totalLeaveCount;
        }

        // Step 6: Attach calculated leave balance
        leavePolicyData = leavePolicyData.map(x => {
            const totalUsed = leaveCountMap[x._id.toString()] || 0;
            return {
                ...x,
                id: x._id,
                balanceLeaves: (Number(x.maximumNumberOfLeaves) || 0) - totalUsed
            };
        });

        return {
            totalCount: leavePolicyData.length,
            leavePolicyData
        };
    } catch (error) {
        console.error(error);
        return { status: false, message: 'Error fetching leave policies' };
    }
};



exports.editLeaveComponent = async (params) => {
    const { corporateUserID, leaveId, editData, } = params;
    let employeeId = params.employeeId;

    try {
        // sanitize employee ID if not passed 
        if (!employeeId || employeeId === 'undefined') {
            employeeId = null;
        }
        // Step 1: Find the existing leave component by ID and corporate user ID
        const foundLeaveComponent = await LeaveComponent.findOne({
            _id: leaveId,
            corporateUser: corporateUserID
        });

        // If the leave component is not found or the user is unauthorized to edit it
        if (!foundLeaveComponent) {
            throw new Error('Leave component not found');
        }

        let updatedLeavePolicy;

        // Step 2: Case 1 - Editing a global leave component for an employee
        if (foundLeaveComponent.isGlobal) {


            // Update the global leave component
            updatedLeavePolicy = await LeaveComponent.findOneAndUpdate(
                { _id: leaveId, corporateUser: corporateUserID },
                { $set: editData },  // Update the fields from editData
                { new: true } // Return the updated document
            );

            // If employeeId is provided, create a new employee-specific policy
            if (employeeId) {


                // Check if an employee-specific policy already exists with this globalComponentId
                const existingEmployeePolicy = await LeaveComponent.findOne({
                    corporateUser: corporateUserID,
                    employee: employeeId,
                    globalComponentId: updatedLeavePolicy._id
                });

                if (existingEmployeePolicy) {


                    updatedLeavePolicy = await LeaveComponent.findOneAndUpdate(
                        { _id: existingEmployeePolicy._id, corporateUser: corporateUserID },
                        { $set: editData },  // Update the fields in the existing policy
                        { new: true } // Return the updated document
                    );

                    return updatedLeavePolicy;  // Return the updated employee-specific policy
                }

                // If no existing employee-specific policy, create a new one
                const employeeSpecificPolicy = new LeaveComponent({
                    corporateUser: corporateUserID,
                    employee: employeeId,  // Assign the employee ID to the new policy
                    leaveType: editData.leaveType || updatedLeavePolicy.leaveType,
                    accrualType: editData.accrualType || updatedLeavePolicy.accrualType,
                    accrualRate: editData.accrualRate || updatedLeavePolicy.accrualRate,
                    maximumAccrual: editData.maximumAccrual || updatedLeavePolicy.maximumAccrual,
                    leaveBalanceCarryover: editData.leaveBalanceCarryover || updatedLeavePolicy.leaveBalanceCarryover,
                    maximumNumberOfLeaves: editData.maximumNumberOfLeaves || updatedLeavePolicy.maximumNumberOfLeaves,
                    isGlobal: false,  // It's now employee-specific
                    globalComponentId: updatedLeavePolicy._id  // Link to the original global component
                });

                // Save the new employee-specific leave policy
                await employeeSpecificPolicy.save();


                return employeeSpecificPolicy;
            }

            // Return the updated global leave policy
            return updatedLeavePolicy;
        }

        // Step 3: Case 2 - Editing an employee-specific policy
        if (!foundLeaveComponent.isGlobal) {


            // Update the existing employee-specific leave policy
            updatedLeavePolicy = await LeaveComponent.findOneAndUpdate(
                { _id: leaveId, corporateUser: corporateUserID },
                { $set: editData },
                { new: true } // Return the updated document
            );

            return updatedLeavePolicy;
        }

        // Return an error if no valid conditions were met (e.g., global component with invalid logic)
        throw new Error('Invalid leave component type for update');
    } catch (error) {
        console.log("Error:", error);
        throw error;
    }
};






exports.deleteLeaveComponent = asyncHandler(async (params) => {
    try {
        const corporateUserID = params.corporateUserID;
        const leaveId = params.leaveId;
        // Step 1: Check if any employee has applied leave using this policy
        const isUsedInLeave = await LeaveApplication.exists({
            corporateUser: corporateUserID,
            typeOfLeave: leaveId
        });

        if (isUsedInLeave) {
            return {
                status: false,
                message: 'Cannot delete this leave policy as it has been used in leave applications.',
            };
        }

        // Step 2: Remove the leave component from EmployeeLeaveBalance for all employees
        await EmployeeLeaveBalance.updateMany(
            {
                'leavePolicies.leaveComponent': leaveId
            },
            {
                $pull: {
                    leavePolicies: { leaveComponent: leaveId }
                }
            }
        );
        // Step 2: Delete the leave component from LeaveComponent collection

        const deleteLeaveComponentData = await LeaveComponent.findOneAndDelete({
            _id: leaveId,
            corporateUser: corporateUserID
        });

        return deleteLeaveComponentData;

    } catch (error) {
        return error
    }
});
exports.getLeaveandAttendanceUsingCorporateId = async (corporateUser) => {
    try {
        return await LeaveComponent.find({ corporateUser })

    } catch (error) {
        return error;

    }
}