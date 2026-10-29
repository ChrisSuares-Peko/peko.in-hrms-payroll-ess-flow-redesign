const { authVerification } = require('../../../use-cases/signUp'); 
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

    it('should return true when the token is valid', async () => {
        const mockUserId = 1;
        const mockToken = '123456';
        const mockTotpSecret = 'REDACTED';
        const mockUser = { credentialId: mockUserId, totpSecret: mockTotpSecret };

        corporateUser.findOne.mockResolvedValue(mockUser);
        authenticator.check.mockReturnValue(true);

        const result = await authVerification(mockUserId, mockToken);

        expect(corporateUser.findOne).toHaveBeenCalledWith({ where: { credentialId: mockUserId } });
        expect(authenticator.check).toHaveBeenCalledWith(mockToken, mockTotpSecret);
        expect(result).toEqual({ valid: true });
    });

    it('should return false when the token is invalid', async () => {
        const mockUserId = 1;
        const mockToken = '123456';
        const mockTotpSecret = 'REDACTED';
        const mockUser = { credentialId: mockUserId, totpSecret: mockTotpSecret };

        corporateUser.findOne.mockResolvedValue(mockUser);
        authenticator.check.mockReturnValue(false);

        const result = await authVerification(mockUserId, mockToken);

        expect(corporateUser.findOne).toHaveBeenCalledWith({ where: { credentialId: mockUserId } });
        expect(authenticator.check).toHaveBeenCalledWith(mockToken, mockTotpSecret);
        expect(result).toBe(false);
    });

   

    it('should return false when totpSecret is not found', async () => {
        const mockUserId = 1;
        const mockToken = '123456';
        const mockUser = { credentialId: mockUserId }; // No totpSecret

        corporateUser.findOne.mockResolvedValue(mockUser);

        const result = await authVerification(mockUserId, mockToken);

        expect(corporateUser.findOne).toHaveBeenCalledWith({ where: { credentialId: mockUserId } });
        expect(authenticator.check).not.toHaveBeenCalled();
        expect(result).toBe(false);
    });

    it('should handle errors during database operations', async () => {
        const mockUserId = 1;
        const mockToken = '123456';
        const mockError = new Error('Database error');

        corporateUser.findOne.mockRejectedValue(mockError);

        await expect(authVerification(mockUserId, mockToken)).rejects.toThrow(mockError); // Or handle as you prefer

        expect(corporateUser.findOne).toHaveBeenCalledWith({ where: { credentialId: mockUserId } });
    });

   
});