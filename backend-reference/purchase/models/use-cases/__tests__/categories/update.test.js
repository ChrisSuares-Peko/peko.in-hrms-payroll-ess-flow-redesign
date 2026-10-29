const { update } = require('../../categories'); 
const categories = require('../../../entities/categories'); 
const { uploadFile } = require('../../../../utils/s3'); 

jest.mock('../../../entities/categories', () => ({
    update: jest.fn(),
}));

jest.mock('../../../../utils/s3', () => ({
    uploadFile: jest.fn(),
}));
jest.mock('../../../entities/products', () =>({
    belongsTo: jest.fn(),
    }));
    jest.mock('../../../entities/subCorporateUsers', () =>({
        belongsTo: jest.fn(),
        }));

describe('update function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    

    it('should update category successfully without image upload', async () => {
        const params = {
            id: 1,
        };
        const data = {
            name: 'Electronics',
        };
        const mockUpdateResult = [1, [{ id: 1, ...data, categoryImage: null }]];

        // Mock implementations
        uploadFile.mockResolvedValue(null); // No image to upload
        categories.update.mockResolvedValue(mockUpdateResult);

        const result = await update(params, data);

        expect(uploadFile).not.toHaveBeenCalled(); // No file upload
        expect(categories.update).toHaveBeenCalledWith(data, {
            where: {
                id: params.id,  // Matching category id
            },
        });
        expect(result).toEqual(mockUpdateResult);
    });

    

    it('should handle errors during category update', async () => {
        const params = {
            id: 1,
        };
        const data = {
            name: 'Electronics',
        };
        const errorMessage = 'Database update failed';

        // Mock categories.update to reject with an error
        categories.update.mockRejectedValueOnce(new Error(errorMessage));

        // Test that the error is properly handled
        await expect(update(params, data)).rejects.toThrow(errorMessage);
    });
});
