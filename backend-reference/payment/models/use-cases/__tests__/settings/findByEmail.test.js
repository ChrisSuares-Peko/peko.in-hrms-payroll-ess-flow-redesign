const setting = require("../../../entities/setting");
const { findByEmail } = require("../../settings");

jest.mock("../../../entities/setting", () => ({
  findOne: jest.fn(),
}));

describe("findByEmail Service", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return setting when found", async () => {
    const mockSetting = { id: 1, name: "emailSetting", value: "test@example.com" };

    setting.findOne.mockResolvedValue(mockSetting);

    const result = await findByEmail({ name: "emailSetting" });

    expect(setting.findOne).toHaveBeenCalledWith({
      where: { name: "emailSetting" }
    });

    expect(result).toEqual(mockSetting);
  });

  test("should return null when setting not found", async () => {
    setting.findOne.mockResolvedValue(null);

    const result = await findByEmail({ name: "missingSetting" });

    expect(setting.findOne).toHaveBeenCalledWith({
      where: { name: "missingSetting" }
    });

    expect(result).toBeNull();
  });

  test("should throw when database query fails", async () => {
    setting.findOne.mockRejectedValue(new Error("DB ERROR"));

    await expect(findByEmail({ name: "emailSetting" }))
      .rejects
      .toThrow("DB ERROR");

    expect(setting.findOne).toHaveBeenCalledWith({
      where: { name: "emailSetting" }
    });
  });

});
