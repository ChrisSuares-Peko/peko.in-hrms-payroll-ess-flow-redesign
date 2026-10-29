const UserCoupons = require("../../../entities/userCoupons");
const { findOneCouponData } = require("../../pekoCredits");

jest.mock("../../../entities/userCoupons");

describe("findOneCouponData function", () => {
  it("should return coupon details when a valid coupon is found", async () => {
    const mockParams = {
      couponCode: "DISCOUNT10",
      corporateId: 1,
      partnerId: "123",
      packageId: 2, // Ensure packageId is not null
      serviceOperatorId: null,
      accessKey: "normal_access",
    };

    const mockCouponDetails = {
      couponData: {
        id: 1,
        code: "DISCOUNT10",
        discountType: "FLAT",
        discount: 10,
        minimumPurchase: 100,
        maximumDiscount: 50,
      },
    };

    UserCoupons.findOne.mockResolvedValue(mockCouponDetails);

    const result = await findOneCouponData(mockParams);
    expect(result).toEqual(mockCouponDetails.couponData);
  });

  it("should return false if no coupon is found", async () => {
    UserCoupons.findOne.mockResolvedValue(null);
    const result = await findOneCouponData({
      couponCode: "INVALID",
      corporateId: 1,
      partnerId: "123",
      packageId: 2, //  Ensure valid packageId
    });
    expect(result).toBe(false);
  });

  it("should handle errors gracefully and return false", async () => {
    UserCoupons.findOne.mockRejectedValue(new Error("Database error"));
    const result = await findOneCouponData({
      couponCode: "DISCOUNT10",
      corporateId: 1,
      partnerId: "123",
      packageId: 2, // Ensure valid packageId
    });
    expect(result).toBe(false);
  });
});
