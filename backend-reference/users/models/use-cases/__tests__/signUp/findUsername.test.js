const { findUsername } = require('../../signUp');
const credential = require('../../../entities/credential'); 


jest.mock('../../../entities/credential'); 
jest.mock('../../../entities/corporateUser', () =>({
    hasMany: jest.fn(),
    hasOne: jest.fn(),
    belongsTo: jest.fn(),
    }));

describe('findUsername function', () => {
    afterEach(() => {
        jest.clearAllMocks(); 
    });

    it('should return a record successfully based on the username', async () => {
        const params = 'testUser';
        const mockRecord = { id: 1, username: 'testUser', password: 'REDACTED' };

        credential.findOne.mockResolvedValue(mockRecord);

        const result = await findUsername(params);

        expect(result).toEqual(mockRecord); 
        expect(credential.findOne).toHaveBeenCalledWith({
            where: { username: params }
        }); 
    });

    it('should return null if no record is found', async () => {
        const params = 'nonexistentUser';

        credential.findOne.mockResolvedValue(null);

        const result = await findUsername(params);

        expect(result).toBeNull(); 
        expect(credential.findOne).toHaveBeenCalledWith({
            where: { username: params }
        }); 
    });

    it('should handle errors and throw an exception', async () => {
        const params = 'testUser';
        const mockError = new Error('Something went wrong');

        credential.findOne.mockRejectedValue(mockError);

        await expect(findUsername(params)).rejects.toThrow('Something went wrong'); 
        expect(credential.findOne).toHaveBeenCalledWith({
            where: { username: params }
        }); 
    });
});
