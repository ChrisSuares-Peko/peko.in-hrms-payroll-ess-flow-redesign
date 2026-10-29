const { updateExpiredCoupons } = require('../../userCoupons'); 
const UserCoupons = require('../../../entities/userCoupons');
const { Op } = require('sequelize');
const { customLog } = require('../../../../utils/loggerHelper');

jest.mock('../../../entities/userCoupons', () => ({
  update: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('updateExpiredCoupons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update expired coupons and return the result', async () => {
    const corporateId = 123;
    const mockResult = [2]; 

    UserCoupons.update.mockResolvedValue(mockResult);

    const result = await updateExpiredCoupons(corporateId);

    expect(UserCoupons.update).toHaveBeenCalledWith(
      { status: 'EXPIRED' },
      {
        where: {
          corporateUserId: corporateId,
          expiryDate: { [Op.lt]: expect.any(Date) },
          status: { [Op.ne]: 'EXPIRED' },
        },
      }
    );

    expect(result).toEqual(mockResult);
  });

  it('should handle errors and log them', async () => {
    const corporateId = 123;
    const error = new Error('DB Error');

    UserCoupons.update.mockRejectedValue(error);

    const result = await updateExpiredCoupons(corporateId);

    expect(customLog).toHaveBeenCalledWith(
      null,
      'error',
      expect.objectContaining({ message: 'Error updating expired coupons:' })
    );

    expect(result).toBe(false);
  });
});
