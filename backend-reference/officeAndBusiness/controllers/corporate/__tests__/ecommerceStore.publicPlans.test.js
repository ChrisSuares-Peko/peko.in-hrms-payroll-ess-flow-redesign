const { findOne: findOneServiceOperator } = require("../../../models/use-cases/serviceOperator");
const { findPackageByAccessCode } = require("../../../models/use-cases/subscription");
const { getPublicSubscriptionPlans } = require("../ecommerceStore");

jest.mock("../../../models/use-cases/serviceOperator", () => ({ findOne: jest.fn() }));
jest.mock("../../../models/use-cases/subscription", () => ({ findPackageByAccessCode: jest.fn() }));
jest.mock("../../../models/use-cases/serviceSubscription", () => ({
  findActiveByAccessCode: jest.fn(),
  findLastTerminatedByAccessCode: jest.fn(),
  cancelUserServiceSubscription: jest.fn(),
}));
jest.mock("../../../models/entities/serviceSubscription", () => ({ update: jest.fn() }));
jest.mock("../../../utils/pekoEcomClient", () => ({ postTenantApi: jest.fn() }));
jest.mock("../../../utils/pekoEcomEvents", () => ({ fireSubscriptionCanceled: jest.fn() }));

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const plans = [{ id: 1, packageName: "Basic", externalId: "uuid-basic" }];

describe("getPublicSubscriptionPlans", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findOneServiceOperator.mockResolvedValue({ vendor: { optional3: "public-key" } });
    findPackageByAccessCode.mockResolvedValue(plans);
  });

  it("rejects requests without an API key", async () => {
    const res = mockRes();
    await getPublicSubscriptionPlans({ headers: {}, query: {} }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ responseCode: "002" }));
    expect(findPackageByAccessCode).not.toHaveBeenCalled();
  });

  it("returns 503 when no public key is configured on the vendor", async () => {
    findOneServiceOperator.mockResolvedValue({ vendor: { optional3: null } });
    const res = mockRes();

    await getPublicSubscriptionPlans({ headers: { "x-api-key": "anything" }, query: {} }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(503);
  });

  it("rejects a mismatched API key", async () => {
    const res = mockRes();

    await getPublicSubscriptionPlans({ headers: { "x-api-key": "wrong-key!" }, query: {} }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Invalid API key" }));
  });

  it("returns the plans for the default partner when the key matches", async () => {
    const res = mockRes();

    await getPublicSubscriptionPlans(
      { headers: { api_key: "public-key" }, query: { partnerId: "default" } },
      res,
      jest.fn()
    );

    expect(findOneServiceOperator).toHaveBeenCalledWith({ accessKey: "ecommerce_store" });
    expect(findPackageByAccessCode).toHaveBeenCalledWith("ecommerce_store", null);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: true, data: { packageDetails: plans }, responseCode: "000" })
    );
  });

  it("passes a real partnerId through", async () => {
    const res = mockRes();

    await getPublicSubscriptionPlans(
      { headers: { "x-api-key": "public-key" }, query: { partnerId: "4028" } },
      res,
      jest.fn()
    );

    expect(findPackageByAccessCode).toHaveBeenCalledWith("ecommerce_store", "4028");
  });

  it("returns 400 when no packages exist", async () => {
    findPackageByAccessCode.mockResolvedValue([]);
    const res = mockRes();

    await getPublicSubscriptionPlans({ headers: { "x-api-key": "public-key" }, query: {} }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
