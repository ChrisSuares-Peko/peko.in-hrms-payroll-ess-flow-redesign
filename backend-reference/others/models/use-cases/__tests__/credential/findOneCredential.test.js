const { findOneCredential } = require('../../credential');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/credential', () => ({
  findOne: jest.fn(),
}));

describe('findOneCredential', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should fetch a credential by id with no attributes specified', async () => {
    const params = { id: 5 };
    const mockCredential = { id: 5, username: "abc" };

    credential.findOne.mockResolvedValue(mockCredential);

    const result = await findOneCredential(params);

    expect(credential.findOne).toHaveBeenCalledWith({
      where: { id: params.id },
      attributes: undefined,
    });

    expect(result).toBe(mockCredential);
  });

  it('should fetch a credential by id with specific attributes', async () => {
    const params = { id: 10 };
    const attributes = ['id', 'username'];
    const mockCredential = { id: 10, username: "testuser" };

    credential.findOne.mockResolvedValue(mockCredential);

    const result = await findOneCredential(params, attributes);

    expect(credential.findOne).toHaveBeenCalledWith({
      where: { id: params.id },
      attributes,
    });

    expect(result).toBe(mockCredential);
  });

  it('should return null when no credential is found', async () => {
    const params = { id: 1 };

    credential.findOne.mockResolvedValue(null);

    const result = await findOneCredential(params);

    expect(result).toBeNull();
  });

  it('should catch and log errors without throwing', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    const error = new Error("Something failed");

    credential.findOne.mockRejectedValue(error);

    await findOneCredential({ id: 1 });

    expect(consoleSpy).toHaveBeenCalledWith(error);

    consoleSpy.mockRestore();
  });

});