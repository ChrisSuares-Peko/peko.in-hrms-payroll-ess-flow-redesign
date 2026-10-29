const { Delete } = require('../../categories'); 
const categories = require('../../../entities/categories'); 

jest.mock('../../../entities/categories', () => ({
    destroy: jest.fn(),
}));

jest.mock('../../../entities/products', () =>({
    belongsTo: jest.fn(),
    }));

    jest.mock('../../../entities/subCorporateUsers', () =>({
        belongsTo: jest.fn(),
        }));

describe('Delete function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn(); 
    });

    it('should delete a category successfully', async () => {
        const params = {
            id: 1
        };
        const mockDestroyResult = 1; 

        categories.destroy.mockResolvedValue(mockDestroyResult);

        const result = await Delete(params);

        expect(categories.destroy).toHaveBeenCalledWith({
            where: {
                id: params.id
            }
        });
        expect(result).toBe(mockDestroyResult);
        expect(console.log).toHaveBeenCalledWith("PAKAGE DELETE ROUTE CALLED");
    });

    it('should return 0 if no category is found for deletion', async () => {
        const params = {
            id: 1
        };
        const mockDestroyResult = 0; // 0 means no rows were deleted

        // Mocking the category deletion with no result
        categories.destroy.mockResolvedValue(mockDestroyResult);

        const result = await Delete(params);

        // Assertions
        expect(categories.destroy).toHaveBeenCalledWith({
            where: {
                id: params.id
            }
        });
        expect(result).toBe(mockDestroyResult);
        expect(console.log).toHaveBeenCalledWith("PAKAGE DELETE ROUTE CALLED");
    });
});
