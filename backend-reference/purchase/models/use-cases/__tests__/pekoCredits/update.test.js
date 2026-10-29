const { update } = require("../../pekoCredits");
const SubscriptionCoupons = require("../../../entities/pekoCredits");

jest.mock("../../../entities/pekoCredits", () => ({
  update: jest.fn(),
  findByPk: jest.fn(),
}));

jest.mock("../../../entities/userCoupons", () => ({
  update: jest.fn(),
}));

describe("update function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

 it("should update SubscriptionCoupons and return the updated record", async () => {
  const id = 1;
  const updates = { expiryDays: 30 };
  const updatedSubscriptionCoupon = { id, expiryDays: 30 };

  SubscriptionCoupons.update.mockResolvedValue([1]);
  SubscriptionCoupons.findByPk.mockResolvedValue(updatedSubscriptionCoupon);

  const result = await update(id, updates);

  expect(result).toEqual(updatedSubscriptionCoupon);
  expect(SubscriptionCoupons.update).toHaveBeenCalledWith(
    updates,
    expect.objectContaining({
      where: { id },
      transaction: expect.any(Object),
    })
  );
  expect(SubscriptionCoupons.findByPk).toHaveBeenCalledWith(id);
});


  it("should return false if the SubscriptionCoupons update fails", async () => {
    SubscriptionCoupons.update.mockResolvedValue([0]); // No update
    const result = await update(1, { expiryDays: 60 });
    expect(result).toBe(false);
  });
});
