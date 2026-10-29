const { findOneByPackageId } = require('../../cashback');
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

describe('cashback - findOneByPackageId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return cashback when found by packageId', async () => {
    const mockResult = { id: 1, packageId: 5, unitPrice: 10 };
    cashback.findOne.mockResolvedValue(mockResult);

    const result = await findOneByPackageId(5);

    expect(cashback.findOne).toHaveBeenCalledWith({
      where: { packageId: 5, serviceStatus: true },
      raw: true,
    });
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    cashback.findOne.mockResolvedValue(null);

    const result = await findOneByPackageId(999);

    expect(result).toBeNull();
  });

  it('should handle errors and return undefined', async () => {
    cashback.findOne.mockRejectedValue(new Error('DB Error'));

    const result = await findOneByPackageId(5);

    expect(result).toBeUndefined();
  });
});
