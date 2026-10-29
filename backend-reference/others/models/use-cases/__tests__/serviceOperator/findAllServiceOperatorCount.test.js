const { findAllServiceOperatorCount } = require('../../serviceOperator'); // Adjust the path as needed
const serviceOperator = require('../../../entities/serviceOperator');
const vendors = require('../../../entities/vendor');
const oauth_clients = require('../../../entities/oauth_clients');

jest.mock('../../../entities/serviceOperator', () => ({
  findAndCountAll: jest.fn(),
}));

describe('findAllServiceOperatorCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch service operators and their count with valid parameters', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      searchText: 'test',
      sort: 'ASC',
      sortField: 'serviceProvider',
    };
    const mockData = {
      rows: [
        {
          id: 1,
          serviceProvider: 'Test Provider',
          accessKey: '12345',
          serviceStatus: 'Active',
          vendor: { vendorName: 'Test Vendor', apiUrl: 'https://api.test.com', token: 'test-token' },
        },
      ],
      count: 1,
    };

    serviceOperator.findAndCountAll.mockResolvedValue(mockData);

    const result = await findAllServiceOperatorCount(mockParams);

    expect(serviceOperator.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: vendors,
          attributes: ['vendorName', 'apiUrl', ['optional1', 'token']],
        },
        {
          model: oauth_clients,
          attributes: ['client_id', 'client_secret', 'client_name', 'logo_uri', 'redirect_uris', 'active'],
        },
      ],
      where: expect.any(Object),
      order: [['serviceProvider', 'ASC']],
      limit: 10,
      offset: 0,
    });

    expect(result).toEqual(mockData);
  });

  it('should return an empty result if no service operators match the search criteria', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      searchText: 'nonexistent',
      sort: 'ASC',
      sortField: 'serviceProvider',
    };
    const mockData = { rows: [], count: 0 };

    serviceOperator.findAndCountAll.mockResolvedValue(mockData);

    const result = await findAllServiceOperatorCount(mockParams);

    expect(serviceOperator.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: vendors,
          attributes: ['vendorName', 'apiUrl', ['optional1', 'token']],
        },
        {
          model: oauth_clients,
          attributes: ['client_id', 'client_secret', 'client_name', 'logo_uri', 'redirect_uris', 'active'],
        },
      ],
      where: expect.any(Object),
      order: [['serviceProvider', 'ASC']],
      limit: 10,
      offset: 0,
    });

    expect(result).toEqual(mockData);
  });

  it('should handle errors thrown by the database query', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      searchText: 'test',
      sort: 'ASC',
      sortField: 'serviceProvider',
    };
    const mockError = new Error('Database error');

    serviceOperator.findAndCountAll.mockRejectedValue(mockError);

    await expect(findAllServiceOperatorCount(mockParams)).rejects.toThrow('Database error');

    expect(serviceOperator.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: vendors,
          attributes: ['vendorName', 'apiUrl', ['optional1', 'token']],
        },
        {
          model: oauth_clients,
          attributes: ['client_id', 'client_secret', 'client_name', 'logo_uri', 'redirect_uris', 'active'],
        },
      ],
      where: expect.any(Object),
      order: [['serviceProvider', 'ASC']],
      limit: 10,
      offset: 0,
    });
  });
});
