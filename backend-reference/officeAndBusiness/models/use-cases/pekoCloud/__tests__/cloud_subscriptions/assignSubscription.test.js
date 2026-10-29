const { assignSubscription } = require("../../cloud_subscriptions");
const cloud_subscriptions = require("../../../../entities/pekoCloud/cloud_subscriptions");

jest.mock("../../../../entities/pekoCloud/cloud_subscriptions", () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));

describe("assignSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully assign subscription data when the subscription exists", async () => {
    const assignData = {
      subscriptionId: 1,
      employeeName: "John Doe",
      id: 123,
    };
    const credentialId = 1;

    const mockSubscription = {
      id: 1,
      credentialId: 1,
      assignTo: [{ employeeName: "Jane Doe", id: 456 }],
    };
    const mockUpdateResult = [1]; // Indicates one row was updated

    cloud_subscriptions.findOne.mockResolvedValue(mockSubscription);
    cloud_subscriptions.update.mockResolvedValue(mockUpdateResult);

    const result = await assignSubscription(assignData, credentialId);

    expect(cloud_subscriptions.findOne).toHaveBeenCalledWith({
      where: {
        credentialId,
        id: assignData.subscriptionId,
      },
    });
    expect(cloud_subscriptions.update).toHaveBeenCalledWith(
      { assignTo: [...mockSubscription.assignTo] },
      {
        where: { id: assignData.subscriptionId, credentialId },
      }
    );
    expect(result).toEqual({ success: true, data: {} });
  });

  it("should return an error if the subscription does not exist", async () => {
    const assignData = {
      subscriptionId: 1,
      employeeName: "John Doe",
      id: 123,
    };
    const credentialId = 1;

    cloud_subscriptions.findOne.mockResolvedValue(null);

    const result = await assignSubscription(assignData, credentialId);

    expect(cloud_subscriptions.findOne).toHaveBeenCalledWith({
      where: {
        credentialId,
        id: assignData.subscriptionId,
      },
    });
    expect(cloud_subscriptions.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Subscription does not exist with the given details",
    });
  });

  it("should return an error if the update operation affects no rows", async () => {
    const assignData = {
      subscriptionId: 1,
      employeeName: "John Doe",
      id: 123,
    };
    const credentialId = 1;

    const mockSubscription = {
      id: 1,
      credentialId: 1,
      assignTo: [{ employeeName: "Jane Doe", id: 456 }],
    };
    const mockUpdateResult = [0]; // Indicates no rows were updated

    cloud_subscriptions.findOne.mockResolvedValue(mockSubscription);
    cloud_subscriptions.update.mockResolvedValue(mockUpdateResult);

    const result = await assignSubscription(assignData, credentialId);

    expect(cloud_subscriptions.findOne).toHaveBeenCalledWith({
      where: {
        credentialId,
        id: assignData.subscriptionId,
      },
    });
    expect(cloud_subscriptions.update).toHaveBeenCalledWith(
      { assignTo: [...mockSubscription.assignTo] },
      {
        where: { id: assignData.subscriptionId, credentialId },
      }
    );
    expect(result).toEqual({
      success: false,
      error: "Something went wrong while assigning",
    });
  });

  it("should handle database errors during findOne operation", async () => {
    const assignData = {
      subscriptionId: 1,
      employeeName: "John Doe",
      id: 123,
    };
    const credentialId = 1;

    const dbError = new Error("Database error");

    cloud_subscriptions.findOne.mockRejectedValue(dbError);

    const result = await assignSubscription(assignData, credentialId);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong, please try again later.",
    });
  });

  it("should handle database errors during update operation", async () => {
    const assignData = {
      subscriptionId: 1,
      employeeName: "John Doe",
      id: 123,
    };
    const credentialId = 1;

    const mockSubscription = {
      id: 1,
      credentialId: 1,
      assignTo: [{ employeeName: "Jane Doe", id: 456 }],
    };
    const dbError = new Error("Database error");

    cloud_subscriptions.findOne.mockResolvedValue(mockSubscription);
    cloud_subscriptions.update.mockRejectedValue(dbError);

    const result = await assignSubscription(assignData, credentialId);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong, please try again later.",
    });
  });

  it("should handle unexpected errors", async () => {
    const assignData = {
      subscriptionId: 1,
      employeeName: "John Doe",
      id: 123,
    };
    const credentialId = 1;

    const unexpectedError = new Error("Unexpected error");

    cloud_subscriptions.findOne.mockRejectedValue(unexpectedError);

    const result = await assignSubscription(assignData, credentialId);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong, please try again later.",
    });
  });
});
