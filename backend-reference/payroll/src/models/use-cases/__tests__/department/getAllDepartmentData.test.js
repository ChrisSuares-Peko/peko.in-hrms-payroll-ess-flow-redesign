const { getAllDepartmentData } = require('../../department');
const Department = require('../../../entities/department');

jest.mock('../../../entities/department', () => ({
  find: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exec: jest.fn(),
  countDocuments: jest.fn(),
}));

describe('Department Use-Cases - Get All Department Data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return department data and total count', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      page: '1',
      limit: '10',
      searchText: ''
    };
    const expectedDepartments = [
      { departmentName: 'HR', departmentCode: 12345, description: 'HR Department' },
      { departmentName: 'IT', departmentCode: 67890, description: 'IT Department' }
    ];
    const expectedTotalCount = 2;

    Department.exec.mockResolvedValue(expectedDepartments);
    Department.countDocuments.mockResolvedValue(expectedTotalCount);

    const result = await getAllDepartmentData(params);

    expect(Department.find).toHaveBeenCalledWith({
      corporateUser: params.corporateUserID,
      $or: [
        { departmentName: { $regex: `^${params.searchText}`, $options: 'i' } }
      ]
    });
    expect(Department.skip).toHaveBeenCalledWith(0);
    expect(Department.limit).toHaveBeenCalledWith(10);
    expect(Department.exec).toHaveBeenCalled();
    expect(Department.countDocuments).toHaveBeenCalledWith({
      corporateUser: params.corporateUserID,
      $or: [
        { departmentName: { $regex: `^${params.searchText}`, $options: 'i' } }
      ]
    });
    expect(result).toEqual({
      totalCount: expectedTotalCount,
      departmentData: expectedDepartments
    });
  });

  it('should return an error if the find method throws an error', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      page: '1',
      limit: '10',
      searchText: ''
    };
    const expectedError = new Error('Database error');

    Department.exec.mockRejectedValue(expectedError);

    const result = await getAllDepartmentData(params);

    expect(Department.find).toHaveBeenCalledWith({
      corporateUser: params.corporateUserID,
      $or: [
        { departmentName: { $regex: `^${params.searchText}`, $options: 'i' } }
      ]
    });
    expect(Department.skip).toHaveBeenCalledWith(0);
    expect(Department.limit).toHaveBeenCalledWith(10);
    expect(Department.exec).toHaveBeenCalled();
    expect(result).toBe(expectedError);
  });

  it('should return an error if the countDocuments method throws an error', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      page: '1',
      limit: '10',
      searchText: ''
    };
    const expectedError = new Error('Count error');

    Department.exec.mockResolvedValue([]);
    Department.countDocuments.mockRejectedValue(expectedError);

    const result = await getAllDepartmentData(params);

    expect(Department.find).toHaveBeenCalledWith({
      corporateUser: params.corporateUserID,
      $or: [
        { departmentName: { $regex: `^${params.searchText}`, $options: 'i' } }
      ]
    });
    expect(Department.skip).toHaveBeenCalledWith(0);
    expect(Department.limit).toHaveBeenCalledWith(10);
    expect(Department.exec).toHaveBeenCalled();
    expect(Department.countDocuments).toHaveBeenCalledWith({
      corporateUser: params.corporateUserID,
      $or: [
        { departmentName: { $regex: `^${params.searchText}`, $options: 'i' } }
      ]
    });
    expect(result).toBe(expectedError);
  });
});
