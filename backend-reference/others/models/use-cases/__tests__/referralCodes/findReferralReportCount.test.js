const { findReferralReportCount } = require('../../../use-cases/referral_codes');
const corporateUser = require('../../../entities/corporateUser');
const { Op } = require('sequelize');

jest.mock('../../../entities/corporateUser', () => ({
  count: jest.fn(),
}));

describe('findReferralReportCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle case when no dates are provided', async () => {
    const mockCount = 2;
    corporateUser.count.mockResolvedValue(mockCount);

    const params = {
      partnerId: 'partner_123',
    };

    const result = await findReferralReportCount(params);

    expect(corporateUser.count).toHaveBeenCalledWith({
      where: {
        referralCode: { [Op.ne]: null },
        registeredBy: 'partner_123',
      },
      raw: true,
    });
    expect(result).toBe(mockCount);
  });

  


  it('should handle case when partnerId is "default"', async () => {
    const mockCount = 1;
    corporateUser.count.mockResolvedValue(mockCount);

    const params = {
      partnerId: 'default',
    };

    const result = await findReferralReportCount(params);

    expect(corporateUser.count).toHaveBeenCalledWith({
      where: {
        referralCode: { [Op.ne]: null },
        registeredBy: null, // Should set `registeredBy` to null for "default"
      },
      raw: true,
    });
    expect(result).toBe(mockCount);
  });

  
});
