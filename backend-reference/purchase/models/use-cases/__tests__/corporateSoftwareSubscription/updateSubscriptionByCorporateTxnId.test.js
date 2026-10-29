/**
 * @file Unit tests for updateSubscriptionByCorporateTxnId use case
 * @description Tests success, validation, not-found, and error scenarios for updating a corporate software subscription
 */

const {
  updateSubscriptionByCorporateTxnId,
} = require("../../corporateSoftwareSubscription");
const CorporateSoftwareSubscription = require("../../../entities/corporateSoftwareSubscription");
const orders = require("../../../entities/order");
const { customLog } = require("../../../../utils/loggerHelper");

/**
 * Mocking dependencies to isolate unit testing
 */
jest.mock("../../../entities/corporateSoftwareSubscription", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../../../utils/loggerHelper", () => ({
  customLog: jest.fn(),
}));

describe("updateSubscriptionByCorporateTxnId use case", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @test
   * @description Should return null and NOT call DB when corporateTxnId is missing
   */
  it("should return null and skip DB call if corporateTxnId is null or undefined", async () => {
    const resultNull = await updateSubscriptionByCorporateTxnId(null, {});
    const resultUndefined = await updateSubscriptionByCorporateTxnId(undefined, {});

    // DB should NOT be called
    expect(CorporateSoftwareSubscription.findOne).not.toHaveBeenCalled();

    // Should return null
    expect(resultNull).toBeNull();
    expect(resultUndefined).toBeNull();
  });

  /**
   * @test
   * @description Should update subscription successfully when record is found
   */
  it("should update subscription successfully", async () => {
    const corporateTxnId = "txn_123";

    const vendorResponse = {
      saleReference: "txn_123",
      fulfilledAt: "2026-04-14T12:00:00.000Z",
      fulfillmentSummary: {
        purchaseType: "subscription",
        billingCycle: "monthly",
        deliveryChannel: "email",
        accessStartDate: new Date(),
        accessEndDate: new Date(),
        nextRenewalDate: new Date(),
        licenseKey: "provided",
        licenseDocument: "provided",
      },
    };

    const params = {
      purchaseType: vendorResponse.fulfillmentSummary.purchaseType,
      subscriptionStartDate: vendorResponse.fulfillmentSummary.accessStartDate,
      subscriptionEndDate: vendorResponse.fulfillmentSummary.accessEndDate,
      billingCycle: vendorResponse.fulfillmentSummary.billingCycle,
      subscriptionRenewalDate:
        vendorResponse.fulfillmentSummary.nextRenewalDate,
      vendorResponse,
      status: "ACTIVE",
    };

    const mockUpdatedResponse = { id: 1, ...params };

    const mockSubscription = {
      update: jest.fn().mockResolvedValue(mockUpdatedResponse),
    };

    CorporateSoftwareSubscription.findOne.mockResolvedValue(mockSubscription);

    const result = await updateSubscriptionByCorporateTxnId(
      corporateTxnId,
      params
    );

    expect(CorporateSoftwareSubscription.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: orders,
          where: { corporateTxnId },
          attributes: [],
        },
      ],
    });

    expect(mockSubscription.update).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockUpdatedResponse);
  });

  /**
   * @test
   * @description Should return null when subscription is not found
   */
  it("should return null if subscription is not found", async () => {
    const corporateTxnId = "txn_123";

    CorporateSoftwareSubscription.findOne.mockResolvedValue(null);

    const result = await updateSubscriptionByCorporateTxnId(
      corporateTxnId,
      {}
    );

    expect(CorporateSoftwareSubscription.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: orders,
          where: { corporateTxnId },
          attributes: [],
        },
      ],
    });

    expect(result).toBeNull();
  });

  /**
   * @test
   * @description Should return false and log error when findOne throws an error
   */
  it("should return false and log error if findOne fails", async () => {
    const corporateTxnId = "txn_123";
    const mockError = new Error("DB error");

    CorporateSoftwareSubscription.findOne.mockRejectedValue(mockError);

    const result = await updateSubscriptionByCorporateTxnId(
      corporateTxnId,
      {}
    );

    expect(CorporateSoftwareSubscription.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: orders,
          where: { corporateTxnId },
          attributes: [],
        },
      ],
    });

    expect(customLog).toHaveBeenCalledWith(
      null,
      "error",
      expect.objectContaining({
        message: expect.stringContaining(
          "updateSubscriptionByCorporateTxnId"
        ),
        error: mockError,
      })
    );

    expect(result).toBe(false);
  });

  /**
   * @test
   * @description Should return false and log error when update fails
   */
  it("should return false if update fails", async () => {
    const corporateTxnId = "txn_123";
    const mockError = new Error("Update failed");

    const mockSubscription = {
      update: jest.fn().mockRejectedValue(mockError),
    };

    CorporateSoftwareSubscription.findOne.mockResolvedValue(mockSubscription);

    const result = await updateSubscriptionByCorporateTxnId(
      corporateTxnId,
      {}
    );

    expect(CorporateSoftwareSubscription.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: orders,
          where: { corporateTxnId },
          attributes: [],
        },
      ],
    });

    expect(mockSubscription.update).toHaveBeenCalledWith({});

    expect(customLog).toHaveBeenCalledWith(
      null,
      "error",
      expect.objectContaining({
        message: expect.stringContaining(
          "updateSubscriptionByCorporateTxnId"
        ),
        error: mockError,
      })
    );

    expect(result).toBe(false);
  });
});