const { findById } = require('../../legalDocument');
const legalDocument = require('../../../entities/legalDocument');

jest.mock('../../../entities/legalDocument', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
}));
jest.mock('../../../entities/eSign');

describe('legalDocument - findById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a document with all includes by ID', async () => {
        const mockData = {
            id: 1,
            title: 'NDA Agreement',
            status: 'DRAFT',
            corporateUserId: 10,
            editorHtml: '<p>Content</p>',
            eSign: { id: 2, status: 'PENDING', signers_info: [], expiry_date: '2025-01-01' },
        };

        legalDocument.findOne.mockResolvedValue(mockData);

        const result = await findById(1);

        expect(legalDocument.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 1 },
                raw: true,
                nest: true,
            })
        );
        expect(result).toEqual(mockData);
    });

    it('should return null when no document matches the ID', async () => {
        legalDocument.findOne.mockResolvedValue(null);

        const result = await findById(999);

        expect(legalDocument.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 999 } })
        );
        expect(result).toBeNull();
    });

    it('should throw an error if database query fails', async () => {
        legalDocument.findOne.mockRejectedValue(new Error('Database error'));

        await expect(findById(1)).rejects.toThrow('Database error');
    });
});
