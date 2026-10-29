const SubscriptionCoupons = require("../../../entities/pekoCredits");
const { create } = require("../../pekoCredits");

jest.mock("../../../entities/pekoCredits");

describe("create SubscriptionCoupon", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const validCouponData = {
    code: "DISCOUNT2024",
    discountType: "FLAT",
    billingType: "MONTHLY",
    discount: 50.0,
    status: "ACTIVE",
    expiryDays: 30,
    partnerId: "12345",
    couponType: "SUBSCRIPTION",
    minimumPurchase: 100.0,
    maximumDiscount: 500.0,
  };

  it("should create a subscription coupon successfully", async () => {
    SubscriptionCoupons.create.mockResolvedValue({ id: 1, ...validCouponData });

    const result = await create(validCouponData);

    expect(result).toEqual({ id: 1, ...validCouponData });
    expect(SubscriptionCoupons.create).toHaveBeenCalledWith(validCouponData);
  });

  it("should return error when coupon creation fails", async () => {
    SubscriptionCoupons.create.mockResolvedValue(null);

    const result = await create(validCouponData);

    expect(result).toBeNull();
    expect(SubscriptionCoupons.create).toHaveBeenCalledWith(validCouponData);
  });

it("should handle unexpected errors", async () => {
  SubscriptionCoupons.create.mockRejectedValue(new Error("Database error"));

  const result = await create(validCouponData);

  expect(result).toBe(false);
  expect(SubscriptionCoupons.create).toHaveBeenCalledWith(validCouponData);
});

});
