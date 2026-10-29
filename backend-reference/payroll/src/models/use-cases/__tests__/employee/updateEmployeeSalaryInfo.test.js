const { updateEmployeeSalaryInfo } = require('../../../use-cases/employee'); // Adjust the path accordingly
const Employee = require('../../../entities/employee'); // Adjust the path accordingly

jest.mock('../../../entities/employee');

describe('updateEmployeeSalaryInfo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the employee salary information successfully', async () => {
        const id = 'employeeId1';
        const corporateUserId = 'corporateUserId1';
        const salaryData = {
            basicPay: 50000,
            travelAllowances: 5000,
            homeAllowances: 8000,
            medicalAllowances: 3000,
            otherAllowances: 2000,
            other: 1000
        };
        const mockUpdatedEmployee = {
            _id: id,
            corporateUser: corporateUserId,
            salaryInformation: salaryData
        };

        Employee.findOneAndUpdate.mockResolvedValue(mockUpdatedEmployee);

        const result = await updateEmployeeSalaryInfo(id, corporateUserId, salaryData);

        expect(Employee.findOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: id,
                corporateUser: corporateUserId,
                isEmployeeDeleted: false
            },
            {
                $set: {
                    "salaryInformation.basicPay": salaryData.basicPay,
                    "salaryInformation.travelAllowances": salaryData.travelAllowances,
                    "salaryInformation.homeAllowances": salaryData.homeAllowances,
                    "salaryInformation.medicalAllowances": salaryData.medicalAllowances,
                    "salaryInformation.otherAllowances": salaryData.otherAllowances,
                    "salaryInformation.other": salaryData.other
                }
            },
            { new: true }
        );
        expect(result).toEqual(mockUpdatedEmployee);
    });

    it('should handle errors gracefully', async () => {
        const id = 'employeeId1';
        const corporateUserId = 'corporateUserId1';
        const salaryData = {
            basicPay: 50000,
            travelAllowances: 5000,
            homeAllowances: 8000,
            medicalAllowances: 3000,
            otherAllowances: 2000,
            other: 1000
        };
        const mockError = new Error('Database error');

        console.log = jest.fn();
        Employee.findOneAndUpdate.mockRejectedValue(mockError);

        const result = await updateEmployeeSalaryInfo(id, corporateUserId, salaryData);

        expect(Employee.findOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: id,
                corporateUser: corporateUserId,
                isEmployeeDeleted: false
            },
            {
                $set: {
                    "salaryInformation.basicPay": salaryData.basicPay,
                    "salaryInformation.travelAllowances": salaryData.travelAllowances,
                    "salaryInformation.homeAllowances": salaryData.homeAllowances,
                    "salaryInformation.medicalAllowances": salaryData.medicalAllowances,
                    "salaryInformation.otherAllowances": salaryData.otherAllowances,
                    "salaryInformation.other": salaryData.other
                }
            },
            { new: true }
        );
        expect(result).toEqual(mockError);
    });
});
