const { findExistingDepartment } = require('../../department');
const Department = require('../../../entities/department');

jest.mock('../../../entities/department', () => ({
  findOne: jest.fn(),
}));

describe('Department Use-Cases - findExistingDepartment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find and return an existing department', async () => {
    const corporateUserID = 'corporateUserID';
    const editData = { departmentName: 'HR' };
    const departmentId = 'departmentId';
    const expectedDepartment = { _id: departmentId, departmentName: 'HR' };

    Department.findOne.mockResolvedValue(expectedDepartment);

    const result = await findExistingDepartment(corporateUserID, editData, departmentId);

    expect(Department.findOne).toHaveBeenCalledWith({
      corporateUser: corporateUserID,
      _id: { $ne: departmentId },
      $or: [{ departmentName: editData.departmentName }],
    });
    expect(result).toEqual(expectedDepartment);
  });

  it('should return null if editData has no name or code', async () => {
    const corporateUserID = 'corporateUserID';
    const editData = {};
    const departmentId = 'departmentId';

    const result = await findExistingDepartment(corporateUserID, editData, departmentId);

    expect(Department.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should throw an error if the findOne method throws an error', async () => {
    const corporateUserID = 'corporateUserID';
    const editData = { departmentName: 'HR' };
    const departmentId = 'departmentId';
    const expectedError = new Error('Database error');

    Department.findOne.mockRejectedValue(expectedError);

    await expect(findExistingDepartment(corporateUserID, editData, departmentId)).rejects.toThrow('Database error');
  });
});
