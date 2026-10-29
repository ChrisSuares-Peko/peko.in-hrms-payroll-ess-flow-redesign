const { updateById } = require('../../legalDocument');
const legalDocument = require('../../../entities/legalDocument');

jest.mock('../../../entities/legalDocument');

describe('legalDocument - updateById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a legal document by ID and return the result', async () => {
        const id = 1;
        const params = {
            editorHtml: '<p>Updated content</p>',
            status: 'SENT',
        };

        legalDocument.update.mockResolvedValue([1]);

        const result = await updateById(id, params);

        expect(legalDocument.update).toHaveBeenCalledWith(params, { where: { id } });
        expect(result).toEqual([1]);
    });

    it('should return [0] when no document matches the given ID', async () => {
        legalDocument.update.mockResolvedValue([0]);

        const result = await updateById(999, { status: 'SENT' });

        expect(legalDocument.update).toHaveBeenCalledWith({ status: 'SENT' }, { where: { id: 999 } });
        expect(result).toEqual([0]);
    });

    it('should throw an error if update fails', async () => {
        legalDocument.update.mockRejectedValue(new Error('Database error'));

        await expect(updateById(1, { status: 'SENT' })).rejects.toThrow('Database error');
    });
});
