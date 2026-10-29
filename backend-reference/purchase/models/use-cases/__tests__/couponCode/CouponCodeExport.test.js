const { Op } = require('sequelize');

const couponCode = require('../../../entities/couponCode');
const { CouponCodeExport } = require('../../couponCode');
const { handleSortFields } = require('../../../../utils/sortHandle');

jest.mock('../../../entities/couponCode', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
  handleSortFields: jest.fn(),
}));



describe('CouponCodeExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted coupon export data', async () => {
    const params = {
      searchText: 'SAVE',
      sort: 'DESC',
      sortField: 'createdAt',
    };

    handleSortFields.mockReturnValue([['createdAt', 'DESC']]);

    couponCode.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [
        {
          createdAt: '2024-01-01',
          couponCode: 'SAVE10',
          discountType: 'percentage',
          discount: 10,
          validFrom: '2024-01-01',
          validTo: '2024-12-31',
        },
      ],
    });

    const result = await CouponCodeExport(params);

    expect(handleSortFields).toHaveBeenCalledWith(
      params.sortField,
      params.sort
    );

    expect(couponCode.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          [Op.or]: expect.any(Array),
        },
        order: [['createdAt', 'DESC']],
        raw: true,
        nest: true,
      })
    );

    expect(result).toEqual([
      {
        Date: '2024-01-01',
        'Coupon Code': 'SAVE10',
        'Discount Type': 'percentage',
        Discount: 10,
        'Valid From': '2024-01-01',
        'Valid To': '2024-12-31',
      },
    ]);
  });

  it('should return "Not Available" for missing fields', async () => {
    handleSortFields.mockReturnValue([]);

    couponCode.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [
        {
          createdAt: null,
          couponCode: null,
          discountType: null,
          discount: null,
          validFrom: null,
          validTo: null,
        },
      ],
    });

    const result = await CouponCodeExport({ searchText: '' });

    expect(result).toEqual([
      {
        Date: 'Not Available',
        'Coupon Code': 'Not Available',
        'Discount Type': 'Not Available',
        Discount: 'Not Available',
        'Valid From': 'Not Available',
        'Valid To': 'Not Available',
      },
    ]);
  });

  it('should return empty array when no rows found', async () => {
    handleSortFields.mockReturnValue([]);

    couponCode.findAndCountAll.mockResolvedValue({
      count: 0,
      rows: [],
    });

    const result = await CouponCodeExport({ searchText: 'XYZ' });

    expect(result).toEqual([]);
  });

  it('should throw error and log when exception occurs', async () => {
    const error = new Error('DB failure');

    handleSortFields.mockReturnValue([]);

    couponCode.findAndCountAll.mockRejectedValue(error);

    await expect(
      CouponCodeExport({ searchText: 'FAIL' })
    ).rejects.toEqual({ message: 'Something went wrong' });

  });
});
