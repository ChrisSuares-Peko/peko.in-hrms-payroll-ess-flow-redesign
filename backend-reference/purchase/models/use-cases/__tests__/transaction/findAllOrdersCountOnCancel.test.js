const { Op } = require("sequelize");
const {findAllOrdersCountOnCancel} = require("../../../use-cases/transaction");
const serviceOperator = require("../../../entities/serviceOperator");
const orders = require("../../../entities/order");
const {handleSortFields} = require("../../../../utils/sortHandle"); // Adjust path

jest.mock("../../../entities/order", () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock("../../../../utils/sortHandle", () =>({ handleSortFields: jest.fn()})) 


describe("findAllOrdersCountOnCancel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch orders with correct conditions and return results", async () => {
    const mockParams = {
      start: 0,
      from: "2024-01-01",
      to: "2024-01-31",
      length: 10,
      searchText: "test",
      sort: "DESC",
      sortField: "transactionDate",
      status: "Pending",
    };

    const mockOrders = {
      count: 2,
      rows: [
        {
          id: 1,
          transactionDate: "2024-01-02",
          amountInINR: 100,
          ecomOrderStatus: "Pending",
          status: "Success",
          corporateTxnId: "12345",
          workspaceOrderStatus: "Cancel Requested",
          paymentMode: "Credit Card",
          credential: { name: "John Doe", username: "johndoe" },
        },
      ],
    };

    orders.findAndCountAll.mockResolvedValue(mockOrders);
    handleSortFields.mockReturnValue([["transactionDate", "DESC"]]); // Mock sorting function

    const result = await findAllOrdersCountOnCancel(mockParams);

    expect(orders.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspaceOrderStatus: { [Op.or]: ["Cancel Requested", "Cancel rejected"] },
          ecomOrderStatus: "Pending",
          transactionDate: expect.objectContaining({
            [Op.between]: [expect.any(Date), expect.any(Date)],
          }),
        }),
        order: [["transactionDate", "DESC"]], // Ensure order is being applied
        limit: 10,
        offset: 0,
        raw: true,
        nest: true,
      })
    );

    expect(result).toEqual(mockOrders);
  });

  it("should return results with service category filter", async () => {
    const mockParams = {
      start: 0,
      length: 5,
      sort: "ASC",
      sortField: "id",
      status: "Success",
      searchText: "filter",
    };

    const mockOrders = { count: 1, rows: [{ id: 2, workspaceOrderStatus: "Cancel rejected" }] };

    orders.findAndCountAll.mockResolvedValue(mockOrders);

    const result = await findAllOrdersCountOnCancel(mockParams);

    expect(orders.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({
            model: serviceOperator,
            attributes: ["serviceProvider"],
            where: { serviceCategory: "Office Supplies" },
          }),
        ]),
      })
    );

    expect(result).toEqual(mockOrders);
  });

  it("should handle errors and throw an exception", async () => {
    orders.findAndCountAll.mockRejectedValue(new Error("DB Error"));

    await expect(findAllOrdersCountOnCancel({})).rejects.toEqual({
      message: "Something went wrong",
    });

    expect(orders.findAndCountAll).toHaveBeenCalled();
  });
});
