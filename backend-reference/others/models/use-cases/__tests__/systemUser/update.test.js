const systemUser = require("../../../entities/systemUser");
const credential = require("../../../entities/credential");
const { update } = require("../../../use-cases/systemUser");
const sequelize = require("../../../../configs/database/index");

jest.mock("../../../entities/systemUser", () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../../../entities/credential", () => ({
  update: jest.fn(),
}));



describe("update", () => {
  let transaction;

  beforeEach(() => {
    jest.clearAllMocks();
    transaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    sequelize.transaction.mockResolvedValue(transaction);
  });

  it("should update systemUser and credential successfully", async () => {
    const mockParams = { id: "USER123" };
    const mockData = { name: "Updated User" };
    const mockUser = { credentialId: "USER123" };

    systemUser.findOne.mockResolvedValue(mockUser);
    systemUser.update.mockResolvedValue([1]); // 1 row updated
    credential.update.mockResolvedValue([1]); // 1 row updated

    const result = await update(mockParams, mockData);

    expect(systemUser.findOne).toHaveBeenCalledWith({
      where: { credentialId: undefined },
      transaction,
    });

    expect(systemUser.update).toHaveBeenCalledWith(mockData, {
      where: { 'credentialId': undefined},
      transaction,
    });

    expect(credential.update).toHaveBeenCalledWith(mockData, {
      where: { "credentialId": undefined,},
      transaction,
    });

    expect(transaction.commit).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("should throw an error if the user is not found", async () => {
    const mockParams = { id: "UNKNOWN_USER" };
    systemUser.findOne.mockResolvedValue(null);

    await expect(update(mockParams, {})).rejects.toThrow("User not found");

    expect(transaction.rollback).toHaveBeenCalled();
  });

  it("should throw an error if the user exists but has no credentialId", async () => {
    const mockParams = { id: "USER123" };
    const mockUser = { credentialId: null };

    systemUser.findOne.mockResolvedValue(mockUser);

    await expect(update(mockParams, {})).rejects.toThrow("Something went wrong.");

    expect(transaction.rollback).toHaveBeenCalled();
  });

  it("should throw an error if systemUser update fails", async () => {
    const mockParams = { id: "USER123" };
    const mockData = { name: "Updated User" };
    const mockUser = { credentialId: "USER123" };

    systemUser.findOne.mockResolvedValue(mockUser);
    systemUser.update.mockResolvedValue([0]); // Update failed
    credential.update.mockResolvedValue([1]);

    await expect(update(mockParams, mockData)).rejects.toThrow("Something went wrong while updating");

    expect(transaction.rollback).toHaveBeenCalled();
  });

  it("should throw an error if credential update fails", async () => {
    const mockParams = { id: "USER123" };
    const mockData = { name: "Updated User" };
    const mockUser = { credentialId: "USER123" };

    systemUser.findOne.mockResolvedValue(mockUser);
    systemUser.update.mockResolvedValue([1]);
    credential.update.mockResolvedValue([0]); // Update failed

    await expect(update(mockParams, mockData)).rejects.toThrow("Something went wrong while updating");

    expect(transaction.rollback).toHaveBeenCalled();
  });

  it("should rollback transaction if an error occurs", async () => {
    const mockParams = { id: "USER123" };
    systemUser.findOne.mockRejectedValue(new Error("Database error"));

    await expect(update(mockParams, {})).rejects.toThrow("Database error");

    expect(transaction.rollback).toHaveBeenCalled();
  });
});
