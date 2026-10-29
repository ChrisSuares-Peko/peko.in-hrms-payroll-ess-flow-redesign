const { postWebhook } = require("../pekoEcomClient");
const { findOne: findOneServiceOperator } = require("../../models/use-cases/serviceOperator");
const Package = require("../../models/entities/package");
const {
  fireSubscriptionCreated,
  fireSubscriptionUpgraded,
  fireSubscriptionCanceled,
} = require("../pekoEcomEvents");

jest.mock("../pekoEcomClient", () => ({ postWebhook: jest.fn() }));
jest.mock("../../models/use-cases/serviceOperator", () => ({ findOne: jest.fn() }));
jest.mock("../../models/entities/package", () => ({ findOne: jest.fn() }));

const sub = {
  id: 10,
  projectId: "chain-uuid",
  credentialId: 42,
  billingType: "ANNUALLY",
  subscriptionStartDate: "2026-09-10T00:00:00.000Z",
  subscriptionEndDate: "2027-09-10T23:59:59.000Z",
};

describe("pekoEcomEvents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findOneServiceOperator.mockResolvedValue({
      vendor: { apiUrl: "https://vendor.test", optional1: "hook-secret" },
    });
    Package.findOne.mockResolvedValue({ id: 5, externalId: "vendor-plan-uuid" });
    postWebhook.mockResolvedValue({ status: 200 });
  });

  it("fires subscription.created with an INR payload keyed by the vendor plan id", async () => {
    await fireSubscriptionCreated({ sub, packageId: 5, amount: "9999.00" });

    expect(findOneServiceOperator).toHaveBeenCalledWith({ accessKey: "ecommerce_store" });
    expect(postWebhook).toHaveBeenCalledTimes(1);
    const { apiUrl, secret, payload } = postWebhook.mock.calls[0][0];
    expect(apiUrl).toBe("https://vendor.test");
    expect(secret).toBe("hook-secret");
    expect(payload.eventType).toBe("subscription.created");
    expect(payload.eventId).toMatch(/^evt_/);
    expect(payload.data).toEqual({
      pekoSubscriptionId: "chain-uuid",
      pekoUserId: "42",
      packageId: "vendor-plan-uuid",
      billingCycle: "annually",
      amount: "9999.00",
      currency: "INR",
      currentPeriodStart: "2026-09-10T00:00:00.000Z",
      currentPeriodEnd: "2027-09-10T23:59:59.000Z",
    });
  });

  it("includes previousPekoSubscriptionId on upgrades", async () => {
    await fireSubscriptionUpgraded({ sub, packageId: 5, amount: "9999.00", previousPekoSubscriptionId: "old-chain" });

    const { payload } = postWebhook.mock.calls[0][0];
    expect(payload.eventType).toBe("subscription.upgraded");
    expect(payload.data.previousPekoSubscriptionId).toBe("old-chain");
  });

  it("sends a zero amount for cancellations", async () => {
    await fireSubscriptionCanceled({ sub: { ...sub, billingType: "MONTHLY" }, packageId: 5 });

    const { payload } = postWebhook.mock.calls[0][0];
    expect(payload.eventType).toBe("subscription.canceled");
    expect(payload.data.amount).toBe("0.00");
    expect(payload.data.billingCycle).toBe("monthly");
  });

  it("skips delivery when the subscription has no projectId", async () => {
    await fireSubscriptionCreated({ sub: { ...sub, projectId: null }, packageId: 5, amount: "1" });

    expect(postWebhook).not.toHaveBeenCalled();
  });

  it("skips delivery when the vendor is not configured", async () => {
    findOneServiceOperator.mockResolvedValue({ vendor: { apiUrl: null, optional1: null } });

    await fireSubscriptionCreated({ sub, packageId: 5, amount: "1" });

    expect(postWebhook).not.toHaveBeenCalled();
  });

  it("skips delivery when the package has no externalId", async () => {
    Package.findOne.mockResolvedValue({ id: 5, externalId: null });

    await fireSubscriptionCreated({ sub, packageId: 5, amount: "1" });

    expect(postWebhook).not.toHaveBeenCalled();
  });

  it("swallows delivery errors", async () => {
    postWebhook.mockRejectedValue(new Error("network"));

    await expect(fireSubscriptionCreated({ sub, packageId: 5, amount: "1" })).resolves.toBeUndefined();
  });
});
