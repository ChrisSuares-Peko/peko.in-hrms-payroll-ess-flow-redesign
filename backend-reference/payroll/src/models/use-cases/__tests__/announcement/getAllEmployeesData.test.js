const { getAllEmployeesData } = require('../../announcement');
const Employee = require('../../../entities/employee');

jest.mock('../../../entities/employee', () => ({
  find: jest.fn(),
}));

describe('getAllEmployeesData Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all eligible employees when no exclusions are provided', async () => {
    const userId = 'corporateUserId';
    const expectedEmployees = [
      { _id: 'emp1', personalInformation: { fullName: 'John Doe', email: 'john@example.com' }, employeeInformation: { workEmailId: 'john@work.com' } },
    ];

    Employee.find.mockResolvedValue(expectedEmployees);

    const result = await getAllEmployeesData(userId);

    expect(Employee.find).toHaveBeenCalledWith(
      {
        corporateUser: userId,
        isEmployeeDeleted: false,
        'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] },
        _id: { $nin: [] },
      },
      { 'personalInformation.fullName': 1, 'personalInformation.email': 1, 'employeeInformation.workEmailId': 1 }
    );
    expect(result).toEqual(expectedEmployees);
  });

  it('should return employees excluding the specified IDs', async () => {
    const userId = 'corporateUserId';
    const excludeEmployeeIds = ['emp1', 'emp2'];
    const expectedEmployees = [
      { _id: 'emp3', personalInformation: { fullName: 'Jane Doe', email: 'jane@example.com' }, employeeInformation: { workEmailId: 'jane@work.com' } },
    ];

    Employee.find.mockResolvedValue(expectedEmployees);

    const result = await getAllEmployeesData(userId, excludeEmployeeIds);

    expect(Employee.find).toHaveBeenCalledWith(
      {
        corporateUser: userId,
        isEmployeeDeleted: false,
        'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] },
        _id: { $nin: excludeEmployeeIds },
      },
      { 'personalInformation.fullName': 1, 'personalInformation.email': 1, 'employeeInformation.workEmailId': 1 }
    );
    expect(result).toEqual(expectedEmployees);
  });

  it('should return an empty array when no employees match', async () => {
    const userId = 'corporateUserId';

    Employee.find.mockResolvedValue([]);

    const result = await getAllEmployeesData(userId);

    expect(result).toEqual([]);
  });

  it('should throw an error if the find method throws an error', async () => {
    const userId = 'corporateUserId';

    Employee.find.mockRejectedValue(new Error('DB failure'));

    await expect(getAllEmployeesData(userId)).rejects.toThrow(
      'Error occurred while fetching employees. Please try again'
    );
  });
});
