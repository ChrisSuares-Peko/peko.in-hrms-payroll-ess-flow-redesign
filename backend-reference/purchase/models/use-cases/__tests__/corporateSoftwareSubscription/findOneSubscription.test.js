/**
 * @file Unit tests for findOneSubscription use case
 * @description Tests validation, success, not-found, and error scenarios
 */

const { findOneSubscription } = require("../../corporateSoftwareSubscription");
const CorporateSoftwareSubscription = require("../../../entities/corporateSoftwareSubscription");
const orders = require("../../../entities/order");
const { customLog } = require("../../../../utils/loggerHelper");

/**
 * Mock dependencies
 */
jest.mock("../../../entities/corporateSoftwareSubscription", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../../../utils/loggerHelper", () => ({
  customLog: jest.fn(),
}));

describe("findOneSubscription use case", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @test
   * @description Should return null and skip DB if required params are missing
   */
  it("should return null if credentialId or corporateTxnId is missing", async () => {
    const missingCredentialId = await findOneSubscription({
      corporateTxnId: "1776507581977",
    });
    const missingCorporateTxnId = await findOneSubscription({
      credentialId: 3549,
    });
    const missingBoth = await findOneSubscription({});

    expect(CorporateSoftwareSubscription.findOne).not.toHaveBeenCalled();

    expect(missingCredentialId).toBeNull();
    expect(missingCorporateTxnId).toBeNull();
    expect(missingBoth).toBeNull();
  });

  /**
   * @test
   * @description Should fetch subscription successfully
   */
  it("should return subscription when found", async () => {
    const subscriptionAttributes = [
      "status",
      "subscriptionStartDate",
      "subscriptionEndDate",
      "billingCycle",
      "purchaseType",
      "productName",
      "isCancelled",
    ];

    const orderAttribute = ["amountInINR", "paymentMode"];

    const params = {
      credentialId: 1111,
      corporateTxnId: "1111111111111",
      subscriptionAttributes,
      orderAttribute,
    };

    const mockResponse = {
      status: "PENDING",
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      billingCycle: "monthly",
      purchaseType: null,
      productName: "dummyProduct",
      isCancelled: false,
      order: {
        amountInINR: "191.9000",
        paymentMode: "PAYMENT GATEWAY",
      },
    };

    CorporateSoftwareSubscription.findOne.mockResolvedValue(mockResponse);

    const result = await findOneSubscription(params);

    expect(CorporateSoftwareSubscription.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: orders,
          where: {
            corporateTxnId: params.corporateTxnId,
            credentialId: params.credentialId,
          },
          attributes: orderAttribute,
        },
      ],
      attributes: subscriptionAttributes,
      raw: true,
      nest: true,
    });

    // Strong assertions
    expect(result).toEqual(mockResponse);
    expect(result.productName).toBe("dummyProduct");
    expect(result.order.amountInINR).toBe("191.9000");
    expect(result.order.paymentMode).toBe("PAYMENT GATEWAY");
  });

  /**
   * @test
   * @description Should return null when subscription is not found
   */
  it("should return null if subscription not found", async () => {
    const params = {
      credentialId: 1111,
      corporateTxnId: "1111111111111",
    };

    CorporateSoftwareSubscription.findOne.mockResolvedValue(null);

    const result = await findOneSubscription(params);

    expect(CorporateSoftwareSubscription.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: orders,
          where: {
            corporateTxnId: params.corporateTxnId,
            credentialId: params.credentialId,
          },
          attributes: undefined,
        },
      ],
      attributes: undefined,
      raw: true,
      nest: true,
    });

    expect(result).toBeNull();
  });

  /**
   * @test
   * @description Should return false and log error if DB fails
   */
  it("should return false and log error if findOne throws error", async () => {
    const params = {
      credentialId: 1111,
      corporateTxnId: "1111111111111",
    };

    const mockError = new Error("DB error");

    CorporateSoftwareSubscription.findOne.mockRejectedValue(mockError);

    const result = await findOneSubscription(params);

    expect(CorporateSoftwareSubscription.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: orders,
          where: {
            corporateTxnId: params.corporateTxnId,
            credentialId: params.credentialId,
          },
          attributes: undefined,
        },
      ],
      attributes: undefined,
      raw: true,
      nest: true,
    });

    expect(customLog).toHaveBeenCalledWith(
      null,
      "error",
      expect.objectContaining({
        message: expect.stringContaining("findOneSubscription"),
        error: mockError,
      }),
    );

    expect(result).toBe(false);
  });
});
