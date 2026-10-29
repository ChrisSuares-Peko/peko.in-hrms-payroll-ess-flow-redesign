const { findOne } = require('../../couponCode');
const couponCode = require('../../../entities/couponCode');

jest.mock('../../../entities/couponCode', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  findByPk: jest.fn(),
}));

describe('couponCode - findOne', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return coupon code when found', async () => {
    const mockResult = { id: 1, code: 'SAVE10' };
    couponCode.findOne.mockResolvedValue(mockResult);

    const result = await findOne({ code: 'SAVE10' });

    expect(couponCode.findOne).toHaveBeenCalledWith({ where: { code: 'SAVE10' } });
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    couponCode.findOne.mockResolvedValue(null);

    const result = await findOne({ code: 'INVALID' });

    expect(result).toBeNull();
  });

  it('should throw error when DB fails', async () => {
    couponCode.findOne.mockRejectedValue(new Error('DB Error'));

    await expect(findOne({ code: 'TEST' })).rejects.toThrow('DB Error');
  });
});
