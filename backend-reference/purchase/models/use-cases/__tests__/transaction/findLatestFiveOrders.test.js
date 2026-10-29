const { findLatestFiveOrders } = require("../../../use-cases/transaction");
const orders = require("../../../entities/order");
const serviceOperator = require("../../../entities/serviceOperator");
const credential = require("../../../entities/credential");

jest.mock("../../../entities/order", () => ({
  findAndCountAll: jest.fn(),
}));

describe("findLatestFiveOrders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch the latest five orders based on given parameters", async () => {
    const mockParams = {
      length: 5,
      order: "DESC",
      column: "createdAt",
      serviceCategory: "Office Supplies",
    };

    const mockOrders = {
      count: 5,
      rows: [
        { id: 1, serviceCategory: "Office Supplies", credential: { name: "John Doe" } },
        { id: 2, serviceCategory: "Office Supplies", credential: { name: "Jane Doe" } },
      ],
    };

    orders.findAndCountAll.mockResolvedValue(mockOrders);

    const result = await findLatestFiveOrders(mockParams);

    expect(orders.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: serviceOperator,
          where: { serviceCategory: "Office Supplies" },
          attributes: ["serviceCategory"],
        },
        {
          model: credential,
          attributes: ["name"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 5,
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockOrders);
  });

  it("should return an empty array when no orders are found", async () => {
    orders.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await findLatestFiveOrders({
      length: 5,
      order: "DESC",
      column: "createdAt",
      serviceCategory: "Invalid Category",
    });

    expect(result).toEqual({ count: 0, rows: [] });
  });
});
