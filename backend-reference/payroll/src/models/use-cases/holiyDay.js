const Holiday = require('../entities/holiyDay');
const moment = require('moment');
const Employee = require('../entities/employee');
const { escapeSearch } = require('../../utils/escapeRegex');


exports.getHolidaysInARange = async (corporateUserID, start, end) => {
    try {
        if (!start || !end) {
            // Fetch all holidays for the corporateUser when start or end date is not provided
            const allHolidays = await Holiday.find({ corporateUser: corporateUserID }).exec();
            console.log({ allHolidays });
            return allHolidays;
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        // Fetch holidays for the corporateUser within the specified date range
        const holidays = await Holiday.find({
            corporateUser: corporateUserID,
            $or: [
                {
                    $and: [
                        { start: { $gte: startDate } }, // Holiday starts after or on the start date
                        { start: { $lte: endDate } }, // Holiday starts before or on the end date
                    ],
                },
                {
                    $and: [
                        { end: { $gte: startDate } }, // Holiday ends after or on the start date
                        { end: { $lte: endDate } }, // Holiday ends before or on the end date
                    ],
                },
                {
                    $and: [
                        { start: { $lte: startDate } }, // Holiday starts before or on the start date
                        { end: { $gte: endDate } }, // Holiday ends after or on the end date
                    ],
                },
            ],
        }).exec();

        return holidays;
    } catch (error) {
        return error;
    }
};

exports.getNextDaysHolidays = async (corporateUserID) => {
    try {
        // Get current date
        const today = moment();
        const tomorrowStart = new Date(today.clone().add(1, 'day').startOf('day').format('YYYY-MM-DD[T]00:00:00.000') + 'Z'); // Start of tomorrow in UTC
        const tomorrowEnd = new Date(today.clone().add(1, 'day').endOf('day').format('YYYY-MM-DD[T]23:59:59.999') + 'Z'); // End of tomorrow in UTC

        // Find holidays with start date tomorrow
        const allHolidays = await Holiday.find({
            corporateUser: corporateUserID,
            $and: [
                { start: { $gte: new Date(tomorrowStart) } },
                { start: { $lte: new Date(tomorrowEnd) } }
            ],
            isEmailSent: false
        });

        return allHolidays;
    } catch (error) {
        return error;
    }
};

exports.getHolidaysUsingCorporateId = async (corporateUser) => {
    try {
        return await Holiday.find({ corporateUser })

    } catch (error) {
        return error;

    }
}
exports.findExistingHolidays = async (userId, holidayId, trimmedTitle, start, end) => {
    try {
        return await Holiday.findOne({
            _id: { $ne: holidayId },
            corporateUser: userId,
            $or: [
                { title: trimmedTitle },
                { $and: [{ start }, { end }] }
            ]
        });
    } catch (error) {
        console.log(error);
        return error;
    }
}

exports.findExistingHoliday = async (userId, trimmedTitle, start, end) => {
    try {
        return await Holiday.findOne({
            corporateUser: userId,
            title: trimmedTitle,
            start: { $eq: new Date(start) },
            end: { $eq: new Date(end) }
        });
    } catch (error) {
        console.log(error);
        return error;
    }
}

exports.createHoliday = async (userId, title, isAllDay, start, end, category, sendPriorEmailDate) => {
    try {
        const newHoliday = new Holiday({
            corporateUser: userId,
            title,
            isAllDay,
            start,
            end,
            category,
            sendPriorEmailDate,
        });

        return await newHoliday.save();
    } catch (error) {
        console.log(error);
        return error;
    }
}

exports.getAllActiveEmployees = async (userId) => {
    try {
        return await Employee.find({
            corporateUser: userId,
            'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] }
        });
    } catch (error) {
        console.log(error);
        return error;
    }
}

// Paginated/search/category-filterable holiday listing.
exports.getHolidaysPaginated = async (corporateUser, { start, end, search, category, page = 1, limit = 10 }) => {
    try {
        const query = { corporateUser };

        if (start || end) {
            const startDate = start ? new Date(start) : null;
            const endDate = end ? new Date(end) : null;
            query.$or = [
                { start: { ...(startDate && { $gte: startDate }), ...(endDate && { $lte: endDate }) } },
                { end: { ...(startDate && { $gte: startDate }), ...(endDate && { $lte: endDate }) } },
            ];
        }

        if (search) {
            query.title = { $regex: escapeSearch(search), $options: 'i' };
        }

        if (category) {
            query.category = category;
        }

        const skip = (page - 1) * limit;

        const [holidays, total] = await Promise.all([
            Holiday.find(query).sort({ start: 1 }).skip(skip).limit(limit).lean(),
            Holiday.countDocuments(query),
        ]);

        return { holidays, total };
    } catch (error) {
        throw new Error('Failed to fetch holidays: ' + error.message);
    }
};

exports.updateHoliday = async (userId, holidayId, trimmedTitle, isAllDay, start, end, category, sendPriorEmailDate) => {
    try {
        return await Holiday.findOneAndUpdate(
            { _id: holidayId, corporateUser: userId },
            { title: trimmedTitle, isAllDay, start, end, category, sendPriorEmailDate },
            { new: true }
        );
    } catch (error) {
        console.log(error);
        return error;
    }
}
