const corporateUser = require('../../../entities/corporateUser');
const { Delete } = require('../../corporateUser');

jest.mock('../../../entities/corporateUser', () => ({
  destroy: jest.fn(), // Mocking the destroy method
}));

describe('deleting the account', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully delete a user with a valid id', async () => {
    const params = { id: 1 };
    const mockAffectedRows = 1;

    corporateUser.destroy.mockResolvedValue(mockAffectedRows);

    const result = await Delete(params);

    expect(corporateUser.destroy).toHaveBeenCalledWith({
      where: { id: params.id },
    });
    expect(result).toBe(mockAffectedRows);
  });

  it('should return 0 affected rows if no user is found for the given id', async () => {
    const params = { id: 2 };
    const mockAffectedRows = 0;

    corporateUser.destroy.mockResolvedValue(mockAffectedRows);

    const result = await Delete(params);

    expect(corporateUser.destroy).toHaveBeenCalledWith({
      where: { id: params.id },
    });
    expect(result).toBe(mockAffectedRows);
  });

  it('should handle undefined params gracefully', async () => {
    const params = undefined;

    await expect(Delete(params)).rejects.toThrow(TypeError);
  });

  it('should handle missing id in params', async () => {
    const params = {};

    const mockAffectedRows = 0;

    corporateUser.destroy.mockResolvedValue(mockAffectedRows);

    const result = await Delete(params);

    expect(corporateUser.destroy).toHaveBeenCalledWith({
      where: { id: params.id },
    });
    expect(result).toBe(mockAffectedRows);
  });

  it('should handle errors during the deletion', async () => {
    const params = { id: 1 };
    const mockError = new Error('Database error');

    corporateUser.destroy.mockRejectedValue(mockError);

    await expect(Delete(params)).rejects.toThrow('Database error');
  });
});
