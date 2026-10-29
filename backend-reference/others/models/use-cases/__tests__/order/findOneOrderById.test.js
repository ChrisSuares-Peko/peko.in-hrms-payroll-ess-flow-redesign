const { findOneOrderById } = require("../../../use-cases/order");
const order = require("../../../entities/order");

jest.mock("../../../entities/order", () => ({
  findOne: jest.fn(),
}));

describe("findOneOrderById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the order when found", async () => {
    const mockId = 1;
    const mockOrder = { id: 1, status: "Completed" };

    order.findOne.mockResolvedValue(mockOrder); // Simulating the order being found

    const result = await findOneOrderById(mockId);

    expect(order.findOne).toHaveBeenCalledWith({
      where: {
        id: mockId,
      },
    });
    expect(result).toEqual(mockOrder); // Ensure the correct order is returned
  });

  it("should return null if no order is found", async () => {
    const mockId = 1;

    order.findOne.mockResolvedValue(null); // Simulating no order found

    const result = await findOneOrderById(mockId);

    expect(order.findOne).toHaveBeenCalledWith({
      where: {
        id: mockId,
      },
    });
    expect(result).toBeNull(); // Ensure null is returned when no order is found
  });

  it("should handle errors gracefully", async () => {
    const mockId = 1;

    // Simulating an error in the findOne method
    order.findOne.mockRejectedValue(new Error("Database Error"));

    const result = await findOneOrderById(mockId);

    // Expect no result since the method failed, and error is handled internally
    expect(result).toBeUndefined();
    expect(order.findOne).toHaveBeenCalledWith({
      where: {
        id: mockId,
      },
    });
  });

  it("should call the finally block after attempting to find the order", async () => {
    const mockId = 1;

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    order.findOne.mockResolvedValue({ id: 1, status: "Processing" }); // Simulating order found

    await findOneOrderById(mockId);

    // Ensure the finally block is executed
    expect(consoleLogSpy).toHaveBeenCalledWith("ORDER FIND ONE ROUTE CALLED");

    consoleLogSpy.mockRestore(); // Clean up the spy
  });
});
