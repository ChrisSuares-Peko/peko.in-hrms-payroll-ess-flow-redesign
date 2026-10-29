const { fn } = require("sequelize");
const serviceOperator = require("../../../entities/serviceOperator");
const orders = require("../../../entities/order");
const { findStatusCountEcommerce } = require("../../../use-cases/transaction");

jest.mock("../../../entities/serviceOperator", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../../entities/order", () => ({
  findAll: jest.fn(),
}));

describe("findStatusCountEcommerce", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch service operator and return status count of e-commerce orders", async () => {
    const mockParams = { serviceCategory: "electronics" };
    const mockServiceOperator = { id: 1 };
    const mockOrders = [
      { ecomOrderStatus: "PENDING", count: 5 },
      { ecomOrderStatus: "CONFIRMED", count: 3 },
    ];

    serviceOperator.findOne.mockResolvedValue(mockServiceOperator);
    orders.findAll.mockResolvedValue(mockOrders);

    const result = await findStatusCountEcommerce(mockParams);

    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      where: { serviceCategory: "electronics" },
    });

    expect(orders.findAll).toHaveBeenCalledWith({
      attributes: [
        "ecomOrderStatus",
        [fn("COUNT", "ecomOrderStatus"), "count"],
      ],
      where: { serviceOperatorId: mockServiceOperator.id },
      group: ["ecomOrderStatus"],
      raw: true,
    });

    expect(result).toEqual(mockOrders);
  });

  
  
});
