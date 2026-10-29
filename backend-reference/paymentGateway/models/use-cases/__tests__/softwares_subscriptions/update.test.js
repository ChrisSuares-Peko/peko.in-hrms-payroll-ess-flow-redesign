const { update } = require('../../../use-cases/softwares_subscriptions');
const softwares_subscriptions = require('../../../entities/softwares_subscriptions');
const { uploadFile } = require('../../../../utils/commonUploadFile');

jest.mock('../../../entities/softwares_subscriptions', () => ({
    update: jest.fn(),
    findOne: jest.fn(),
}));

jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn(),
}));

describe('update', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NODE_ENV = 'test'; // ensure predictable path
    });

    it('should update software subscription with image upload', async () => {
        const mockParams = { id: 1 };
        const mockData = { image: 'base64data', imageFormat: 'png' };
        const mockPublicUrl = 'http://s3.amazonaws.com/bucket/path/image.png';

        uploadFile.mockResolvedValue(mockPublicUrl);
        softwares_subscriptions.update.mockResolvedValue([1]);

        const result = await update(mockParams, mockData);

       const expectedPath = `softwares_subscriptions/products`;


        expect(uploadFile).toHaveBeenCalledWith(
            'base64data',
            expectedPath,
            mockData.imageFormat
        );

        expect(softwares_subscriptions.update).toHaveBeenCalledWith(
            { ...mockData, image: mockPublicUrl },
            { where: { id: mockParams.id } }
        );

        expect(result).toEqual([1]);
    });

    it('should update software subscription without image upload', async () => {
        const mockParams = { id: 1 };
        const mockData = { name: 'Updated Software Subscription' };

        softwares_subscriptions.update.mockResolvedValue([1]);

        const result = await update(mockParams, mockData);

        expect(uploadFile).not.toHaveBeenCalled();
        expect(softwares_subscriptions.update).toHaveBeenCalledWith(
            mockData,
            { where: { id: mockParams.id } }
        );
        expect(result).toEqual([1]);
    });

    it('should update sold_quantity correctly', async () => {
        const mockParams = { id: 1 };
        const mockData = { sold_quantity: 5 };
        const mockExisting = { sold_quantity: 10 };

        softwares_subscriptions.findOne.mockResolvedValue(mockExisting);
        softwares_subscriptions.update.mockResolvedValue([1]);

        const result = await update(mockParams, mockData);

        expect(softwares_subscriptions.findOne).toHaveBeenCalledWith({ where: { id: mockParams.id } });
        expect(softwares_subscriptions.update).toHaveBeenCalledWith(
            { sold_quantity: 15 },
            { where: { id: mockParams.id } }
        );

        expect(result).toEqual([1]);
    });

    it('should handle errors during database update', async () => {
        const mockParams = { id: 1 };
        const mockData = { name: 'Error Data' };
        const mockError = new Error('DB Update Failed');

        softwares_subscriptions.update.mockRejectedValue(mockError);

        const result = await update(mockParams, mockData);

        expect(result).toBe(false);
    });

    it('should handle errors during findOne', async () => {
        const mockParams = { id: 1 };
        const mockData = { sold_quantity: 5 };
        const mockError = new Error('DB Find Failed');

        softwares_subscriptions.findOne.mockRejectedValue(mockError);

        const result = await update(mockParams, mockData);

        expect(result).toBe(false);
    });
});
