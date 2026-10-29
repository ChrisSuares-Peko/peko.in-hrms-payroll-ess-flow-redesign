const { findOneWithCredentialId } = require('../../corporateUser');
const corporateUser  = require('../../../entities/corporateUser');

jest.mock('../../../entities/corporateUser', () =>({
  hasMany: jest.fn(),
  findOne:jest.fn(),
  }));
describe('find OneWith CredentialId', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should successfully retrieve a record with a valid credentialId', async () => {
    const credentialId = 'valid-id';
    const mockUser = { id: 1, name: 'Test User', credentialId: 'valid-id' };
    corporateUser.findOne.mockResolvedValue(mockUser);

    const result = await findOneWithCredentialId(credentialId);

    expect(result).toEqual(mockUser);
    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: credentialId,
      },
      attributes: undefined,
      nest: true,
      raw: true,
    });
  });

  it('should return null if no record is found for the given credentialId', async () => {

    const credentialId = 'non-existent-id';
    corporateUser.findOne.mockResolvedValue(null);
  
    const result = await findOneWithCredentialId(credentialId);
  
    expect(result).toBeNull();
    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: credentialId,
      },
      attributes: undefined,
      nest: true,
      raw: true,
    });
  });

  it('should handle invalid credentialId gracefully', async () => {
    const credentialId = ''; 
    corporateUser.findOne.mockResolvedValue(null);
  
    const result = await findOneWithCredentialId(credentialId);

    expect(result).toBeNull();
    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: credentialId,
      },
      attributes: undefined,
      nest: true,
      raw: true,
    });
  });

  it('should handle database errors gracefully', async () => {
    const credentialId = 'valid-id';
    const errorMessage = 'Database connection error';
    corporateUser.findOne.mockImplementation(() => {
      throw new Error(errorMessage);
    });
  
    await expect(findOneWithCredentialId(credentialId)).rejects.toThrow(errorMessage);
    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: credentialId,
      },
      attributes: undefined,
      nest: true,
      raw: true,
    });
  });
  
});
