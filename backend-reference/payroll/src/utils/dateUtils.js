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
        console.log('Error formatting time:', error);
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

const WEEKDAY_NAME_TO_JS_DAY = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

// Counts how many days in [startDate, endDate] (inclusive) fall on one of the
// organization's configured working weekdays (payrollSettings.selectWorkingDays,
// e.g. ["MON",...,"FRI"]).
// Cycle boundaries (cycleStart/cycleEnd) are built in UTC (calculateSalaryCycleBasedOnMonth
// uses moment.utc(...).endOf('day')), so this must truncate/iterate in UTC too — using local
// setHours/getDay would shift the boundary onto the next/previous calendar day on any server
// not running in the UTC timezone (e.g. IST is UTC+5:30, so 23:59:59.999Z lands after local
// midnight the next day), silently miscounting an extra or missing working day.
exports.countWorkingDaysInRange = (startDate, endDate, workingDays) => {
    const jsWorkingDays = new Set(
        (workingDays || []).map(day => WEEKDAY_NAME_TO_JS_DAY[String(day).toUpperCase()]).filter(d => d !== undefined)
    );
    if (jsWorkingDays.size === 0) return 0;

    const cur = new Date(startDate);
    cur.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(0, 0, 0, 0);

    let count = 0;
    while (cur <= end) {
        if (jsWorkingDays.has(cur.getUTCDay())) count++;
        cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return count;
};

// Resolves the divisor used to turn the monthly gross into a per-day rate for LOP /
// non-working-days proration. Payroll Settings > Payroll Cycle lets a corporate user pick
// "Actual days in a month" (calendar days, the existing/default behavior) or "Company
// working days" (only the weekdays configured in selectWorkingDays, e.g. Mon-Fri = ~21-23
// days/month instead of 28-31). Falls back to calendarDays whenever COMPANYWORKINGDAYS
// isn't explicitly selected or selectWorkingDays isn't configured, so orgs that never
// touched this setting see no change in behavior.
/**
 * Days to deduct as "not employed" (joined after the cycle start / left before its end /
 * payroll started mid-cycle), in the SAME unit as resolvePerDayDivisor.
 *
 * Calendar-day payrolls keep the existing calendar count (calendarDeductionDays) unchanged.
 * For "Company working days" payrolls, counting the missed span in calendar days against a
 * working-days divisor over-deducts — e.g. joining Mon 28 Sep: 27 calendar days missed vs a
 * 22-working-day divisor wiped out the whole month, although 28/29/30 Sep were worked. There
 * the deduction is divisor minus the working days actually employed in the cycle.
 */
exports.resolveNonWorkingPayDays = ({ calendarDeductionDays, cycleStart, cycleEnd, perDayDivisor, payrollSettings, doj, lastWorkingDay, payrollStartsFrom }) => {
    const workingDays = payrollSettings?.selectWorkingDays;
    const isWorkingDayBasis = payrollSettings?.calculateSalaryBasedOn === 'COMPANYWORKINGDAYS'
        && Array.isArray(workingDays) && workingDays.length > 0
        && this.countWorkingDaysInRange(cycleStart, cycleEnd, workingDays) > 0;

    if (!isWorkingDayBasis) {
        return Math.min(calendarDeductionDays || 0, perDayDivisor);
    }

    const toDate = (value) => {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    };
    const employedFrom = [toDate(cycleStart), toDate(doj), toDate(payrollStartsFrom)]
        .filter(Boolean)
        .reduce((latest, date) => (date > latest ? date : latest));
    const lastDay = toDate(lastWorkingDay);
    const employedTo = lastDay && lastDay < new Date(cycleEnd) ? lastDay : new Date(cycleEnd);

    if (employedFrom > employedTo) return perDayDivisor;
    const workedDays = this.countWorkingDaysInRange(employedFrom, employedTo, workingDays);
    return Math.min(Math.max(perDayDivisor - workedDays, 0), perDayDivisor);
};

exports.resolvePerDayDivisor = (cycleStart, cycleEnd, calendarDays, payrollSettings) => {
    if (payrollSettings?.calculateSalaryBasedOn === 'COMPANYWORKINGDAYS' && Array.isArray(payrollSettings?.selectWorkingDays) && payrollSettings.selectWorkingDays.length > 0) {
        const workingDaysCount = this.countWorkingDaysInRange(cycleStart, cycleEnd, payrollSettings.selectWorkingDays);
        if (workingDaysCount > 0) return workingDaysCount;
    }
    return calendarDays;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 330 * 60 * 1000;

// Cycle boundaries are UTC calendar days; a date of joining / last working day is an Indian
// calendar date that may have been stored as IST midnight (18:30 UTC the day before) or as
// UTC midnight — both read back as the same IST date here.
const utcDay = (date) => {
    const d = new Date(date);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};
const istDay = (date) => utcDay(new Date(new Date(date).getTime() + IST_OFFSET_MS));

// Days the employee is paid for in a part month (joiner / leaver), counted the same way as
// the per-day divisor (resolvePerDayDivisor): calendar days, or only the company's working
// weekdays under "Company working days" — so a weekend joining date is paid from the next
// working day. Public holidays are never excluded, so they count as paid under both.
// Joiner: joining date to cycle end; leaver: cycle start to last working day; both in the
// same month: joining date to last working day — all inclusive.
exports.resolvePartMonthDays = ({ cycleStart, cycleEnd, dateOfJoin, lastWorkingDay, payrollStartsFrom, payrollSettings }) => {
    const startDay = utcDay(cycleStart);
    const endDay = utcDay(cycleEnd);
    const calendarDays = Math.round((endDay - startDay) / MS_PER_DAY) + 1;
    // Same condition as resolvePerDayDivisor, so the paid days and the divisor share a basis.
    const workingDaysInCycle = payrollSettings?.calculateSalaryBasedOn === 'COMPANYWORKINGDAYS'
        ? this.countWorkingDaysInRange(cycleStart, cycleEnd, payrollSettings.selectWorkingDays)
        : 0;
    const isWorkingDaysBasis = workingDaysInCycle > 0;
    const daysInMonth = isWorkingDaysBasis ? workingDaysInCycle : calendarDays;

    let paidFrom = startDay;
    if (dateOfJoin) paidFrom = Math.max(paidFrom, istDay(dateOfJoin));
    if (payrollStartsFrom) paidFrom = Math.max(paidFrom, istDay(payrollStartsFrom));
    const paidTo = lastWorkingDay ? Math.min(endDay, istDay(lastWorkingDay)) : endDay;

    let eligibleDays = 0;
    if (paidFrom <= paidTo) {
        eligibleDays = isWorkingDaysBasis
            ? this.countWorkingDaysInRange(new Date(paidFrom), new Date(paidTo), payrollSettings.selectWorkingDays)
            : Math.round((paidTo - paidFrom) / MS_PER_DAY) + 1;
    }
    eligibleDays = Math.min(eligibleDays, daysInMonth);

    return { daysInMonth, eligibleDays, unpaidDays: daysInMonth - eligibleDays };
};

