const asyncHandler = require("../../../middlewares/async");
const Overtime = require("../../entities/payroll/overTime");
const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose



exports.createOverTimeData = asyncHandler(async (params) => {
    const overTimeData = params.overtimeData;

    try {
        const newOverTime = new Overtime({
            corporateUser: params.corporateUserID,
            employee: params.employeeId,
            ...overTimeData
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
                { paymentStatus: { $regex: `^${searchText}`, $options: 'i' } }
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
            $or: [
                { paymentStatus: { $regex: `^${searchText}`, $options: 'i' } }
            ]
        };


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
            paymentStatus: 'UNPAID'
        }, { overTimeAmount: 1, _id: 1 });

        const totalOvertimePay = overtime.reduce((total, item) => total + item.overTimeAmount, 0);
        const overtimeIds = overtime.map(item => item._id);

        return { totalOvertimePay, overtimeIds };

    } catch (error) {
        return error
    }
};