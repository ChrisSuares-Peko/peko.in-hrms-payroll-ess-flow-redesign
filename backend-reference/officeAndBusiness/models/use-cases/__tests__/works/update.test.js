const { update } = require('../../../use-cases/works');
const works = require('../../../entities/works');
const { uploadFile } = require("../../../../utils/commonUploadFile");

jest.mock('../../../entities/works', () => ({
    update: jest.fn(),
}));

jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn(async () => 'https://mockstorage.com/image.jpg'),
}));

describe('update', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a work entry successfully with image upload', async () => {
        const mockParams = {
            id: 1,
        };
        const mockData = {
            name: 'Updated Work',
            imageBase: 'base64ImageString',
            imageFormat: 'jpg',
            portfolio: [{ project: { base64: 'base64Portfolio', format: 'png' } }],
        };
        const mockResponse = [1];

        works.update.mockResolvedValue(mockResponse);

        const result = await update(mockData, mockParams);

        expect(uploadFile).toHaveBeenCalledWith('base64ImageString', 'logo', 'jpg');
        expect(uploadFile).toHaveBeenCalledWith('base64Portfolio', 'works', 'png');
        expect(works.update).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Updated Work',
            image: 'https://mockstorage.com/image.jpg',
            portfolio: [{ project: 'https://mockstorage.com/image.jpg' }],
        }), { where: { id: mockParams.id } });
        expect(result).toEqual(mockResponse);
    });

    it('should handle portfolio with an empty array correctly', async () => {
        const mockParams = { id: 2 };
        const mockData = { name: 'Updated Work', portfolio: [] };
        const mockResponse = [1];

        works.update.mockResolvedValue(mockResponse);

        const result = await update(mockData, mockParams);

        expect(works.update).toHaveBeenCalledWith(expect.objectContaining({
            portfolio: [],
        }), { where: { id: mockParams.id } });
        expect(result).toEqual(mockResponse);
    });

    it('should return false when update fails', async () => {
        const mockParams = { id: 3 };
        const mockData = { name: 'Failed Update' };
        const mockResponse = false; 
    
        works.update.mockResolvedValue(mockResponse);
    
        const result = await update(mockData, mockParams);
    
        expect(works.update).toHaveBeenCalledWith(mockData, { where: { id: mockParams.id } });
    
        expect(result).toBe(false);
    });
    
});