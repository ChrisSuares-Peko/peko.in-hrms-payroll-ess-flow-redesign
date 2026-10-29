const { findCouponCodesByPartnerId } = require("../../../../models/use-cases/pekoCredits");
const PekoCredits = require("../../../entities/pekoCredits");

jest.mock("../../../entities/pekoCredits", () => ({
  findAll: jest.fn(),
}));

describe("findCouponCodesByPartnerId", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return coupon codes when found", async () => {
    const mockCoupons = [
      { id: 1, partnerId: 123, code: "COUPON123" },
      { id: 2, partnerId: 123, code: "DISCOUNT50" },
    ];
    PekoCredits.findAll.mockResolvedValue(mockCoupons);

    const result = await findCouponCodesByPartnerId(123);
    expect(PekoCredits.findAll).toHaveBeenCalledWith({ where: { partnerId: 123, status: 'ACTIVE' } });
    expect(result).toEqual(mockCoupons);
  });

  it("should return an empty array when no coupon codes are found", async () => {
    PekoCredits.findAll.mockResolvedValue([]);

    const result = await findCouponCodesByPartnerId(999);
    expect(PekoCredits.findAll).toHaveBeenCalledWith({ where: { partnerId: 999, status: 'ACTIVE' } });
    expect(result).toEqual([]);
  });

  it("should throw an error if the database query fails", async () => {
    const mockError = new Error("Database error");
    PekoCredits.findAll.mockRejectedValue(mockError);

    await expect(findCouponCodesByPartnerId(123)).rejects.toThrow("Database error");
    expect(PekoCredits.findAll).toHaveBeenCalledWith({ where: { partnerId: 123, status: 'ACTIVE' } });
  });
});
