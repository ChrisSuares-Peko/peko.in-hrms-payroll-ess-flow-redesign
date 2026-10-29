const banner = require('../../../entities/banners');
const { uploadFile } = require("../../../../utils/commonUploadFile");
const { create } = require('../../../use-cases/banners');

jest.mock('../../../entities/banners', () => ({
    create: jest.fn(),
}));

jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn(),
}));

describe('create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

  it('should upload image and create banner when image and format are provided', async () => {
        const mockParams = {
            bannerImage: 'https://bucket/banners/test.png', // ✅ Use base64 string, not Buffer
            bannerFormat: 'png',
            title: 'New Banner',
        };

        const mockURL = 'https://bucket/banners/test.png';
        const mockCreatedBanner = { id: 1, ...mockParams, bannerImage: mockURL };

        uploadFile.mockResolvedValue(mockURL);
        banner.create.mockResolvedValue(mockCreatedBanner);

        const result = await create(mockParams);

        expect(uploadFile).toHaveBeenCalledWith(
            mockParams.bannerImage,
            'banners',
            mockParams.bannerFormat
        );

        expect(banner.create).toHaveBeenCalledWith({
            ...mockParams,
            bannerImage: mockURL
        });

        expect(result).toEqual(mockCreatedBanner);
    });


    it('should create banner without uploading file if image or format missing', async () => {
        const mockParams = { title: 'Simple Banner' };
        const mockCreatedBanner = { id: 2, title: 'Simple Banner', bannerImage: null };

        banner.create.mockResolvedValue(mockCreatedBanner);

        const result = await create(mockParams);

        expect(uploadFile).not.toHaveBeenCalled();
        expect(banner.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockCreatedBanner);
    });

    it('should return error response when banner creation fails', async () => {
        const mockParams = { title: 'Banner' };
        banner.create.mockRejectedValue(new Error('Database error'));

        const result = await create(mockParams);

        expect(result.message).toBe("Something went wrong, please try again later.");
      
    });

    it('should return error response if file upload fails', async () => {
        const mockParams = {
            bannerImage: Buffer.from('file'),
            bannerFormat: 'png',
            title: 'Fail Banner',
        };

        uploadFile.mockRejectedValue(new Error('Upload failed'));

        const result = await create(mockParams);

        expect(result.message).toBe("Something went wrong, please try again later.");
       
    });
});
