const { findCategories } = require('../../categories'); 
const categories = require('../../../entities/categories'); 
const vendors = require('../../../entities/vendor'); 

jest.mock('../../../entities/categories', () => ({
    findAll: jest.fn(),
}));

jest.mock('../../../entities/products', () =>({
    belongsTo: jest.fn(),
    }));
    jest.mock('../../../entities/subCorporateUsers', () =>({
        belongsTo: jest.fn(),
        }));

describe('findCategories function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should retrieve categories with vendor name "Ecom" and category status true', async () => {
        const mockCategories = [
            { id: 1, categoryName: 'Electronics', categoryStatus: true },
            { id: 2, categoryName: 'Furniture', categoryStatus: true }
        ];

        // Mock implementation
        categories.findAll.mockResolvedValue(mockCategories);

        const result = await findCategories();

        expect(categories.findAll).toHaveBeenCalledWith({
            include: [{
                model: vendors,
                attributes: ['id', 'vendorName'],
                where: {
                    vendorName: 'Ecom'
                }
            }],
            where: {
                categoryStatus: true
            }
        });
        expect(result).toEqual(mockCategories);
    });

    it('should return an empty array if no categories are found', async () => {
        const mockCategories = [];

        // Mock implementation
        categories.findAll.mockResolvedValue(mockCategories);

        const result = await findCategories();

        expect(categories.findAll).toHaveBeenCalledWith({
            include: [{
                model: vendors,
                attributes: ['id', 'vendorName'],
                where: {
                    vendorName: 'Ecom'
                }
            }],
            where: {
                categoryStatus: true
            }
        });
        expect(result).toEqual(mockCategories);
    });

    it('should handle errors thrown by the categories model', async () => {
        const errorMessage = 'Database error';

        // Mock implementation
        categories.findAll.mockRejectedValue(new Error(errorMessage));

        await expect(findCategories()).rejects.toThrow(errorMessage);
    });
});
