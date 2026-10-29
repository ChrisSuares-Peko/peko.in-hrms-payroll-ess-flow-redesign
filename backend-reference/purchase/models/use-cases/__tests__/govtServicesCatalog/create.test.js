const govtServicesCatalog = require('../../../entities/govtServicesCatalog');
const { create } = require('../../govtServicesCatalog');

jest.mock('../../../entities/govtServicesCatalog', () => ({
  create: jest.fn(),
}));

describe('govtServicesCatalog create use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a catalog row with the given params', async () => {
    const params = { vendorCatalogId: 'CAT1', serviceId: 12, serviceName: 'Trademark Registration' };
    const mockResult = { id: 1, ...params };
    govtServicesCatalog.create.mockResolvedValue(mockResult);

    const result = await create(params);

    expect(govtServicesCatalog.create).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockResult);
  });

  it('should throw an error when database query fails', async () => {
    govtServicesCatalog.create.mockRejectedValue(new Error('DB error'));

    await expect(create({})).rejects.toThrow('DB error');
  });
});
