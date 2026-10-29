const { find } = require('../../categories'); 
const categories = require('../../../entities/categories'); 

jest.mock('../../../entities/categories', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/products', () =>({
    belongsTo: jest.fn(),
    }));
    jest.mock('../../../entities/subCorporateUsers', () =>({
        belongsTo: jest.fn(),
        }));


describe('find function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should retrieve a category by ID successfully', async () => {
        const params = { id: 1 };
        const mockCategory = { id: 1, name: 'Electronics' };

        // Mock implementation
        categories.findOne.mockResolvedValue(mockCategory);

        const result = await find(params);

        expect(categories.findOne).toHaveBeenCalledWith({
            where: { id: params.id }
        });
        expect(result).toEqual(mockCategory);
    });

    it('should return null if no category is found', async () => {
        const params = { id: 999 }; // Assuming this ID does not exist
        const mockCategory = null;

        // Mock implementation
        categories.findOne.mockResolvedValue(mockCategory);

        const result = await find(params);

        expect(categories.findOne).toHaveBeenCalledWith({
            where: { id: params.id }
        });
        expect(result).toBeNull();
    });

    it('should handle errors thrown by the categories model', async () => {
        const params = { id: 1 };
        const errorMessage = 'Database error';

        // Mock implementation
        categories.findOne.mockRejectedValue(new Error(errorMessage));

        await expect(find(params)).rejects.toThrow(errorMessage);
    });
});
