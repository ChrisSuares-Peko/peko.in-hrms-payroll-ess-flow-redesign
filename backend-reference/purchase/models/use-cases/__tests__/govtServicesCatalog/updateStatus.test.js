const govtServicesCatalog = require('../../../entities/govtServicesCatalog');
const { updateStatus } = require('../../govtServicesCatalog');

jest.mock('../../../entities/govtServicesCatalog', () => ({
  update: jest.fn(),
}));

describe('govtServicesCatalog updateStatus use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update only the status of the catalog row', async () => {
    govtServicesCatalog.update.mockResolvedValue([1]);

    const result = await updateStatus(1, false);

    expect(govtServicesCatalog.update).toHaveBeenCalledWith({ status: false }, { where: { id: 1 } });
    expect(result).toEqual([1]);
  });

  it('should throw an error when database query fails', async () => {
    govtServicesCatalog.update.mockRejectedValue(new Error('DB error'));

    await expect(updateStatus(1, true)).rejects.toThrow('DB error');
  });
});
