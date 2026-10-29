const { findDepartment } = require('../../department');
const Department = require('../../../entities/department');

jest.mock('../../../entities/department', () => ({
  findOne: jest.fn(),
}));

describe('findDepartment Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find and return an existing department', async () => {
    const corporateUserID = 'corporateUserID';
    const departmentName = 'HR';
    const departmentCode = 12345;

    const mockDepartment = {
      _id: '123',
      departmentName: 'HR',
      corporateUser: 'corporateUserID',
      departmentCode: 12345,
      description: 'HR Department'
    };

    Department.findOne.mockResolvedValue(mockDepartment);

    const result = await findDepartment(corporateUserID, departmentName, departmentCode);

    expect(Department.findOne).toHaveBeenCalledWith({
      corporateUser: corporateUserID,
      $or: [
        { departmentName },
        { departmentCode }
      ]
    });
    expect(result).toEqual(mockDepartment);
  });

  it('should return an error if the findOne method throws an error', async () => {
    const corporateUserID = 'corporateUserID';
    const departmentName = 'HR';
    const departmentCode = 12345;

    const errorMessage = 'Something went wrong';
    Department.findOne.mockRejectedValue(new Error(errorMessage));

    const result = await findDepartment(corporateUserID, departmentName, departmentCode);

    expect(Department.findOne).toHaveBeenCalledWith({
      corporateUser: corporateUserID,
      $or: [
        { departmentName },
        { departmentCode }
      ]
    });
    expect(result).toEqual(new Error(errorMessage));
  });
});
