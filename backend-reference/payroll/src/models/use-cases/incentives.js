const asyncHandler = require("../../middleware/async");
const Incentives = require("../entities/incentives");
const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose


exports.createIncentive = async (data) => {
    try {

        const newIncentives = new Incentives(data);

        const savedIncentives = await newIncentives.save();

        return savedIncentives;

    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.getAllIncentivesData = async (params) => {
    try {
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const skip = (page - 1) * limit;

        const queryConditions = {
            corporateUser: params.corporateUserID,
            employee: params.employeeId,
            // $or: [
            //     { paymentStatus: { $regex: `^${searchText}`, $options: 'i' } }
            // ]
        };

        if (params.month && params.year) {
            const firstDayOfMonth = new Date(params.year, params.month - 1, 1);
            const firstDayOfNextMonth = new Date(params.year, params.month, 1);
            const lastMillisecondOfLastDay = new Date(firstDayOfNextMonth - 1);

            queryConditions.incentiveDate = {
                $gte: firstDayOfMonth,
                $lte: lastMillisecondOfLastDay
            };
        }

        const incentivesData = await Incentives.find(queryConditions)
            .skip(skip)
            .limit(limit)
            .exec();

        const totalCount = await Incentives.countDocuments(queryConditions);
        return {
            totalCount,
            incentivesData

        }
    } catch (error) {
        return (error);
    }
};

exports.fetchAllIncentivesData = async (params) => {
    try {
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const skip = (page - 1) * limit;

        const queryConditions = {
            corporateUser: params.corporateUserID,
            // $or: [
            //     { paymentStatus: { $regex: `^${searchText}`, $options: 'i' } }
            // ]
        };

        const incentivesData = await Incentives.find(queryConditions)
            .skip(skip)
            .limit(limit)
            .exec();

        const totalCount = await Incentives.countDocuments(queryConditions);
        return {
            totalCount,
            incentivesData

        }
    } catch (error) {
        return (error);
    }
};

exports.editIncentive = asyncHandler(async (params) => {
    try {
        const corporateUserID = params.corporateUserID;
        const incentiveId = params.incentiveId;
        const editData = params.editData

        const query = {
            _id: incentiveId,
            corporateUser: corporateUserID
        }
        const editIncentiveData = await Incentives.updateOne(query, editData);

        return editIncentiveData;


    } catch (error) {
        return error
    }
});

exports.deleteIncentive = asyncHandler(async (params) => {
    try {
        const corporateUserID = params.corporateUserID;
        const incentiveId = params.incentiveId;

        const deleteIncentiveData = await Incentives.findOneAndDelete({
            _id: incentiveId,
            corporateUser: corporateUserID
        });

        return deleteIncentiveData;

    } catch (error) {
        return error
    }
});


exports.fetchIncentivesByEmployeeAndCorporateUser = async (employeeId, corporateUserId, month, year) => {
    try {
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const firstDayOfNextMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(firstDayOfNextMonth - 1);
        const incentives = await Incentives.aggregate([
            {
                $match: {
                    employee: new ObjectId(employeeId),
                    corporateUser: corporateUserId,
                    incentiveDate: {
                        $gte: firstDayOfMonth,
                        $lte: lastDayOfMonth
                    },
                    // paymentStatus: "UNPAID"
                }
            },
            {
                $group: {
                    _id: null,
                    totalIncentivesPay: { $sum: "$amount" },
                    incentivesIds: { $push: "$_id" }
                }
            }
        ]);
        // Extract result from the aggregation output
        const result = incentives[0] || { totalIncentivesPay: 0, incentivesIds: [] };
        return result;
    } catch (error) {
        return error
    }
};
exports.fetchIncentivesByEmployeeAndCorporateUserProfileSalary = async (employeeId, corporateUserId, cycleStart, cycleEnd) => {
    try {
        // const firstDayOfMonth = new Date(year, month - 1, 1);
        // const firstDayOfNextMonth = new Date(year, month, 1);
        // const lastDayOfMonth = new Date(firstDayOfNextMonth - 1);
        const incentives = await Incentives.aggregate([
            {
                $match: {
                    employee: new ObjectId(employeeId),
                    corporateUser: corporateUserId,
                    incentiveDate: {
                        $gte: cycleStart,
                        $lte: cycleEnd
                    },
                }
            },
            {
                $group: {
                    _id: null,
                    totalIncentivesPay: { $sum: "$amount" },
                    incentivesIds: { $push: "$_id" }
                }
            }
        ]);
        const result = incentives[0] || { totalIncentivesPay: 0 };
        return result;
    } catch (error) {
        return error
    }
};