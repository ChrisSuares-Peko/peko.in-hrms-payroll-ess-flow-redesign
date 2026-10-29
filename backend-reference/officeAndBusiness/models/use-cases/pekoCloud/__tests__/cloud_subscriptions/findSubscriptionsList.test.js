const { findSubscriptionsList } = require("../../cloud_subscriptions");
const cloud_subscriptions = require("../../../../entities/pekoCloud/cloud_subscriptions");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock("../../../../entities/pekoCloud/cloud_subscriptions", () => ({
  findAndCountAll: jest.fn(),
}));

describe("findSubscriptionsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully retrieve subscriptions with `credentialId` filter", async () => {
    const credentialId = 1;
    const subCorporateUserId = null;
    
    const mockData = {
      count: 2,
      rows: [
        { id: 1, subscriptionName: "Basic Plan", amount: 100 },
        { id: 2, subscriptionName: "Advanced Plan", amount: 200 }
      ]
    };

    cloud_subscriptions.findAndCountAll.mockResolvedValue(mockData);

    const result = await findSubscriptionsList(credentialId, subCorporateUserId);

    expect(cloud_subscriptions.findAndCountAll).toHaveBeenCalledWith({
      where: {
        credentialId: credentialId,
      },
    });
    expect(result).toEqual({ success: true, data: mockData });
  });

  it("should successfully retrieve subscriptions with `subCorporateUserId` filter and clear `credentialId` filter", async () => {
    const credentialId = null;
    const subCorporateUserId = 2;
    
    const mockData = {
      count: 1,
      rows: [
        { id: 1, subscriptionName: "Enterprise Plan", amount: 300 }
      ]
    };

    cloud_subscriptions.findAndCountAll.mockResolvedValue(mockData);

    const result = await findSubscriptionsList(credentialId, subCorporateUserId);

    expect(cloud_subscriptions.findAndCountAll).toHaveBeenCalledWith({
      where: {
        subCorporateUserId: subCorporateUserId,
      },
    });
    expect(result).toEqual({ success: true, data: mockData });
  });

  it("should handle cases where neither `credentialId` nor `subCorporateUserId` is provided", async () => {
    const credentialId = null;
    const subCorporateUserId = null;
    
    const mockData = {
      count: 3,
      rows: [
        { id: 1, subscriptionName: "Plan A", amount: 150 },
        { id: 2, subscriptionName: "Plan B", amount: 250 },
        { id: 3, subscriptionName: "Plan C", amount: 350 }
      ]
    };

    cloud_subscriptions.findAndCountAll.mockResolvedValue(mockData);

    const result = await findSubscriptionsList(credentialId, subCorporateUserId);

    expect(cloud_subscriptions.findAndCountAll).toHaveBeenCalledWith({
      where: {},
    });
    expect(result).toEqual({ success: true, data: mockData });
  });

  it("should handle database errors", async () => {
    const credentialId = 1;
    const subCorporateUserId = null;
    
    const error = new Error("Database error");

    cloud_subscriptions.findAndCountAll.mockRejectedValue(error);

    const result = await findSubscriptionsList(credentialId, subCorporateUserId);

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });

  it("should handle unexpected errors", async () => {
    const credentialId = null;
    const subCorporateUserId = 2;
    
    const unexpectedError = new Error("Unexpected error");

    cloud_subscriptions.findAndCountAll.mockRejectedValue(unexpectedError);

    const result = await findSubscriptionsList(credentialId, subCorporateUserId);

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });
});
