const { findOne } = require("../../pekoCredits");
const SubscriptionCoupons = require('../../../entities/pekoCredits');

const Package = require("../../../entities/package");

jest.mock('../../../entities/pekoCredits');
jest.mock("../../../entities/package");

describe("findOne function", () => {
  it("should return a coupon when found", async () => {
    const mockParams = { partnerId: "123", code: "DISCOUNT10" };
    const mockCoupon = {
      id: 1,
      code: "DISCOUNT10",
      partnerId: "123",
      discountType: "FLAT",
      discount: 10,
      status: "ACTIVE",
      Package: { id: 1, name: "Basic Package" },
    };

    SubscriptionCoupons.findOne.mockResolvedValue(mockCoupon);

    const result = await findOne(mockParams);
    expect(result).toEqual(mockCoupon);
    expect(SubscriptionCoupons.findOne).toHaveBeenCalledWith({
      where: { code: mockParams.code, partnerId: mockParams.partnerId },
      include: [{ model: Package }],
    });
  });

  it("should return null if no coupon is found", async () => {
    SubscriptionCoupons.findOne.mockResolvedValue(null);
    const result = await findOne({ partnerId: "999", code: "INVALID" });
    expect(result).toBeNull();
  });

    it("should return false if findOne throws an error", async () => {
    SubscriptionCoupons.findOne.mockRejectedValue(new Error("Database error"));

    const result = await findOne({ partnerId: "123", code: "DISCOUNT10" });

    expect(result).toBe(false);
  });
});
