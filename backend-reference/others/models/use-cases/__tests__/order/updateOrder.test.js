const { updateOrder } = require("../../../use-cases/order");
const order = require("../../../entities/order");

jest.mock("../../../entities/order", () => ({
  update: jest.fn(),
}));

describe("updateOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update the order successfully", async () => {
    const mockParams = { id: 1 };
    const mockData = { status: "Completed" };

    order.update.mockResolvedValue([1]); // Simulating a successful update

    const result = await updateOrder(mockParams, mockData);

    expect(order.update).toHaveBeenCalledWith(mockData, {
      where: {
        id: mockParams.id,
      },
    });
    expect(result).toEqual([1]); // Return value of the update method is an array with the count of affected rows
  });

  it("should handle errors gracefully", async () => {
    const mockParams = { id: 1 };
    const mockData = { status: "Failed" };

    // Simulating an error in the update method
    order.update.mockRejectedValue(new Error("Database Error"));

    const result = await updateOrder(mockParams, mockData);

    // Expect no result since the update failed, and it should handle errors internally
    expect(result).toBeUndefined();
    expect(order.update).toHaveBeenCalledWith(mockData, {
      where: {
        id: mockParams.id,
      },
    });
  });

  it("should call the finally block after attempting to update", async () => {
    const mockParams = { id: 1 };
    const mockData = { status: "Processing" };

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    order.update.mockResolvedValue([1]); // Simulating a successful update

    await updateOrder(mockParams, mockData);

    // Ensure the final block is called
    expect(consoleLogSpy).toHaveBeenCalledWith("Update route called");

    consoleLogSpy.mockRestore(); // Clean up the spy
  });
});
