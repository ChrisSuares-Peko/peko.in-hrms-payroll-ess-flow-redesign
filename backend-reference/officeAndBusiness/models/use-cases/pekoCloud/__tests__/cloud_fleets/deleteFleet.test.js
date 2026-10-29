const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const cloud_usageHistories = require("../../../../entities/pekoCloud/cloud_usageHistories");
const cloud_maintenances = require("../../../../entities/pekoCloud/cloud_maintenances");
const { deleteFleet } = require("../../cloud_fleets");
const sequelize = require('../../../../../configs/database/index');
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_employees.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_fleets.js', () => ({
  belongsTo: jest.fn(),
  findOne: jest.fn(),
  destroy: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_documents.js', () => ({
  belongsTo: jest.fn(),
  destroy: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_usageHistories.js', () => ({
  belongsTo: jest.fn(),
  destroy: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_maintenances.js', () => ({
  belongsTo: jest.fn(),
  destroy: jest.fn(),
}));
jest.mock('../../../../../configs/database/index', () => ({
  define: jest.fn(),
  transaction: jest.fn().mockResolvedValue({
    commit: jest.fn(),
    rollback: jest.fn(),
  }),
}));

describe('deleteFleet Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully delete the fleet and related records', async () => {
    const id = 1;
    const category = "FLEET";

    cloud_fleets.findOne.mockResolvedValue({ id });
    cloud_documents.destroy.mockResolvedValue(1);
    cloud_usageHistories.destroy.mockResolvedValue(1);
    cloud_maintenances.destroy.mockResolvedValue(1);
    cloud_fleets.destroy.mockResolvedValue(1);

    const result = await deleteFleet(id);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_documents.destroy).toHaveBeenCalledWith({
      where: { cloudFleetId: id, documentCategory: category },
      transaction: expect.any(Object),
    });
    expect(cloud_usageHistories.destroy).toHaveBeenCalledWith({
      where: { cloudFleetId: id, usageCategory: category },
      transaction: expect.any(Object),
    });
    expect(cloud_maintenances.destroy).toHaveBeenCalledWith({
      where: { cloudFleetId: id, maintenanceCategory: category },
      transaction: expect.any(Object),
    });
    expect(cloud_fleets.destroy).toHaveBeenCalledWith({
      where: { id: id },
      transaction: expect.any(Object),
    });
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual({ success: true, data: {} });
  });

  it('should return error if fleet does not exist', async () => {
    const id = 1;

    cloud_fleets.findOne.mockResolvedValue(null); // Fleet does not exist

    const result = await deleteFleet(id);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual({
      success: false,
      error: "fleet is not existing with the given details",
    });
  });

  it('should handle failure in deleting documents', async () => {
    const id = 1;
    const category = "FLEET";

    cloud_fleets.findOne.mockResolvedValue({ id });
    cloud_documents.destroy.mockRejectedValue(new Error("Failed to delete documents"));

    const result = await deleteFleet(id);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_documents.destroy).toHaveBeenCalledWith({
      where: { cloudFleetId: id, documentCategory: category },
      transaction: expect.any(Object),
    });
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });

  it('should handle failure in deleting usage histories', async () => {
    const id = 1;
    const category = "FLEET";

    cloud_fleets.findOne.mockResolvedValue({ id });
    cloud_documents.destroy.mockResolvedValue(1);
    cloud_usageHistories.destroy.mockRejectedValue(new Error("Failed to delete usage histories"));

    const result = await deleteFleet(id);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_documents.destroy).toHaveBeenCalledWith({
      where: { cloudFleetId: id, documentCategory: category },
      transaction: expect.any(Object),
    });
    expect(cloud_usageHistories.destroy).toHaveBeenCalledWith({
      where: { cloudFleetId: id, usageCategory: category },
      transaction: expect.any(Object),
    });
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });

  it('should handle failure in deleting maintenances', async () => {
    const id = 1;
    const category = "FLEET";

    cloud_fleets.findOne.mockResolvedValue({ id });
    cloud_documents.destroy.mockResolvedValue(1);
    cloud_maintenances.destroy.mockRejectedValue(new Error("Failed to delete maintenances"));
    cloud_usageHistories.destroy.mockResolvedValue();

    const result = await deleteFleet(id);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_documents.destroy).toHaveBeenCalledWith({
      where: { cloudFleetId: id, documentCategory: category },
      transaction: expect.any(Object),
    });
    expect(cloud_maintenances.destroy).toHaveBeenCalledWith({
        where: { cloudFleetId: id, maintenanceCategory: category },
        transaction: expect.any(Object),
    });
    expect(cloud_usageHistories.destroy).not.toHaveBeenCalled();
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });

  it('should handle failure in deleting the fleet', async () => {
    const id = 1;
    const category = "FLEET";

    cloud_fleets.findOne.mockResolvedValue({ id });
    cloud_documents.destroy.mockResolvedValue(1);
    cloud_usageHistories.destroy.mockResolvedValue(1);
    cloud_maintenances.destroy.mockResolvedValue(1);
    cloud_fleets.destroy.mockResolvedValue(0); // Indicates that no rows were deleted

    const result = await deleteFleet(id);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_documents.destroy).toHaveBeenCalledWith({
      where: { cloudFleetId: id, documentCategory: category },
      transaction: expect.any(Object),
    });
    expect(cloud_usageHistories.destroy).toHaveBeenCalledWith({
      where: { cloudFleetId: id, usageCategory: category },
      transaction: expect.any(Object),
    });
    expect(cloud_maintenances.destroy).toHaveBeenCalledWith({
      where: { cloudFleetId: id, maintenanceCategory: category },
      transaction: expect.any(Object),
    });
    expect(cloud_fleets.destroy).toHaveBeenCalledWith({
      where: { id: id },
      transaction: expect.any(Object),
    });
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual({
      success: false,
      error: "fleet is not able to delete try again",
    });
  });

  it('should handle transaction rollback in case of failure', async () => {
    const id = 1;
    const category = "FLEET";

    // Mock transaction
    const mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    // Mock implementations
    sequelize.transaction.mockResolvedValue(mockTransaction);
    cloud_fleets.findOne.mockResolvedValue({ id });
    cloud_documents.destroy.mockResolvedValue(1);
    cloud_usageHistories.destroy.mockResolvedValue(1);
    cloud_maintenances.destroy.mockResolvedValue(1);
    cloud_fleets.destroy.mockRejectedValue(new Error("Failed to delete fleet"));

    const result = await deleteFleet(id);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_documents.destroy).toHaveBeenCalledWith({
      where: { cloudFleetId: id, documentCategory: category },
      transaction: mockTransaction,
    });
    expect(cloud_usageHistories.destroy).toHaveBeenCalledWith({
      where: { cloudFleetId: id, usageCategory: category },
      transaction: mockTransaction,
    });
    expect(cloud_maintenances.destroy).toHaveBeenCalledWith({
      where: { cloudFleetId: id, maintenanceCategory: category },
      transaction: mockTransaction,
    });
    expect(cloud_fleets.destroy).toHaveBeenCalledWith({
      where: { id },
      transaction: mockTransaction,
    });
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });
});
