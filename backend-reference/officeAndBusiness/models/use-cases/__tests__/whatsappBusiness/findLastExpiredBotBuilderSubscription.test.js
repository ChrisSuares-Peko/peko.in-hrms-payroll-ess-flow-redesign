const {
  findLastExpiredBotBuilderSubscription
} = require("../../whatsappBusiness");

const WhatsAppSubscription = require("../../../entities/whatsAppSubscription");
const Package = require("../../../entities/package");

jest.mock("../../../entities/whatsAppSubscription", () => ({
  findOne: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock("../../../entities/package", () => ({
  hasMany: jest.fn(),
}));

describe("findLastExpiredBotBuilderSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return latest expired bot-builder subscription with package info", async () => {
    const params = { corporateId: 111 };

    const mockResult = {
      id: 5,
      status: "EXPIRED",
      corporateUserId: 111,
      isCustom: true,
      package: {
        id: 9,
        packageName: "Bot Builder",
      },
    };

    WhatsAppSubscription.findOne.mockResolvedValue(mockResult);

    const result = await findLastExpiredBotBuilderSubscription(params);

    expect(WhatsAppSubscription.findOne).toHaveBeenCalledWith({
      include: [{ model: Package }],
      where: {
        status: "EXPIRED",
        corporateUserId: 111,
        isCustom: true,
        addOnType: "BOT_BUILDER",
      },
      order: [["subscriptionEndDate", "DESC"]],
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResult);
  });

  it("should return null if no expired bot-builder subscription exists", async () => {
    WhatsAppSubscription.findOne.mockResolvedValue(null);

    const result = await findLastExpiredBotBuilderSubscription({
      corporateId: 222,
    });

    expect(result).toBeNull();
  });

  it("should return false if DB throws an error", async () => {
    WhatsAppSubscription.findOne.mockRejectedValue(
      new Error("Database exploded")
    );

    const result = await findLastExpiredBotBuilderSubscription({
      corporateId: 333,
    });

    expect(result).toBe(false);
  });

  it("should throw when params is undefined", async () => {
    await expect(findLastExpiredBotBuilderSubscription()).resolves.toBe(false);
  });

  it("should throw when params.corporateId is missing", async () => {
    await expect(findLastExpiredBotBuilderSubscription({})).resolves.toBe(false);
  });
});
