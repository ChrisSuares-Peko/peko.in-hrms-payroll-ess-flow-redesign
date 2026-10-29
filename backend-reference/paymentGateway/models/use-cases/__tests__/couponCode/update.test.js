const { update } = require('../../couponCode');
const couponCode = require('../../../entities/couponCode');

jest.mock('../../../entities/couponCode', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  findByPk: jest.fn(),
}));

describe('couponCode - update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update and return updated coupon code', async () => {
    const mockUpdated = { id: 1, code: 'SAVE20', discount: 20 };
    couponCode.update.mockResolvedValue([1]);
    couponCode.findByPk.mockResolvedValue(mockUpdated);

    const result = await update(1, { discount: 20 });

    expect(couponCode.update).toHaveBeenCalledWith({ discount: 20 }, { where: { id: 1 } });
    expect(couponCode.findByPk).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockUpdated);
  });

  it('should return false when no rows updated', async () => {
    couponCode.update.mockResolvedValue([0]);

    const result = await update(999, { discount: 20 });

    expect(result).toBe(false);
    expect(couponCode.findByPk).not.toHaveBeenCalled();
  });

  it('should throw error when DB fails', async () => {
    couponCode.update.mockRejectedValue(new Error('DB Error'));

    await expect(update(1, { discount: 20 })).rejects.toThrow('DB Error');
  });
});
