const { bulkDelete } = require('../../../use-cases/invoiceGuideline');
const invoiceGuideline = require('../../../entities/invoiceGuideline');
const { Op } = require('sequelize');

jest.mock('../../../entities/invoiceGuideline', () => ({
    destroy: jest.fn(),
}));

describe('bulkDelete', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return true when records are successfully deleted', async () => {
        const mockIds = [1, 2, 3];
        invoiceGuideline.destroy.mockResolvedValue(3);

        const result = await bulkDelete(mockIds);

        expect(invoiceGuideline.destroy).toHaveBeenCalledWith({
            where: {
                id: { [Op.in]: mockIds },
            },
        });
        expect(result).toBe(true);
    });

    it('should return false when no records are deleted', async () => {
        const mockIds = [4, 5, 6];
        invoiceGuideline.destroy.mockResolvedValue(0);

        const result = await bulkDelete(mockIds);

        expect(result).toBe(false);
    });

    it('should throw an error if destroy operation fails', async () => {
        const mockIds = [7, 8, 9];
        const mockError = new Error('Database error');

        invoiceGuideline.destroy.mockRejectedValue(mockError);
        console.log = jest.fn();

        await expect(bulkDelete(mockIds)).rejects.toThrow('Database error');
    });
});
