const setting = require("../../../entities/setting");
const { getBotBuilderValues } = require("../../settings");

jest.mock("../../../entities/setting", () => ({
  findOne: jest.fn()
}));

describe("getBotBuilderValues Service", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return bot builder settings when found", async () => {
    const mockSetting = { id: 1, name: "flowBuilder", config: { x: 1 } };

    setting.findOne.mockResolvedValue(mockSetting);

    const result = await getBotBuilderValues();

    expect(setting.findOne).toHaveBeenCalledWith({
      where: { name: "flowBuilder" }
    });

    expect(result).toEqual(mockSetting);
  });

  test("should return null when bot builder settings not found", async () => {
    setting.findOne.mockResolvedValue(null);

    const result = await getBotBuilderValues();

    expect(setting.findOne).toHaveBeenCalledWith({
      where: { name: "flowBuilder" }
    });

    expect(result).toBeNull();
  });

  test("should throw an error when DB fails", async () => {
    setting.findOne.mockRejectedValue(new Error("DB ERROR"));

    await expect(getBotBuilderValues()).rejects.toThrow("DB ERROR");

    expect(setting.findOne).toHaveBeenCalledWith({
      where: { name: "flowBuilder" }
    });
  });

});
