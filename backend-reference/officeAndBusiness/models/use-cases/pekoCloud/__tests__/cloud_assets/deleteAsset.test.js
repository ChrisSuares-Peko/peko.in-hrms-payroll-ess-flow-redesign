const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const cloud_usageHistories = require("../../../../entities/pekoCloud/cloud_usageHistories");
const { deleteAsset } = require("../../cloud_assets");
const sequelize = require('../../../../../configs/database/index');
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_assets.js', () => ({
  belongsTo: jest.fn(),
  findOne: jest.fn(),
  destroy: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_chequeBooks.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_documents.js', () => ({
  belongsTo: jest.fn(),
  destroy: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_employees.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_fleets.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_maintenances.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_owners.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_softwares.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_subscriptions.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_usageHistories.js', () => ({
  belongsTo: jest.fn(),
  destroy: jest.fn(),
}));

jest.mock('../../../../../utils/sortHandle.js', () => ({
    handleSortFields: jest.fn(),
}));

jest.mock('../../../../../configs/database/index', () => ({
  define: jest.fn(),
  transaction: jest.fn().mockResolvedValue({
    commit: jest.fn(),
    rollback: jest.fn(),
  }),
}));

describe('deleteAsset Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully delete the asset and related records', async () => {
    const id = 1;
    const category = "ASSET";

    cloud_assets.findOne.mockResolvedValue({ id });
    cloud_documents.destroy.mockResolvedValue(1);
    cloud_usageHistories.destroy.mockResolvedValue(1);
    cloud_assets.destroy.mockResolvedValue(1);

    const result = await deleteAsset(id);

    expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_documents.destroy).toHaveBeenCalledWith({
      where: { cloudAssetId: id, documentCategory: category },
      transaction: expect.any(Object),
    });
    expect(cloud_usageHistories.destroy).toHaveBeenCalledWith({
      where: { cloudAssetId: id, usageCategory: category },
      transaction: expect.any(Object),
    });
    expect(cloud_assets.destroy).toHaveBeenCalledWith({
      where: { id: id },
      transaction: expect.any(Object),
    });
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual({ success: true, data: {} });
  });

  it('should return error if asset does not exist', async () => {
    const id = 1;

    cloud_assets.findOne.mockResolvedValue(null); // Asset does not exist

    const result = await deleteAsset(id);

    expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual({
      success: false,
      error: "asset is not existing with the given details",
    });
  });

  it('should handle failure in deleting documents', async () => {
    const id = 1;
    const category = "ASSET";

    cloud_assets.findOne.mockResolvedValue({ id });
    cloud_documents.destroy.mockRejectedValue(new Error("Failed to delete documents"));

    const result = await deleteAsset(id);

    expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_documents.destroy).toHaveBeenCalledWith({
      where: { cloudAssetId: id, documentCategory: category },
      transaction: expect.any(Object),
    });
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });

  it('should handle failure in deleting usage histories', async () => {
    const id = 1;
    const category = "ASSET";

    cloud_assets.findOne.mockResolvedValue({ id });
    cloud_documents.destroy.mockResolvedValue(1);
    cloud_usageHistories.destroy.mockRejectedValue(new Error("Failed to delete usage histories"));

    const result = await deleteAsset(id);

    expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_documents.destroy).toHaveBeenCalledWith({
      where: { cloudAssetId: id, documentCategory: category },
      transaction: expect.any(Object),
    });
    expect(cloud_usageHistories.destroy).toHaveBeenCalledWith({
      where: { cloudAssetId: id, usageCategory: category },
      transaction: expect.any(Object),
    });
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });

  it('should handle failure in deleting the asset', async () => {
    const id = 1;
    const category = "ASSET";

    cloud_assets.findOne.mockResolvedValue({ id });
    cloud_documents.destroy.mockResolvedValue(1);
    cloud_usageHistories.destroy.mockResolvedValue(1);
    cloud_assets.destroy.mockResolvedValue(0); // Indicates that no rows were deleted

    const result = await deleteAsset(id);

    expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_documents.destroy).toHaveBeenCalledWith({
      where: { cloudAssetId: id, documentCategory: category },
      transaction: expect.any(Object),
    });
    expect(cloud_usageHistories.destroy).toHaveBeenCalledWith({
      where: { cloudAssetId: id, usageCategory: category },
      transaction: expect.any(Object),
    });
    expect(cloud_assets.destroy).toHaveBeenCalledWith({
      where: { id: id },
      transaction: expect.any(Object),
    });
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual({
      success: false,
      error: "asset is not able to delete try again",
    });
  });

  it('should handle transaction rollback in case of failure', async () => {
    const id = 1;
    const category = "ASSET";

    // Mock transaction
    const mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    // Mock implementations
    sequelize.transaction.mockResolvedValue(mockTransaction);
    cloud_assets.findOne.mockResolvedValue({ id });
    cloud_documents.destroy.mockResolvedValue(1);
    cloud_usageHistories.destroy.mockResolvedValue(1);
    cloud_assets.destroy.mockRejectedValue(new Error("Failed to delete asset"));

    const result = await deleteAsset(id);

    expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_documents.destroy).toHaveBeenCalledWith({
      where: { cloudAssetId: id, documentCategory: category },
      transaction: mockTransaction,
    });
    expect(cloud_usageHistories.destroy).toHaveBeenCalledWith({
      where: { cloudAssetId: id, usageCategory: category },
      transaction: mockTransaction,
    });
    expect(cloud_assets.destroy).toHaveBeenCalledWith({
      where: { id },
      transaction: mockTransaction,
    });
    expect(sequelize.transaction).toHaveBeenCalled();

    // Check that rollback was called
    expect(mockTransaction.rollback).toHaveBeenCalled();

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });
});
