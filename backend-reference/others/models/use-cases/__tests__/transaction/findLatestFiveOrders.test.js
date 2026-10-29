const { findLatestFiveOrders } = require('../../transaction');
const orders = require('../../../entities/order');

jest.mock('../../../entities/order');

describe('findLatestFiveOrders', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return latest orders by service category', async () => {
        const mockResult = { count: 5, rows: [{ id: 1 }, { id: 2 }] };
        orders.findAndCountAll.mockResolvedValue(mockResult);

        const params = { length: 5, order: 'DESC', column: 'createdAt', serviceCategory: 'Office Supplies' };
        const result = await findLatestFiveOrders(params);
        expect(orders.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });
});
