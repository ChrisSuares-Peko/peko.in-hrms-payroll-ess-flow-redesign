const { updateBannerById } = require('../../../use-cases/banners');
const banner = require('../../../entities/banners');
const { uploadFile } = require('../../../../utils/commonUploadFile');

jest.mock('../../../entities/banners', () => ({
    update: jest.fn(),
}));

jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn(),
}));

describe('updateBannerById', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a banner when valid data is provided', async () => {
        const mockId = 1;
        const mockUpdatedData = { title: 'Updated Title' };
        const mockUpdatedBanner = [1];

        banner.update.mockResolvedValue(mockUpdatedBanner);

        const result = await updateBannerById(mockId, mockUpdatedData);

        expect(banner.update).toHaveBeenCalledWith(mockUpdatedData, {
            where: { id: mockId },
        });
        expect(result).toEqual(mockUpdatedBanner);
    });

    it('should upload file when bannerImage and bannerFormat exist', async () => {
        const mockId = 1;
        const mockUpdatedData = {
            bannerImage: 'file_data',
            bannerFormat: 'png',
        };
        const mockPublicUrl = 'https://bucket/banners/image.png';
        const mockUpdatedBanner = [1];

        uploadFile.mockResolvedValue(mockPublicUrl);
        banner.update.mockResolvedValue(mockUpdatedBanner);

        const result = await updateBannerById(mockId, mockUpdatedData);

        expect(uploadFile).toHaveBeenCalledWith('file_data', 'banners', 'png');
        expect(banner.update).toHaveBeenCalledWith({
            bannerImage: mockPublicUrl,
            bannerFormat: 'png',
        }, {
            where: { id: mockId },
        });
        expect(result).toEqual(mockUpdatedBanner);
    });

    it('should return false if update result is falsy', async () => {
        const mockId = 1;
        const mockUpdatedData = { title: 'Updated Title' };
        const mockUpdatedBanner = false;

        banner.update.mockResolvedValue(mockUpdatedBanner);

        const result = await updateBannerById(mockId, mockUpdatedData);

        expect(result).toBe(false);
    });

   
});
