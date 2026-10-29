const { findOne } = require('../../cashback');
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

describe('cashback - findOne', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return cashback when found', async () => {
    const mockParams = { serviceOperatorId: 1, packageIds: [1, 2, 3] };
    const mockResult = { id: 1, unitPrice: 10, packageId: 1 };

    cashback.findOne.mockResolvedValue(mockResult);

    const result = await findOne(mockParams);

    expect(cashback.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        serviceOperatorId: 1,
        serviceStatus: true,
      }),
      raw: true,
    }));
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    cashback.findOne.mockResolvedValue(null);

    const result = await findOne({ serviceOperatorId: 1, packageIds: [1] });

    expect(result).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    cashback.findOne.mockRejectedValue(new Error('DB Error'));

    const result = await findOne({ serviceOperatorId: 1, packageIds: [1] });

    expect(result).toBeUndefined();
    expect(console.log).toHaveBeenCalledWith(expect.any(Error));
  });
});
