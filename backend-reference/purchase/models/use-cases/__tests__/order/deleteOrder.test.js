const order = require("../../../entities/order");
const { deleteOrder } = require("../../order");

jest.mock("../../../entities/order", () => ({
  destroy: jest.fn(),
}));

describe("deleteOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {}); // Mock console.log
  });

  it("should delete an order successfully and return affected rows count", async () => {
    const mockParams = { orderId: "ORDER123" };
    const mockResponse = 1; // Sequelize destroy() returns the number of deleted rows

    order.destroy.mockResolvedValue(mockResponse);

    const result = await deleteOrder(mockParams);

    expect(order.destroy).toHaveBeenCalledWith({
      where: { orderId: mockParams.orderId },
    });
    expect(result).toEqual(mockResponse);
    expect(console.log).toHaveBeenCalledWith("ORDER DELETE ROUTE CALLED");
  });

  it("should return 0 when no matching order is found", async () => {
    const mockParams = { orderId: "ORDER_NOT_FOUND" };

    order.destroy.mockResolvedValue(0); // 0 means no rows were deleted

    const result = await deleteOrder(mockParams);

    expect(order.destroy).toHaveBeenCalledWith({
      where: { orderId: mockParams.orderId },
    });
    expect(result).toEqual(0);
    expect(console.log).toHaveBeenCalledWith("ORDER DELETE ROUTE CALLED");
  });

  it("should return undefined and log an error when deletion fails", async () => {
    const mockParams = { orderId: "ORDER_ERROR" };
    const mockError = new Error("Database delete failed");

    order.destroy.mockRejectedValue(mockError);

     await deleteOrder(mockParams);

    expect(order.destroy).toHaveBeenCalledWith({
      where: { orderId: mockParams.orderId },
    });
    expect(console.log).toHaveBeenCalledWith("ORDER DELETE ROUTE CALLED");
  });
});
