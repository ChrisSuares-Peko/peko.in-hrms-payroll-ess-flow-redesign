const moment = require("moment");

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// The Indian calendar day a timestamp falls on (an order at 2 am IST is still the previous day in UTC).
const istDay = value => new Date(new Date(value).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

const pad = value => String(value).padStart(2, "0");

const istParts = now => {
    const shifted = new Date(now.getTime() + IST_OFFSET_MS);
    return {
        year: shifted.getUTCFullYear(),
        month: pad(shifted.getUTCMonth() + 1),
        day: pad(shifted.getUTCDate()),
    };
};

const istDayRange = (now = new Date()) => {
    const { year, month, day } = istParts(now);
    return {
        from: `${year}-${month}-${day} 00:00:00`,
        to: `${year}-${month}-${day} 23:59:59`,
    };
};

const istMonthToDateRange = (now = new Date()) => {
    const { year, month, day } = istParts(now);
    return {
        from: `${year}-${month}-01 00:00:00`,
        to: `${year}-${month}-${day} 23:59:59`,
    };
};

const dayOf = value =>
    value instanceof Date ? istDay(value) : String(value).slice(0, 10);

const dayBoundedRange = (from, to) => ({
    from: `${dayOf(from)} 00:00:00`,
    to: `${dayOf(to)} 23:59:59`,
});

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// A plain date is a calendar day already; a timestamp is read as the IST day it falls on.
const istDayLabel = value => {
    if (!value) return "";
    if (DATE_ONLY.test(value)) return moment(value, "YYYY-MM-DD").format("DD MMM YYYY");
    return moment(value).utcOffset("+05:30").format("DD MMM YYYY");
};

module.exports = { IST_OFFSET_MS, istDay, istDayRange, istMonthToDateRange, dayBoundedRange, istDayLabel };
