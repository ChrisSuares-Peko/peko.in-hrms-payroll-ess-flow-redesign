const { Op } = require("sequelize");
const ServiceSubscription = require("../../../entities/serviceSubscription");
const Package = require("../../../entities/package");
const { findLastTerminatedByAccessCode, findLastExpiredByAccessCode } = require("../../serviceSubscription");

jest.mock("../../../entities/serviceSubscription", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../../entities/package", () => ({
  belongsTo: jest.fn(),
}));

describe("ServiceSubscription terminated/expired finders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("findLastTerminatedByAccessCode looks at EXPIRED and CANCELLED rows, newest period first", async () => {
    const mockResponse = { id: 3, status: "CANCELLED", package: { packageName: "Basic" } };
    ServiceSubscription.findOne.mockResolvedValue(mockResponse);

    const result = await findLastTerminatedByAccessCode(42, "ecommerce_store");

    expect(ServiceSubscription.findOne).toHaveBeenCalledWith({
      where: { credentialId: 42, status: { [Op.in]: ["EXPIRED", "CANCELLED"] } },
      include: [
        {
          model: Package,
          attributes: ["packageName", "accessCode"],
          where: { accessCode: "ecommerce_store" },
          required: true,
        },
      ],
      order: [["subscriptionEndDate", "DESC"]],
      attributes: undefined,
      raw: true,
      nest: true,
    });
    expect(result).toEqual(mockResponse);
  });

  it("findLastExpiredByAccessCode only looks at EXPIRED rows", async () => {
    ServiceSubscription.findOne.mockResolvedValue(null);

    const result = await findLastExpiredByAccessCode(42, "ecommerce_store");

    expect(ServiceSubscription.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { credentialId: 42, status: "EXPIRED" },
        order: [["subscriptionEndDate", "DESC"]],
      })
    );
    expect(result).toBeNull();
  });

  it("returns undefined when the query throws", async () => {
    ServiceSubscription.findOne.mockRejectedValue(new Error("DB Fail"));

    const result = await findLastTerminatedByAccessCode(42, "ecommerce_store");

    expect(result).toBeUndefined();
  });
});
