const { findOnePackage } = require('../../packages');
const Package = require('../../../entities/package');

jest.mock('../../../entities/package', () => ({
  findOne: jest.fn(),
}));

describe('packages - findOnePackage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return package when found by id', async () => {
    const mockResult = { id: 1, packageName: 'Premium' };
    Package.findOne.mockResolvedValue(mockResult);

    const result = await findOnePackage(1);

    expect(Package.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    Package.findOne.mockResolvedValue(null);

    const result = await findOnePackage(999);

    expect(result).toBeNull();
  });

  it('should throw error when DB fails', async () => {
    Package.findOne.mockRejectedValue(new Error('DB Error'));

    await expect(findOnePackage(1)).rejects.toThrow('DB Error');
  });
});
