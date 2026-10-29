const { deleteReferralCode } = require('../../referral_codes');
const referral_codes = require('../../../entities/referral_codes');

jest.mock('../../../entities/referral_codes', () => ({
  destroy: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
  hasMany: jest.fn(),
}));

describe('deleteReferralCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully delete a referral code with a valid ID', async () => {
    const mockParams = { id: 1 };
    const mockResult = 1; // Sequelize's destroy method returns the number of rows deleted

    referral_codes.destroy.mockResolvedValue(mockResult);

    const result = await deleteReferralCode(mockParams);

    // Verify `destroy` was called with the correct parameters
    expect(referral_codes.destroy).toHaveBeenCalledWith({
      where: { id: mockParams.id },
    });
    expect(result).toEqual(mockResult);
  });

  it('should return 0 if no referral code is found to delete', async () => {
    const mockParams = { id: 999 }; // Non-existent ID
    const mockResult = 0; // Sequelize destroy returns 0 if no rows are deleted

    referral_codes.destroy.mockResolvedValue(mockResult);

    const result = await deleteReferralCode(mockParams);

    // Verify `destroy` was called with the correct parameters
    expect(referral_codes.destroy).toHaveBeenCalledWith({
      where: { id: mockParams.id },
    });
    expect(result).toEqual(mockResult);
  });

  it('should throw an error if the delete operation fails', async () => {
    const mockParams = { id: 1 };
    const mockError = new Error('Database error');

    referral_codes.destroy.mockRejectedValue(mockError);

    await expect(deleteReferralCode(mockParams)).rejects.toThrow('Database error');

    // Verify `destroy` was called with the correct parameters
    expect(referral_codes.destroy).toHaveBeenCalledWith({
      where: { id: mockParams.id },
    });
  });
});
