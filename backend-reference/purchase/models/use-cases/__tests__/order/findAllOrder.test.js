const order = require("../../../entities/order");
const { findAllOrder } = require("../../order");

jest.mock("../../../entities/order", () => ({
  findAll: jest.fn(),
}));

describe("findAllOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {}); // Mock console.log
  });

  it("should find and return all matching orders successfully", async () => {
    const mockParams = { orderId: "ORDER123" };
    const mockResponse = [
      { id: 1, orderId: "ORDER123", amount: 100 },
      { id: 2, orderId: "ORDER123", amount: 200 },
    ];

    order.findAll.mockResolvedValue(mockResponse);

    const result = await findAllOrder(mockParams);

    expect(order.findAll).toHaveBeenCalledWith({
      where: { orderId: mockParams.orderId },
    });
    expect(result).toEqual(mockResponse);
    expect(console.log).toHaveBeenCalledWith("ORDER FIND ALL ROUTE CALLED");
  });

  it("should return an empty array if no orders are found", async () => {
    const mockParams = { orderId: "ORDER_NOT_FOUND" };

    order.findAll.mockResolvedValue([]);

    const result = await findAllOrder(mockParams);

    expect(order.findAll).toHaveBeenCalledWith({
      where: { orderId: mockParams.orderId },
    });
    expect(result).toEqual([]);
    expect(console.log).toHaveBeenCalledWith("ORDER FIND ALL ROUTE CALLED");
  });

  it("should return undefined and log an error when findAll fails", async () => {
    const mockParams = { orderId: "ORDER_ERROR" };
    const mockError = new Error("Database query failed");

    order.findAll.mockRejectedValue(mockError);

    const result = await findAllOrder(mockParams);

    expect(order.findAll).toHaveBeenCalledWith({
      where: { orderId: mockParams.orderId },
    });
    expect(console.log).toHaveBeenCalledWith(mockError);
    expect(console.log).toHaveBeenCalledWith("ORDER FIND ALL ROUTE CALLED");
    expect(result).toBeUndefined();
  });
});
