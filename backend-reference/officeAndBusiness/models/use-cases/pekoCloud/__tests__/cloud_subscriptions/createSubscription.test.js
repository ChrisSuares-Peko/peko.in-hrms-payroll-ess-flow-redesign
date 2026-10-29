const { createSubscription } = require("../../cloud_subscriptions");
const cloud_subscriptions = require("../../../../entities/pekoCloud/cloud_subscriptions");
const ErrorResponse = require("../../../../../utils/error-response");
const { Op } = require("sequelize");

jest.mock("../../../../entities/pekoCloud/cloud_subscriptions", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

describe("createSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully create a subscription", async () => {
    const data = {
      subscriptionName: "New Subscription",
      credentialId: 1,
      planDetails: "Basic Plan",
      billingCycle: "Monthly",
      billingStartDate: "2024-08-01",
      numberOfDevices: 10,
      amount: 100,
      assignTo: [],
      status: "Active",
    };

    cloud_subscriptions.findOne.mockResolvedValue(null); // No existing subscription
    cloud_subscriptions.create.mockResolvedValue(data); // Successful creation

    const result = await createSubscription(data);

    expect(cloud_subscriptions.findOne).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          {
            subscriptionName: data.subscriptionName,
            credentialId: data.credentialId,
          },
        ],
      },
    });
    expect(cloud_subscriptions.create).toHaveBeenCalledWith(data);
    expect(result).toEqual({ success: true, data });
  });

  it("should return an error if the subscription already exists", async () => {
    const data = {
      subscriptionName: "Existing Subscription",
      credentialId: 1,
    };

    const existingSubscription = { id: 1, ...data };
    
    cloud_subscriptions.findOne.mockResolvedValue(existingSubscription); // Subscription exists

    const result = await createSubscription(data);

    expect(cloud_subscriptions.findOne).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          {
            subscriptionName: data.subscriptionName,
            credentialId: data.credentialId,
          },
        ],
      },
    });
    expect(cloud_subscriptions.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Subscriptions with this name already exists.",
    });
  });

  it("should return an error if subscription creation fails", async () => {
    const data = {
      subscriptionName: "New Subscription",
      credentialId: 1,
    };

    cloud_subscriptions.findOne.mockResolvedValue(null); // No existing subscription
    cloud_subscriptions.create.mockRejectedValue(new Error("Creation failed")); // Creation fails

    const result = await createSubscription(data);

    expect(cloud_subscriptions.findOne).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          {
            subscriptionName: data.subscriptionName,
            credentialId: data.credentialId,
          },
        ],
      },
    });
    expect(cloud_subscriptions.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });

  it("should handle unexpected errors", async () => {
    const data = {
      subscriptionName: "New Subscription",
      credentialId: 1,
    };

    cloud_subscriptions.findOne.mockRejectedValue(new Error("Unexpected error")); // Unexpected error

    const result = await createSubscription(data);

    expect(cloud_subscriptions.findOne).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          {
            subscriptionName: data.subscriptionName,
            credentialId: data.credentialId,
          },
        ],
      },
    });
    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });
});
