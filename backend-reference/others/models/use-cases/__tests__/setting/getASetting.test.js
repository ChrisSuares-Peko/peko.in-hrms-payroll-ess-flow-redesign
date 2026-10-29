const Setting = require('../../../entities/setting');
const { getASetting } = require('../../setting');

jest.mock('../../../entities/setting', () => ({
  findOne: jest.fn(),
}));

describe("getASetting", () => {

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should return setting details when setting exists", async () => {
    const mockSetting = { details: { theme: "dark" } };

    Setting.findOne.mockResolvedValue(mockSetting);

    const result = await getASetting("theme");

    expect(Setting.findOne).toHaveBeenCalledWith({
      where: { name: "theme" }
    });

    expect(result).toEqual({ theme: "dark" });
  });

  it("should return false when the setting is not found", async () => {
    Setting.findOne.mockResolvedValue(null);

    const result = await getASetting("unknown-setting");

    expect(result).toBe(false);
  });

  it("should return primitive values (string, number, boolean)", async () => {
    Setting.findOne.mockResolvedValue({ details: "enabled" });

    const result = await getASetting("mode");

    expect(result).toBe("enabled");
  });

  it("should throw error when database call fails", async () => {
    const error = new Error("DB failed");
    Setting.findOne.mockRejectedValue(error);

    await expect(getASetting("crash-test")).rejects.toThrow("DB failed");
  });

});
