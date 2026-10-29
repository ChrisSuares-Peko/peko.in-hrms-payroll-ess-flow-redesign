const payouts = require("../../../entities/payout");
const { createLeanPayout } = require("../../payout");

jest.mock("../../../entities/payout", () => ({
  create: jest.fn(),
}));

describe("createLeanPayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new payout successfully and return the result", async () => {
    const mockParams = { amount: 1000, currency: "USD", status: "Pending" };
    const mockResponse = { id: 1, ...mockParams };

    payouts.create.mockResolvedValue(mockResponse);

    const result = await createLeanPayout(mockParams);

    expect(payouts.create).toHaveBeenCalledWith(mockParams);
    expect(result).toEqual(mockResponse);
  });

  it("should throw an error if payout creation fails", async () => {
    const mockParams = { amount: 1000, currency: "USD", status: "Pending" };
    const mockError = new Error("Database error");

    payouts.create.mockRejectedValue(mockError);

    await expect(createLeanPayout(mockParams)).rejects.toThrow("Database error");
    expect(payouts.create).toHaveBeenCalledWith(mockParams);
  });
});
