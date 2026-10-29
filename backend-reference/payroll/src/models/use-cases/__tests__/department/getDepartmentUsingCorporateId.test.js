const { getDepartmentUsingCorporateId } = require('../../department');
const Department = require('../../../entities/department');

jest.mock('../../../entities/department', () => ({
  find: jest.fn(),
}));

describe('Department Use-Cases - Get Department Using Corporate ID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return departments for a given corporate user', async () => {
    const corporateUserID = 'corporateUserID';
    const expectedDepartments = [
      { departmentName: 'HR', departmentCode: 12345, description: 'HR Department' },
      { departmentName: 'IT', departmentCode: 67890, description: 'IT Department' }
    ];

    Department.find.mockResolvedValue(expectedDepartments);

    const result = await getDepartmentUsingCorporateId(corporateUserID);

    expect(Department.find).toHaveBeenCalledWith({ corporateUser: corporateUserID });
    expect(result).toEqual(expectedDepartments);
  });

  it('should return an error if the find method throws an error', async () => {
    const corporateUserID = 'corporateUserID';
    const expectedError = new Error('Database error');

    Department.find.mockRejectedValue(expectedError);

    const result = await getDepartmentUsingCorporateId(corporateUserID);

    expect(Department.find).toHaveBeenCalledWith({ corporateUser: corporateUserID });
    expect(result).toBe(expectedError);
  });
});
