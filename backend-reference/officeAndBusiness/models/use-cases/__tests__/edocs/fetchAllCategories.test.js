const { fetchAllCategories } = require('../../edocs');  // Adjust path as necessary
const Category = require('../../../entities/categories');
const vendors =require('../../../entities/vendor');



jest.mock('../../../entities/categories', () => ({  
    findAll: jest.fn(),
}));

jest.mock('../../../entities/vendor', () => ({
}));

describe('fetchAllCategories', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch categories with vendors having name "edocs"', async () => {
        // Arrange
        const mockCategories = [
            { id: 1, name: 'Category 1' },
            { id: 2, name: 'Category 2' }
        ];

        Category.findAll.mockResolvedValue(mockCategories);

        // Act
        const result = await fetchAllCategories();

        // Assert
        expect(Category.findAll).toHaveBeenCalledWith({
            include: [{
                model: vendors,
                attributes: ['id', 'vendorName'],
                where: {
                    vendorName: 'edocs',
                }
            }],
            where: {
                categoryStatus: true
            }
        });

        expect(result).toEqual(mockCategories);
    });

    it('should handle errors gracefully', async () => {
        // Arrange
        const errorMessage = 'Database error';
        Category.findAll.mockRejectedValue(new Error(errorMessage));

        // Act
        const result = await fetchAllCategories();

        // Assert
        expect(Category.findAll).toHaveBeenCalled();
        expect(result).toBeUndefined(); // No value should be returned due to error
    });

    it('should log that the route is called', async () => {
        // Arrange
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const mockCategories = [{ id: 1, name: 'Category 1' }];
        Category.findAll.mockResolvedValue(mockCategories);

        // Act
        await fetchAllCategories();

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith("CATEGORY FIND ALL ROUTE CALLED");
        consoleLogSpy.mockRestore(); // Restore original implementation
    });
});