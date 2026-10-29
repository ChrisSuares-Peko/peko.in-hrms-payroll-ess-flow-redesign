const { updateSubscription } = require("../../cloud_subscriptions");
const cloud_subscriptions = require("../../../../entities/pekoCloud/cloud_subscriptions");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock("../../../../entities/pekoCloud/cloud_subscriptions", () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));

describe("updateSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully update a subscription when it exists", async () => {
    const id = 1;
    const newData = { subscriptionName: "Updated Plan", amount: 150 };
    const credentialId = 1;

    const mockSubscription = { id: 1, credentialId: 1 };
    const mockUpdateResult = [1]; // Indicates one row was updated

    cloud_subscriptions.findOne.mockResolvedValue(mockSubscription);
    cloud_subscriptions.update.mockResolvedValue(mockUpdateResult);

    const result = await updateSubscription(id, newData, credentialId);

    expect(cloud_subscriptions.findOne).toHaveBeenCalledWith({
      where: { id, credentialId },
    });
    expect(cloud_subscriptions.update).toHaveBeenCalledWith(newData, {
      where: { id: id },
    });
    expect(result).toEqual({ success: true, data: {} });
  });

  it("should return an error if the subscription does not exist", async () => {
    const id = 1;
    const newData = { subscriptionName: "Updated Plan", amount: 150 };
    const credentialId = 1;

    cloud_subscriptions.findOne.mockResolvedValue(null);

    const result = await updateSubscription(id, newData, credentialId);

    expect(cloud_subscriptions.findOne).toHaveBeenCalledWith({
      where: { id, credentialId },
    });
    expect(cloud_subscriptions.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "subscription is not existing with the given details",
    });
  });

  it("should return an error if the update operation affects no rows", async () => {
    const id = 1;
    const newData = { subscriptionName: "Updated Plan", amount: 150 };
    const credentialId = 1;

    const mockSubscription = { id: 1, credentialId: 1 };
    const mockUpdateResult = [0]; // Indicates no rows were updated

    cloud_subscriptions.findOne.mockResolvedValue(mockSubscription);
    cloud_subscriptions.update.mockResolvedValue(mockUpdateResult);

    const result = await updateSubscription(id, newData, credentialId);

    expect(cloud_subscriptions.findOne).toHaveBeenCalledWith({
      where: { id, credentialId },
    });
    expect(cloud_subscriptions.update).toHaveBeenCalledWith(newData, {
      where: { id: id },
    });
    expect(result).toEqual({
      success: false,
      error: "something went wrong while updating the subscription",
    });
  });

  it("should handle database errors during findOne operation", async () => {
    const id = 1;
    const newData = { subscriptionName: "Updated Plan", amount: 150 };
    const credentialId = 1;

    const dbError = new Error("Database error");

    cloud_subscriptions.findOne.mockRejectedValue(dbError);

    const result = await updateSubscription(id, newData, credentialId);

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });

  it("should handle database errors during update operation", async () => {
    const id = 1;
    const newData = { subscriptionName: "Updated Plan", amount: 150 };
    const credentialId = 1;

    const mockSubscription = { id: 1, credentialId: 1 };
    const dbError = new Error("Database error");

    cloud_subscriptions.findOne.mockResolvedValue(mockSubscription);
    cloud_subscriptions.update.mockRejectedValue(dbError);

    const result = await updateSubscription(id, newData, credentialId);

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });

  it("should handle unexpected errors", async () => {
    const id = 1;
    const newData = { subscriptionName: "Updated Plan", amount: 150 };
    const credentialId = 1;

    const unexpectedError = new Error("Unexpected error");

    cloud_subscriptions.findOne.mockRejectedValue(unexpectedError);

    const result = await updateSubscription(id, newData, credentialId);

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });
});
