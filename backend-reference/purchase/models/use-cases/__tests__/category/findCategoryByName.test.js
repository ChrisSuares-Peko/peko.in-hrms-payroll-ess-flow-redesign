const category = require('../../../entities/category');
const { findCategoryByName } = require('../../category');

jest.mock('../../../entities/category', () => ({
    findOne: jest.fn(),
}));

describe('Category › findCategoryByName', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return category when category name exists', async () => {
        const categoryName = 'Flights';

        const mockCategory = {
            id: 1,
            categoryName: 'Flights',
            status: true,
        };

        category.findOne.mockResolvedValue(mockCategory);

        const result = await findCategoryByName(categoryName);

        expect(category.findOne).toHaveBeenCalledWith({
            where: {
                categoryName,
            },
            raw: true,
        });

        expect(result).toEqual(mockCategory);
    });

    it('should return null when category name does not exist', async () => {
        const categoryName = 'NonExistingCategory';

        category.findOne.mockResolvedValue(null);

        const result = await findCategoryByName(categoryName);

        expect(category.findOne).toHaveBeenCalled();
        expect(result).toBeNull();
    });

    it('should return false when category.findOne throws an error', async () => {
        const categoryName = 'Flights';

        category.findOne.mockRejectedValue(
            new Error('Database error')
        );

        const result = await findCategoryByName(categoryName);

        expect(result).toBe(false);
    });
});
