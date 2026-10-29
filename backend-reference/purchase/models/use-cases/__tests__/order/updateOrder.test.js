const order = require("../../../entities/order");
const { updateOrder } = require("../../../use-cases/order");

jest.mock("../../../entities/order", () => ({
  update: jest.fn(),
}));

describe("updateOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call order.update with correct parameters and return the result", async () => {
    const mockParams = { id: 1 };
    const mockData = { status: "Completed" };
    const mockResponse = [1]; // Sequelize update() returns an array with the number of affected rows

    order.update.mockResolvedValue(mockResponse);

    const result = await updateOrder(mockParams, mockData);

    expect(order.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });
    expect(result).toEqual(mockResponse);
  });

  it("should handle errors and log them", async () => {
    const mockParams = { id: 1 };
    const mockData = { status: "Completed" };
    const mockError = new Error("Database update failed");

    order.update.mockRejectedValue(mockError);
    console.log = jest.fn(); // Mock console.log

    const result = await updateOrder(mockParams, mockData);

    expect(order.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });
    expect(console.log).toHaveBeenCalledWith(mockError);
    expect(result).toBeUndefined();
  });

  it("should log 'Update route called' in the finally block", async () => {
    const mockParams = { id: 1 };
    const mockData = { status: "Completed" };

    order.update.mockResolvedValue([1]);
    console.log = jest.fn();

    await updateOrder(mockParams, mockData);

    expect(console.log).toHaveBeenCalledWith("Update route called");
  });
});
