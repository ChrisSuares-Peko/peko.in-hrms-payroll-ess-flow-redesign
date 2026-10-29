/**
 * @file Unit tests for createSubscription use case
 * @description Tests success and failure scenarios for creating a corporate software subscription
 */

const { createSubscription } = require("../../corporateSoftwareSubscription");
const CorporateSoftwareSubscription = require("../../../entities/corporateSoftwareSubscription");
const { customLog } = require("../../../../utils/loggerHelper");

/**
 * Mocking database model and logger to isolate unit testing
 */
jest.mock("../../../entities/corporateSoftwareSubscription", () => ({
  create: jest.fn(),
}));

jest.mock("../../../../utils/loggerHelper", () => ({
  customLog: jest.fn(),
}));

/**
 * Test suite for createSubscription use case
 */
describe("createSubscription use case", () => {
  /**
   * Clears all mocks before each test to avoid test interference
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @test
   * @description Should create subscription successfully when DB operation succeeds
   * @returns {Promise<void>}
   */
  it("should create subscription successfully", async () => {
    const params = {
      corporateUserId: 123,
      orderId: 456,
      planSkuId: "SKU_001",
      productName: "Software Pro",
      webUrl: "https://example.com",
      planName: "Premium",
      purchaseType: "subscription", //
      billingCycle: "monthly",
      status: "PENDING", // 
    };

    
    const mockResponse = { id: 1, ...params };

    // Mock DB success response
    CorporateSoftwareSubscription.create.mockResolvedValue(mockResponse);

    const result = await createSubscription({ params });

    // Verify DB was called correctly
    expect(CorporateSoftwareSubscription.create).toHaveBeenCalledWith(params);

    // Verify correct response is returned
    expect(result).toEqual(mockResponse);
  });

  /**
   * @test
   * @description Should return false and log error when DB operation fails
   * @returns {Promise<void>}
   */
  it("should return false and log error if creation fails", async () => {
    const params = {
      corporateUserId: 123,
      orderId: 456,
      planSkuId: "SKU_001",
    };

    const mockError = new Error("DB error");

    // Mock DB failure
    CorporateSoftwareSubscription.create.mockRejectedValue(mockError);

    const result = await createSubscription({ params });

    // Verify DB was called
    expect(CorporateSoftwareSubscription.create).toHaveBeenCalledWith(params);

    // Verify error logging
    expect(customLog).toHaveBeenCalledWith(
      null,
      "error",
      expect.objectContaining({
        message: expect.stringContaining("CorporateSoftwareSubscription"),
        error: mockError,
      }),
    );

    // Verify fallback response
    expect(result).toBe(false);
  });

    /**
   * @test
   * @description Should handle empty params gracefully by using default empty object
   *              and still calling the DB create method without errors
   * @returns {Promise<void>}
   */
  it("should handle empty params gracefully", async () => {
    // Mock DB success with minimal response
    CorporateSoftwareSubscription.create.mockResolvedValue({ id: 1 });

    const result = await createSubscription({});

    // Verify DB is called with empty object (default params)
    expect(CorporateSoftwareSubscription.create).toHaveBeenCalledWith({});

    // Verify correct response is returned
    expect(result).toEqual({ id: 1 });
  });
});
