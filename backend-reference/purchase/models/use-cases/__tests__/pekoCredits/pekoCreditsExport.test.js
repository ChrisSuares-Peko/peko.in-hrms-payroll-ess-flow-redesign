const { pekoCreditsExport } = require('../../pekoCredits'); 
const sequelizeConfig = require('../../../../configs/database/index');
const Sequelize = require('sequelize');
const { customLog } = require('../../../../utils/loggerHelper');

jest.mock('../../../../configs/database/index', () => ({
  query: jest.fn(),
   define: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({ belongsTo: jest.fn() }));
jest.mock('../../../entities/pekoCredits', () => ({ belongsTo: jest.fn() }));
jest.mock('../../../entities/corporateUser', () => ({}));
jest.mock('../../../entities/userCoupons', () => ({ belongsTo: jest.fn() }));

describe('pekoCreditsExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted data when query returns results', async () => {
    const mockData = [
      {
        createdAt: '2026-02-09',
        code: 'TEST123',
        couponType: 'DISCOUNT',
        partnerName: 'Partner A',
        packageName: 'Package X',
        serviceProvider: 'Service Y',
        discount: 10,
        billingType: 'Monthly',
        expiryDays: 30,
        validUntil: '2026-03-10',
        minimumPurchase: 100,
        status: 'ACTIVE',
        maximumDiscount: 50,
      },
    ];

    sequelizeConfig.query.mockResolvedValue(mockData);

    const params = { searchText: 'TEST' };
    const result = await pekoCreditsExport(params);

    expect(sequelizeConfig.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      expect.objectContaining({
        replacements: { searchText: `%${params.searchText}%` },
        type: Sequelize.QueryTypes.SELECT,
        raw: true,
        nest: true,
      })
    );

    expect(result).toEqual([
      {
        "Created At": '2026-02-09',
        "Coupon Code": 'TEST123',
        "Coupon Type": 'DISCOUNT',
        "Partner": 'Partner A',
        "Package Name": 'Package X',
        "Service": 'Service Y',
        "Discount": 10,
        "Package Billing Type": 'Monthly',
        "Expiry Days": 30,
        "Valid Untill": '2026-03-10',
        "Minimum Purhcase": 100,
        "Status": 'ACTIVE',
        "Maximum Discount": 50,
      },
    ]);
  });

  it('should return "Not Available" for missing fields', async () => {
    const mockData = [
      {
        code: null,
        couponType: null,
      },
    ];

    sequelizeConfig.query.mockResolvedValue(mockData);

    const params = { searchText: '' };
    const result = await pekoCreditsExport(params);

    expect(result).toEqual([
      {
        "Created At": "Not Available",
        "Coupon Code": "Not Available",
        "Coupon Type": "Not Available",
        "Partner": "Not Available",
        "Package Name": "Not Available",
        "Service": "Not Available",
        "Discount": "Not Available",
        "Package Billing Type": "Not Available",
        "Expiry Days": "Not Available",
        "Valid Untill": "Not Available",
        "Minimum Purhcase": "Not Available",
        "Status": "Not Available",
        "Maximum Discount": "Not Available",
      },
    ]);
  });

  it('should log error and throw when query fails', async () => {
    const error = new Error('DB Error');
    sequelizeConfig.query.mockRejectedValue(error);

    const params = { searchText: 'TEST' };

    await expect(pekoCreditsExport(params)).rejects.toEqual(
      { message: 'Something went wrong' }
    );

    expect(customLog).toHaveBeenCalledWith(
      null,
      'error',
      expect.objectContaining({ message: 'An error occurred', error })
    );
  });
});
