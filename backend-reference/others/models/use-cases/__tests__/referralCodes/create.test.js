const { create } = require('../../referral_codes');
const referral_codes = require('../../../entities/referral_codes');

jest.mock('../../../entities/referral_codes', () => ({
  create: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
  hasMany: jest.fn(),
}));

describe('create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new referral code and return the data', async () => {
    const mockParams = {
      code: 'REF123',
      description: 'Referral Code for testing',
    };

    const mockCodeData = {
      id: 1,
      ...mockParams,
    };

    referral_codes.create.mockResolvedValue(mockCodeData);

    const result = await create(mockParams);

    // Verify `create` was called with the correct parameters
    expect(referral_codes.create).toHaveBeenCalledWith(mockParams);
    expect(result).toEqual(mockCodeData);
  });

  it('should return false if the referral code creation fails', async () => {
    const mockParams = {
      code: 'REF123',
      description: 'Referral Code for testing',
    };

    referral_codes.create.mockResolvedValue(null); // Simulating failure

    const result = await create(mockParams);

    // Verify `create` was called with the correct parameters
    expect(referral_codes.create).toHaveBeenCalledWith(mockParams);
    expect(result).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const mockParams = {
      code: 'REF123',
      description: 'Referral Code for testing',
    };

    const mockError = new Error('Database error');

    referral_codes.create.mockRejectedValue(mockError); // Simulating an exception

    await expect(create(mockParams)).rejects.toThrow('Database error');

    // Verify `create` was called with the correct parameters
    expect(referral_codes.create).toHaveBeenCalledWith(mockParams);
  });
});
