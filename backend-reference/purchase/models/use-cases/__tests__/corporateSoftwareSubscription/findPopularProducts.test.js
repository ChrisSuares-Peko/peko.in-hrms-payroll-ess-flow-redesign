/**
 * @file findPopularProducts.test.js
 * @description Unit tests for the `findPopularProducts` use case.
 *
 * This suite verifies:
 * - Successful retrieval and transformation of popular product web URLs
 * - Handling of empty database results
 * - Proper error handling and logging on failure
 */

const { findPopularProducts } = require("../../corporateSoftwareSubscription");

const CorporateSoftwareSubscription = require("../../../entities/corporateSoftwareSubscription");
const { customLog } = require("../../../../utils/loggerHelper");

/**
 * Mock database model to isolate business logic
 */
jest.mock("../../../entities/corporateSoftwareSubscription", () => ({
  findAll: jest.fn(),
}));

/**
 * Mock logger to verify error handling without real logging
 */
jest.mock("../../../../utils/loggerHelper", () => ({
  customLog: jest.fn(),
}));

/**
 * Mock Sequelize config functions used in query building
 * Prevents runtime errors from fn, col, literal usage
 */
jest.mock("../../../../configs/database/index", () => ({
  define: jest.fn(() => ({})),
  fn: jest.fn(),
  col: jest.fn(),
  literal: jest.fn(),
}));

/**
 * Mock orders entity to avoid loading full Sequelize associations
 */
jest.mock("../../../entities/order", () => ({}));

describe("findPopularProducts use case", () => {
  /**
   * Reset all mocks before each test
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @test
   * @description Verifies that the function returns a list of popular product web URLs
   * based on aggregated database results.
   *
   * @scenario
   * - DB returns grouped results with webUrl and count
   * - Function should map and return only webUrl values
   *
   * @expected
   * - Sequelize `findAll` is called with correct aggregation query
   * - Result is an array of webUrl strings
   */
  it("should return popular products successfully", async () => {
    const mockDbResponse = [
      { webUrl: "freshdesk", dataValues: { count: 5 } },
      { webUrl: "zoho", dataValues: { count: 3 } },
    ];

    CorporateSoftwareSubscription.findAll.mockResolvedValue(mockDbResponse);

    const result = await findPopularProducts();

    expect(CorporateSoftwareSubscription.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: expect.arrayContaining([
          "webUrl",
          expect.any(Array), // Represents COUNT aggregation
        ]),
        group: ["corporate_software_subscriptions.webUrl"],
        order: expect.any(Array),
        limit: 12,
      }),
    );

    expect(result).toEqual(["freshdesk", "zoho"]);
  });

  /**
   * @test
   * @description Verifies that an empty array is returned when no popular products exist
   *
   * @scenario
   * - DB returns an empty result set
   *
   * @expected
   * - Function should return an empty array
   */
  it("should return empty array if no popular products found", async () => {
    CorporateSoftwareSubscription.findAll.mockResolvedValue([]);

    const result = await findPopularProducts();

    expect(CorporateSoftwareSubscription.findAll).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  /**
   * @test
   * @description Verifies error handling when the database query fails
   *
   * @scenario
   * - Sequelize `findAll` throws an error
   *
   * @expected
   * - Logger is called with proper error details
   * - Function returns `false`
   */
  it("should return false and log error if DB fails", async () => {
    const mockError = new Error("DB error");

    CorporateSoftwareSubscription.findAll.mockRejectedValue(mockError);

    const result = await findPopularProducts();

    expect(customLog).toHaveBeenCalledWith(
      null,
      "error",
      expect.objectContaining({
        message: "An error occurred in findPopularProducts",
        error: mockError,
      }),
    );

    expect(result).toBe(false);
  });
});