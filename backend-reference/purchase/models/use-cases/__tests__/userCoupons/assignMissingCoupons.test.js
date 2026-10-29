const { assignMissingCoupons } = require('../../userCoupons'); 
const SubscriptionCoupons = require('../../../entities/pekoCredits');
const UserCoupons = require('../../../entities/userCoupons');
const moment = require('moment');
const { customLog } = require('../../../../utils/loggerHelper');

jest.mock('../../../entities/pekoCredits', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../entities/userCoupons', () => ({
  findAll: jest.fn(),
  bulkCreate: jest.fn(),
}));

jest.mock('../../../entities/package', () => ({}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('assignMissingCoupons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true if no active coupons exist', async () => {
    SubscriptionCoupons.findAll.mockResolvedValue([]);
    const result = await assignMissingCoupons(1, 2);

    expect(SubscriptionCoupons.findAll).toHaveBeenCalled();
    expect(result).toEqual({ status: true });
  });

  it('should assign missing coupons to user', async () => {
  

    const activeCoupons = [
      { id: 1, expiryDays: 10, validUntil: moment().add(5, 'days').toDate() },
      { id: 2, expiryDays: 5, validUntil: moment().add(3, 'days').toDate() },
    ];

    const userCoupons = [{ couponId: 1 }]; // user already has coupon 1

    SubscriptionCoupons.findAll.mockResolvedValue(activeCoupons);
    UserCoupons.findAll.mockResolvedValue(userCoupons);
    UserCoupons.bulkCreate.mockResolvedValue(true);

    const result = await assignMissingCoupons(100, 200);

    // Should bulkCreate only the missing coupon (id: 2)
    expect(UserCoupons.bulkCreate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          corporateUserId: 100,
          couponId: 2,
          expiryDate: expect.any(Date),
        }),
      ])
    );

    expect(result).toEqual({ status: true, isPekoCreditActive: true });
  });

  it('should return true if all coupons already assigned', async () => {
    const activeCoupons = [
      { id: 1, expiryDays: 10, validUntil: moment().add(5, 'days').toDate() },
    ];

    const userCoupons = [{ couponId: 1 }];

    SubscriptionCoupons.findAll.mockResolvedValue(activeCoupons);
    UserCoupons.findAll.mockResolvedValue(userCoupons);

    const result = await assignMissingCoupons(1, 1);

    // bulkCreate should not be called
    expect(UserCoupons.bulkCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ status: true, isPekoCreditActive: true });
  });

  it('should handle errors and log them', async () => {
    const error = new Error('DB Error');
    SubscriptionCoupons.findAll.mockRejectedValue(error);

    const result = await assignMissingCoupons(1, 1);

    expect(customLog).toHaveBeenCalledWith(
      null,
      'error',
      expect.objectContaining({ message: 'Error while assigning coupons:' })
    );

    expect(result).toEqual({ status: false });
  });
});
