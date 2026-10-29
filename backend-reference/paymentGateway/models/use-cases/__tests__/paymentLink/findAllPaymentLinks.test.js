const { findAllPaymentLinks } = require('../../paymentLink');
const paymentLinks = require('../../../entities/paymentLink');

jest.mock('../../../entities/paymentLink', () => ({
  findAndCountAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));

describe('findAllPaymentLinks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return payment links with pagination', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      sort: 'DESC',
      sortField: 'createdAt',
      corporateId: null,
      searchText: '',
    };

    const mockData = { count: 1, rows: [{ id: 1, status: 'ACTIVE' }] };
    paymentLinks.findAndCountAll.mockResolvedValue(mockData);

    const result = await findAllPaymentLinks(mockParams);

    expect(paymentLinks.findAndCountAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockData);
  });

  it('should filter by corporateId when provided', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      sort: 'DESC',
      sortField: 'createdAt',
      corporateId: 'CORP123',
      searchText: '',
    };

    paymentLinks.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllPaymentLinks(mockParams);

    expect(paymentLinks.findAndCountAll).toHaveBeenCalledTimes(1);
  });

  it('should add search conditions when searchText provided', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      sort: 'DESC',
      sortField: 'createdAt',
      corporateId: null,
      searchText: 'test',
    };

    paymentLinks.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllPaymentLinks(mockParams);

    expect(paymentLinks.findAndCountAll).toHaveBeenCalledTimes(1);
  });

  it('should throw error when DB fails', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      sort: 'DESC',
      sortField: 'createdAt',
      corporateId: null,
      searchText: '',
    };

    paymentLinks.findAndCountAll.mockRejectedValue(new Error('DB Error'));

    await expect(findAllPaymentLinks(mockParams)).rejects.toThrow('DB Error');
  });
});
