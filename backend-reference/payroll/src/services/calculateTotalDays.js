exports.calculateDays = (data) => {
    try {
        let { days } = data;
        if (!days || !data) {
            return "N/A";
        }
        const trueDaysCount = Object.values(days).filter((day) => day === true).length;
        return trueDaysCount;
    } catch (error) {
        return "N/A";
    }
}