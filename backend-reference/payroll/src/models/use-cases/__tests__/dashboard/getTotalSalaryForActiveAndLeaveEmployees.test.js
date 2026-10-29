const { getTotalSalaryForActiveAndLeaveEmployees } = require('../../../use-cases/dashBoard');
const Employee = require('../../../entities/employee');

jest.mock('../../../entities/employee');
jest.mock('../../../use-cases/salaryComponent', () => ({
    getEmployeeSalaryComponentForProcessSalary: jest.fn()
}));
jest.mock('../../../../services/increment', () => ({
    fetchAdjustedBasicPay: jest.fn()
}));

const { getEmployeeSalaryComponentForProcessSalary } = require('../../../use-cases/salaryComponent');
const { fetchAdjustedBasicPay } = require('../../../../services/increment');

describe('getTotalSalaryForActiveAndLeaveEmployees Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the total salary for active and leave employees', async () => {
        const params = { corporateUser: 'corporateUserID' };

        const mockEmployees = [
            { _id: 'emp1', employeeInformation: { dateOfJoin: new Date('2022-01-01') } },
            { _id: 'emp2', employeeInformation: { dateOfJoin: new Date('2021-06-15') } }
        ];

        Employee.find.mockReturnValue({
            select: jest.fn().mockResolvedValue(mockEmployees)
        });

        const mockComponentData1 = {
            salaryComponents: [
                { componentName: 'Basic Salary', calculatedAmount: 30000 },
                { componentName: 'HRA', calculatedAmount: 5000 }
            ],
            deductionComponents: [
                { deductionName: 'PF', calculatedAmount: 2000 }
            ]
        };

        const mockComponentData2 = {
            salaryComponents: [
                { componentName: 'Basic Salary', calculatedAmount: 40000 }
            ],
            deductionComponents: []
        };

        getEmployeeSalaryComponentForProcessSalary
            .mockResolvedValueOnce(mockComponentData1)
            .mockResolvedValueOnce(mockComponentData2);

        fetchAdjustedBasicPay
            .mockResolvedValueOnce(30000)
            .mockResolvedValueOnce(40000);

        const result = await getTotalSalaryForActiveAndLeaveEmployees(params);

        expect(Employee.find).toHaveBeenCalledWith({
            corporateUser: 'corporateUserID',
            "employeeInformation.employeeStatus": {
                $nin: ["SUSPENDED", "RESIGNED"],
            },
            isEmployeeDeleted: false
        });

        expect(result).toBe(73000);
    });

    it('should handle database errors', async () => {
        const params = { corporateUser: 'corporateUserID' };
        const mockError = new Error('Database error');

        Employee.find.mockReturnValue({
            select: jest.fn().mockRejectedValue(mockError)
        });

        await expect(getTotalSalaryForActiveAndLeaveEmployees(params)).rejects.toThrow('Database error');
    });
});
