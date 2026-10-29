const Package = require("../../../entities/package");
const { findPackageByAccessCode } = require("../../subscription");

describe("Subscription findPackageByAccessCode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists active packages for the access code and partner ordered by priority, including externalId", async () => {
    const rows = [
      { id: 1, packageName: "Basic", externalId: "uuid-basic", priorityLevel: 1 },
      { id: 2, packageName: "Pro", externalId: "uuid-pro", priorityLevel: 2 },
    ];
    Package.findAll.mockResolvedValue(rows);

    const result = await findPackageByAccessCode("ecommerce_store", null);

    expect(Package.findAll).toHaveBeenCalledWith({
      where: { status: true, accessCode: "ecommerce_store", partnerId: null },
      attributes: ["id", "packageName", "packagePrices", "description", "discount", "priorityLevel", "externalId"],
      order: [["priorityLevel", "ASC"]],
      raw: true,
      nest: true,
    });
    expect(result).toEqual(rows);
  });

  it("passes the partnerId through", async () => {
    Package.findAll.mockResolvedValue([]);

    await findPackageByAccessCode("ecommerce_store", "4028");

    expect(Package.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: true, accessCode: "ecommerce_store", partnerId: "4028" } })
    );
  });

  it("returns false when the query throws", async () => {
    Package.findAll.mockRejectedValue(new Error("DB Fail"));

    const result = await findPackageByAccessCode("ecommerce_store", null);

    expect(result).toBe(false);
  });
});
