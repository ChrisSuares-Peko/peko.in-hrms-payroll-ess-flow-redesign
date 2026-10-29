const { findOne } = require('../../package');
const Package = require('../../../entities/package');

jest.mock('../../../entities/package', () => ({
  findOne: jest.fn(),
}));

describe('package - findOne', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return package when found', async () => {
    const mockResult = { id: 1, packageName: 'Basic' };
    Package.findOne.mockResolvedValue(mockResult);

    const result = await findOne({ id: 1 });

    expect(Package.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    Package.findOne.mockResolvedValue(null);

    const result = await findOne({ id: 999 });

    expect(result).toBeNull();
  });

  it('should throw error when DB fails', async () => {
    Package.findOne.mockRejectedValue(new Error('DB Error'));

    await expect(findOne({ id: 1 })).rejects.toThrow('DB Error');
  });
});
