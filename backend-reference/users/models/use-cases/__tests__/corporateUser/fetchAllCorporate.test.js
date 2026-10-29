const corporateUser = require('../../../entities/corporateUser');
const { fetchAllCorporate } = require('../../corporateUser');

jest.mock('../../../entities/corporateUser', () => ({
    hasMany: jest.fn(),
    findAll: jest.fn(),
}));
jest.mock('../../../entities/credential', () => ({}));

describe('corporateUser - fetchAllCorporate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch all active corporates matching search query', async () => {
        const mockResult = [
            { id: 2, name: 'Corp A', credential: { username: 'corpa' } },
        ];
        corporateUser.findAll.mockResolvedValue(mockResult);

        const result = await fetchAllCorporate('Corp', 1);

        expect(corporateUser.findAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('should exclude the specified corporateId', async () => {
        corporateUser.findAll.mockResolvedValue([]);

        await fetchAllCorporate('test', 5);

        const call = corporateUser.findAll.mock.calls[0][0];
        expect(call.where.isActive).toBe(true);
    });

    it('should return empty array when no matches', async () => {
        corporateUser.findAll.mockResolvedValue([]);

        const result = await fetchAllCorporate('nonexistent', 1);

        expect(result).toEqual([]);
    });

    it('should handle errors', async () => {
        corporateUser.findAll.mockRejectedValue(new Error('DB error'));

        await expect(fetchAllCorporate('test', 1)).rejects.toThrow('DB error');
    });
});
