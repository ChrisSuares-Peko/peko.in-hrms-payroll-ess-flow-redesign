const { toggleStatus } = require('../../legalTemplate');
const legalTemplate = require('../../../entities/legalTemplate');

jest.mock('../../../entities/legalTemplate');
jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));
jest.mock('../../../../utils/commonUploadFile');

describe('legalTemplate - toggleStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should toggle isActive from true to false', async () => {
        legalTemplate.findOne.mockResolvedValue({ id: 1, isActive: true });
        legalTemplate.update.mockResolvedValue([1]);

        const result = await toggleStatus(1);

        expect(legalTemplate.findOne).toHaveBeenCalledWith({ where: { id: 1 }, raw: true });
        expect(legalTemplate.update).toHaveBeenCalledWith({ isActive: false }, { where: { id: 1 } });
        expect(result).toEqual([1]);
    });

    it('should toggle isActive from false to true', async () => {
        legalTemplate.findOne.mockResolvedValue({ id: 1, isActive: false });
        legalTemplate.update.mockResolvedValue([1]);

        const result = await toggleStatus(1);

        expect(legalTemplate.update).toHaveBeenCalledWith({ isActive: true }, { where: { id: 1 } });
        expect(result).toEqual([1]);
    });

    it('should return false when template is not found', async () => {
        legalTemplate.findOne.mockResolvedValue(null);

        const result = await toggleStatus(999);

        expect(legalTemplate.findOne).toHaveBeenCalledWith({ where: { id: 999 }, raw: true });
        expect(legalTemplate.update).not.toHaveBeenCalled();
        expect(result).toBe(false);
    });

    it('should throw an error if database query fails', async () => {
        legalTemplate.findOne.mockRejectedValue(new Error('Database error'));

        await expect(toggleStatus(1)).rejects.toThrow('Database error');
    });
});
