const { getEmployees } = require('../../announcement');
const Employee = require('../../../entities/employee');

jest.mock('../../../entities/employee', () => ({
  find: jest.fn(),
}));

describe('getEmployees Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return active and on-leave employees for a given corporate user', async () => {
    const userId = 'corporateUserId';
    const expectedEmployees = [{ _id: 'employeeId', fullName: 'John Doe' }];

    Employee.find.mockResolvedValue(expectedEmployees);

    const result = await getEmployees(userId);

    expect(Employee.find).toHaveBeenCalledWith({
      corporateUser: userId,
      'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] },
      isEmployeeDeleted: false
    }, { _id: 1, 'personalInformation.fullName': 1 });
    expect(result).toEqual(expectedEmployees);
  });

  it('should throw an error if the find method throws an error', async () => {
    const userId = 'corporateUserId';
    const expectedError = new Error('Error occured while fetching employees. Please try again');

    Employee.find.mockRejectedValue(expectedError);

    await expect(getEmployees(userId)).rejects.toThrow('Error occured while fetching employees. Please try again');

    expect(Employee.find).toHaveBeenCalledWith({
      corporateUser: userId,
      'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] },
      isEmployeeDeleted: false
    }, { _id: 1, 'personalInformation.fullName': 1 });
  });
});
