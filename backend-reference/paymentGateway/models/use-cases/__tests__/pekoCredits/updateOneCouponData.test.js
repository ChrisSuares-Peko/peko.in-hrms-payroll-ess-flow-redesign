const UserCoupons = require("../../../entities/userCoupons");
const { updateOneCouponData } = require("../../pekoCredits");

jest.mock("../../../entities/userCoupons", () => ({
  update: jest.fn()
}));

describe("updateOneCouponData", () => {
  let couponData, corporateId, transaction, discountAmount;

  beforeEach(() => {
    couponData = { id: 10, name: "SUMMER10" };
    corporateId = 99;
    transaction = {};
    discountAmount = 50;
    jest.clearAllMocks();
  });

  test("claims only a coupon that is still UNCLAIMED", async () => {
    UserCoupons.update.mockResolvedValue([1]);

    const result = await updateOneCouponData({ couponData, corporateId, transaction, discountAmount });

    expect(UserCoupons.update).toHaveBeenCalledWith(
      {
        status: "CLAIMED",
        claimedAt: expect.any(Date),
        usedCouponData: { ...couponData, discountAmount }
      },
      {
        where: { couponId: couponData.id, corporateUserId: corporateId, status: "UNCLAIMED" },
        transaction
      }
    );
    expect(result.success).toBe(true);
  });

  test("reports failure when the coupon was already claimed by a concurrent payment", async () => {
    UserCoupons.update.mockResolvedValue([0]);

    const result = await updateOneCouponData({ couponData, corporateId, transaction, discountAmount });

    expect(result.success).toBe(false);
    expect(result.message).toBe("COUPON ALREADY CLAIMED");
  });

  test("reports failure when the update throws", async () => {
    UserCoupons.update.mockRejectedValue(new Error("DB Error"));

    const result = await updateOneCouponData({ couponData, corporateId, transaction, discountAmount });

    expect(result.success).toBe(false);
  });
});
