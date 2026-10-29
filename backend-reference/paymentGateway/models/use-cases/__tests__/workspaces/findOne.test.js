const { findOne } = require('../../workspaces');
const workspaces = require('../../../entities/workspaces');

jest.mock('../../../entities/workspaces', () => ({
  findOne: jest.fn(),
}));

describe('workspaces - findOne', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return workspace when found', async () => {
    const mockResult = { id: 1, name: 'Test Workspace' };
    workspaces.findOne.mockResolvedValue(mockResult);

    const result = await findOne({ id: 1 });

    expect(workspaces.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      raw: true,
      nest: true,
    });
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    workspaces.findOne.mockResolvedValue(null);

    const result = await findOne({ id: 999 });

    expect(result).toBeNull();
  });

  it('should throw error when DB fails', async () => {
    workspaces.findOne.mockRejectedValue(new Error('DB Error'));

    await expect(findOne({ id: 1 })).rejects.toThrow('DB Error');
  });
});
