const { findOneWithCredentialId } = require('../../corporateUser');
const corporateUser = require('../../../entities/corporateUser'); // Adjust paths accordingly

// Mock the findOne method explicitly
jest.mock('../../../entities/corporateUser', () => ({
  findOne: jest.fn(), // Mock findOne explicitly
  belongsTo: jest.fn(),
}));

describe('find OneWith CredentialId', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should successfully retrieve a record with a valid credentialId', async () => {
    const credentialId = 'valid-id';
    const mockUser = { id: 1, name: 'Test User', credentialId: 'valid-id' };
    corporateUser.findOne.mockResolvedValue(mockUser); // Mock the resolved value

    const result = await findOneWithCredentialId(credentialId);

    expect(result).toEqual(mockUser);
    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: credentialId,
      },
    });
  });

  it('should return null if no record is found for the given credentialId', async () => {
    const credentialId = 'non-existent-id';
    corporateUser.findOne.mockResolvedValue(null); // Mock the resolved value as null

    const result = await findOneWithCredentialId(credentialId);

    expect(result).toBeNull();
    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: credentialId,
      },
    });
  });

  it('should handle invalid credentialId gracefully', async () => {
    const credentialId = ''; 
    corporateUser.findOne.mockResolvedValue(null); // Mock the resolved value as null

    const result = await findOneWithCredentialId(credentialId);

    expect(result).toBeNull();
    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: credentialId,
      },
    });
  });

  it('should handle database errors gracefully', async () => {
    const credentialId = 'valid-id';
    const errorMessage = 'Database connection error';
    corporateUser.findOne.mockImplementation(() => { // Mock the implementation to throw an error
      throw new Error(errorMessage);
    });

    await expect(findOneWithCredentialId(credentialId)).rejects.toThrow(errorMessage);
    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: credentialId,
      },
    });
  });
});
