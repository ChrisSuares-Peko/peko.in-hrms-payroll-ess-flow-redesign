const { findOneByProviderId } = require('../../order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order');

describe('findOneByProviderId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find an order by providerId', async () => {
        const mockParams = { providerId: 'PROV001' };
        const mockResult = { id: 1, providerId: 'PROV001' };
        order.findOne.mockResolvedValue(mockResult);

        const result = await findOneByProviderId(mockParams);
        expect(order.findOne).toHaveBeenCalledWith({ where: { providerId: 'PROV001' } });
        expect(result).toEqual(mockResult);
    });

    it('should return undefined on error', async () => {
        order.findOne.mockRejectedValue(new Error('DB error'));

        const result = await findOneByProviderId({ providerId: 'PROV001' });
        expect(result).toBeUndefined();
    });
});
