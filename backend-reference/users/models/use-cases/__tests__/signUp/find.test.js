const { find } = require('../../signUp'); 
const corporateUser = require('../../../entities/corporateUser');

jest.mock('../../../entities/corporateUser', () =>({
    hasMany: jest.fn(),
    hasOne: jest.fn(),
    belongsTo: jest.fn(),
    }));

describe('find Function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a user by email', async () => {
        const params = { email: 'test@example.com', mobileNo: '1234567890' };
        const mockUser = { id: 1, email: 'test@example.com', mobileNo: '1234567890' };

        // Mock the findOne method to return a specific user
        corporateUser.findOne = jest.fn().mockResolvedValue(mockUser);

        const result = await find(params);

        expect(result).toEqual(mockUser);
        expect(corporateUser.findOne).toHaveBeenCalledWith({
            where: { email: params.email }
        });
    });

    it('should return null if no user is found', async () => {
        const params = { email: 'notfound@example.com', mobileNo: '0000000000' };

        // Mock the findOne method to return null
        corporateUser.findOne = jest.fn().mockResolvedValue(null);

        const result = await find(params);

        expect(result).toBeNull();
        expect(corporateUser.findOne).toHaveBeenCalledWith({
            where: { email: params.email }
        });
    });

    it('should handle errors correctly', async () => {
        const params = { email: 'error@example.com', mobileNo: '0000000000' };

        // Mock the findOne method to throw an error
        corporateUser.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

        await expect(find(params)).rejects.toThrow('Database error');
    });
});
