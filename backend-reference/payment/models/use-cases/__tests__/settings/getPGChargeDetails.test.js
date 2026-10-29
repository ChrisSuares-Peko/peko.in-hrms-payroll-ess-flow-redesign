const setting = require("../../../entities/setting");
const { getPGChargeDetails } = require("../../settings");

jest.mock("../../../entities/setting", () => ({
  findOne: jest.fn()
}));

describe("getPGChargeDetails Service", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return matching PG charge details when dynamicId exists", async () => {
    const mockSetting = {
      name: "PG_Charges",
      details: [
        { key: "UPI", value: 1.2 },
        { key: "CARD", value: 2.0 }
      ]
    };

    setting.findOne.mockResolvedValue(mockSetting);

    const result = await getPGChargeDetails("CARD");

    expect(setting.findOne).toHaveBeenCalledWith({
      where: { name: "PG_Charges" }
    });

    expect(result).toEqual({ key: "CARD", value: 2.0 });
  });

  test("should return empty object when dynamicId does not match", async () => {
    const mockSetting = {
      name: "PG_Charges",
      details: [
        { key: "UPI", value: 1.2 }
      ]
    };

    setting.findOne.mockResolvedValue(mockSetting);

    const result = await getPGChargeDetails("NEFT");

    expect(result).toEqual({});
  });

  test("should return empty object when details array is empty", async () => {
    const mockSetting = {
      name: "PG_Charges",
      details: []
    };

    setting.findOne.mockResolvedValue(mockSetting);

    const result = await getPGChargeDetails("UPI");

    expect(result).toEqual({});
  });

  test("should return empty object when setting record has no details field", async () => {
    const mockSetting = {
      name: "PG_Charges"
      // no details key
    };

    setting.findOne.mockResolvedValue(mockSetting);

    const result = await getPGChargeDetails("UPI");

    expect(result).toEqual({});
  });

  test("should return empty object when setting is null", async () => {
    setting.findOne.mockResolvedValue(null);

    const result = await getPGChargeDetails("UPI");

    expect(result).toEqual({});
  });

  test("should throw error when DB query fails", async () => {
    setting.findOne.mockRejectedValue(new Error("DB ERROR"));

    await expect(getPGChargeDetails("UPI")).rejects.toThrow("DB ERROR");
  });

});
