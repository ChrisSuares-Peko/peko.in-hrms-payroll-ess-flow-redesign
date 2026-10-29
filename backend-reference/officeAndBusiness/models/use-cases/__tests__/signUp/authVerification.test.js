const corporateUser = require("../../../entities/corporateUser");
const { authVerification } = require("../../signUp");
const { authenticator } = require("otplib");

jest.mock("../../../entities/corporateUser", () => ({
  findOne: jest.fn(),
}));

jest.mock("otplib", () => ({
  authenticator: {
    check: jest.fn(),
  },
}));

describe("authVerification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return false if user is not found", async () => {
    corporateUser.findOne.mockResolvedValue(null);

    const result = await authVerification(1001, "123456");

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: { credentialId: 1001 },
    });
    expect(result).toBe(false);
  });

  it("should return false if totpSecret is missing", async () => {
    corporateUser.findOne.mockResolvedValue({
      credentialId: 2002,
      totpSecret: null,
    });

    const result = await authVerification(2002, "654321");

    expect(result).toBe(false);
  });

  it("should return { valid: true } when authenticator.check returns true", async () => {
    corporateUser.findOne.mockResolvedValue({
      credentialId: 3003,
      totpSecret: "REDACTED",
    });

    authenticator.check.mockReturnValue(true);

    const result = await authVerification(3003, "111111");

    expect(authenticator.check).toHaveBeenCalledWith("111111", "SECRET123");
    expect(result).toEqual({ valid: true });
  });

  it("should return false when authenticator.check returns false", async () => {
    corporateUser.findOne.mockResolvedValue({
      credentialId: 4004,
      totpSecret: "REDACTED",
    });

    authenticator.check.mockReturnValue(false);

    const result = await authVerification(4004, "222222");

    expect(result).toBe(false);
  });
});
