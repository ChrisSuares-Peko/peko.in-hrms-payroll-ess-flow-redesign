const { fetchAllPhotos } = require('../../../use-cases/subscriptions');
const photos = require('../../../entities/photos');

jest.mock('../../../entities/photos', () => ({
    findAll: jest.fn(),
}));
jest.mock('../../../entities/products', () => ({
    create: jest.fn(),
}));
describe('fetchAllPhotos', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all photos for a given product ID', async () => {
        const mockProductId = 1;
        const mockPhotos = [
            { id: 1, productId: mockProductId, productImageUrl: 'https://example.com/image1.jpg' },
            { id: 2, productId: mockProductId, productImageUrl: 'https://example.com/image2.jpg' }
        ];

        photos.findAll.mockResolvedValue(mockPhotos);

        const result = await fetchAllPhotos(mockProductId);

        expect(photos.findAll).toHaveBeenCalledWith({
            where: { productId: mockProductId },
        });
        expect(result).toEqual(mockPhotos);
    });

    it('should return an empty array if no photos are found for the product ID', async () => {
        const mockProductId = 999;
        photos.findAll.mockResolvedValue([]);

        const result = await fetchAllPhotos(mockProductId);

        expect(result).toEqual([]);
    });

    it('should handle errors if database query fails', async () => {
        const mockProductId = 1;
        const mockError = new Error('Database error');

        photos.findAll.mockRejectedValue(mockError);

        await expect(fetchAllPhotos(mockProductId)).rejects.toThrow('Database error');
    });
});
