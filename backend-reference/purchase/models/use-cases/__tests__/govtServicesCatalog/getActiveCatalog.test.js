const govtServicesCatalog = require('../../../entities/govtServicesCatalog');
const { getActiveCatalog } = require('../../govtServicesCatalog');

jest.mock('../../../entities/govtServicesCatalog', () => ({
  findAll: jest.fn(),
}));

describe('govtServicesCatalog getActiveCatalog use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    govtServicesCatalog.findAll.mockResolvedValue([]);
  });

  it('should return only active rows ordered by sortOrder', async () => {
    const mockResult = [{ id: 1, status: true }];
    govtServicesCatalog.findAll.mockResolvedValue(mockResult);

    const result = await getActiveCatalog();

    expect(govtServicesCatalog.findAll).toHaveBeenCalledWith({
      where: { status: true },
      order: [['sortOrder', 'ASC']],
      raw: true,
    });
    expect(result).toEqual(mockResult);
  });

  it('should filter by serviceId, coerced to a number', async () => {
    await getActiveCatalog({ serviceId: '12' });

    expect(govtServicesCatalog.findAll.mock.calls[0][0].where).toEqual({ status: true, serviceId: 12 });
  });

  it('should filter by serviceId 0', async () => {
    await getActiveCatalog({ serviceId: 0 });

    expect(govtServicesCatalog.findAll.mock.calls[0][0].where).toEqual({ status: true, serviceId: 0 });
  });

  it.each([undefined, null, ''])('should not filter by serviceId when it is %p', async serviceId => {
    await getActiveCatalog({ serviceId });

    expect(govtServicesCatalog.findAll.mock.calls[0][0].where).toEqual({ status: true });
  });

  it('should throw an error when database query fails', async () => {
    govtServicesCatalog.findAll.mockRejectedValue(new Error('DB error'));

    await expect(getActiveCatalog()).rejects.toThrow('DB error');
  });
});
