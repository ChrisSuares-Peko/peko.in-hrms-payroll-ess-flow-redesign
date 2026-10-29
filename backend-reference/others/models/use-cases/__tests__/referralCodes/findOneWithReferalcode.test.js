const { findOneWithReferalcode } = require('../../referral_codes');
const referral_codes = require('../../../entities/referral_codes');

jest.mock('../../../entities/referral_codes', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
  hasMany: jest.fn(),
}));

describe('findOneWithReferalcode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return referral code data when the code exists', async () => {
    const mockParams = 'REF123';
    const mockCodeData = {
      id: 1,
      referralCode: 'REF123',
      description: 'Test Referral Code',
    };

    referral_codes.findOne.mockResolvedValue(mockCodeData);

    const result = await findOneWithReferalcode(mockParams);

    // Verify `findOne` was called with the correct parameters
    expect(referral_codes.findOne).toHaveBeenCalledWith({
      where: { referralCode: mockParams },
      raw: true,
      nest: true,
    });
    expect(result).toEqual(mockCodeData);
  });

  it('should return null if no referral code is found', async () => {
    const mockParams = 'NON_EXISTENT_CODE';

    referral_codes.findOne.mockResolvedValue(null); // Simulating no data found

    const result = await findOneWithReferalcode(mockParams);

    // Verify `findOne` was called with the correct parameters
    expect(referral_codes.findOne).toHaveBeenCalledWith({
      where: { referralCode: mockParams },
      raw: true,
      nest: true,
    });
    expect(result).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const mockParams = 'ERROR_CODE';
    const mockError = new Error('Database error');

    referral_codes.findOne.mockRejectedValue(mockError); // Simulating an exception

    await expect(findOneWithReferalcode(mockParams)).rejects.toThrow('Database error');

    // Verify `findOne` was called with the correct parameters
    expect(referral_codes.findOne).toHaveBeenCalledWith({
      where: { referralCode: mockParams },
      raw: true,
      nest: true,
    });
  });
});
