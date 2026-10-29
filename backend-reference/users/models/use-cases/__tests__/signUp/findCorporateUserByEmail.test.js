const { findCorporateUserByEmail } = require('../../signUp'); 
const corporateUser = require('../../../entities/corporateUser'); 

jest.mock('../../../entities/corporateUser', () => ({
    findOne: jest.fn(),
}));

describe('findCorporateUserByEmail', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return the user if found', async () => {
        const mockUser = { id: 1, email: 'test@example.com' };
        corporateUser.findOne.mockResolvedValue(mockUser);

        const result = await findCorporateUserByEmail('test@example.com');

        expect(result).toEqual(mockUser);
        expect(corporateUser.findOne).toHaveBeenCalledWith({
            where: { email: 'test@example.com' }
        });
    });

    it('should throw an error if the user is not found', async () => {
        corporateUser.findOne.mockResolvedValue(null);

        await expect(findCorporateUserByEmail('notfound@example.com'))
        .rejects.toThrow('Error fetching corporate user');

        expect(corporateUser.findOne).toHaveBeenCalledWith({
            where: { email: 'notfound@example.com' }
        });
    });

    it('should throw an error if the database query fails', async () => {
        corporateUser.findOne.mockRejectedValue(new Error('Database error'));

        await expect(findCorporateUserByEmail('error@example.com'))
            .rejects.toThrow('Error fetching corporate user');

        expect(corporateUser.findOne).toHaveBeenCalledWith({
            where: { email: 'error@example.com' }
        });
    });
});
