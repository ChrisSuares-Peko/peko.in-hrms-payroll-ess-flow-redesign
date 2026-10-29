const { Delete } = require('../../softwares_subscriptions');
const softwares_subscriptions = require('../../../entities/softwares_subscriptions');

jest.mock('../../../entities/softwares_subscriptions', () => ({
  destroy: jest.fn(),
}));

describe('Delete function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a record with the given productCode', async () => {
    softwares_subscriptions.destroy.mockResolvedValue(1); // 1 row deleted

    const params = { productCode: 123 };
    const result = await Delete(params);

    expect(softwares_subscriptions.destroy).toHaveBeenCalledWith({
      where: { id: 123 },
    });
    expect(result).toBe(1);
  });

  it('should return 0 if no record is deleted', async () => {
    softwares_subscriptions.destroy.mockResolvedValue(0); // No rows deleted

    const params = { productCode: 999 };
    const result = await Delete(params);

    expect(softwares_subscriptions.destroy).toHaveBeenCalledWith({
      where: { id: 999 },
    });
    expect(result).toBe(0);
  });

  it('should throw an error if destroy fails', async () => {
    const mockError = new Error('Database error');
    softwares_subscriptions.destroy.mockRejectedValue(mockError);

    await expect(Delete({ productCode: 456 })).rejects.toThrow('Database error');
  });
});
