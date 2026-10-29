const { updateReferralCode } = require('../../referral_codes');
const referral_codes = require('../../../entities/referral_codes');

jest.mock('../../../entities/referral_codes', () => ({
  update: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
  hasMany: jest.fn(),
}));

describe('updateReferralCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update a referral code with valid data', async () => {
    const mockParams = { id: 1 };
    const mockData = { referralCode: 'UPDATED123', description: 'Updated description' };
    const mockResult = [1]; // Sequelize update returns an array [numberOfAffectedRows]

    referral_codes.update.mockResolvedValue(mockResult);

    const result = await updateReferralCode(mockParams, mockData);

    // Verify `update` was called with the correct parameters
    expect(referral_codes.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });
    expect(result).toEqual(mockResult);
  });

  it('should return [0] if no rows are updated', async () => {
    const mockParams = { id: 999 }; // Non-existent ID
    const mockData = { referralCode: 'NON_EXISTENT' };
    const mockResult = [0]; // Sequelize update returns [0] if no rows are updated

    referral_codes.update.mockResolvedValue(mockResult);

    const result = await updateReferralCode(mockParams, mockData);

    // Verify `update` was called with the correct parameters
    expect(referral_codes.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });
    expect(result).toEqual(mockResult);
  });

  it('should throw an error if the update operation fails', async () => {
    const mockParams = { id: 1 };
    const mockData = { referralCode: 'ERROR_CODE' };
    const mockError = new Error('Database error');

    referral_codes.update.mockRejectedValue(mockError);

    await expect(updateReferralCode(mockParams, mockData)).rejects.toThrow('Database error');

    // Verify `update` was called with the correct parameters
    expect(referral_codes.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });
  });
});
