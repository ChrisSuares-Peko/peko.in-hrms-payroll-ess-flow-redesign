const order = require("../../../entities/order");
const { createOrder } = require("../../order");

jest.mock("../../../entities/order", () => ({
  create: jest.fn(),
}));

describe("createOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {}); // Mock console.log
  });

  it("should create an order successfully", async () => {
    const mockParams = { userId: 1, amount: 100, status: "Pending" };
    const mockResponse = { id: 1, ...mockParams };

    order.create.mockResolvedValue(mockResponse);

    const result = await createOrder(mockParams);

    expect(order.create).toHaveBeenCalledWith(mockParams);
    expect(result).toEqual(mockResponse);
    expect(console.log).toHaveBeenCalledWith("ORDER CREATE ROUTE CALLED");
  });

  it("should return undefined and log an error on failure", async () => {
    const mockParams = { userId: 1, amount: 100, status: "Pending" };
    const mockError = new Error("Database insertion failed");

    order.create.mockRejectedValue(mockError);

    const result = await createOrder(mockParams);

    expect(order.create).toHaveBeenCalledWith(mockParams);
    expect(console.log).toHaveBeenCalledWith(mockError.message);
    expect(console.log).toHaveBeenCalledWith("ORDER CREATE ROUTE CALLED");
    expect(result).toBeUndefined();
  });
});
