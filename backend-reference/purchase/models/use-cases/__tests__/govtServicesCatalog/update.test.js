const govtServicesCatalog = require('../../../entities/govtServicesCatalog');
const { update } = require('../../govtServicesCatalog');

jest.mock('../../../entities/govtServicesCatalog', () => ({
  update: jest.fn(),
}));

describe('govtServicesCatalog update use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the catalog row by id', async () => {
    govtServicesCatalog.update.mockResolvedValue([1]);

    const result = await update(1, { sortOrder: 3 });

    expect(govtServicesCatalog.update).toHaveBeenCalledWith({ sortOrder: 3 }, { where: { id: 1 } });
    expect(result).toEqual([1]);
  });

  it('should throw an error when database query fails', async () => {
    govtServicesCatalog.update.mockRejectedValue(new Error('DB error'));

    await expect(update(1, {})).rejects.toThrow('DB error');
  });
});
