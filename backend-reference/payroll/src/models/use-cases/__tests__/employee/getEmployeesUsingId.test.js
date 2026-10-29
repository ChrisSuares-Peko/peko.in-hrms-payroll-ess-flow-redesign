const { getEmployeesUsingId } = require('../../../use-cases/employee'); // Adjust the path accordingly
const Employee = require('../../../entities/employee'); // Adjust the path accordingly
const mongoose = require('mongoose');

jest.mock('../../../entities/employee');

describe('getEmployeesUsingId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an employee for a valid ID', async () => {
        const employeeId = new mongoose.Types.ObjectId();
        const mockEmployee = { _id: employeeId, fullName: 'John Doe' };

        Employee.findOne.mockResolvedValue(mockEmployee);

        const result = await getEmployeesUsingId(employeeId);

        expect(Employee.findOne).toHaveBeenCalledWith({ _id: employeeId });
        expect(result).toEqual(mockEmployee);
    });

    it('should handle errors gracefully', async () => {
        const employeeId = new mongoose.Types.ObjectId();
        const mockError = new Error('Database error');

        Employee.findOne.mockRejectedValue(mockError);

        const result = await getEmployeesUsingId(employeeId);

        expect(Employee.findOne).toHaveBeenCalledWith({ _id: employeeId });
        expect(result).toEqual(mockError);
    });
});
