const { Delete } = require('../../../use-cases/subscriptions');
const product = require('../../../entities/products');

jest.mock('../../../entities/products', () => ({
    destroy: jest.fn(),
}));

describe('Delete', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a product successfully', async () => {
        const mockParams = { productCode: 1 };
        const mockDeleteResponse = 1;

        product.destroy.mockResolvedValue(mockDeleteResponse);

        const result = await Delete(mockParams);

        expect(product.destroy).toHaveBeenCalledWith({
            where: { id: mockParams.productCode },
        });
        expect(result).toEqual(mockDeleteResponse);
    });

    it('should return 0 if no product is found to delete', async () => {
        const mockParams = { productCode: 999 };
        product.destroy.mockResolvedValue(0);

        const result = await Delete(mockParams);

        expect(result).toEqual(0);
    });

    it('should handle errors if delete operation fails', async () => {
        const mockParams = { productCode: 1 };
        const mockError = new Error('Database error');

        product.destroy.mockRejectedValue(mockError);

        await expect(Delete(mockParams)).rejects.toThrow('Database error');
    });
});
