const UserCoupons = require("../../../entities/userCoupons");
const { findOneCoupon } = require("../../pekoCredits");

jest.mock("../../../entities/userCoupons");

jest.mock("../../../entities/corporateUser", () => ({
  hasOne: jest.fn(),
  hasMany: jest.fn(),
  belongsTo: jest.fn(),
}));

describe("findOneCoupon function", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return coupon details when a valid coupon exists", async () => {
    const mockCoupon = {
      id: 1,
      couponData: {
        id: 1,
        code: "TESTCOUPON",
        discountType: "FLAT",
        discount: 10.0,
        couponType: "SERVICES",
        minimumPurchase: 50.0,
        maximumDiscount: 100.0,
      },
    };

    UserCoupons.findOne.mockResolvedValue(mockCoupon);

    const result = await findOneCoupon("TESTCOUPON", 123, 456, 789, "");

    expect(UserCoupons.findOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      message: "Success",
      data: mockCoupon,
    });
  });

  it("should return coupon details when accessKey is 'gift_cards_combined'", async () => {
    const mockCoupon = {
      id: 2,
      couponData: {
        id: 2,
        code: "GIFTCARD123",
        discountType: "PERCENTAGE",
        discount: 20.0,
        couponType: "SUBSCRIPTION",
        minimumPurchase: 100.0,
        maximumDiscount: 200.0,
      },
    };

    UserCoupons.findOne.mockResolvedValue(mockCoupon);

    const result = await findOneCoupon("GIFTCARD123", 321, 654, 987, "gift_cards_combined");

    expect(UserCoupons.findOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      message: "Success",
      data: mockCoupon,
    });
  });

  it("should return success true with data=false when no coupon is found", async () => {
    UserCoupons.findOne.mockResolvedValue(false);

    const result = await findOneCoupon("INVALID", 123, 456, 789, "");

    expect(UserCoupons.findOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      message: "Success",
      data: false,
    });
  });

  it("should handle errors gracefully and return error response", async () => {
    const error = new Error("Database error");
    UserCoupons.findOne.mockRejectedValue(error);

    const result = await findOneCoupon("ERROR", 123, 456, 789, "");

    expect(UserCoupons.findOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: false,
      statusCode: 500,
      message: "Database error",
      error,
    });
  });
});
