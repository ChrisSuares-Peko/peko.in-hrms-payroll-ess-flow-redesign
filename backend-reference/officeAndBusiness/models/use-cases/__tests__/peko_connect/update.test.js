const { update } = require('../../../use-cases/peko_connect');
const peko_connect = require('../../../entities/peko_connect');
const { uploadFile } = require("../../../../utils/commonUploadFile");

jest.mock('../../../entities/peko_connect', () => ({
    update: jest.fn(),
}));


jest.mock('../../../../utils/s3', () => ({
    uploadFileToS3: jest.fn(),
    
}));
jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn(),
    
}));

describe('update', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a peko_connect record successfully without logo', async () => {
        const mockParams = { id: 1 };
        const mockData = { name: 'Updated Peko Connect' };
        const mockResponse = [1]; // 1 row affected

        peko_connect.update.mockResolvedValue(mockResponse);

        const result = await update(mockParams, mockData);

        expect(peko_connect.update).toHaveBeenCalledWith(mockData, { where: { id: mockParams.id } });
        expect(result).toEqual(mockResponse);
    });

   

    it('should upload logo using standard upload method when CLOUD_STORAGE is not S3', async () => {
        process.env.CLOUD_STORAGE = 'LOCAL';
        const mockParams = { id: 3 };
        const mockData = { logo: 'file_data', format: 'jpg' };
        const mockPublicUrl = 'https://localstorage.com/logo.jpg';
        const mockResponse = [1];

        uploadFile.mockResolvedValue(mockPublicUrl);
        peko_connect.update.mockResolvedValue(mockResponse);

        const result = await update(mockParams, mockData);

        expect(uploadFile).toHaveBeenCalledWith('file_data', 'peko-connect/logo', mockData.format);
        expect(peko_connect.update).toHaveBeenCalledWith(expect.objectContaining({ logo: mockPublicUrl }), { where: { id: mockParams.id } });
        expect(result).toEqual(mockResponse);
    });

    it('should return [0] when no records are updated', async () => {
        const mockParams = { id: 4 };
        const mockData = { name: 'Unchanged Peko Connect' };
        peko_connect.update.mockResolvedValue([0]);

        const result = await update(mockParams, mockData);

        expect(result).toEqual([0]);
    });

    it('should throw an error when update fails', async () => {
        const mockParams = { id: 5 };
        const mockData = { name: 'Error Case' };
        const mockError = new Error('Database error');

        peko_connect.update.mockRejectedValue(mockError);

        await expect(update(mockParams, mockData)).rejects.toThrow('Database error');
    });
});
