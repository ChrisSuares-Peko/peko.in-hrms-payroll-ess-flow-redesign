const moment = require("moment");
const { customLog } = require("./loggerHelper");

/**
 * Formats a given date string into a human-readable date format.
 * @param {string} dateString - A string representing a date (in a format supported by JavaScript Date).
 * @returns {string} - A formatted date string in the format: Month Day, Year (e.g., January 1, ${new Date().getUTCFullYear()}).
 *                   - Returns 'Invalid Date' if the input date string is not valid.
 */
exports.humanReadableDate = (dateString) => {
  const date = new Date(dateString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formattedDate = date.toLocaleDateString("en-US", options);
  return formattedDate;
};

const SAFE_DATE_FORMATS = [
  moment.ISO_8601,
  "YYYY-MM-DD",
  "YYYY-MM-DD HH:mm:ss",
  "DD-MM-YYYY",
  "DD/MM/YYYY",
  "DD-MMM-YYYY",
  "DD MMM YYYY",
];

exports.safeParseDate = (value, logTraceId = null) => {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    const fromEpoch = new Date(value);
    return Number.isNaN(fromEpoch.getTime()) ? null : fromEpoch;
  }
  const parsed = moment(value, SAFE_DATE_FORMATS, true);
  if (!parsed.isValid()) {
    customLog(logTraceId, "info", {
      action: "garage:safeParseDate:unparseable",
      value: String(value),
    });
    return null;
  }
  return parsed.toDate();
};
