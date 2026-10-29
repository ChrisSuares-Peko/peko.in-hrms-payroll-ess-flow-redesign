const { stopBotBuilderStatus } = require("../../whatsappBusiness");
const WhatsAppSubscription = require("../../../entities/whatsAppSubscription");

jest.mock("../../../entities/whatsAppSubscription", () => ({
  update: jest.fn(),
  belongsTo: jest.fn(),
}));

describe("stopBotBuilderStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true when at least one row is updated", async () => {
    WhatsAppSubscription.update.mockResolvedValue([1]); // 1 row updated

    const result = await stopBotBuilderStatus(10);

    expect(WhatsAppSubscription.update).toHaveBeenCalledWith(
      { isCancelled: true },
      {
        where: {
          id: 10,
          isCustom: true,
          addOnType: 'BOT_BUILDER',
        },
      }
    );

    expect(result).toBe(true);
  });

  it("should return false when no rows are updated", async () => {
    WhatsAppSubscription.update.mockResolvedValue([0]); // no rows updated

    const result = await stopBotBuilderStatus(20);

    expect(result).toBe(false);
  });

  it("should return false when update throws an error", async () => {
    WhatsAppSubscription.update.mockRejectedValue(
      new Error("DB failure")
    );

    const result = await stopBotBuilderStatus(30);

    expect(result).toBe(false);
  });

  it("should throw when id is undefined", async () => {
    await expect(stopBotBuilderStatus()).resolves.toBe(false)
  });

  it("should throw when id is null", async () => {
    await expect(stopBotBuilderStatus(null)).resolves.toBe(false)
  });
});
