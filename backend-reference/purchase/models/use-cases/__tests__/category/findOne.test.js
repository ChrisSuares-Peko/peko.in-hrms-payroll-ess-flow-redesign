const category = require('../../../entities/category');
const { findOne } = require('../../category');

jest.mock('../../../entities/category', () => ({
    findOne: jest.fn(),
}));

describe('Category › findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return category data when record exists', async () => {
        const params = { id: 1 };

        const mockCategory = {
            id: 1,
            name: 'Flights',
            status: true,
        };

        category.findOne.mockResolvedValue(mockCategory);

        const result = await findOne(params);

        expect(category.findOne).toHaveBeenCalledWith({
            where: {
                id: params.id,
            },
            raw: true,
            nest: true,
        });

        expect(result).toEqual(mockCategory);
    });

    it('should return null when category does not exist', async () => {
        const params = { id: 999 };

        category.findOne.mockResolvedValue(null);

        const result = await findOne(params);

        expect(category.findOne).toHaveBeenCalled();
        expect(result).toBeNull();
    });

    it('should throw error if category.findOne fails', async () => {
        const params = { id: 1 };

        category.findOne.mockRejectedValue(
            new Error('Database error')
        );

        await expect(findOne(params))
            .rejects
            .toThrow('Database error');
    });

    it('should throw error when params is undefined', async () => {
        await expect(findOne(undefined))
            .rejects
            .toThrow(TypeError);
    });
});
