
const transaction = require("../../../entities/transaction");
const credential = require("../../../entities/credential");
const serviceOperator = require("../../../entities/serviceOperator");
const orders = require("../../../entities/order");

const { Op } = require("sequelize");
const { findAllRefundTransactions } = require("../../transaction");

jest.mock("../../../entities/transaction", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../entities/serviceOperator", () => ({}));
jest.mock("../../../entities/credential", () => ({}));
jest.mock("../../../entities/order", () => ({}));

describe("findAllRefundTransactions Service", () => {
  afterEach(() => jest.clearAllMocks());

  test("should build correct query and return results", async () => {
    const mockResult = { rows: [], count: 0 };
    transaction.findAndCountAll.mockResolvedValue(mockResult);

    const params = {
      limit: 10,
      offset: 20,
      serviceAccessKey: "RAZORPAY",
      corporateId: 77,
      fromStart: new Date("2024-01-01"),
      endDate: new Date("2024-01-05"),
      searchText: "abc",
      partnerId: 123,
    };

    const result = await findAllRefundTransactions(params);

    const tomorrow = new Date("2024-01-06");
    tomorrow.setHours(0, 0, 0, 0);

    expect(transaction.findAndCountAll).toHaveBeenCalledWith({
      attributes: [
        "id",
        "corporateTxnId",
        "debitAmount",
        "transactionDate",
        "remarks",
        "status",
        "orderId",
      ],
      include: [
        {
          model: serviceOperator,
          attributes: ["serviceProvider", "serviceCategory"],
          where: {
            accessKey: "RAZORPAY",
          },
          required: true,
        },
        {
          model: credential,
          attributes: ["id", "role", "username", "name"],
          where: { registeredBy: 123 },
          required: true,
        },
        {
          model: orders,
          attributes: [
            "id",
            "paymentMode",
            "amountInINR",
            "paymentMode",
            "paymentModeResponse",
          ],
          required: true,
        },
      ],
      where: {
        transactionDate: { [Op.between]: [params.fromStart, tomorrow] },
        batchId: null,
        [Op.or]: [
          { corporateTxnId: { [Op.like]: "%abc%" } },
          {
            "$credential.username$": {
              [Op.like]: "%abc%",
            },
          },
          {
            "$credential.name$": {
              [Op.like]: "%abc%",
            },
          },
          {
            "$serviceOperator.serviceProvider$": {
              [Op.like]: "%abc%",
            },
          },
          {
            "$order.amountInINR$": {
              [Op.like]: "%abc%",
            },
          },
        ],
        credentialId: 77,
      },
      limit: 10,
      offset: 20,
      order: [["createdAt", "DESC"]],
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResult);
  });

  test("should remove accessKey when serviceAccessKey = 'all'", async () => {
    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllRefundTransactions({
      limit: 5,
      offset: 0,
      serviceAccessKey: "all", // SHOULD REMOVE accessKey
      corporateId: null,
      fromStart: new Date(),
      endDate: new Date(),
      searchText: "x",
      partnerId: undefined, // no registeredBy filter
    });

    const call = transaction.findAndCountAll.mock.calls[0][0];

    // accessKey SHOULD NOT EXIST
    expect(call.include[0].where.accessKey).toBeUndefined();
  });

  test("should handle empty searchText gracefully", async () => {
    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllRefundTransactions({
      limit: 5,
      offset: 0,
      serviceAccessKey: "RAZORPAY",
      corporateId: null,
      fromStart: new Date(),
      endDate: new Date(),
      searchText: "   ", // spaces only
      partnerId: undefined,
    });

    const [query] = transaction.findAndCountAll.mock.calls[0];

    expect(query.where[Op.or]).toEqual([
      { corporateTxnId: { [Op.like]: "%%" } },
      { "$credential.username$": { [Op.like]: "%%" } },
      { "$credential.name$": { [Op.like]: "%%" } },
      { "$serviceOperator.serviceProvider$": { [Op.like]: "%%" } },
      { "$order.amountInINR$": { [Op.like]: "%%" } },
    ]);
  });

  test("should throw error when DB fails", async () => {
    transaction.findAndCountAll.mockRejectedValue(new Error("DB ERROR"));

    await expect(
      findAllRefundTransactions({
        limit: 1,
        offset: 0,
        serviceAccessKey: "RAZORPAY",
        corporateId: null,
        fromStart: new Date(),
        endDate: new Date(),
        searchText: "x",
      })
    ).rejects.toThrow("DB ERROR");
  });
});
