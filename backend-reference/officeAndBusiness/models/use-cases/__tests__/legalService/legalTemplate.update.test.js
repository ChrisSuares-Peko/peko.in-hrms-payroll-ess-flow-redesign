const { update } = require('../../legalTemplate');
const legalTemplate = require('../../../entities/legalTemplate');
const { uploadFile } = require('../../../../utils/commonUploadFile');

jest.mock('../../../entities/legalTemplate');
jest.mock('../../../../utils/commonUploadFile');
jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));

describe('legalTemplate - update', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a template without file upload', async () => {
        const id = 1;
        const data = { title: 'Updated NDA', description: 'Updated description' };

        legalTemplate.update.mockResolvedValue([1]);

        const result = await update(id, { ...data });

        expect(uploadFile).not.toHaveBeenCalled();
        expect(legalTemplate.update).toHaveBeenCalledWith(
            expect.objectContaining({ title: 'Updated NDA', description: 'Updated description' }),
            { where: { id } }
        );
        expect(result).toEqual([1]);
    });

    it('should upload new file and update documentUrl when documentBase and documentFormat are provided', async () => {
        const id = 1;
        const data = {
            title: 'Updated NDA',
            documentBase: 'newbase64content',
            documentFormat: 'docx',
        };

        const mockUrl = 'https://s3.example.com/docs/legal-templates/updated-nda.docx';
        uploadFile.mockResolvedValue(mockUrl);
        legalTemplate.update.mockResolvedValue([1]);

        const result = await update(id, { ...data });

        expect(uploadFile).toHaveBeenCalledWith('newbase64content', 'docs/legal-templates', 'docx');
        expect(legalTemplate.update).toHaveBeenCalledWith(
            expect.objectContaining({ documentUrl: mockUrl }),
            { where: { id } }
        );
        expect(legalTemplate.update).toHaveBeenCalledWith(
            expect.not.objectContaining({ documentBase: expect.anything(), documentFormat: expect.anything() }),
            expect.any(Object)
        );
        expect(result).toEqual([1]);
    });

    it('should return [0] when no template matches the given ID', async () => {
        legalTemplate.update.mockResolvedValue([0]);

        const result = await update(999, { title: 'Ghost Template' });

        expect(result).toEqual([0]);
    });

    it('should throw an error if update fails', async () => {
        legalTemplate.update.mockRejectedValue(new Error('Database error'));

        await expect(update(1, { title: 'NDA' })).rejects.toThrow('Database error');
    });
});
