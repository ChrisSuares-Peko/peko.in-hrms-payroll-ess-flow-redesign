const cashback = require('../../../entities/cashback');
const { update } = require('../../cashback');

jest.mock('../../../entities/cashback', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));

describe('update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cashback.findOne.mockResolvedValue({ surchargeType: 'FLAT', surcharge: '10.00' });
  });

  it('should call cashback.update with the given data and return result', async () => {
    const params = { id: 1 };
    const data = { amount: 200 };
    const mockResult = [1]; // Sequelize `update` returns an array with the number of affected rows

    cashback.update.mockResolvedValue(mockResult);

    const result = await update(params, data);

    expect(cashback.update).toHaveBeenCalledWith(data, { where: { id: params.id } });
    expect(result).toEqual(mockResult);
  });

  it('should drop the surcharge confirmation only when the surcharge changed', async () => {
    cashback.update.mockResolvedValue([1]);

    await update({ id: 1 }, { surchargeType: 'FLAT', surcharge: 10 });
    expect(cashback.update).toHaveBeenLastCalledWith({ surchargeType: 'FLAT', surcharge: 10 }, { where: { id: 1 } });

    await update({ id: 1 }, { surchargeType: 'PERCENTAGE', surcharge: 10 });
    expect(cashback.update).toHaveBeenLastCalledWith(
      { surchargeType: 'PERCENTAGE', surcharge: 10, isSurchargeConfigured: false },
      { where: { id: 1 } }
    );
  });

  it('should handle errors gracefully', async () => {
    const params = { id: 1 };
    const data = { amount: 200 };
    const errorMessage = 'Error updating cashback';

    cashback.update.mockRejectedValue(new Error(errorMessage));

    await expect(update(params, data)).rejects.toThrow(errorMessage);
  });
});
