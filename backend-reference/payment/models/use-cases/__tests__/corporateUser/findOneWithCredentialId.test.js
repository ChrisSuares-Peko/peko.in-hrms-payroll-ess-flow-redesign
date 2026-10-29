const corporateUser = require("../../../entities/corporateUser");
const { findOneWithCredentialId } = require("../../corporateUser");

jest.mock("../../../entities/corporateUser", () => ({
  findOne: jest.fn(),
}));

describe("findOneWithCredentialId Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return user when a matching credentialId exists", async () => {
    const mockUser = { id: 1, credentialId: "ABC123" };

    corporateUser.findOne.mockResolvedValue(mockUser);

    const result = await findOneWithCredentialId("ABC123");

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: { credentialId: "ABC123" }
    });

    expect(result).toEqual(mockUser);
  });

  test("should return null when no user is found", async () => {
    corporateUser.findOne.mockResolvedValue(null);

    const result = await findOneWithCredentialId("NOT_FOUND");

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: { credentialId: "NOT_FOUND" }
    });

    expect(result).toBeNull();
  });

  test("should throw error when DB query fails", async () => {
    corporateUser.findOne.mockRejectedValue(new Error("DB error"));

    await expect(findOneWithCredentialId("ERR123")).rejects.toThrow("DB error");

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: { credentialId: "ERR123" }
    });
  });

});
