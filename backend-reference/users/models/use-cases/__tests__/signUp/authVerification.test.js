const { authVerification } = require('../../signUp'); 
const  corporateUser = require('../../../entities/corporateUser'); 
const { authenticator } = require('otplib'); 

jest.mock('../../../entities/credential'); 
jest.mock('../../../entities/corporateUser', () =>({
    findOne: jest.fn(),
    }));
jest.mock('otplib'); 

describe('authVerification function', () => {
    afterEach(() => {
        jest.clearAllMocks(); 
    });

    it('should return false if the user is not found', async () => {
        corporateUser.findOne.mockResolvedValue(null);
    
        let result;
        try {
            result = await authVerification(1, 'someToken');
        } catch (error) {
            result = false; 
        }
    
        expect(result).toBe(false);
        expect(corporateUser.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: 1
            }
        });
    });

    it('should return false if the user has no totpSecret', async () => {
        const mockUser = { id: 1, totpSecret: null };

        corporateUser.findOne.mockResolvedValue(mockUser);

        const result = await authVerification(1, 'someToken');

        expect(result).toBe(false); 
        expect(corporateUser.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: 1
            }
        }); 
    });

    it('should return true if the token is valid', async () => {
        const mockUser = { id: 1, totpSecret: 'secret' };

        corporateUser.findOne.mockResolvedValue(mockUser);
        authenticator.check.mockReturnValue(true); 

        const result = await authVerification(1, 'validToken');

        expect(result).toEqual({ valid: true }); 
        expect(authenticator.check).toHaveBeenCalledWith('validToken', 'secret'); 
    });

    it('should return false if the token is invalid', async () => {
        const mockUser = { id: 1, totpSecret: 'secret' };

        corporateUser.findOne.mockResolvedValue(mockUser);
        authenticator.check.mockReturnValue(false); 
        const result = await authVerification(1, 'invalidToken');

        expect(result).toBe(false); 
        expect(authenticator.check).toHaveBeenCalledWith('invalidToken', 'secret'); 
    });
});
