const SubscriptionCoupons = require('../../../entities/pekoCredits');
const UserSubscriptionCoupons = require('../../../entities/userCoupons');
const { findAllUserCoupons } = require('../../userCoupons');

jest.mock('../../../entities/pekoCredits', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../entities/userCoupons', () => ({
  findAll: jest.fn(),
}));

describe("findAllUserCoupons", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return all matched coupons with nested couponData", async () => {
    const mockResponse = [
      {
        id: 1,
        corporateUserId: 10,
        status: "UNCLAIMED",
        expiryDate: "2025-01-01",
        couponData: {
          id: 5,
          discountType: "PERCENT",
          discount: 20,
          minimumPurchase: 100,
          maximumDiscount: 50,
        },
      },
    ];

    UserSubscriptionCoupons.findAll.mockResolvedValue(mockResponse);

    const result = await findAllUserCoupons(10, 99);

    expect(UserSubscriptionCoupons.findAll).toHaveBeenCalledWith({
      where: { corporateUserId: 10 },
      include: [
        {
          model: SubscriptionCoupons,
          as: "couponData",
          attributes: [
            "id",
            "discountType",
            "discount",
            "minimumPurchase",
            "maximumDiscount",
          ],
          where: { status: "ACTIVE", partnerId: 99 },
        },
      ],
      order: [
        ["status", "ASC"],
        ["expiryDate", "ASC"],
      ],
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResponse);
  });

  it("should return an empty array when no coupons are found", async () => {
    UserSubscriptionCoupons.findAll.mockResolvedValue([]);

    const result = await findAllUserCoupons(20, 88);

    expect(result).toEqual([]);
    expect(UserSubscriptionCoupons.findAll).toHaveBeenCalled();
  });

  it("should return false when findAll throws an error", async () => {
    UserSubscriptionCoupons.findAll.mockRejectedValue(new Error("DB failed"));

    const result = await findAllUserCoupons(10, 99);

    expect(result).toBe(false);
  });

  it("should correctly pass include with filtering partnerId + ACTIVE status", async () => {
    UserSubscriptionCoupons.findAll.mockResolvedValue([]);

    await findAllUserCoupons(10, 55);

    const callArgs = UserSubscriptionCoupons.findAll.mock.calls[0][0];

    expect(callArgs.include[0].where).toEqual({
      status: "ACTIVE",
      partnerId: 55,
    });
  });

  it("should sort by status and expiry date", async () => {
    UserSubscriptionCoupons.findAll.mockResolvedValue([]);

    await findAllUserCoupons(44, 11);

    expect(UserSubscriptionCoupons.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [
          ["status", "ASC"],
          ["expiryDate", "ASC"],
        ],
      })
    );
  });
});
