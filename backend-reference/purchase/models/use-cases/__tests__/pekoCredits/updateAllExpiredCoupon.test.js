const { updateAllExpiredCoupon } = require('../../pekoCredits'); 
const PekoCredits = require('../../../entities/pekoCredits');
const { Op } = require('sequelize');
const moment = require('moment');
const { customLog } = require('../../../../utils/loggerHelper');

jest.mock('../../../entities/pekoCredits', () => ({
  update: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('updateAllExpiredCoupon', () => {
  let today;

  beforeEach(() => {
    jest.clearAllMocks();
    today = moment().startOf('day').toDate();
  });

  it('should update expired coupons and return the number of rows updated', async () => {
    PekoCredits.update.mockResolvedValue([5]); 

    const result = await updateAllExpiredCoupon();

    expect(PekoCredits.update).toHaveBeenCalledWith(
      { status: 'DISABLED' },
      {
        where: {
          validUntil: {
            [Op.lt]: today,
          },
          status: 'ACTIVE',
        },
      }
    );

    expect(result).toBe(5);
  });

  it('should return false and log error if update throws', async () => {
    const error = new Error('DB failure');
    PekoCredits.update.mockRejectedValue(error);

    const result = await updateAllExpiredCoupon();

    expect(customLog).toHaveBeenCalledWith(
      null,
      'error',
      { message: 'update all expired coupon codes error', data: error }
    );

    expect(result).toBe(false);
  });
});
