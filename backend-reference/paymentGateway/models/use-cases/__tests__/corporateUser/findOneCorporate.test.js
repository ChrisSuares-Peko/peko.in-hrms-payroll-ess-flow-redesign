const { findOneCorporate } = require('../../corporateUser');
const corporateUser = require('../../../entities/corporateUser');

jest.mock('../../../entities/corporateUser', () => ({
  findOne: jest.fn(),
}));

describe('findOneCorporate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return corporate user with credential include when found', async () => {
    const mockParams = { id: 1 };
    const mockAttributes = ['id', 'companyName'];
    const mockCredentialAttributes = ['email', 'name'];
    const mockResult = { id: 1, companyName: 'Test Corp', credential: { email: 'test@test.com', name: 'Test' } };

    corporateUser.findOne.mockResolvedValue(mockResult);

    const result = await findOneCorporate(mockParams, mockAttributes, mockCredentialAttributes);

    expect(corporateUser.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        attributes: mockAttributes,
        nest: true,
        raw: true,
      })
    );
    expect(result).toEqual(mockResult);
  });

  it('should return null when corporate user not found', async () => {
    corporateUser.findOne.mockResolvedValue(null);

    const result = await findOneCorporate({ id: 999 });

    expect(result).toBeNull();
  });

  it('should throw error when DB fails', async () => {
    corporateUser.findOne.mockRejectedValue(new Error('DB Error'));

    await expect(findOneCorporate({ id: 1 })).rejects.toThrow('DB Error');
  });
});
