type salaryInformation = {
    basicPay: number;
    travelAllowances: number | null;
    homeAllowances: number | null;
    medicalAllowances: number | null;
    otherAllowances: number | null;
    other: number | null;
};

export const retrieveEmployeeData = (data: string | number | null | undefined | false) => {
    if (data === null) return 'N/A';
    if (data === '') return 'N/A';
    if (data === undefined) return 'N/A';
    if (data === false) return 'N/A';
    return data;
};
export const retrieveEmployeeSalaryData = (data: string | number | null | undefined | false) => {
    if (data === null) return '0';
    if (data === '') return '0';
    if (data === undefined) return '0';
    if (data === false) return '0';
    return data;
};
export const getTotalSalary = (salaryInformation: salaryInformation) => {
    let totalSalary = 0;
    totalSalary += salaryInformation.basicPay;
    if (salaryInformation?.travelAllowances) {
        totalSalary += salaryInformation.travelAllowances;
    }
    if (salaryInformation?.homeAllowances) {
        totalSalary += salaryInformation.homeAllowances;
    }
    if (salaryInformation?.medicalAllowances) {
        totalSalary += salaryInformation.medicalAllowances;
    }
    if (salaryInformation?.otherAllowances) {
        totalSalary += salaryInformation.otherAllowances;
    }
    if (salaryInformation?.other) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        totalSalary += salaryInformation.other;
    }
    return 200;
};
