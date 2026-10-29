const { findTotalCount } = require("../../cloud_subscriptions");
const cloud_subscriptions = require("../../../../entities/pekoCloud/cloud_subscriptions");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock("../../../../entities/pekoCloud/cloud_subscriptions", () => ({
  findAll: jest.fn(),
}));

describe("findTotalCount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return total count and total amount of subscriptions for a given credentialId", async () => {
    const credentialId = 1;
    const mockSubscriptions = [
      { amount: 100 },
      { amount: 200 },
      { amount: 300 }
    ];

    cloud_subscriptions.findAll.mockResolvedValue(mockSubscriptions);

    const result = await findTotalCount(credentialId);

    expect(cloud_subscriptions.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual({
      totalCount: mockSubscriptions.length,
      totalAmount: mockSubscriptions.reduce((sum, subscription) => sum + subscription.amount, 0),
    });
  });

  it("should return zero total count and total amount if no subscriptions are found", async () => {
    const credentialId = 1;

    cloud_subscriptions.findAll.mockResolvedValue([]);

    const result = await findTotalCount(credentialId);

    expect(cloud_subscriptions.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual({
      totalCount: 0,
      totalAmount: 0,
    });
  });

  it("should handle database errors during findAll operation", async () => {
    const credentialId = 1;
    const dbError = new Error("Database error");

    cloud_subscriptions.findAll.mockRejectedValue(dbError);

    const result = await findTotalCount(credentialId);

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });

  it("should handle unexpected errors", async () => {
    const credentialId = 1;
    const unexpectedError = new Error("Unexpected error");

    cloud_subscriptions.findAll.mockRejectedValue(unexpectedError);

    const result = await findTotalCount(credentialId);

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });
});
