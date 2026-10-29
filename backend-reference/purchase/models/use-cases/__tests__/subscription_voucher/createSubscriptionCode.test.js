const { createSubscriptionCode } = require('../../subscriptionVoucher');
const SubscriptionVoucher = require('../../../entities/subscriptionVoucher');

// Mocking the models
jest.mock('../../../entities/subscriptionVoucher', () => ({
    bulkCreate: jest.fn(),
}));

describe('createSubscriptionCode function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const validData = [
        { activationCode: 'ABC123', billingType: 'MONTHLY', packageId: 1 },
        { activationCode: 'DEF456', billingType: 'ANNUAL', packageId: 2 }
    ];

    const mockCreatedResult = [
        { activationCode: 'ABC123', billingType: 'MONTHLY', packageId: 1 },
        { activationCode: 'DEF456', billingType: 'ANNUAL', packageId: 2 }
    ];

    it('should create subscription codes successfully with valid data', async () => {
        SubscriptionVoucher.bulkCreate.mockResolvedValue(mockCreatedResult);

        const result = await createSubscriptionCode(validData);

        expect(SubscriptionVoucher.bulkCreate).toHaveBeenCalledWith(validData);
        expect(result).toEqual(mockCreatedResult);
    });

    it('should handle errors when necessary data is missing', async () => {
        const invalidData = [
            { billingType: 'MONTHLY' }, // Missing activationCode and packageId
        ];

        // Mock to throw an error
        const expectedError = new Error('Validation Error');
        SubscriptionVoucher.bulkCreate.mockRejectedValue(expectedError);

        await expect(createSubscriptionCode(invalidData)).rejects.toEqual({ error:expectedError});
    });

    it('should handle database errors during creation', async () => {
        const databaseError = new Error('Database Error');

        // Mock to throw a database error
        SubscriptionVoucher.bulkCreate.mockRejectedValue(databaseError);

        await expect(createSubscriptionCode(validData)).rejects.toEqual({ error: databaseError });

        expect(SubscriptionVoucher.bulkCreate).toHaveBeenCalledWith(validData);
    });

    it('should handle empty data array', async () => {
        const emptyData = [];

        const result = await createSubscriptionCode(emptyData);

        expect(SubscriptionVoucher.bulkCreate).not.toHaveBeenCalled();
        expect(result).toBeFalsy();
    });

    it('should handle null data', async () => {
        const nullData = null;
        
        const result = await createSubscriptionCode(nullData);

        expect(SubscriptionVoucher.bulkCreate).not.toHaveBeenCalled();
        expect(result).toBeFalsy();
    });
});
