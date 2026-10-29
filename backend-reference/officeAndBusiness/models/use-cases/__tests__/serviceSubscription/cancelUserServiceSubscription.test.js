const ServiceSubscription = require("../../../entities/serviceSubscription");
const { cancelUserServiceSubscription } = require("../../serviceSubscription");

jest.mock("../../../entities/serviceSubscription", () => ({
  update: jest.fn(),
}));

describe("cancelUserServiceSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {}); 
  });

  it("should cancel subscription with correct params and return success", async () => {
    const params = { subscriptionId: 11, corporateId: 99 };
    ServiceSubscription.update.mockResolvedValue([1]);

    const result = await cancelUserServiceSubscription(params);

    expect(ServiceSubscription.update).toHaveBeenCalledWith(
      { isCancelled: true },
      {
        where: {
          id: 11,
          corporateUserId: 99,
        },
      }
    );

    expect(result).toEqual({
      success: true,
      message: "Subscription cancelled successfully.",
    });
  });

  it("should return success even if update returns [0] (nothing updated)", async () => {
    ServiceSubscription.update.mockResolvedValue([0]);

    const result = await cancelUserServiceSubscription({
      subscriptionId: 55,
      corporateId: 88,
    });

    expect(result).toEqual({
      success: true,
      message: "Subscription cancelled successfully.",
    });
  });

  it("should return failure object when update throws an error", async () => {
    ServiceSubscription.update.mockRejectedValue(
      new Error("DB exploded")
    );

    const result = await cancelUserServiceSubscription({
      subscriptionId: 33,
      corporateId: 44,
    });

    expect(console.error).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      message: "Something went wrong.",
    });
  });

  it("should call update exactly once", async () => {
    ServiceSubscription.update.mockResolvedValue([1]);

    await cancelUserServiceSubscription({
      subscriptionId: 999,
      corporateId: 123,
    });

    expect(ServiceSubscription.update).toHaveBeenCalledTimes(1);
  });

it("should handle missing required fields gracefully and not throw", async () => {
  ServiceSubscription.update.mockResolvedValue([1]);

  const result = await cancelUserServiceSubscription({});

  expect(result).toEqual({
    success: true,
    message: "Subscription cancelled successfully.",
  });
});

it("should return failure object when params is undefined", async () => {
  ServiceSubscription.update.mockResolvedValue([1]);

  const result = await cancelUserServiceSubscription(undefined);

  expect(result).toEqual({
    success: false,
    message: "Something went wrong.",
  });
});

});
