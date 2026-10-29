const { findCurrentWhatsAppSubscription } = require("../../../use-cases/whatsappBusiness");
const WhatsAppSubscription = require("../../../entities/whatsAppSubscription");
const Package = require("../../../entities/package");

jest.mock("../../../entities/whatsAppSubscription", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../../entities/package", () => ({
  hasMany: jest.fn(),
}));

describe("findCurrentWhatsAppSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return subscription data when found", async () => {
    const params = { corporateId: 55 };

    const mockResult = {
      id: 1,
      subscriptionStartDate: "2024-01-01",
      subscriptionEndDate: "2025-01-01",
      status: "ACTIVE",
      package: {
        id: 99,
        packageName: "WhatsApp Premium",
      },
    };

    WhatsAppSubscription.findOne.mockResolvedValue(mockResult);

    const result = await findCurrentWhatsAppSubscription(params);

    expect(WhatsAppSubscription.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: Package,
          attributes: [
            "id",
            "packageName",
            "packageType",
            "description",
            "serviceList",
            "packageLogo",
            "priorityLevel",
          ],
        },
      ],
      where: {
        corporateUserId: params.corporateId,
        status: "ACTIVE",
      },
      attributes: [
        "id",
        "subscriptionStartDate",
        "subscriptionEndDate",
        "isCustom",
        "isCancelled",
        "billingType",
        "status",
        "subscriptionAmountPaid",
      ],
      raw: true,
      nest: true,
    });

    expect(result).toEqual({ subscription: mockResult });
  });

  it("should return false when no subscription is found", async () => {
    WhatsAppSubscription.findOne.mockResolvedValue(null);

    const result = await findCurrentWhatsAppSubscription({ corporateId: 123 });

    expect(result).toBe(false);
  });

  it("should return false when DB throws an error", async () => {
    WhatsAppSubscription.findOne.mockRejectedValue(new Error("DB exploded"));

    const result = await findCurrentWhatsAppSubscription({ corporateId: 88 });

    expect(result).toBe(false);
  });

  it("should throw when params is undefined", async () => {
    await expect(findCurrentWhatsAppSubscription()).resolves.toBe(false);
  });

  it("should throw when params.corporateId is missing", async () => {
    await expect(findCurrentWhatsAppSubscription()).resolves.toBe(false);
  });
});
