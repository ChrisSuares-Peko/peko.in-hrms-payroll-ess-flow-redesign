const corporateUser = require('../../../entities/corporateUser');
const credential = require('../../../entities/credential');
const { findOneCorporate } = require('../../corporateUser');

jest.mock('../../../entities/corporateUser', () => ({
    hasMany: jest.fn(),
    findOne: jest.fn(),
}));
jest.mock('../../../entities/credential', () => ({}));

describe('corporateUser - findOneCorporate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a corporate user with credential username', async () => {
        const mockUser = { id: 1, name: 'Corp', credential: { username: 'corp1' } };
        corporateUser.findOne.mockResolvedValue(mockUser);

        const result = await findOneCorporate({ id: 1 });

        expect(corporateUser.findOne).toHaveBeenCalledWith({
            include: [{ model: credential, attributes: ['username'] }],
            where: { id: 1 },
            attributes: undefined,
            nest: true,
            raw: true,
        });
        expect(result).toEqual(mockUser);
    });

    it('should accept custom attributes', async () => {
        corporateUser.findOne.mockResolvedValue({ name: 'Corp' });

        const result = await findOneCorporate({ id: 1 }, ['name']);

        expect(corporateUser.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ attributes: ['name'] })
        );
        expect(result).toEqual({ name: 'Corp' });
    });

    it('should return null when not found', async () => {
        corporateUser.findOne.mockResolvedValue(null);

        const result = await findOneCorporate({ id: 999 });

        expect(result).toBeNull();
    });

    it('should handle errors', async () => {
        corporateUser.findOne.mockRejectedValue(new Error('DB error'));

        await expect(findOneCorporate({ id: 1 })).rejects.toThrow('DB error');
    });
});
