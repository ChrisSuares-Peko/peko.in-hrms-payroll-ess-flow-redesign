const ServiceSubscription = require("../../../entities/serviceSubscription");
const Package = require("../../../entities/package");
const { findOne } = require("../../serviceSubscription");

jest.mock("../../../entities/serviceSubscription", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../../entities/package", () => ({
  belongsTo: jest.fn(),
}));

describe("ServiceSubscription findOne", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  it("should fetch service subscription with correct params and include package", async () => {
    const params = { id: 1 };
    const mockResponse = {
      id: 1,
      package: { packageName: "Gold Pack", accessCode: "GOLD123" },
    };

    ServiceSubscription.findOne.mockResolvedValue(mockResponse);

    const result = await findOne(params);

    expect(ServiceSubscription.findOne).toHaveBeenCalledWith({
      where: params,
      include: [
        {
          model: Package,
          attributes: ["packageName", "accessCode"],
        },
      ],
      attributes: undefined,
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResponse);
  });

  it("should pass custom attributes when provided", async () => {
    const params = { serviceId: 88 };
    const attributes = ["serviceStatus", "expiryDate"];

    ServiceSubscription.findOne.mockResolvedValue({ serviceStatus: "ACTIVE" });

    await findOne(params, attributes);

    expect(ServiceSubscription.findOne).toHaveBeenCalledWith({
      where: params,
      include: [
        {
          model: Package,
          attributes: ["packageName", "accessCode"],
        },
      ],
      attributes,
      raw: true,
      nest: true,
    });
  });

  it("should return null if no subscription matches params", async () => {
    ServiceSubscription.findOne.mockResolvedValue(null);

    const result = await findOne({ id: 999 });

    expect(result).toBeNull();
  });

  it("should handle errors and return undefined", async () => {
    ServiceSubscription.findOne.mockRejectedValue(new Error("DB Fail"));

    const result = await findOne({ id: 10 });

    expect(result).toBeUndefined();
    expect(console.log).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should log final route message in all cases", async () => {
    ServiceSubscription.findOne.mockResolvedValue({});

    await findOne({ id: 1 });

    expect(console.log).toHaveBeenCalledWith("SERVICE SUBSCRIPTION FIND ONE ROUTE CALLED");
  });

  it("should handle missing params gracefully", async () => {
    ServiceSubscription.findOne.mockResolvedValue(null);

    const result = await findOne({}, ["serviceStatus"]);

    expect(result).toBeNull();
    expect(ServiceSubscription.findOne).toHaveBeenCalled();
  });
});
