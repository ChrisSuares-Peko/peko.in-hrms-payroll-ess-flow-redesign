const { getEmployeeIds } = require('../../../use-cases/employee'); // Adjust the path accordingly
const Employee = require('../../../entities/employee'); // Adjust the path accordingly
const mongoose = require('mongoose');

jest.mock('../../../entities/employee');

describe('getEmployeeIds', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return employee IDs for a valid userId', async () => {
        const userId = new mongoose.Types.ObjectId();
        const mockEmployees = [
            { employeeInformation: { employeeId: 'E001' } },
            { employeeInformation: { employeeId: 'E002' } }
        ];

        const findMock = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockEmployees)
        });
        Employee.find.mockImplementation(findMock);

        const result = await getEmployeeIds(userId);

        expect(Employee.find).toHaveBeenCalledWith({
            corporateUser: userId,
            isEmployeeDeleted: false,
            'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] }
        });
        expect(findMock().select).toHaveBeenCalledWith('employeeInformation.employeeId');
        expect(result).toEqual(['E001', 'E002']);
    });

    it('should handle errors gracefully', async () => {
        const userId = new mongoose.Types.ObjectId();
        const mockError = new Error('Database error');

        console.log = jest.fn();
        const findMock = jest.fn().mockReturnValue({
            select: jest.fn().mockRejectedValue(mockError)
        });
        Employee.find.mockImplementation(findMock);

        const result = await getEmployeeIds(userId);

        expect(Employee.find).toHaveBeenCalledWith({
            corporateUser: userId,
            isEmployeeDeleted: false,
            'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] }
        });
        expect(result).toEqual(mockError);
    });
});
