const { signUpCount } = require('../../signUp'); 
const corporateUser = require('../../../entities/corporateUser'); 


jest.mock('../../../entities/corporateUser', () =>({
    hasMany: jest.fn(),
    hasOne: jest.fn(),
    belongsTo: jest.fn(),
    }));

describe('signUpCount Function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the count of corporate users', async () => {
        // Mock the count method to return a specific value
        corporateUser.count = jest.fn().mockResolvedValue(42);

        const result = await signUpCount();

        expect(result).toBe(42);
        expect(corporateUser.count).toHaveBeenCalledWith({});
    });

    it('should handle errors correctly', async () => {
        // Mock the count method to throw an error
        corporateUser.count = jest.fn().mockRejectedValue(new Error('Database error'));

        await expect(signUpCount()).rejects.toThrow('Failed to get sign-up count');
    });
});
