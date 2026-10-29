const { findAll } = require('../../../use-cases/softwares_subscriptions');
const softwares_subscriptions = require('../../../entities/softwares_subscriptions');
const vendors = require('../../../entities/vendor'); // Adjust the path as necessary
const { Op } = require('sequelize');

jest.mock('../../../entities/softwares_subscriptions'); // Mocking the entity
jest.mock('../../../entities/vendor'); // Mocking the vendor entity
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('findAll function', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear previous mocks before each test
  });

  it('should retrieve subscriptions with search criteria', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      searchText: 'test',
      sort: 'ASC',
      sortField: 'name',
    };

    const mockResult = {
      count: 1,
      rows: [
        {
          id: 1,
          name: 'Test Subscription',
          type: 'Basic',
          offersText: 'Special offer',
          peko_key: '12345',
          pekoEmail: 'test@example.com',
          vendor: {
            vendorName: 'Test Vendor',
            optional1: 'Optional Info',
          },
        },
      ],
    };

    // Mocking the findAndCountAll method
    softwares_subscriptions.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAll(mockParams);

    expect(softwares_subscriptions.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: vendors,
          attributes: ['vendorName', 'optional1'],
        },
      ],
      attributes: undefined, // Replace this with the actual attributes if needed
      where: {
        [Op.or]: [
          { id: { [Op.like]: '%test%' } },
          { name: { [Op.like]: '%test%' } },
          { type: { [Op.like]: '%test%' } },
          { offersText: { [Op.like]: '%test%' } },
          { peko_key: { [Op.like]: '%test%' } },
          { pekoEmail: { [Op.like]: '%test%' } },
        ],
        status: undefined, // Make sure to set the status if provided
      },
      order: expect.any(Array), // Verify order if you have a specific order expected
      limit: mockParams.limit,
      offset: mockParams.offset,
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResult); // Expect the result to match the mocked result
  });

  it('should filter by status if provided', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      searchText: 'test',
      sort: 'ASC',
      sortField: 'name',
    };
    const mockStatus = 'active';

    const mockResult = {
      count: 1,
      rows: [
        {
          id: 1,
          name: 'Test Subscription',
          type: 'Basic',
          offersText: 'Special offer',
          peko_key: '12345',
          pekoEmail: 'test@example.com',
          vendor: {
            vendorName: 'Test Vendor',
            optional1: 'Optional Info',
          },
        },
      ],
    };

    // Mocking the findAndCountAll method
    softwares_subscriptions.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAll(mockParams, mockStatus);

    expect(softwares_subscriptions.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: vendors,
          attributes: ['vendorName', 'optional1'],
        },
      ],
      attributes: undefined, // Replace this with the actual attributes if needed
      where: {
        [Op.or]: [
          { id: { [Op.like]: '%test%' } },
          { name: { [Op.like]: '%test%' } },
          { type: { [Op.like]: '%test%' } },
          { offersText: { [Op.like]: '%test%' } },
          { peko_key: { [Op.like]: '%test%' } },
          { pekoEmail: { [Op.like]: '%test%' } },
        ],
        status: mockStatus,
      },
      order: expect.any(Array), // Verify order if you have a specific order expected
      limit: mockParams.limit,
      offset: mockParams.offset,
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResult); // Expect the result to match the mocked result
  });

 
});
