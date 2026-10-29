const cloud_usageHistories = require('../../../../entities/pekoCloud/cloud_usageHistories');
const cloud_employees = require('../../../../entities/pekoCloud/cloud_employees');
const ErrorResponse = require('../../../../../utils/error-response');
const { findLatestUsageHistory } = require('../../cloud_fleetUsageHistories');

jest.mock('../../../../entities/pekoCloud/cloud_usageHistories', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_employees', () => ({
  belongsTo: jest.fn(),
}));

describe('findLatestUsageHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully retrieve the latest usage history with employee data', async () => {
    const id = 1;
    const mockUsageHistory = {
      id: 1,
      usageCategory: 'Maintenance',
      assignDate: new Date(),
      returnDate: new Date(),
      returnStatus: 'Returned',
      remarks: 'Test remark',
      cloudEmployee: {
        id: 1,
        employeeName: 'John Doe',
        employeeEmail: 'john.doe@example.com',
        department: 'Engineering',
        joiningDate: new Date(),
        employeeID: 'E12345',
      },
    };

    cloud_usageHistories.findOne.mockResolvedValue(mockUsageHistory);

    const result = await findLatestUsageHistory(id);

    expect(cloud_usageHistories.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_employees,
          attributes: [
            "id",
            "employeeName",
            "employeeEmail",
            "department",
            "joiningDate",
            "employeeID",
          ],
        },
      ],
      where: {
        cloudFleetId: id,
      },
      order: [["createdAt", "DESC"]],
      limit: 1,
    });
    expect(result).toEqual({ success: true, data: mockUsageHistory });
  });

  it('should return an empty data response if no usage history is found', async () => {
    const id = 1;

    cloud_usageHistories.findOne.mockResolvedValue(null);

    const result = await findLatestUsageHistory(id);

    expect(cloud_usageHistories.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_employees,
          attributes: [
            "id",
            "employeeName",
            "employeeEmail",
            "department",
            "joiningDate",
            "employeeID",
          ],
        },
      ],
      where: {
        cloudFleetId: id,
      },
      order: [["createdAt", "DESC"]],
      limit: 1,
    });
    expect(result).toEqual({ success: true, data: null });
  });

  it('should handle database errors gracefully', async () => {
    const id = 1;

    cloud_usageHistories.findOne.mockRejectedValue(new Error('Database error'));

    const result = await findLatestUsageHistory(id);

    expect(cloud_usageHistories.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_employees,
          attributes: [
            "id",
            "employeeName",
            "employeeEmail",
            "department",
            "joiningDate",
            "employeeID",
          ],
        },
      ],
      where: {
        cloudFleetId: id,
      },
      order: [["createdAt", "DESC"]],
      limit: 1,
    });
    expect(result).toEqual(new ErrorResponse('Something went wrong, please try again later.', 500));
  });
});
