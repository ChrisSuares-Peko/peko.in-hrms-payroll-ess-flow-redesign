// tests/use-cases/findDepartmentByIdAndCorporateUser.test.js
const { findDepartmentByIdAndCorporateUser } = require('../../department');
const Department = require('../../../entities/department');

jest.mock('../../../entities/department', () => ({
  findOne: jest.fn(),
}));

describe('findDepartmentByIdAndCorporateUser Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find a department by ID and corporate user', async () => {
    const departmentId = 'departmentId';
    const corporateUserID = 'corporateUserID';
    const expectedDepartment = { _id: departmentId, corporateUser: corporateUserID };

    Department.findOne.mockResolvedValue(expectedDepartment);

    const result = await findDepartmentByIdAndCorporateUser(departmentId, corporateUserID);

    expect(Department.findOne).toHaveBeenCalledWith({
      _id: departmentId,
      corporateUser: corporateUserID
    });
    expect(result).toEqual(expectedDepartment);
  });

  it('should return an error if the findOne method throws an error', async () => {
    const departmentId = 'departmentId';
    const corporateUserID = 'corporateUserID';
    const expectedError = new Error('Database error');

    Department.findOne.mockRejectedValue(expectedError);

    const result = await findDepartmentByIdAndCorporateUser(departmentId, corporateUserID);

    expect(Department.findOne).toHaveBeenCalledWith({
      _id: departmentId,
      corporateUser: corporateUserID
    });
    expect(result).toBe(expectedError);
  });
});
