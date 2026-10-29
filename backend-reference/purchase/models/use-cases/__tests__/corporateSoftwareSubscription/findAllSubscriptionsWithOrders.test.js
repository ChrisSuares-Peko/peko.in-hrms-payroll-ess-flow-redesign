/**
 * @file Unit tests for findAllSubscriptionsWithOrders use case
 */

const {
  findAllSubscriptionsWithOrders,
} = require("../../corporateSoftwareSubscription");

const CorporateSoftwareSubscription = require("../../../entities/corporateSoftwareSubscription");
const orders = require("../../../entities/order");
const { customLog } = require("../../../../utils/loggerHelper");
const { Op } = require("sequelize");

/**
 * Mock dependencies
 */
jest.mock("../../../entities/corporateSoftwareSubscription", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../../utils/loggerHelper", () => ({
  customLog: jest.fn(),
}));

describe("findAllSubscriptionsWithOrders use case", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @test
   * @description Should fetch subscriptions without filters
   */
  it("should fetch subscriptions without filters", async () => {
    const params = {
      limit: 10,
      offset: 0,
    };

    const mockResponse = {
      count: 1,
      rows: [
        {
          planName: "standard",
          productName: "Freshdesk",
          order: {
            corporateTxnId: "1776507581977",
            paymentMode: "PAYMENT GATEWAY",
            amountInINR: "191.9000",
          },
        },
      ],
    };

    CorporateSoftwareSubscription.findAndCountAll.mockResolvedValue(mockResponse);

    const result = await findAllSubscriptionsWithOrders(params);

    expect(CorporateSoftwareSubscription.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: orders,
          where: {},
          attributes: [
            "id",
            "corporateTxnId",
            "paymentMode",
            "amountInINR",
            "transactionDate",
            "status",
          ],
          required: true,
        },
      ],
      where: {},
      attributes: ["planName", "productName"],
      order: [["createdAt", "DESC"]],
      limit: 10,
      offset: 0,
      subQuery: false,
    });

    expect(result).toEqual(mockResponse);
  });

  /**
   * @test
   * @description Should apply date filter correctly
   */
  it("should apply date filter correctly", async () => {
    const params = {
      from: "2026-04-01",
      to: "2026-04-30",
      limit: 10,
      offset: 0,
    };

    CorporateSoftwareSubscription.findAndCountAll.mockResolvedValue({});

    await findAllSubscriptionsWithOrders(params);

    expect(CorporateSoftwareSubscription.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            [Op.between]: [
              new Date("2026-04-01"),
              new Date("2026-04-30"),
            ],
          },
        },
      })
    );
  });

  /**
   * @test
   * @description Should apply searchText filter with all conditions
   */
  it("should apply searchText filter correctly", async () => {
    const params = {
      searchText: "Freshdesk",
      limit: 10,
      offset: 0,
    };

    CorporateSoftwareSubscription.findAndCountAll.mockResolvedValue({});

    await findAllSubscriptionsWithOrders(params);

    expect(CorporateSoftwareSubscription.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          [Op.or]: [
            { planName: { [Op.like]: "%Freshdesk%" } },
            { productName: { [Op.like]: "%Freshdesk%" } },
            { "$order.corporateTxnId$": { [Op.like]: "%Freshdesk%" } },
            { "$order.paymentMode$": { [Op.like]: "%Freshdesk%" } },
            { "$order.amountInINR$": { [Op.like]: "%Freshdesk%" } },
            { "$order.status$": { [Op.like]: "%Freshdesk%" } },
          ],
        },
      })
    );
  });

  /**
   * @test
   * @description Should apply both date and search filters together
   */
  it("should combine date and search filters correctly", async () => {
    const params = {
      from: "2026-04-01",
      to: "2026-04-30",
      searchText: "Freshdesk",
      limit: 10,
      offset: 0,
    };

    CorporateSoftwareSubscription.findAndCountAll.mockResolvedValue({});

    await findAllSubscriptionsWithOrders(params);

    expect(CorporateSoftwareSubscription.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            [Op.between]: [
              new Date("2026-04-01"),
              new Date("2026-04-30"),
            ],
          },
          [Op.or]: [
            { planName: { [Op.like]: "%Freshdesk%" } },
            { productName: { [Op.like]: "%Freshdesk%" } },
            { "$order.corporateTxnId$": { [Op.like]: "%Freshdesk%" } },
            { "$order.paymentMode$": { [Op.like]: "%Freshdesk%" } },
            { "$order.amountInINR$": { [Op.like]: "%Freshdesk%" } },
            { "$order.status$": { [Op.like]: "%Freshdesk%" } },
          ],
        },
      })
    );
  });

  /**
   * @test
   * @description Should apply serviceOperatorId and corporateId filters
   */
  it("should apply order filters correctly", async () => {
    const params = {
      corporateId: 1111,
      limit: 10,
      offset: 0,
    };

    CorporateSoftwareSubscription.findAndCountAll.mockResolvedValue({});

    await findAllSubscriptionsWithOrders(params);

    expect(CorporateSoftwareSubscription.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: orders,
          where: {
            credentialId: params.corporateId,
          },
          attributes: [
            "id",
            "corporateTxnId",
            "paymentMode",
            "amountInINR",
            "transactionDate",
            "status",
          ],
          required: true,
        },
      ],
      where: {},
      attributes: ["planName", "productName"],
      order: [["createdAt", "DESC"]],
      limit: 10,
      offset: 0,
      subQuery: false,
    });
  });

  /**
   * @test
   * @description Should handle DB error properly
   */
  it("should return false and log error on failure", async () => {
    const params = {
      limit: 10,
      offset: 0,
    };

    const mockError = new Error("DB error");

    CorporateSoftwareSubscription.findAndCountAll.mockRejectedValue(mockError);

    const result = await findAllSubscriptionsWithOrders(params);

    expect(customLog).toHaveBeenCalledWith(
      null,
      "error",
      expect.objectContaining({
        message: "An error occurred in findAllSubscriptionsWithOrders",
        error: mockError,
      })
    );

    expect(result).toBe(false);
  });
});