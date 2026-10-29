const { getRenewalSubscriptions } = require("../../cloud_taskToDo");
const cloud_subscriptions = require("../../../../entities/pekoCloud/cloud_subscriptions");

jest.mock("../../../../entities/pekoCloud/cloud_subscriptions", () => ({
  findAll: jest.fn(),
}));
jest.mock("../../../../../utils/dateUtils", () => ({
  humanReadableDate: jest
    .fn()
    .mockImplementation((date) => new Date(date).toLocaleDateString()),
}));

describe("getRenewalSubscriptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a list of subscriptions due for renewal (Monthly)", async () => {
    const credentialId = 1;
    const today = new Date();
    const pastMonthlyDate = new Date(today);
    pastMonthlyDate.setMonth(today.getMonth() - 1); // Set the date to one month ago
  
    const formattedDate = today.toLocaleDateString();
  
    const subscriptions = [
      {
        subscriptionName: "Basic Plan",
        billingStartDate: pastMonthlyDate.toISOString(),
        billingCycle: "Monthly",
      },
      {
        subscriptionName: "Premium Plan",
        billingStartDate: pastMonthlyDate.toISOString(),
        billingCycle: "Monthly",
      },
    ];
  
    cloud_subscriptions.findAll.mockResolvedValue(subscriptions);
  
    const result = await getRenewalSubscriptions(credentialId);
  
    expect(cloud_subscriptions.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual([
      {
        billingCycle: "Monthly",
        subscriptionName: "Basic Plan",
        renewalDate: formattedDate,
        details: JSON.stringify(subscriptions[0]),
      },
      {
        billingCycle: "Monthly",
        subscriptionName: "Premium Plan",
        renewalDate: formattedDate,
        details: JSON.stringify(subscriptions[1]),
      },
    ]);
  });
  

  it("should return a list of subscriptions due for renewal (Yearly)", async () => {
    const credentialId = 1;
    const today = new Date();
    const pastYearlyDate = new Date(today);
    pastYearlyDate.setFullYear(today.getFullYear() - 1); // 1 year ago

    const formattedDate = today.toLocaleDateString();

    const subscriptions = [
      {
        subscriptionName: "Standard Plan",
        billingStartDate: pastYearlyDate.toISOString(),
        billingCycle: "Yearly",
      },
    ];

    cloud_subscriptions.findAll.mockResolvedValue(subscriptions);

    const result = await getRenewalSubscriptions(credentialId);

    expect(cloud_subscriptions.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual([
      {
        billingCycle: "Yearly",
        subscriptionName: "Standard Plan",
        renewalDate: formattedDate,
        details: JSON.stringify(subscriptions[0]),
      },
    ]);
  });

  it("should exclude subscriptions that start today", async () => {
    const credentialId = 1;
    const today = new Date();

    const subscriptions = [
      {
        subscriptionName: "Daily Plan",
        billingStartDate: today.toISOString(),
        billingCycle: "Monthly",
      },
    ];

    cloud_subscriptions.findAll.mockResolvedValue(subscriptions);

    const result = await getRenewalSubscriptions(credentialId);

    expect(cloud_subscriptions.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should handle subscriptions with no billing start date", async () => {
    const credentialId = 1;
    
    const subscriptions = [
      {
        subscriptionName: "Unknown Plan",
        billingStartDate: null,
        billingCycle: "Monthly",
      },
    ];

    cloud_subscriptions.findAll.mockResolvedValue(subscriptions);

    const result = await getRenewalSubscriptions(credentialId);

    expect(cloud_subscriptions.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should return an empty array if there are no subscriptions for the given credentialId", async () => {
    const credentialId = 1;

    cloud_subscriptions.findAll.mockResolvedValue([]);

    const result = await getRenewalSubscriptions(credentialId);

    expect(cloud_subscriptions.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should handle errors during the findAll operation", async () => {
    const credentialId = 1;
    const dbError = new Error("Database error");

    cloud_subscriptions.findAll.mockRejectedValue(dbError);

    const result = await getRenewalSubscriptions(credentialId);

    expect(result).toEqual(dbError);
  });

  it("should handle unexpected errors", async () => {
    const credentialId = 1;
    const unexpectedError = new Error("Unexpected error");

    cloud_subscriptions.findAll.mockRejectedValue(unexpectedError);

    const result = await getRenewalSubscriptions(credentialId);

    expect(result).toEqual(unexpectedError);
  });
});
