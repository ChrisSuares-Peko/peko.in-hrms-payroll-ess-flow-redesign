const { Op } = require('sequelize');
const govtServicesCatalog = require('../../../entities/govtServicesCatalog');
const { findAllAndCount } = require('../../govtServicesCatalog');

jest.mock('../../../entities/govtServicesCatalog', () => ({
  findAndCountAll: jest.fn(),
}));

describe('govtServicesCatalog findAllAndCount use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should page rows ordered by sortOrder ASC by default', async () => {
    const mockResult = { rows: [{ id: 1 }], count: 1 };
    govtServicesCatalog.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllAndCount({ limit: 10, offset: 0 });

    expect(govtServicesCatalog.findAndCountAll).toHaveBeenCalledWith({
      where: {},
      order: [['sortOrder', 'ASC']],
      limit: 10,
      offset: 0,
      raw: true,
    });
    expect(result).toEqual(mockResult);
  });

  it('should search service name, variant name and vendorCatalogId with a custom sort', async () => {
    govtServicesCatalog.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllAndCount({ limit: 5, offset: 10, searchText: 'trade', sort: 'DESC', sortField: 'serviceName' });

    expect(govtServicesCatalog.findAndCountAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { serviceName: { [Op.like]: '%trade%' } },
          { variantName: { [Op.like]: '%trade%' } },
          { vendorCatalogId: { [Op.like]: '%trade%' } },
        ],
      },
      order: [['serviceName', 'DESC']],
      limit: 5,
      offset: 10,
      raw: true,
    });
  });

  it('should throw an error when database query fails', async () => {
    govtServicesCatalog.findAndCountAll.mockRejectedValue(new Error('DB error'));

    await expect(findAllAndCount({ limit: 10, offset: 0 })).rejects.toThrow('DB error');
  });
});
