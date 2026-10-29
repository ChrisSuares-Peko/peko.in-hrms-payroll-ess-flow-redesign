// tests/use-cases/deleteDepartment.test.js
const { deleteDepartment } = require('../../department');
const Department = require('../../../entities/department');

jest.mock('../../../entities/department', () => ({
  findOneAndDelete: jest.fn(),
}));

describe('deleteDepartment Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a department by ID and corporate user', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      departmentId: 'departmentId'
    };
    const expectedDeletedDepartment = { _id: 'departmentId', corporateUser: 'corporateUserID' };

    Department.findOneAndDelete.mockResolvedValue(expectedDeletedDepartment);

    const result = await deleteDepartment(params);

    expect(Department.findOneAndDelete).toHaveBeenCalledWith({
      _id: params.departmentId,
      corporateUser: params.corporateUserID
    });
    expect(result).toEqual(expectedDeletedDepartment);
  });

  it('should return an error if the findOneAndDelete method throws an error', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      departmentId: 'departmentId'
    };
    const expectedError = new Error('Database error');

    Department.findOneAndDelete.mockRejectedValue(expectedError);

    const result = await deleteDepartment(params);

    expect(Department.findOneAndDelete).toHaveBeenCalledWith({
      _id: params.departmentId,
      corporateUser: params.corporateUserID
    });
    expect(result).toBe(expectedError);
  });
});
