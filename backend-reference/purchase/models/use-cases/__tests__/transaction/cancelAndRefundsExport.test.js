const { Op } = require("sequelize");
const { cancelAndRefundsExport } = require("../../../use-cases/transaction");
const orders = require("../../../entities/order");
const { handleSortFields } = require("../../../../utils/sortHandle");

jest.mock("../../../entities/order", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../../utils/sortHandle", () => ({
  handleSortFields: jest.fn(),
}));

jest.mock("../../../../utils/formatter", () => ({
  formatNumberWithLocalString: jest.fn((num) => num.toString()),
  formattedDateTime: jest.fn((date) => date.toISOString()),
}));

describe("cancelAndRefundsExport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch orders, process them, and return formatted data", async () => {
    const mockParams = {
      from: "2024-01-01",
      to: "2024-01-31",
      searchText: "test",
      sort: "DESC",
      sortField: "transactionDate",
      status: "Pending",
    };

    const mockOrders = {
      count: 1,
      rows: [
        {
          transactionDate: new Date("2024-01-10"),
          orderResponse: JSON.stringify({
            products: [
              { productName: "Pen", totalPrice: 10, productQuantity: 2 },
            ],
          }),
          corporateTxnId: "12345",
          amountInINR: 100,
          ecomOrderStatus: "Pending",
          status: "Success",
          credential: { name: "John Doe", username: "johndoe" },
        },
      ],
    };

    orders.findAndCountAll.mockResolvedValue(mockOrders);
    handleSortFields.mockReturnValue([["transactionDate", "DESC"]]);

    const result = await cancelAndRefundsExport(mockParams);

    expect(orders.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspaceOrderStatus: { [Op.or]: ["Cancel Requested", "Cancel rejected"] },
          ecomOrderStatus: "Pending",
          transactionDate: expect.any(Object),
        }),
        order: [["transactionDate", "DESC"]],
        raw: true,
        nest: true,
      })
    );

    expect(result).toEqual([
      {
        "Transaction Date": expect.any(String),
        "Product Name": "Pen (₹ 10) (2)",
        "Corporate Name": "John Doe",
        "Corporate ID": "johndoe",
        Price: "₹ 0.00",
        "Current Status": "Pending",
        "Payment Status": "Success",
      },
    ]);
  });
});
