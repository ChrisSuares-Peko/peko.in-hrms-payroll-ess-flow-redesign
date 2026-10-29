const ServiceSubscription = require("../../../entities/serviceSubscription");
const Package = require("../../../entities/package");

const { findAndCountUserPlans } = require("../../serviceSubscription");

jest.mock("../../../entities/serviceSubscription", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../entities/package", () => ({
  belongsTo: jest.fn(),
}));

describe("findAndCountUserPlans", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should return plans with basic required filters", async () => {
    const params = {
      corporateId: 11,
      limit: 10,
      offset: 0,
    };

    const mockResponse = { rows: [], count: 0 };
    ServiceSubscription.findAndCountAll.mockResolvedValue(mockResponse);

    const result = await findAndCountUserPlans(params);

    expect(ServiceSubscription.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: Package,
          attributes: ["id", "packageName", "packageType", "description", "serviceList", "packageLogo"],
          where: {}, // no packageType filter
        },
      ],
      where: {
        corporateUserId: 11,
      },
      attributes: [
        "id",
        "subscriptionStartDate",
        "subscriptionEndDate",
        "subscriptionAmountPaid",
        "status",
        "billingType",
        "createdAt",
      ],
      limit: 10,
      offset: 0,
      order: [["createdAt", "DESC"]],
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResponse);
  });

  it("should apply status filter if provided", async () => {
    const params = {
      corporateId: 22,
      status: "ACTIVE",
      limit: 5,
      offset: 2,
    };

    ServiceSubscription.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAndCountUserPlans(params);

    expect(ServiceSubscription.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          corporateUserId: 22,
          status: "ACTIVE",
        },
      })
    );
  });

  it("should apply packageType filter if provided", async () => {
    const params = {
      corporateId: 55,
      packageType: "GROUP",
      limit: 20,
      offset: 10,
    };

    ServiceSubscription.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAndCountUserPlans(params);

    expect(ServiceSubscription.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [
          expect.objectContaining({
            where: { packageType: "GROUP" },
          }),
        ],
      })
    );
  });

  it("should return false when database throws error", async () => {
    ServiceSubscription.findAndCountAll.mockRejectedValue(new Error("DB FAIL"));

    const result = await findAndCountUserPlans({
      corporateId: 10,
      limit: 10,
      offset: 0,
    });

    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it("should correctly pass pagination", async () => {
    const params = {
      corporateId: 99,
      limit: 50,
      offset: 100,
    };

    ServiceSubscription.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAndCountUserPlans(params);

    expect(ServiceSubscription.findAndCountAll.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        limit: 50,
        offset: 100,
      })
    );
  });

  it("should correctly apply sorting", async () => {
    const params = {
      corporateId: 77,
      limit: 10,
      offset: 0,
    };

    ServiceSubscription.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAndCountUserPlans(params);

    expect(ServiceSubscription.findAndCountAll.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        order: [["createdAt", "DESC"]],
      })
    );
  });
});
