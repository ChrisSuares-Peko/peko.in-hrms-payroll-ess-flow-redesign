const { findOneServiceCashbacks } = require('../../cashback');
const cashback = require('../../../entities/cashback');

jest.mock('../../../entities/cashback', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/package', () => ({
  findOne: jest.fn(),
}));

describe('cashback - findOneServiceCashbacks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return cashbacks when found', async () => {
    const mockCashbacks = [
      { unitPrice: 10, packageId: 1, package: { id: 1, packageName: 'Basic' } },
    ];
    cashback.findAll.mockResolvedValue(mockCashbacks);

    const result = await findOneServiceCashbacks({ accessKey: 'AK123', partnerId: 'P1' });

    expect(cashback.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockCashbacks);
  });

  it('should handle null partnerId', async () => {
    cashback.findAll.mockResolvedValue([]);

    const result = await findOneServiceCashbacks({ accessKey: 'AK123', partnerId: 'null' });

    expect(result).toEqual([]);
  });

  it('should return false on error', async () => {
    cashback.findAll.mockRejectedValue(new Error('DB Error'));

    const result = await findOneServiceCashbacks({ accessKey: 'AK123', partnerId: 'P1' });

    expect(result).toBe(false);
  });
});
