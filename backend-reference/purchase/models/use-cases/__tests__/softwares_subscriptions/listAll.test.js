const { listAll } = require('../../../use-cases/softwares_subscriptions'); // Adjust the path as necessary
const softwares_subscriptions = require('../../../entities/softwares_subscriptions'); // Adjust the path as necessary
const { Op } = require('sequelize');

jest.mock('../../../entities/softwares_subscriptions'); // Mocking the entity
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('listAll function', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear previous mocks before each test
  });

  it('should retrieve subscriptions with search criteria', async () => {
    const mockParams = { searchText: 'test' }; // Example parameters for the query
    const mockAttributes = ['id', 'name', 'type']; // Example attributes to retrieve
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
        },
      ],
    };

    // Mocking the findAndCountAll method
    softwares_subscriptions.findAndCountAll.mockResolvedValue(mockResult);

    const result = await listAll(mockParams, undefined, mockAttributes);

    expect(softwares_subscriptions.findAndCountAll).toHaveBeenCalledWith({
      attributes: mockAttributes,
      where: {
        [Op.or]: [
          { id: { [Op.like]: '%test%' } },
          { name: { [Op.like]: '%test%' } },
          { type: { [Op.like]: '%test%' } },
          { offersText: { [Op.like]: '%test%' } },
          { peko_key: { [Op.like]: '%test%' } },
          { pekoEmail: { [Op.like]: '%test%' } },
        ],
      },
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResult); // Expect the result to match the mocked result
  });

  it('should filter by status if provided', async () => {
    const mockParams = { searchText: 'test' }; // Example parameters for the query
    const mockStatus = 'active'; // Example status to filter by
    const mockAttributes = ['id', 'name', 'type']; // Example attributes to retrieve
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
        },
      ],
    };

    // Mocking the findAndCountAll method
    softwares_subscriptions.findAndCountAll.mockResolvedValue(mockResult);

    const result = await listAll(mockParams, mockStatus, mockAttributes);

    expect(softwares_subscriptions.findAndCountAll).toHaveBeenCalledWith({
      attributes: mockAttributes,
      where: {
        [Op.or]: [
          { id: { [Op.like]: '%test%' } },
          { name: { [Op.like]: '%test%' } },
          { type: { [Op.like]: '%test%' } },
          { offersText: { [Op.like]: '%test%' } },
          { peko_key: { [Op.like]: '%test%' } },
          { pekoEmail: { [Op.like]: '%test%' } },
        ],
        status: mockStatus, // Status should be included in the where clause
      },
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResult); // Expect the result to match the mocked result
  });

  it('should handle errors and throw a message', async () => {
    const mockParams = { searchText: 'test' }; // Example parameters for the query
    const mockAttributes = ['id', 'name', 'type']; // Example attributes to retrieve
    const mockError = new Error('Something went wrong');

    // Mocking the findAndCountAll method to reject with an error
    softwares_subscriptions.findAndCountAll.mockRejectedValue(mockError);

    await expect(listAll(mockParams, undefined, mockAttributes)).rejects.toEqual({ message: 'Something went wrong' });
  });
});
