const { createSubscription } = require('../../officeAddressSubscriptions');
const OfficeAddressSubscription = require('../../../entities/officeAddressSubscription');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createSubscription', () => {
    it('should create a new subscription when paymentRefId does not exist', async () => {
        OfficeAddressSubscription.findOne.mockResolvedValue(null);
        const mockResult = { id: 1, paymentRefId: 'PAY1' };
        OfficeAddressSubscription.create.mockResolvedValue(mockResult);

        const result = await createSubscription({ paymentRefId: 'PAY1' });
        expect(result).toEqual(mockResult);
        expect(OfficeAddressSubscription.create).toHaveBeenCalledWith({ paymentRefId: 'PAY1' });
    });

    it('should return false when subscription already exists', async () => {
        OfficeAddressSubscription.findOne.mockResolvedValue({ id: 1, paymentRefId: 'PAY1' });

        const result = await createSubscription({ paymentRefId: 'PAY1' });
        expect(result).toBe(false);
        expect(OfficeAddressSubscription.create).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
        OfficeAddressSubscription.findOne.mockRejectedValue(new Error('DB Error'));

        const result = await createSubscription({ paymentRefId: 'PAY1' });
        expect(result).toBeUndefined();
    });
});
