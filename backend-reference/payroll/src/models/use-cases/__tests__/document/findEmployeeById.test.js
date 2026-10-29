const { findEmployeeById } = require('../../../use-cases/documents'); 
const Employee = require('../../../entities/employee'); 


jest.mock('../../../entities/employee');

describe('findEmployeeById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return employee details for a valid employeeId and userId', async () => {
        const employeeId = 'validEmployeeId';
        const userId = 'validUserId';

        const mockEmployeeDetails = {
            _id: employeeId,
            corporateUser: userId,
            name: 'John Doe',
            isEmployeeDeleted: false,
        };

        Employee.findOne.mockResolvedValue(mockEmployeeDetails);

        const result = await findEmployeeById(employeeId, userId);

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: userId,
            isEmployeeDeleted: false,
        });

        expect(result).toEqual(mockEmployeeDetails);
    });

    it('should return null if employee details are not found', async () => {
        const employeeId = 'invalidEmployeeId';
        const userId = 'validUserId';

        Employee.findOne.mockResolvedValue(null);

        const result = await findEmployeeById(employeeId, userId);

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: userId,
            isEmployeeDeleted: false,
        });

        expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
        const employeeId = 'employeeId';
        const userId = 'userId';

        const mockError = new Error('Database error');

        Employee.findOne.mockRejectedValue(mockError);

        const result = await findEmployeeById(employeeId, userId);

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: userId,
            isEmployeeDeleted: false,
        });

        expect(result).toEqual({ errors: mockError });
    });
});
