const { find } = require('../../../use-cases/subscriptions');
const product = require('../../../entities/products');

jest.mock('../../../entities/products', () => ({
    findOne: jest.fn(),
}));

describe('find', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a product if found by name', async () => {
        const mockName = 'Test Product';
        const mockProduct = { id: 1, name: mockName };

        product.findOne.mockResolvedValue(mockProduct);

        const result = await find(mockName);

        expect(product.findOne).toHaveBeenCalledWith({
            where: { name: mockName },
        });
        expect(result).toEqual(mockProduct);
    });

    it('should return null if no product is found', async () => {
        const mockName = 'NonExistentProduct';
        product.findOne.mockResolvedValue(null);

        const result = await find(mockName);

        expect(result).toBeNull();
    });

    it('should handle errors if database query fails', async () => {
        const mockName = 'Test Product';
        const mockError = new Error('Database error');

        product.findOne.mockRejectedValue(mockError);

        await expect(find(mockName)).rejects.toThrow('Database error');
    });
});