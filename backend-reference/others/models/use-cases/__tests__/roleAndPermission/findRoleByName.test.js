const { findRoleByName } = require("../../../use-cases/roleAndPermissions");
const roleAndPermissions = require("../../../entities/roleAndPermissions");

jest.mock("../../../entities/roleAndPermissions", () => ({
  findOne: jest.fn(),
}));

describe("findRoleByName", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return role details when a valid role name is provided", async () => {
    const mockRole = { id: "role123", roleName: "admin" };

    // Mocking the response of the findOne method
    roleAndPermissions.findOne.mockResolvedValue(mockRole);

    const params = { userType: "admin" };
    const result = await findRoleByName(params);

    expect(roleAndPermissions.findOne).toHaveBeenCalledWith({
      where: { roleName: "admin" },
      attributes: ["id", "roleName"],
      raw: true,
    });
    expect(result).toEqual(mockRole);
  });

  it("should return null if no role is found", async () => {
    // Mocking a case where no role is found
    roleAndPermissions.findOne.mockResolvedValue(null);

    const params = { userType: "nonexistentRole" };
    const result = await findRoleByName(params);

    expect(roleAndPermissions.findOne).toHaveBeenCalledWith({
      where: { roleName: "nonexistentRole" },
      attributes: ["id", "roleName"],
      raw: true,
    });
    expect(result).toBeNull();
  });

  it("should throw an error if there is a database error", async () => {
    // Simulating a database error
    roleAndPermissions.findOne.mockRejectedValue(new Error("Database Error"));

    const params = { userType: "admin" };
    
    await expect(findRoleByName(params)).rejects.toThrow("Database Error");
  });
});
