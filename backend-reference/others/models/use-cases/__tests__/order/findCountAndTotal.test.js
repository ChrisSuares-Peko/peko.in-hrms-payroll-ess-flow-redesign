const { findCountAndTotal } = require('../../order');
const orders = require('../../../entities/order');

jest.mock('../../../entities/order');

describe('findCountAndTotal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find count and total for carbon footprint orders', async () => {
        const mockResult = { count: 5, rows: [{ id: 1 }] };
        orders.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findCountAndTotal('123');
        expect(orders.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('should return undefined on error', async () => {
        orders.findAndCountAll.mockRejectedValue(new Error('DB error'));

        const result = await findCountAndTotal('123');
        expect(result).toBeUndefined();
    });
});
