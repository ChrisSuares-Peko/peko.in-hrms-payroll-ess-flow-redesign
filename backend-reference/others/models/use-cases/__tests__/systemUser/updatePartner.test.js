const { updatePartner } = require("../../../use-cases/systemUser");
const credential = require("../../../entities/credential");
const partnerPermission = require("../../../entities/partnerPermission");
const systemUser = require("../../../entities/systemUser");
const sequelize = require("../../../../configs/database/index");

jest.mock("../../../entities/credential", () => ({
  update: jest.fn(),
}));

jest.mock("../../../entities/partnerPermission", () => ({
  update: jest.fn(),
}));

jest.mock("../../../entities/systemUser", () => ({
  update: jest.fn(),
  findOne: jest.fn(),
}));

describe("updatePartner", () => {
  let mockTransaction, mockPartnerDetails, mockExistingUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    sequelize.transaction = jest.fn(() => Promise.resolve(mockTransaction));

    mockPartnerDetails = {
      params: { id: "partner123" },
      userDetails: { username: "updatedUser" },
      permissions: ["READ", "WRITE"],
    };

    mockExistingUser = {
      credentialId: "partner123",
    };
  });

  it("should update a partner successfully", async () => {
    systemUser.findOne.mockResolvedValue(mockExistingUser);
    systemUser.update.mockResolvedValue([1]);
    credential.update.mockResolvedValue([1]);
    partnerPermission.update.mockResolvedValue([1]);

    const result = await updatePartner(mockPartnerDetails);

    expect(systemUser.findOne).toHaveBeenCalledWith({
      where: { credentialId: "partner123" },
      transaction: mockTransaction,
    });

    expect(systemUser.update).toHaveBeenCalledWith(
      { username: "updatedUser" },
      { where: { credentialId: "partner123" }, transaction: mockTransaction }
    );

    expect(credential.update).toHaveBeenCalledWith(
      { username: "updatedUser" },
      { where: { id: "partner123" }, transaction: mockTransaction }
    );

    expect(partnerPermission.update).toHaveBeenCalledWith(
      { permissions: ["READ", "WRITE"] },
      { where: { registeredBy: "partner123" }, transaction: mockTransaction }
    );

    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("should throw an error if user is not found", async () => {
    systemUser.findOne.mockResolvedValue(null);

    await expect(updatePartner(mockPartnerDetails)).rejects.toThrow("User not found");

    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it("should throw an error if credentialId is missing", async () => {
    systemUser.findOne.mockResolvedValue({ credentialId: null });

    await expect(updatePartner(mockPartnerDetails)).rejects.toThrow("Something went wrong.");

    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it("should rollback the transaction if any update fails", async () => {
    systemUser.findOne.mockResolvedValue(mockExistingUser);
    systemUser.update.mockResolvedValue([0]); // Simulate failure
    credential.update.mockResolvedValue([1]);
    partnerPermission.update.mockResolvedValue([1]);

    await expect(updatePartner(mockPartnerDetails)).rejects.toThrow("Something went wrong while updating");

    expect(mockTransaction.rollback).toHaveBeenCalled();
  });
});
