const { deleteBanner } = require('../../../use-cases/banners');
const banner = require('../../../entities/banners');
const { deleteFile } = require('../../../../utils/commonUploadFile');

jest.mock('../../../entities/banners', () => ({
    destroy: jest.fn(),
    findOne: jest.fn(),
}));

jest.mock('../../../../utils/commonUploadFile', () => ({
    deleteFile: jest.fn(),
}));


describe('deleteBanner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a banner with the given ID and return the number of rows affected', async () => {
        const mockParams = { id: 1 };
        const mockBannerImage = 'https://test/image.png';
        const mockResult = 1;

        banner.findOne.mockResolvedValue({ bannerImage: mockBannerImage });
        deleteFile.mockResolvedValue({ success: true });
        banner.destroy.mockResolvedValue(mockResult);

        const result = await deleteBanner(mockParams);

        expect(banner.findOne).toHaveBeenCalledWith({ where: { id: mockParams.id }});
        expect(deleteFile).toHaveBeenCalledWith(mockBannerImage);
        expect(banner.destroy).toHaveBeenCalledWith({ where: { id: mockParams.id }});
        expect(result).toEqual(mockResult);
    });

    it('should return 0 if deletion fails (no banner found)', async () => {
        const mockParams = { id: 999 };

        banner.findOne.mockResolvedValue({ bannerImage: 'test.png' });
        deleteFile.mockResolvedValue({ success: false });

        const result = await deleteBanner(mockParams);

        expect(deleteFile).toHaveBeenCalled();
        expect(result).toBe(false);
    });

    it('should throw an error if deletion fails', async () => {
        const mockParams = { id: 1 };
        const mockBannerImage = 'https://test/image.png';
        const mockError = new Error('Database error');

        banner.findOne.mockResolvedValue({ bannerImage: mockBannerImage });
        deleteFile.mockResolvedValue({ success: true });
        banner.destroy.mockRejectedValue(mockError);

        await expect(deleteBanner(mockParams)).rejects.toThrow('Database error');
        expect(banner.destroy).toHaveBeenCalledWith({ where: { id: mockParams.id }});
    });
});

