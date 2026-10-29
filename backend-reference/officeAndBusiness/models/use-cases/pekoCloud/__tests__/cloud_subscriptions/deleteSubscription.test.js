const { deleteSubscription } = require("../../cloud_subscriptions");
const cloud_subscriptions = require("../../../../entities/pekoCloud/cloud_subscriptions");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock("../../../../entities/pekoCloud/cloud_subscriptions", () => ({
  findOne: jest.fn(),
  destroy: jest.fn(),
}));

describe("deleteSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully delete a subscription when it exists", async () => {
    const id = 1;

    const mockSubscription = { id: 1 };
    const deletedRowsCount = 1; // Indicates that one row was deleted

    cloud_subscriptions.findOne.mockResolvedValue(mockSubscription);
    cloud_subscriptions.destroy.mockResolvedValue(deletedRowsCount);

    const result = await deleteSubscription(id);

    expect(cloud_subscriptions.findOne).toHaveBeenCalledWith({
      where: { id },
    });
    expect(cloud_subscriptions.destroy).toHaveBeenCalledWith({
      where: { id: id },
    });
    expect(result).toEqual({ success: true, data: {} });
  });

  it("should return an error if the subscription does not exist", async () => {
    const id = 1;

    cloud_subscriptions.findOne.mockResolvedValue(null);

    const result = await deleteSubscription(id);

    expect(cloud_subscriptions.findOne).toHaveBeenCalledWith({
      where: { id },
    });
    expect(cloud_subscriptions.destroy).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "subscription is not existing with the given details",
    });
  });

  it("should handle cases where the delete operation affects no rows", async () => {
    const id = 1;

    const mockSubscription = { id: 1 };
    const deletedRowsCount = 0; // Indicates no rows were deleted

    cloud_subscriptions.findOne.mockResolvedValue(mockSubscription);
    cloud_subscriptions.destroy.mockResolvedValue(deletedRowsCount);

    const result = await deleteSubscription(id);

    expect(cloud_subscriptions.findOne).toHaveBeenCalledWith({
      where: { id },
    });
    expect(cloud_subscriptions.destroy).toHaveBeenCalledWith({
      where: { id: id },
    });
    expect(result).toEqual({
      success: false,
      error: "subscription is not existing with the given details",
    });
  });

  it("should handle database errors during findOne operation", async () => {
    const id = 1;

    const dbError = new Error("Database error");

    cloud_subscriptions.findOne.mockRejectedValue(dbError);

    const result = await deleteSubscription(id);

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });

  it("should handle database errors during destroy operation", async () => {
    const id = 1;

    const mockSubscription = { id: 1 };
    const dbError = new Error("Database error");

    cloud_subscriptions.findOne.mockResolvedValue(mockSubscription);
    cloud_subscriptions.destroy.mockRejectedValue(dbError);

    const result = await deleteSubscription(id);

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });

  it("should handle unexpected errors", async () => {
    const id = 1;

    const unexpectedError = new Error("Unexpected error");

    cloud_subscriptions.findOne.mockRejectedValue(unexpectedError);

    const result = await deleteSubscription(id);

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });
});
