const cloud_usageHistories = require('../../../../entities/pekoCloud/cloud_usageHistories');
const cloud_fleets = require('../../../../entities/pekoCloud/cloud_fleets');
const ErrorResponse = require('../../../../../utils/error-response');
const { deleteUsageHistory } = require('../../cloud_fleetUsageHistories');
const sequelize = require('../../../../../configs/database/index');

jest.mock('../../../../entities/pekoCloud/cloud_usageHistories', () => ({
  findOne: jest.fn(),
  destroy: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_employees.js', () => ({
  belongsTo: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_fleets', () => ({
  update: jest.fn(),
}));

jest.mock('../../../../../configs/database/index', () => ({
  transaction: jest.fn().mockResolvedValue({
    commit: jest.fn(),
    rollback: jest.fn(),
  }),
}));

describe('deleteUsageHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully delete usage history', async () => {
    const id = 1;

    const mockUsageHistory = { id: 1, cloudFleetId: 2 };
    const mockLatestUsage = { id: 1 };

    cloud_usageHistories.findOne
      .mockResolvedValueOnce(mockUsageHistory) // Mock the first findOne call
      .mockResolvedValueOnce(mockLatestUsage); // Mock the second findOne call
    cloud_usageHistories.destroy.mockResolvedValue(1); // Simulate one row being deleted
    cloud_fleets.update.mockResolvedValue([1]);

    const result = await deleteUsageHistory(id);

    expect(cloud_usageHistories.findOne).toHaveBeenCalledWith({
      where: { id: id, usageCategory: "FLEET" },
    });

    expect(cloud_usageHistories.findOne).toHaveBeenCalledWith({
      where: { cloudFleetId: mockUsageHistory.cloudFleetId },
      order: [["createdAt", "DESC"]],
      limit: 1,
    });

    expect(cloud_fleets.update).toHaveBeenCalledWith(
      { cloudEmployeeId: null },
      { where: { id: mockUsageHistory.cloudFleetId }, transaction: expect.any(Object) }
    );

    expect(cloud_usageHistories.destroy).toHaveBeenCalledWith({
      where: { id: id, usageCategory: "FLEET" },
      transaction: expect.any(Object),
    });

    expect(result).toEqual({ success: true, data: {} });
  });

  it('should return an error if usage history does not exist', async () => {
    const id = 1;

    cloud_usageHistories.findOne.mockResolvedValue(null);

    const result = await deleteUsageHistory(id);

    expect(cloud_usageHistories.findOne).toHaveBeenCalledWith({
      where: { id: id, usageCategory: "FLEET" },
    });

    expect(result).toEqual({
      success: false,
      error: "usage history is not existing with the given details",
    });
  });

  it('should handle delete failure', async () => {
    const id = 1;

    const mockUsageHistory = { id: 1, cloudFleetId: 2 };
    const mockLatestUsage = { id: 1 };

    cloud_usageHistories.findOne
      .mockResolvedValue(mockUsageHistory)
      .mockResolvedValueOnce(mockLatestUsage);
    cloud_usageHistories.destroy.mockResolvedValue(0); // Simulate no rows deleted

    const result = await deleteUsageHistory(id);

    expect(result).toEqual({
      success: false,
      error: "something went wrong while deleting the usage history",
    });
  });

  it('should rollback transaction on error', async () => {
    const id = 1;

    const mockUsageHistory = { id: 1, cloudFleetId: 2 };
    const mockLatestUsage = { id: 1 };

    const mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    sequelize.transaction.mockResolvedValue(mockTransaction);

    cloud_usageHistories.findOne
      .mockResolvedValue(mockUsageHistory)
      .mockResolvedValueOnce(mockLatestUsage);
    cloud_usageHistories.destroy.mockRejectedValue(new Error('Database error'));

    const result = await deleteUsageHistory(id);

    expect(sequelize.transaction).toHaveBeenCalled();

    expect(mockTransaction.rollback).toHaveBeenCalled();

    expect(result).toEqual(new ErrorResponse('Something went wrong, please try again later.', 500));
  });
});
