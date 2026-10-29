const ServiceSubscription = require("../../../entities/serviceSubscription");
const Package = require("../../../entities/package");
const { findActiveByAccessCode } = require("../../serviceSubscription");

jest.mock("../../../entities/serviceSubscription", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../../entities/package", () => ({
  belongsTo: jest.fn(),
}));

describe("ServiceSubscription findActiveByAccessCode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries the ACTIVE subscription scoped to the package accessCode", async () => {
    const mockResponse = { id: 7, package: { packageName: "Pro", accessCode: "ecommerce_store" } };
    ServiceSubscription.findOne.mockResolvedValue(mockResponse);

    const result = await findActiveByAccessCode(42, "ecommerce_store");

    expect(ServiceSubscription.findOne).toHaveBeenCalledWith({
      where: { credentialId: 42, status: "ACTIVE" },
      include: [
        {
          model: Package,
          attributes: ["packageName", "accessCode", "packagePrices", "discount"],
          where: { accessCode: "ecommerce_store" },
          required: true,
        },
      ],
      attributes: undefined,
      raw: true,
      nest: true,
    });
    expect(result).toEqual(mockResponse);
  });

  it("passes custom attributes through", async () => {
    ServiceSubscription.findOne.mockResolvedValue(null);

    await findActiveByAccessCode(42, "ecommerce_store", ["id", "isCancelled"]);

    expect(ServiceSubscription.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ attributes: ["id", "isCancelled"] })
    );
  });

  it("returns undefined when the query throws", async () => {
    ServiceSubscription.findOne.mockRejectedValue(new Error("DB Fail"));

    const result = await findActiveByAccessCode(42, "ecommerce_store");

    expect(result).toBeUndefined();
  });
});
