const { create } = require('../../legalTemplate');
const legalTemplate = require('../../../entities/legalTemplate');
const { uploadFile } = require('../../../../utils/commonUploadFile');

jest.mock('../../../entities/legalTemplate');
jest.mock('../../../../utils/commonUploadFile');
jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));

describe('legalTemplate - create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a template without file upload', async () => {
        const params = {
            title: 'NDA Template',
            category: 'Legal',
            description: 'Non-disclosure agreement',
            timeEstimate: '30 mins',
            isActive: true,
        };

        const mockCreated = { id: 1, ...params };
        legalTemplate.create.mockResolvedValue(mockCreated);

        const result = await create({ ...params });

        expect(uploadFile).not.toHaveBeenCalled();
        expect(legalTemplate.create).toHaveBeenCalledWith(
            expect.not.objectContaining({ documentBase: expect.anything(), documentFormat: expect.anything() })
        );
        expect(result).toEqual(mockCreated);
    });

    it('should upload file and set documentUrl when documentBase and documentFormat are provided', async () => {
        const params = {
            title: 'NDA Template',
            category: 'Legal',
            description: 'Non-disclosure agreement',
            documentBase: 'base64encodedcontent',
            documentFormat: 'pdf',
        };

        const mockUrl = 'https://s3.example.com/docs/legal-templates/nda.pdf';
        uploadFile.mockResolvedValue(mockUrl);

        const mockCreated = { id: 1, title: 'NDA Template', category: 'Legal', description: 'Non-disclosure agreement', documentUrl: mockUrl };
        legalTemplate.create.mockResolvedValue(mockCreated);

        const result = await create({ ...params });

        expect(uploadFile).toHaveBeenCalledWith('base64encodedcontent', 'docs/legal-templates', 'pdf');
        expect(legalTemplate.create).toHaveBeenCalledWith(
            expect.objectContaining({ documentUrl: mockUrl })
        );
        expect(legalTemplate.create).toHaveBeenCalledWith(
            expect.not.objectContaining({ documentBase: expect.anything(), documentFormat: expect.anything() })
        );
        expect(result).toEqual(mockCreated);
    });

    it('should throw an error if template creation fails', async () => {
        legalTemplate.create.mockRejectedValue(new Error('Database error'));

        await expect(create({ title: 'NDA', category: 'Legal' })).rejects.toThrow('Database error');
    });
});
