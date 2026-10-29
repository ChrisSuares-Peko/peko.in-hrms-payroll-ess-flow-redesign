const { authVerification } = require('../../signUp'); // Adjust the path as needed
const corporateUser = require('../../../entities/corporateUser');
const { authenticator } = require('otplib');

jest.mock('../../../entities/corporateUser', () => ({
  findOne: jest.fn(),
}));

jest.mock('otplib', () => ({
  authenticator: {
    check: jest.fn(),
  },
}));

describe('authVerification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

 

  it('should return false if the user does not have a TOTP secret', async () => {
    const mockUserId = 1;
    const mockToken = '123456';
    const mockUser = { credentialId: mockUserId, totpSecret: null };

    corporateUser.findOne.mockResolvedValue(mockUser);

    const result = await authVerification(mockUserId, mockToken);

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: mockUserId,
      },
    });
    expect(result).toBe(false);
  });

  it('should return valid: true if the token is valid', async () => {
    const mockUserId = 1;
    const mockToken = '123456';
    const mockTotpSecret = 'SECRET';
    const mockUser = { credentialId: mockUserId, totpSecret: mockTotpSecret };

    corporateUser.findOne.mockResolvedValue(mockUser);
    authenticator.check.mockReturnValue(true);

    const result = await authVerification(mockUserId, mockToken);

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: mockUserId,
      },
    });
    expect(authenticator.check).toHaveBeenCalledWith(mockToken, mockTotpSecret);
    expect(result).toEqual({ valid: true });
  });

  it('should return false if the token is invalid', async () => {
    const mockUserId = 1;
    const mockToken = '123456';
    const mockTotpSecret = 'SECRET';
    const mockUser = { credentialId: mockUserId, totpSecret: mockTotpSecret };

    corporateUser.findOne.mockResolvedValue(mockUser);
    authenticator.check.mockReturnValue(false);

    const result = await authVerification(mockUserId, mockToken);

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: mockUserId,
      },
    });
    expect(authenticator.check).toHaveBeenCalledWith(mockToken, mockTotpSecret);
    expect(result).toBe(false);
  });

  it('should handle unexpected errors', async () => {
    const mockUserId = 1;
    const mockToken = '123456';
    const mockError = new Error('Database error');

    corporateUser.findOne.mockRejectedValue(mockError);

    await expect(authVerification(mockUserId, mockToken)).rejects.toThrow('Database error');

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: mockUserId,
      },
    });
  });
});
