const corporateUser = require("../../../entities/corporateUser");
const { findCorporateUserByEmail } = require("../../corporateUser");

jest.mock("../../../entities/corporateUser", () => ({
  findOne: jest.fn(),
}));

describe("findCorporateUserByEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return user when found", async () => {
    const email = "test@example.com";
    const mockUser = { id: 1, email };

    corporateUser.findOne.mockResolvedValue(mockUser);

    const result = await findCorporateUserByEmail(email);

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: { email },
    });

    expect(result).toEqual(mockUser);
  });

  it("should throw 'Corporate user not found' when user does not exist", async () => {
    const email = "noone@example.com";

    corporateUser.findOne.mockResolvedValue(null);

    await expect(findCorporateUserByEmail(email)).rejects.toThrow(
      "Error fetching corporate user"
    );

    // ensure the original missing-user path was triggered
    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: { email },
    });
  });

  it("should throw 'Error fetching corporate user' when DB fails", async () => {
    const email = "broken@example.com";

    corporateUser.findOne.mockRejectedValue(new Error("DB crashed"));

    await expect(findCorporateUserByEmail(email)).rejects.toThrow(
      "Error fetching corporate user"
    );
  });

  it("should throw if email is undefined", async () => {
    corporateUser.findOne.mockResolvedValue(null);

    await expect(findCorporateUserByEmail()).rejects.toThrow(
      "Error fetching corporate user"
    );
  });
});
