const { getTotalSubscriptionsSpent } = require("../../cloud_dashboard");
const cloud_subscriptions = require("../../../../entities/pekoCloud/cloud_subscriptions");

jest.mock('../../../../entities/pekoCloud/cloud_subscriptions.js', () => ({
    findAll: jest.fn(),
}));

describe('getTotalSubscriptionsSpent Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the total amount spent on subscriptions for a given credentialId', async () => {
        const credentialId = 1;
        const subscriptions = [
            {
                dataValues: {
                    amount: 100,
                    currency: 'USD',
                    assignTo: [1, 2], // AssignTo array with two elements
                },
            },
            {
                dataValues: {
                    amount: 200,
                    currency: 'AED',
                    assignTo: [1], // AssignTo array with one element
                },
            },
            {
                dataValues: {
                    amount: 300,
                    currency: 'USD',
                    assignTo: [1, 2, 3], // AssignTo array with three elements
                },
            },
        ];

        // Calculate expected total
        const usdToAed = Number(process.env.USD_TO_INR ?? '1');
        const expectedTotalSpent =
            (100 * usdToAed * 2) + // First subscription
            (200 * 1) + // Second subscription (AED currency, no conversion)
            (300 * usdToAed * 3); // Third subscription
    
        cloud_subscriptions.findAll.mockResolvedValue(subscriptions);
    
        const result = await getTotalSubscriptionsSpent(credentialId);
    
        expect(cloud_subscriptions.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toBe(expectedTotalSpent);
    });
    
    it('should handle subscriptions with zero amount correctly', async () => {
        const credentialId = 3;
        const subscriptions = [
            {
                dataValues: {
                    amount: 0,
                    currency: 'USD',
                    assignTo: [1], // AssignTo with one element
                },
            },
            {
                dataValues: {
                    amount: 0,
                    currency: 'AED',
                    assignTo: [1, 2], // AssignTo with two elements
                },
            },
        ];
    
        const expectedTotalSpent = 0;
    
        cloud_subscriptions.findAll.mockResolvedValue(subscriptions);
    
        const result = await getTotalSubscriptionsSpent(credentialId);
    
        expect(cloud_subscriptions.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toBe(expectedTotalSpent);
    });
    

    it('should handle subscriptions with zero amount', async () => {
        const credentialId = 3;
        const subscriptions = [
            {
                dataValues: {
                    amount: 0, // Zero amount
                    currency: 'USD',
                    assignTo: [1, 2], // AssignTo array with elements
                },
            },
            {
                dataValues: {
                    amount: 0, // Zero amount
                    currency: 'AED',
                    assignTo: [1], // AssignTo array with one element
                },
            },
        ];
    
        const expectedTotalSpent = 0; // Since amounts are zero
    
        cloud_subscriptions.findAll.mockResolvedValue(subscriptions);
    
        const result = await getTotalSubscriptionsSpent(credentialId);
    
        // Ensure the query was called correctly
        expect(cloud_subscriptions.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
    
        // Verify the totalSpent calculation
        expect(result).toBe(expectedTotalSpent);
    });
    

    it('should handle errors when fetching subscriptions', async () => {
        const credentialId = 5;
        const error = new Error('Database error');

        cloud_subscriptions.findAll.mockRejectedValue(error);

        const result = await getTotalSubscriptionsSpent(credentialId);

        expect(cloud_subscriptions.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toBe(error);
    });

    it('should handle unexpected errors gracefully', async () => {
        const credentialId = 6;

        cloud_subscriptions.findAll.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await getTotalSubscriptionsSpent(credentialId);

        expect(cloud_subscriptions.findAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toEqual(new Error('Unexpected error'));
    });
});
