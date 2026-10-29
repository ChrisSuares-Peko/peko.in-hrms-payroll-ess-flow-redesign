const { fetchEmployeesForGenerateSalary } = require('../../../use-cases/employee');
const Employee = require('../../../entities/employee');
const mongoose = require('mongoose');

jest.mock('../../../entities/employee');

describe('fetchEmployeesForGenerateSalary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch employees for generating salary without employeeId', async () => {
        const corporateUserID = new mongoose.Types.ObjectId();
        const cycleStart = new Date('2023-01-01');
        const cycleEnd = new Date('2023-01-31');
        const mockEmployees = [
            { _id: new mongoose.Types.ObjectId(), fullName: 'John Doe', corporateUser: corporateUserID },
            { _id: new mongoose.Types.ObjectId(), fullName: 'Jane Doe', corporateUser: corporateUserID }
        ];

        Employee.find.mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockEmployees)
        });

        const result = await fetchEmployeesForGenerateSalary(corporateUserID, cycleStart, cycleEnd);

        expect(Employee.find).toHaveBeenCalledWith({
            corporateUser: corporateUserID,
            isEmployeeDeleted: false,
            'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'CONFIRMED', 'INPROBATION'] },
            'employeeInformation.dateOfJoin': { $lte: cycleEnd },
            '$or': [
                { 'offBoardingInformation.lastWorkingDay': { $exists: false } },
                { 'offBoardingInformation.lastWorkingDay': { $gte: cycleStart } }
            ]
        });
        expect(result).toEqual(mockEmployees);
    });

    it('should fetch employees for generating salary with employeeId', async () => {
        const corporateUserID = new mongoose.Types.ObjectId();
        const cycleStart = new Date('2023-01-01');
        const cycleEnd = new Date('2023-01-31');
        const employeeId = new mongoose.Types.ObjectId();
        const mockEmployees = [
            { _id: employeeId, fullName: 'John Doe', corporateUser: corporateUserID }
        ];

        Employee.find.mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockEmployees)
        });

        const result = await fetchEmployeesForGenerateSalary(corporateUserID, cycleStart, cycleEnd, employeeId);

        expect(Employee.find).toHaveBeenCalledWith({
            corporateUser: corporateUserID,
            isEmployeeDeleted: false,
            'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'CONFIRMED', 'INPROBATION'] },
            'employeeInformation.dateOfJoin': { $lte: cycleEnd },
            '$or': [
                { 'offBoardingInformation.lastWorkingDay': { $exists: false } },
                { 'offBoardingInformation.lastWorkingDay': { $gte: cycleStart } }
            ],
            _id: employeeId
        });
        expect(result).toEqual(mockEmployees);
    });

    it('should handle errors gracefully and return the error', async () => {
        const corporateUserID = new mongoose.Types.ObjectId();
        const cycleStart = new Date('2023-01-01');
        const cycleEnd = new Date('2023-01-31');
        const mockError = new Error('Database error');

        Employee.find.mockReturnValue({
            populate: jest.fn().mockRejectedValue(mockError)
        });
        console.log = jest.fn();

        const result = await fetchEmployeesForGenerateSalary(corporateUserID, cycleStart, cycleEnd);

        expect(Employee.find).toHaveBeenCalled();
        expect(result).toEqual(mockError);
    });
});
