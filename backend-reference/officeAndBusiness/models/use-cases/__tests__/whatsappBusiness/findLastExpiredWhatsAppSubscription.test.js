const { findLastExpiredWhatsAppSubscription } = require("../../whatsappBusiness");
const WhatsAppSubscription = require("../../../entities/whatsAppSubscription");
const Package = require("../../../entities/package");

jest.mock("../../../entities/whatsAppSubscription", () => ({
  findOne: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock("../../../entities/package", () => ({
  hasMany: jest.fn(),
}));

describe("findLastExpiredWhatsAppSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return latest expired subscription with package info", async () => {
    const params = { corporateId: 1001 };

    const mockResult = {
      id: 55,
      status: "EXPIRED",
      corporateUserId: 1001,
      package: { id: 10, packageName: "WhatsApp Basic" },
    };

    WhatsAppSubscription.findOne.mockResolvedValue(mockResult);

    const result = await findLastExpiredWhatsAppSubscription(params);

    expect(WhatsAppSubscription.findOne).toHaveBeenCalledWith({
      include: [{ model: Package }],
      where: {
        status: "EXPIRED",
        corporateUserId: params.corporateId,
        isCustom: false,
      },
      order: [["subscriptionEndDate", "DESC"]],
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResult);
  });

  it("should return null when no expired subscription is found", async () => {
    WhatsAppSubscription.findOne.mockResolvedValue(null);

    const result = await findLastExpiredWhatsAppSubscription({ corporateId: 2002 });

    expect(result).toBeNull();
  });

  it("should return false when an exception is thrown", async () => {
    WhatsAppSubscription.findOne.mockRejectedValue(new Error("DB failed"));

    const result = await findLastExpiredWhatsAppSubscription({ corporateId: 3003 });

    expect(result).toBe(false);
  });

  it("should throw error if params is undefined", async () => {
    await expect(findLastExpiredWhatsAppSubscription()).resolves.toBe(false);
  });

  it("should throw error if corporateId is missing", async () => {
    await expect(findLastExpiredWhatsAppSubscription({})).resolves.toBe(false);
  });
});
