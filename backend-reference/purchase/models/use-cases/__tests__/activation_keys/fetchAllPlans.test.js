const subscription_plans = require('../../../entities/subscription_plans');
const products = require('../../../entities/products');
const { fetchAllPlans } = require('../../activation_keys');

jest.mock('../../../entities/subscription_plans', () => ({
    findAll: jest.fn(),
}));

jest.mock('../../../entities/products', () => ({}));

describe('subscriptionPlans.fetchAllPlans', () => {
    let consoleLogSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    it('should successfully fetch all active plans with products', async () => {
        const mockPlans = [
            {
                id: 1,
                name: 'Basic Plan',
                product: { id: 10, name: 'Product A' },
            },
            {
                id: 2,
                name: 'Premium Plan',
                product: { id: 11, name: 'Product B' },
            },
        ];

        subscription_plans.findAll.mockResolvedValue(mockPlans);

        const result = await fetchAllPlans();

        expect(subscription_plans.findAll).toHaveBeenCalledTimes(1);
        expect(subscription_plans.findAll).toHaveBeenCalledWith({
            include: [
                {
                    model: products,
                    attributes: ['id', 'name'],
                },
            ],
            where: {
                status: true,
            },
        });

        expect(result).toEqual(mockPlans);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            'PRODUCTS FIND ALL ROUTE CALLED'
        );
    });

    it('should log error and return undefined when findAll throws', async () => {
        const error = new Error('Database failure');
        subscription_plans.findAll.mockRejectedValue(error);

        const result = await fetchAllPlans();

        expect(subscription_plans.findAll).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).toHaveBeenCalledWith(error);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            'PRODUCTS FIND ALL ROUTE CALLED'
        );
        expect(result).toBeUndefined();
    });

    it('should always log in finally block', async () => {
        subscription_plans.findAll.mockResolvedValue([]);

        await fetchAllPlans();

        expect(consoleLogSpy).toHaveBeenCalledWith(
            'PRODUCTS FIND ALL ROUTE CALLED'
        );
    });
});
