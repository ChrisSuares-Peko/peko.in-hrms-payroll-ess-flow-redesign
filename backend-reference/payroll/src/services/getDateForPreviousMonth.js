exports.getDateForPreviousMonth = (day) => {
    const currentDate = new Date();

    currentDate.setMonth(currentDate.getMonth() - 1);
    currentDate.setDate(day);

    if (currentDate.getDate() !== day) {
        currentDate.setDate(0); // Set to the last day of the previous month
    }
    currentDate.setHours(0, 0, 0, 0);

    return currentDate;
}