const cloud_usageHistories = require('../../../../entities/pekoCloud/cloud_usageHistories');
const cloud_employees = require('../../../../entities/pekoCloud/cloud_employees');
const cloud_fleets = require('../../../../entities/pekoCloud/cloud_fleets');
const ErrorResponse = require('../../../../../utils/error-response');
const { updateUsageHistory } = require('../../cloud_fleetUsageHistories');
const sequelize = require('../../../../../configs/database/index');

jest.mock('../../../../entities/pekoCloud/cloud_usageHistories', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_employees', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_fleets', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../../../../configs/database/index', () => ({
  transaction: jest.fn().mockResolvedValue({
    commit: jest.fn(),
    rollback: jest.fn(),
  }),
}));

describe('updateUsageHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update usage history', async () => {
    const id = 1;
    const newData = { cloudEmployeeId: 2, cloudFleetId: 3 };

    const mockUsageHistory = { id: 1, cloudFleetId: 3 };
    const mockEmployee = { id: 2 };
    const mockFleet = { id: 3 };

    cloud_usageHistories.findOne.mockResolvedValue(mockUsageHistory);
    cloud_employees.findOne.mockResolvedValue(mockEmployee);
    cloud_fleets.findOne.mockResolvedValue(mockFleet);
    cloud_usageHistories.update.mockResolvedValue([1]);
    cloud_fleets.update.mockResolvedValue([1]);

    const result = await updateUsageHistory(id, newData);

    expect(cloud_usageHistories.findOne).toHaveBeenCalledWith({
      where: { id: id, usageCategory: "FLEET" },
    });

    expect(cloud_employees.findOne).toHaveBeenCalledWith({
      where: { id: newData.cloudEmployeeId },
    });

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({
      where: { id: newData.cloudFleetId },
    });

    expect(cloud_usageHistories.findOne).toHaveBeenCalledWith({
      where: { cloudFleetId: mockUsageHistory.cloudFleetId },
      order: [["createdAt", "DESC"]],
      limit: 1,
    });

    expect(cloud_usageHistories.update).toHaveBeenCalledWith(newData, {
      where: { id: id, usageCategory: "FLEET" },
      transaction: expect.any(Object),
    });

    expect(cloud_fleets.update).toHaveBeenCalledWith(
      { cloudEmployeeId: newData.cloudEmployeeId },
      { where: { id: mockUsageHistory.cloudFleetId }, transaction: expect.any(Object) }
    );

    expect(result).toEqual({ success: true, data: {} });
  });

  it('should return an error if usage history does not exist', async () => {
    const id = 1;
    const newData = {};

    cloud_usageHistories.findOne.mockResolvedValue(null);

    const result = await updateUsageHistory(id, newData);

    expect(cloud_usageHistories.findOne).toHaveBeenCalledWith({
      where: { id: id, usageCategory: "FLEET" },
    });

    expect(result).toEqual({
      success: false,
      error: "usage history is not existing with the given details",
    });
  });

  it('should return an error if employee does not exist', async () => {
    const id = 1;
    const newData = { cloudEmployeeId: 2 };

    const mockUsageHistory = { id: 1, cloudFleetId: 3 };

    cloud_usageHistories.findOne.mockResolvedValue(mockUsageHistory);
    cloud_employees.findOne.mockResolvedValue(null);

    const result = await updateUsageHistory(id, newData);

    expect(cloud_employees.findOne).toHaveBeenCalledWith({
      where: { id: newData.cloudEmployeeId },
    });

    expect(result).toEqual({
      success: false,
      error: "employee is not existing with the given details",
    });
  });

  it('should return an error if fleet does not exist', async () => {
    const id = 1;
    const newData = { cloudFleetId: 3 };

    const mockUsageHistory = { id: 1, cloudFleetId: 3 };

    cloud_usageHistories.findOne.mockResolvedValue(mockUsageHistory);
    cloud_fleets.findOne.mockResolvedValue(null);

    const result = await updateUsageHistory(id, newData);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({
      where: { id: newData.cloudFleetId },
    });

    expect(result).toEqual({
      success: false,
      error: "fleet is not existing with the given details",
    });
  });

  it('should handle update failure', async () => {
    const id = 1;
    const newData = { cloudEmployeeId: 2, cloudFleetId: 3 };

    const mockUsageHistory = { id: 1, cloudFleetId: 3 };
    const mockEmployee = { id: 2 };
    const mockFleet = { id: 3 };

    cloud_usageHistories.findOne.mockResolvedValue(mockUsageHistory);
    cloud_employees.findOne.mockResolvedValue(mockEmployee);
    cloud_fleets.findOne.mockResolvedValue(mockFleet);
    cloud_usageHistories.update.mockResolvedValue([0]);

    const result = await updateUsageHistory(id, newData);

    expect(result).toEqual({
      success: false,
      error: "something went wrong while updating the usage history",
    });
  });

  it('should rollback transaction on error', async () => {
    const id = 1;
    const newData = { cloudEmployeeId: 2, cloudFleetId: 3 };

    const mockUsageHistory = { id: 1, cloudFleetId: 3 };
    const mockEmployee = { id: 2 };
    const mockFleet = { id: 3 };

    // Mock transaction
    const mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    // Mock implementations
    sequelize.transaction.mockResolvedValue(mockTransaction);

    cloud_usageHistories.findOne.mockResolvedValue(mockUsageHistory);
    cloud_employees.findOne.mockResolvedValue(mockEmployee);
    cloud_fleets.findOne.mockResolvedValue(mockFleet);
    cloud_usageHistories.update.mockRejectedValue(new Error('Database error'));

    const result = await updateUsageHistory(id, newData);

    expect(sequelize.transaction).toHaveBeenCalled();

    // Check that rollback was called
    expect(mockTransaction.rollback).toHaveBeenCalled();

    expect(result).toEqual(new ErrorResponse('Something went wrong, please try again later.', 500));
  });
});
