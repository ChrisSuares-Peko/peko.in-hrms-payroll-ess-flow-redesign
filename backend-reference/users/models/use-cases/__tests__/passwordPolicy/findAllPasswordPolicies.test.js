const { findAllPasswordPolicies } = require('../../../use-cases/passwordPolicy'); // Adjust path as needed
const passwordPolicy = require('../../../entities/passwordPolicy'); // Adjust path as needed

jest.mock('../../../entities/passwordPolicy', () => ({
    findAll: jest.fn(),
}));

describe('findAllPasswordPolicies', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all password policies', async () => {
        const mockPolicies = [
            { id: 1, level: 'strong', minLength: 12 },
            { id: 2, level: 'medium', minLength: 8 },
        ];

        passwordPolicy.findAll.mockResolvedValue(mockPolicies);

        const result = await findAllPasswordPolicies();

        expect(passwordPolicy.findAll).toHaveBeenCalled();
        expect(result).toEqual(mockPolicies);
    });

    it('should return an empty array if no password policies exist', async () => {
        passwordPolicy.findAll.mockResolvedValue([]);

        const result = await findAllPasswordPolicies();

        expect(passwordPolicy.findAll).toHaveBeenCalled();
        expect(result).toEqual([]);
    });

    it('should handle errors during retrieval', async () => {
        const mockError = new Error('Database error');
        passwordPolicy.findAll.mockRejectedValue(mockError);

        await expect(findAllPasswordPolicies()).rejects.toThrow('Database error'); // Or handle it differently.

        expect(passwordPolicy.findAll).toHaveBeenCalled();
    });
});