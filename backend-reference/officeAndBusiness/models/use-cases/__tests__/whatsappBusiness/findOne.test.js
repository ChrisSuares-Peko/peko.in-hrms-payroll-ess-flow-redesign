const { findOne } = require("../../whatsappBusiness");
const WhatsAppSubscription = require("../../../entities/whatsAppSubscription");
const Package = require("../../../entities/package");

jest.mock("../../../entities/whatsAppSubscription", () => ({
  findOne: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock("../../../entities/package", () => ({
  belongsTo: jest.fn(),
}));

describe("findOne WhatsAppSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return subscription details when found", async () => {
    const params = { id: 10 };
    const attributes = ["id", "status"];

    const mockData = {
      id: 10,
      status: "ACTIVE",
      package: { packageName: "Pro Pack", accessCode: "AC123" },
    };

    WhatsAppSubscription.findOne.mockResolvedValue(mockData);

    const result = await findOne(params, attributes);

    expect(WhatsAppSubscription.findOne).toHaveBeenCalledWith({
      where: params,
      include: [
        {
          model: Package,
          attributes: ["packageName", "accessCode"],
        },
      ],
      attributes,
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockData);
  });

  it("should return data when attributes is undefined", async () => {
    const params = { id: 22 };

    const mockData = {
      id: 22,
      package: { packageName: "Basic", accessCode: "X1" },
    };

    WhatsAppSubscription.findOne.mockResolvedValue(mockData);

    const result = await findOne(params);

    expect(WhatsAppSubscription.findOne).toHaveBeenCalledWith({
      where: params,
      include: [
        {
          model: Package,
          attributes: ["packageName", "accessCode"],
        },
      ],
      attributes: undefined,
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockData);
  });

  it("should return null when no subscription found", async () => {
    WhatsAppSubscription.findOne.mockResolvedValue(null);

    const result = await findOne({ id: 999 });

    expect(result).toBeNull();
  });

  it("should handle errors and return undefined", async () => {
    WhatsAppSubscription.findOne.mockRejectedValue(new Error("DB exploded"));

    const result = await findOne({ id: 50 });

    expect(result).toBeUndefined(); // because catch does not rethrow
  });

  it("should throw if params is undefined", async () => {
    await expect(findOne()).resolves.toBe(undefined);
  });

  it("should throw if params is empty object", async () => {
    await expect(findOne({})).resolves.toBe(undefined);
  });
});
