const { create } = require('../../../use-cases/works');
const works = require('../../../entities/works');
const { uploadFile } = require("../../../../utils/commonUploadFile");

jest.mock('../../../entities/works', () => ({
    create: jest.fn(),
}));

jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn(async () => 'https://mockstorage.com/image.jpg'),
}));

describe('create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a work entry successfully with image upload', async () => {
        const mockParams = {
            name: 'Test Work',
            imageBase: 'base64ImageString',
            imageFormat: 'jpg',
            portfolio: [{ project: { base64: 'base64Portfolio', format: 'png' } }],
        };
        const mockResponse = { id: 1, name: 'Test Work', image: 'https://mockstorage.com/image.jpg' };

        works.create.mockResolvedValue(mockResponse);

        const result = await create(mockParams);

        expect(uploadFile).toHaveBeenCalledWith('base64ImageString', 'works', 'jpg');
        expect(uploadFile).toHaveBeenCalledWith('base64Portfolio', 'works', 'png');
        expect(works.create).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Test Work',
            image: 'https://mockstorage.com/image.jpg',
            portfolio: [{ project: 'https://mockstorage.com/image.jpg' }],
        }));
        expect(result).toEqual(mockResponse);
    });

    it('should handle portfolio with an empty array correctly', async () => {
        const mockParams = {
            name: 'Test Work',
            portfolio: [],
        };
        const mockResponse = { id: 2, name: 'Test Work', portfolio: [] };

        works.create.mockResolvedValue(mockResponse);

        const result = await create(mockParams);

        expect(works.create).toHaveBeenCalledWith(expect.objectContaining({
            portfolio: [],
        }));
        expect(result).toEqual(mockResponse);
    });

    
});
