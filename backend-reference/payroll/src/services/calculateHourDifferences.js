exports.calculateHourDifference = async (schedule) => {
    const [startTime, endTime] = schedule.split(' - ');

    const startDate = new Date(`01/01/2024 ${startTime}`);
    const endDate = new Date(`01/01/2024 ${endTime}`);

    const timeDifference = endDate - startDate;

    const hourDifference = timeDifference / (1000 * 60 * 60);

    return hourDifference;
}