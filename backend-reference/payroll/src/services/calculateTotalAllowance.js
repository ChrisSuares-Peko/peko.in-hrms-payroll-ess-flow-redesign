exports.calculateTotalAllowance = (salaryDetails) => {
    // Ensure that the input is an object
    try {
        if (typeof salaryDetails !== 'object' || salaryDetails === null) {
            throw new Error('Invalid input. Please provide a valid salary details object.');
        }

        // Extract individual components from the salaryDetails object
        const {

            travelAllowances,
            homeAllowances,
            medicalAllowances,
            otherAllowances,
            other,
        } = salaryDetails;

        // Calculate the total salary by summing up all components
        const totalAllowance = travelAllowances + homeAllowances + medicalAllowances + otherAllowances + other;

        return totalAllowance;

    } catch (error) {
        return 'N/A'
    }

}