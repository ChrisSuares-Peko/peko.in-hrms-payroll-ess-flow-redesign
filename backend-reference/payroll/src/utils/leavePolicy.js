// Utility to get fiscal year start (April 1st)
exports.getFiscalYearStart = (date = new Date()) => {
  const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return new Date(year, 3, 1); // April 1st
};

// Utility to get number of months elapsed in fiscal year
exports.getMonthsElapsedInFiscalYear = (date = new Date()) => {
  const fiscalStart = exports.getFiscalYearStart(date);
  return (
    (date.getFullYear() - fiscalStart.getFullYear()) * 12 +
    (date.getMonth() - fiscalStart.getMonth()) + 1
  );
};
