const { findOneOrderByProviderId } = require('../../../use-cases/order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order', () => ({
    findOne: jest.fn(),
}));
jest.mock('@logtail/node', () => ({
    Logtail: jest.fn().mockImplementation(() => ({
      // Mock any methods of Logtail that are used
    })),
  }));

describe('findOneOrderByProviderId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an order when a matching credentialId and providerId are found', async () => {
        const mockParams = { credentialId: 123, providerId: 'PROVIDER456' };
        const mockOrder = {
            id: 1,
            credentialId: 123,
            providerId: 'PROVIDER456',
            amount: 5000,
            status: 'PAID',
        };

        order.findOne.mockResolvedValue(mockOrder);

        const result = await findOneOrderByProviderId(mockParams);

        expect(order.findOne).toHaveBeenCalledWith({
            where: { providerId: mockParams.providerId, credentialId: mockParams.credentialId },
        });

        expect(result).toEqual(mockOrder);
    });

    it('should return null when no matching order is found', async () => {
        const mockParams = { credentialId: 123, providerId: 'PROVIDER_NOT_FOUND' };

        order.findOne.mockResolvedValue(null);

        const result = await findOneOrderByProviderId(mockParams);

        expect(order.findOne).toHaveBeenCalledWith({
            where: { providerId: mockParams.providerId, credentialId: mockParams.credentialId },
        });

        expect(result).toBeNull();
    });

    it('should log an error when database operation fails', async () => {
        const mockParams = { credentialId: 123, providerId: 'PROVIDER456' };
        const mockError = new Error('Database error');

        order.findOne.mockRejectedValue(mockError);
        console.log = jest.fn();

        await expect(findOneOrderByProviderId(mockParams)).resolves.toBeUndefined();

        expect(console.log).toHaveBeenCalledWith(mockError);
    });

    it('should log "ORDER FIND ONE ROUTE CALLED" in the finally block', async () => {
        const mockParams = { credentialId: 123, providerId: 'PROVIDER456' };

        order.findOne.mockResolvedValue({ id: 1 });

        console.log = jest.fn();

        await findOneOrderByProviderId(mockParams);

        expect(console.log).toHaveBeenCalledWith('ORDER FIND ONE ROUTE CALLED');
    });
});
