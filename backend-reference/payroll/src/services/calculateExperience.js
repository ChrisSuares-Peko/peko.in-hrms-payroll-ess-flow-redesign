exports.calculateExperience = (fromDate, toDate) => {
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);

    const timeDiff = toDateObj - fromDateObj;

    const yearsDiff = timeDiff / (1000 * 60 * 60 * 24 * 365.25);

    const roundedYears = Math.round(yearsDiff * 100) / 100;

    return parseInt(roundedYears);
}