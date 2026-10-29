const Increment = require("../entities/increment");
const { ObjectId } = require('mongoose').Types;
const moment = require('moment');
const { escapeSearch } = require('../../utils/escapeRegex');

/**
 * after creating need to update all future increment's basicSalary, newBasicSalary, 
 * and based on incrementType we need to update -> incrementAmount or incrementPercentage 
 */
exports.autoUpdateUpcomingIncrements = async ({ incrementId, isDelete = false }) => {
    try {
        const currentIncrement = await Increment.findOne({ _id: incrementId })
        let { effectiveDate, basicSalary, newBasicSalary, employee: employeeId, corporateUser: corporateUserID } = currentIncrement

        if (isDelete) {
            newBasicSalary = basicSalary
        }

        const upcomingIncrements = await Increment.find({
            employee: new ObjectId(employeeId),
            corporateUser: corporateUserID,
            effectiveDate: {
                $gte: effectiveDate
            },
            _id: { $ne: new ObjectId(incrementId) } // Exclude the document with _id == incrementId
        }).sort({ effectiveDate: 1, createdAt: 1 })

        for (let i = 0; i < upcomingIncrements.length; i++) {
            const incrementData = upcomingIncrements[i];
            incrementData.basicSalary = newBasicSalary
            let updatedBasicSalary = incrementData.newBasicSalary
            let { incrementType, incrementAmount, incrementPercentage } = incrementData
            if (incrementType === 'percentage') {
                const calculatedIncrementAmount = (newBasicSalary * incrementPercentage) / 100;
                incrementData.incrementAmount = calculatedIncrementAmount
                updatedBasicSalary = newBasicSalary + calculatedIncrementAmount;
            } else if (incrementType === 'flat') {
                const calculatedIncrementPercentage = (incrementAmount * 100) / newBasicSalary;
                incrementData.incrementPercentage = calculatedIncrementPercentage
                updatedBasicSalary = newBasicSalary + incrementAmount;
            }
            incrementData.newBasicSalary = updatedBasicSalary
            newBasicSalary = updatedBasicSalary
            await incrementData.save()
        }
        return true
    } catch (error) {
        console.log(error);
        return false;
    }
};

exports.createIncrement = async (data) => {
    try {
        const newIncrement = new Increment(data);
        const savedIncrement = await newIncrement.save();
        await this.autoUpdateUpcomingIncrements({ incrementId: newIncrement._id })
        return savedIncrement;

    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.editIncrement = async (params) => {
    try {
        const corporateUserID = params.corporateUserID;
        const incrementId = params.incrementId;
        const editData = params.editData

        const query = {
            _id: incrementId,
            corporateUser: corporateUserID
        }
        const editIncrementData = await Increment.updateOne(query, editData);
        await this.autoUpdateUpcomingIncrements({ incrementId })
        return editIncrementData;

    } catch (error) {
        return error
    }
};

exports.deleteIncrement = async (params) => {
    try {
        const corporateUserID = params.corporateUserID;
        const incrementId = params.incrementId;

        await this.autoUpdateUpcomingIncrements({ incrementId, isDelete: true })

        const deleteIncrementData = await Increment.findOneAndDelete({
            _id: incrementId,
            corporateUser: corporateUserID
        });

        return deleteIncrementData;

    } catch (error) {
        return error
    }
};

exports.getAllIncrementData = async (params) => {
    try {
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const searchText = params.searchText || '';
        const skip = (page - 1) * limit;

        const queryConditions = {
            corporateUser: params.corporateUserID,
            employee: params.employeeId,
            $or: [
                { status: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } }
            ]
        };

        if (params.month && params.year) {
            const firstDayOfMonth = new Date(params.year, params.month - 1, 1);
            const firstDayOfNextMonth = new Date(params.year, params.month, 1);
            const lastMillisecondOfLastDay = new Date(firstDayOfNextMonth - 1);

            queryConditions.effectiveDate = {
                $gte: firstDayOfMonth,
                $lte: lastMillisecondOfLastDay
            };
        }

        const incrementData = await Increment.find(queryConditions)
            .skip(skip)
            .limit(limit)
            .exec();

        const totalCount = await Increment.countDocuments(queryConditions);
        return {
            totalCount,
            incrementData

        }
    } catch (error) {
        return (error);
    }
};

exports.findMultiIncrementsForMonth = async (params) => {
    try {
        const { effectiveDate, employeeId, corporateUserID } = params
        const date = moment(new Date(effectiveDate));
        const startDateTime = date.startOf('month').format('YYYY-MM-DD HH:mm:ss');
        const endDateTime = date.endOf('month').format('YYYY-MM-DD HH:mm:ss');

        const upcomingIncrements = await Increment.find({
            employee: new ObjectId(employeeId),
            corporateUser: corporateUserID,
            effectiveDate: {
                $gte: new Date(startDateTime),
                $lte: new Date(endDateTime)
            },
        });

        if (Array.isArray(upcomingIncrements) && upcomingIncrements.length === 0) {
            return { status: true, message: 'Success.' }
        } else {
            return { status: false, message: 'Increments already exists for this month.' }
        }
    } catch (error) {
        return { status: false, message: 'Something went wrong while creating increment.' }
    }
};

exports.findIncrementGiven = async (params) => {
    try {
        const { employeeId, corporateUserID } = params
        const allIncrements = await Increment.find({
            employee: new ObjectId(employeeId),
            corporateUser: corporateUserID,
        });
        console.log({ allIncrements })
        if (Array.isArray(allIncrements) && allIncrements.length === 0) {
            return { status: true, message: 'Success.' }
        } else {
            return { status: false, message: 'An Increment is already given' }
        }
    } catch (error) {
        return { status: false, message: 'Something went wrong.' }
    }
};