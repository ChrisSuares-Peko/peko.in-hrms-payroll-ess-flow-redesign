const { findpartnerAndPermissionDetails } = require("../../../use-cases/systemUser");
const systemUser = require("../../../entities/systemUser");
const credential = require("../../../entities/credential");
const partnerPermission = require("../../../entities/partnerPermission");

jest.mock("../../../entities/systemUser", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../../entities/credential", () => ({}));

jest.mock("../../../entities/partnerPermission", () => ({
  findOne: jest.fn(),
}));

describe("findpartnerAndPermissionDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return partner details and permissions when data is found", async () => {
    const mockParams = { id: "testId" };

    const mockUserData = {
      username: "testUser",
      role: "partner",
      name: "Test Name",
      createdAt: "2024-02-12T10:00:00Z",
      passwordProtection: true,
      partnerId: "partner123",
    };

    const mockPermissionData = {
      permissions: ["READ", "WRITE"],
    };

    systemUser.findOne.mockResolvedValue(mockUserData);
    partnerPermission.findOne.mockResolvedValue(mockPermissionData);

    const result = await findpartnerAndPermissionDetails(mockParams);

    expect(systemUser.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: credential,
          where: { id: "testId" },
          attributes: ["username", "role", "name", "createdAt", "passwordProtection", "partnerId"],
        },
      ],
      raw: true,
      nest: true,
    });

    expect(partnerPermission.findOne).toHaveBeenCalledWith({ where: { registeredBy: "testId" } });

    expect(result).toEqual({
      ...mockUserData,
      permissions: mockPermissionData,
    });
  });

  it("should return user data with null permissions if no partner permissions exist", async () => {
    const mockParams = { id: "testId" };

    const mockUserData = {
      username: "testUser",
      role: "partner",
      name: "Test Name",
      createdAt: "2024-02-12T10:00:00Z",
      passwordProtection: true,
      partnerId: "partner123",
    };

    systemUser.findOne.mockResolvedValue(mockUserData);
    partnerPermission.findOne.mockResolvedValue(null);

    const result = await findpartnerAndPermissionDetails(mockParams);

    expect(result).toEqual({
      ...mockUserData,
      permissions: null,
    });
  });

  it("should return { permissions: null } if system user is not found", async () => {
    const mockParams = { id: "testId" };

    systemUser.findOne.mockResolvedValue(null);

    const result = await findpartnerAndPermissionDetails(mockParams);

    expect(result).toEqual({ permissions: null });
});


  it("should throw an error if an exception occurs", async () => {
    const mockParams = { id: "testId" };

    systemUser.findOne.mockRejectedValue(new Error("Database error"));

    await expect(findpartnerAndPermissionDetails(mockParams)).rejects.toEqual({
      message: "Something went wrong",
    });
  });
});
