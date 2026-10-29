const { findOneWithCredentialId } = require('../../corporateUser');  // Adjust the import path as needed
const corporateUser = require('../../../entities/corporateUser');

// Mocking the corporateUser model
jest.mock('../../../entities/corporateUser', () => ({
  findOne: jest.fn(),
}));

describe('findOneWithCredentialId', () => {
  afterEach(() => {
    jest.clearAllMocks();  // Clear mocks after each test
  });

  it('should return corporate user data for a valid credentialId', async () => {
    const mockCredentialId = 123;
    const mockCorporateUserData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      credentialId: mockCredentialId,
    };

    // Mock the findOne method to return mock corporate user data
    corporateUser.findOne.mockResolvedValue(mockCorporateUserData);

    // Call the function
    const result = await findOneWithCredentialId(mockCredentialId);

    // Ensure the corporateUser.findOne method was called with the correct parameters
    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: { credentialId: mockCredentialId },
    });

    // Check the result contains the expected corporate user data
    expect(result).toEqual(mockCorporateUserData);
  });

  it('should return null if no corporate user data is found for the credentialId', async () => {
    const mockCredentialId = 999;  // Non-existent credentialId

    // Mock the findOne method to return null (no user found)
    corporateUser.findOne.mockResolvedValue(null);

    // Call the function
    const result = await findOneWithCredentialId(mockCredentialId);

    // Ensure the function returns null when no data is found
    expect(result).toBeNull();
  });

 
});
