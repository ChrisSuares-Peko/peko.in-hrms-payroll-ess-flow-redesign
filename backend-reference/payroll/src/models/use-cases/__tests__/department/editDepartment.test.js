const { editDepartment } = require('../../department');
const Department = require('../../../entities/department');

jest.mock('../../../entities/department', () => ({
  updateOne: jest.fn(),
}));

describe('Department Use-Cases - editDepartment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the department and return the updated data', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      departmentId: 'departmentId',
      editData: {
        departmentName: 'HR',
        departmentCode: 12345,
        description: 'HR Department',
      },
    };
    const expectedUpdateResult = { n: 1, nModified: 1, ok: 1 };

    Department.updateOne.mockResolvedValue(expectedUpdateResult);

    const result = await editDepartment(params);

    expect(Department.updateOne).toHaveBeenCalledWith({
      _id: params.departmentId,
      corporateUser: params.corporateUserID,
    }, params.editData);
    expect(result).toEqual(expectedUpdateResult);
  });

  it('should return an error if the updateOne method throws an error', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      departmentId: 'departmentId',
      editData: {
        departmentName: 'HR',
        departmentCode: 12345,
        description: 'HR Department',
      },
    };
    const expectedError = new Error('Database error');

    Department.updateOne.mockRejectedValue(expectedError);

    const result = await editDepartment(params);

    expect(Department.updateOne).toHaveBeenCalledWith({
      _id: params.departmentId,
      corporateUser: params.corporateUserID,
    }, params.editData);
    expect(result).toBe(expectedError);
  });
});
