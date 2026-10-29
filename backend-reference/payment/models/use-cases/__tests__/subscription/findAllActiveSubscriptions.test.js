const { findAllActiveSubscriptions } = require('../../subscription'); // Adjust the path as needed
const Subscription = require('../../../entities/subscription');

// Mock dependencies
jest.mock('../../../entities/subscription', () => ({
    findAll: jest.fn(),
}));

describe('findAllActiveSubscriptions', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Clear mock history before each test
    });

    it('should successfully retrieve all active subscriptions', async () => {
        const mockParams = { corporateUserId: '12345' };
        const mockSubscriptions = [
            { id: '1', corporateUserId: '12345', status: 'ACTIVE' },
            { id: '2', corporateUserId: '12345', status: 'ACTIVE' },
        ];

        // Mock implementation
        Subscription.findAll.mockResolvedValue(mockSubscriptions);

        const result = await findAllActiveSubscriptions(mockParams);

        expect(Subscription.findAll).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockParams.corporateUserId,
                status: 'ACTIVE'
            },
            raw: true,
            nest: true
        });
        expect(result).toEqual(mockSubscriptions);
    });

    it('should handle errors and return false', async () => {
        const mockParams = { corporateUserId: '12345' };
        const mockError = new Error('Database error');

        // Mock implementation
        Subscription.findAll.mockRejectedValue(mockError);

        const result = await findAllActiveSubscriptions(mockParams);

        expect(Subscription.findAll).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockParams.corporateUserId,
                status: 'ACTIVE'
            },
            raw: true,
            nest: true
        });
        expect(result).toBe(false);
    });
});
