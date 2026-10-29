const { getAllEmployees } = require('../../announcement');
const Employee = require('../../../entities/employee');

jest.mock('../../../entities/employee', () => ({
  find: jest.fn(),
}));

describe('getAllEmployees Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all active employees for a given corporate user', async () => {
    const userId = 'corporateUserId';
    const expectedEmployees = [{ _id: 'employeeId', fullName: 'John Doe', personalEmail: 'john@example.com' }];

    Employee.find.mockResolvedValue(expectedEmployees);

    const result = await getAllEmployees(userId);

    expect(Employee.find).toHaveBeenCalledWith({
      corporateUser: userId,
      isEmployeeDeleted: false,
      'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] }
    }, { 'personalInformation.fullName': 1, 'personalInformation.email': 1 });
    expect(result).toEqual(expectedEmployees);
  });

  it('should throw an error if the find method throws an error', async () => {
    const userId = 'corporateUserId';
    const expectedError = new Error('Error occured while fetching employees. Please try again');

    Employee.find.mockRejectedValue(expectedError);

    await expect(getAllEmployees(userId)).rejects.toThrow('Error occured while fetching employees. Please try again');

    expect(Employee.find).toHaveBeenCalledWith({
      corporateUser: userId,
      isEmployeeDeleted: false,
      'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] }
    }, { 'personalInformation.fullName': 1, 'personalInformation.email': 1 });
  });
});
