const { create } = require('../../legalDocument');
const legalDocument = require('../../../entities/legalDocument');

jest.mock('../../../entities/legalDocument');

describe('legalDocument - create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a legal document and return the created data', async () => {
        const params = {
            corporateUserId: 1,
            subCorporateUserId: null,
            title: 'NDA Agreement',
            editorHtml: '<p>This agreement...</p>',
            status: 'DRAFT',
        };

        const mockCreated = {
            id: 1,
            ...params,
            createdAt: '2024-01-01T10:00:00.000Z',
            updatedAt: '2024-01-01T10:00:00.000Z',
        };

        legalDocument.create.mockResolvedValue(mockCreated);

        const result = await create(params);

        expect(legalDocument.create).toHaveBeenCalledWith(params);
        expect(result).toEqual(mockCreated);
    });

    it('should throw an error if document creation fails', async () => {
        const params = {
            corporateUserId: 1,
            title: 'NDA Agreement',
            editorHtml: '<p>This agreement...</p>',
        };

        legalDocument.create.mockRejectedValue(new Error('Database error'));

        await expect(create(params)).rejects.toThrow('Database error');
        expect(legalDocument.create).toHaveBeenCalledWith(params);
    });
});
