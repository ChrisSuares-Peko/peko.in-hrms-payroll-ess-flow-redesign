const asyncHandler = require("../../middleware/async");
const Bonus = require("../entities/bonus");
const { escapeSearch } = require('../../utils/escapeRegex');
const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose


exports.createBonusData = asyncHandler(async (params) => {
    try {
        const bonusData = params.bonusData;
        const newBonus = new Bonus({
            ...bonusData,
            corporateUser: params.corporateUserID,
            employee: params.employeeId
        });

        const savedBonus = await newBonus.save();
        return savedBonus;


    } catch (error) {
        return error
    }
});

exports.getAllBounusUsingId = async (params) => {
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

            queryConditions.bonusDate = {
                $gte: firstDayOfMonth,
                $lte: lastMillisecondOfLastDay
            };
        }

        const bonusData = await Bonus.find(queryConditions)
            .skip(skip)
            .limit(limit)
            .exec();

        const totalCount = await Bonus.countDocuments(queryConditions);
        return {
            totalCount,
            bonusData

        }
    } catch (error) {
        return (error);
    }
};

exports.getAllBounus = async (params) => {
    try {
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const searchText = params.searchText || '';
        const skip = (page - 1) * limit;

        const queryConditions = {
            corporateUser: params.corporateUserID,
            $or: [
                { paymentStatus: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } }
            ]
        };

        if (params.from && params.to) {
            const tomorrow = new Date(params.to);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            queryConditions.$and = [
                { createdAt: { $gte: new Date(params.from) } },
                { createdAt: { $lte: new Date(tomorrow) } }
            ];
        }

        const bonusData = await Bonus.find(queryConditions)
            .skip(skip)
            .limit(limit)
            .exec();

        const totalCount = await Bonus.countDocuments(queryConditions);
        return {
            totalCount,
            bonusData

        }
    } catch (error) {
        return (error);
    }
};

exports.editBonus = asyncHandler(async (params) => {
    try {
        const corporateUserID = params.corporateUserID;
        const bonusId = params.bonusId;
        const editData = params.editData

        const query = {
            _id: bonusId,
            corporateUser: corporateUserID
        }
        const editBonus = await Bonus.updateOne(query, editData);

        return editBonus;


    } catch (error) {
        return error
    }
});

exports.deleteBonus = asyncHandler(async (params) => {
    try {
        const corporateUserID = params.corporateUserID;
        const bonusId = params.bonusId;

        const deleteBonusData = await Bonus.findOneAndDelete({
            _id: bonusId,
            corporateUser: corporateUserID
        });

        return deleteBonusData;


    } catch (error) {
        return error
    }
});

exports.fetchBonusByEmployeeAndCorporateUser = async (employeeId, corporateUserId, cycleStart, cycleEnd) => {
    try {
        const bonus = await Bonus.find({
            employee: new ObjectId(employeeId),
            corporateUser: corporateUserId,
            bonusDate: {
                $gte: cycleStart,
                $lte: cycleEnd
            },
            paymentStatus: 'UNPAID'
        }, { bonusAmount: 1, _id: 1 }); // Projection to only fetch necessary fields

        const totalBonusPay = bonus.reduce((total, item) => total + item.bonusAmount, 0);
        const bonusIds = bonus.map(item => item._id);

        return { totalBonusPay, bonusIds };

    } catch (error) {
        return error;
    }
};

exports.getAllBonusUsingId = async (params) => {
    try {
        const searchText = params.searchText || '';
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

            queryConditions.bonusDate = {
                $gte: firstDayOfMonth,
                $lte: lastMillisecondOfLastDay
            };
        }

        // Fetch all bonus data without pagination
        const bonusData = await Bonus.find(queryConditions).exec();

        // Total count of matching documents
        const totalCount = await Bonus.countDocuments(queryConditions);

        // Sum of bonusAmount for matching documents using aggregation
        const sumResult = await Bonus.aggregate([
            { $match: queryConditions },
            {
                $group: {
                    _id: null,
                    totalBonusAmount: { $sum: '$bonusAmount' }
                }
            }
        ]);

        const totalBonusAmount = sumResult.length > 0 ? sumResult[0].totalBonusAmount : 0;

        return {
            totalCount,
            bonusData,
            totalBonusAmount
        };
    } catch (error) {
        return error;
    }
};
exports.fetchBonusByEmployeeAndCorporateUserProfileSalary = async (employeeId, corporateUserId, cycleStart, cycleEnd) => {
    try {
        const bonus = await Bonus.find({
            employee: new ObjectId(employeeId),
            corporateUser: corporateUserId,
            bonusDate: {
                $gte: cycleStart,
                $lte: cycleEnd
            },
        }, { bonusAmount: 1, _id: 1 }); // Projection to only fetch necessary fields

        const totalBonusPay = bonus.reduce((total, item) => total + item.bonusAmount, 0);
        const bonusIds = bonus.map(item => item._id);

        return { totalBonusPay, bonusIds };

    } catch (error) {
        return error;
    }
};
