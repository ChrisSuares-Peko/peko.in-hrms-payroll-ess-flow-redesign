const { findEmployeeDetails } = require('../../../use-cases/documents'); 
const Employee = require('../../../entities/employee'); 

// Mock the Employee model
jest.mock('../../../entities/employee');

describe('findEmployeeDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return employee details for a valid employeeId and corporateUserId', async () => {
        const employeeId = 'validEmployeeId';
        const corporateUserId = 'validCorporateUserId';

        const mockEmployeeDetails = {
            _id: employeeId,
            corporateUser: corporateUserId,
            name: 'John Doe',
            isEmployeeDeleted: false
        };

        Employee.findOne.mockResolvedValue(mockEmployeeDetails);

        const result = await findEmployeeDetails(employeeId, corporateUserId);

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: corporateUserId,
            isEmployeeDeleted: false
        });

        expect(result).toEqual(mockEmployeeDetails);
    });

    it('should return null if employee details are not found', async () => {
        const employeeId = 'invalidEmployeeId';
        const corporateUserId = 'validCorporateUserId';

        Employee.findOne.mockResolvedValue(null);

        const result = await findEmployeeDetails(employeeId, corporateUserId);

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: corporateUserId,
            isEmployeeDeleted: false
        });

        expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
        const employeeId = 'employeeId';
        const corporateUserId = 'corporateUserId';

        const mockError = new Error('Database error');

        Employee.findOne.mockRejectedValue(mockError);

        const result = await findEmployeeDetails(employeeId, corporateUserId);

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: corporateUserId,
            isEmployeeDeleted: false
        });

        expect(result).toEqual({ errors: mockError });
    });
});
