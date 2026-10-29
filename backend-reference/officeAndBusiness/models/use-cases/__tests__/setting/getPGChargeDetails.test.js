const setting = require("../../../entities/setting");
const { getPGChargeDetails } = require("../../setting");

jest.mock("../../../entities/setting", () => ({
  findOne: jest.fn(),
}));

describe("getPGChargeDetails", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return matching charge details when key exists", async () => {
    setting.findOne.mockResolvedValue({
      details: [
        { key: "UPI", value: 1.2 },
        { key: "CARD", value: 2.5 },
      ],
    });

    const result = await getPGChargeDetails("CARD");

    expect(setting.findOne).toHaveBeenCalledWith({
      where: { name: "PG_Charges" },
    });

    expect(result).toEqual({ key: "CARD", value: 2.5 });
  });

  it("should return empty object when key does not exist", async () => {
    setting.findOne.mockResolvedValue({
      details: [
        { key: "UPI", value: 1.2 },
      ],
    });

    const result = await getPGChargeDetails("NON_EXISTING");

    expect(result).toEqual({});
  });

  it("should return empty object when details array is empty", async () => {
    setting.findOne.mockResolvedValue({
      details: [],
    });

    const result = await getPGChargeDetails("UPI");

    expect(result).toEqual({});
  });

  it("should return empty object when details is undefined", async () => {
    setting.findOne.mockResolvedValue({
      details: undefined,
    });

    const result = await getPGChargeDetails("UPI");

    expect(result).toEqual({});
  });

  it("should return empty object when setting record does not exist", async () => {
    setting.findOne.mockResolvedValue(null);

    const result = await getPGChargeDetails("UPI");

    expect(result).toEqual({});
  });

  it("should handle undefined dynamicId and return empty object", async () => {
    setting.findOne.mockResolvedValue({
      details: [
        { key: "UPI", value: 1.2 },
      ],
    });

    const result = await getPGChargeDetails(undefined);

    expect(result).toEqual({});
  });
});
