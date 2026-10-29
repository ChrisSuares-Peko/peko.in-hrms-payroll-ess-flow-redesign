const { findOne } = require('../../../use-cases/softwares_subscriptions'); // Adjust the path as necessary
const softwares_subscriptions = require('../../../entities/softwares_subscriptions'); // Adjust the path as necessary

jest.mock('../../../entities/softwares_subscriptions'); // Mocking the entity
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('findOne function', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear previous mocks before each test
  });

  it('should retrieve a subscription when found', async () => {
    const mockParams = { id: 1 }; // Example parameters for the query
    const mockAttributes = ['id', 'name', 'type']; // Example attributes to retrieve
    const mockResult = {
      id: 1,
      name: 'Test Subscription',
      type: 'Basic',
    };

    // Mocking the findOne method
    softwares_subscriptions.findOne.mockResolvedValue(mockResult);

    const result = await findOne(mockParams, mockAttributes);

    expect(softwares_subscriptions.findOne).toHaveBeenCalledWith({
      where: mockParams,
      attributes: mockAttributes,
    });

    expect(result).toEqual(mockResult); // Expect the result to match the mocked result
  });

  it('should return null if no subscription is found', async () => {
    const mockParams = { id: 1 }; // Example parameters for the query
    const mockAttributes = ['id', 'name', 'type']; // Example attributes to retrieve

    // Mocking the findOne method to return null
    softwares_subscriptions.findOne.mockResolvedValue(null);

    const result = await findOne(mockParams, mockAttributes);

    expect(softwares_subscriptions.findOne).toHaveBeenCalledWith({
      where: mockParams,
      attributes: mockAttributes,
    });

    expect(result).toBeNull(); // Expect the result to be null
  });

  it('should handle errors and throw a message', async () => {
    const mockParams = { id: 1 }; // Example parameters for the query
    const mockAttributes = ['id', 'name', 'type']; // Example attributes to retrieve
    const mockError = new Error('Something went wrong');

    // Mocking the findOne method to reject with an error
    softwares_subscriptions.findOne.mockRejectedValue(mockError);

    await expect(findOne(mockParams, mockAttributes)).rejects.toThrow('Something went wrong'); // Expect the function to throw the error
  });
});
