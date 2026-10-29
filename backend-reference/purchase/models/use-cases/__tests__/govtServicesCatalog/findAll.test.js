const govtServicesCatalog = require('../../../entities/govtServicesCatalog');
const { findAll } = require('../../govtServicesCatalog');

jest.mock('../../../entities/govtServicesCatalog', () => ({
  findAll: jest.fn(),
}));

describe('govtServicesCatalog findAll use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return every catalog row', async () => {
    const mockResult = [{ id: 1 }, { id: 2 }];
    govtServicesCatalog.findAll.mockResolvedValue(mockResult);

    const result = await findAll();

    expect(govtServicesCatalog.findAll).toHaveBeenCalledWith();
    expect(result).toEqual(mockResult);
  });

  it('should throw an error when database query fails', async () => {
    govtServicesCatalog.findAll.mockRejectedValue(new Error('DB error'));

    await expect(findAll()).rejects.toThrow('DB error');
  });
});
