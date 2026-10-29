const { getActiveEmployees } = require('../../../use-cases/employee'); // Adjust the path accordingly
const Employee = require('../../../entities/employee'); // Adjust the path accordingly
const mongoose = require('mongoose');

jest.mock('../../../entities/employee');

describe('getActiveEmployees', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    it('should return active employees for a valid userId', async () => {
        const userId = new mongoose.Types.ObjectId();
        const mockEmployees = [
            { _id: new mongoose.Types.ObjectId(), fullName: 'John Doe' },
            { _id: new mongoose.Types.ObjectId(), fullName: 'Jane Doe' }
        ];

        Employee.find.mockResolvedValue(mockEmployees);

        const result = await getActiveEmployees(userId);

        expect(Employee.find).toHaveBeenCalledWith({
            corporateUser: userId,
            "employeeInformation.employeeStatus": {
                $nin: ["SUSPENDED", "RESIGNED"],
            },
        });
        expect(result).toEqual(mockEmployees);
    });

    it('should handle errors gracefully', async () => {
        const userId = new mongoose.Types.ObjectId();
        const mockError = new Error('Database error');

        Employee.find.mockRejectedValue(mockError);

        const result = await getActiveEmployees(userId);

        expect(Employee.find).toHaveBeenCalledWith({
            corporateUser: userId,
            "employeeInformation.employeeStatus": {
                $nin: ["SUSPENDED", "RESIGNED"],
            },
        });
        expect(result).toEqual(mockError);
    });
});
