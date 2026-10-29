const { ordersExport } = require("../../../use-cases/transaction");
const orders = require("../../../entities/order");
const serviceOperator = require("../../../entities/serviceOperator");
const credential = require("../../../entities/credential");
const { Op } = require("sequelize");

jest.mock("../../../entities/order", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../../utils/formatter", () => ({
  formattedDateTime: jest.fn((date) => `Formatted ${date}`),
  formatNumberWithLocalString: jest.fn((number) => number.toLocaleString("en-IN")),
}));

describe("ordersExport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and format order data correctly", async () => {
    const mockParams = {
      from: "2024-01-01",
      to: "2024-01-31",
      searchText: "12345",
      sort: "DESC",
      sortField: "transactionDate",
      status: "Completed",
    };

    const mockOrders = {
      count: 2,
      rows: [
        {
          transactionDate: "2024-01-10T12:00:00Z",
          orderResponse: JSON.stringify({
            products: [
              { productName: "Pen", totalPrice: 5, productQuantity: 2 },
              { productName: "Notebook", totalPrice: 10, productQuantity: 1 },
            ],
          }),
          corporateTxnId: "TXN12345",
          amountInINR: 100,
          ecomOrderStatus: "Delivered",
          status: "Paid",
          credential: { name: "John Doe", username: "johndoe123" },
        },
      ],
    };

    orders.findAndCountAll.mockResolvedValue(mockOrders);

    const result = await ordersExport(mockParams, null);

    expect(orders.findAndCountAll).toHaveBeenCalledWith({
      attributes: [
        "transactionDate",
        "orderResponse",
        "corporateTxnId",
        "amountInINR",
        "ecomOrderStatus",
        "status",
      ],
      include: [
        {
          model: serviceOperator,
          attributes: ["serviceProvider"],
          where: { serviceCategory: "Office Supplies" },
        },
        {
          model: credential,
          attributes: ["name", "username"],
        },
      ],
      where: expect.objectContaining({
        [Op.or]: expect.any(Array),
        transactionDate: expect.objectContaining({ [Op.between]: expect.any(Array) }),
        ecomOrderStatus: "Completed",
      }),
      order: [["transactionDate", "DESC"]],
      raw: true,
      nest: true,
    });

    expect(result).toEqual([
  {
    "Transaction Date": "Formatted 2024-01-10T12:00:00Z",
    "Product Name": "Pen (₹ 5) (2), Notebook (₹ 10) (1)",
    "Corporate Name": "John Doe",
    "Corporate ID": "johndoe123",
    Price: "₹ 0.00",
    "Current Status": "Delivered",
    "Payment Status": "Paid",
  },
]);

  });

  it("should return an empty array when no orders are found", async () => {
    orders.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await ordersExport(
      { from: "2024-01-01", to: "2024-01-31", searchText: "", sort: "DESC", sortField: "transactionDate" },
      null
    );

    expect(result).toEqual([]);
  });

  it("should handle errors gracefully", async () => {
    orders.findAndCountAll.mockRejectedValue(new Error("Database error"));

    await expect(
      ordersExport({ from: "2024-01-01", to: "2024-01-31", searchText: "", sort: "DESC", sortField: "transactionDate" }, null)
    ).rejects.toEqual({ message: "Something went wrong" });
  });
});
