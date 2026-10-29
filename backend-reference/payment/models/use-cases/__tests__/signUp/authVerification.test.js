const { authVerification } = require('../../signUp'); // Adjust the path as needed
const corporateUser = require('../../../entities/corporateUser');
const {
    authenticator
  } = require('otplib');

// Mock dependencies
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
      jest.clearAllMocks(); // Clear mock history before each test
    });
  
   
  
    it('should return false if totpSecret is missing', async () => {
      const userId = '12345';
      const token = 'some-token';
      const mockUser = {
        totpSecret: null, // Missing TOTP secret
        backupCodes: [],
      };
  
      // Mock implementation
      corporateUser.findOne.mockResolvedValue(mockUser);
  
      const result = await authVerification(userId, token);
  
      expect(corporateUser.findOne).toHaveBeenCalledWith({
        where: {
          credentialId: userId,
        },
      });
      expect(result).toBe(false);
    });
  
    it('should return valid true if token is valid by TOTP', async () => {
      const userId = '12345';
      const token = 'valid-token';
      const mockUser = {
        totpSecret: 'REDACTED',
        backupCodes: [],
      };
  
      // Mock implementation
      corporateUser.findOne.mockResolvedValue(mockUser);
      authenticator.check.mockReturnValue(true); // Token is valid by TOTP
  
      const result = await authVerification(userId, token);
  
      expect(corporateUser.findOne).toHaveBeenCalledWith({
        where: {
          credentialId: userId,
        },
      });
      expect(authenticator.check).toHaveBeenCalledWith(token, mockUser.totpSecret);
      expect(result).toEqual({ valid: true });
    });
  
    it('should return valid true if token is in backup codes', async () => {
      const userId = '12345';
      const token = 'backup-token';
      const mockUser = {
        totpSecret: 'REDACTED',
        backupCodes: ['backup-token'],
      };
  
      // Mock implementation
      corporateUser.findOne.mockResolvedValue(mockUser);
      authenticator.check.mockReturnValue(false); // Token is not valid by TOTP
  
      const result = await authVerification(userId, token);
  
      expect(corporateUser.findOne).toHaveBeenCalledWith({
        where: {
          credentialId: userId,
        },
      });
      expect(result).toEqual(false);
    });
  
    it('should return false if token is invalid and not in backup codes', async () => {
      const userId = '12345';
      const token = 'invalid-token';
      const mockUser = {
        totpSecret: 'REDACTED',
        backupCodes: [],
      };
  
      // Mock implementation
      corporateUser.findOne.mockResolvedValue(mockUser);
      authenticator.check.mockReturnValue(false); // Token is invalid by TOTP
  
      const result = await authVerification(userId, token);
  
      expect(corporateUser.findOne).toHaveBeenCalledWith({
        where: {
          credentialId: userId,
        },
      });
      expect(result).toBe(false);
    });
  
    it('should handle errors thrown by findOne or authenticator.check', async () => {
      const userId = 'someUser';
      const token = 'someToken';
      
      // Simulate an error thrown by findOne
      corporateUser.findOne.mockRejectedValue(new Error('Database error'));
      await expect(authVerification(userId, token)).rejects.toThrow('Database error');
  
      // Simulate an error thrown by authenticator.check
      corporateUser.findOne.mockResolvedValue({
        totpSecret: 'REDACTED',
        backupCodes: [],
      });
      authenticator.check.mockImplementation(() => {
        throw new Error('Authenticator error');
      });
      await expect(authVerification(userId, token)).rejects.toThrow('Authenticator error');
    });
  });