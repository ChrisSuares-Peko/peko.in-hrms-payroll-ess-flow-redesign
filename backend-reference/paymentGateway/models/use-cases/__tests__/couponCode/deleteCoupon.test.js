const couponCodeUseCases = require('../../couponCode');
const couponCode = require('../../../entities/couponCode');

jest.mock('../../../entities/couponCode', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  findByPk: jest.fn(),
}));

describe('couponCode - delete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete and return deleted count', async () => {
    couponCode.destroy.mockResolvedValue(1);

    const result = await couponCodeUseCases.delete(1);

    expect(couponCode.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toBe(1);
  });

  it('should return 0 when no record to delete', async () => {
    couponCode.destroy.mockResolvedValue(0);

    const result = await couponCodeUseCases.delete(999);

    expect(result).toBe(0);
  });

  it('should throw error when DB fails', async () => {
    couponCode.destroy.mockRejectedValue(new Error('DB Error'));

    await expect(couponCodeUseCases.delete(1)).rejects.toThrow('DB Error');
  });
});
