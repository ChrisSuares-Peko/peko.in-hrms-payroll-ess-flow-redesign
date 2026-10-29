const { findOneByProviderId } = require('../../../use-cases/order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order', () => ({
    findOne: jest.fn(),
}));
jest.mock('@logtail/node', () => ({
    Logtail: jest.fn().mockImplementation(() => ({
      // Mock any methods of Logtail that are used
    })),
  }));

describe('findOneByProviderId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an order when a matching providerId is found', async () => {
        const mockParams = { providerId: 'PROVIDER123' };
        const mockOrder = {
            id: 1,
            providerId: 'PROVIDER123',
            amount: 5000,
            status: 'PAID',
        };

        order.findOne.mockResolvedValue(mockOrder);

        const result = await findOneByProviderId(mockParams);

        expect(order.findOne).toHaveBeenCalledWith({
            where: { providerId: mockParams.providerId },
        });

        expect(result).toEqual(mockOrder);
    });

    it('should return null when no matching order is found', async () => {
        const mockParams = { providerId: 'PROVIDER_NOT_FOUND' };

        order.findOne.mockResolvedValue(null);

        const result = await findOneByProviderId(mockParams);

        expect(order.findOne).toHaveBeenCalledWith({
            where: { providerId: mockParams.providerId },
        });

        expect(result).toBeNull();
    });

    it('should log an error when database operation fails', async () => {
        const mockParams = { providerId: 'PROVIDER_ERROR' };
        const mockError = new Error('Database error');

        order.findOne.mockRejectedValue(mockError);
        console.log = jest.fn();

        await expect(findOneByProviderId(mockParams)).resolves.toBeUndefined();

        expect(console.log).toHaveBeenCalledWith(mockError);
    });

    it('should log "ORDER FIND BY PROVIDER ID ONE ROUTE CALLED" in the finally block', async () => {
        const mockParams = { providerId: 'PROVIDER123' };

        order.findOne.mockResolvedValue({ id: 1 });

        console.log = jest.fn();

        await findOneByProviderId(mockParams);

        expect(console.log).toHaveBeenCalledWith('ORDER FIND BY PROVIDER ID ONE ROUTE CALLED');
    });
});
