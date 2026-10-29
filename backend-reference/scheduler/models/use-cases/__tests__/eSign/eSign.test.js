const { findESignDoc, findESignDocToDelete } = require('../../eSign');
const eSign = require('../../../entities/eSign');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('findESignDoc', () => {
    it('should return pending eSign documents with non-expired dates', async () => {
        const mockDocs = [
            { docket_title: 'Doc 1', expiry_date: '2026-12-31', status: 'PENDING', reminder: true }
        ];
        eSign.findAll.mockResolvedValue(mockDocs);

        const result = await findESignDoc();
        expect(result).toEqual({ status: true, data: mockDocs });
        expect(eSign.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ status: 'PENDING', reminder: true }),
            raw: true
        }));
    });

    it('should return empty array when no documents found', async () => {
        eSign.findAll.mockResolvedValue([]);

        const result = await findESignDoc();
        expect(result).toEqual({ status: true, data: [] });
    });

    it('should return error status on failure', async () => {
        eSign.findAll.mockRejectedValue(new Error('DB Error'));

        const result = await findESignDoc();
        expect(result).toEqual({
            status: false,
            message: 'Something went wrong while fetching the document'
        });
    });
});

describe('findESignDocToDelete', () => {
    it('should return completed eSign documents with expired doc dates', async () => {
        const mockDocs = [
            { docket_title: 'Doc 1', status: 'COMPLETED', document_url: 'http://test.com/doc' }
        ];
        eSign.findAll.mockResolvedValue(mockDocs);

        const result = await findESignDocToDelete();
        expect(result).toEqual({ status: true, data: mockDocs });
        expect(eSign.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ status: 'COMPLETED' }),
            raw: true
        }));
    });

    it('should return error status on failure', async () => {
        eSign.findAll.mockRejectedValue(new Error('DB Error'));

        const result = await findESignDocToDelete();
        expect(result).toEqual({
            status: false,
            message: 'Something went wrong while processing the document deletion'
        });
    });
});
