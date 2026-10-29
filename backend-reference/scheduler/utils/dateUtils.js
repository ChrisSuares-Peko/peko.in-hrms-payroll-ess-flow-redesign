const { customLog } = require('./loggerHelper');

/**
 * Formats a given date string into a human-readable date format.
 * @param {string} dateString - A string representing a date (in a format supported by JavaScript Date).
 * @returns {string} - A formatted date string in the format: Month Day, Year (e.g., January 1, 2023).
 *                   - Returns 'Invalid Date' if the input date string is not valid.
 */
exports.humanReadableDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    return formattedDate;
};

exports.humanReadableDateTime = (dateString) => {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: 'UTC'
    };
    const formattedDate = date.toLocaleDateString('en-US', options);
    return formattedDate;
};

/**
 * Calculates the end of the day for a given date string in ISO 8601 format.
 * @param {string} dateString - A string representing a date (in a format supported by JavaScript Date).
 * @returns {string} - An ISO 8601 formatted string representing the end of the provided day.
 *                    - Returns 'Invalid Date' if the input date string is not valid.
 */
exports.getEndOfDay = (dateString) => {
    const date = new Date(dateString);
    date.setUTCHours(23, 59, 59, 999); // Sets the time to 23:59:59.999 for the given date
    return date.toISOString(); // Returns the date in ISO 8601 format
}



exports.getDaysInMonth = (month, year) => {
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    return lastDayOfMonth;
}
exports.getDaysInPreviousMonth = (currentMonth, currentYear) => {
    // Calculate previous month and year
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Get the number of days in the previous month
    return this.getDaysInMonth(previousMonth, previousYear);
};
exports.getPreviousMonthAndYear = (month, year) => {
    let previousMonth, previousYear;

    if (month === 1) {
        previousMonth = 12;
        previousYear = year - 1;
    } else {
        previousMonth = month - 1;
        previousYear = year;
    }

    return { previousMonth, previousYear };
};


exports.getDaysDifference = (startDate, endDate) => {
    const oneDay = 24 * 60 * 60 * 1000; // Hours * Minutes * Seconds * Milliseconds
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate the difference in milliseconds
    const differenceMs = Math.abs(end.getTime() - start.getTime());

    // Convert the difference to days
    const differenceDays = Math.round(differenceMs / oneDay);
    return differenceDays;
}



exports.formatTime = (timeString) => {
    try {
        const date = new Date(timeString);

        if (isNaN(date.getTime())) {
            throw new Error('Invalid time');
        }

        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');

        return `${hours}:${minutes}`;
    } catch (error) {
        customLog(null, "error", { error, message: "Error formatting time" });
        return 'N/A';
    }
};

exports.monthNames = {
    1: "Jan",
    2: "Feb",
    3: "Mar",
    4: "Apr",
    5: "May",
    6: "Jun",
    7: "Jul",
    8: "Aug",
    9: "Sep",
    10: "Oct",
    11: "Nov",
    12: "Dec"
};
exports.getYearlyDays = (year) => {
    function isLeapYear(year) {
        // Leap years are divisible by 4
        // but not divisible by 100 unless also divisible by 400
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    const leapYear = isLeapYear(year);
    return leapYear ? 366 : 365;
};

function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

// Function to generate the subject
exports.generateSubject = (type, from, to) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Check if it's a daily, weekly, or monthly report
    const isSameDay = fromDate.getDate() === toDate.getDate() &&
                      fromDate.getMonth() === toDate.getMonth() &&
                      fromDate.getFullYear() === toDate.getFullYear();
    
    const isSameMonth = fromDate.getMonth() === toDate.getMonth() &&
                        fromDate.getFullYear() === toDate.getFullYear();

    // Daily report (format: Date)
    const dailySubject = `[Internal] ${type} Monitoring Report - ${formatDate(fromDate)}`;

    const weeklySubject = `[Internal] ${type} Monitoring Report`;

    const monthlySubject = `[Internal] ${type} Monitoring Report}`;

    if (isSameDay) {
        return dailySubject;
    } else if (isSameMonth) {
        return weeklySubject;
    } else {
        return monthlySubject;
    }
}
