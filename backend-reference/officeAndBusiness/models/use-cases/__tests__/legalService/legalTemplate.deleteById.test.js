const { deleteById } = require('../../legalTemplate');
const legalTemplate = require('../../../entities/legalTemplate');

jest.mock('../../../entities/legalTemplate');
jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));
jest.mock('../../../../utils/commonUploadFile');

describe('legalTemplate - deleteById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a template and return true when found', async () => {
        legalTemplate.findOne.mockResolvedValue({ id: 1, title: 'NDA Template' });
        legalTemplate.destroy.mockResolvedValue(1);

        const result = await deleteById(1);

        expect(legalTemplate.findOne).toHaveBeenCalledWith({ where: { id: 1 }, raw: true });
        expect(legalTemplate.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(result).toBe(true);
    });

    it('should return false when template is not found', async () => {
        legalTemplate.findOne.mockResolvedValue(null);

        const result = await deleteById(999);

        expect(legalTemplate.findOne).toHaveBeenCalledWith({ where: { id: 999 }, raw: true });
        expect(legalTemplate.destroy).not.toHaveBeenCalled();
        expect(result).toBe(false);
    });

    it('should throw an error if database query fails', async () => {
        legalTemplate.findOne.mockRejectedValue(new Error('Database error'));

        await expect(deleteById(1)).rejects.toThrow('Database error');
    });
});
