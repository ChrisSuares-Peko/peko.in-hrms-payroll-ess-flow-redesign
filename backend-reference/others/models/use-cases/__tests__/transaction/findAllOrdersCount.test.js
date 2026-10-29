const { findAllOrdersCount } = require('../../transaction');
const orders = require('../../../entities/order');

jest.mock('../../../entities/order');

describe('findAllOrdersCount', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return orders count for Office Supplies category', async () => {
        const mockResult = { count: 5, rows: [{ id: 1 }] };
        orders.findAndCountAll.mockResolvedValue(mockResult);

        const params = {
            start: 0, from: '2023-10-01', to: '2023-10-31', length: 10,
            searchText: '', order: 'DESC', column: 0
        };

        const result = await findAllOrdersCount(params);
        expect(orders.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('should filter by statusAlt when provided', async () => {
        const mockResult = { count: 3, rows: [{ id: 1 }] };
        orders.findAndCountAll.mockResolvedValue(mockResult);

        const params = {
            start: 0, from: '2023-10-01', to: '2023-10-31', length: 10,
            searchText: '', order: 'DESC', column: 0
        };

        const result = await findAllOrdersCount(params, 'CONFIRMED');
        expect(result).toEqual(mockResult);
    });
});
