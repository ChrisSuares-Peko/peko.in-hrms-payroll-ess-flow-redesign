exports.calculateTotalSalary = (salaryDetails) => {
    // Ensure that the input is an object
    try {
        if (typeof salaryDetails !== "object" || salaryDetails === null) {
            throw new Error("Invalid input. Please provide a valid salary details object.");
        }

        // Extract individual components from the salaryDetails object
        const { basicPay, travelAllowances, homeAllowances, medicalAllowances, otherAllowances, other } = salaryDetails;

        // Calculate the total salary by summing up all components
        const totalSalary = basicPay + travelAllowances + homeAllowances + medicalAllowances + otherAllowances + other;

        return totalSalary;
    } catch (error) {
        return "N/A";
    }
}

