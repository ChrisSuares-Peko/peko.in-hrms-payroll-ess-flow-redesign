const { findOneById } = require("../../pekoCredits");
const SubscriptionCoupons = require('../../../entities/pekoCredits');
jest.mock("../../../entities/pekoCredits");

describe("findOneById function", () => {
  it("should return a coupon when found", async () => {
    const mockId = 1;
    const mockCoupon = {
      id: 1,
      code: "DISCOUNT10",
      partnerId: "123",
      discountType: "FLAT",
      discount: 10,
      status: "ACTIVE",
    };

    SubscriptionCoupons.findOne.mockResolvedValue(mockCoupon);

    const result = await findOneById(mockId);
    expect(result).toEqual(mockCoupon);
    expect(SubscriptionCoupons.findOne).toHaveBeenCalledWith({
      where: { id: mockId },
    });
  });

  it("should return null if no coupon is found", async () => {
    SubscriptionCoupons.findOne.mockResolvedValue(null);
    const result = await findOneById(999);
    expect(result).toBeNull();
  });

  it("should return false if findOne throws an error", async () => {
    SubscriptionCoupons.findOne.mockRejectedValue(new Error("Database error"));

    const result = await findOneById(1);

    expect(result).toBe(false);
  });
});
