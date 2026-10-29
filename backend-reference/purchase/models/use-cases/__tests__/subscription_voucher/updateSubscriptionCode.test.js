const { updateSubscriptionCode } = require('../../subscriptionVoucher'); // Adjust the path
const SubscriptionVoucher = require('../../../entities/subscriptionVoucher');

// Mocking the models
jest.mock('../../../entities/subscriptionVoucher', () => ({
    update: jest.fn(),
}));

describe('updateSubscriptionCode function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully update subscription code when valid data is provided', async () => {
        const data = { billingType: 'MONTHLY', packageId: 3 };
        const whereClause = { id: 2 };

        // Mock the update function to return 1 affected row
        SubscriptionVoucher.update.mockResolvedValue([1]);

        const result = await updateSubscriptionCode(data, whereClause);

        expect(SubscriptionVoucher.update).toHaveBeenCalledWith(data, { where: whereClause });
        expect(result).toBe(true);
    });

    it('should return false when no rows are updated', async () => {
        const data = { billingType: 'MONTHLY', packageId: 3 };
        const whereClause = { id: 9999 };

        // Mock the update function to return 0 affected rows
        SubscriptionVoucher.update.mockResolvedValue([0]);

        const result = await updateSubscriptionCode(data, whereClause);

        expect(SubscriptionVoucher.update).toHaveBeenCalledWith(data, { where: whereClause });
        expect(result).toBeFalsy();
    });

    it('should handle errors during the update process', async () => {
        const data = { billingType: 'MONTHLY', packageId: 3 };
        const whereClause = { id: 2 };
        const expectedError = new Error('Database error');

        // Mock the update function to throw an error
        SubscriptionVoucher.update.mockRejectedValue(expectedError);

        let caughtError;
        try {
            await updateSubscriptionCode(data, whereClause);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toEqual({ error: expectedError });
        expect(SubscriptionVoucher.update).toHaveBeenCalledWith(data, { where: whereClause });
    });

    it('should throw an error if data is not provided', async () => {
        const mockData = null
        
        const result = await updateSubscriptionCode(mockData);

        expect(SubscriptionVoucher.update).not.toHaveBeenCalled();
        expect(result).toBeFalsy();
    });
});
