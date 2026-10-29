const { deletePasswordPolicy } = require('../../passwordPolicy');
const passwordPolicy = require('../../../entities/passwordPolicy');

jest.mock('../../../entities/passwordPolicy', () => ({
  destroy: jest.fn(),
}));

describe('deletePasswordPolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a password policy successfully', async () => {
    const mockPolicyId = 1;
    const mockResult = 1; // Sequelize destroy method returns the number of rows deleted

    passwordPolicy.destroy.mockResolvedValue(mockResult);

    const result = await deletePasswordPolicy(mockPolicyId);

    expect(passwordPolicy.destroy).toHaveBeenCalledTimes(1);
    expect(passwordPolicy.destroy).toHaveBeenCalledWith({
      where: { id: mockPolicyId },
    });
    expect(result).toEqual(mockResult);
  });

  it('should return 0 if no password policy is found to delete', async () => {
    const mockPolicyId = 999; // Non-existent policy ID
    const mockResult = 0;

    passwordPolicy.destroy.mockResolvedValue(mockResult);

    const result = await deletePasswordPolicy(mockPolicyId);

    expect(passwordPolicy.destroy).toHaveBeenCalledTimes(1);
    expect(passwordPolicy.destroy).toHaveBeenCalledWith({
      where: { id: mockPolicyId },
    });
    expect(result).toEqual(mockResult);
  });

  it('should handle errors during deletion', async () => {
    const mockPolicyId = 1;
    const mockError = new Error('Database error');

    passwordPolicy.destroy.mockRejectedValue(mockError);

    await expect(deletePasswordPolicy(mockPolicyId)).rejects.toThrow('Database error');
    expect(passwordPolicy.destroy).toHaveBeenCalledTimes(1);
    expect(passwordPolicy.destroy).toHaveBeenCalledWith({
      where: { id: mockPolicyId },
    });
  });
});
