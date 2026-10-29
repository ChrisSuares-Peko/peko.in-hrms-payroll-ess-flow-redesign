const { create } = require('../../categories'); 
const categories = require('../../../entities/categories'); 
const { uploadFileToS3 } = require('../../../../utils/s3'); 


jest.mock('../../../entities/categories', () => ({
    create: jest.fn(),
    hasOne: jest.fn(),
}));

jest.mock('../../../../utils/s3', () => ({
    uploadFileToS3: jest.fn(),
}));

jest.mock('../../../entities/products', () =>({
    belongsTo: jest.fn(),
    }));
    jest.mock('../../../entities/subCorporateUsers', () =>({
        belongsTo: jest.fn(),
        }));

describe('create function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

   
    

    it('should create category successfully without image upload', async () => {
        const params = {
            categoryName: 'Electronics',
            categoryStatus: true,
            vendorId: '1'
        };
        const mockCategory = { id: 1, categoryName: 'Electronics', categoryImage: null, categoryStatus: true, vendorId: '1' };

        uploadFileToS3.mockResolvedValue(null); // No image to upload
        categories.create.mockResolvedValue(mockCategory);

        const result = await create(params);

        expect(uploadFileToS3).not.toHaveBeenCalled();
        expect(categories.create).toHaveBeenCalledWith(params);
        expect(result).toEqual(mockCategory);
    });

    it('should return false if category creation fails', async () => {
        const params = {
            categoryImage: Buffer.from('base64', 'base64'), // Mock image data
            categoryImageFormat: 'png',
            categoryName: 'Electronics',
            categoryStatus: true,
            vendorId: '1'
        };

        uploadFileToS3.mockResolvedValue('https://s3.example.com/staging/categories/image.png');
        categories.create.mockResolvedValue(null);

        const result = await create(params);

        expect(result).toBe(false);
    });

    
});
