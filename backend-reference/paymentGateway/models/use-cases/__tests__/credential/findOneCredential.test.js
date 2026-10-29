const { findOneCredential } = require('../../credential');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/credential', () => ({
  findOne: jest.fn(),
}));

describe('findOneCredential', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return credential when found', async () => {
    const mockParams = { id: 1 };
    const mockResult = { id: 1, email: 'test@test.com' };

    credential.findOne.mockResolvedValue(mockResult);

    const result = await findOneCredential(mockParams);

    expect(credential.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      attributes: undefined,
    });
    expect(result).toEqual(mockResult);
  });

  it('should pass attributes when provided', async () => {
    const mockParams = { id: 1 };
    const mockAttributes = ['id', 'email'];

    credential.findOne.mockResolvedValue({ id: 1, email: 'test@test.com' });

    await findOneCredential(mockParams, mockAttributes);

    expect(credential.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      attributes: mockAttributes,
    });
  });

  it('should return null when not found', async () => {
    credential.findOne.mockResolvedValue(null);

    const result = await findOneCredential({ id: 999 });

    expect(result).toBeNull();
  });

  it('should handle errors and return undefined', async () => {
    credential.findOne.mockRejectedValue(new Error('DB Error'));

    const result = await findOneCredential({ id: 1 });

    expect(result).toBeUndefined();
  });

  it('should log final message in finally block', async () => {
    credential.findOne.mockResolvedValue(null);

    await findOneCredential({ id: 1 });

    expect(console.log).toHaveBeenCalledWith('CREDENTIAL FIND ONE ROUTE CALLED');
  });
});
