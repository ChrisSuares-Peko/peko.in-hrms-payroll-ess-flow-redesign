const { createCorporateDocument } = require('../../corporateDocuments');
const corporateDocuments = require('../../../entities/corporateDocuments');

jest.mock('../../../entities/corporateDocuments');

describe('createCorporateDocument', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a corporate document with upsert', async () => {
        const params = {
            documentName: 'Trade License',
            document: 'https://example.com/doc.pdf',
            documentType: 'PDF',
            corporateUserId: 1,
        };
        const mockResult = { id: 1, ...params, status: 'PENDING' };
        corporateDocuments.upsert.mockResolvedValue(mockResult);

        const result = await createCorporateDocument(params);

        expect(corporateDocuments.upsert).toHaveBeenCalledWith({
            documentName: 'Trade License',
            corporateUserId: 1,
            document: 'https://example.com/doc.pdf',
            documentType: 'PDF',
            status: 'PENDING',
        });
        expect(result).toEqual(mockResult);
    });
});
