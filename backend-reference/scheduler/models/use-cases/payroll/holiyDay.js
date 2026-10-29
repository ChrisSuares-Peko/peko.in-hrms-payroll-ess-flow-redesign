const Holiday = require('../../entities/payroll/holiyDay');
const moment = require('moment');

exports.getHolidaysInARange = async (corporateUserID, start, end) => {

    try {
        if (!start || !end) {
            // Fetch all holidays for the corporateUser when start or end date is not provided
            const allHolidays = await Holiday.find({ corporateUser: corporateUserID }).exec();
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
        const todayStart = new Date(today.clone().startOf('day').format('YYYY-MM-DD[T]00:00:00.000') + 'Z'); // Start of today in UTC
        const todayEnd = new Date(today.clone().endOf('day').format('YYYY-MM-DD[T]23:59:59.999') + 'Z'); // End of today in UTC

        // Find holidays with sendPriorEmailDate today
        const allHolidays = await Holiday.find({
            corporateUser: corporateUserID,
            $and: [
                { sendPriorEmailDate: { $gte: todayStart } },
                { sendPriorEmailDate: { $lte: todayEnd } }
            ],
            isEmailSent: false
        });

        return allHolidays;
    } catch (error) {
        return error;
    }
};


exports.getHolidaysUsingCorporateId = async(corporateUser) =>{
    try {
        return await Holiday.find({corporateUser})
        
    } catch (error) {
        return error;
        
    }
}
