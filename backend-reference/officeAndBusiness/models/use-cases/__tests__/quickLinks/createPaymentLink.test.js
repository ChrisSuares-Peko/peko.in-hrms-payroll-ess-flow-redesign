const quickLinks = require("../../../entities/quickLinks");
const { createPaymentLink } = require("../../quickLinks");

jest.mock("../../../entities/quickLinks", () => ({
  create: jest.fn(),
}));

describe("createPaymentLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {}); // silence logs
  });

  it("should create a payment link with correct params", async () => {
    const params = {
      credentialId: 10,
      amount: 500,
      description: "Test payment",
    };

    const mockResponse = { id: 1, ...params };
    quickLinks.create.mockResolvedValue(mockResponse);

    const result = await createPaymentLink(params);

    expect(quickLinks.create).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockResponse);
  });

  it("should return undefined and log error when create fails", async () => {
    const params = { amount: 100 };

    quickLinks.create.mockRejectedValue(new Error("DB failed"));

    const result = await createPaymentLink(params);

    expect(result).toBeUndefined();
    expect(console.log).toHaveBeenCalledWith("DB failed");
  });

  it("should always log the route message in finally block", async () => {
    quickLinks.create.mockResolvedValue({ id: 1 });

    await createPaymentLink({});

    expect(console.log).toHaveBeenCalledWith("PAYMENT LINKS CREATE ROUTE CALLED");
  });

  it("should not swallow thrown errors inside try (should not crash)", async () => {
    quickLinks.create.mockRejectedValue(new Error("Something bad"));

    const result = await createPaymentLink({});

    expect(result).toBeUndefined(); // since you don't rethrow
  });
});
