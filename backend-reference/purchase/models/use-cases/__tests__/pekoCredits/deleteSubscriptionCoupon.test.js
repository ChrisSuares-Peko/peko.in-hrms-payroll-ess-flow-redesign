const UserCoupons = require("../../../entities/userCoupons");
const SubscriptionCoupons = require("../../../entities/pekoCredits");
const sequelizeConfig = require("../../../../configs/database/index");
const { deleteSubscriptionCoupon } = require("../../pekoCredits");

jest.mock("../../../entities/userCoupons");
jest.mock("../../../entities/pekoCredits");
jest.mock("../../../../configs/database/index");

describe("deleteSubscriptionCoupon", () => {
  let transaction;

  beforeEach(() => {
    transaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    sequelizeConfig.transaction = jest.fn().mockResolvedValue(transaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should delete unclaimed UserCoupons and SubscriptionCoupon successfully", async () => {
    UserCoupons.destroy.mockResolvedValue(1);
    SubscriptionCoupons.destroy.mockResolvedValue(1);

    const result = await deleteSubscriptionCoupon(1);

    expect(result).toBe(true);
    expect(UserCoupons.destroy).toHaveBeenCalledWith({ where: { couponId: 1, status: "UNCLAIMED" }, transaction });
    expect(SubscriptionCoupons.destroy).toHaveBeenCalledWith({ where: { id: 1 }, transaction });
    expect(transaction.commit).toHaveBeenCalled();
  });

  it("should rollback transaction if SubscriptionCoupon is not deleted", async () => {
    UserCoupons.destroy.mockResolvedValue(1);
    SubscriptionCoupons.destroy.mockResolvedValue(0);

    const result = await deleteSubscriptionCoupon(1);

    expect(result).toBe(false);
    expect(transaction.rollback).toHaveBeenCalled();
  });

  it("should handle errors and rollback transaction", async () => {
    UserCoupons.destroy.mockRejectedValue(new Error("Database error"));

    const result = await deleteSubscriptionCoupon(1);

    expect(result).toBe(false);
    expect(transaction.rollback).toHaveBeenCalled();
  });
});
