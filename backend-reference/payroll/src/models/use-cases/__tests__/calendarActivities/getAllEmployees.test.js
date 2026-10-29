const { getAllEmployees } = require('../../../use-cases/calendarActivities'); // Adjust the path accordingly
const Employee = require('../../../entities/employee'); // Adjust the path accordingly
const mongoose = require('mongoose'); // Import mongoose

jest.mock('../../../entities/employee');

describe('getAllEmployees', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all employees for a valid userId', async () => {
        const userId = 'validUserId';
        const mockEmployees = [
            {
                _id: new mongoose.Types.ObjectId(),
                fullName: 'John Doe',
                personalEmail: 'john.doe@example.com',
                employeeInformation: {
                    status: 'ACTIVE'
                }
            },
            {
                _id: new mongoose.Types.ObjectId(),
                fullName: 'Jane Smith',
                personalEmail: 'jane.smith@example.com',
                employeeInformation: {
                    status: 'LEAVE'
                }
            }
        ];

        Employee.find.mockResolvedValue(mockEmployees);

        const result = await getAllEmployees(userId);

        expect(Employee.find).toHaveBeenCalledWith({
            corporateUser: userId,
            isEmployeeDeleted: false,
            'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] }
        }, 'fullName personalEmail');

        expect(result).toEqual(mockEmployees);
    });

    it('should return an empty array if no employees are found', async () => {
        const userId = 'validUserId';

        Employee.find.mockResolvedValue([]);

        const result = await getAllEmployees(userId);

        expect(Employee.find).toHaveBeenCalledWith({
            corporateUser: userId,
            isEmployeeDeleted: false,
            'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] }
        }, 'fullName personalEmail');

        expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
        const userId = 'validUserId';
        const mockError = new Error('Database error');

        Employee.find.mockRejectedValue(mockError);

        const result = await getAllEmployees(userId);

        expect(Employee.find).toHaveBeenCalledWith({
            corporateUser: userId,
            isEmployeeDeleted: false,
            'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] }
        }, 'fullName personalEmail');

        expect(result).toEqual(mockError);
    });
});
