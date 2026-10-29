const asyncHandler = require("../../../middlewares/async");
const LeaveApplication = require("../../entities/payroll/leaveApplication");
const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose


exports.fetchLeavesByEmployeeAndCorporateUser = async (employeeId, corporateUserId, cycleStart, cycleEnd) => {
    // const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    // const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    try {
        const leaves = await LeaveApplication.find({
            employee: new ObjectId(employeeId),
            corporateUser: corporateUserId,
            start: {
                $gte: cycleStart,
                $lte: cycleEnd
            },
            typeOfLeave: 'UNPAID'
        }, { leaveCount: 1 }); 

        let leaveCount = leaves.reduce((total, item) => total + item.leaveCount, 0); 

        return { leaveCount }
    } catch (error) {
        return error
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

exports.getAllLeaves = asyncHandler(async (params) => {
    try {
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const searchText = params.searchText || '';
        const year = params.year;
        const month = params.month;
        const skip = (page - 1) * limit;

        const queryConditions = {
            corporateUser: params.corporateUserID
        };

        // Add filter for year and month
        if (year && month) {
            const firstDayOfMonth = new Date(year, month - 1, 1);
            const firstDayOfNextMonth = new Date(year, month, 1);
            const lastMillisecondOfLastDay = new Date(firstDayOfNextMonth - 1);

            queryConditions.start = {
                $gte: firstDayOfMonth,
                $lte: lastMillisecondOfLastDay
            };
        }

        const leaveData = await LeaveApplication.find(queryConditions)
            .populate({
                path: 'employee',
                match: { isEmployeeDeleted: false }, // Filtering based on isEmployeeDeleted
                select: 'fullName'
            })
            .exec();

        // Filter leaveData based on searchText, fullName, and typeOfLeave
        const filteredLeaveData = leaveData.filter(leave => {
            if(leave.employee!=null){
                const fullNameMatch = leave.employee && leave.employee.fullName.toLowerCase().includes(searchText.toLowerCase());
            const typeOfLeaveMatch = leave.typeOfLeave.toLowerCase().includes(searchText.toLowerCase());
            return fullNameMatch || typeOfLeaveMatch;
            }
            
        });

        const totalCount = filteredLeaveData.length;

        const paginatedLeaveData = filteredLeaveData.slice(skip, skip + limit);

        return {
            totalCount,
            leaveData: paginatedLeaveData
        };
    } catch (error) {
        return error;
    }
});



