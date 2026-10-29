const { findAllUserCoupons } = require('../../userCoupons');
const UserCoupons = require('../../../entities/userCoupons');
const { Op } = require('sequelize');
const { customLog } = require('../../../../utils/loggerHelper');

jest.mock('../../../entities/userCoupons', () => ({
  findAndCountAll: jest.fn(),
  findAll: jest.fn(),
}));

jest.mock('../../../entities/pekoCredits', () => ({}));
jest.mock('../../../entities/package', () => ({}));
jest.mock('../../../entities/serviceOperator', () => ({}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('findAllUserCoupons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return current page and unclaimed coupons', async () => {
    const corporateId = 1;
    const partnerId = 2;
    const params = { page: 2, itemsPerPage: 5 };

    const currentPageResult = { count: 10, rows: [{ id: 1 }, { id: 2 }] };
    const unclaimedResult = [{ id: 3 }, { id: 4 }];

    UserCoupons.findAndCountAll.mockResolvedValue(currentPageResult);
    UserCoupons.findAll.mockResolvedValue(unclaimedResult);

    const result = await findAllUserCoupons(corporateId, partnerId, params);

    expect(UserCoupons.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          corporateUserId: corporateId,
          status: { [Op.in]: ['CLAIMED', 'UNCLAIMED'] },
          expiryDate: expect.any(Object),
        },
        offset: 5, // (page 2 -1) * itemsPerPage 5
        limit: 5,
        order: [['status', 'ASC'], ['claimedAt', 'DESC'], ['expiryDate', 'ASC']],
        raw: true,
        nest: true,
      })
    );

    expect(UserCoupons.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          corporateUserId: corporateId,
          status: 'UNCLAIMED',
          expiryDate: expect.any(Object),
        },
        raw: true,
        nest: true,
      })
    );

    expect(result).toEqual({
      currentPageCoupons: currentPageResult,
      unclaimedCoupons: unclaimedResult,
    });
  });

  it('should handle errors and log them', async () => {
    const error = new Error('DB Error');
    UserCoupons.findAndCountAll.mockRejectedValue(error);

    const result = await findAllUserCoupons(1, 1, {});

    expect(customLog).toHaveBeenCalledWith(
      null,
      'error',
      expect.objectContaining({ message: 'Error fetching user coupons:' })
    );

    expect(result).toBe(false);
  });
});
