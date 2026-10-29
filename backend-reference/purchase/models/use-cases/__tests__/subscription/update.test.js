const product = require('../../../entities/products');
const photos = require('../../../entities/photos');
const { uploadFile } = require("../../../../utils/commonUploadFile");
const { update } = require('../../../use-cases/subscriptions'); // Adjust path as needed

jest.mock('../../../entities/products', () => ({
    update: jest.fn(),
}));

jest.mock('../../../entities/photos', () => ({
    update: jest.fn(),
    create: jest.fn(),
}));

jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn(),
}));

describe('update function', () => {
    const mockParams = { id: 1 };
    const mockData = {
        productImage1: 'image_data_1',
        productImageFormat1: 'jpg',
        productImage2: 'image_data_2',
        productImageFormat2: 'png'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update product images and call product.update', async () => {
        uploadFile.mockResolvedValueOnce('https://example.com/image1.jpg');
        uploadFile.mockResolvedValueOnce('https://example.com/image2.png');

        photos.update.mockResolvedValue([1]); // Simulating a successful update
        product.update.mockResolvedValue([1]); // Simulating successful product update

        const result = await update(mockParams, mockData);

        expect(uploadFile).toHaveBeenCalledWith('image_data_1', 'productImage1', 'jpg');
        expect(uploadFile).toHaveBeenCalledWith('image_data_2', 'productImage2', 'png');
        expect(photos.update).toHaveBeenCalledTimes(2);
        expect(product.update).toHaveBeenCalledWith(mockData, { where: { id: mockParams.id } });
        expect(result).toEqual([1]);
    });

    it('should create a new photo record if image update fails', async () => {
        uploadFile.mockResolvedValueOnce('https://example.com/image1.jpg');

        photos.update.mockResolvedValue([0]); // Simulating update failure
        photos.create.mockResolvedValue(true); // Simulating successful insert

        await update(mockParams, { productImage1: 'image_data_1', productImageFormat1: 'jpg' });

        expect(photos.create).toHaveBeenCalledWith({
            productId: mockParams.id,
            imageField: 'productImage1',
            productImageUrl: 'https://example.com/image1.jpg'
        });
    });

    it('should return false if image upload fails', async () => {
        uploadFile.mockRejectedValue(new Error('Upload failed'));

        await expect(update(mockParams, mockData)).rejects.toThrow('Upload failed');

        expect(product.update).not.toHaveBeenCalled();
    });

    it('should return false if product update fails', async () => {
        uploadFile.mockResolvedValueOnce('https://example.com/image1.jpg');
        photos.update.mockResolvedValue([1]);
        product.update.mockRejectedValue(new Error('Database error'));

        await expect(update(mockParams, mockData)).rejects.toThrow('Upload failed');
    });
});
