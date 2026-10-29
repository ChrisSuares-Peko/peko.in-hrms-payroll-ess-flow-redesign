const UserCoupons = require("../../../entities/userCoupons");
const { findOneCouponData } = require("../../pekoCredits");

jest.mock("../../../entities/userCoupons");
jest.mock("../../../entities/corporateUser", () => ({
  hasOne: jest.fn(),
  hasMany: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock("../../../entities/cart", () => ({
  hasOne: jest.fn(),
  hasMany: jest.fn(),
  belongsTo: jest.fn(),
}));


jest.mock("../../../entities/subscription", () => ({
  hasOne: jest.fn(),
  hasMany: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock("../../../entities/credential", () => ({
  hasOne: jest.fn(),
  hasMany: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock("../../../entities/packAge", () => ({
  hasOne: jest.fn(),
  hasMany: jest.fn(),
  belongsTo: jest.fn(),
}));


describe("findOneCouponData function", () => {
  it("should return coupon details when a valid coupon is found", async () => {
    const mockParams = {
      couponCode: "DISCOUNT10",
      corporateId: 1,
      partnerId: "123",
      packageId: 2,
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

    expect(result).toEqual({
      success: true,
      message: "Success",
      data: mockCouponDetails.couponData,
    });
  });

  it("should return an error response when no coupon is found", async () => {
    UserCoupons.findOne.mockResolvedValue(null);

    const result = await findOneCouponData({
      couponCode: "INVALID",
      corporateId: 1,
      partnerId: "123",
      packageId: 2,
    });

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
    expect(result.message).toContain("Cannot read properties of null");
  });

  it("should handle errors gracefully and return false", async () => {
    UserCoupons.findOne.mockRejectedValue(new Error("Database error"));

    const result = await findOneCouponData({
      couponCode: "DISCOUNT10",
      corporateId: 1,
      partnerId: "123",
      packageId: 2,
    });

    expect(result).toEqual({
      success: false,
      message: "Database error",
      error: new Error("Database error"),
      statusCode: 500,
    });
  });
});
