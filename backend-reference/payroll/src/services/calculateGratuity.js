exports.calculateGratuity = (basicSalary, yearsWorked) => {
    const dailyWage = basicSalary / 30;
    const gratuity1to5Years = dailyWage * 21 * Math.min(5, yearsWorked);
    const gratuityOver5Years = dailyWage * 30 * Math.max(0, yearsWorked - 5);
    const twoYearsTotalSalary = basicSalary * 12 * 2;
    const totalGratuity = Math.min(gratuity1to5Years + gratuityOver5Years, twoYearsTotalSalary);

    return totalGratuity;
}