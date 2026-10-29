const { deleteSubscriptionCode } = require('../../subscriptionVoucher'); // Adjust the path as needed
const SubscriptionVoucher = require('../../../entities/subscriptionVoucher');

// Mocking the SubscriptionVoucher model
jest.mock('../../../entities/subscriptionVoucher', () => ({
    destroy: jest.fn()
}));

describe('deleteSubscriptionCode function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete the subscription code and return the number of rows deleted', async () => {
        const mockData = { id: 1 };
        const mockRowsDeleted = 1;

        SubscriptionVoucher.destroy.mockResolvedValue(mockRowsDeleted);

        const result = await deleteSubscriptionCode(mockData);

        expect(SubscriptionVoucher.destroy).toHaveBeenCalledWith({ where: { id: mockData.id } });
        expect(result).toBe(mockRowsDeleted);
    });

    it('should return 0 when trying to delete a non-existent subscription code', async () => {
        const mockData = { id: 999 };
        const mockRowsDeleted = 0;

        SubscriptionVoucher.destroy.mockResolvedValue(mockRowsDeleted);

        const result = await deleteSubscriptionCode(mockData);

        expect(SubscriptionVoucher.destroy).toHaveBeenCalledWith({ where: { id: mockData.id } });
        expect(result).toBe(mockRowsDeleted);
    });

    it('should handle errors during deletion', async () => {
        const mockData = { id: 1 };
        const expectedError = new Error('Database error');

        SubscriptionVoucher.destroy.mockRejectedValue(expectedError);

        let caughtError;
        try {
            await deleteSubscriptionCode(mockData);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toEqual({ error: expectedError });
        expect(SubscriptionVoucher.destroy).toHaveBeenCalledWith({ where: { id: mockData.id } });
    });

    it('should throw an error if no ID is provided', async () => {
        const mockData = {};
        
        const result = await deleteSubscriptionCode(mockData);

        expect(SubscriptionVoucher.destroy).not.toHaveBeenCalled();
        expect(result).toBeFalsy();
    });
});
