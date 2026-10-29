const govtServicesCatalog = require('../../../entities/govtServicesCatalog');
const { disableByIds } = require('../../govtServicesCatalog');

jest.mock('../../../entities/govtServicesCatalog', () => ({
  update: jest.fn(),
}));

describe('govtServicesCatalog disableByIds use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set status false on the given ids', async () => {
    govtServicesCatalog.update.mockResolvedValue([2]);

    const result = await disableByIds([1, 2]);

    expect(govtServicesCatalog.update).toHaveBeenCalledWith({ status: false }, { where: { id: [1, 2] } });
    expect(result).toEqual([2]);
  });

  it('should skip the query for an empty id list', async () => {
    const result = await disableByIds([]);

    expect(govtServicesCatalog.update).not.toHaveBeenCalled();
    expect(result).toEqual([0]);
  });

  it('should throw an error when database query fails', async () => {
    govtServicesCatalog.update.mockRejectedValue(new Error('DB error'));

    await expect(disableByIds([1])).rejects.toThrow('DB error');
  });
});
