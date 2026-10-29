const { fetchSubscriptionDetails } = require('../../../use-cases/subscriptions');
const product = require('../../../entities/products');
const { Op } = require('sequelize');

jest.mock('../../../entities/products', () => ({
    findAll: jest.fn(),
}));

describe('fetchSubscriptionDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a list of products that match the query', async () => {
        const mockQuery = 'Subscription';
        const mockProducts = [
            { id: 1, name: 'Subscription Plan A' },
            { id: 2, name: 'Subscription Plan B' }
        ];

        product.findAll.mockResolvedValue(mockProducts);

        const result = await fetchSubscriptionDetails(mockQuery);

        expect(product.findAll).toHaveBeenCalledWith({
            where: {
                name: { [Op.like]: `%${mockQuery}%` }
            },
            attributes: ['id', 'name']
        });
        expect(result).toEqual(mockProducts);
    });

    it('should return an empty array if no matching products are found', async () => {
        const mockQuery = 'NonExistentSubscription';
        product.findAll.mockResolvedValue([]);

        const result = await fetchSubscriptionDetails(mockQuery);

        expect(result).toEqual([]);
    });

    it('should handle errors if database query fails', async () => {
        const mockQuery = 'Subscription';
        const mockError = new Error('Database error');

        product.findAll.mockRejectedValue(mockError);

        await expect(fetchSubscriptionDetails(mockQuery)).rejects.toThrow('Database error');
    });
});