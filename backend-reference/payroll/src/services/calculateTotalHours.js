exports.calculateTotalHours = (data) => {
    try {
        let { startTime, endTime } = data;
        if (!startTime || !endTime || !data) {
            return "N/A";
        }
        // Calculate the difference in milliseconds
        const start = new Date(startTime);
        const end = new Date(endTime);
        const differenceMs = end - start;

        // Calculate hours and minutes
        const differenceHours = Math.floor(differenceMs / (1000 * 60 * 60));
        const differenceMinutes = Math.floor((differenceMs % (1000 * 60 * 60)) / (1000 * 60));

        // Format the difference to display as total working hours
        const formattedDifference = `${differenceHours} hrs ${differenceMinutes} mnts`;

        return formattedDifference;
    } catch (error) {
        return "N/A";
    }
}