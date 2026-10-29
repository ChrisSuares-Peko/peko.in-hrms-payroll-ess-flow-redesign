const { findOne } = require('../../../use-cases/softwares_subscriptions_plans'); 
const softwares_subscriptions_plans = require('../../../entities/softwares_subscriptions_plans'); 
const softwares_subscriptions = require('../../../entities/softwares_subscriptions'); 
const vendors = require('../../../entities/vendor'); 
jest.mock('../../../entities/softwares_subscriptions_plans', () => ({
    findOne: jest.fn(),
}));

describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the plan with included models when found', async () => {
        const mockParams = { id: 1 };
        const mockAttributes = ['name', 'price'];
        const mockProductAttribute = ['productName', 'description'];
        const mockPlan = {
            id: 1,
            name: 'Test Plan',
            price: 10,
            softwares_subscriptions: {
                productName: 'Test Software',
                description: 'Software Description',
                vendor: {
                    vendorEmail: 'test@example.com',
                    vendorName: 'Test Vendor',
                    optional1: 'optional1',
                    apiUrl: 'http://example.com/api',
                    optional2: 'optional2',
                },
            },
        };

        softwares_subscriptions_plans.findOne.mockResolvedValue(mockPlan);

        const result = await findOne({ params: mockParams, attributes: mockAttributes, productAttribute: mockProductAttribute });

        expect(softwares_subscriptions_plans.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: softwares_subscriptions,
                    attributes: mockProductAttribute,
                    include: [
                        {
                            model: vendors,
                            attributes: ['vendorEmail', 'vendorName', 'optional1', 'apiUrl', 'optional2'],
                        },
                    ],
                },
            ],
            where: mockParams,
            attributes: mockAttributes,
        });
        expect(result).toEqual({ success: true, message: 'Success', data: mockPlan });
    });

    it('should return null when plan is not found', async () => {
        const mockParams = { id: 1 };
        const mockAttributes = ['name', 'price'];
        const mockProductAttribute = ['productName', 'description'];

        softwares_subscriptions_plans.findOne.mockResolvedValue(null);

        const result = await findOne({ params: mockParams, attributes: mockAttributes, productAttribute: mockProductAttribute });

        expect(softwares_subscriptions_plans.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: softwares_subscriptions,
                    attributes: mockProductAttribute,
                    include: [
                        {
                            model: vendors,
                            attributes: ['vendorEmail', 'vendorName', 'optional1', 'apiUrl', 'optional2'],
                        },
                    ],
                },
            ],
            where: mockParams,
            attributes: mockAttributes,
        });
        expect(result).toEqual({ success: true, message: 'Success', data: null });
    });

    it('should handle errors during database operations', async () => {
        const mockParams = { id: 1 };
        const mockAttributes = ['name', 'price'];
        const mockProductAttribute = ['productName', 'description'];
        const mockError = new Error('Database error');

        softwares_subscriptions_plans.findOne.mockRejectedValue(mockError);

        const result = await findOne({ params: mockParams, attributes: mockAttributes, productAttribute: mockProductAttribute });

        expect(result).toEqual({
            success: false,
            message: 'Database error',
            statusCode: 500,
            error: mockError,
        });

        expect(softwares_subscriptions_plans.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: softwares_subscriptions,
                    attributes: mockProductAttribute,
                    include: [
                        {
                            model: vendors,
                            attributes: ['vendorEmail', 'vendorName', 'optional1', 'apiUrl', 'optional2'],
                        },
                    ],
                },
            ],
            where: mockParams,
            attributes: mockAttributes,
        });
    });

    it('should handle missing id in params', async () => {
        const mockParams = {};
        const mockAttributes = ['name', 'price'];
        const mockProductAttribute = ['productName', 'description'];
        const mockError = new Error('Database error');

        softwares_subscriptions_plans.findOne.mockRejectedValue(mockError);

        const result = await findOne({ params: mockParams, attributes: mockAttributes, productAttribute: mockProductAttribute });

        expect(result).toEqual({
            success: false,
            message: 'Database error',
            statusCode: 500,
            error: mockError,
        });
    });

    it('should handle undefined attributes and productAttribute', async () => {
        const mockParams = { id: 1 };
        const mockPlan = { id: 1, name: 'Test Plan' };

        softwares_subscriptions_plans.findOne.mockResolvedValue(mockPlan);

        const result = await findOne({ params: mockParams });

        expect(softwares_subscriptions_plans.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: softwares_subscriptions,
                    attributes: undefined,
                    include: [
                        {
                            model: vendors,
                            attributes: ['vendorEmail', 'vendorName', 'optional1', 'apiUrl', 'optional2'],
                        },
                    ],
                },
            ],
            where: mockParams,
            attributes: undefined,
        });
        expect(result).toEqual({ success: true, message: 'Success', data: mockPlan });
    });
});
