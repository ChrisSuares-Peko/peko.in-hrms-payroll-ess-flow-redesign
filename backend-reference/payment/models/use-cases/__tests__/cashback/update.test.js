const cashback = require('../../../entities/cashback');
const { update } = require('../../cashback');

jest.mock('../../../entities/cashback', () => ({
  update: jest.fn(),
}));

describe('update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call cashback.update with correct parameters and return result', async () => {
    const params = { id: 1 };
    const data = { amount: 200 };
    const mockResult = [1]; // Sequelize `update` returns an array with the number of affected rows

    cashback.update.mockResolvedValue(mockResult);

    const result = await update(params, data);

    expect(cashback.update).toHaveBeenCalledWith(data, {
      where: { id: params.id },
    });
    expect(result).toEqual(mockResult);
  });

  it('should handle errors gracefully', async () => {
    const params = { id: 1 };
    const data = { amount: 200 };
    const errorMessage = 'Error updating cashback';

    cashback.update.mockRejectedValue(new Error(errorMessage));

    await expect(update(params, data)).rejects.toThrow(errorMessage);
  });
});
